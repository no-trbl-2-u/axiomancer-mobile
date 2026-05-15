/**
 * Mobile-local slug -> illustration mapping for the event modal.
 *
 * Spec 08 Q3 = B: mobile owns the slug-to-asset map. The engine
 * returns a `ResolvedEvent` with a discriminant (8 kinds + 'none');
 * the screen renders an SVG illustration component keyed on a stable
 * slug. If the engine later adds an `art: string` field on
 * `ResolvedEvent`, this mapper is the single switch-point to swap
 * from discriminant-derived to engine-supplied slugs.
 *
 * Default body text falls back here when a `ResolvedEvent` payload's
 * `description` is absent (each `MapEventPayload` in the engine
 * carries an optional `description: string`).
 */

import type { ResolvedEvent } from 'axiomancer-mechanics';

export const EVENT_ART_SLUGS = [
    'encounter',
    'boss',
    'rest',
    'gathering',
    'loot-cache',
    'interaction-generic',
    'village',
    'cutscene',
    'hazard',
] as const;

export type EventArtSlug = (typeof EVENT_ART_SLUGS)[number];

/**
 * Pure mapper from a `ResolvedEvent` discriminant to the mobile slug
 * the screen renders an illustration for. `'none'` should never reach
 * this mapper — callers guard via `selectHasActiveEvent`; the fallback
 * returns `'interaction-generic'`.
 */
export function selectEventArtSlug(event: ResolvedEvent): EventArtSlug {
    switch (event.kind) {
        case 'encounter':
            return event.isBoss ? 'boss' : 'encounter';
        case 'rest':
            return 'rest';
        case 'gathering':
            return 'gathering';
        case 'loot-cache':
            return 'loot-cache';
        case 'interaction':
            return 'interaction-generic';
        case 'village':
            return 'village';
        case 'cutscene':
            return 'cutscene';
        case 'hazard':
            return 'hazard';
        case 'none':
            return 'interaction-generic';
    }
}

/**
 * Kind-keyed default body text. Used when a `ResolvedEvent`'s payload
 * `description` is absent or empty. Kept short — the screen pairs it
 * with the kind-specific title/badge from the presenter.
 */
const DEFAULT_BODY_BY_KIND: Record<ResolvedEvent['kind'], string> = {
    encounter: 'Something stirs.',
    interaction: 'A figure waits.',
    gathering: 'Useful things, here.',
    rest: 'A quiet place.',
    village: 'Roofs and smoke.',
    cutscene: '',
    hazard: 'The air turns.',
    'loot-cache': 'Forgotten goods.',
    none: '',
};

export function defaultBodyForEvent(event: ResolvedEvent): string {
    return DEFAULT_BODY_BY_KIND[event.kind] ?? '';
}
