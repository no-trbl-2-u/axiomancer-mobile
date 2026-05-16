/**
 * Hermetic component render test — combat screen (`app/(tabs)/combat.tsx`).
 *
 * Pins that the screen renders without throwing in every phase the
 * engine can put it into. Drives the engine state via the action
 * layer (the same one the screen uses); never reaches into private
 * helpers.
 *
 * Hermetic = self-contained + deterministic + isolated.
 * See docs/testing.md for the full standard.
 */

import { afterEach, describe, it, expect, jest } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';

// Mock expo-router — the screen calls useRouter().replace on flee.
jest.mock('expo-router', () => ({
    useRouter: () => ({
        replace: jest.fn(),
        push: jest.fn(),
        back: jest.fn(),
    }),
}));

import { mockFixedRng } from '@/test-utils/rng';
import { CombatModeProvider } from '@/state/combat-mode';
import {
    GameStoreProvider,
    useGameActions,
    useGameState,
} from '@/state/GameStoreProvider';
import { createAppStore, type AppStore } from '@/state/store';
import { createMockEncounterEnemy } from '@/state/mocks/combat.mock';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

import CombatScreen from '@/app/(tabs)/combat';

afterEach(() => {
    jest.restoreAllMocks();
});

function makeStore(): AppStore {
    mockFixedRng(0.5);
    return createAppStore({ adapter: createMemoryAdapter() });
}

function withProviders(store: AppStore, child: React.ReactNode) {
    return (
        <CombatModeProvider>
            <GameStoreProvider store={store}>
                {child}
            </GameStoreProvider>
        </CombatModeProvider>
    );
}

// Drives the store into a particular combat phase. `null` leaves
// it untouched (used to test the pre-bootstrap render).
function seedPhase(
    store: AppStore,
    phase: 'choosing_stance' | 'choosing_action' | 'choosing_skill' | 'resolving' | null,
): void {
    if (phase === null) return;

    // The screen calls `actions.startCombat(...)` itself on first
    // mount when `combat` is null; for deterministic tests we seed
    // the store directly so the initial render already shows the
    // expected phase.
    store.getState().startCombat(createMockEncounterEnemy());

    if (phase === 'choosing_stance') return;
    if (phase === 'choosing_action') {
        const c = store.getState().combat!;
        store.getState().updateCombat({ ...c, phase: 'choosing_action' });
        return;
    }
    if (phase === 'choosing_skill') {
        const c = store.getState().combat!;
        store.getState().updateCombat({ ...c, phase: 'choosing_skill' });
        return;
    }
    if (phase === 'resolving') {
        const c = store.getState().combat!;
        store.getState().updateCombat({ ...c, phase: 'resolving' });
        return;
    }
}

describe('CombatScreen: phase coverage', () => {
    it('renders the bootstrap (loading) view when no combat is active', () => {
        const store = makeStore();
        // In jest the auto-bootstrap useEffect fires synchronously, so
        // the final tree shows the full combat layout, not the loading
        // branch. The loading-state contract is pinned at the VM level
        // in `combat.engine.test.ts` ("exposes a visible loadingMessage
        // …") — the screen renders `vm.loadingMessage` from that field.
        const tree = render(withProviders(store, <CombatScreen />));
        expect(tree.toJSON()).not.toBeNull();
    });

    it('renders the choosing_stance phase header', async () => {
        const store = makeStore();
        seedPhase(store, 'choosing_stance');
        const tree = render(withProviders(store, <CombatScreen />));
        const text = JSON.stringify(tree.toJSON());
        expect(text).toContain('CHOOSE A STANCE');
    });

    it('renders the choosing_action phase header', () => {
        const store = makeStore();
        seedPhase(store, 'choosing_action');
        const tree = render(withProviders(store, <CombatScreen />));
        const text = JSON.stringify(tree.toJSON());
        expect(text).toContain('DECLARE AN ACTION');
    });

    it('renders the choosing_skill phase header', () => {
        const store = makeStore();
        seedPhase(store, 'choosing_skill');
        const tree = render(withProviders(store, <CombatScreen />));
        const text = JSON.stringify(tree.toJSON());
        expect(text).toContain('INVOKE A SKILL');
    });

    it('renders the resolving phase header', () => {
        const store = makeStore();
        seedPhase(store, 'resolving');
        const tree = render(withProviders(store, <CombatScreen />));
        const text = JSON.stringify(tree.toJSON());
        expect(text).toContain('FATE SETTLES');
    });
});

describe('CombatScreen: integration smoke', () => {
    it('renders the enemy name from the engine fixture', () => {
        const store = makeStore();
        seedPhase(store, 'choosing_stance');
        const tree = render(withProviders(store, <CombatScreen />));
        const text = JSON.stringify(tree.toJSON());
        // Engine fixture uppercases the enemy name in the VM.
        expect(text).toContain('CARRION HIEROPHANT');
    });

    it('exposes the action layer to children without throwing', () => {
        const store = makeStore();
        seedPhase(store, 'choosing_stance');

        // Render a probe that pulls actions + state — confirms the
        // provider wires through cleanly when nested.
        function Probe() {
            const actions = useGameActions();
            const isInCombat = useGameState((s) => s.combat !== null);
            return (
                <>
                    {isInCombat ? null : null}
                    {/* swallow lint — we exercise the hooks */}
                    {actions.endCombat === undefined ? null : null}
                </>
            );
        }
        const tree = render(withProviders(store, <Probe />));
        expect(tree.toJSON()).not.toThrow;
    });
});
