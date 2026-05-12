/**
 * Hermetic E2E Tests — Exploration screen presenter (stub)
 *
 * Pins the `ExplorationViewModel` shape. Spec 07 replaces the stub
 * return value with real `WorldState` reads.
 *
 * Hermetic = self-contained + deterministic + isolated.
 * See docs/testing.md for the full standard.
 */

import { afterEach, describe, it, expect, jest } from '@jest/globals';
import { createGameStore } from 'axiomancer-mechanics';

import { createMemoryAdapter } from '@/test-utils/memoryAdapter';
import {
    selectExplorationViewModel,
    type ExplorationViewModel,
} from '@/state/presenters/exploration.engine';

afterEach(() => {
    jest.restoreAllMocks();
});

describe('selectExplorationViewModel: shape contract', () => {
    it('returns a totally-shaped ExplorationViewModel for a fresh game', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm: ExplorationViewModel = selectExplorationViewModel(store.getState());

        expect(typeof vm.continent).toBe('string');
        expect(typeof vm.region).toBe('string');
        expect(typeof vm.regionProgress).toBe('string');
        expect(typeof vm.dayDisplay).toBe('string');
        expect(Array.isArray(vm.nodes)).toBe(true);
        expect(Array.isArray(vm.edges)).toBe(true);
        expect(Array.isArray(vm.actions)).toBe(true);
        expect(typeof vm.legend.left).toBe('string');
        expect(typeof vm.legend.right).toBe('string');
    });

    it('eventCallout is either null or a {title, iconKey} object', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm = selectExplorationViewModel(store.getState());

        if (vm.eventCallout !== null) {
            expect(typeof vm.eventCallout.title).toBe('string');
            expect(typeof vm.eventCallout.iconKey).toBe('string');
        } else {
            expect(vm.eventCallout).toBeNull();
        }
    });
});

describe('selectExplorationViewModel: invariants', () => {
    it('the returned VM is deep-frozen', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm = selectExplorationViewModel(store.getState());

        expect(Object.isFrozen(vm)).toBe(true);
        expect(Object.isFrozen(vm.nodes)).toBe(true);
        expect(Object.isFrozen(vm.edges)).toBe(true);
        expect(Object.isFrozen(vm.legend)).toBe(true);
    });
});

describe('selectExplorationViewModel: store lifecycle', () => {
    it('selecting the VM does not call adapter.save', () => {
        const adapter = createMemoryAdapter();
        const store = createGameStore(adapter);
        const saveSpy = jest.spyOn(adapter, 'save');

        selectExplorationViewModel(store.getState());

        expect(saveSpy).not.toHaveBeenCalled();
    });
});
