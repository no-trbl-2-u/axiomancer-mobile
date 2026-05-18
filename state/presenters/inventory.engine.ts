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

/**
 * One paper-doll Equipment Dock slot. The dock surface ported in
 * commit `02beaeb` ("inventory equipment dock — port from design
 * handoff") renders 7 of these in a 4-row grid around a gothic
 * silhouette so worn vs. unworn is unmistakable at a glance.
 *
 * `key` mirrors the engine `Equipment.slot` union ("head", "body",
 * "weapon", "armor", "hands", "feet", "accessory"). `label` is the
 * uppercase chrome label for the slot. `item` is the currently-worn
 * equipment row (first equipment item per slot per the
 * `selectCharacterViewModel` convention) or `null` when the slot is
 * bare.
 */
export interface EquipmentDockSlot {
    key: Equipment['slot'];
    label: string;
    /** First equipped item in this slot, or `null`. */
    item: { id: string; name: string; sub: string | null } | null;
}

/**
 * The Equipment Dock view-model. Independent of the active tab —
 * tapping "PHIALS" should still show the player's worn equipment in
 * the dock above the tabs.
 */
export interface EquipmentDockViewModel {
    /** All 7 slots in the design's display order (head, body, weapon, armor, hands, accessory, feet). */
    slots: readonly EquipmentDockSlot[];
    /** Section eyebrow on the dock outer panel (ritual lowercase chrome). */
    headerLabel: string;
    /** One-line hint under the eyebrow ("WORN VS. UNWORN AT A GLANCE"). */
    hintLabel: string;
    /** Empty-slot copy (lowercase ritual register, framed with em-dashes per the design). */
    bareLabel: string;
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
    /**
     * Paper-doll Equipment Dock above the tabs (Phase 32 sub-tick E).
     * Computed from the full inventory (independent of active-tab
     * filter) so the dock keeps showing worn slots regardless of
     * which tab the user is on.
     */
    equipmentDock: EquipmentDockViewModel;
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
const SECTION_HEADER = 'SATCHEL · WALLET · BURDEN';
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
const EMPTY_MESSAGE = 'nothing in the satchel.';

/**
 * Equipment Dock display order — matches the design handoff's 4-row
 * paper-doll grid: head, body / weapon, armor / hands, accessory /
 * feet. `feet` sits alone in the fourth row in the screen layout;
 * the array order here keeps the VM stable and lets the view do its
 * own grid pairing.
 */
const DOCK_SLOT_ORDER: readonly Equipment['slot'][] = [
    'head',
    'body',
    'weapon',
    'armor',
    'hands',
    'accessory',
    'feet',
] as const;

/**
 * Uppercase chrome label per slot — distinct from `SLOT_LABELS`
 * (which is title-case "Weapon" / "Armor" for the item-row sub
 * field). The dock chrome uses TRINKET for accessory per the design
 * (chat 1's "HEAD, WEAPON, HANDS, FEET, BODY, ARMOR, TRINKET" list).
 */
const DOCK_SLOT_TITLE: Record<Equipment['slot'], string> = {
    head: 'HEAD',
    body: 'BODY',
    weapon: 'WEAPON',
    armor: 'ARMOR',
    hands: 'HANDS',
    feet: 'FEET',
    accessory: 'TRINKET',
};

const DOCK_HEADER_LABEL = '✠ WORN UPON THE BODY';
const DOCK_HINT_LABEL = 'WORN VS. UNWORN AT A GLANCE';
const DOCK_BARE_LABEL = '— bare —';

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

/**
 * Resolve the item-row's `sub` field back to the engine slot key.
 * `subFor` produces title-case slot labels ("Weapon" / "Body" / etc.)
 * from `SLOT_LABELS`; reverse the mapping here so the dock can build
 * its `worn` map without re-importing the engine's Equipment type at
 * the screen.
 */
const SUB_TO_SLOT: Record<string, Equipment['slot']> = Object.fromEntries(
    (Object.entries(SLOT_LABELS) as ReadonlyArray<[Equipment['slot'], string]>).map(
        ([slot, sub]) => [sub, slot],
    ),
) as Record<string, Equipment['slot']>;

function buildEquipmentDock(rows: readonly InventoryItemRow[]): EquipmentDockViewModel {
    const worn: Partial<Record<Equipment['slot'], InventoryItemRow>> = {};
    for (const r of rows) {
        if (r.category !== 'equipment' || !r.equipped || r.sub === null) continue;
        const slot = SUB_TO_SLOT[r.sub];
        if (slot === undefined) continue;
        if (slot in worn) continue;
        worn[slot] = r;
    }
    return {
        slots: DOCK_SLOT_ORDER.map((slot) => {
            const row = worn[slot] ?? null;
            return {
                key: slot,
                label: DOCK_SLOT_TITLE[slot],
                item: row === null ? null : { id: row.id, name: row.name, sub: row.sub },
            };
        }),
        headerLabel: DOCK_HEADER_LABEL,
        hintLabel: DOCK_HINT_LABEL,
        bareLabel: DOCK_BARE_LABEL,
    };
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
        equipmentDock: buildEquipmentDock(rows),
    });
}
