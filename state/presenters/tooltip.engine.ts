/**
 * Tooltip content presenter.
 *
 * Pure lookup: `(kind, id, state) → { title, body, footnote? }`.
 * Returns `null` when no content is authored for the requested
 * (kind, id) pair — the calling site renders nothing and the
 * primitive stays defensive.
 *
 * Authored kinds:
 * - `'stat'` — HEART / BODY / MIND (Tick A, Phase 74).
 * - `'effect'` — engine-sourced via `lookupEffect(id)` (Phase 75).
 * - `'stance-chip'` — static ADV / DIS dice rules (Phase 75).
 * - `'skill'` — engine-sourced via `getCombatSkillById(id)` (Phase 75).
 *
 * Voice: title in uppercase mono / gothic, body in lowercase
 * chronicle (IM Fell English), footnote in mono for engine numbers.
 * Mirrors `event.engine.ts::preludeChrome` convention.
 */

import { lookupEffect } from 'axiomancer-mechanics';

import { getCombatSkillById } from '@/state/selectors/combat-skills';
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

const STANCE_CHIP_CONTENT: Record<string, TooltipContent> = {
    adv: {
        title: 'ADVANTAGE',
        body: 'roll twice this exchange, keep the higher value.',
        footnote: 'your stance counters theirs',
    },
    dis: {
        title: 'DISADVANTAGE',
        body: 'roll twice, keep the lower value.',
        footnote: 'your stance falls to theirs',
    },
};

const TIER_ROMAN: Record<number, string> = { 1: 'i', 2: 'ii', 3: 'iii' };

function tierRoman(tier: number | undefined): string {
    if (tier === undefined) return '';
    return TIER_ROMAN[tier] ?? '';
}

export function selectTooltipContentFor(
    kind: TooltipKind,
    id: string,
    // Reserved for kinds that need live state (effect-attribution,
    // alignment readings, codex entries). Current authored kinds
    // read engine static data only, so state is unused — keeping
    // the signature stable means future ticks don't have to
    // retrofit every call site.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _state: AppStoreState,
): TooltipContent | null {
    if (kind === 'stat') {
        return STAT_CONTENT[id] ?? null;
    }
    if (kind === 'stance-chip') {
        return STANCE_CHIP_CONTENT[id] ?? null;
    }
    if (kind === 'effect') {
        if (!id) return null;
        const def = lookupEffect(id);
        if (!def) return null;
        const roman = tierRoman(def.tier);
        return {
            title: def.name.toUpperCase(),
            body: def.description,
            footnote: roman ? `tier ${roman}` : undefined,
        };
    }
    if (kind === 'skill') {
        if (!id) return null;
        const skill = getCombatSkillById(id);
        if (!skill) return null;
        return {
            title: skill.name,
            body: skill.description,
            footnote: `cost ${skill.manaCost} · stance ${skill.stance.toUpperCase()}`,
        };
    }
    // All other kinds: no content authored yet — return null so
    // the caller can render nothing without crashing.
    return null;
}
