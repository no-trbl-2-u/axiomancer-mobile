/**
 * Dev-only "loot a real rarity drop" injection (Phase 136).
 *
 * Four buttons roll genuine drops at a requested rarity through the
 * shared named-affix loot roller (`state/loot/affix-roll.ts`) and push
 * them to the player's inventory. Affix counts follow the design
 * contract:
 *
 * - common   → 0 named affixes → "Iron Blade"
 * - uncommon → 1 named affix   → "Keen Iron Blade" / "Iron Blade of Clarity"
 * - rare     → 2 named affixes → "Keen Iron Blade of Clarity"
 * - unique   → 3 fixed modifiers + fixed name (no prefix/suffix)
 *
 * Procedural rarities draw only from base templates with no baked-in
 * prefix/suffix (a baked affix would push the realised count past the
 * target), and we verify the realised affix count before accepting the
 * drop, so a drop is never reported at the wrong rarity. Uniques source
 * from `uniqueTemplates`.
 *
 * Component mount is `isDevToolsEnabled()`-guarded; production never
 * reaches this.
 */

import {
    equipmentTemplates,
    uniqueTemplates,
    type EquipmentTemplate,
    type UniqueItemTemplate,
    type Equipment,
} from 'axiomancer-mechanics';

import {
    rollAffixedDrop,
    countNamedAffixes,
    hasBakedAffix,
    AFFIXES_PER_RARITY,
    type AffixRarity,
} from '@/state/loot/affix-roll';
import type { AppStore } from '@/state/store';

/** Procedural drop rarities this dev tool can request. */
export type LootRarity = AffixRarity;

export interface LootRarityResult {
    /** True when a real drop was generated and pushed to inventory. */
    added: boolean;
    /** The requested rarity. */
    rarity: LootRarity;
    /** Generated item display name, or null on failure. */
    name: string | null;
    /**
     * Realised affix / modifier count for the drop — named affixes for
     * common/uncommon/rare, fixed-modifier count for unique. Null on
     * failure.
     */
    affixCount: number | null;
    /** Human-readable reason when `added` is false. */
    reason: string | null;
}

/** Bounded attempt cap — never an unbounded retry loop (brief §40). */
const MAX_ATTEMPTS = 16;

/**
 * Realised affix/modifier count for verification + reporting. Uniques
 * carry fixed modifiers (not prefix/suffix affixes), so they count
 * `rolledMods`; everything else counts named affixes.
 */
function realisedCount(item: Equipment, rarity: LootRarity): number {
    return rarity === 'unique'
        ? item.rolledMods?.length ?? 0
        : countNamedAffixes(item);
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

/** A fresh inventory-unique instance id so repeated dev drops of the
 * same base template never collapse into a single stacked row. */
function instanceId(item: Equipment, store: AppStore, rarity: LootRarity, attempt: number): string {
    const len = store.getState().player.inventory.length;
    return `${item.id}__devloot_${rarity}_${len}_${attempt}`;
}

/**
 * Generate one real drop at the requested rarity and push it into the
 * player's inventory. Picks a level-eligible base template, rolls it via
 * the shared named-affix roller, verifies the realised affix count, and
 * reports the generated item's name + count. Never throws; a failure to
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
        const target = AFFIXES_PER_RARITY[rarity];

        // Uniques source from the unique registry (their three fixed
        // mods are the point); procedural rarities draw only from
        // templates with no baked affixes so the realised affix count
        // lands on the rarity's exact target.
        const eligible: readonly (EquipmentTemplate | UniqueItemTemplate)[] =
            rarity === 'unique'
                ? uniqueTemplates.filter((t) => t.requiredLevel <= playerLevel)
                : equipmentTemplates.filter(
                      (t) => t.requiredLevel <= playerLevel && !hasBakedAffix(t),
                  );

        if (eligible.length === 0) {
            return {
                added: false,
                rarity,
                name: null,
                affixCount: null,
                reason:
                    rarity === 'unique'
                        ? `no unique relic is available at level ${playerLevel}`
                        : `no level-eligible base template at level ${playerLevel}`,
            };
        }

        let attempts = 0;
        for (const tpl of rotate(eligible)) {
            if (attempts >= MAX_ATTEMPTS) break;
            attempts++;
            try {
                const item = rollAffixedDrop(tpl.id, playerLevel, rarity);
                // Defensive: skip any drop whose realised affix count
                // doesn't match the rarity's target (e.g. an empty affix
                // pool for the slot rolled fewer than requested), so we
                // never report a wrong-rarity drop.
                if (realisedCount(item, rarity) !== target) continue;

                const instancedItem: Equipment = {
                    ...item,
                    id: instanceId(item, store, rarity, attempts),
                };
                addItem(instancedItem);
                return {
                    added: true,
                    rarity,
                    name: instancedItem.name,
                    affixCount: realisedCount(instancedItem, rarity),
                    reason: null,
                };
            } catch {
                // This base template could not roll the requested rarity
                // (e.g. below requiredLevel after a state change). Try the
                // next one within the bounded cap.
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

/** Convenience wrapper — loot one real common drop (0 affixes). */
export function lootCommonItemAction(store: AppStore): LootRarityResult {
    return lootRarityItem(store, 'common');
}

/** Convenience wrapper — loot one real uncommon drop (1 affix). */
export function lootUncommonItemAction(store: AppStore): LootRarityResult {
    return lootRarityItem(store, 'uncommon');
}

/** Convenience wrapper — loot one real rare drop (2 affixes). */
export function lootRareItemAction(store: AppStore): LootRarityResult {
    return lootRarityItem(store, 'rare');
}

/** Convenience wrapper — loot one unique relic (3 fixed modifiers). */
export function lootUniqueItemAction(store: AppStore): LootRarityResult {
    return lootRarityItem(store, 'unique');
}
