/**
 * Shared named-affix loot roller — unit tests.
 *
 * Pins the design contract against engine truth (no mocks): common 0
 * affixes, uncommon 1, rare 2 (prefix + suffix), unique = 3 fixed
 * modifiers with no prefix/suffix and its authored name. These are
 * engine-truth-coupled; if `axiomancer-mechanics` reshuffles its
 * template/affix library the level/seed expectations may shift.
 */

import { describe, expect, it } from '@jest/globals';
import {
    equipmentTemplates,
    uniqueTemplates,
    type Equipment,
} from 'axiomancer-mechanics';

import {
    rollAffixedDrop,
    countNamedAffixes,
    hasBakedAffix,
    AFFIXES_PER_RARITY,
} from '../affix-roll';

/** First clean (no baked affix) base template at/below the level. */
function cleanTemplateId(level: number): string {
    const t = equipmentTemplates.find(
        (tpl) => tpl.requiredLevel <= level && !hasBakedAffix(tpl),
    );
    if (!t) throw new Error('no clean template');
    return t.id;
}

/** Roll until the realised affix count matches the target (the affix
 * pool for a slot can occasionally roll short); bounded so a genuine
 * failure still terminates the test. */
function rollExact(level: number, rarity: 'uncommon' | 'rare'): Equipment {
    const id = cleanTemplateId(level);
    for (let i = 0; i < 40; i++) {
        const item = rollAffixedDrop(id, level, rarity);
        if (countNamedAffixes(item) === AFFIXES_PER_RARITY[rarity]) return item;
    }
    throw new Error(`could not roll an exact ${rarity}`);
}

describe('rollAffixedDrop', () => {
    it('common: zero affixes, base name, no rolled mods', () => {
        const id = cleanTemplateId(10);
        const item = rollAffixedDrop(id, 10, 'common');
        expect(item.rarity).toBe('common');
        expect(countNamedAffixes(item)).toBe(0);
        expect(item.prefixName).toBeFalsy();
        expect(item.suffixName).toBeFalsy();
        expect(item.rolledMods ?? []).toHaveLength(0);
    });

    it('uncommon: exactly one named affix (prefix or suffix), stamped uncommon', () => {
        const id = cleanTemplateId(10);
        // Coin-flip can pick prefix or suffix; over several rolls both the
        // count invariant and the rarity stamp must hold.
        for (let i = 0; i < 12; i++) {
            const item = rollAffixedDrop(id, 10, 'uncommon');
            expect(item.rarity).toBe('uncommon');
            expect(countNamedAffixes(item)).toBe(1);
        }
    });

    it('rare: a prefix and a suffix, stamped rare', () => {
        const item = rollExact(10, 'rare');
        expect(item.rarity).toBe('rare');
        expect(item.prefixName).toBeTruthy();
        expect(item.suffixName).toBeTruthy();
        expect(countNamedAffixes(item)).toBe(2);
    });

    it('unique: three fixed modifiers, authored name, no prefix/suffix', () => {
        const relic = uniqueTemplates[0];
        const item = rollAffixedDrop(relic.id, Math.max(relic.requiredLevel, 30), 'unique');
        expect(item.rarity).toBe('unique');
        expect(item.name).toBe(relic.name);
        expect(item.prefixName).toBeFalsy();
        expect(item.suffixName).toBeFalsy();
        expect(item.rolledMods ?? []).toHaveLength(3);
    });

    it('composes the affix words into the display name (rare)', () => {
        const item = rollExact(10, 'rare');
        // "<Prefix> <Base> <Suffix>" — both affix words appear in the name.
        expect(item.name).toContain(item.prefixName as string);
        expect(item.name).toContain(item.suffixName as string);
    });
});

describe('countNamedAffixes', () => {
    it('counts prefix + suffix presence, ignoring rolledMods length', () => {
        const base = {
            id: 'x',
            name: 'X',
            description: '',
            category: 'equipment',
            slot: 'weapon',
            rarity: 'rare',
            requiredLevel: 1,
        } as Equipment;
        expect(countNamedAffixes(base)).toBe(0);
        expect(countNamedAffixes({ ...base, prefixName: 'Keen' })).toBe(1);
        expect(countNamedAffixes({ ...base, prefixId: 'p', suffixId: 's' })).toBe(2);
        // A single affix carrying several modIds is still one affix.
        expect(
            countNamedAffixes({
                ...base,
                prefixName: 'Keen',
                rolledMods: [
                    { modId: 'a', value: 1 },
                    { modId: 'b', value: 2 },
                ],
            }),
        ).toBe(1);
    });
});
