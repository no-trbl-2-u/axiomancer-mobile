/**
 * Hermetic unit tests — equip-change delta helper (Phase 133).
 *
 * `computeEquipDelta` is a pure function over engine `Equipment`
 * instances. These tests pin the contract: gained-only on equip into
 * an empty slot, lost-only on unequip, gained+lost on swap, unchanged
 * values hidden, and graceful omission of affix/keyword labels the
 * engine has not published.
 */

import { describe, expect, it } from '@jest/globals';
import { createCharacter, type Equipment, type EquipmentProcTrigger, type StatModifier } from 'axiomancer-mechanics';

import { computeEquipDelta } from '@/state/presenters/equipDelta';

function weapon(
    id: string,
    overrides: Partial<Equipment> = {},
): Equipment {
    return {
        id,
        name: id,
        description: '',
        category: 'equipment',
        slot: 'weapon',
        rarity: 'common',
        requiredLevel: 1,
        ...overrides,
    };
}

function stats(
    ...mods: ReadonlyArray<{ stat: string; value: number; isMultiplier?: boolean }>
): StatModifier[] {
    // Synthetic stat names ('attack', 'stamina', …) widen past the engine's
    // tight `EffectStatTarget` union; the helper under test only diffs by
    // stat name, so the broader literal is safe here.
    return mods.map((m) => ({ ...m })) as unknown as StatModifier[];
}

function proc(effectId: string, target: 'self' | 'opponent' = 'self'): EquipmentProcTrigger {
    return { effectId, target, baseChance: 0.1, tier: 1 as EquipmentProcTrigger['tier'] };
}

describe('computeEquipDelta: mode', () => {
    it('returns equip mode (gained only) when there is no worn sibling', () => {
        const d = computeEquipDelta(weapon('a', { statModifiers: stats({ stat: 'attack', value: 3 }) }), null);
        expect(d.mode).toBe('equip');
        expect(d.against).toBeNull();
        expect(d.stats).toEqual([{ stat: 'attack', delta: 3 }]);
        expect(d.lost.modifiers).toHaveLength(0);
    });

    it('returns unequip mode (lost only) when the candidate is the worn item', () => {
        const worn = weapon('a', { statModifiers: stats({ stat: 'attack', value: 3 }) });
        const d = computeEquipDelta(worn, worn);
        expect(d.mode).toBe('unequip');
        expect(d.against).toEqual({ id: 'a', name: 'a' });
        expect(d.stats).toEqual([{ stat: 'attack', delta: -3 }]);
        expect(d.gained.modifiers).toHaveLength(0);
    });

    it('returns swap mode (gained + lost) when candidate differs from worn', () => {
        const worn = weapon('worn', { statModifiers: stats({ stat: 'attack', value: 4 }, { stat: 'stamina', value: -1 }) });
        const cand = weapon('cand', { statModifiers: stats({ stat: 'attack', value: 5 }, { stat: 'defense', value: 2 }) });
        const d = computeEquipDelta(cand, worn);
        expect(d.mode).toBe('swap');
        expect(d.against).toEqual({ id: 'worn', name: 'worn' });
        const sorted = [...d.stats].sort((a, b) => a.stat.localeCompare(b.stat));
        expect(sorted).toEqual([
            { stat: 'attack', delta: 1 },
            { stat: 'defense', delta: 2 },
            { stat: 'stamina', delta: 1 },
        ]);
    });
});

describe('computeEquipDelta: unchanged values are hidden', () => {
    it('can compute full character-derived stat deltas when the player is provided', () => {
        const player = createCharacter({
            name: 'Pilgrim',
            level: 1,
            baseStats: { heart: 4, body: 4, mind: 4 },
        });
        const cand = weapon('body-blade', {
            statModifiers: stats({ stat: 'body', value: 2 }),
        });

        const d = computeEquipDelta(cand, null, player);
        const byStat = Object.fromEntries(d.stats.map((entry) => [entry.stat, entry.delta]));

        expect(byStat.body).toBeUndefined();
        expect(byStat.physicalAttack).toBe(2);
        expect(byStat.physicalSkill).toBe(2);
        expect(byStat.physicalDefense).toBe(6);
        expect(byStat.luck).toBeCloseTo(2 / 3);
    });

    it('drops a stat that is identical on both items', () => {
        const worn = weapon('worn', { statModifiers: stats({ stat: 'attack', value: 4 }) });
        const cand = weapon('cand', { statModifiers: stats({ stat: 'attack', value: 4 }, { stat: 'reach', value: 1 }) });
        const d = computeEquipDelta(cand, worn);
        expect(d.stats).toEqual([{ stat: 'reach', delta: 1 }]);
    });

    it('isEmpty is true when nothing changes', () => {
        const worn = weapon('worn', { statModifiers: stats({ stat: 'attack', value: 4 }) });
        const cand = weapon('cand', { statModifiers: stats({ stat: 'attack', value: 4 }) });
        const d = computeEquipDelta(cand, worn);
        expect(d.isEmpty).toBe(true);
    });

    it('ignores isMultiplier stat modifiers (additive-only display)', () => {
        const worn = weapon('worn', { statModifiers: stats({ stat: 'attack', value: 4 }) });
        const cand = weapon('cand', {
            statModifiers: stats(
                { stat: 'attack', value: 4 },
                { stat: 'attack', value: 1.5, isMultiplier: true },
                { stat: 'mind', value: 2 },
            ),
        });
        const d = computeEquipDelta(cand, worn);
        expect(d.stats).toEqual([{ stat: 'mind', delta: 2 }]);
    });
});

