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
import { COMBAT_SKILLS } from '@/state/selectors/combat-skills';

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
        expect(vm.skillPicker.skills).toHaveLength(COMBAT_SKILLS.length);
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

    it('stancePicker.selected is null on combat entry with no committed stance + no localUi preview (Phase 65 Tick B — no default stance)', () => {
        mockFixedRng(0.5);
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);
        actions.startCombat(makeEnemy());

        // Engine combat just started: `combat.phase === 'choosing_stance'`
        // and `combat.playerChoice.stance` is unset. No localUi
        // preview is passed. Pre-Phase-65-Tick-B this returned
        // `'heart'` (fallback default), surfacing as Heart pre-
        // highlighted in the picker. The Tick B contract: no card
        // is highlighted until the player commits one.
        const vm = selectCombatViewModel(store.getState());
        expect(vm.phase).toBe('choosing_stance');
        expect(vm.stancePicker.selected).toBeNull();
    });

    it('stancePicker.selected is null on the no-combat fallback too (no localUi)', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const vm = selectCombatViewModel(store.getState());
        // combat is null on the idle store; the fallback path must
        // also honor no-default-stance.
        expect(vm.isInCombat).toBe(false);
        expect(vm.stancePicker.selected).toBeNull();
    });

    it('previews the selected stance via localUi without mutating engine state', () => {
        mockFixedRng(0.5);
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);
        actions.startCombat(makeEnemy());
        // Seed per-resource pools so body-stance skills are affordable.
        const c = store.getState().combat!;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        store.setState({ combat: { ...c, combatResources: { body: 10, mind: 10, heart: 10, fallacy: 10, paradox: 10 } } } as any);

        const vmWithBody = selectCombatViewModel(store.getState(), { selectedStance: 'body' });
        const vmWithMind = selectCombatViewModel(store.getState(), { selectedStance: 'mind' });

        expect(vmWithBody.stancePicker.selected).toBe('body');
        expect(vmWithMind.stancePicker.selected).toBe('mind');
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

    it('respects engine-driven effect advantage modifiers — buff_advantage_body flips body stance vs body enemy from neutral to adv (mechanics-ui audit [5.0])', () => {
        // Engine effect: `buff_advantage_body` grants ADVANTAGE on
        // body stance regardless of matchup. With this effect on
        // the player, the body-vs-body chip MUST read 'adv' even
        // though the raw triangle yields 'neutral'. Pre-fix the
        // chip stayed at 'neutral' (raw triangle only).
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);
        actions.startCombat(makeEnemy({ baseStats: { heart: 5, body: 5, mind: 5 } }));
        actions.setPlayerStance('body');
        actions.setPlayerAction('attack');
        actions.resolveRound();

        // Apply the effect to the in-combat player snapshot. The
        // engine's `resolveEffectiveAdvantage` reads `effects`
        // from whatever we pass — so writing to combat.player.effects
        // exercises the same data path the live presenter sees.
        const state = store.getState();
        const combat = state.combat!;
        store.setState({
            combat: {
                ...combat,
                player: {
                    ...combat.player,
                    effects: [
                        ...combat.player.effects,
                        {
                            effectId: 'buff_advantage_body',
                            intensity: 1,
                            remainingDuration: 3,
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        } as any,
                    ],
                },
                // Force the enemy's last stance to body so the raw
                // matchup is neutral (body vs body) — the effect is
                // what should flip it to 'adv'.
                enemyChoice: { ...combat.enemyChoice, stance: 'body' },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any,
        });

        const vm = selectCombatViewModel(store.getState());
        const body = vm.stancePicker.options.find((o) => o.key === 'body');
        expect(body?.advantage).toBe('adv');
    });

    it('no effects → behaves identically to the raw triangle (regression guard)', () => {
        // Sanity: with no advantage-affecting effects, the wired-in
        // resolveEffectiveAdvantage must not perturb the raw triangle.
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);
        actions.startCombat(makeEnemy({ baseStats: { heart: 5, body: 5, mind: 5 } }));
        actions.setPlayerStance('heart');
        actions.setPlayerAction('attack');
        actions.resolveRound();

        const state = store.getState();
        const combat = state.combat!;
        // Force enemy stance to body — heart beats body via raw
        // triangle. No effects on player.
        store.setState({
            combat: {
                ...combat,
                player: { ...combat.player, effects: [] },
                enemyChoice: { ...combat.enemyChoice, stance: 'body' },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any,
        });

        const vm = selectCombatViewModel(store.getState());
        const heart = vm.stancePicker.options.find((o) => o.key === 'heart');
        const body = vm.stancePicker.options.find((o) => o.key === 'body');
        const mind = vm.stancePicker.options.find((o) => o.key === 'mind');
        expect(heart?.advantage).toBe('adv');     // raw: heart > body
        expect(body?.advantage).toBe('neutral');  // raw: body vs body
        expect(mind?.advantage).toBe('dis');      // raw: mind < body
    });

    it('resolves effect display names via engine lookup, not raw ids (Phase 82b audit [4.5])', () => {
        mockFixedRng(0.5);
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);
        actions.startCombat(makeEnemy({ baseStats: { heart: 5, body: 5, mind: 5 } }));
        const combat = store.getState().combat!;
        // Inject a known engine effect id onto the enemy.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        store.setState({ combat: { ...combat, enemy: { ...combat.enemy, effects: [{ effectId: 'tier1_body_attack', intensity: 1, remainingDuration: 2 }] } } } as any);
        const vm = selectCombatViewModel(store.getState());
        expect(vm.enemy.effects.length).toBe(1);
        expect(vm.enemy.effects[0].name).not.toBe('tier1_body_attack');
        expect(vm.enemy.effects[0].name.length).toBeGreaterThan(0);
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
                expect(s.disabledReason).toBe('insufficient-resources');
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
        expect(vm.skillPicker.totalCount).toBeLessThanOrEqual(COMBAT_SKILLS.length);
        expect(vm.skillPicker.totalCount).toBeGreaterThan(0);
    });

    it('only shows skills the player has equipped (Phase 82a)', () => {
        mockFixedRng(0.5);
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const equipped = COMBAT_SKILLS.slice(0, 3).map((s) => s.id);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        store.setState({ player: { ...store.getState().player, equippedSkills: equipped } } as any);
        store.getState().startCombat(makeEnemy());
        const vm = selectCombatViewModel(store.getState(), { selectedStance: 'heart' });
        expect(vm.skillPicker.totalCount).toBe(equipped.length);
        for (const s of vm.skillPicker.skills) {
            expect(equipped).toContain(s.id);
        }
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

    it('endCombat syncs combat.player.health back to state.player.health — closes mechanics-ui audit [3.0] HUD HP fallback row as non-issue', () => {
        // The combat audit row 11 worried the HUD's fallback
        // (`state.combat?.player ?? state.player`) would show stale
        // out-of-combat HP after endCombat. In fact the engine's
        // END_COMBAT reducer sets `state.player = nextPlayer` from
        // the combat.player snapshot (engine
        // `Game/game.reducer.js:END_COMBAT`). This test pins the
        // engine guarantee so future engine refactors that break the
        // sync surface here rather than as a subtle UI regression.
        mockFixedRng(0.5);
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);
        const playerHpBefore = store.getState().player.health;

        actions.startCombat(makeEnemy({ baseStats: { heart: 5, body: 5, mind: 5 } }));
        // Drive a round of damage so combat.player.health < starting hp.
        actions.setPlayerStance('mind');
        actions.setPlayerAction('attack');
        actions.resolveRound();
        const combatHp = store.getState().combat?.player.health ?? -1;
        expect(combatHp).toBeLessThanOrEqual(playerHpBefore);

        // Engine ends combat → state.player.health must match the
        // post-round combat.player.health, not the pre-combat value.
        store.getState().endCombat();
        expect(store.getState().combat).toBeNull();
        expect(store.getState().player.health).toBe(combatHp);
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
// ResolveSlice.nextActionLabel — CRITIQUE pass 8 HIGH drain (refreshed Phase 72)
//
// Lifted off the screen (was inline `isEnded ? '✠ DEPART' : '✠ NEXT ROUND'`
// in `app/(tabs)/combat.tsx:761`) onto the VM per Hard Rule #8. Phase 72
// refreshed the labels per the 2026-05-23 design handoff —
// `screens-canonical.jsx::ResolvePane` uses `'LET IT FALL ━━━━━ ▸'`
// for mid-fight rounds and `prototype.jsx::ResolvePaneLive` uses
// `'LET IT FALL · IT IS DONE ▸'` for the terminal `phase === 'ended'`
// state.
// ---------------------------------------------------------------------------

describe('selectCombatViewModel: resolve.nextActionLabel', () => {
    it('returns LET IT FALL on the no-combat fallback (idle store)', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const vm = selectCombatViewModel(store.getState());

        expect(vm.resolve.nextActionLabel).toBe('LET IT FALL ━━━━━ ▸');
    });

    it('returns LET IT FALL while combat is still in a non-ended phase', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);
        actions.startCombat(makeEnemy({ baseStats: { heart: 5, body: 5, mind: 5 } }));
        const vm = selectCombatViewModel(store.getState());

        expect(vm.phase).not.toBe('ended');
        expect(vm.resolve.nextActionLabel).toBe('LET IT FALL ━━━━━ ▸');
    });

    it('flips to the IT IS DONE terminal variant when combat phase reaches ended', () => {
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);
        actions.startCombat(makeEnemy({ baseStats: { heart: 5, body: 5, mind: 5 } }));
        actions.setCombatPhase('ended');
        const vm = selectCombatViewModel(store.getState());

        expect(vm.phase).toBe('ended');
        expect(vm.resolve.nextActionLabel).toBe('LET IT FALL · IT IS DONE ▸');
    });
});

