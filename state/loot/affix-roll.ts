/**
 * Shared named-affix loot roller.
 *
 * The design contract for loot rarity is a count of *named* affixes —
 * the prefix / suffix words (e.g. "Keen", "of Clarity") that compose an
 * item's display name and carry its stat modifiers:
 *
 * - common   → 0 affixes  → "Iron Blade"
 * - uncommon → 1 affix    → "Keen Iron Blade" OR "Iron Blade of Clarity"
 * - rare     → 2 affixes  → "Keen Iron Blade of Clarity" (prefix + suffix)
 * - unique   → its 3 fixed modifiers + fixed name; no prefix/suffix
 *
 * The engine's `dropItem(id, level, rarity)` rolls the rarity's
 * *hidden base* modifiers (`MODS_PER_RARITY`) but does NOT roll named
 * affixes unless affix control is enabled or the base template bakes a
 * prefix/suffix in. The design wants named affixes ONLY (the affix count
 * is the visible affix count, no separate hidden mods), so for
 * uncommon / rare we roll through `dropItemWithAffixes` with the base
 * rarity pinned to `common` (zero hidden mods) and the prefix/suffix
 * caps set to the affix count we want, then stamp the display rarity.
 * Uniques keep the plain `dropItem(..., 'unique')` path (fixed name +
 * three fixed modifiers).
 *
 * This is the single source of loot truth shared by the dev LOOT
 * buttons and the loot-cache reward table, so every drop site rolls
 * affixes the same way.
 */

import {
    dropItem,
    dropItemWithAffixes,
    type Equipment,
} from 'axiomancer-mechanics';

/** Rarities the loot roller produces. */
export type AffixRarity = 'common' | 'uncommon' | 'rare' | 'unique';

/**
 * Named affixes per rarity. Uniques carry 3 *fixed* modifiers rather
 * than rolled prefix/suffix affixes, so their entry counts modifiers,
 * not affixes — `countNamedAffixes` returns 0 for a unique and callers
 * verifying uniques should check `rolledMods.length` instead.
 */
export const AFFIXES_PER_RARITY: Record<AffixRarity, number> = {
    common: 0,
    uncommon: 1,
    rare: 2,
    unique: 3,
};

/**
 * Count the *named* affixes (prefix + suffix) on an equipment instance.
 * This is the visible affix count that drives the rarity contract —
 * distinct from `rolledMods.length`, since a single affix can carry
 * several modifier ids.
 */
export function countNamedAffixes(item: Equipment): number {
    const hasPrefix = Boolean(item.prefixId ?? item.prefixName);
    const hasSuffix = Boolean(item.suffixId ?? item.suffixName);
    return (hasPrefix ? 1 : 0) + (hasSuffix ? 1 : 0);
}

/** A base equipment template carries baked affixes when it pins a
 * prefix or suffix the factory force-applies. Such templates can't hit
 * an exact rolled-affix count, so the procedural rarities skip them. */
export function hasBakedAffix(template: { prefixId?: string; suffixId?: string }): boolean {
    return Boolean(template.prefixId ?? template.suffixId);
}

/**
 * Roll one equipment drop carrying exactly the rarity's named-affix
 * count, with the display rarity stamped on the instance. `rng` defaults
 * to `Math.random`; pass a seeded rng for deterministic drops (the cache
 * reward table does).
 *
 * For uncommon, the single affix is randomly a prefix or a suffix.
 * Throws only if the engine factory throws (e.g. the template is below
 * `requiredLevel`); callers roll within a bounded retry and skip throws.
 */
export function rollAffixedDrop(
    templateId: string,
    playerLevel: number,
    rarity: AffixRarity,
    rng: () => number = Math.random,
): Equipment {
    if (rarity === 'unique') {
        // Fixed name + three fixed modifiers; no prefix/suffix.
        return dropItem(templateId, playerLevel, 'unique', rng) as Equipment;
    }

    if (rarity === 'common') {
        // No affixes, no modifiers — the bare base item.
        const item = dropItem(templateId, playerLevel, 'common', rng) as Equipment;
        return { ...item, rarity: 'common' };
    }

    // uncommon → 1 affix (random prefix or suffix); rare → prefix + suffix.
    let maxPrefixes: number;
    let maxSuffixes: number;
    if (rarity === 'rare') {
        maxPrefixes = 1;
        maxSuffixes = 1;
    } else if (rng() < 0.5) {
        maxPrefixes = 1;
        maxSuffixes = 0;
    } else {
        maxPrefixes = 0;
        maxSuffixes = 1;
    }

    // Roll the named affixes only: base rarity 'common' rolls zero hidden
    // modifiers, the caps roll exactly the affixes we want, then we stamp
    // the display rarity the caller asked for.
    const item = dropItemWithAffixes(templateId, playerLevel, {
        rarity: 'common',
        maxPrefixes,
        maxSuffixes,
        rng,
    }) as Equipment;
    return { ...item, rarity };
}
