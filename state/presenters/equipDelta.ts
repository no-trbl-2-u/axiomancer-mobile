/**
 * Pure equip-change delta model (Phase 133).
 *
 * When the player equips, unequips, or swaps an equipment item, the
 * inventory surface should show **only what changes** — not the whole
 * item or the full character sheet. This module computes that delta
 * from engine item-instance truth and resolves human-readable labels
 * for effect IDs where the engine exposes a lookup at the package
 * root.
 *
 * Contract (from `plan/phases/phase_133_inventory_equip_change_delta_surface.md`):
 *   - Compare the candidate against the currently-equipped sibling in
 *     the same slot.
 *   - No equipped sibling → gained-only (`mode: 'equip'`).
 *   - Candidate is itself the worn item → lost-only (`mode: 'unequip'`).
 *   - Both present → gained + lost split (`mode: 'swap'`).
 *   - Show deltas only. Unchanged values never surface.
 *   - Never simulate mechanics locally; never parse affix truth out of
 *     a display name. When the engine has not published structured
 *     affix/provenance names, omit the structured label gracefully and
 *     fall back to the raw modifier ID.
 *
 * Canon terms (`VITAE` / `STANCE`) are preserved by upstream stat
 * labelling — this module emits raw stat / resource / effect keys and
 * leaves voice-register chrome to the view + tooltip layer.
 */

import {
    lookupEffect,
    type CombatResources,
    type Equipment,
    type EquipmentProcTrigger,
    type ResourceGenerationBonus,
    type StatModifier,
} from 'axiomancer-mechanics';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * Which equip operation produced this delta.
 *   - `equip`   — candidate worn into a previously-empty slot (gained only).
 *   - `unequip` — currently-worn item taken off (lost only).
 *   - `swap`    — candidate replaces a worn sibling (gained + lost).
 */
export type EquipDeltaMode = 'equip' | 'unequip' | 'swap';

/** A signed, additive stat change (e.g. `attack +2`). */
export interface StatDeltaEntry {
    stat: string;
    /** Signed net additive delta. Always non-zero (zero entries are dropped). */
    delta: number;
}

/** A modifier gained or lost. `name` is the resolved label when the
 * engine exposes one at the package root; otherwise `null` and the
 * view falls back to `id`. */
export interface ModifierDeltaEntry {
    id: string;
    name: string | null;
    /** Rolled value, when the source carried a `RolledModifier`. */
    value: number | null;
}

/** A passive / on-hit / on-defend effect gained or lost. `name` is the
 * engine effect name when resolvable, else `null`. */
export interface EffectDeltaEntry {
    id: string;
    name: string | null;
}

/** A resource interaction (start-tokens or generation bonus) gained or lost. */
export interface ResourceDeltaEntry {
    /** Stable key used for list rendering and tests. */
    key: string;
    resource: keyof CombatResources;
    /** Signed amount for start-tokens, or the generation bonus amount. */
    amount: number;
    /** `'start'` for combat-start tokens, or the generation trigger. */
    kind: 'start' | ResourceGenerationBonus['trigger'];
}

/** A keyword / affix label gained or lost. Only populated when the
 * engine item instance carries structured keyword/affix metadata; we
 * never synthesise these from a display name. */
export interface KeywordDeltaEntry {
    key: string;
    label: string;
}

/** One side (gained or lost) of the equip-change comparison. */
export interface EquipDeltaSide {
    modifiers: readonly ModifierDeltaEntry[];
    passiveEffects: readonly EffectDeltaEntry[];
    onHitEffects: readonly EffectDeltaEntry[];
    onDefendEffects: readonly EffectDeltaEntry[];
    resources: readonly ResourceDeltaEntry[];
    keywords: readonly KeywordDeltaEntry[];
}

export interface EquipDelta {
    mode: EquipDeltaMode;
    /** The other item in the comparison (the worn sibling for `equip`/`swap`
     * candidates, or the candidate itself for `unequip`). `null` for an
     * `equip` into an empty slot. */
    against: { id: string; name: string } | null;
    /** Net signed additive stat deltas, zero entries dropped. */
    stats: readonly StatDeltaEntry[];
    gained: EquipDeltaSide;
    lost: EquipDeltaSide;
    /** True when nothing actually changed (all sections empty). The view
     * can use this to suppress the whole surface. */
    isEmpty: boolean;
}

// ---------------------------------------------------------------------------
// Internal aggregation helpers
// ---------------------------------------------------------------------------

/**
 * Aggregate flat additive `statModifiers` into a stat → value map.
 * Multipliers are skipped (mirrors the Phase 35 preview convention —
 * the engine still applies multipliers on the real equip; the display
 * delta is additive-only for legibility).
 */
