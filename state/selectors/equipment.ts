/**
 * Equipment-slot worn-state convention helper.
 *
 * The engine ships no `equipped` flag on `Equipment`. Mobile
 * encodes "worn" via inventory ordering: the FIRST equipment
 * item per slot is treated as worn. `equipItemAction` reorders
 * the inventory to make a target item the first in its slot;
 * every consumer that surfaces worn-state must agree on the
 * convention for the picture to stay coherent.
 *
 * Pre-existing consumers re-implemented the same scan four
 * times: `inventory.engine.ts::buildRows`,
 * `inventory.modal.engine.ts::isEquippedFirstOfSlot`,
 * `inventory.modal.engine.ts::findEquippedInSlot`,
 * `character.engine.ts::buildEquipment`. Any of them could
 * silently disagree under a future refactor (e.g. sorting the
 * scan order) and the worn UI would flip. The mechanics-vs-UI
 * audit (inventory-surface row 1, AUDIT [3.5]) flagged the
 * undeclared contract.
 *
 * This module is the single source of truth.
 */

import { isEquipment, type Equipment, type Item } from 'axiomancer-mechanics';

/**
 * Walk the inventory in order; for each equipment slot, capture
 * the FIRST equipment item seen in that slot. Returns a Map keyed
 * by engine slot key. Empty slots are absent from the map.
 *
 * Stable under permutation of non-equipment items between
 * equipment items (only equipment-slot order matters); stable
 * under stack-quantity changes (the function does not consume
 * `.quantity`).
 */
export function firstEquippedPerSlot(
    inventory: readonly Item[],
): Map<Equipment['slot'], Equipment> {
    const out = new Map<Equipment['slot'], Equipment>();
    for (const item of inventory) {
        if (!isEquipment(item)) continue;
        const eq = item as Equipment;
        if (out.has(eq.slot)) continue;
        out.set(eq.slot, eq);
    }
    return out;
}

/**
 * True iff `target` is the worn item in its slot per the
 * first-per-slot convention. Returns `false` for non-equipment
 * targets and for equipment items whose slot has a different
 * first-equipment entry.
 */
export function isEquippedFirstOfSlot(
    inventory: readonly Item[],
    target: Equipment,
): boolean {
    const worn = firstEquippedPerSlot(inventory).get(target.slot);
    return worn !== undefined && worn.id === target.id;
}

/**
 * Find the currently-worn equipment item in the same slot as
 * `target`, or `null` when the slot is empty / `target` is
 * itself the worn one. Useful for replace-preview UIs that need
 * the equipment-to-be-replaced.
 */
export function findEquippedInSlot(
    inventory: readonly Item[],
    target: Equipment,
): Equipment | null {
    const worn = firstEquippedPerSlot(inventory).get(target.slot);
    if (worn === undefined) return null;
    if (worn.id === target.id) return null;
    return worn;
}
