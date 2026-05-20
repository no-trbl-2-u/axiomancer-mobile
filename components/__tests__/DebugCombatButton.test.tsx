/**
 * Hermetic component tests — DebugCombatButton (CRITIQUE jot
 * 39695a5: manual combat trigger).
 *
 * Pins the DEV gate + the action-routing contract: tapping
 * fires startCombat(mockEnemy), flips the combat-mode signal,
 * pushes the router to the combat tab.
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { DebugCombatButton } from '@/components/DebugCombatButton';
import { CombatModeProvider } from '@/state/combat-mode';
import { GameStoreProvider } from '@/state/GameStoreProvider';
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

function withProviders(store: AppStore, child: React.ReactNode) {
    return (
        <CombatModeProvider>
            <GameStoreProvider store={store}>{child}</GameStoreProvider>
        </CombatModeProvider>
    );
}

describe('DebugCombatButton: DEV gate', () => {
    it('renders the button when __DEV__ is true (jest default)', () => {
        const store = makeStore();
        const tree = render(withProviders(store, <DebugCombatButton />));
        expect(tree.queryByTestId('debug-combat-button')).not.toBeNull();
    });

    it('renders null when __DEV__ is false (production build simulation)', () => {
         
        const g = global as any;
        const original = g.__DEV__;
        g.__DEV__ = false;
        try {
            const store = makeStore();
            const tree = render(withProviders(store, <DebugCombatButton />));
            expect(tree.queryByTestId('debug-combat-button')).toBeNull();
        } finally {
            g.__DEV__ = original;
        }
    });
});

describe('DebugCombatButton: press routing', () => {
    it('a tap calls startCombat — engine state has an active combat slice afterwards', () => {
        const store = makeStore();
        expect(store.getState().combat).toBeNull();

        const tree = render(withProviders(store, <DebugCombatButton />));
        fireEvent.press(tree.getByTestId('debug-combat-button'));

        // After startCombat fires, the engine populates the combat slice.
        expect(store.getState().combat).not.toBeNull();
    });

    it('a tap pushes the router to the combat tab', () => {
        const store = makeStore();
        const tree = render(withProviders(store, <DebugCombatButton />));

        fireEvent.press(tree.getByTestId('debug-combat-button'));

        expect(mockPush).toHaveBeenCalledTimes(1);
        // Path matches the folder-route id pattern used by the tab mutex.
        expect(mockPush.mock.calls[0][0]).toBe('/(tabs)/combat');
    });
});

describe('DebugCombatButton: accessibility', () => {
    it('exposes accessibilityRole=button and a descriptive label', () => {
        const store = makeStore();
        const tree = render(withProviders(store, <DebugCombatButton />));
        const btn = tree.getByTestId('debug-combat-button');
        expect(btn.props.accessibilityRole).toBe('button');
        expect(btn.props.accessibilityLabel).toMatch(/combat/i);
    });
});
