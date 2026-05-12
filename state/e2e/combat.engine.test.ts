/**
 * Hermetic E2E Tests — Combat screen presenter (full)
 *
 * Drives `selectCombatViewModel` through both out-of-combat and in-
 * combat states, plus the `createGameStore(memoryAdapter, …)`
 * lifecycle. Companion to `combat-hud.engine.test.ts`, which pins the
 * smaller HUD slice the combat presenter composes.
 *
 * Hermetic = self-contained + deterministic + isolated.
 * See docs/testing.md for the full standard.
 */

import { afterEach, describe, it, expect, jest } from '@jest/globals';
import {
    createEnemy,
    createGameStore,
    FRIENDSHIP_COUNTER_MAX,
} from 'axiomancer-mechanics';

import { mockAlternatingRng } from '@/test-utils/rng';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';
import { selectCombatViewModel } from '@/state/presenters/combat.engine';

afterEach(() => {
    jest.restoreAllMocks();
});

function makeEnemy() {
    return createEnemy({
        id: 'test-enemy',
        name: 'Hierophant',
        description: 'A foe for tests.',
        level: 1,
        baseStats: { heart: 1, body: 1, mind: 1 },
        mapName: 'fishing-village' as never,
        logic: 'random' as never,
        difficulty: 'elite' as never,
    });
}

// ---------------------------------------------------------------------------
// Happy path — empty + active states
// ---------------------------------------------------------------------------

describe('selectCombatViewModel: happy path', () => {
    it('returns a totally-shaped VM with isInCombat=false when no combat is active', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm = selectCombatViewModel(store.getState());

        expect(vm.isInCombat).toBe(false);
        expect(vm.enemy.name).toBe('');
        expect(vm.enemy.tier).toBe('');
        expect(vm.enemy.hp).toBe(0);
        expect(vm.enemy.hpMax).toBe(0);
        expect(vm.enemy.lastStance).toBeNull();
        expect(vm.friendshipCounter).toBe(0);
        expect(vm.friendshipCounterMax).toBe(FRIENDSHIP_COUNTER_MAX);
    });

    it('exposes the composed HUD slice (hpPercent, manaPercent, effects)', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm = selectCombatViewModel(store.getState());

        expect(vm.hud).toBeDefined();
        expect(vm.hud.hpPercent).toBeGreaterThanOrEqual(0);
        expect(vm.hud.hpPercent).toBeLessThanOrEqual(1);
        expect(vm.hud.manaPercent).toBeGreaterThanOrEqual(0);
        expect(vm.hud.manaPercent).toBeLessThanOrEqual(1);
        expect(Array.isArray(vm.hud.effects)).toBe(true);
    });

    it('reads enemy data from the active combat slice after startCombat', () => {
        mockAlternatingRng();
        const store = createGameStore(createMemoryAdapter());

        store.getState().startCombat(makeEnemy());
        const vm = selectCombatViewModel(store.getState());

        expect(vm.isInCombat).toBe(true);
        expect(vm.enemy.name).toBe('HIEROPHANT');
        expect(vm.enemy.tier).toBe('elite');
        expect(vm.enemy.hp).toBeGreaterThan(0);
        expect(vm.enemy.hpMax).toBeGreaterThan(0);
    });
});

// ---------------------------------------------------------------------------
// Invariants — VM fields are total; freeze is enforced
// ---------------------------------------------------------------------------

describe('selectCombatViewModel: invariants', () => {
    it('every string field is defined (never undefined) when no combat is active', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm = selectCombatViewModel(store.getState());

        expect(typeof vm.enemy.name).toBe('string');
        expect(typeof vm.enemy.tier).toBe('string');
    });

    it('the returned VM is deep-frozen down to nested objects and arrays', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm = selectCombatViewModel(store.getState());

        expect(Object.isFrozen(vm)).toBe(true);
        expect(Object.isFrozen(vm.enemy)).toBe(true);
        expect(Object.isFrozen(vm.hud)).toBe(true);
        expect(Object.isFrozen(vm.hud.effects)).toBe(true);
    });

    it('friendshipCounterMax always equals the engine constant', () => {
        mockAlternatingRng();
        const store = createGameStore(createMemoryAdapter());

        const before = selectCombatViewModel(store.getState());
        store.getState().startCombat(makeEnemy());
        const during = selectCombatViewModel(store.getState());

        expect(before.friendshipCounterMax).toBe(FRIENDSHIP_COUNTER_MAX);
        expect(during.friendshipCounterMax).toBe(FRIENDSHIP_COUNTER_MAX);
    });
});

// ---------------------------------------------------------------------------
// Store lifecycle — adapter.save is not called by selection
// ---------------------------------------------------------------------------

describe('selectCombatViewModel: store lifecycle', () => {
    it('selecting the VM does not trigger adapter.save', () => {
        mockAlternatingRng();
        const adapter = createMemoryAdapter();
        const store = createGameStore(adapter);
        const saveSpy = jest.spyOn(adapter, 'save');

        store.getState().startCombat(makeEnemy());
        selectCombatViewModel(store.getState());
        selectCombatViewModel(store.getState());

        expect(saveSpy).not.toHaveBeenCalled();
    });

    it('isInCombat flips on startCombat and resets on endCombat', () => {
        mockAlternatingRng();
        const store = createGameStore(createMemoryAdapter());

        expect(selectCombatViewModel(store.getState()).isInCombat).toBe(false);

        store.getState().startCombat(makeEnemy());
        expect(selectCombatViewModel(store.getState()).isInCombat).toBe(true);

        store.getState().endCombat();
        expect(selectCombatViewModel(store.getState()).isInCombat).toBe(false);
    });
});
