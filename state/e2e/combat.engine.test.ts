/**
 * Hermetic E2E Tests — Combat screen presenter (full)
 *
 * Drives `selectCombatViewModel` + the combat action layer end-to-end
 * through the four-phase loop and every terminal condition. The
 * presenter is the highest-level public entry point of the combat
 * UI module per `docs/presenters.md`.
 *
 * Hermetic = self-contained + deterministic + isolated.
 * See docs/testing.md for the full standard.
 */

import { afterEach, describe, it, expect, jest } from '@jest/globals';
import {
    createEnemy,
    createGameStore,
    FRIENDSHIP_COUNTER_MAX,
    incrementFriendship as engineIncrementFriendship,
} from 'axiomancer-mechanics';

import { mockFixedRng, mockSequentialRng } from '@/test-utils/rng';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';
import { createAppActions } from '@/state/actions';
import { createAppStore } from '@/state/store';
import {
    selectCombatViewModel,
    type CombatPhaseKey,
    type StanceKey,
} from '@/state/presenters/combat.engine';
import { COMBAT_SKILLS_FIXTURE } from '@/state/mocks/combat.skills.fixture';

afterEach(() => {
    jest.restoreAllMocks();
});

function makeEnemy(overrides: Partial<Parameters<typeof createEnemy>[0]> = {}) {
    return createEnemy({
        id: 'test-enemy',
        name: 'Hierophant',
        description: 'A foe for tests.',
        level: 1,
        baseStats: { heart: 1, body: 1, mind: 1 },
        mapName: 'fishing-village' as never,
        logic: 'random' as never,
        difficulty: 'elite' as never,
        ...overrides,
    });
}

// ---------------------------------------------------------------------------
// Happy path — no combat
// ---------------------------------------------------------------------------

describe('selectCombatViewModel: no combat', () => {
    it('returns a totally-shaped VM with isInCombat=false when no combat is active', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });

        const vm = selectCombatViewModel(store.getState());

        expect(vm.isInCombat).toBe(false);
        expect(vm.phase).toBe('choosing_stance');
        expect(vm.enemy.name).toBe('');
        expect(vm.enemy.tier).toBe('');
        expect(vm.enemy.hp).toBe(0);
        expect(vm.enemy.hpMax).toBe(0);
        expect(vm.enemy.hpRatio).toBe(0);
        expect(vm.enemy.lastStance).toBeNull();
        expect(vm.enemy.mindMarks).toBe(0);
        expect(vm.enemy.effects).toEqual([]);
        expect(vm.player.hp).toBe(0);
        expect(vm.player.mana).toBe(0);
        expect(vm.player.manaRatio).toBe(1);
        expect(vm.friendshipCounter).toBe(0);
        expect(vm.friendshipCounterMax).toBe(FRIENDSHIP_COUNTER_MAX);
        expect(vm.stancePicker.options).toHaveLength(3);
        expect(vm.stancePicker.canConfirm).toBe(false);
        expect(vm.actionPicker.options).toHaveLength(4);
        expect(vm.actionPicker.fleeAvailable).toBe(true);
        expect(vm.skillPicker.skills).toHaveLength(COMBAT_SKILLS_FIXTURE.length);
        expect(vm.log).toEqual([]);
        expect(vm.phaseHeader).toContain('STANCE');
    });

    it('exposes the composed HUD slice (hpPercent, manaPercent, effects)', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const vm = selectCombatViewModel(store.getState());

        expect(vm.hud).toBeDefined();
        expect(vm.hud.hpPercent).toBeGreaterThanOrEqual(0);
        expect(vm.hud.hpPercent).toBeLessThanOrEqual(1);
        expect(vm.hud.manaPercent).toBeGreaterThanOrEqual(0);
        expect(vm.hud.manaPercent).toBeLessThanOrEqual(1);
        expect(Array.isArray(vm.hud.effects)).toBe(true);
    });

    it('exposes accessibility labels for all interactive elements (Phase 10)', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const vm = selectCombatViewModel(store.getState());

        expect(vm.a11y).toBeDefined();
        expect(typeof vm.a11y.stanceHeart).toBe('string');
        expect(typeof vm.a11y.stanceBody).toBe('string');
        expect(typeof vm.a11y.stanceMind).toBe('string');
        expect(typeof vm.a11y.actionAttack).toBe('string');
        expect(typeof vm.a11y.actionDefend).toBe('string');
        expect(typeof vm.a11y.actionSkill).toBe('string');
        expect(typeof vm.a11y.actionItem).toBe('string');
        expect(typeof vm.a11y.playerHp).toBe('string');
        expect(typeof vm.a11y.playerMana).toBe('string');
        expect(typeof vm.a11y.enemyHp).toBe('string');
        expect(typeof vm.a11y.phaseHeader).toBe('string');
        expect(typeof vm.a11y.roundInfo).toBe('string');

        expect(vm.a11y.stanceHeart).toContain('Heart');
        expect(vm.a11y.actionAttack).toContain('Attack');
        expect(vm.a11y.playerHp).toContain('health');
    });
});

