/**
 * Phase 74 Tick A — tooltip presenter pins.
 *
 * Hermetic; the presenter ignores state in Tick A (kind: 'stat'
 * lookup is engine-id-driven). State is passed as `{}` cast to
 * AppStoreState for now — Ticks B–E will exercise live reads.
 */

import { describe, expect, it } from '@jest/globals';

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

    describe('null contract for unwired kinds (Ticks B-E)', () => {
        const unwiredKinds: TooltipKind[] = [
            'derived',
            'alignment',
            'affliction',
            'blessing',
            'effect',
            'stance-chip',
            'skill',
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
});
