/**
 * Hermetic E2E Tests — Combat HUD presenter + engine store lifecycle
 *
 * Hermetic = self-contained + deterministic + isolated.
 * See docs/testing.md for the full standard.
 */

import { afterEach, describe, it, expect, jest } from '@jest/globals';

import {
    createNewGameState,
    createCharacter,
    createEnemy,
    randomLogic,
    applyEffect,
    effectsLibrary,
    initializeCombat,
    createGameStore,
    nullAdapter,
} from 'axiomancer-mechanics';

import { mockAlternatingRng } from '@/test-utils/rng';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';
import { selectCombatHudViewModel } from '@/state/presenters/combat-hud.engine';
import {
    createAppStore,
    EMPTY_EVENT_SLICE,
    DEFAULT_NOTIFICATIONS_SLICE,
    type AppStoreState,
} from '@/state/store';

afterEach(() => {
    jest.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePlayer(overrides: Partial<ReturnType<typeof createCharacter>> = {}) {
    const base = createCharacter({ name: 'Hero', level: 1, baseStats: { heart: 1, body: 1, mind: 1 } });
    return { ...base, ...overrides };
}

function makeEnemy() {
    return createEnemy({
        id: 'test-enemy',
        name: 'Test Foe',
        description: 'A foe for testing',
        level: 1,
        baseStats: { heart: 1, body: 1, mind: 1 },
        mapName: 'fishing-village',
        logic: 'random',
    });
}

/**
 * Build a `state`-shaped fixture (engine GameState + the mobile-only
 * `combatMana` slice). Phase 60d lifted mana off Character; the
 * presenter now reads from `state.combatMana`. Tests that want a
 * specific mana ratio pass the second arg explicitly; the default
 * of `null` reflects the "no active combat" branch which the
 * presenter treats as a full bar (1.0).
 */
function stateWith(
    playerOverrides: Partial<ReturnType<typeof createCharacter>> = {},
    combatMana: { current: number; max: number } | null = null,
): AppStoreState {
    const base = createNewGameState();
    // GameState + mobile slices is enough to satisfy AppStoreState
    // for selector-only tests; GameActions are not invoked here.
    return {
        ...base,
        player: makePlayer(playerOverrides),
        combatMana,
        event: EMPTY_EVENT_SLICE,
        notifications: DEFAULT_NOTIFICATIONS_SLICE,
        _recentEvents: [],
    } as unknown as AppStoreState;
}

// ---------------------------------------------------------------------------
// Presenter — happy path
// ---------------------------------------------------------------------------

describe('selectCombatHudViewModel: happy path', () => {
    it('returns 1.0 for both percents when player is at full HP and mana', () => {
        const player = makePlayer();
        // Phase 60d — pass mana as a `combatMana` slice (current=max)
        // rather than as a Character override. The previous form
        // (`{ mana: player.maxMana }`) is a no-op now that mana lives
        // off Character.
        const state = stateWith(
            { health: player.maxHealth },
            { current: 14, max: 14 },
        );

        const vm = selectCombatHudViewModel(state);

        expect(vm.hpPercent).toBe(1);
        expect(vm.manaPercent).toBe(1);
    });

    it('returns empty effects array when player has no active effects', () => {
        const state = stateWith();

        const vm = selectCombatHudViewModel(state);

        expect(vm.effects).toHaveLength(0);
    });
});

// ---------------------------------------------------------------------------
// Presenter — boundary and invariants
// ---------------------------------------------------------------------------

describe('selectCombatHudViewModel: boundary conditions', () => {
    it('clamps hpPercent to 0 when player health is 0', () => {
        const state = stateWith({ health: 0 });

        const vm = selectCombatHudViewModel(state);

        expect(vm.hpPercent).toBe(0);
    });

    it('clamps manaPercent to 0 when combatMana current is 0', () => {
        // Phase 60d — mana now reads from the mobile-only slice.
        // Explicit 0/14 lands at manaPercent=0 (the empty-pool case).
        const state = stateWith({}, { current: 0, max: 14 });

        const vm = selectCombatHudViewModel(state);

        expect(vm.manaPercent).toBe(0);
    });

    it('clamps hpPercent to 1 even when health exceeds maxHealth', () => {
        const player = makePlayer();
        const state = stateWith({ health: player.maxHealth + 999 });

        const vm = selectCombatHudViewModel(state);

        expect(vm.hpPercent).toBe(1);
    });

    it('returns hpPercent 0 when maxHealth is 0 (degenerate character)', () => {
        const state = stateWith({ health: 0, maxHealth: 0 });

        const vm = selectCombatHudViewModel(state);

        expect(vm.hpPercent).toBe(0);
    });

    it('returns a value in [0, 1] for a player at half HP', () => {
        const player = makePlayer();
        const state = stateWith({ health: Math.floor(player.maxHealth / 2) });

        const vm = selectCombatHudViewModel(state);

        expect(vm.hpPercent).toBeGreaterThanOrEqual(0);
        expect(vm.hpPercent).toBeLessThanOrEqual(1);
    });
});

// ---------------------------------------------------------------------------
// Presenter — effects ordering and limit
// ---------------------------------------------------------------------------

describe('selectCombatHudViewModel: effects', () => {
    it('exposes all effects when fewer than the display cap are active', () => {
        const buff = effectsLibrary.buffs[0];
        const { activeEffects } = applyEffect([], buff, 1);
        const state = stateWith({ effects: activeEffects });

        const vm = selectCombatHudViewModel(state);

        expect(vm.effects).toHaveLength(1);
        expect(vm.effects[0].effectId).toBe(buff.id);
    });

    it('preserves effect ordering from the player effects array', () => {
        let effects: ReturnType<typeof applyEffect>['activeEffects'] = [];
        const usedBuffs = effectsLibrary.buffs.slice(0, 3);
        usedBuffs.forEach((buff, round) => {
            ({ activeEffects: effects } = applyEffect(effects, buff, round + 1));
        });
        const state = stateWith({ effects });

        const vm = selectCombatHudViewModel(state);

        usedBuffs.forEach((buff, i) => {
            expect(vm.effects[i].effectId).toBe(buff.id);
        });
    });

    it('shows at most 4 effects even when more are active', () => {
        let effects: ReturnType<typeof applyEffect>['activeEffects'] = [];
        effectsLibrary.buffs.slice(0, 6).forEach((buff, round) => {
            ({ activeEffects: effects } = applyEffect(effects, buff, round + 1));
        });
        const state = stateWith({ effects });

        const vm = selectCombatHudViewModel(state);

        expect(vm.effects.length).toBeLessThanOrEqual(4);
    });

    it('maps each effect display with the correct fields', () => {
        const buff = effectsLibrary.buffs[0];
        const { activeEffects } = applyEffect([], buff, 1);
        const state = stateWith({ effects: activeEffects });

        const vm = selectCombatHudViewModel(state);

        const display = vm.effects[0];
        expect(display.effectId).toBe(activeEffects[0].effectId);
        expect(display.intensity).toBe(activeEffects[0].intensity);
        expect(display.remainingDuration).toBe(activeEffects[0].remainingDuration);
    });
});

// ---------------------------------------------------------------------------
// Presenter — reads from in-combat snapshot
// ---------------------------------------------------------------------------

describe('selectCombatHudViewModel: in-combat player snapshot', () => {
    it('reads HP from the combat player when combat is active, not from the out-of-combat player', () => {
        mockAlternatingRng();

        const state = stateWith();
        const enemy = makeEnemy();
        const combat = initializeCombat(state.player, enemy);

        const damagedCombatPlayer = { ...combat.player, health: Math.floor(combat.player.maxHealth / 2) };
        const inCombatState: AppStoreState = { ...state, combat: { ...combat, player: damagedCombatPlayer } };

        const vm = selectCombatHudViewModel(inCombatState);

        // The out-of-combat player is at full HP; the combat snapshot has half HP.
        expect(vm.hpPercent).toBeCloseTo(0.5, 1);
    });

    it('falls back to out-of-combat player when no combat is active', () => {
        const state = stateWith();

        const vm = selectCombatHudViewModel(state);

        // Fresh game, player is at full HP.
        expect(vm.hpPercent).toBe(1);
    });
});

// ---------------------------------------------------------------------------
// Engine store lifecycle tests
// ---------------------------------------------------------------------------

describe('engine store lifecycle', () => {
    it('startCombat does not trigger a save on the persistence adapter', () => {
        mockAlternatingRng();
        const adapter = createMemoryAdapter();
        // Goes through the mobile boundary so the deflecting wrapper
        // in `createAppStore` suppresses the engine's per-dispatch
        // autosave (Spec 09: AsyncStorage writes are explicit only).
        const store = createAppStore({ adapter });

        store.getState().startCombat(makeEnemy());

        expect(adapter.saveCount).toBe(0);
    });

    it('store.save() increments the adapter save count', () => {
        const adapter = createMemoryAdapter();
        const store = createGameStore(adapter);

        store.getState().save();

        expect(adapter.saveCount).toBe(1);
    });

    it('the presenter reflects in-combat state after startCombat', () => {
        mockAlternatingRng();
        const adapter = createMemoryAdapter();
        const store = createAppStore({ adapter });

        store.getState().startCombat(makeEnemy());
        const vm = selectCombatHudViewModel(store.getState());

        // Fresh combat; player entered at full HP.
        expect(vm.hpPercent).toBe(1);
        expect(vm.manaPercent).toBe(1);
    });

    it('a new store reloads saved state from the adapter', () => {
        const adapter = createMemoryAdapter();
        const firstStore = createGameStore(adapter);
        firstStore.getState().save();

        // Second store from same adapter should load the same state.
        const secondStore = createGameStore(adapter);
        expect(secondStore.getState().version).toBe(firstStore.getState().version);
    });

    it('nullAdapter.load returns null so the store starts a fresh game', () => {
        const store = createGameStore(nullAdapter);

        expect(store.getState().combat).toBeNull();
    });
});
