/**
 * Hermetic E2E Tests — Event art slug mapper (engine 0.7.0 surface).
 *
 * Exhaustively pins `ResolvedEvent.kind` -> `EventArtSlug`. Pure
 * unit-shape: no store, no engine call.
 */

import { describe, it, expect } from '@jest/globals';
import type { ResolvedEvent } from 'axiomancer-mechanics';

import {
    EVENT_ART_SLUGS,
    defaultBodyForEvent,
    selectEventArtSlug,
} from '@/state/presenters/event-assets';

describe('selectEventArtSlug', () => {
    it('maps non-boss encounter to "encounter"', () => {
        const ev: ResolvedEvent = {
            kind: 'encounter',
            encounter: { enemies: [{ name: 'x' }], origin: 'fishing-village:fv-3' } as never,
            isBoss: false,
        };
        expect(selectEventArtSlug(ev)).toBe('encounter');
    });

    it('maps boss encounter to "boss"', () => {
        const ev: ResolvedEvent = {
            kind: 'encounter',
            encounter: { enemies: [{ name: 'x' }], origin: 'fishing-village:fv-3' } as never,
            isBoss: true,
        };
        expect(selectEventArtSlug(ev)).toBe('boss');
    });

    it('maps rest to "rest"', () => {
        expect(selectEventArtSlug({ kind: 'rest', healed: 5 })).toBe('rest');
    });

    it('maps gathering to "gathering"', () => {
        expect(selectEventArtSlug({ kind: 'gathering', items: [] })).toBe('gathering');
    });

    it('maps loot-cache to "loot-cache"', () => {
        expect(selectEventArtSlug({ kind: 'loot-cache', items: [], currency: 0 })).toBe('loot-cache');
    });

    it('maps interaction to "interaction-generic"', () => {
        expect(selectEventArtSlug({ kind: 'interaction', npcName: 'X' })).toBe('interaction-generic');
    });

    it('maps village to "village"', () => {
        expect(selectEventArtSlug({ kind: 'village', villageName: 'X', merchants: [] })).toBe('village');
    });

    it('maps cutscene to "cutscene"', () => {
        expect(selectEventArtSlug({ kind: 'cutscene', lines: [] })).toBe('cutscene');
    });

    it('maps hazard to "hazard"', () => {
        expect(selectEventArtSlug({ kind: 'hazard', effects: [], damage: 0 })).toBe('hazard');
    });

    it('maps none to "interaction-generic" (defensive fallback)', () => {
        expect(selectEventArtSlug({ kind: 'none' })).toBe('interaction-generic');
    });

    it('every returned slug is a known EVENT_ART_SLUGS member', () => {
        const cases: ResolvedEvent[] = [
            { kind: 'encounter', encounter: { enemies: [{ name: 'x' }], origin: 'fishing-village:fv-3' } as never, isBoss: false },
            { kind: 'encounter', encounter: { enemies: [{ name: 'x' }], origin: 'fishing-village:fv-3' } as never, isBoss: true },
            { kind: 'rest', healed: 1 },
            { kind: 'gathering', items: [] },
            { kind: 'loot-cache', items: [], currency: 0 },
            { kind: 'interaction', npcName: 'X' },
            { kind: 'village', villageName: 'X', merchants: [] },
            { kind: 'cutscene', lines: [] },
            { kind: 'hazard', effects: [], damage: 0 },
            { kind: 'none' },
        ];
        for (const ev of cases) {
            expect(EVENT_ART_SLUGS).toContain(selectEventArtSlug(ev));
        }
    });
});

describe('defaultBodyForEvent', () => {
    it('returns a non-empty string for kinds that need a default', () => {
        expect(defaultBodyForEvent({ kind: 'rest', healed: 1 })).not.toBe('');
        expect(defaultBodyForEvent({ kind: 'gathering', items: [] })).not.toBe('');
        expect(defaultBodyForEvent({ kind: 'village', villageName: 'X', merchants: [] })).not.toBe('');
    });

    it('returns empty string for cutscene (caller provides lines)', () => {
        expect(defaultBodyForEvent({ kind: 'cutscene', lines: [] })).toBe('');
    });

    it('returns empty string for none', () => {
        expect(defaultBodyForEvent({ kind: 'none' })).toBe('');
    });
});