describe('computeEquipDelta: passive effects', () => {
    it('surfaces gained and lost passive effects, hiding shared ones', () => {
        const worn = weapon('worn', { passiveEffects: ['shared', 'old-only'] });
        const cand = weapon('cand', { passiveEffects: ['shared', 'new-only'] });
        const d = computeEquipDelta(cand, worn);
        expect(d.gained.passiveEffects.map((e) => e.id)).toEqual(['new-only']);
        expect(d.lost.passiveEffects.map((e) => e.id)).toEqual(['old-only']);
    });
});

describe('computeEquipDelta: proc hooks', () => {
    it('surfaces gained on-hit and lost on-defend hooks', () => {
        const worn = weapon('worn', { onDefendEffects: [proc('ward')] });
        const cand = weapon('cand', { onHitEffects: [proc('burn', 'opponent')] });
        const d = computeEquipDelta(cand, worn);
        expect(d.gained.onHitEffects.map((e) => e.id)).toEqual(['burn']);
        expect(d.lost.onDefendEffects.map((e) => e.id)).toEqual(['ward']);
    });
});

describe('computeEquipDelta: resource interactions', () => {
    it('surfaces gained start-tokens and lost generation bonuses', () => {
        const worn = weapon('worn', {
            resourceInteraction: { generationBonus: [{ trigger: 'hit', resourceType: 'body', bonus: 2 }] },
        });
        const cand = weapon('cand', {
            resourceInteraction: { combatStartTokens: { mind: 3 } },
        });
        const d = computeEquipDelta(cand, worn);
        expect(d.gained.resources).toEqual([
            { key: 'start:mind', resource: 'mind', amount: 3, kind: 'start' },
        ]);
        expect(d.lost.resources).toEqual([
            { key: 'hit:body', resource: 'body', amount: 2, kind: 'hit' },
        ]);
    });
});

describe('computeEquipDelta: modifiers', () => {
    it('surfaces gained/lost rolled modifiers by id with no resolved name', () => {
        const worn = weapon('worn', { rolledMods: [{ modId: 'mod-shared', value: 1 }, { modId: 'mod-old', value: 5 }] });
        const cand = weapon('cand', { rolledMods: [{ modId: 'mod-shared', value: 1 }, { modId: 'mod-new', value: 7 }] });
        const d = computeEquipDelta(cand, worn);
        expect(d.gained.modifiers).toEqual([{ id: 'mod-new', name: null, value: 7 }]);
        expect(d.lost.modifiers).toEqual([{ id: 'mod-old', name: null, value: 5 }]);
    });
});

describe('computeEquipDelta: keyword/affix graceful omission', () => {
    it('omits keyword labels when the engine instance carries no provenance', () => {
        const worn = weapon('worn', { statModifiers: stats({ stat: 'attack', value: 1 }) });
        const cand = weapon('cand', { statModifiers: stats({ stat: 'attack', value: 2 }) });
        const d = computeEquipDelta(cand, worn);
        expect(d.gained.keywords).toHaveLength(0);
        expect(d.lost.keywords).toHaveLength(0);
    });

    it('surfaces keyword labels when present on the item instance', () => {
        const worn = weapon('worn', { suffixName: 'of Ruin' });
        const cand = weapon('cand', { prefixName: 'Gilded' });
        const d = computeEquipDelta(cand, worn);
        expect(d.gained.keywords).toEqual([{ key: 'prefix:Gilded', label: 'Gilded' }]);
        expect(d.lost.keywords).toEqual([{ key: 'suffix:of Ruin', label: 'of Ruin' }]);
    });
});

describe('computeEquipDelta: mechanics 0.22.0 structured affixes', () => {
    // Mechanics 0.22.0 ships structured prefix/suffix provenance on
    // Equipment. A rare drop carries both; the delta surface must read
    // them from the engine instance, never parse the display name.
    it('reads a rare affixed drop straight off the engine instance', () => {
        const affixed = weapon('affixed-rare', {
            rarity: 'rare',
            prefixId: 'keen',
            prefixName: 'Keen',
            suffixId: 'of-focus',
            suffixName: 'of Focus',
            // The composed display name must NOT be the truth source — the
            // delta keys come from the structured fields, not this string.
            name: 'Keen Iron Blade of Focus',
        });
        const plain = weapon('plain-common', { rarity: 'common' });

        const equipFromEmpty = computeEquipDelta(affixed, null);
        expect(equipFromEmpty.gained.keywords).toEqual([
            { key: 'prefix:Keen', label: 'Keen' },
            { key: 'suffix:of Focus', label: 'of Focus' },
        ]);

        const swap = computeEquipDelta(affixed, plain);
        expect(swap.gained.keywords).toEqual([
            { key: 'prefix:Keen', label: 'Keen' },
            { key: 'suffix:of Focus', label: 'of Focus' },
        ]);
        expect(swap.lost.keywords).toHaveLength(0);
    });

    it('omits affix labels for legacy equipment saved before 0.22.0', () => {
        // Pre-0.22.0 saves carry no prefix/suffix fields. The reader must
        // degrade to an empty label set rather than throwing.
        const legacyWorn = weapon('legacy-worn', { rarity: 'uncommon' });
        const legacyCand = weapon('legacy-cand', { rarity: 'rare' });
        const d = computeEquipDelta(legacyCand, legacyWorn);
        expect(d.gained.keywords).toHaveLength(0);
        expect(d.lost.keywords).toHaveLength(0);
    });
});
