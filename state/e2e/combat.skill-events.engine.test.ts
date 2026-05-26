/**
 * Phase 79 — pins the log-line mapping for every `phase: 'skill'`
 * engine event kind. Without these, the engine emits meaningful
 * events (effect-applied, blocked, heal, etc.) but the user sees
 * "nothing happened" because the presenter dropped them.
 *
 * Hermetic — drives `summarizeRoundEvents` directly with synthetic
 * `RoundEvent[]` arrays. No engine resolver or store needed.
 */

import { describe, expect, it } from '@jest/globals';
import type { RoundEvent } from 'axiomancer-mechanics';

import { summarizeRoundEvents } from '@/state/actions';

// Type-erased helper — synthetic events match the engine shape
// well enough for the presenter's discriminator chain. The cast
// keeps test signal high without re-declaring the union locally.
function ev(e: Partial<RoundEvent> & { phase: string; kind: string }): RoundEvent {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return e as any;
}

function summarize(events: RoundEvent[], playerAction?: any) {
    return summarizeRoundEvents(events, 'body', 'body', 0, playerAction);
}

describe('summarizeRoundEvents: skill-phase event coverage (Phase 79)', () => {
    it('logs skill damage as "Skill bites"', () => {
        const { logLines } = summarize([
            ev({ phase: 'skill', kind: 'damage', skillId: 'x', target: 'enemy', amount: 8, hpBefore: 10, hpAfter: 2 }),
        ]);
        expect(logLines.some((l) => l.text.includes('Skill bites') && l.text.includes('8'))).toBe(true);
    });

    it('logs skill heal as "Skill mends"', () => {
        const { logLines } = summarize([
            ev({ phase: 'skill', kind: 'heal', skillId: 'x', target: 'self', amount: 5, hpBefore: 2, hpAfter: 7 }),
        ]);
        expect(logLines.some((l) => l.text.includes('Skill mends') && l.text.includes('5'))).toBe(true);
    });

    it('logs effect-applied as "Skill binds"', () => {
        const { logLines } = summarize([
            ev({
                phase: 'skill',
                kind: 'effect-applied',
                skillId: 'x',
                appliedTo: 'enemy',
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                effect: { id: 'tier1_body_attack', name: 'Ad Baculum' } as any,
                message: 'm',
            }),
        ]);
        expect(logLines.some((l) => l.text.includes('Skill binds') && l.text.includes('Ad Baculum'))).toBe(true);
    });

    it('logs effect-resisted as "Skill falters"', () => {
        const { logLines } = summarize([
            ev({
                phase: 'skill',
                kind: 'effect-resisted',
                skillId: 'x',
                appliedTo: 'enemy',
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                effect: { id: 'tier1_body_attack', name: 'Ad Baculum' } as any,
                message: 'm',
            }),
        ]);
        expect(logLines.some((l) => l.text.includes('Skill falters') && l.text.includes('resists'))).toBe(true);
    });

    it('logs effect-rebounded as "Skill rebounds"', () => {
        const { logLines } = summarize([
            ev({
                phase: 'skill',
                kind: 'effect-rebounded',
                skillId: 'x',
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                effect: { id: 'tier1_body_attack', name: 'Ad Baculum' } as any,
                message: 'm',
            }),
        ]);
        expect(logLines.some((l) => l.text.includes('Skill rebounds') && l.text.includes('Ad Baculum'))).toBe(true);
    });

    it('logs buff-stripped as "Skill scours"', () => {
        const { logLines } = summarize([
            ev({
                phase: 'skill',
                kind: 'buff-stripped',
                skillId: 'x',
                target: 'enemy',
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                effect: { id: 'tier1_body_attack', name: 'Ad Baculum' } as any,
            }),
        ]);
        expect(logLines.some((l) => l.text.includes('Skill scours') && l.text.includes('Ad Baculum'))).toBe(true);
    });

    it('logs buff-stripped with effect=null using "a buff" fallback', () => {
        const { logLines } = summarize([
            ev({
                phase: 'skill',
                kind: 'buff-stripped',
                skillId: 'x',
                target: 'enemy',
                effect: null,
            }),
        ]);
        expect(logLines.some((l) => l.text.includes('Skill scours') && l.text.includes('a buff'))).toBe(true);
    });

    it('logs buff-converted with the engine-supplied message', () => {
        const { logLines } = summarize([
            ev({
                phase: 'skill',
                kind: 'buff-converted',
                skillId: 'x',
                effect: null,
                message: 'their wrath becomes your fuel.',
            }),
        ]);
        expect(logLines.some((l) => l.text === 'their wrath becomes your fuel.')).toBe(true);
    });

    it('logs synergy-fired as "Skill resonates"', () => {
        const { logLines } = summarize([
            ev({
                phase: 'skill',
                kind: 'synergy-fired',
                skillId: 'x',
                bonusDamage: 4,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                consumedEffectIds: { caster: [], target: [] } as any,
                consumedAllResources: false,
                consumedTokens: 0,
                clearedAllEffects: false,
            }),
        ]);
        expect(logLines.some((l) => l.text.includes('Skill resonates') && l.text.includes('+4'))).toBe(true);
    });

    describe('blocked — the critical UX line Phase 79 unblocks', () => {
        it('surfaces "not-equipped" reason in chronicle voice', () => {
            const { logLines } = summarize([
                ev({ phase: 'skill', kind: 'blocked', skillId: 'x', reason: 'not-equipped' }),
            ]);
            const line = logLines.find((l) => l.text.startsWith('Skill fails'));
            expect(line).toBeDefined();
            expect(line!.text).toContain('not equipped');
            expect(line!.severity).toBe('system');
        });

        it('surfaces "insufficient-resources" reason', () => {
            const { logLines } = summarize([
                ev({ phase: 'skill', kind: 'blocked', skillId: 'x', reason: 'insufficient-resources' }),
            ]);
            expect(logLines.some((l) => l.text.includes('lack the resources'))).toBe(true);
        });

        it('surfaces "unknown-skill" reason', () => {
            const { logLines } = summarize([
                ev({ phase: 'skill', kind: 'blocked', skillId: 'x', reason: 'unknown-skill' }),
            ]);
            expect(logLines.some((l) => l.text.includes('not in your repertoire'))).toBe(true);
        });
    });

    describe('intentionally suppressed events', () => {
        it('does not log resources-spent (engine ledger noise, not player-visible)', () => {
            const { logLines } = summarize([
                ev({
                    phase: 'skill',
                    kind: 'resources-spent',
                    skillId: 'x',
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    cost: { body: 3 } as any,
                }),
            ]);
            expect(logLines).toHaveLength(0);
        });

        it('does not log philosophical-generated', () => {
            const { logLines } = summarize([
                ev({
                    phase: 'skill',
                    kind: 'philosophical-generated',
                    skillId: 'x',
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    category: 'fallacy' as any,
                }),
            ]);
            expect(logLines).toHaveLength(0);
        });
    });

    describe('Phase 91: Two-line battle log format', () => {
        it('renders player choice line followed by effect line for stance-effects applied to player', () => {
            const { logLines } = summarize(
                [
                    ev({
                        phase: 'stance-effects',
                        kind: 'applied',
                        actor: 'player',
                        effect: { name: 'Fleeting Kindness', id: 'tier1_heart_attack' } as any,
                    }),
                ],
                'attack' // playerAction
            );

            expect(logLines).toHaveLength(2);
            expect(logLines[0].severity).toBe('info');
            expect(logLines[0].text).toBe('You chose ATTACK (Body stance).');
            expect(logLines[1].severity).toBe('effect');
            expect(logLines[1].text).toBe('Applied: Fleeting Kindness.');
        });

        it('F04 regression: connects HEART stance + ATTACK action to named effect', () => {
            const { logLines } = summarizeRoundEvents(
                [
                    ev({
                        phase: 'stance-effects',
                        kind: 'applied',
                        actor: 'player',
                        effect: { name: 'Fleeting Kindness', id: 'tier1_heart_attack' } as any,
                    }),
                ],
                'heart', // playerStance
                'mind',  // enemyStance
                0,       // friendshipDelta
                'attack' // playerAction
            );

            expect(logLines).toHaveLength(2);
            expect(logLines[0].text).toBe('You chose ATTACK (Heart stance).');
            expect(logLines[1].text).toBe('Applied: Fleeting Kindness.');
        });

        it('handles different stance and action combinations', () => {
            const { logLines } = summarizeRoundEvents(
                [
                    ev({
                        phase: 'stance-effects',
                        kind: 'applied',
                        actor: 'player',
                        effect: { name: 'Ad Baculum', id: 'tier1_body_attack' } as any,
                    }),
                ],
                'body',   // playerStance
                'heart',  // enemyStance  
                0,        // friendshipDelta
                'attack'  // playerAction
            );

            expect(logLines).toHaveLength(2);
            expect(logLines[0].text).toBe('You chose ATTACK (Body stance).');
            expect(logLines[1].text).toBe('Applied: Ad Baculum.');
        });

        it('maintains backwards compatibility for enemy effects', () => {
            const { logLines } = summarize(
                [
                    ev({
                        phase: 'stance-effects',
                        kind: 'applied',
                        actor: 'enemy',
                        effect: { name: 'Poison', id: 'poison' } as any,
                    }),
                ],
                'attack' // playerAction
            );

            expect(logLines).toHaveLength(1);
            expect(logLines[0].severity).toBe('effect');
            expect(logLines[0].text).toBe('Foe apply Poison.');
        });

        it('maintains backwards compatibility when playerAction is not provided', () => {
            const { logLines } = summarize([
                ev({
                    phase: 'stance-effects',
                    kind: 'applied',
                    actor: 'player',
                    effect: { name: 'Fleeting Kindness', id: 'tier1_heart_attack' } as any,
                }),
            ]);

            expect(logLines).toHaveLength(1);
            expect(logLines[0].severity).toBe('effect');
            expect(logLines[0].text).toBe('You apply Fleeting Kindness.');
        });
    });
});