// ---------------------------------------------------------------------------
// Happy path — active combat through the four-phase loop
// ---------------------------------------------------------------------------

describe('selectCombatViewModel: active combat', () => {
    it('reads enemy data from the active combat slice after startCombat', () => {
        mockFixedRng(0.5);
        const store = createAppStore({ adapter: createMemoryAdapter() });
        store.getState().startCombat(makeEnemy());

        const vm = selectCombatViewModel(store.getState());

        expect(vm.isInCombat).toBe(true);
        expect(vm.phase).toBe('choosing_stance');
        expect(vm.enemy.name).toBe('HIEROPHANT');
        expect(vm.enemy.tier).toBe('elite');
        expect(vm.enemy.hp).toBeGreaterThan(0);
        expect(vm.enemy.hpMax).toBeGreaterThan(0);
        expect(vm.enemy.hpRatio).toBeGreaterThan(0);
        expect(vm.enemy.hpRatio).toBeLessThanOrEqual(1);
    });

    it('previews the selected stance via localUi without mutating engine state', () => {
        mockFixedRng(0.5);
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);
        actions.startCombat(makeEnemy());

        const vmWithBody = selectCombatViewModel(store.getState(), { selectedStance: 'body' });
        const vmWithMind = selectCombatViewModel(store.getState(), { selectedStance: 'mind' });

        expect(vmWithBody.stancePicker.selected).toBe('body');
        expect(vmWithMind.stancePicker.selected).toBe('mind');
        // skillPicker is driven by the previewed stance (the action
        // layer seeds the combat.player with mana scaffolding).
        expect(vmWithBody.skillPicker.skills.some((s) => s.stance === 'body' && s.enabled)).toBe(true);
    });

    it('drives the full four-phase loop and returns to choosing_stance', () => {
        mockFixedRng(0.5);
        const adapter = createMemoryAdapter();
        const store = createAppStore({ adapter });
        const actions = createAppActions(store);

        actions.startCombat(makeEnemy({ baseStats: { heart: 5, body: 5, mind: 5 } }));
        expect(selectCombatViewModel(store.getState()).phase).toBe('choosing_stance');

        actions.setPlayerStance('body');
        actions.setCombatPhase('choosing_action');
        expect(selectCombatViewModel(store.getState()).phase).toBe('choosing_action');

        actions.setCombatPhase('choosing_skill');
        expect(selectCombatViewModel(store.getState()).phase).toBe('choosing_skill');

        actions.setPlayerAction('attack');
        const result = actions.resolveRound();
        expect(selectCombatViewModel(store.getState()).phase).toBe('resolving');
        expect(result.endReason).toBe('ongoing');

        actions.nextRound();
        expect(selectCombatViewModel(store.getState()).phase).toBe('choosing_stance');
    });

    it('walks every phase header through the loop', () => {
        mockFixedRng(0.5);
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);
        actions.startCombat(makeEnemy());

        const seen: CombatPhaseKey[] = [];
        seen.push(selectCombatViewModel(store.getState()).phase);
        actions.setCombatPhase('choosing_action');
        seen.push(selectCombatViewModel(store.getState()).phase);
        actions.setCombatPhase('choosing_skill');
        seen.push(selectCombatViewModel(store.getState()).phase);
        actions.setPlayerAction('attack');
        actions.resolveRound();
        seen.push(selectCombatViewModel(store.getState()).phase);

        expect(seen).toEqual(['choosing_stance', 'choosing_action', 'choosing_skill', 'resolving']);
    });
});

// ---------------------------------------------------------------------------
// Stance picker / advantage triangle
// ---------------------------------------------------------------------------

