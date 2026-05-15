/**
 * Hermetic E2E Tests — Event art slug mapper.
 *
 * Exhaustively pins `ProcessedEvent.kind` -> `EventArtSlug`. Pure
 * unit-shape: no store, no engine call.
 */

import { describe, it, expect } from '@jest/globals';
import type { ProcessedEvent } from 'axiomancer-mechanics';

import {
    EVENT_ART_SLUGS,
    selectEventArtSlug,
} from '@/state/presenters/event-assets';

describe('selectEventArtSlug', () => {
    it('maps non-boss encounter to "encounter"', () => {
        const ev: ProcessedEvent = {
            kind: 'encounter',
            encounter: { enemy: { name: 'x' } as never },
            isBoss: false,
        };
        expect(selectEventArtSlug(ev)).toBe('encounter');
    });

    it('maps boss encounter to "boss"', () => {
        const ev: ProcessedEvent = {
            kind: 'encounter',
            encounter: { enemy: { name: 'x' } as never },
            isBoss: true,
        };
        expect(selectEventArtSlug(ev)).toBe('boss');
    });

    it('maps rest to "rest"', () => {
        expect(selectEventArtSlug({ kind: 'rest', healed: 5 })).toBe('rest');
    });

    it('maps gather to "gather"', () => {
        expect(selectEventArtSlug({ kind: 'gather', items: [] })).toBe('gather');
    });

    it('maps treasure to "treasure"', () => {
        expect(selectEventArtSlug({ kind: 'treasure', items: [], currency: 0 })).toBe('treasure');
    });

    it('maps npc to "npc-generic"', () => {
        expect(selectEventArtSlug({ kind: 'npc', npcName: 'X' })).toBe('npc-generic');
    });

    it('maps quest to "npc-generic"', () => {
        expect(
            selectEventArtSlug({ kind: 'quest', questName: 'X', startedNew: true }),
        ).toBe('npc-generic');
    });

    it('maps shop to "npc-generic"', () => {
        expect(selectEventArtSlug({ kind: 'shop', npcName: 'X' })).toBe('npc-generic');
    });

    it('maps none to "npc-generic" (defensive fallback)', () => {
        expect(selectEventArtSlug({ kind: 'none' })).toBe('npc-generic');
    });

    it('every returned slug is a known EVENT_ART_SLUGS member', () => {
        const cases: ProcessedEvent[] = [
            { kind: 'encounter', encounter: { enemy: { name: 'x' } as never }, isBoss: false },
            { kind: 'encounter', encounter: { enemy: { name: 'x' } as never }, isBoss: true },
            { kind: 'rest', healed: 1 },
            { kind: 'gather', items: [] },
            { kind: 'treasure', items: [], currency: 0 },
            { kind: 'npc', npcName: 'X' },
            { kind: 'quest', questName: 'X', startedNew: false },
            { kind: 'shop', npcName: 'X' },
            { kind: 'none' },
        ];
        for (const ev of cases) {
            expect(EVENT_ART_SLUGS).toContain(selectEventArtSlug(ev));
        }
    });
});