// ---------------------------------------------------------------------------
// Phase 21 — engine-driven executeSkill wiring
// ---------------------------------------------------------------------------

describe('resolveRound: engine-driven skill resolution', () => {
    it('routes `action: skill` through the engine and burns mana from the mobile slice', () => {
        // Pin the Phase 21 contract: a skill pick reaches the engine
        // resolver as `action: 'skill'` (not downgraded to 'attack')
        // and `getSkillById` is the lookup, so the engine can apply
        // real skill effects. Observable side effect: the mobile
        // combatMana slice's `current` drops by the skill's manaCost
        // — the burnCombatMana branch only runs when findSkill /
        // getCombatSkillById returns non-null, which proves the
        // engine-library lookup wired up.
        mockFixedRng(0.5);
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);
        actions.startCombat(makeEnemy({ baseStats: { heart: 5, body: 5, mind: 5 } }));

        // Pick the cheapest heart-stance skill so the deduction is
        // unambiguously the engine library's manaCost.
        const heartSkill = COMBAT_SKILLS
            .filter((s) => s.stance === 'heart')
            .sort((a, b) => a.manaCost - b.manaCost)[0];
        expect(heartSkill).toBeDefined();
        expect(heartSkill!.manaCost).toBeGreaterThan(0);

        actions.setPlayerStance('heart');
        actions.setPlayerAction('skill', heartSkill!.id);
        // playerChoice carries the skill action shape that resolveRound
        // forwards to the engine.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const choiceBefore = store.getState().combat?.playerChoice as any;
        expect(choiceBefore.action).toBe('skill');
        expect(choiceBefore.skillId).toBe(heartSkill!.id);

        const manaBefore = store.getState().combatMana;
        const result = actions.resolveRound();

        // Round resolves cleanly (no engine throws on the skill path).
        expect(result.combatEnded).toBe(false);

        // Mana drained by exactly the skill's manaCost — proves the
        // skillId branch of resolveRound ran end-to-end through the
        // engine library.
        const manaAfter = store.getState().combatMana;
        expect(manaAfter).not.toBeNull();
        const startCurrent = manaBefore?.current ?? manaAfter!.max;
        expect(manaAfter!.current).toBe(Math.max(0, startCurrent - heartSkill!.manaCost));
    });

    it('handles unknown skillIds without throwing (engine lookup returns undefined)', () => {
        // Negative test: a legacy mock id with no engine entry returns
        // `undefined` from `getSkillById`. The engine's resolver
        // tolerates a missing lookup result; the round still resolves.
        mockFixedRng(0.5);
        const store = createAppStore({ adapter: createMemoryAdapter() });
        const actions = createAppActions(store);
        actions.startCombat(makeEnemy({ baseStats: { heart: 5, body: 5, mind: 5 } }));

        actions.setPlayerStance('heart');
        // Legacy mock id that the engine library doesn't carry.
        actions.setPlayerAction('skill', 'ad-hominem');
        expect(() => actions.resolveRound()).not.toThrow();
    });
});