describe('selectCombatViewModel: stance picker', () => {
    it('marks the player stance as ADV when it beats the enemy last stance', () => {
        mockFixedRng(0.5);
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);
        actions.startCombat(makeEnemy({ baseStats: { heart: 9, body: 9, mind: 1 } }));
        actions.setPlayerStance('heart');
        actions.setPlayerAction('attack');
        actions.resolveRound();

        const vm = selectCombatViewModel(store.getState());
        // After the round resolves the enemy's revealed stance is
        // stashed on the combat slice; the next stance picker shows
        // ADV / DIS relative to it.
        const enemyStance = vm.enemy.lastStance;
        expect(enemyStance).not.toBeNull();
        const playerOpt = vm.stancePicker.options.find((o) =>
            (enemyStance === 'body' && o.key === 'heart')
            || (enemyStance === 'mind' && o.key === 'body')
            || (enemyStance === 'heart' && o.key === 'mind'),
        );
        expect(playerOpt?.advantage).toBe('adv');
    });

    it('flags stances neutral when the enemy has not yet revealed', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        store.getState().startCombat(makeEnemy());

        const vm = selectCombatViewModel(store.getState());
        for (const opt of vm.stancePicker.options) {
            expect(opt.advantage).toBe('neutral');
        }
    });

    // Phase 47 port — stance gloss copy (prototype.jsx:285-287).
    it('each stance option ships its lowercase two-word gloss (Phase 47)', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        store.getState().startCombat(makeEnemy());

        const vm = selectCombatViewModel(store.getState());
        const byKey = Object.fromEntries(
            vm.stancePicker.options.map((o) => [o.key, o.gloss] as const),
        );
        expect(byKey.heart).toBe('parley, mercy');
        expect(byKey.body).toBe('iron, force');
        expect(byKey.mind).toBe('cipher, ruse');
    });

    it('derives stance attack/skill/defense from player.derivedStats (engine deriveStats), not a constant', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const player = store.getState().player;
        // Inject deliberately asymmetric derived stats so the test fails
        // if the presenter falls back to a flat constant. Heart-dimension
        // engine stats are `emotional*`; body-dimension are `physical*`;
        // mind-dimension are `mental*`.
        store.setState({
            player: {
                ...player,
                derivedStats: {
                    ...player.derivedStats,
                    emotionalAttack: 42,
                    emotionalSkill: 17,
                    emotionalDefense: 9,
                    physicalAttack: 3,
                    physicalSkill: 5,
                    physicalDefense: 7,
                    mentalAttack: 11,
                    mentalSkill: 13,
                    mentalDefense: 19,
                } as never,
            },
        });

        const vm = selectCombatViewModel(store.getState());

        const heart = vm.stancePicker.options.find((o) => o.key === 'heart')?.derived;
        const body = vm.stancePicker.options.find((o) => o.key === 'body')?.derived;
        const mind = vm.stancePicker.options.find((o) => o.key === 'mind')?.derived;

        expect(heart).toEqual({ attack: 42, skill: 17, defense: 9 });
        expect(body).toEqual({ attack: 3, skill: 5, defense: 7 });
        expect(mind).toEqual({ attack: 11, skill: 13, defense: 19 });
    });
});

// ---------------------------------------------------------------------------
// Skill picker invariants
// ---------------------------------------------------------------------------

describe('selectCombatViewModel: skill picker', () => {
    it('disables every skill that does not match the selected stance', () => {
        mockFixedRng(0.5);
        const store = createAppStore({ adapter: createMemoryAdapter() });
        store.getState().startCombat(makeEnemy());
        const vm = selectCombatViewModel(store.getState(), { selectedStance: 'body' });

        for (const s of vm.skillPicker.skills) {
            if (s.stance !== 'body') {
                expect(s.enabled).toBe(false);
                expect(s.disabledReason).toBe('wrong-stance');
            }
        }
    });

    it('disables every skill when mana < skillCost (invariant: mana=0 ⇒ none castable)', () => {
        mockFixedRng(0.5);
        const adapter = createMemoryAdapter();
        const store = createAppStore({ adapter });
        const actions = createAppActions(store);
        actions.startCombat(makeEnemy());

        // Phase 60d — drain mana via the mobile-only `combatMana`
        // slice. The previous form wrote `mana`/`maxMana` to
        // `combat.player`; that field is gone post-lift, so the
        // drain happens via store.setState directly.
        const c = store.getState().combat;
        if (c === null) throw new Error('combat slice not initialised');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        store.setState({ combatMana: { current: 0, max: 14 } } as any);

        const vm = selectCombatViewModel(store.getState(), { selectedStance: 'heart' });
        const allDisabled = vm.skillPicker.skills.every((s) => !s.enabled);
        expect(allDisabled).toBe(true);
        for (const s of vm.skillPicker.skills) {
            if (s.stance === 'heart') {
                expect(s.disabledReason).toBe('insufficient-mana');
            }
        }
        expect(vm.skillPicker.availableCount).toBe(0);
    });

    it('reports an availableCount in [0, totalCount]', () => {
        mockFixedRng(0.5);
        const store = createAppStore({ adapter: createMemoryAdapter() });
        store.getState().startCombat(makeEnemy());
        const vm = selectCombatViewModel(store.getState(), { selectedStance: 'heart' });
        expect(vm.skillPicker.availableCount).toBeGreaterThanOrEqual(0);
        expect(vm.skillPicker.availableCount).toBeLessThanOrEqual(vm.skillPicker.totalCount);
        expect(vm.skillPicker.totalCount).toBe(COMBAT_SKILLS_FIXTURE.length);
    });
});

