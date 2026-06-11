/**
 * Hermetic E2E Tests — one-economy bridges + skill learning.
 *
 * Drives `createAppStore` + the typed action layer end-to-end:
 *
 *  - hazard omens land in the next combat (hexed → Allais' Curse,
 *    banked paradox tokens → combatResources), consuming their flags;
 *  - half the unspent combat tokens carry to the next combat;
 *  - victory spoils pay shillings + fold a hazard card into the
 *    persistent deck flags;
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
import { createAppActions, TOKEN_CARRY_FLAG_PREFIX, type AppActions } from '../actions';
import { HAZARD_CARD_FLAG_PREFIX } from '../hazard/deck-flags';
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

describe('combat token carry (half, floored)', () => {
    it('endCombat banks half the unspent tokens; the next combat starts with them', () => {
        actions.startCombat(makeEnemy());
        const combat = store.getState().combat!;
        store.setState({
            combat: {
                ...combat,
                combatResources: { heart: 4, body: 3, mind: 0, fallacy: 1, paradox: 5 },
            },
        } as never);
        actions.endCombat();
        const carry = flags().find((f) => f.startsWith(TOKEN_CARRY_FLAG_PREFIX));
        // order is body:mind:heart:fallacy:paradox
        expect(carry).toBe(`${TOKEN_CARRY_FLAG_PREFIX}1:0:2:0:2`);

        actions.startCombat(makeEnemy());
        const next = store.getState().combat!;
        expect(next.combatResources).toEqual({
            heart: 2, body: 1, mind: 0, fallacy: 0, paradox: 2,
        });
        // consumed — no double-dipping on the combat after that
        expect(flags().find((f) => f.startsWith(TOKEN_CARRY_FLAG_PREFIX))).toBeUndefined();
    });

    it('banks nothing when every pool floors to zero', () => {
        actions.startCombat(makeEnemy());
        const combat = store.getState().combat!;
        store.setState({
            combat: {
                ...combat,
                combatResources: { heart: 1, body: 1, mind: 1, fallacy: 1, paradox: 1 },
            },
        } as never);
        actions.endCombat();
        expect(flags().find((f) => f.startsWith(TOKEN_CARRY_FLAG_PREFIX))).toBeUndefined();
    });
});

// ---------------------------------------------------------------------------
// Victory spoils
// ---------------------------------------------------------------------------

describe('grantVictorySpoils', () => {
    it('pays level-scaled shillings and folds a hazard card into the deck flags', () => {
        actions.startCombat(makeEnemy(2));
        const before = store.getState().player.currency;
        const cardFlagsBefore = flags().filter((f) => f.startsWith(HAZARD_CARD_FLAG_PREFIX)).length;

        const spoils = actions.grantVictorySpoils();
        expect(spoils).not.toBeNull();
        expect(spoils!.shillings).toBe(4 + 3 * 2);
        expect(store.getState().player.currency).toBe(before + spoils!.shillings);

        const cardFlagsAfter = flags().filter((f) => f.startsWith(HAZARD_CARD_FLAG_PREFIX)).length;
        if (spoils!.card !== null) {
            expect(cardFlagsAfter).toBe(cardFlagsBefore + 1);
            expect(
                flags().some((f) => f.startsWith(`${HAZARD_CARD_FLAG_PREFIX}${spoils!.card!.id}:`)),
            ).toBe(true);
        }
    });

    it('returns null outside combat and grants nothing', () => {
        const before = store.getState().player.currency;
        expect(actions.grantVictorySpoils()).toBeNull();
        expect(store.getState().player.currency).toBe(before);
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
        expect(known).toContain('ad-hominem-strike');
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
