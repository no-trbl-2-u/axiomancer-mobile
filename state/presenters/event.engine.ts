/**
 * Screen-level presenter for `app/(tabs)/event.tsx`.
 *
 * Stub per Spec 03 step (2). Spec 08 replaces the fixture with real
 * engine reads (active `MapEvent` / `UniqueEvent` and the choice
 * resolutions exposed by the engine's quest system).
 *
 * VM is *data only*; the screen resolves icons and accent colours
 * from the choice's `iconKey` and stable `accentKey`.
 */

import type { GameStore } from 'axiomancer-mechanics';

import { freezeViewModel } from './freeze';

export type EventVariant = 'encounter' | 'boss' | 'quest' | 'rest' | 'gather';
export type ChoiceAccentKey = 'blood' | 'sulfur' | 'parchment' | 'bone' | 'rust';

export interface EventChoice {
    /** Stable engine action ID. */
    id: string;
    /** Primary label, e.g. `'FIGHT'`. */
    label: string;
    /** Sub-label, e.g. `'Mind Test · 14'`. */
    sub: string;
    /** Icon key the screen maps to an `ActionIcon` kind. */
    iconKey: string;
    /** Accent palette key (component resolves to `AXM.<key>`). */
    accentKey: ChoiceAccentKey;
    /** Whether this choice is currently selectable. */
    enabled: boolean;
}

export interface EventViewModel {
    /** Discriminant — drives illustration & layout choice in the screen. */
    variant: EventVariant;
    /** Badge label (`'ENCOUNTER'`, `'OMEN OF DOOM'`). */
    badge: string;
    /** Badge accent palette key. */
    badgeAccentKey: ChoiceAccentKey;
    /** Display title (may contain `\n`). */
    title: string;
    /** Subtitle / flavour. */
    subtitle: string;
    /** Body paragraph. */
    body: string;
    choices: readonly EventChoice[];
    /** Optional lore quotation, or `null`. */
    lore: string | null;
}

const STUB_VM: EventViewModel = {
    variant: 'encounter',
    badge: 'ENCOUNTER',
    badgeAccentKey: 'blood',
    title: 'A FIGURE STIRS\nIN THE ROT',
    subtitle: 'something with too many joints',
    body: '',
    choices: [],
    lore: null,
};

/**
 * Returns the event view-model. **Stub** — Spec 08 wires real engine
 * reads.
 */
export function selectEventViewModel(_state: GameStore): EventViewModel {
    return freezeViewModel(STUB_VM);
}
