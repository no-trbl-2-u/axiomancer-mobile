/**
 * Hermetic E2E Tests — one-economy bridges + skill learning.
 *
 * Drives `createAppStore` + the typed action layer end-to-end:
 *
 *  - hazard omens land in the next combat (hexed → Allais' Curse,
 *    banked paradox tokens → combatResources), consuming their flags;
 *  - half the unspent combat tokens carry to the next combat;
 *  - victory spoils are engine-owned: `endCombat()`'s report carries
 *    the rolled loot + granted XP, already applied to the player;
 *  - starter skills seed an empty `knownSkills` before the engine
 *    snapshots the player into the combat slice;
 *  - level-up learn offers come alignment-gated from the engine and
 *    `learnSkill` grows `knownSkills`.
 *
 * Hermetic = self-contained + deterministic + isolated.
 * See docs/testing.md for the full standard.
 */

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { createEnemy } from 'axiomancer-mechanics';

import { createAppStore } from '../store';
import { createAppActions, type AppActions } from '../actions';
import {
    HAZARD_HEXED_FLAG,
    HAZARD_TOKEN_FLAG_PREFIX,
} from '../hazard/store-actions';
import type { AppStore } from '../store';
import { createMemoryAdapter, type MemoryAdapter } from '@/test-utils/memoryAdapter';

function makeEnemy(level = 1) {
    return createEnemy({
        id: 'test-enemy',
        name: 'Test Lich',
        description: 'Stub for tests.',
        level,
        baseStats: { heart: 1, body: 1, mind: 1 },
        mapName: 'fishing-village' as never,
        logic: 'random' as never,
    });
}

let adapter: MemoryAdapter;
let store: AppStore;
let actions: AppActions;

beforeEach(() => {
    adapter = createMemoryAdapter();
    store = createAppStore({ adapter });
    actions = createAppActions(store);
});

afterEach(() => {
    jest.restoreAllMocks();
});

function flags(): readonly string[] {
    return (store.getState() as unknown as { flags: string[] }).flags ?? [];
}

function setFlags(next: string[]): void {
    store.setState({ flags: next } as never);
}

// ---------------------------------------------------------------------------
// Hazard → combat bridges
// ---------------------------------------------------------------------------

describe('combat-start bridges: hazard omens', () => {
    it('hazard-hexed opens the combat with Allais’ Curse and consumes the flag', () => {
        setFlags([...flags(), HAZARD_HEXED_FLAG]);
        actions.startCombat(makeEnemy());
        const combat = store.getState().combat!;
        expect(combat).not.toBeNull();
        const effectIds = (combat.player.effects ?? []).map((e) => e.effectId);
        expect(effectIds).toContain('debuff_hex');
        expect(flags()).not.toContain(HAZARD_HEXED_FLAG);
        // the omen surfaces in the battle log
        const logText = JSON.stringify(combat.log);
        expect(logText).toContain('Allais');
    });

    it('banked hazard paradox tokens seed combatResources and consume their flags', () => {
        setFlags([
            ...flags(),
            `${HAZARD_TOKEN_FLAG_PREFIX}1`,
            `${HAZARD_TOKEN_FLAG_PREFIX}2`,
        ]);
        actions.startCombat(makeEnemy());
        const combat = store.getState().combat!;
        expect(combat.combatResources.paradox).toBe(2);
        expect(flags().filter((f) => f.startsWith(HAZARD_TOKEN_FLAG_PREFIX))).toHaveLength(0);
    });

    it('a clean start (no omens, no carry) leaves the combat untouched', () => {
        actions.startCombat(makeEnemy());
        const combat = store.getState().combat!;
        expect(combat.combatResources).toEqual({
            heart: 0, body: 0, mind: 0, fallacy: 0, paradox: 0,
        });
        expect((combat.player.effects ?? []).map((e) => e.effectId)).not.toContain('debuff_hex');
    });
});

// ---------------------------------------------------------------------------
// Token carry between combats
// ---------------------------------------------------------------------------