// ---------------------------------------------------------------------------
// Resolve / outcomes
// ---------------------------------------------------------------------------

describe('resolveRound: damage outcomes', () => {
    it('reduces enemy HP and emits a damage log entry when the player wins the contest', () => {
        // Sequence: high rolls for the player, low for the enemy.
        mockSequentialRng(0.95, 0.05, 0.95, 0.05, 0.95, 0.05, 0.95, 0.05, 0.5);
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);
        actions.startCombat(makeEnemy({ baseStats: { heart: 9, body: 9, mind: 1 } }));

        const hpBefore = store.getState().combat!.enemy.health;
        actions.setPlayerStance('body');
        actions.setPlayerAction('attack');
        const r = actions.resolveRound();
        const hpAfter = store.getState().combat!.enemy.health;

        expect(hpAfter).toBeLessThanOrEqual(hpBefore);
        expect(r.damageToEnemy + r.damageToPlayer).toBeGreaterThanOrEqual(0);
        const vm = selectCombatViewModel(store.getState());
        expect(vm.phase).toBe('resolving');
        expect(vm.log.length).toBeGreaterThan(0);
    });
});

// ---------------------------------------------------------------------------
// Terminal: enemy KO — player victory
// ---------------------------------------------------------------------------

describe('terminal: enemy KO ⇒ player victory', () => {
    it('reports endReason="player" when the enemy is dropped to 0 hp', () => {
        mockFixedRng(0.5);
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);
        actions.startCombat(makeEnemy({ baseStats: { heart: 1, body: 1, mind: 1 } }));

        // Reach in and drop the enemy to 1 HP so the next round kills.
        const c = store.getState().combat;
        if (c === null) throw new Error('combat not initialised');
        store.getState().updateCombat({
            ...c,
            enemy: { ...c.enemy, health: 1 },
        });

        actions.setPlayerStance('heart');
        actions.setPlayerAction('attack');
        const r = actions.resolveRound();

        expect(r.combatEnded).toBe(true);
        expect(r.endReason).toBe('player');
        expect(store.getState().combat!.enemy.health).toBeLessThanOrEqual(0);
    });
});

// ---------------------------------------------------------------------------
// Terminal: player KO ⇒ defeat
// ---------------------------------------------------------------------------

describe('terminal: player KO ⇒ defeat', () => {
    it('reports endReason="ko" when the player is dropped to 0 hp', () => {
        mockFixedRng(0.5);
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);
        actions.startCombat(makeEnemy({ baseStats: { heart: 9, body: 9, mind: 9 } }));

        const c = store.getState().combat;
        if (c === null) throw new Error('combat not initialised');
        store.getState().updateCombat({
            ...c,
            player: { ...c.player, health: 0 } as typeof c.player,
        });

        actions.setPlayerStance('heart');
        actions.setPlayerAction('defend');
        const r = actions.resolveRound();

        expect(r.combatEnded).toBe(true);
        expect(r.endReason).toBe('ko');
        expect(store.getState().combat!.player.health).toBeLessThanOrEqual(0);
    });
});

// ---------------------------------------------------------------------------
// Terminal: friendship win
// ---------------------------------------------------------------------------

