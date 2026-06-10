/**
 * Hermetic component tests — DebugTriggerEncounter.
 *
 * Pins:
 *   - DEV gate (true / simulated-false)
 *   - One button per encounter kind mounts
 *   - COMBAT seeds a combat-prelude encounter event with the
 *     lowest-level standard foe on the current map (level 1 on
 *     fishing-village) and navigates to the WILDS tab
 *   - BOSS seeds an isBoss encounter with a boss-tier foe
 *   - HAZARD launches the hazard minigame session
 *   - REST / GATHER / TREASURE / QUEST seed their narrative events
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { DebugTriggerEncounter } from '@/components/DebugTriggerEncounter';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { selectHasActiveEvent } from '@/state/presenters/event.engine';
import { selectHasActiveHazard } from '@/state/presenters/hazard.engine';
import { createAppStore, type AppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: mockPush,
        replace: jest.fn(),
        back: jest.fn(),
        canGoBack: () => false,
    }),
}));

afterEach(() => {
    mockPush.mockClear();
    jest.restoreAllMocks();
});

function makeStore(): AppStore {
    return createAppStore({ adapter: createMemoryAdapter() });
}

function withProvider(store: AppStore, child: React.ReactNode) {
    return <GameStoreProvider store={store}>{child}</GameStoreProvider>;
}

describe('DebugTriggerEncounter: DEV gate', () => {
    it('renders a button for every encounter kind when __DEV__ is true', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugTriggerEncounter />));
        for (const kind of ['encounter', 'boss', 'hazard', 'rest', 'gather', 'treasure', 'quest']) {
            expect(tree.queryByTestId(`debug-trigger-encounter-${kind}`)).not.toBeNull();
        }
    });

    it('renders null when __DEV__ is false (production build simulation)', () => {

        const g = global as any;
        const original = g.__DEV__;
        g.__DEV__ = false;
        try {
            const store = makeStore();
            const tree = render(withProvider(store, <DebugTriggerEncounter />));
            expect(tree.queryByTestId('debug-trigger-encounter-encounter')).toBeNull();
        } finally {
            g.__DEV__ = original;
        }
    });
});

describe('DebugTriggerEncounter: combat triggers', () => {
    it('COMBAT seeds a non-boss encounter with the lowest-level foe and navigates to WILDS', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugTriggerEncounter />));
        fireEvent.press(tree.getByTestId('debug-trigger-encounter-encounter'));

        expect(mockPush).toHaveBeenCalledWith('/(tabs)/exploration');
        const slice = store.getState().event;
        expect(slice.pending).not.toBeNull();
        const event = slice.pending!.event as { kind: string; isBoss: boolean; encounter: { enemies: { level: number }[] } };
        expect(event.kind).toBe('encounter');
        expect(event.isBoss).toBe(false);
        // Fishing-village's gentlest foes are level 1.
        expect(event.encounter.enemies[0].level).toBe(1);
        expect(selectHasActiveEvent(store.getState())).toBe(true);
    });

    it('BOSS seeds an isBoss encounter with a boss-tier foe', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugTriggerEncounter />));
        fireEvent.press(tree.getByTestId('debug-trigger-encounter-boss'));

        const event = store.getState().event.pending!.event as {
            kind: string;
            isBoss: boolean;
            encounter: { enemies: { difficulty: string }[] };
        };
        expect(event.kind).toBe('encounter');
        expect(event.isBoss).toBe(true);
        expect(event.encounter.enemies[0].difficulty).toBe('boss');
    });
});

describe('DebugTriggerEncounter: non-combat triggers', () => {
    it('HAZARD launches the hazard minigame session', () => {
        const store = makeStore();
        expect(selectHasActiveHazard(store.getState())).toBe(false);

        const tree = render(withProvider(store, <DebugTriggerEncounter />));
        fireEvent.press(tree.getByTestId('debug-trigger-encounter-hazard'));

        expect(mockPush).toHaveBeenCalledWith('/(tabs)/exploration');
        expect(selectHasActiveHazard(store.getState())).toBe(true);
    });

    it.each([
        ['rest', 'rest'],
        ['gather', 'gathering'],
        ['treasure', 'loot-cache'],
        ['quest', 'interaction'],
    ])('%s seeds a %s narrative event', (button, eventKind) => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugTriggerEncounter />));
        fireEvent.press(tree.getByTestId(`debug-trigger-encounter-${button}`));

        expect(mockPush).toHaveBeenCalledWith('/(tabs)/exploration');
        expect(store.getState().event.pending!.event.kind).toBe(eventKind);
        expect(selectHasActiveEvent(store.getState())).toBe(true);
    });
});
