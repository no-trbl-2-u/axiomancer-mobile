/**
 * Hermetic E2E Tests — Inventory screen presenter (stub)
 *
 * Pins the `InventoryViewModel` shape and the `localUi` argument
 * contract. Spec 06 replaces the stub return with engine reads.
 *
 * Hermetic = self-contained + deterministic + isolated.
 * See docs/testing.md for the full standard.
 */

import { afterEach, describe, it, expect, jest } from '@jest/globals';
import { createGameStore } from 'axiomancer-mechanics';

import { createMemoryAdapter } from '@/test-utils/memoryAdapter';
import {
    selectInventoryViewModel,
    type InventoryViewModel,
} from '@/state/presenters/inventory.engine';

afterEach(() => {
    jest.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Shape contract
// ---------------------------------------------------------------------------

describe('selectInventoryViewModel: shape contract', () => {
    it('returns a totally-shaped InventoryViewModel for a fresh game', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm: InventoryViewModel = selectInventoryViewModel(store.getState());

        expect(Array.isArray(vm.tabs)).toBe(true);
        expect(Array.isArray(vm.items)).toBe(true);
        expect(typeof vm.shilling).toBe('number');
        expect(typeof vm.burden).toBe('number');
        expect(typeof vm.burdenMax).toBe('number');
        expect(['all', 'equipment', 'consumable', 'material', 'quest']).toContain(vm.activeTab);
    });

    it('exposes the five canonical tab keys in display order', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm = selectInventoryViewModel(store.getState());

        expect(vm.tabs.map((t) => t.key)).toEqual([
            'all',
            'equipment',
            'consumable',
            'material',
            'quest',
        ]);
        for (const tab of vm.tabs) {
            expect(typeof tab.label).toBe('string');
            expect(typeof tab.count).toBe('number');
        }
    });
});

// ---------------------------------------------------------------------------
// localUi argument — drives activeTab + expansion
// ---------------------------------------------------------------------------

describe('selectInventoryViewModel: localUi argument', () => {
    it('defaults activeTab to "all" when no localUi is provided', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm = selectInventoryViewModel(store.getState());

        expect(vm.activeTab).toBe('all');
        expect(vm.expandedItemId).toBeNull();
    });

    it('respects an injected activeTab', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm = selectInventoryViewModel(store.getState(), {
            activeTab: 'consumable',
        });

        expect(vm.activeTab).toBe('consumable');
    });

    it('respects an injected expandedItemId', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm = selectInventoryViewModel(store.getState(), {
            expandedItemId: 'long-blade',
        });

        expect(vm.expandedItemId).toBe('long-blade');
    });
});

// ---------------------------------------------------------------------------
// Invariants + lifecycle
// ---------------------------------------------------------------------------

describe('selectInventoryViewModel: invariants', () => {
    it('burden is in [0, burdenMax]', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm = selectInventoryViewModel(store.getState());

        expect(vm.burden).toBeGreaterThanOrEqual(0);
        expect(vm.burden).toBeLessThanOrEqual(vm.burdenMax);
    });

    it('the returned VM is deep-frozen', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm = selectInventoryViewModel(store.getState());

        expect(Object.isFrozen(vm)).toBe(true);
        expect(Object.isFrozen(vm.tabs)).toBe(true);
    });
});

describe('selectInventoryViewModel: store lifecycle', () => {
    it('selecting the VM does not call adapter.save', () => {
        const adapter = createMemoryAdapter();
        const store = createGameStore(adapter);
        const saveSpy = jest.spyOn(adapter, 'save');

        selectInventoryViewModel(store.getState());

        expect(saveSpy).not.toHaveBeenCalled();
    });
});