function aggregateStats(equipment: Equipment): Map<string, number> {
    const out = new Map<string, number>();
    for (const mod of equipment.statModifiers ?? []) {
        if (mod.isMultiplier) continue;
        out.set(mod.stat, (out.get(mod.stat) ?? 0) + mod.value);
    }
    return out;
}

function computeStatDeltas(
    candidate: Map<string, number>,
    against: Map<string, number>,
): StatDeltaEntry[] {
    const keys = new Set<string>([...candidate.keys(), ...against.keys()]);
    const out: StatDeltaEntry[] = [];
    for (const stat of keys) {
        const delta = (candidate.get(stat) ?? 0) - (against.get(stat) ?? 0);
        if (delta !== 0) out.push({ stat, delta });
    }
    out.sort((a, b) => a.stat.localeCompare(b.stat));
    return out;
}

/** Resolve an effect ID to its engine name, gracefully returning `null`
 * when the engine has no definition (e.g. content not yet published). */
function resolveEffectName(id: string): string | null {
    try {
        const def = lookupEffect(id);
        return def?.name ?? null;
    } catch {
        return null;
    }
}

/** Build a `name → count` map of rolled-modifier ids for set-difference. */
function rolledModMap(equipment: Equipment): Map<string, number> {
    const out = new Map<string, number>();
    for (const rolled of equipment.rolledMods ?? []) {
        out.set(rolled.modId, rolled.value);
    }
    return out;
}

function diffModifiers(
    fromItem: Equipment,
    notIn: Equipment,
): ModifierDeltaEntry[] {
    const present = rolledModMap(fromItem);
    const other = rolledModMap(notIn);
    const out: ModifierDeltaEntry[] = [];
    for (const [id, value] of present) {
        if (other.has(id)) continue;
        out.push({ id, name: null, value });
    }
    out.sort((a, b) => a.id.localeCompare(b.id));
    return out;
}

function diffEffectIds(
    fromList: readonly string[] | undefined,
    notInList: readonly string[] | undefined,
): EffectDeltaEntry[] {
    const exclude = new Set(notInList ?? []);
    const out: EffectDeltaEntry[] = [];
    const seen = new Set<string>();
    for (const id of fromList ?? []) {
        if (exclude.has(id) || seen.has(id)) continue;
        seen.add(id);
        out.push({ id, name: resolveEffectName(id) });
    }
    out.sort((a, b) => a.id.localeCompare(b.id));
    return out;
}

function procKey(p: EquipmentProcTrigger): string {
    return `${p.effectId}:${p.target}`;
}

function diffProcs(
    fromList: readonly EquipmentProcTrigger[] | undefined,
    notInList: readonly EquipmentProcTrigger[] | undefined,
): EffectDeltaEntry[] {
    const exclude = new Set((notInList ?? []).map(procKey));
    const out: EffectDeltaEntry[] = [];
    const seen = new Set<string>();
    for (const p of fromList ?? []) {
        const key = procKey(p);
        if (exclude.has(key) || seen.has(key)) continue;
        seen.add(key);
        out.push({ id: p.effectId, name: resolveEffectName(p.effectId) });
    }
    out.sort((a, b) => a.id.localeCompare(b.id));
    return out;
}

function resourceEntries(equipment: Equipment): Map<string, ResourceDeltaEntry> {
    const out = new Map<string, ResourceDeltaEntry>();
    const ri = equipment.resourceInteraction;
    if (ri === undefined) return out;
    for (const [resource, amount] of Object.entries(ri.combatStartTokens ?? {})) {
        if (amount === undefined || amount === 0) continue;
        const key = `start:${resource}`;
        out.set(key, {
            key,
            resource: resource as keyof CombatResources,
            amount,
            kind: 'start',
        });
    }
    for (const bonus of ri.generationBonus ?? []) {
        if (bonus.bonus === 0) continue;
        const key = `${bonus.trigger}:${bonus.resourceType}`;
        out.set(key, {
            key,
            resource: bonus.resourceType,
            amount: bonus.bonus,
            kind: bonus.trigger,
        });
    }
    return out;
}

function diffResources(fromItem: Equipment, notIn: Equipment): ResourceDeltaEntry[] {
    const present = resourceEntries(fromItem);
    const other = resourceEntries(notIn);
    const out: ResourceDeltaEntry[] = [];
    for (const [key, entry] of present) {
        if (other.has(key)) continue;
        out.push(entry);
    }
    out.sort((a, b) => a.key.localeCompare(b.key));
    return out;
}

/**
 * Keyword / affix labels. As of mechanics 0.22.0 the engine publishes
 * structured `prefixName` / `suffixName` on the `Equipment` instance
 * (rare drops carry both, uncommon one, common/unique neither), so this
 * reader now lights up on affixed drops automatically. Legacy saved
 * equipment from before 0.22.0 simply omits the fields and resolves to
 * an empty list. A `keywords` array is not part of the published
 * `Equipment` surface yet; we read it defensively via the cast so the
 * label set widens for free if mechanics adds it. We never parse affix
 * truth from the display name (brief §"Decisions made upfront").
 */