describe('combat resource carry (engine-owned: fallacy/paradox only)', () => {
    it('a won combat carries unspent fallacy/paradox into the next combat seed', () => {
        actions.startCombat(makeEnemy());
        const combat = store.getState().combat!;
        store.setState({
            combat: {
                ...combat,
                combatResources: { heart: 4, body: 3, mind: 0, fallacy: 1, paradox: 5 },
                enemy: { ...combat.enemy, health: 0 }, // force a victory
            },
        } as never);
        actions.endCombat();

        // The engine carries floor(0.5×) of the skill-fuel resources only,
        // capped at 3: fallacy floor(0.5)=0 (omitted), paradox floor(2.5)=2.
        // Stance tokens (heart/body/mind) never carry.
        expect(store.getState().player.carriedResources).toEqual({ paradox: 2 });

        actions.startCombat(makeEnemy());
        const next = store.getState().combat!;
        expect(next.combatResources.paradox).toBeGreaterThanOrEqual(2);
        expect(next.combatResources.heart).toBe(0);
        expect(next.combatResources.body).toBe(0);
        expect(next.combatResources.mind).toBe(0);
        // consumed — cleared from the player once the next combat seeds it
        expect(store.getState().player.carriedResources).toBeUndefined();
    });

    it('a lost combat carries nothing', () => {
        actions.startCombat(makeEnemy());
        const combat = store.getState().combat!;
        store.setState({
            combat: {
                ...combat,
                combatResources: { heart: 0, body: 0, mind: 0, fallacy: 8, paradox: 8 },
                player: { ...combat.player, health: 0 }, // defeat
            },
        } as never);
        actions.endCombat();
        expect(store.getState().player.carriedResources ?? undefined).toBeUndefined();
    });
});

// ---------------------------------------------------------------------------
// Victory spoils — engine-owned (CombatEndReport)
// ---------------------------------------------------------------------------

describe('victory spoils come from the engine endCombat report', () => {
    it('endCombat surfaces xpGained + loot and applies them to the player', () => {
        actions.startCombat(makeEnemy(2));
        const xpBefore = store.getState().player.experience;
        const invBefore = store.getState().player.inventory.length;

        // Force the foe down so mechanics resolves a victory; the
        // engine rolls loot + XP and applies them in END_COMBAT.
        const live = store.getState();
        live.updateCombat({ ...live.combat!, enemy: { ...live.combat!.enemy, health: 0 } });

        const report = actions.endCombat();
        expect(report).not.toBeNull();
        expect(report!.outcome).toBe('victory');
        expect(report!.xpGained).toBeGreaterThan(0);

        const after = store.getState().player;
        // XP from the report is the XP applied to the player — mobile
        // adds nothing of its own.
        expect(after.experience).toBe(xpBefore + report!.xpGained);
        // Rolled loot lands in the inventory (length never shrinks;
        // stacking may fold a drop into an existing stack).
        expect(after.inventory.length).toBeGreaterThanOrEqual(invBefore);
    });

    it('endCombat outside combat reports a flee and grants nothing', () => {
        const xpBefore = store.getState().player.experience;
        const report = actions.endCombat();
        expect(report?.outcome).toBe('flee');
        expect(report?.xpGained).toBe(0);
        expect(store.getState().player.experience).toBe(xpBefore);
    });
});

// ---------------------------------------------------------------------------
// Skill learning
// ---------------------------------------------------------------------------

describe('starter skills + learn-skill flow', () => {
    it('startCombat seeds the tier-1 starter set into an empty knownSkills BEFORE the snapshot', () => {
        expect(store.getState().player.knownSkills ?? []).toHaveLength(0);
        actions.startCombat(makeEnemy());
        const known = store.getState().player.knownSkills ?? [];
        expect(known.length).toBeGreaterThan(0);
        expect(known).toContain('brace-for-impact');
        // the in-combat snapshot carries the same set — the engine
        // accepts these skills without the resolveRound bridge
        const snapshot = store.getState().combat!.player.knownSkills ?? [];
        expect(snapshot).toEqual(known);
    });

    it('getLearnableSkillOffers returns ≤3 unknown, requirement-met offers with effect + cost lines', () => {
        const offers = actions.getLearnableSkillOffers();
        expect(offers.length).toBeGreaterThan(0);
        expect(offers.length).toBeLessThanOrEqual(3);
        const known = store.getState().player.knownSkills ?? [];
        for (const offer of offers) {
            expect(known).not.toContain(offer.id);
            expect(offer.effectText.length).toBeGreaterThan(0);
            expect(offer.costText.length).toBeGreaterThan(0);
            expect(['body', 'mind', 'heart']).toContain(offer.stance);
        }
    });

    it('learnSkill grows knownSkills through the engine and is idempotent', () => {
        const offers = actions.getLearnableSkillOffers();
        const pick = offers[0];
        expect(actions.learnSkill(pick.id)).toBe(true);
        expect(store.getState().player.knownSkills).toContain(pick.id);
        // already known → engine returns the same character → false
        expect(actions.learnSkill(pick.id)).toBe(false);
    });
});
