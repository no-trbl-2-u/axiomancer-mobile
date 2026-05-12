/**
 * Screen-level presenter for `app/(tabs)/inventory.tsx`.
 *
 * Stub per Spec 03 step (2). Spec 06 replaces the fixture with real
 * engine reads (`selectInventory`, `useConsumable` capability flags,
 * equip/unequip state).
 *
 * VM is *data only*; the screen resolves `ItemGlyph` from the
 * category + sub-category keys.
 */

import type { GameStore } from 'axiomancer-mechanics';

import { freezeViewModel } from './freeze';

export type InventoryCategory = 'equipment' | 'consumable' | 'material' | 'quest';
export type InventoryTab = 'all' | InventoryCategory;

export interface InventoryLocalUi {
    activeTab?: InventoryTab;
    expandedItemId?: string | null;
}

export interface InventoryItemRow {
    /** Stable engine ID. */
    id: string;
    name: string;
    category: InventoryCategory;
    /** Free-form sub-classification (`'Weapon'`, `'Body'`, …) or `null`. */
    sub: string | null;
    quantity: number;
    equipped: boolean;
    description: string;
    /** Whether the item can currently be used / equipped. */
    canUse: boolean;
    /** Whether the item can be discarded (`false` for quest items). */
    canDiscard: boolean;
}

export interface InventoryTabRow {
    key: InventoryTab;
    label: string;
    count: number;
}

export interface InventoryViewModel {
    /** Tabs in display order. */
    tabs: readonly InventoryTabRow[];
    /** Currently active tab (defaults to `'all'`). */
    activeTab: InventoryTab;
    /** Items filtered by the active tab, in display order. */
    items: readonly InventoryItemRow[];
    /** Currency the player carries (engine "shilling"). */
    shilling: number;
    /** Burden / encumbrance numerator. */
    burden: number;
    burdenMax: number;
    /** ID of the item the user has tapped to expand, or `null`. */
    expandedItemId: string | null;
}

const EMPTY_TABS: readonly InventoryTabRow[] = [
    { key: 'all', label: 'ALL', count: 0 },
    { key: 'equipment', label: 'WORN', count: 0 },
    { key: 'consumable', label: 'PHIALS', count: 0 },
    { key: 'material', label: 'STUFF', count: 0 },
    { key: 'quest', label: 'SEALED', count: 0 },
];

/**
 * Returns the inventory view-model. **Stub** — Spec 06 wires real
 * engine reads. The shape is the contract.
 */
export function selectInventoryViewModel(
    _state: GameStore,
    localUi: InventoryLocalUi = {},
): InventoryViewModel {
    return freezeViewModel({
        tabs: EMPTY_TABS,
        activeTab: localUi.activeTab ?? 'all',
        items: [] as readonly InventoryItemRow[],
        shilling: 0,
        burden: 0,
        burdenMax: 50,
        expandedItemId: localUi.expandedItemId ?? null,
    });
}
