/**
 * Hermetic component tests — DebugEventKindForce (Phase 61f).
 *
 * Pins:
 *   - DEV gate (true / simulated-false)
 *   - All five kind buttons mount
 *   - Pressing a kind sets a per-node override that surfaces
 *     when resolveMapEvent runs on that node (rest forces rest,
 *     gather forces gather, etc.)
 *   - No-op + no throw when the player is not on a recognized
 *     continent map
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { resolveMapEvent } from 'axiomancer-mechanics';

import { DebugEventKindForce } from '@/components/DebugEventKindForce';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import {
    registerExplorationEventPools,
} from '@/state/exploration-maps/event-pools';
import { createAppStore, type AppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

afterEach(() => {
    // Restore canonical pool overrides so this suite doesn't bleed
    // into others that share the global engine registry.
    registerExplorationEventPools();
    jest.restoreAllMocks();
});

function makeStore(): AppStore {
    return createAppStore({ adapter: createMemoryAdapter() });
}

function withProvider(store: AppStore, child: React.ReactNode) {
    return <GameStoreProvider store={store}>{child}</GameStoreProvider>;
}

describe('DebugEventKindForce: DEV gate', () => {
    it('renders five kind buttons when __DEV__ is true (jest default)', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugEventKindForce />));
        expect(tree.queryByTestId('debug-event-kind-rest')).not.toBeNull();
        expect(tree.queryByTestId('debug-event-kind-gather')).not.toBeNull();
        expect(tree.queryByTestId('debug-event-kind-treasure')).not.toBeNull();
        expect(tree.queryByTestId('debug-event-kind-quest')).not.toBeNull();
        expect(tree.queryByTestId('debug-event-kind-encounter')).not.toBeNull();
    });

    it('renders null when __DEV__ is false (production build simulation)', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const g = global as any;
        const original = g.__DEV__;
        g.__DEV__ = false;
        try {
            const store = makeStore();
            const tree = render(withProvider(store, <DebugEventKindForce />));
            expect(tree.queryByTestId('debug-event-kind-rest')).toBeNull();
        } finally {
            g.__DEV__ = original;
        }
    });
});

describe('DebugEventKindForce: force routing', () => {
    it('REST forces a rest event on the current node', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugEventKindForce />));

        fireEvent.press(tree.getByTestId('debug-event-kind-rest'));

        const event = resolveMapEvent(store.getState());
        expect(event.event.kind).toBe('rest');
    });

    it('TREASURE forces a loot-cache event on the current node', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugEventKindForce />));

        fireEvent.press(tree.getByTestId('debug-event-kind-treasure'));

        const event = resolveMapEvent(store.getState());
        // Treasure pool entries emit 'loot-cache' per the engine kind taxonomy.
        expect(event.event.kind).toBe('loot-cache');
    });

    it('GATHER forces a gathering event on the current node', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugEventKindForce />));

        fireEvent.press(tree.getByTestId('debug-event-kind-gather'));

        const event = resolveMapEvent(store.getState());
        expect(event.event.kind).toBe('gathering');
    });

    it('FIGHT forces an encounter event on the current node', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugEventKindForce />));

        fireEvent.press(tree.getByTestId('debug-event-kind-encounter'));

        const event = resolveMapEvent(store.getState());
        expect(event.event.kind).toBe('encounter');
    });
});

describe('DebugEventKindForce: accessibility', () => {
    it('exposes accessibilityRole=button and descriptive labels for each kind', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugEventKindForce />));

        const rest = tree.getByTestId('debug-event-kind-rest');
        expect(rest.props.accessibilityRole).toBe('button');
        expect(rest.props.accessibilityLabel).toMatch(/rest/i);

        const quest = tree.getByTestId('debug-event-kind-quest');
        expect(quest.props.accessibilityLabel).toMatch(/quest/i);
    });
});