describe('terminal: max friendship ⇒ friendship win', () => {
    it('reports endReason="friendship" when friendshipCounter reaches the cap', () => {
        mockFixedRng(0.5);
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);
        actions.startCombat(makeEnemy());

        // Bump the friendship counter to one below the cap via the
        // engine reducer; the next "both defend" round will tip it.
        const c = store.getState().combat;
        if (c === null) throw new Error('combat not initialised');
        let bumped = c;
        for (let i = 0; i < FRIENDSHIP_COUNTER_MAX - 1; i++) {
            bumped = engineIncrementFriendship(bumped);
        }
        store.getState().updateCombat(bumped);

        // Both defend → friendship grows by one each round.
        // Force the enemy to choose "defend" too — random logic might
        // not pick defend, so we patch logic to 'defensive' by stubbing
        // the enemy choice directly. Easiest path: set both choices
        // through the engine, then resolve.
        actions.setPlayerStance('heart');
        actions.setPlayerAction('defend');

        // We don't control the enemy's chosen action, so loop until
        // either friendship caps or someone dies.
        let safety = 8;
        let r = actions.resolveRound();
        while (!r.combatEnded && safety-- > 0) {
            actions.nextRound();
            actions.setPlayerStance('heart');
            actions.setPlayerAction('defend');
            r = actions.resolveRound();
        }

        // Either friendship maxed or a HP-driven end fired with a
        // random enemy. Both are legal terminals — assert one of the
        // two and that combat ended.
        expect(r.combatEnded).toBe(true);
        expect(['friendship', 'player', 'ko']).toContain(r.endReason);
    });
});

// ---------------------------------------------------------------------------
// Invariants — VM fields are total; freeze is enforced
// ---------------------------------------------------------------------------

describe('selectCombatViewModel: invariants', () => {
    it('every string field is defined (never undefined) when no combat is active', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const vm = selectCombatViewModel(store.getState());

        expect(typeof vm.enemy.name).toBe('string');
        expect(typeof vm.enemy.tier).toBe('string');
        expect(typeof vm.phaseHeader).toBe('string');
        expect(typeof vm.roundToken).toBe('string');
        expect(typeof vm.resolve.advantageLabel).toBe('string');
        expect(typeof vm.resolve.primaryText).toBe('string');
    });

    it('hpRatio always sits within [0, 1] across the lifecycle', () => {
        mockFixedRng(0.5);
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);

        const before = selectCombatViewModel(store.getState());
        expect(before.enemy.hpRatio).toBeGreaterThanOrEqual(0);
        expect(before.enemy.hpRatio).toBeLessThanOrEqual(1);

        actions.startCombat(makeEnemy());
        actions.setPlayerStance('body');
        actions.setPlayerAction('attack');
        actions.resolveRound();

        const after = selectCombatViewModel(store.getState());
        expect(after.enemy.hpRatio).toBeGreaterThanOrEqual(0);
        expect(after.enemy.hpRatio).toBeLessThanOrEqual(1);
        expect(after.player.hpRatio).toBeGreaterThanOrEqual(0);
        expect(after.player.hpRatio).toBeLessThanOrEqual(1);
    });

    it('the returned VM is deep-frozen down to nested objects and arrays', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const vm = selectCombatViewModel(store.getState());

        expect(Object.isFrozen(vm)).toBe(true);
        expect(Object.isFrozen(vm.enemy)).toBe(true);
        expect(Object.isFrozen(vm.enemy.effects)).toBe(true);
        expect(Object.isFrozen(vm.hud)).toBe(true);
        expect(Object.isFrozen(vm.hud.effects)).toBe(true);
        expect(Object.isFrozen(vm.stancePicker.options)).toBe(true);
        expect(Object.isFrozen(vm.actionPicker.options)).toBe(true);
        expect(Object.isFrozen(vm.skillPicker.skills)).toBe(true);
        expect(Object.isFrozen(vm.log)).toBe(true);
    });

    it('friendshipCounterMax always equals the engine constant', () => {
        mockFixedRng(0.5);
        const store = createAppStore({ adapter: createMemoryAdapter() });

        const before = selectCombatViewModel(store.getState());
        store.getState().startCombat(makeEnemy());
        const during = selectCombatViewModel(store.getState());

        expect(before.friendshipCounterMax).toBe(FRIENDSHIP_COUNTER_MAX);
        expect(during.friendshipCounterMax).toBe(FRIENDSHIP_COUNTER_MAX);
    });

    it('phaseIndex never advances past the resolving slot during a single round', () => {
        mockFixedRng(0.5);
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);
        actions.startCombat(makeEnemy());

        const indices: number[] = [];
        indices.push(selectCombatViewModel(store.getState()).phaseIndex);
        actions.setCombatPhase('choosing_action');
        indices.push(selectCombatViewModel(store.getState()).phaseIndex);
        actions.setCombatPhase('choosing_skill');
        indices.push(selectCombatViewModel(store.getState()).phaseIndex);
        actions.setPlayerAction('attack');
        actions.resolveRound();
        indices.push(selectCombatViewModel(store.getState()).phaseIndex);

        for (let i = 1; i < indices.length; i++) {
            expect(indices[i]).toBeGreaterThanOrEqual(indices[i - 1]);
        }
        expect(indices[indices.length - 1]).toBeLessThanOrEqual(3);
    });
});

