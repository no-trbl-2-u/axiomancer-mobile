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

import {
    isEquipment,
    type Equipment,
    type EquipmentTemplate,
    type Item,
} from 'axiomancer-mechanics';

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
        // isEquipment is a type guard, so item is now typed as Equipment
        if (out.has(item.slot)) continue;
        out.set(item.slot, item);
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

// ---------------------------------------------------------------------------
// Equipment construction (engine `EquipmentTemplate` → mobile-typed `Equipment`)
// ---------------------------------------------------------------------------

/**
 * Inflate an engine `EquipmentTemplate` into the mobile-typed
 * `Equipment` shape ready to drop into inventory. Templates from
 * the engine's `equipmentTemplates` library carry the slot +
 * statModifiers; mobile adds the `category`, `stackable`,
 * `quantity`, `rarity`, and `modifiers` defaults the engine's
 * `equipItem` reducer and the inventory presenter both expect.
 *
 * Single source of truth — closes the AUDIT [4.0]
 * engine-duplication row (oversight 29th user-jot). Pre-extract
 * this body lived at:
 *   - `state/actions.ts:templateToEquipment` (debug seed +
 *     loot grant)
 *   - `state/exploration-maps/event-pools.ts:templateToEquipment`
 *     (treasure pool synthesis)
 * Both call sites now route through this helper.
 *
 * The `as any` boundary cast is intentional and isolated here —
 * engine `Equipment` types don't expose `category`/`stackable`/
 * `quantity`/`rarity`/`modifiers` as required fields on the
 * spread input, but the inventory layer expects them. When/if
 * the engine ships a richer `Equipment` factory, this helper
 * retires.
 */
export function templateToEquipment(template: EquipmentTemplate): Equipment {
    // The engine `Equipment` type doesn't declare `stackable` /
    // `quantity` / `modifiers`, but the mobile inventory layer reads
    // them on every Item. Cast through `unknown` so the boundary is
    // explicit (instead of `as any`, which masks every typo) and
    // findable for future engine-shape reconciliation.
    return {
        ...template,
        category: 'equipment',
        stackable: false,
        quantity: 1,
        rarity: 'common',
        modifiers: [],
        // EQUIPMENT STATS FIX: Map engine's baseStatModifiers to mobile's expected statModifiers
        statModifiers: template.baseStatModifiers ?? [],
    } as unknown as Equipment;
}
