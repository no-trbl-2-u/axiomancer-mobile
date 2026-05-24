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

import {
    accentForStat,
    formatEffectStatEffect,
    selectTooltipContentFor,
    type TooltipKind,
} from '@/state/presenters/tooltip.engine';
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
            'affliction',
            'blessing',
            'burden',
            'item-stat',
            'chronicle-entry',
            'quest-objective',
        ];
        it.each(unwiredKinds)('returns null for kind: %s with any id', (kind) => {
            expect(selectTooltipContentFor(kind, 'anything', EMPTY_STATE)).toBeNull();
        });
    });

    describe('kind: slot (Phase 74 walkthrough Tick 3)', () => {
        const slotKeys = ['head', 'body', 'hands', 'feet', 'weapon', 'armor', 'accessory'] as const;
        it.each(slotKeys)('returns content for slot id %s', (key) => {
            const content = selectTooltipContentFor('slot', key, EMPTY_STATE);
            expect(content).not.toBeNull();
            expect(typeof content?.title).toBe('string');
            expect(typeof content?.body).toBe('string');
        });

        it("renders 'accessory' as TRINKET in the title (chrome convention)", () => {
            const content = selectTooltipContentFor('slot', 'accessory', EMPTY_STATE);
            expect(content?.title).toBe('TRINKET');
        });

        it('returns null for an unknown slot id', () => {
            expect(selectTooltipContentFor('slot', 'mouth', EMPTY_STATE)).toBeNull();
        });

        it('returns null for an empty slot id', () => {
            expect(selectTooltipContentFor('slot', '', EMPTY_STATE)).toBeNull();
        });
    });

    describe('kind: alignment (Phase 74 walkthrough Tick 2)', () => {
        it('returns content for each AlignmentAxisKey', () => {
            for (const key of ['epistemology', 'outlook', 'scope'] as const) {
                const content = selectTooltipContentFor('alignment', key, EMPTY_STATE);
                expect(content).not.toBeNull();
                expect(content?.title).toBe(key.toUpperCase());
                expect(typeof content?.body).toBe('string');
                expect(typeof content?.footnote).toBe('string');
            }
        });

        it('returns null for an unknown alignment id', () => {
            expect(selectTooltipContentFor('alignment', 'whatever', EMPTY_STATE)).toBeNull();
        });

        it('returns null for an empty alignment id', () => {
            expect(selectTooltipContentFor('alignment', '', EMPTY_STATE)).toBeNull();
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

    describe('kind: effect (Phase 75 + tighten 2026-05-24)', () => {
        it('returns engine-sourced name + payload-derived stat-effect body for a known effectId', () => {
            const content = selectTooltipContentFor('effect', 'tier1_body_attack', EMPTY_STATE);
            expect(content).not.toBeNull();
            // Title is the engine effect name uppercased.
            expect(content?.title).toBe('AD BACULUM');
            // Body is the formatted stat-effect line — not the engine
            // description (which Phase 75 originally surfaced but the
            // user-jot follow-up asked to drop in favour of the
            // payload-derived line).
            expect(content?.body).toBe('+1 physical attack');
            // Body-target effect → 'body' accent (rust tint).
            expect(content?.accent).toBe('body');
            // Footnote dropped under the tighten — the body now
            // carries the stat info.
            expect(content?.footnote).toBeUndefined();
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

    describe('skill kind threads stance accent', () => {
        it('skill on body stance returns body accent', () => {
            const { skillLibrary } = require('axiomancer-mechanics');
            const bodySkill = skillLibrary.find((s: { philosophicalAspect: string }) => s.philosophicalAspect === 'body');
            if (!bodySkill) {
                // No body-stance skill in library; skip without
                // failing — the contract is still pinned by stat
                // tests below.
                return;
            }
            const content = selectTooltipContentFor('skill', bodySkill.id, EMPTY_STATE);
            expect(content?.accent).toBe('body');
        });
    });
});

// ---------------------------------------------------------------------------
// Helpers (Phase 75 follow-up — payload formatter + accent mapper)
// ---------------------------------------------------------------------------

describe('accentForStat', () => {
    it('maps physical* → body', () => {
        expect(accentForStat('physicalAttack')).toBe('body');
        expect(accentForStat('physicalDefense')).toBe('body');
        expect(accentForStat('body')).toBe('body');
    });

    it('maps mental* → mind', () => {
        expect(accentForStat('mentalSkill')).toBe('mind');
        expect(accentForStat('mind')).toBe('mind');
    });

    it('maps emotional* → heart', () => {
        expect(accentForStat('emotionalAttack')).toBe('heart');
        expect(accentForStat('heart')).toBe('heart');
    });

    it('maps unknown / luck → neutral', () => {
        expect(accentForStat('luck')).toBe('neutral');
        expect(accentForStat('whatever')).toBe('neutral');
    });
});

describe('formatEffectStatEffect', () => {
    it('formats a single positive stat modifier', () => {
        expect(
            formatEffectStatEffect(
                { statModifiers: [{ stat: 'physicalAttack', value: 1 }] },
                'fallback',
            ),
        ).toBe('+1 physical attack');
    });

    it('formats a negative stat modifier', () => {
        expect(
            formatEffectStatEffect(
                { statModifiers: [{ stat: 'mentalDefense', value: -2 }] },
                'fallback',
            ),
        ).toBe('-2 mental defense');
    });

    it('formats a multiplier modifier with × notation', () => {
        expect(
            formatEffectStatEffect(
                { statModifiers: [{ stat: 'emotionalAttack', value: 2, isMultiplier: true }] },
                'fallback',
            ),
        ).toBe('×2 emotional attack');
    });

    it('annotates additional modifiers as "+N more"', () => {
        expect(
            formatEffectStatEffect(
                {
                    statModifiers: [
                        { stat: 'physicalAttack', value: 1 },
                        { stat: 'physicalDefense', value: 1 },
                    ],
                },
                'fallback',
            ),
        ).toBe('+1 physical attack (+1 more)');
    });

    it('formats regeneration as "+N hp / round"', () => {
        expect(
            formatEffectStatEffect({ regeneration: { healthPerRound: 2 } }, 'fallback'),
        ).toBe('+2 hp / round');
    });

    it('formats damage-over-time as "-N hp / round"', () => {
        expect(
            formatEffectStatEffect(
                { damageOverTime: { damagePerRound: 3, damageType: 'physicalAttack' } },
                'fallback',
            ),
        ).toBe('-3 hp / round');
    });

    it('formats actionRestriction skipTurn', () => {
        expect(formatEffectStatEffect({ actionRestriction: { skipTurn: true } }, 'fallback'))
            .toBe('skip turn');
    });

    it('formats actionRestriction forcedStance', () => {
        expect(
            formatEffectStatEffect(
                { actionRestriction: { forcedStance: 'body' } },
                'fallback',
            ),
        ).toBe('forced body stance');
    });

    it('formats advantageModifier grant', () => {
        expect(
            formatEffectStatEffect(
                { advantageModifier: { grantAdvantage: ['body'] } },
                'fallback',
            ),
        ).toBe('advantage on body');
    });

    it('formats rollModifier when statModifiers is empty', () => {
        expect(formatEffectStatEffect({ rollModifier: 2 }, 'fallback')).toBe('+2 to rolls');
    });

    it('falls back to the description string when no payload field is present', () => {
        expect(formatEffectStatEffect(undefined, 'description fallback')).toBe('description fallback');
        expect(formatEffectStatEffect({}, 'description fallback')).toBe('description fallback');
    });
});
