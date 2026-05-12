/**
 * Hermetic E2E Tests — Event screen presenter (stub)
 *
 * Pins the `EventViewModel` shape. Spec 08 replaces the stub return
 * with engine reads (active `MapEvent` / `UniqueEvent`).
 *
 * Hermetic = self-contained + deterministic + isolated.
 * See docs/testing.md for the full standard.
 */

import { afterEach, describe, it, expect, jest } from '@jest/globals';
import { createGameStore } from 'axiomancer-mechanics';

import { createMemoryAdapter } from '@/test-utils/memoryAdapter';
import {
    selectEventViewModel,
    type EventViewModel,
} from '@/state/presenters/event.engine';

afterEach(() => {
    jest.restoreAllMocks();
});

const ALLOWED_VARIANTS = ['encounter', 'boss', 'quest', 'rest', 'gather'] as const;
const ALLOWED_ACCENTS = ['blood', 'sulfur', 'parchment', 'bone', 'rust'] as const;

describe('selectEventViewModel: shape contract', () => {
    it('returns a totally-shaped EventViewModel for a fresh game', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm: EventViewModel = selectEventViewModel(store.getState());

        expect(ALLOWED_VARIANTS).toContain(vm.variant);
        expect(typeof vm.badge).toBe('string');
        expect(ALLOWED_ACCENTS).toContain(vm.badgeAccentKey);
        expect(typeof vm.title).toBe('string');
        expect(typeof vm.subtitle).toBe('string');
        expect(typeof vm.body).toBe('string');
        expect(Array.isArray(vm.choices)).toBe(true);
    });

    it('lore is either null or a string', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm = selectEventViewModel(store.getState());

        if (vm.lore !== null) {
            expect(typeof vm.lore).toBe('string');
        } else {
            expect(vm.lore).toBeNull();
        }
    });

    it('each choice carries a stable accentKey and iconKey', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm = selectEventViewModel(store.getState());

        for (const choice of vm.choices) {
            expect(typeof choice.id).toBe('string');
            expect(typeof choice.label).toBe('string');
            expect(typeof choice.sub).toBe('string');
            expect(typeof choice.iconKey).toBe('string');
            expect(ALLOWED_ACCENTS).toContain(choice.accentKey);
            expect(typeof choice.enabled).toBe('boolean');
        }
    });
});

describe('selectEventViewModel: invariants', () => {
    it('the returned VM is deep-frozen', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm = selectEventViewModel(store.getState());

        expect(Object.isFrozen(vm)).toBe(true);
        expect(Object.isFrozen(vm.choices)).toBe(true);
    });
});

describe('selectEventViewModel: store lifecycle', () => {
    it('selecting the VM does not call adapter.save', () => {
        const adapter = createMemoryAdapter();
        const store = createGameStore(adapter);
        const saveSpy = jest.spyOn(adapter, 'save');

        selectEventViewModel(store.getState());

        expect(saveSpy).not.toHaveBeenCalled();
    });
});
