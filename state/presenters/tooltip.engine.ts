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

// Phase 74 follow-up — inventory walkthrough Tick 1: burden bar
// content. Single id ('burden') keys the inventory burden tooltip.
const BURDEN_CONTENT: Record<string, TooltipContent> = {
    burden: {
        title: 'BURDEN',
        body: 'the weight of what you carry, in stones. high burden slows you and saps endurance; over the cap, what you carry begins to wear on you.',
        footnote: 'shed gear to lighten',
    },
};

// Phase 74 follow-up walkthrough Tick 4 — saves & tests content.
// Keys match the kebab-case ids on `SaveOrTestRow.id` (e.g.
// `'body-save'`, `'mind-test'`). Each entry: title (existing
// chrome label), body explaining the mechanic + which stance
// scales it. Six entries total — 3 saves (passive resistance)
// + 3 tests (active difficulty check).
const DERIVED_CONTENT: Record<string, TooltipContent> = {
    'body-save': {
        title: 'BODY SAVE',
        body: 'passive resistance to physical strikes. roll target vs. attacker; higher save absorbs the hit.',
        footnote: 'scales with BODY',
    },
    'mind-save': {
        title: 'MIND SAVE',
        body: 'passive resistance to mental coercion — illusion, charm, fear. high save means the trick does not land.',
        footnote: 'scales with MIND',
    },
    'heart-save': {
        title: 'HEART SAVE',
        body: 'passive resistance to despair, grief, dread. the will to keep standing when the news is bad.',
        footnote: 'scales with HEART',
    },
    'body-test': {
        title: 'BODY TEST',
        body: 'active check against a physical difficulty — force a door, hold a rope, endure a sprint.',
        footnote: 'scales with BODY',
    },
    'mind-test': {
        title: 'MIND TEST',
        body: 'active check against a mental difficulty — recall, decipher, see through a deception.',
        footnote: 'scales with MIND',
    },
    'heart-test': {
        title: 'HEART TEST',
        body: 'active check against an emotional difficulty — convince, console, hold a vow under pressure.',
        footnote: 'scales with HEART',
    },
};

// Phase 74 follow-up walkthrough Tick 3 — equipment slot content.
// Keys match engine `EquipmentSlot` literals (`head | body | hands |
// feet | weapon | armor | accessory`). SELF equipment cells pass
// the slotKey verbatim as the tooltip id; "accessory" stays the
// engine key (the chrome label "Trinket" lives on the row, not the
// tooltip lookup).
const SLOT_CONTENT: Record<string, TooltipContent> = {
    head: {
        title: 'HEAD',
        body: 'helms, hoods, crowns. tightens what you can take to the face — defense against direct blows, mind-test bonuses for those that bear sigils.',
    },
    body: {
        title: 'BODY',
        body: 'breastplates, robes, mail. the largest hit zone; bulk goes here. carries the heaviest contribution to physical defense and burden.',
    },
    hands: {
        title: 'HANDS',
        body: 'gauntlets, gloves, wraps. shapes how you strike — sharpens physical attack, sometimes carries fingered sigils for skill cost.',
    },
    feet: {
        title: 'FEET',
        body: 'boots, sandals, none. shapes how you stand. defense in the lower line, sometimes the wherewithal to flee.',
    },
    weapon: {
        title: 'WEAPON',
        body: 'sword, ledger, censer, voice. the thing you bring to the exchange — primary contributor to physical attack and the action verb.',
    },
    armor: {
        title: 'ARMOR',
        body: 'layered over the body slot — full harness, surcoat, ritual mantle. raw defense; the heaviest single item the burden bar feels.',
    },
    accessory: {
        title: 'TRINKET',
        body: 'rings, charms, kept things. small numbers; sometimes the only place a particular blessing or save bonus appears.',
    },
};

// Phase 74 follow-up walkthrough Tick 2 — alignment axis content.
// Keys match `AlignmentAxisKey` in `state/presenters/character.engine.ts`
// (`'epistemology' | 'outlook' | 'scope'`); SELF axis chips pass
// the axisKey verbatim as the tooltip id. Each entry explains what
// the axis measures + the bucket-direction convention.
const ALIGNMENT_CONTENT: Record<string, TooltipContent> = {
    epistemology: {
        title: 'EPISTEMOLOGY',
        body: 'how you decide what is true. low trusts the felt and remembered; high trusts the measured and proven.',
        footnote: 'low ← gnostic · mid ← agnostic · high → empiric',
    },
    outlook: {
        title: 'OUTLOOK',
        body: 'whether the world is a thing to suffer or a thing to use. low expects ruin; high expects opportunity.',
        footnote: 'low ← bleak · mid ← neutral · high → ambitious',
    },
    scope: {
        title: 'SCOPE',
        body: 'who your actions are meant to serve. low keeps the self at the centre; high places the world above the self.',
        footnote: 'low ← solitary · mid ← relational · high → cosmic',
    },
    // Memoir walkthrough Tick 1 — two derived alignment chips read
    // from `state.moralMeter` + `player.baseStats`. Bands ladder
    // from RUTHLESS / STERN / UNDECLARED / BENEVOLENT / SAINTLY for
    // moral; from HEART/BODY/MIND for philosophical (dominant base
    // stat, ties land in 'UNDECLARED').
    moral: {
        title: 'MORAL ALIGNMENT',
        body: 'where your actions place you on the kindness axis. each merciful or cruel decision nudges the meter; the band on this chip is the band the world currently sees.',
        footnote: 'ruthless ← stern ← undeclared → benevolent → saintly',
    },
    philosophical: {
        title: 'PHILOSOPHICAL DOMINANCE',
        body: 'which of the three base stats — heart, body, mind — leads the others. the dominant stat colours how the world reads you; ties leave you undeclared.',
        footnote: 'derived from base stats · ties → undeclared',
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
    if (kind === 'alignment') {
        return ALIGNMENT_CONTENT[id] ?? null;
    }
    if (kind === 'slot') {
        return SLOT_CONTENT[id] ?? null;
    }
    if (kind === 'derived') {
        return DERIVED_CONTENT[id] ?? null;
    }
    if (kind === 'burden') {
        return BURDEN_CONTENT[id] ?? null;
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