function keywordEntries(equipment: Equipment): Map<string, KeywordDeltaEntry> {
    const out = new Map<string, KeywordDeltaEntry>();
    const provenance = equipment as Equipment & {
        keywords?: readonly string[];
    };
    if (typeof provenance.prefixName === 'string' && provenance.prefixName.length > 0) {
        out.set(`prefix:${provenance.prefixName}`, {
            key: `prefix:${provenance.prefixName}`,
            label: provenance.prefixName,
        });
    }
    if (typeof provenance.suffixName === 'string' && provenance.suffixName.length > 0) {
        out.set(`suffix:${provenance.suffixName}`, {
            key: `suffix:${provenance.suffixName}`,
            label: provenance.suffixName,
        });
    }
    for (const kw of provenance.keywords ?? []) {
        if (typeof kw !== 'string' || kw.length === 0) continue;
        out.set(`kw:${kw}`, { key: `kw:${kw}`, label: kw });
    }
    return out;
}

function diffKeywords(fromItem: Equipment, notIn: Equipment): KeywordDeltaEntry[] {
    const present = keywordEntries(fromItem);
    const other = keywordEntries(notIn);
    const out: KeywordDeltaEntry[] = [];
    for (const [key, entry] of present) {
        if (other.has(key)) continue;
        out.push(entry);
    }
    out.sort((a, b) => a.key.localeCompare(b.key));
    return out;
}

function emptySide(): EquipDeltaSide {
    return {
        modifiers: [],
        passiveEffects: [],
        onHitEffects: [],
        onDefendEffects: [],
        resources: [],
        keywords: [],
    };
}

function buildSide(fromItem: Equipment, notIn: Equipment): EquipDeltaSide {
    return {
        modifiers: diffModifiers(fromItem, notIn),
        passiveEffects: diffEffectIds(fromItem.passiveEffects, notIn.passiveEffects),
        onHitEffects: diffProcs(fromItem.onHitEffects, notIn.onHitEffects),
        onDefendEffects: diffProcs(fromItem.onDefendEffects, notIn.onDefendEffects),
        resources: diffResources(fromItem, notIn),
        keywords: diffKeywords(fromItem, notIn),
    };
}

function sideIsEmpty(side: EquipDeltaSide): boolean {
    return (
        side.modifiers.length === 0 &&
        side.passiveEffects.length === 0 &&
        side.onHitEffects.length === 0 &&
        side.onDefendEffects.length === 0 &&
        side.resources.length === 0 &&
        side.keywords.length === 0
    );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Compute the equip-change delta for `candidate` against the currently
 * worn sibling (`worn`, or `null` for an empty slot).
 *
 *   - `worn === null`                  → `equip`   (gained only)
 *   - `worn.id === candidate.id`       → `unequip` (lost only)
 *   - otherwise                        → `swap`    (gained + lost)
 */
export function computeEquipDelta(
    candidate: Equipment,
    worn: Equipment | null,
): EquipDelta {
    if (worn === null) {
        const gained = buildSide(candidate, EMPTY_EQUIPMENT);
        const stats = computeStatDeltas(aggregateStats(candidate), new Map());
        const delta: EquipDelta = {
            mode: 'equip',
            against: null,
            stats,
            gained,
            lost: emptySide(),
            isEmpty: stats.length === 0 && sideIsEmpty(gained),
        };
        return delta;
    }

    if (worn.id === candidate.id) {
        const lost = buildSide(candidate, EMPTY_EQUIPMENT);
        const stats = computeStatDeltas(new Map(), aggregateStats(candidate));
        const delta: EquipDelta = {
            mode: 'unequip',
            against: { id: candidate.id, name: candidate.name },
            stats,
            gained: emptySide(),
            lost,
            isEmpty: stats.length === 0 && sideIsEmpty(lost),
        };
        return delta;
    }

    const stats = computeStatDeltas(aggregateStats(candidate), aggregateStats(worn));
    const gained = buildSide(candidate, worn);
    const lost = buildSide(worn, candidate);
    return {
        mode: 'swap',
        against: { id: worn.id, name: worn.name },
        stats,
        gained,
        lost,
        isEmpty:
            stats.length === 0 && sideIsEmpty(gained) && sideIsEmpty(lost),
    };
}

/** A zero-valued equipment used as the "other" side when computing a
 * one-sided (equip-into-empty / unequip) delta. */
const EMPTY_EQUIPMENT: Equipment = {
    id: '__none__',
    name: '',
    description: '',
    category: 'equipment',
    slot: 'weapon',
    rarity: 'common',
    requiredLevel: 0,
};

export type { StatModifier };
