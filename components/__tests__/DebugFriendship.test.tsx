/**
 * Hermetic component tests — DebugFriendship (Phase 62c).
 *
 * Pins:
 *   - DEV gate (true / simulated-false)
 *   - +1 increments combat.friendshipCounter by 1 (combat active)
 *   - RESET sets the counter to 0 (combat active)
 *   - Both no-op + warn when no combat is active
 */

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { createEnemy } from 'axiomancer-mechanics';

import { DebugFriendship } from '@/components/DebugFriendship';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { createAppStore, type AppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

let warnSpy: ReturnType<typeof jest.spyOn>;

beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
    warnSpy.mockRestore();
    jest.restoreAllMocks();
});

function makeStore(): AppStore {
    return createAppStore({ adapter: createMemoryAdapter() });
}

function withProvider(store: AppStore, child: React.ReactNode) {
    return <GameStoreProvider store={store}>{child}</GameStoreProvider>;
}

function makeTestEnemy() {
    return createEnemy({
        id: 'test-foe',
        name: 'Test Foe',
        description: 'A test enemy',
        level: 1,
        baseStats: { heart: 1, body: 1, mind: 1 },
        mapName: 'fishing-village',
        logic: 'random',
    });
}

describe('DebugFriendship: DEV gate', () => {
    it('renders both buttons when __DEV__ is true (jest default)', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugFriendship />));
        expect(tree.queryByTestId('debug-friendship-increment')).not.toBeNull();
        expect(tree.queryByTestId('debug-friendship-reset')).not.toBeNull();
    });

    it('renders null when __DEV__ is false (production build simulation)', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const g = global as any;
        const original = g.__DEV__;
        g.__DEV__ = false;
        try {
            const store = makeStore();
            const tree = render(withProvider(store, <DebugFriendship />));
            expect(tree.queryByTestId('debug-friendship-increment')).toBeNull();
        } finally {
            g.__DEV__ = original;
        }
    });
});

describe('DebugFriendship: combat-active path', () => {
    it('+1 increments combat.friendshipCounter', () => {
        const store = makeStore();
        store.getState().startCombat(makeTestEnemy());
        const before = store.getState().combat?.friendshipCounter ?? 0;

        const tree = render(withProvider(store, <DebugFriendship />));
        fireEvent.press(tree.getByTestId('debug-friendship-increment'));

        expect(store.getState().combat?.friendshipCounter).toBe(before + 1);
    });

    it('stacks on multiple +1 presses', () => {
        const store = makeStore();
        store.getState().startCombat(makeTestEnemy());
        const before = store.getState().combat?.friendshipCounter ?? 0;

        const tree = render(withProvider(store, <DebugFriendship />));
        const plus = tree.getByTestId('debug-friendship-increment');
        fireEvent.press(plus);
        fireEvent.press(plus);
        fireEvent.press(plus);

        expect(store.getState().combat?.friendshipCounter).toBe(before + 3);
    });

    it('RESET sets the counter back to 0 from any value', () => {
        const store = makeStore();
        store.getState().startCombat(makeTestEnemy());
        const tree = render(withProvider(store, <DebugFriendship />));

        fireEvent.press(tree.getByTestId('debug-friendship-increment'));
        fireEvent.press(tree.getByTestId('debug-friendship-increment'));
        expect(store.getState().combat?.friendshipCounter).toBeGreaterThan(0);

        fireEvent.press(tree.getByTestId('debug-friendship-reset'));
        expect(store.getState().combat?.friendshipCounter).toBe(0);
    });
});

describe('DebugFriendship: no-combat path', () => {
    it('+1 no-ops + warns when no combat is active', () => {
        const store = makeStore();
        expect(store.getState().combat).toBeNull();

        const tree = render(withProvider(store, <DebugFriendship />));
        fireEvent.press(tree.getByTestId('debug-friendship-increment'));

        expect(store.getState().combat).toBeNull();
        expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it('RESET no-ops + warns when no combat is active', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugFriendship />));

        fireEvent.press(tree.getByTestId('debug-friendship-reset'));

        expect(store.getState().combat).toBeNull();
        expect(warnSpy).toHaveBeenCalledTimes(1);
    });
});

describe('DebugFriendship: accessibility', () => {
    it('exposes accessibilityRole=button and descriptive labels', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugFriendship />));

        const plus = tree.getByTestId('debug-friendship-increment');
        expect(plus.props.accessibilityRole).toBe('button');
        expect(plus.props.accessibilityLabel).toMatch(/increment/i);

        const reset = tree.getByTestId('debug-friendship-reset');
        expect(reset.props.accessibilityLabel).toMatch(/reset/i);
    });
});
