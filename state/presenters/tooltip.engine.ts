/**
 * Tooltip content presenter (Phase 74 Tick A).
 *
 * Pure lookup: `(kind, id, state) → { title, body, footnote? }`.
 * Returns `null` when no content is authored for the requested
 * (kind, id) pair — the calling site renders nothing and the
 * primitive stays defensive.
 *
 * Tick A authors content for `kind: 'stat'` only (HEART/BODY/MIND).
 * Other kinds return `null` until their wiring tick (74b–74e) lands.
 * The null contract is pinned in tests so the primitive can't be
 * crashed by an unknown id.
 *
 * Voice: title in uppercase mono / gothic, body in lowercase
 * chronicle (IM Fell English), footnote in mono for engine numbers.
 * Mirrors `event.engine.ts::preludeChrome` convention.
 */

import type { AppStoreState } from '@/state/store';

export type TooltipKind =
    | 'stat'
    | 'derived'
    | 'alignment'
    | 'affliction'
    | 'blessing'
    | 'effect'
    | 'stance-chip'
    | 'skill'
    | 'slot'
    | 'burden'
    | 'item-stat'
    | 'chronicle-entry'
    | 'quest-objective';

export interface TooltipContent {
    title: string;
    body: string;
    footnote?: string;
}

const STAT_CONTENT: Record<string, TooltipContent> = {
    HEART: {
        title: 'HEART',
        body: "the will to stay with what's difficult. governs morale, willpower, and the heart-stance damage curve.",
        footnote: '+1 morale per defend at heart stance',
    },
    BODY: {
        title: 'BODY',
        body: 'the weight you carry in the world. governs hp, physical attack, defense, and body-stance damage curves.',
        footnote: '+1 hp per body point',
    },
    MIND: {
        title: 'MIND',
        body: 'the discipline of attention. governs mana, skill cost recovery, and mind-stance damage curves.',
        footnote: '+1 mana per mind point',
    },
};

export function selectTooltipContentFor(
    kind: TooltipKind,
    id: string,
    // Reserved for later ticks — Tick A only authors `kind: 'stat'`
    // which is engine-id-driven and doesn't need state. Keeping the
    // signature stable now means Ticks B–E don't have to retrofit
    // every call site once they read live state.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _state: AppStoreState,
): TooltipContent | null {
    if (kind === 'stat') {
        return STAT_CONTENT[id] ?? null;
    }
    // All other kinds: no content authored in Tick A — return null
    // so the caller can render nothing without crashing.
    return null;
}
