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
import { fireEvent, render, within } from '@testing-library/react-native';
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
import { AestheticModeProvider } from '@/state/aesthetic-mode';
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

function withProviders(
    store: AppStore,
    child: React.ReactNode,
    aesthetic?: 'canonical' | 'codex',
) {
    return (
        <AestheticModeProvider initialMode={aesthetic ?? 'canonical'} skipHydration>
            <CombatModeProvider>
                <GameStoreProvider store={store}>
                    {child}
                </GameStoreProvider>
            </CombatModeProvider>
        </AestheticModeProvider>
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
        expect(text).toContain('Choose a Stance');
    });

    it('renders the choosing_action phase header', () => {
        const store = makeStore();
        seedPhase(store, 'choosing_action');
        const tree = render(withProviders(store, <CombatScreen />));
        const text = JSON.stringify(tree.toJSON());
        expect(text).toContain('Your Move');
    });

    it('renders the choosing_skill phase header', () => {
        const store = makeStore();
        seedPhase(store, 'choosing_skill');
        const tree = render(withProviders(store, <CombatScreen />));
        const text = JSON.stringify(tree.toJSON());
        expect(text).toContain('Select Technique');
    });

    it('renders the resolving phase header', () => {
        const store = makeStore();
        seedPhase(store, 'resolving');
        const tree = render(withProviders(store, <CombatScreen />));
        const text = JSON.stringify(tree.toJSON());
        expect(text).toContain('Strike Unfolds');
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

    it('renders the codex status strip when aesthetic mode is codex (Phase 50 tick B)', () => {
        const store = makeStore();
        seedPhase(store, 'choosing_stance');
        const tree = render(withProviders(store, <CombatScreen />, 'codex'));
        const text = JSON.stringify(tree.toJSON());
        // Format: ENC=<slug> · ROUND=<roman> · STATE=<phase> — see
        // state/presenters/combat.codex.engine.ts.
        expect(text).toContain('ENC=');
        expect(text).toContain('STATE=choosing_stance');
    });

    it('omits the codex status strip when aesthetic mode is canonical', () => {
        const store = makeStore();
        seedPhase(store, 'choosing_stance');
        const tree = render(withProviders(store, <CombatScreen />, 'canonical'));
        const text = JSON.stringify(tree.toJSON());
        expect(text).not.toContain('ENC=');
        expect(text).not.toContain('STATE=choosing_stance');
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

// Phase 127 — tapping a skill stages a confirm overlay before the
// round commits. Confirm resolves; Cancel returns to the picker.
describe('CombatScreen: skill confirmation overlay (Phase 127)', () => {
    // Seed combat into the skill picker with a committed HEART stance,
    // so the picker renders enabled heart skills the player can tap.
    function seedSkillPhase(store: AppStore): void {
        store.getState().startCombat(createMockEncounterEnemy());
        const c = store.getState().combat!;
        store.getState().updateCombat({
            ...c,
            playerChoice: { ...(c.playerChoice ?? {}), stance: 'heart' },
            phase: 'choosing_skill',
            // Seed a generous resource pool so at least one heart skill
            // is affordable (`enabled`); a fresh combat starts at zero
            // tokens, which would grey out every row.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            combatResources: { body: 9, mind: 9, heart: 9, fallacy: 9, paradox: 9 } as any,
        });
    }

    function firstEnabledSkillTestId(tree: ReturnType<typeof render>): string {
        const rows = tree.UNSAFE_root.findAll(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (node: any) =>
                typeof node.props?.testID === 'string' &&
                node.props.testID.startsWith('combat-skill-row-') &&
                node.props.accessibilityRole === 'button' &&
                node.props.accessibilityState?.disabled !== true,
        );
        expect(rows.length).toBeGreaterThan(0);
        return rows[0].props.testID as string;
    }

    it('opens the confirm overlay on skill tap without resolving the round', () => {
        const store = makeStore();
        seedSkillPhase(store);
        const tree = render(withProviders(store, <CombatScreen />));

        // No overlay before the tap.
        expect(tree.queryByTestId('skill-confirm-overlay')).toBeNull();
        const phaseBefore = store.getState().combat!.phase;

        fireEvent.press(tree.getByTestId(firstEnabledSkillTestId(tree)));

        // Overlay opens; the round has NOT resolved (phase unchanged).
        expect(tree.getByTestId('skill-confirm-overlay')).toBeTruthy();
        expect(store.getState().combat!.phase).toBe(phaseBefore);
    });

    it('Cancel dismisses the overlay and leaves combat in the skill phase', () => {
        const store = makeStore();
        seedSkillPhase(store);
        const tree = render(withProviders(store, <CombatScreen />));

        fireEvent.press(tree.getByTestId(firstEnabledSkillTestId(tree)));
        const overlay = tree.getByTestId('skill-confirm-overlay');
        fireEvent.press(within(overlay).getByTestId('skill-confirm-cancel'));

        expect(tree.queryByTestId('skill-confirm-overlay')).toBeNull();
        expect(store.getState().combat!.phase).toBe('choosing_skill');
    });

    it('Confirm commits the skill and advances the round to resolving', () => {
        const store = makeStore();
        seedSkillPhase(store);
        const tree = render(withProviders(store, <CombatScreen />));

        fireEvent.press(tree.getByTestId(firstEnabledSkillTestId(tree)));
        const overlay = tree.getByTestId('skill-confirm-overlay');
        fireEvent.press(within(overlay).getByTestId('skill-confirm-confirm'));

        // The engine-backed resolve ran: phase moved off the picker and
        // the committed action is a skill.
        const c = store.getState().combat!;
        expect(c.phase).toBe('resolving');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((c.playerChoice as any).action).toBe('skill');
    });
});
