/**
 * Tooltip presenter pins.
 *
 * Tick A authored `kind: 'stat'`. Phase 75 authored `kind: 'effect'`,
 * `kind: 'stance-chip'`, `kind: 'skill'`. All current branches read
 * engine static data; state is passed as `{}` cast to AppStoreState.
 * Later kinds (alignment, codex, slot, item-stat, …) will exercise
 * live state reads.
 */

import { describe, expect, it } from '@jest/globals';
import { skillLibrary } from 'axiomancer-mechanics';

import { selectTooltipContentFor, type TooltipKind } from '@/state/presenters/tooltip.engine';
import type { AppStoreState } from '@/state/store';

const EMPTY_STATE = {} as AppStoreState;

describe('selectTooltipContentFor', () => {
    describe('kind: stat (Tick A authored)', () => {
        it('returns HEART content with title, body, and footnote', () => {
            const content = selectTooltipContentFor('stat', 'HEART', EMPTY_STATE);
            expect(content).not.toBeNull();
            expect(content?.title).toBe('HEART');
            expect(content?.body).toContain("will to stay");
            expect(content?.footnote).toContain('morale');
        });

        it('returns BODY content', () => {
            const content = selectTooltipContentFor('stat', 'BODY', EMPTY_STATE);
            expect(content?.title).toBe('BODY');
            expect(content?.body).toContain('weight you carry');
            expect(content?.footnote).toContain('hp');
        });

        it('returns MIND content', () => {
            const content = selectTooltipContentFor('stat', 'MIND', EMPTY_STATE);
            expect(content?.title).toBe('MIND');
            expect(content?.body).toContain('discipline of attention');
            expect(content?.footnote).toContain('mana');
        });

        it('returns null for an unknown stat id', () => {
            expect(selectTooltipContentFor('stat', 'SPIRIT', EMPTY_STATE)).toBeNull();
        });

        it('returns null for an empty id', () => {
            expect(selectTooltipContentFor('stat', '', EMPTY_STATE)).toBeNull();
        });
    });

    describe('null contract for unwired kinds (later ticks)', () => {
        const unwiredKinds: TooltipKind[] = [
            'derived',
            'alignment',
            'affliction',
            'blessing',
            'slot',
            'burden',
            'item-stat',
            'chronicle-entry',
            'quest-objective',
        ];
        it.each(unwiredKinds)('returns null for kind: %s with any id', (kind) => {
            expect(selectTooltipContentFor(kind, 'anything', EMPTY_STATE)).toBeNull();
        });
    });

    describe('kind: stance-chip (Phase 75)', () => {
        it('returns ADVANTAGE content for id "adv"', () => {
            const content = selectTooltipContentFor('stance-chip', 'adv', EMPTY_STATE);
            expect(content?.title).toBe('ADVANTAGE');
            expect(content?.body).toContain('higher value');
            expect(content?.footnote).toContain('counters');
        });

        it('returns DISADVANTAGE content for id "dis"', () => {
            const content = selectTooltipContentFor('stance-chip', 'dis', EMPTY_STATE);
            expect(content?.title).toBe('DISADVANTAGE');
            expect(content?.body).toContain('lower value');
            expect(content?.footnote).toContain('falls');
        });

        it('returns null for unknown stance-chip id', () => {
            expect(selectTooltipContentFor('stance-chip', 'neutral', EMPTY_STATE)).toBeNull();
        });

        it('returns null for empty id', () => {
            expect(selectTooltipContentFor('stance-chip', '', EMPTY_STATE)).toBeNull();
        });
    });

    describe('kind: effect (Phase 75)', () => {
        it('returns engine-sourced name + description for a known effectId', () => {
            const content = selectTooltipContentFor('effect', 'tier1_body_attack', EMPTY_STATE);
            expect(content).not.toBeNull();
            // Title is the engine effect name uppercased.
            expect(content?.title).toBe('AD BACULUM');
            // Body is the verbatim engine description.
            expect(content?.body).toMatch(/argument doesn't need words/);
            // Tier-1 effect → "tier i" footnote.
            expect(content?.footnote).toBe('tier i');
        });

        it('returns null for an unknown effectId', () => {
            expect(selectTooltipContentFor('effect', 'definitely-not-an-effect', EMPTY_STATE))
                .toBeNull();
        });

        it('returns null for an empty effectId', () => {
            expect(selectTooltipContentFor('effect', '', EMPTY_STATE)).toBeNull();
        });
    });

    describe('kind: skill (Phase 75)', () => {
        it('returns engine-sourced name + description + cost/stance for a known skill id', () => {
            // Pick any known engine skill — the first one is stable.
            const first = skillLibrary[0];
            const content = selectTooltipContentFor('skill', first.id, EMPTY_STATE);
            expect(content).not.toBeNull();
            // getCombatSkillById uppercases the name.
            expect(content?.title).toBe(first.name.toUpperCase());
            expect(content?.body).toBe(first.description);
            expect(content?.footnote).toMatch(/^cost \d+ · stance (HEART|BODY|MIND)$/);
        });

        it('returns null for an unknown skill id', () => {
            expect(selectTooltipContentFor('skill', 'no-such-skill', EMPTY_STATE)).toBeNull();
        });

        it('returns null for an empty skill id', () => {
            expect(selectTooltipContentFor('skill', '', EMPTY_STATE)).toBeNull();
        });
    });
});
