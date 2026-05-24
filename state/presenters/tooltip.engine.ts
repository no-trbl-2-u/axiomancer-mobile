/**
 * Tooltip content presenter.
 *
 * Pure lookup: `(kind, id, state) → { title, body, footnote?, accent? }`.
 * Returns `null` when no content is authored for the requested
 * (kind, id) pair — the calling site renders nothing and the
 * primitive stays defensive.
 *
 * Authored kinds:
 * - `'stat'` — HEART / BODY / MIND (Tick A, Phase 74).
 * - `'effect'` — engine-sourced; payload-formatted (Phase 75 +
 *   user-jot tighten 2026-05-24). Body is a terse stat-effect
 *   line derived from `Effect.payload`; engine `description`
 *   is intentionally dropped per user request.
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

/**
 * Stat-stance accent for tooltip tinting (Phase 75 follow-up,
 * user-jot 2026-05-24). Maps each base stat / stance to a palette
 * key the primitive resolves to a colour. `'neutral'` is the
 * default — used for content with no clear stat tie (Tick A
 * `kind: 'stat'`, `kind: 'stance-chip'`).
 */
export type TooltipAccent = 'heart' | 'body' | 'mind' | 'neutral';

export interface TooltipContent {
    title: string;
    body: string;
    footnote?: string;
    /** Optional palette tint; primitive defaults to 'neutral'. */
    accent?: TooltipAccent;
}

const STAT_CONTENT: Record<string, TooltipContent> = {
    HEART: {
        title: 'HEART',
        body: "the will to stay with what's difficult. governs morale, willpower, and the heart-stance damage curve.",
        footnote: '+1 morale per defend at heart stance',
        accent: 'heart',
    },
    BODY: {
        title: 'BODY',
        body: 'the weight you carry in the world. governs hp, physical attack, defense, and body-stance damage curves.',
        footnote: '+1 hp per body point',
        accent: 'body',
    },
    MIND: {
        title: 'MIND',
        body: 'the discipline of attention. governs mana, skill cost recovery, and mind-stance damage curves.',
        footnote: '+1 mana per mind point',
        accent: 'mind',
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

// ---------------------------------------------------------------------------
// Effect payload formatter (Phase 75 follow-up).
//
// User-jot 2026-05-24 asked for the combat tooltip to drop the
// engine description and surface just "Name + the effect on the
// stats". The helpers below format an Effect.payload into the
// shortest line that still names what changed and by how much.
// ---------------------------------------------------------------------------

interface EffectPayloadLike {
    statModifiers?: { stat: string; value: number; isMultiplier?: boolean }[];
    damageOverTime?: { damagePerRound: number; damageType: string };
    regeneration?: { healthPerRound?: number };
    actionRestriction?: { forcedStance?: string; blockedStances?: string[]; skipTurn?: boolean };
    advantageModifier?: { grantAdvantage?: string[]; grantDisadvantage?: string[] };
    rollModifier?: number;
    defenseModifier?: number;
    reflectDamage?: number;
}

/** lowerCamel → "lower camel" (e.g. "physicalAttack" → "physical attack"). */
function statLabel(stat: string): string {
    return stat.replace(/([A-Z])/g, ' $1').toLowerCase().trim();
}

function sign(n: number): string {
    if (n > 0) return `+${n}`;
    if (n < 0) return `${n}`;
    return '0';
}

/**
 * Derive the stance accent from a stat-name prefix. Engine stat
 * vocabulary (`EffectStatTarget` in `axiomancer-mechanics/Effects/
 * types.d.ts`) splits into `physical*` (body), `mental*` (mind),
 * `emotional*` (heart). The bare stances `'heart' | 'body' | 'mind'`
 * map to themselves; `'luck'` and any other catch-all return
 * `'neutral'`.
 */
export function accentForStat(stat: string): TooltipAccent {
    if (stat === 'heart' || stat.startsWith('emotional')) return 'heart';
    if (stat === 'body' || stat.startsWith('physical')) return 'body';
    if (stat === 'mind' || stat.startsWith('mental')) return 'mind';
    return 'neutral';
}

/**
 * Format `Effect.payload` as a short stat-effect line. Picks the
 * single most-informative summand (statModifier first, then
 * regeneration, then DOT, then action restriction, then roll /
 * defense / reflect modifiers). Returns the engine `description`
 * fallback when no payload data is present — defensive only;
 * Tier-1+ engine effects all carry payload.
 */
export function formatEffectStatEffect(
    payload: EffectPayloadLike | undefined,
    fallback: string,
): string {
    if (!payload) return fallback;
    const mods = payload.statModifiers ?? [];
    if (mods.length > 0) {
        const mod = mods[0];
        const more = mods.length > 1 ? ` (+${mods.length - 1} more)` : '';
        const valueStr = mod.isMultiplier ? `×${mod.value}` : sign(mod.value);
        return `${valueStr} ${statLabel(mod.stat)}${more}`;
    }
    if (payload.regeneration?.healthPerRound !== undefined) {
        return `${sign(payload.regeneration.healthPerRound)} hp / round`;
    }
    if (payload.damageOverTime !== undefined) {
        return `${sign(-payload.damageOverTime.damagePerRound)} hp / round`;
    }
    if (payload.actionRestriction?.skipTurn) {
        return 'skip turn';
    }
    if (payload.actionRestriction?.forcedStance) {
        return `forced ${payload.actionRestriction.forcedStance} stance`;
    }
    if (payload.advantageModifier?.grantAdvantage?.length) {
        const list = payload.advantageModifier.grantAdvantage.join(' / ');
        return `advantage on ${list}`;
    }
    if (payload.advantageModifier?.grantDisadvantage?.length) {
        const list = payload.advantageModifier.grantDisadvantage.join(' / ');
        return `disadvantage on ${list}`;
    }
    if (payload.rollModifier !== undefined && payload.rollModifier !== 0) {
        return `${sign(payload.rollModifier)} to rolls`;
    }
    if (payload.defenseModifier !== undefined && payload.defenseModifier !== 0) {
        return `${sign(payload.defenseModifier)} defense`;
    }
    if (payload.reflectDamage !== undefined && payload.reflectDamage !== 0) {
        return `reflects ${payload.reflectDamage} damage`;
    }
    return fallback;
}

/** Derive the accent for an effect from its primary stat target. */
function accentForEffect(payload: EffectPayloadLike | undefined): TooltipAccent {
    if (!payload) return 'neutral';
    const firstStat = payload.statModifiers?.[0]?.stat;
    if (firstStat) return accentForStat(firstStat);
    if (payload.damageOverTime?.damageType) return accentForStat(payload.damageOverTime.damageType);
    return 'neutral';
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
        // Phase 75 follow-up (user-jot 2026-05-24): drop the
        // engine description; render just the stat-effect line.
        // The `description` is kept only as a defensive fallback
        // when payload introspection finds nothing usable (Tier-1
        // engine effects always carry payload, so this is rare).
        const body = formatEffectStatEffect(
            def.payload as EffectPayloadLike | undefined,
            def.description,
        );
        return {
            title: def.name.toUpperCase(),
            body,
            accent: accentForEffect(def.payload as EffectPayloadLike | undefined),
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
            accent: accentForStat(skill.stance),
        };
    }
    // All other kinds: no content authored yet — return null so
    // the caller can render nothing without crashing.
    return null;
}
