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
 * NOT engine-gated: `axiomancer-mechanics` 0.21.0 exports `dropItem`
 * (rolls rarity via the engine's `RARITY_WEIGHTS` table + rolls
 * modifiers) plus the `equipmentTemplates` / `uniqueTemplates`
 * libraries. We consume those — no local item minting, no local
 * rarity table. (`dropItemWithAffixes` is NOT re-exported at the
 * package root in 0.21.0 (runtime `undefined`), so the rolled-mod
 * `dropItem` path is the deepest engine-truth roll available.)
 *
 * Deterministic: same (playerLevel, seed, tier) → same items. A
 * mulberry32 PRNG seeded from the cache seed drives both the template
 * draws and the engine's `dropItem` rng callback, so the flow stays
 * hermetic-testable and replay-stable.
 */

import {
    dropItem,
    equipmentTemplates,
    uniqueTemplates,
    type EquipmentTemplate,
    type Item,
    type UniqueItemTemplate,
} from 'axiomancer-mechanics';

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

    const eligibleEquip: EquipmentTemplate[] = equipmentTemplates.filter(
        (t) => t.requiredLevel <= playerLevel,
    );

    const out: Item[] = [];
    if (eligibleEquip.length > 0) {
        const count = rollInt(rng, tuning.count[0], tuning.count[1]);
        for (let i = 0; i < count; i++) {
            const tpl = drawOne(eligibleEquip, rng);
            if (!tpl) continue;
            try {
                out.push(dropItem(tpl.id, playerLevel, undefined, rng) as Item);
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
                out.push(dropItem(relic.id, playerLevel, 'unique', rng) as Item);
            } catch {
                // Same defensive skip as the equipment loop.
            }
        }
    }

    return out;
}