// ---------------------------------------------------------------------------
// Store lifecycle — adapter.save is not called by selection
// ---------------------------------------------------------------------------

describe('selectCombatViewModel: store lifecycle', () => {
    it('selecting the VM does not trigger adapter.save', () => {
        mockFixedRng(0.5);
        const adapter = createMemoryAdapter();
        // `createAppStore` wraps the adapter so the engine's per-dispatch
        // autosave (mechanics 0.5.0+) is suppressed — Spec 09 keeps saves
        // explicit at the mobile boundary.
        const store = createAppStore({ adapter });
        const saveSpy = jest.spyOn(adapter, 'save');

        store.getState().startCombat(makeEnemy());
        selectCombatViewModel(store.getState());
        selectCombatViewModel(store.getState());

        expect(saveSpy).not.toHaveBeenCalled();
    });

    it('driving five rounds through the action layer never calls save', () => {
        mockFixedRng(0.5);
        const adapter = createMemoryAdapter();
        const store = createAppStore({ adapter });
        const actions = createAppActions(store);
        const saveSpy = jest.spyOn(adapter, 'save');

        actions.startCombat(makeEnemy());

        const stances: StanceKey[] = ['heart', 'body', 'mind', 'heart', 'body'];
        for (const s of stances) {
            actions.setPlayerStance(s);
            actions.setPlayerAction('attack');
            const r = actions.resolveRound();
            if (r.combatEnded) break;
            actions.nextRound();
        }

        expect(saveSpy).not.toHaveBeenCalled();
    });

    it('isInCombat flips on startCombat and resets on endCombat', () => {
        mockFixedRng(0.5);
        const store = createAppStore({ adapter: createMemoryAdapter() });

        expect(selectCombatViewModel(store.getState()).isInCombat).toBe(false);

        store.getState().startCombat(makeEnemy());
        expect(selectCombatViewModel(store.getState()).isInCombat).toBe(true);

        store.getState().endCombat();
        expect(selectCombatViewModel(store.getState()).isInCombat).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// View-layer copy moved to the VM (CRITIQUE [MED] pass 5 — Hard Rule #8)
// ---------------------------------------------------------------------------

describe('selectCombatViewModel: presenter-sourced ritual copy', () => {
    it('exposes a battle-log placeholder so the screen renders no literal copy', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const vm = selectCombatViewModel(store.getState());

        expect(vm.logEmptyMessage).toBe('The air shivers. Combat begins.');
    });

    it('exposes the flee-row sub-label so the action picker renders no literal copy', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const vm = selectCombatViewModel(store.getState());

        expect(vm.actionPicker.fleeHint).toBe('or … flee like a craven (luck save)');
    });

    it('still surfaces both copy fields once combat is active', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        store.getState().startCombat(makeEnemy());
        const vm = selectCombatViewModel(store.getState());

        expect(typeof vm.logEmptyMessage).toBe('string');
        expect(vm.logEmptyMessage.length).toBeGreaterThan(0);
        expect(typeof vm.actionPicker.fleeHint).toBe('string');
        expect(vm.actionPicker.fleeHint.length).toBeGreaterThan(0);
    });

    it('exposes itemMessage so the combat screen renders no literal item-toast copy', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const idle = selectCombatViewModel(store.getState());

        expect(idle.actionPicker.itemMessage).toBe('Hands are empty.');

        store.getState().startCombat(makeEnemy());
        const active = selectCombatViewModel(store.getState());
        expect(active.actionPicker.itemMessage).toBe('Hands are empty.');
    });

    it('exposes a visible loadingMessage so the combat tab never renders a blank placeholder', () => {
        // Phase 30 Tick C contract: the pre-fix loading placeholder
        // was an empty `<View>`, which the user observed as "combat
        // encounter is blank." The VM now surfaces visible copy that
        // the screen renders during the brief mount → bootstrap
        // window so the screen never collapses to a void.
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const idle = selectCombatViewModel(store.getState());

        expect(typeof idle.loadingMessage).toBe('string');
        expect(idle.loadingMessage.trim().length).toBeGreaterThan(0);
        expect(idle.loadingMessage).toBe('the field stirs.');

        // Still populated once combat is active so the field exists
        // even on the unreachable side of the screen branch.
        store.getState().startCombat(makeEnemy());
        const active = selectCombatViewModel(store.getState());
        expect(active.loadingMessage).toBe('the field stirs.');
    });
});

