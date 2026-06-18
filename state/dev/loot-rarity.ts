/**
 * Dev-only "loot a real rarity drop" injection (Phase 136).
 *
 * POPULATE and ADD ITEM BY ID hand out registry-backed gear: common /
 * base equipment, unique relics, and consumables. But uncommon and
 * rare equipment are not static registry rows — the engine generates
 * them at *drop time* by rolling affixes onto a base template. So the
 * Kid (and the visual smoke path) had no honest way to inspect the
 * uncommon green-shine and rare blue-shine inventory chrome that
 * Phase 135 added.
 *
 * This module rolls a REAL uncommon / rare equipment drop straight
 * from engine truth (`dropItem(templateId, level, rarity)`), so the
 * resulting item carries genuine rolled affixes. The engine
 * (`axiomancer-mechanics` 0.22.x) records each rolled affix in the
 * item's `rolledMods` array and scales the count by rarity:
 *
 * - uncommon → 1–3 rolled affixes (always at least 1)
 * - rare     → 2–4 rolled affixes (always at least 2)
 *
 * (The brief's "uncommon = 1 / rare = 2" was the lower bound; this
 * engine version rolls a range, with those values as the floor.
 * `prefixName` / `suffixName` are not populated by this engine
 * version, so we count from `rolledMods` — the actual affix record.)
 *
 * No fake local minting, no hand-edited template objects: the only
 * rarity input is the engine's own `rarity` parameter on `dropItem`.
 * We pick a level-eligible base template (the factory throws below a
 * template's `requiredLevel`) and try a bounded number of base
 * templates until one rolls cleanly, so a single unlucky template
 * never strands the drop and the loop is never unbounded.
 *
 * Component mount is `isDevToolsEnabled()`-guarded; production never
 * reaches this.
 */

import {
    dropItem,
    equipmentTemplates,
    type EquipmentTemplate,
    type Equipment,
} from 'axiomancer-mechanics';

import type { AppStore } from '@/state/store';

/** Procedural drop rarities this dev tool can request. */
export type LootRarity = 'uncommon' | 'rare';

export interface LootRarityResult {
    /** True when a real drop was generated and pushed to inventory. */
    added: boolean;
    /** The requested rarity. */
    rarity: LootRarity;
    /** Generated item display name, or null on failure. */
    name: string | null;
    /** Count of rolled affixes (prefix + suffix), or null on failure. */
    affixCount: number | null;
    /** Human-readable reason when `added` is false. */
    reason: string | null;
}

/** Bounded attempt cap — never an unbounded retry loop (brief §40). */
const MAX_ATTEMPTS = 12;

/**
 * Count rolled affixes on an engine `Equipment` for reporting only
 * (does not drive any mechanic). This engine version records affixes
 * in `rolledMods`; the named prefix/suffix fields are unpopulated, so
 * `rolledMods.length` is the truthful affix count. Falls back to the
 * structured prefix/suffix fields for older/forward engine shapes.
 */
export function countAffixes(item: Equipment): number {
    if (item.rolledMods && item.rolledMods.length > 0) {
        return item.rolledMods.length;
    }
    const hasPrefix = Boolean(item.prefixId ?? item.prefixName);
    const hasSuffix = Boolean(item.suffixId ?? item.suffixName);
    return (hasPrefix ? 1 : 0) + (hasSuffix ? 1 : 0);
}

/** Shuffle-free deterministic-enough rotation: start at a random index
 * and walk the eligible pool, so repeated presses vary the base item
 * without an unbounded loop. */
function* rotate<T>(pool: readonly T[]): Generator<T> {
    if (pool.length === 0) return;
    const start = Math.floor(Math.random() * pool.length);
    for (let i = 0; i < pool.length; i++) {
        yield pool[(start + i) % pool.length];
    }
}

/**
 * Generate one real drop at the requested rarity and push it into the
 * player's inventory. Picks a level-eligible base template, rolls it
 * via the engine `dropItem` at the explicit rarity, and reports the
 * generated item's name + affix count. Never throws; a failure to
 * generate returns a graceful `added: false` with a visible reason.
 */
export function lootRarityItem(
    store: AppStore,
    rarity: LootRarity,
): LootRarityResult {
    try {
        const state = store.getState();
        const addItem = state.addItem;
        const playerLevel = state.player?.level ?? 1;

        const eligible: EquipmentTemplate[] = equipmentTemplates.filter(
            (t) => t.requiredLevel <= playerLevel,
        );

        if (eligible.length === 0) {
            return {
                added: false,
                rarity,
                name: null,
                affixCount: null,
                reason: `no level-eligible base template at level ${playerLevel}`,
            };
        }

        let attempts = 0;
        for (const tpl of rotate(eligible)) {
            if (attempts >= MAX_ATTEMPTS) break;
            attempts++;
            try {
                const item = dropItem(tpl.id, playerLevel, rarity) as Equipment;
                const instanceId = `${item.id}__devloot_${rarity}_${state.player.inventory.length}_${attempts}`;
                const instancedItem: Equipment = { ...item, id: instanceId };
                addItem(instancedItem);
                return {
                    added: true,
                    rarity,
                    name: instancedItem.name,
                    affixCount: countAffixes(instancedItem),
                    reason: null,
                };
            } catch {
                // This base template could not roll the requested rarity
                // (e.g. no eligible affix pool for its slot). Try the next
                // one within the bounded cap.
            }
        }

        return {
            added: false,
            rarity,
            name: null,
            affixCount: null,
            reason: `could not generate a ${rarity} drop after ${attempts} attempts`,
        };
    } catch (error) {
        console.error(`Failed to loot ${rarity} item:`, error);
        return {
            added: false,
            rarity,
            name: null,
            affixCount: null,
            reason: 'loot failed — see console',
        };
    }
}

/** Convenience wrapper — loot one real uncommon drop (1 affix). */
export function lootUncommonItemAction(store: AppStore): LootRarityResult {
    return lootRarityItem(store, 'uncommon');
}

/** Convenience wrapper — loot one real rare drop (2 affixes). */
export function lootRareItemAction(store: AppStore): LootRarityResult {
    return lootRarityItem(store, 'rare');
}
