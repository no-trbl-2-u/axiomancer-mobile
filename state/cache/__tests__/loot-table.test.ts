/**
 * Phase 129 — loot-cache reward table unit tests.
 *
 * Pins the engine-truth roller: determinism, the player-level gate,
 * tier-scaled item count, rolled (non-placeholder) rarity, and the
 * `rich`-tier unique-relic path. Seeds chosen so the assertions are
 * exact; no timers, no network. If `axiomancer-mechanics` reshuffles
 * its template library these exact-seed expectations may shift — they
 * are intentionally engine-truth-coupled to prove real rolls.
 */

import { describe, expect, it } from '@jest/globals';
import { equipmentTemplates, isEquipment, type Item, type ItemRarity } from 'axiomancer-mechanics';

import { CACHE_LOOT_TUNING, rollCacheLoot } from '../loot-table';

/** Read a rolled item's rarity, narrowing through the engine guard. */
function rarityOf(item: Item): ItemRarity | undefined {
    return isEquipment(item) ? item.rarity : undefined;
}

/** Named affix count (prefix + suffix) for an equipment drop. */
function namedAffixes(item: Item): number {
    if (!isEquipment(item)) return 0;
    return (item.prefixName ? 1 : 0) + (item.suffixName ? 1 : 0);
}

/** Expected named-affix count per rarity (uniques carry fixed mods, not
 * prefix/suffix affixes, so they expect 0 named affixes). */
const AFFIXES_FOR: Record<string, number> = {
    common: 0,
    uncommon: 1,
    rare: 2,
    unique: 0,
};

describe('rollCacheLoot', () => {
    it('is deterministic for a fixed (level, seed, tier)', () => {
        const a = rollCacheLoot({ playerLevel: 20, seed: 99, tier: 'rich' });
        const b = rollCacheLoot({ playerLevel: 20, seed: 99, tier: 'rich' });
        expect(a.map((i) => `${i.id}:${rarityOf(i)}`)).toEqual(
            b.map((i) => `${i.id}:${rarityOf(i)}`),
        );
    });

    it('every equipment drop carries the named affixes its rarity demands', () => {
        // Core contract: common 0 affixes, uncommon 1, rare 2 (prefix +
        // suffix). Sweep a range of seeds so the invariant is exercised
        // across all rolled rarities.
        for (let seed = 1; seed < 60; seed++) {
            const items = rollCacheLoot({ playerLevel: 30, seed, tier: 'rich' });
            for (const drop of items) {
                if (!isEquipment(drop)) continue;
                const rarity = rarityOf(drop) ?? 'common';
                expect(namedAffixes(drop)).toBe(AFFIXES_FOR[rarity]);
                if (rarity === 'rare') {
                    expect(drop.prefixName).toBeTruthy();
                    expect(drop.suffixName).toBeTruthy();
                }
            }
        }
    });

    it('rolls real rarity, not flat common', () => {
        // Across many seeds the engine weight table must produce at least
        // one above-common drop — proof rarity is rolled, not static.
        const seen = new Set<string>();
        for (let seed = 1; seed < 60; seed++) {
            for (const drop of rollCacheLoot({ playerLevel: 30, seed, tier: 'rich' })) {
                const r = rarityOf(drop);
                if (r) seen.add(r);
            }
        }
        expect([...seen].some((r) => r !== 'common')).toBe(true);
    });

    it('scales item count by tier', () => {
        const modest = rollCacheLoot({ playerLevel: 1, seed: 7, tier: 'modest' });
        const rich = rollCacheLoot({ playerLevel: 1, seed: 3, tier: 'rich' });
        expect(modest.length).toBeGreaterThanOrEqual(CACHE_LOOT_TUNING.modest.count[0]);
        expect(modest.length).toBeLessThanOrEqual(CACHE_LOOT_TUNING.modest.count[1]);
        expect(rich.length).toBeGreaterThanOrEqual(CACHE_LOOT_TUNING.rich.count[0]);
        expect(rich.length).toBeLessThanOrEqual(CACHE_LOOT_TUNING.rich.count[1]);
    });

    it('respects the player-level gate (no template above level rolls)', () => {
        const items = rollCacheLoot({ playerLevel: 1, seed: 3, tier: 'rich' });
        const maxRequired = Math.max(
            ...equipmentTemplates
                .filter((t) => items.some((i) => i.id === t.id))
                .map((t) => t.requiredLevel),
            0,
        );
        expect(maxRequired).toBeLessThanOrEqual(1);
    });

    it('drops a fixed unique relic on a rich-tier roll that hits the chance', () => {
        // Scan seeds for a rich-tier roll that hits the unique chance, then
        // assert the relic is fixed/non-procedural: a registry name, no
        // rolled prefix/suffix, and its three fixed modifiers.
        let unique: Item | undefined;
        for (let seed = 1; seed < 200 && !unique; seed++) {
            unique = rollCacheLoot({ playerLevel: 50, seed, tier: 'rich' }).find(
                (i) => rarityOf(i) === 'unique',
            );
        }
        expect(unique).toBeDefined();
        if (unique && isEquipment(unique)) {
            expect(unique.name).toBeTruthy();
            expect(unique.prefixName).toBeFalsy();
            expect(unique.suffixName).toBeFalsy();
            expect(unique.rolledMods ?? []).toHaveLength(3);
        }
    });

    it('never drops a unique on the modest tier (uniqueChance 0)', () => {
        expect(CACHE_LOOT_TUNING.modest.uniqueChance).toBe(0);
        for (let seed = 1; seed < 60; seed++) {
            const items = rollCacheLoot({ playerLevel: 50, seed, tier: 'modest' });
            expect(items.some((i) => rarityOf(i) === 'unique')).toBe(false);
        }
    });

    it('returns an empty set when no template clears the level gate', () => {
        const items = rollCacheLoot({ playerLevel: 0, seed: 5, tier: 'modest' });
        expect(items).toEqual([]);
    });
});