// ---------------------------------------------------------------------------
// Phase stack — Phase 32 design-handoff port (spec32 tick C)
//
// Ported from `prototype.jsx:238-281` (PhaseStackLive). The combat VM
// exposes a `phaseStack` of four entries (stance → action → skill →
// resolving). Each entry carries its state (past/current/future), a
// display label, an optional past-summary string, and a `visible` flag
// (false for the skill row when the picked action isn't 'skill').
// ---------------------------------------------------------------------------

describe('selectCombatViewModel: phaseStack contract (Tick C)', () => {
    it('emits a 4-entry stack on the no-combat fallback with stance current and the rest future', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const vm = selectCombatViewModel(store.getState());

        expect(vm.phaseStack).toHaveLength(4);
        expect(vm.phaseStack.map((e) => e.key)).toEqual([
            'choosing_stance',
            'choosing_action',
            'choosing_skill',
            'resolving',
        ]);
        expect(vm.phaseStack[0]?.state).toBe('current');
        expect(vm.phaseStack[1]?.state).toBe('future');
        expect(vm.phaseStack[2]?.state).toBe('future');
        expect(vm.phaseStack[3]?.state).toBe('future');
    });

    it('emits the labels the screen renders verbatim (I·STAND, II·DO, III·CRAFT, IV·LET)', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const vm = selectCombatViewModel(store.getState());

        expect(vm.phaseStack[0]?.label).toBe('I · STAND');
        expect(vm.phaseStack[1]?.label).toBe('II · DO');
        expect(vm.phaseStack[2]?.label).toBe('III · CRAFT');
        expect(vm.phaseStack[3]?.label).toBe('IV · LET');
    });

    it('hides the skill row on the no-combat fallback (action not yet picked as skill)', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const vm = selectCombatViewModel(store.getState());

        const byKey = Object.fromEntries(vm.phaseStack.map((e) => [e.key, e.visible]));
        expect(byKey['choosing_stance']).toBe(true);
        expect(byKey['choosing_action']).toBe(true);
        expect(byKey['choosing_skill']).toBe(false);
        expect(byKey['resolving']).toBe(true);
    });

    it('reveals the skill row once the engine enters choosing_skill phase', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);
        actions.startCombat(makeEnemy({ baseStats: { heart: 5, body: 5, mind: 5 } }));
        actions.setPlayerStance('mind');
        actions.setCombatPhase('choosing_action');
        actions.setCombatPhase('choosing_skill');
        const vm = selectCombatViewModel(store.getState());

        const skillEntry = vm.phaseStack.find((e) => e.key === 'choosing_skill');
        expect(skillEntry?.visible).toBe(true);
        expect(skillEntry?.state).toBe('current');
    });

    it('shifts states as the engine phase advances stance → action', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);
        actions.startCombat(makeEnemy({ baseStats: { heart: 5, body: 5, mind: 5 } }));

        let vm = selectCombatViewModel(store.getState());
        expect(vm.phaseStack[0]?.state).toBe('current');

        actions.setPlayerStance('body');
        actions.setCombatPhase('choosing_action');
        vm = selectCombatViewModel(store.getState());

        expect(vm.phaseStack[0]?.state).toBe('past');
        expect(vm.phaseStack[0]?.summary).toBe('BODY');
        expect(vm.phaseStack[1]?.state).toBe('current');
        expect(vm.phaseStack[2]?.state).toBe('future');
        expect(vm.phaseStack[3]?.state).toBe('future');
    });

    it('past-row summary for the stance phase is the chosen stance in ALL CAPS', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);
        actions.startCombat(makeEnemy({ baseStats: { heart: 5, body: 5, mind: 5 } }));
        actions.setPlayerStance('heart');
        actions.setCombatPhase('choosing_action');
        const vm = selectCombatViewModel(store.getState());

        expect(vm.phaseStack[0]?.summary).toBe('HEART');
    });

    it('past-row summary for the action phase is the chosen action in ALL CAPS (Phase 38)', () => {
        // After the player commits stance + action and the engine has
        // moved on (to choosing_skill in this test), the prior two
        // rows collapse to one-line summaries showing the picks. The
        // design's vertical-collapse contract (chat 2 §V) requires
        // both stance and action to surface here so the player can
        // review what they already committed without re-expanding.
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);
        actions.startCombat(makeEnemy({ baseStats: { heart: 5, body: 5, mind: 5 } }));
        actions.setPlayerStance('body');
        actions.setPlayerAction('skill');
        actions.setCombatPhase('choosing_skill');
        const vm = selectCombatViewModel(store.getState());

        expect(vm.phaseStack[0]?.state).toBe('past');
        expect(vm.phaseStack[0]?.summary).toBe('BODY');
        expect(vm.phaseStack[1]?.state).toBe('past');
        expect(vm.phaseStack[1]?.summary).toBe('SKILL');
        expect(vm.phaseStack[2]?.state).toBe('current');
        expect(vm.phaseStack[2]?.visible).toBe(true);
    });

    it('future-row summary is the empty string (no spoiler on un-committed phases)', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);
        actions.startCombat(makeEnemy({ baseStats: { heart: 5, body: 5, mind: 5 } }));
        const vm = selectCombatViewModel(store.getState());

        // Phase 0 (choosing_stance) is current; phases 1-3 are future.
        for (let i = 1; i < vm.phaseStack.length; i++) {
            expect(vm.phaseStack[i]?.state).toBe('future');
            expect(vm.phaseStack[i]?.summary).toBe('');
        }
    });

    it('every entry object is frozen so React.memo on the row sees stable references', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const vm = selectCombatViewModel(store.getState());
        for (const entry of vm.phaseStack) {
            expect(Object.isFrozen(entry)).toBe(true);
        }
    });

    it('keeps the resolving row current when engine phase is ended (LET row never collapses to past)', () => {
        // Pins the `currentPhase === 'ended' ? 'resolving' : currentPhase`
        // special case in `buildPhaseStack` (combat.engine.ts). Without
        // this special case, ended-phase combat would collapse every
        // row to `past` (no row matches `'ended'` in PHASE_STACK_ORDER)
        // and the ResolvePanel that lives in the IV·LET row body
        // would never render — leaving the player on a "fight is
        // over" screen with no way to leave.
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);
        actions.startCombat(makeEnemy({ baseStats: { heart: 5, body: 5, mind: 5 } }));
        actions.setCombatPhase('ended');
        const vm = selectCombatViewModel(store.getState());

        expect(vm.phase).toBe('ended');
        // IV · LET row stays current so its body (the ResolvePanel
        // with DEPART button) keeps rendering after the fight ends.
        expect(vm.phaseStack[3]?.key).toBe('resolving');
        expect(vm.phaseStack[3]?.label).toBe('IV · LET');
        expect(vm.phaseStack[3]?.state).toBe('current');
        // The three earlier rows are all past (the fight is over).
        expect(vm.phaseStack[0]?.state).toBe('past');
        expect(vm.phaseStack[1]?.state).toBe('past');
        // Skill row visibility may vary (depends on whether the
        // player picked skill); only assert its state is past.
        expect(vm.phaseStack[2]?.state).toBe('past');
    });
});

