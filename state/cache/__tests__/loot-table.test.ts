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

describe('rollCacheLoot', () => {
    it('is deterministic for a fixed (level, seed, tier)', () => {
        const a = rollCacheLoot({ playerLevel: 20, seed: 99, tier: 'rich' });
        const b = rollCacheLoot({ playerLevel: 20, seed: 99, tier: 'rich' });
        expect(a.map((i) => `${i.id}:${rarityOf(i)}`)).toEqual(
            b.map((i) => `${i.id}:${rarityOf(i)}`),
        );
    });

    it('rolls real (non-placeholder) rarity, not flat common', () => {
        // Modest L1 seed 7 rolls a single rare blade — proof the engine
        // rarity table drives the drop, not a static common. Under
        // mechanics 0.22.0 a rare carries both a prefix and a suffix, so
        // the drop arrives affix-backed (e.g. "Keen Iron Blade of Focus")
        // with structured provenance the UI reads directly.
        const items = rollCacheLoot({ playerLevel: 1, seed: 7, tier: 'modest' });
        expect(items).toHaveLength(1);
        const drop = items[0];
        expect(rarityOf(drop)).toBe('rare');
        expect(drop.category).toBe('equipment');
        expect(isEquipment(drop)).toBe(true);
        if (isEquipment(drop)) {
            // Rare = prefix + suffix per the 0.22.0 affix defaults; assert
            // the structured fields rather than parsing the display name.
            expect(drop.prefixName).toBeTruthy();
            expect(drop.suffixName).toBeTruthy();
            expect(drop.prefixId).toBeTruthy();
            expect(drop.suffixId).toBeTruthy();
        }
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

    it('drops a unique relic on a rich-tier roll that hits the chance', () => {
        // Rich L50 seed 22 hits the unique chance and pulls Axiom's Edge
        // (seed refreshed for the 0.22.0 trimmed-library RNG stream).
        // Uniques stay fixed/non-procedural: no rolled prefix/suffix.
        const items = rollCacheLoot({ playerLevel: 50, seed: 22, tier: 'rich' });
        const unique = items.find((i) => rarityOf(i) === 'unique');
        expect(unique).toBeDefined();
        expect(unique?.name).toBe("Axiom's Edge");
        if (unique && isEquipment(unique)) {
            expect(unique.prefixName).toBeUndefined();
            expect(unique.suffixName).toBeUndefined();
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
