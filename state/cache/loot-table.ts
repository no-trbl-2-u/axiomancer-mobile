/**
 * Loot-cache reward table (Phase 129).
 *
 * The Reliquary used to hand out a fixed roster of base-rarity gear
 * (`templateToEquipment`, always `rarity: 'common'`, no rolled mods)
 * plus flat shillings — the same three items every visit. This module
 * rolls a REAL loot/relic reward set straight from engine truth so a
 * cache drops level-appropriate equipment with rolled rarity and
 * modifiers, with a `rich`-tier chance at a unique relic.
 *
 * Drops carry NAMED affixes by rarity — common 0, uncommon 1, rare 2
 * (prefix + suffix) — through the shared loot roller
 * (`state/loot/affix-roll.ts`), so a cache drop reads "Keen Iron Blade
 * of Clarity" rather than a bare base item. The per-drop rarity is
 * drawn from the engine's own `rarityWeightTable`; uniques come from the
 * `rich`-tier relic chance.
 *
 * Deterministic: same (playerLevel, seed, tier) → same items. A
 * mulberry32 PRNG seeded from the cache seed drives the template draws,
 * the rarity draw, and the roller's affix rng, so the flow stays
 * hermetic-testable and replay-stable.
 */

import {
    equipmentTemplates,
    rarityWeightTable,
    uniqueTemplates,
    type EquipmentTemplate,
    type Item,
    type ItemRarity,
    type UniqueItemTemplate,
} from 'axiomancer-mechanics';

import { rollAffixedDrop, hasBakedAffix, type AffixRarity } from '@/state/loot/affix-roll';

/** Reward depth. `modest` = early locales, `rich` = deeper locales. */
export type CacheLootTier = 'modest' | 'rich';

export interface RollCacheLootOptions {
    /** Player level — the factory throws below a template's requiredLevel. */
    playerLevel: number;
    /** Deterministic seed (cache seed). */
    seed: number;
    /** Reward depth: scales item count + the unique-relic chance. */
    tier: CacheLootTier;
}

interface TierTuning {
    /** Inclusive [min, max] equipment drops. */
    count: readonly [number, number];
    /** Per-cache chance (0..1) of an extra unique relic. */
    uniqueChance: number;
}

/**
 * Tier tuning. `modest` leans 1–2 pieces and no relic; `rich` leans
 * 2–3 pieces with a 12% unique chance. The engine owns RARITY inside
 * each drop — tier only scales quantity + the relic gamble, so the
 * rarity table the candidate asked for is the engine's own.
 */
export const CACHE_LOOT_TUNING: Readonly<Record<CacheLootTier, TierTuning>> = Object.freeze({
    modest: { count: [1, 2], uniqueChance: 0 },
    rich: { count: [2, 3], uniqueChance: 0.12 },
});

/** mulberry32 — small deterministic PRNG (same family as the other
 * mobile minigame seed paths). */
function mulberry32(seed: number): () => number {
    let a = seed >>> 0;
    return function next(): number {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** Pick an integer in [min, max] inclusive from an rng. */
function rollInt(rng: () => number, min: number, max: number): number {
    if (max <= min) return min;
    return min + Math.floor(rng() * (max - min + 1));
}

/** Draw one element uniformly, or null when the pool is empty. */
function drawOne<T>(pool: readonly T[], rng: () => number): T | null {
    if (pool.length === 0) return null;
    return pool[Math.floor(rng() * pool.length)];
}

/** Procedural rarities (common/uncommon/rare) and their engine weights —
 * the `unique` row is dropped here because uniques come from the
 * separate `rich`-tier relic chance, not the per-drop rarity table. */
const PROCEDURAL_RARITY_WEIGHTS: ReadonlyArray<readonly [AffixRarity, number]> =
    (rarityWeightTable as ReadonlyArray<readonly [ItemRarity, number]>).filter(
        ([rarity]) => rarity !== 'unique',
    ) as ReadonlyArray<readonly [AffixRarity, number]>;

/** Draw a procedural rarity from the engine's own weight table. */
function drawProceduralRarity(rng: () => number): AffixRarity {
    const total = PROCEDURAL_RARITY_WEIGHTS.reduce((sum, [, w]) => sum + w, 0);
    let roll = rng() * total;
    for (const [rarity, weight] of PROCEDURAL_RARITY_WEIGHTS) {
        roll -= weight;
        if (roll < 0) return rarity;
    }
    return PROCEDURAL_RARITY_WEIGHTS[0][0];
}

/**
 * Roll a real loot/relic reward set from engine truth.
 *
 * - Filters `equipmentTemplates` to those the player's level clears
 *   (the factory throws otherwise).
 * - Draws a tier-scaled count of templates and rolls each via the
 *   engine `dropItem` (rarity + modifiers rolled by the engine).
 * - On `rich` tier, rolls a unique-relic chance against
 *   level-eligible `uniqueTemplates`; on a hit, appends a unique drop.
 * - Empty eligible pool (e.g. level 0) → returns `[]`; the cache then
 *   falls back to currency only. Never throws.
 */
export function rollCacheLoot(opts: RollCacheLootOptions): Item[] {
    const { playerLevel, seed, tier } = opts;
    const rng = mulberry32(seed);
    const tuning = CACHE_LOOT_TUNING[tier];

    // Exclude templates with baked-in affixes: the factory force-pins
    // those regardless of the rolled rarity, which would break the
    // rarity↔affix-count contract (e.g. a "common" arriving with an
    // affix). Procedural drops roll their affixes purely from rarity.
    const eligibleEquip: EquipmentTemplate[] = equipmentTemplates.filter(
        (t) => t.requiredLevel <= playerLevel && !hasBakedAffix(t),
    );

    const out: Item[] = [];
    if (eligibleEquip.length > 0) {
        const count = rollInt(rng, tuning.count[0], tuning.count[1]);
        for (let i = 0; i < count; i++) {
            const tpl = drawOne(eligibleEquip, rng);
            if (!tpl) continue;
            try {
                const rarity = drawProceduralRarity(rng);
                out.push(rollAffixedDrop(tpl.id, playerLevel, rarity, rng) as Item);
            } catch {
                // Level gate is pre-filtered; any residual throw (e.g. a
                // future engine change) must not strand the reward — skip.
            }
        }
    }

    if (tuning.uniqueChance > 0 && rng() < tuning.uniqueChance) {
        const eligibleUnique: UniqueItemTemplate[] = uniqueTemplates.filter(
            (t) => t.requiredLevel <= playerLevel,
        );
        const relic = drawOne(eligibleUnique, rng);
        if (relic) {
            try {
                out.push(rollAffixedDrop(relic.id, playerLevel, 'unique', rng) as Item);
            } catch {
                // Same defensive skip as the equipment loop.
            }
        }
    }

    return out;
}