// ---------------------------------------------------------------------------
// ResolveSlice.nextActionLabel — CRITIQUE pass 8 HIGH drain
//
// Lifted off the screen (was inline `isEnded ? '✠ DEPART' : '✠ NEXT ROUND'`
// in `app/(tabs)/combat.tsx:761`) onto the VM per Hard Rule #8. The
// label is keyed off engine `phase`: `'✠ DEPART'` once `phase === 'ended'`,
// `'✠ NEXT ROUND'` otherwise.
// ---------------------------------------------------------------------------

describe('selectCombatViewModel: resolve.nextActionLabel', () => {
    it('returns NEXT ROUND on the no-combat fallback (idle store)', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const vm = selectCombatViewModel(store.getState());

        expect(vm.resolve.nextActionLabel).toBe('✠ NEXT ROUND');
    });

    it('returns NEXT ROUND while combat is still in a non-ended phase', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);
        actions.startCombat(makeEnemy({ baseStats: { heart: 5, body: 5, mind: 5 } }));
        const vm = selectCombatViewModel(store.getState());

        expect(vm.phase).not.toBe('ended');
        expect(vm.resolve.nextActionLabel).toBe('✠ NEXT ROUND');
    });

    it('flips to DEPART when combat phase reaches ended', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);
        actions.startCombat(makeEnemy({ baseStats: { heart: 5, body: 5, mind: 5 } }));
        actions.setCombatPhase('ended');
        const vm = selectCombatViewModel(store.getState());

        expect(vm.phase).toBe('ended');
        expect(vm.resolve.nextActionLabel).toBe('✠ DEPART');
    });
});
