/**
 * Hermetic component tests — DebugManaControl (Phase 61c).
 *
 * Pins:
 *   - DEV gate (true / simulated-false)
 *   - DRAIN sets combatMana.current to 0
 *   - FULL sets combatMana.current to .max
 *   - Both seed the slice from null (no active combat)
 *   - Existing max is preserved through both presses
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { DebugManaControl } from '@/components/DebugManaControl';
import { PLAYER_MANA_DEFAULT_MAX } from '@/state/actions';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { createAppStore, type AppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

afterEach(() => {
    jest.restoreAllMocks();
});

function makeStore(): AppStore {
    return createAppStore({ adapter: createMemoryAdapter() });
}

function withProvider(store: AppStore, child: React.ReactNode) {
    return <GameStoreProvider store={store}>{child}</GameStoreProvider>;
}

describe('DebugManaControl: DEV gate', () => {
    it('renders both buttons when __DEV__ is true (jest default)', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugManaControl />));
        expect(tree.queryByTestId('debug-mana-drain-button')).not.toBeNull();
        expect(tree.queryByTestId('debug-mana-full-button')).not.toBeNull();
    });

    it('renders null when __DEV__ is false (production build simulation)', () => {
         
        const g = global as any;
        const original = g.__DEV__;
        g.__DEV__ = false;
        try {
            const store = makeStore();
            const tree = render(withProvider(store, <DebugManaControl />));
            expect(tree.queryByTestId('debug-mana-drain-button')).toBeNull();
            expect(tree.queryByTestId('debug-mana-full-button')).toBeNull();
        } finally {
            g.__DEV__ = original;
        }
    });
});

describe('DebugManaControl: drain', () => {
    it('seeds combatMana with current=0 when slice was null', () => {
        const store = makeStore();
        expect(store.getState().combatMana).toBeNull();

        const tree = render(withProvider(store, <DebugManaControl />));
        fireEvent.press(tree.getByTestId('debug-mana-drain-button'));

        const mana = store.getState().combatMana;
        expect(mana).not.toBeNull();
        expect(mana!.current).toBe(0);
        expect(mana!.max).toBe(PLAYER_MANA_DEFAULT_MAX);
    });

    it('zeroes current and preserves max when slice exists', () => {
        const store = makeStore();
         
        store.setState({ combatMana: { current: 5, max: 20 } } as any);

        const tree = render(withProvider(store, <DebugManaControl />));
        fireEvent.press(tree.getByTestId('debug-mana-drain-button'));

        const mana = store.getState().combatMana!;
        expect(mana.current).toBe(0);
        expect(mana.max).toBe(20);
    });
});

describe('DebugManaControl: full', () => {
    it('seeds combatMana with current=max when slice was null', () => {
        const store = makeStore();
        expect(store.getState().combatMana).toBeNull();

        const tree = render(withProvider(store, <DebugManaControl />));
        fireEvent.press(tree.getByTestId('debug-mana-full-button'));

        const mana = store.getState().combatMana!;
        expect(mana.current).toBe(PLAYER_MANA_DEFAULT_MAX);
        expect(mana.max).toBe(PLAYER_MANA_DEFAULT_MAX);
    });

    it('restores current to existing max without raising max', () => {
        const store = makeStore();
         
        store.setState({ combatMana: { current: 2, max: 20 } } as any);

        const tree = render(withProvider(store, <DebugManaControl />));
        fireEvent.press(tree.getByTestId('debug-mana-full-button'));

        const mana = store.getState().combatMana!;
        expect(mana.current).toBe(20);
        expect(mana.max).toBe(20);
    });
});

describe('DebugManaControl: accessibility', () => {
    it('exposes accessibilityRole=button and descriptive labels', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugManaControl />));

        const drain = tree.getByTestId('debug-mana-drain-button');
        expect(drain.props.accessibilityRole).toBe('button');
        expect(drain.props.accessibilityLabel).toMatch(/drain/i);

        const full = tree.getByTestId('debug-mana-full-button');
        expect(full.props.accessibilityRole).toBe('button');
        expect(full.props.accessibilityLabel).toMatch(/fill|maximum/i);
    });
});
