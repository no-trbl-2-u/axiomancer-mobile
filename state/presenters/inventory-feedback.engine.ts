/**
 * Inventory feedback presenter (Phase 29 Tick B).
 *
 * Pure mapper from an `inventory:changed` engine event to a toast
 * string the player sees. Defensive: the engine emits this event from
 * several action types with inconsistent payload shapes
 * (USE_ITEM/EQUIP_ITEM/UNEQUIP_ITEM via dispatch carry
 * `{action, state}`; the non-dispatch `addItem` carries `{item, state}`;
 * the non-dispatch `removeItem` carries `{state}` only). The mapper
 * handles each path it can name, returns `null` for the rest so the
 * screen stays silent rather than emitting a misleading toast.
 */

import type { GameEvent } from 'axiomancer-mechanics';
import { isInventoryChangedEvent } from 'axiomancer-mechanics';

/**
 * Best-effort toast string for an `inventory:changed` event.
 * Returns `null` when the payload lacks the information needed to
 * say something meaningful — caller should NOT emit a fallback
 * toast in that case.
 */
export function selectInventoryToast(event: GameEvent): string | null {
    if (!isInventoryChangedEvent(event)) return null;
    // The engine's typed payload claims `{action, state}` everywhere,
    // but the runtime sometimes ships `{item, state}` from non-dispatch
    // paths. Cast to a loose shape and probe defensively.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload = event.payload as any;

    // Path A: `addItem` non-dispatch — payload has a top-level `item`.
    const directItem = payload?.item;
    if (directItem?.name) {
        return `Picked up ${String(directItem.name)}.`;
    }

    // Path B: dispatched action — payload.action.type tells us what.
    const actionType: string | undefined = payload?.action?.type;
    if (actionType === 'USE_ITEM') {
        // The action payload carries `itemId`, not name; the engine
        // has already consumed the item from inventory by the time
        // the event fires, so a name lookup is brittle. Generic toast.
        return 'Used.';
    }
    if (actionType === 'EQUIP_ITEM') {
        const itemName: string | undefined = payload?.action?.payload?.item?.name;
        return itemName ? `Equipped ${itemName}.` : 'Equipped.';
    }
    if (actionType === 'UNEQUIP_ITEM') {
        return 'Unequipped.';
    }

    return null;
}
