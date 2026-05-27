/**
 * Hermetic unit tests — `firstEquippedPerSlot` + siblings.
 *
 * Pins the worn-state convention (first-equipment-per-slot is
 * worn) shared by `inventory.engine.ts:buildRows`,
 * `inventory.modal.engine.ts:buildEquipmentModal`, and
 * `character.engine.ts:buildEquipment`. Closes the AUDIT [3.5]
 * inventory-audit row 1 ("undeclared convention drift risk").
 */

import { describe, expect, it } from '@jest/globals';
import type { Equipment, Item } from 'axiomancer-mechanics';

import {
    findEquippedInSlot,
    firstEquippedPerSlot,
    isEquippedFirstOfSlot,
    templateToEquipment,
} from '@/state/selectors/equipment';

function eq(id: string, slot: Equipment['slot'], name = id): Equipment {
    return {
        id,
        name,
        category: 'equipment',
        slot,
        description: '',
        // engine `Equipment` has additional fields; cast through for
        // hermetic-test brevity.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
}

function consumable(id: string): Item {
    return {
        id,
        name: id,
        category: 'consumable',
        description: '',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
}

describe('firstEquippedPerSlot', () => {
    it('returns an empty map on empty inventory', () => {
        expect(firstEquippedPerSlot([]).size).toBe(0);
    });

    it('ignores non-equipment items', () => {
        const out = firstEquippedPerSlot([consumable('p1'), consumable('p2')]);
        expect(out.size).toBe(0);
    });

    it('marks the FIRST equipment item per slot as worn', () => {
        const sword1 = eq('sword-1', 'weapon');
        const sword2 = eq('sword-2', 'weapon');
        const helm = eq('helm-1', 'head');
        const out = firstEquippedPerSlot([sword1, sword2, helm]);
        expect(out.get('weapon')?.id).toBe('sword-1');
        expect(out.get('head')?.id).toBe('helm-1');
        expect(out.size).toBe(2);
    });

    it('reversing input flips the worn entry — order matters', () => {
        const a = eq('weapon-a', 'weapon');
        const b = eq('weapon-b', 'weapon');
        expect(firstEquippedPerSlot([a, b]).get('weapon')?.id).toBe('weapon-a');
        expect(firstEquippedPerSlot([b, a]).get('weapon')?.id).toBe('weapon-b');
    });

    it('non-equipment between two equipment items does not affect ordering', () => {
        const a = eq('weapon-a', 'weapon');
        const p = consumable('potion');
        const b = eq('weapon-b', 'weapon');
        expect(firstEquippedPerSlot([a, p, b]).get('weapon')?.id).toBe('weapon-a');
    });
});

describe('isEquippedFirstOfSlot', () => {
    it('returns true only for the first equipment in a slot', () => {
        const a = eq('weapon-a', 'weapon');
        const b = eq('weapon-b', 'weapon');
        const inv = [a, b];
        expect(isEquippedFirstOfSlot(inv, a)).toBe(true);
        expect(isEquippedFirstOfSlot(inv, b)).toBe(false);
    });

    it('returns false when the slot is empty', () => {
        const helm = eq('helm-1', 'head');
        expect(isEquippedFirstOfSlot([], helm)).toBe(false);
    });
});

describe('findEquippedInSlot', () => {
    it('returns the worn sibling when target is NOT worn', () => {
        const worn = eq('weapon-a', 'weapon');
        const bench = eq('weapon-b', 'weapon');
        expect(findEquippedInSlot([worn, bench], bench)?.id).toBe('weapon-a');
    });

    it('returns null when the target IS the worn one', () => {
        const worn = eq('weapon-a', 'weapon');
        const bench = eq('weapon-b', 'weapon');
        expect(findEquippedInSlot([worn, bench], worn)).toBeNull();
    });

    it('returns null when the slot is empty (no equipment at all in slot)', () => {
        const helm = eq('helm-1', 'head');
        const orphan = eq('weapon-x', 'weapon');
        expect(findEquippedInSlot([helm], orphan)).toBeNull();
    });
});

describe('templateToEquipment', () => {
    it('stamps BaseItem fields onto the engine template (closes AUDIT [4.0])', () => {
        // Closes the engine-duplication row that filed 2 parallel
        // implementations of this helper (actions.ts + event-pools.ts).
        // Both call sites now import from selectors/equipment.
        const template = {
            id: 'iron-blade',
            name: 'Iron Blade',
            description: 'A plain iron blade.',
            slot: 'weapon',
            statModifiers: [],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;
        const eqResult = templateToEquipment(template);
        expect(eqResult.id).toBe('iron-blade');
        expect(eqResult.name).toBe('Iron Blade');
        expect(eqResult.slot).toBe('weapon');
        expect(eqResult.category).toBe('equipment');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((eqResult as any).stackable).toBe(false);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((eqResult as any).quantity).toBe(1);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((eqResult as any).rarity).toBe('common');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((eqResult as any).modifiers).toEqual([]);
    });

    it('maps baseStatModifiers to statModifiers for mobile compatibility', () => {
        const template = {
            id: 'cloth-wrap',
            name: 'Cloth Wrap',
            description: 'A torn cloth wrap.',
            slot: 'body',
            baseStatModifiers: [{ stat: 'physicalDefense', value: 1 }],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;
        const eqResult = templateToEquipment(template);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((eqResult as any).statModifiers).toEqual([
            { stat: 'physicalDefense', value: 1 },
        ]);
    });
});
