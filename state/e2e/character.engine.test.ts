/**
 * Hermetic E2E Tests — Character screen presenter (stub)
 *
 * Pins the `CharacterViewModel` shape contract. Specs 04+ replace the
 * stub return value with real engine reads; this test guards against
 * silent shape drift in the meantime.
 *
 * Hermetic = self-contained + deterministic + isolated.
 * See docs/testing.md for the full standard.
 */

import { afterEach, describe, it, expect, jest } from '@jest/globals';
import { createGameStore } from 'axiomancer-mechanics';

import { createMemoryAdapter } from '@/test-utils/memoryAdapter';
import {
    selectCharacterViewModel,
    type CharacterViewModel,
} from '@/state/presenters/character.engine';

afterEach(() => {
    jest.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Shape contract — every field present, of the documented type
// ---------------------------------------------------------------------------

describe('selectCharacterViewModel: shape contract', () => {
    it('returns a totally-shaped CharacterViewModel for a fresh game', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm: CharacterViewModel = selectCharacterViewModel(store.getState());

        expect(typeof vm.displayName).toBe('string');
        expect(typeof vm.subtitle).toBe('string');
        expect(typeof vm.level).toBe('number');
        expect(typeof vm.xp).toBe('number');
        expect(typeof vm.xpMax).toBe('number');
        expect(typeof vm.luck).toBe('number');
        expect(Array.isArray(vm.base)).toBe(true);
        expect(Array.isArray(vm.derived)).toBe(true);
        expect(Array.isArray(vm.saves)).toBe(true);
        expect(Array.isArray(vm.effects)).toBe(true);
        expect(Array.isArray(vm.equipment)).toBe(true);
        expect(Array.isArray(vm.skills)).toBe(true);
    });

    it('exposes the three base stat rows keyed by stance', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm = selectCharacterViewModel(store.getState());

        const stances = vm.base.map((r) => r.stanceKey).sort();
        expect(stances).toEqual(['body', 'heart', 'mind']);
        for (const row of vm.base) {
            expect(typeof row.label).toBe('string');
            expect(typeof row.value).toBe('number');
        }
    });

    it('every derived row has attack/skill/defense as numbers', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm = selectCharacterViewModel(store.getState());

        for (const row of vm.derived) {
            expect(typeof row.label).toBe('string');
            expect(typeof row.attack).toBe('number');
            expect(typeof row.skill).toBe('number');
            expect(typeof row.defense).toBe('number');
        }
    });
});

// ---------------------------------------------------------------------------
// Invariants — VM is total + deep-frozen
// ---------------------------------------------------------------------------

describe('selectCharacterViewModel: invariants', () => {
    it('xp is in [0, xpMax]', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm = selectCharacterViewModel(store.getState());

        expect(vm.xp).toBeGreaterThanOrEqual(0);
        expect(vm.xp).toBeLessThanOrEqual(vm.xpMax);
    });

    it('the returned VM is deep-frozen', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm = selectCharacterViewModel(store.getState());

        expect(Object.isFrozen(vm)).toBe(true);
        expect(Object.isFrozen(vm.base)).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// Store lifecycle — selection is read-only
// ---------------------------------------------------------------------------

describe('selectCharacterViewModel: store lifecycle', () => {
    it('selecting the VM does not call adapter.save', () => {
        const adapter = createMemoryAdapter();
        const store = createGameStore(adapter);
        const saveSpy = jest.spyOn(adapter, 'save');

        selectCharacterViewModel(store.getState());
        selectCharacterViewModel(store.getState());

        expect(saveSpy).not.toHaveBeenCalled();
    });
});
