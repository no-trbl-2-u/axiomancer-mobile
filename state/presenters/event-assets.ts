/**
 * Mobile-local slug -> illustration mapping for the event modal.
 *
 * Spec 08 Q3 = B: mobile owns the slug-to-asset map. The engine
 * returns `ProcessedEvent` with a discriminant; the screen renders an
 * SVG illustration component keyed on a stable slug. If the engine
 * later adds an `art: string` field on `ProcessedEvent`, this mapper
 * is the single switch-point to swap from discriminant-derived to
 * engine-supplied slugs.
 */

import type { ProcessedEvent } from 'axiomancer-mechanics';

export const EVENT_ART_SLUGS = [
    'encounter',
    'boss',
    'rest',
    'gather',
    'treasure',
    'npc-generic',
] as const;

export type EventArtSlug = (typeof EVENT_ART_SLUGS)[number];

/**
 * Pure mapper from a `ProcessedEvent` discriminant to the mobile slug
 * the screen renders an illustration for. `'shop'` and `'quest'` reuse
 * the `'npc-generic'` slug until shop UI lands (see Phase 6 follow-ups).
 * `'none'` should never reach this mapper — callers guard via
 * `selectHasActiveEvent`.
 */
export function selectEventArtSlug(event: ProcessedEvent): EventArtSlug {
    switch (event.kind) {
        case 'encounter':
            return event.isBoss ? 'boss' : 'encounter';
        case 'rest':
            return 'rest';
        case 'gather':
            return 'gather';
        case 'treasure':
            return 'treasure';
        case 'npc':
        case 'quest':
        case 'shop':
            return 'npc-generic';
        case 'none':
            return 'npc-generic';
    }
}
