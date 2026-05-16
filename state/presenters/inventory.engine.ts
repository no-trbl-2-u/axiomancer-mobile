/**
 * Screen-level presenter for `app/(tabs)/inventory/index.tsx`.
 *
 * Spec 06: drives the inventory view-model from `state.player.inventory`.
 * Items are grouped by engine category (Q1=A), stacks render as a single
 * row with a `quantity` (Q3=A), and the screen renders an empty-state
 * placeholder when the player carries nothing (Q4=A).
 *
 * The engine ships no `equipped` flag — by convention shared with
 * `selectCharacterViewModel`, the *first* equipment item per slot is
 * treated as worn. `equipItem` (in `state/actions.ts`) reorders the
 * inventory to make a target item that "first".
 */

import {
    isConsumable,
    isEquipment,
    isQuestItem,
    type Equipment,
    type GameStore,
    type Item,
} from 'axiomancer-mechanics';

import { freezeViewModel } from './freeze';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

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
    /** Stack size — always 1 for non-stackable items. */
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
    /** True when the inventory is empty — the screen shows the empty state. */
    isEmpty: boolean;
    /** Empty-state copy. Per bearings 2026-05-15 no second-person archaic pronouns (drops the earlier "Thy sack…" phrasing). */
    emptyMessage: string;
    /**
     * Display header above the category list (rendered uppercased by
     * the view). Lives on the presenter so the screen has no inline
     * ritual literal (Hard Rule #8).
     */
    sectionHeader: string;
    /**
     * Per-category section labels, in the order categories appear on
     * the screen. Lives on the presenter so the view layer carries no
     * literal copy.
     */
    categoryHeaders: Record<InventoryCategory, string>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TAB_ORDER: readonly InventoryTab[] = [
    'all',
    'equipment',
    'consumable',
    'material',
    'quest',
] as const;

/** Display strings for the inventory screen's chrome. */
const SECTION_HEADER = 'SACK · WALLET · BURDEN';
const CATEGORY_HEADERS: Record<InventoryCategory, string> = {
    equipment: '✠ WORN & WIELDED',
    consumable: '✠ PHIALS & SOPS',
    material: '✠ STUFF',
    quest: '✠ SEALED',
};

const TAB_LABELS: Record<InventoryTab, string> = {
    all: 'ALL',
    equipment: 'WORN',
    consumable: 'PHIALS',
    material: 'STUFF',
    quest: 'SEALED',
};

const SLOT_LABELS: Record<Equipment['slot'], string> = {
    weapon: 'Weapon',
    armor: 'Armor',
    accessory: 'Accessory',
    head: 'Head',
    body: 'Body',
    hands: 'Hands',
    feet: 'Feet',
};

const BURDEN_MAX = 50;
const EMPTY_MESSAGE = 'Nothing in the sack.';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function presentationCategory(item: Item): InventoryCategory {
    if (isEquipment(item)) return 'equipment';
    if (isConsumable(item)) return 'consumable';
    if (isQuestItem(item)) return 'quest';
    return 'material';
}

function subFor(item: Item): string | null {
    if (isEquipment(item)) return SLOT_LABELS[item.slot] ?? null;
    return null;
}

function quantityFor(item: Item): number {
    if (isConsumable(item) || ('quantity' in item && typeof item.quantity === 'number')) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return Math.max(1, Number((item as any).quantity ?? 1));
    }
    return 1;
}

function canUseFor(item: Item): boolean {
    return isConsumable(item) || isEquipment(item);
}

function canDiscardFor(item: Item): boolean {
    return !isQuestItem(item);
}

/**
 * Convert the raw engine inventory into display rows. Per Q3=A, items
 * with the same `id` collapse into a single row whose `quantity`
 * reflects the stack size. The *first* equipment item per slot is
 * marked `equipped` to match `selectCharacterViewModel`.
 */
function buildRows(inventory: readonly Item[]): InventoryItemRow[] {
    const rowsById = new Map<string, InventoryItemRow>();
    const order: string[] = [];
    const equippedSlots = new Set<string>();

    for (const item of inventory) {
        const cat = presentationCategory(item);
        const existing = rowsById.get(item.id);
        if (existing !== undefined) {
            rowsById.set(item.id, {
                ...existing,
                quantity: existing.quantity + quantityFor(item),
            });
            continue;
        }

        let equipped = false;
        if (isEquipment(item)) {
            const slot = item.slot;
            if (!equippedSlots.has(slot)) {
                equipped = true;
                equippedSlots.add(slot);
            }
        }

        const row: InventoryItemRow = {
            id: item.id,
            name: item.name,
            category: cat,
            sub: subFor(item),
            quantity: quantityFor(item),
            equipped,
            description: item.description,
            canUse: canUseFor(item),
            canDiscard: canDiscardFor(item),
        };
        rowsById.set(item.id, row);
        order.push(item.id);
    }

    return order.map((id) => rowsById.get(id)!);
}

function countByCategory(rows: readonly InventoryItemRow[]): Record<InventoryCategory, number> {
    const counts: Record<InventoryCategory, number> = {
        equipment: 0,
        consumable: 0,
        material: 0,
        quest: 0,
    };
    for (const row of rows) counts[row.category] += row.quantity;
    return counts;
}

function buildTabs(rows: readonly InventoryItemRow[]): InventoryTabRow[] {
    const counts = countByCategory(rows);
    const totalAll = counts.equipment + counts.consumable + counts.material + counts.quest;
    return TAB_ORDER.map((key) => ({
        key,
        label: TAB_LABELS[key],
        count: key === 'all' ? totalAll : counts[key],
    }));
}

function filterRowsByTab(
    rows: readonly InventoryItemRow[],
    tab: InventoryTab,
): readonly InventoryItemRow[] {
    if (tab === 'all') return rows;
    return rows.filter((r) => r.category === tab);
}

function readShilling(state: GameStore): number {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = state.player as unknown as Record<string, any>;
    const raw = Number(p.shilling ?? p.currency ?? 0);
    return Number.isFinite(raw) && raw >= 0 ? raw : 0;
}

function computeBurden(rows: readonly InventoryItemRow[]): number {
    const total = rows.reduce((acc, r) => acc + r.quantity, 0);
    return Math.min(BURDEN_MAX, total);
}

// ---------------------------------------------------------------------------
// Public selector
// ---------------------------------------------------------------------------

export function selectInventoryViewModel(
    state: GameStore,
    localUi: InventoryLocalUi = {},
): InventoryViewModel {
    const inventory = state.player?.inventory ?? [];
    const rows = buildRows(inventory);
    const activeTab = localUi.activeTab ?? 'all';
    const items = filterRowsByTab(rows, activeTab);

    return freezeViewModel({
        tabs: buildTabs(rows),
        activeTab,
        items,
        shilling: readShilling(state),
        burden: computeBurden(rows),
        burdenMax: BURDEN_MAX,
        expandedItemId: localUi.expandedItemId ?? null,
        isEmpty: rows.length === 0,
        emptyMessage: EMPTY_MESSAGE,
        sectionHeader: SECTION_HEADER,
        categoryHeaders: CATEGORY_HEADERS,
    });
}
