/**
 * Item-use / item-equip modal presenter for the inventory screen (Spec 06).
 *
 * Q2 / Q5 both call for a confirmation modal that previews the effect
 * of using or equipping an item before it is committed. The helpers
 * here are pure: state → view-model, no side effects.
 */

import {
    deriveStats,
    equipItem as engineEquipItem,
    unequipItem as engineUnequipItem,
    isConsumable,
    isEquipment,
    type Character,
    type Consumable,
    type DerivedStats,
    type Equipment,
    type GameStore,
    type Item,
} from 'axiomancer-mechanics';

import { freezeViewModel } from './freeze';
import { parseHealAmount } from '../actions';
import {
    findEquippedInSlot as selectFindEquippedInSlot,
    isEquippedFirstOfSlot as selectIsEquippedFirstOfSlot,
} from '../selectors/equipment';

/**
 * Modal mode discriminator. The screen branches on this to pick
 * which action to dispatch on confirm:
 * - `'use'` → `actions.useItem` (consumables).
 * - `'equip'` → `actions.equipItem` (equipment NOT currently worn).
 * - `'unequip'` → `actions.unequipItem` (equipment currently worn
 *   AND has at least one other slot peer to swap to). Filed via
 *   user-jot 2026-05-22 (oversight 29th call).
 * - `'view'` → no action (display-only; for items with no available
 *   action, including equipment that's the sole worn item in its
 *   slot — see notes on `unequipItemAction` for why sole-item
 *   unequip is a no-op under mobile's first-in-slot convention).
 */
export type ItemModalMode = 'use' | 'equip' | 'unequip' | 'view';

export interface StatDelta {
    label: string;
    before: number;
    after: number;
    delta: number;
    /**
     * Engine stat key (e.g. `'physicalAttack'`, `'mentalDefense'`).
     * Consumed by the inventory item-modal's TooltipTarget wrap
     * (Phase 80a) to fire a `kind:'item-stat'` synthesizer tooltip
     * on tap. Optional so callers building deltas without a stat
     * binding can omit it; the view falls back to a plain row.
     */
    id?: string;
}

export interface ItemModalViewModel {
    /** Item ID the modal is acting on. */
    itemId: string | null;
    /** Display name of the item. */
    name: string;
    /** Engine description. */
    description: string;
    /** Modal mode — determines the primary button. */
    mode: ItemModalMode;
    /** Confirmation copy ("Drink the phial?"). */
    confirmPrompt: string;
    /** Primary button label, e.g. `"DRINK"` / `"EQUIP"`. */
    confirmLabel: string;
    /** Preview lines (Q2 / Q5 — "potential results"). */
    previewLines: readonly string[];
    /** Stat deltas for an equip preview (Q5). */
    statDeltas: readonly StatDelta[];
    /**
     * Name of the currently-equipped item that this equip would
     * replace, or `null` when the slot is empty / this item is
     * already equipped / the item isn't equipment. Surfaced on the
     * equip modal's confirmLabel as `"EQUIP · REPLACE <NAME>"` per
     * the design's chat-1 iteration 2 EQUIP-button rule (Phase 36
     * port). The view layer reads `replacingName` directly to avoid
     * parsing the label string back out.
     */
    replacingName: string | null;
}

/**
 * Build the modal view-model for a tapped item. The screen passes the
 * item id; this helper resolves the rest from engine state. Returns
 * `null` when the item can't be found.
 */
export function selectItemModalViewModel(
    state: GameStore,
    itemId: string,
): ItemModalViewModel | null {
    const inventory: readonly Item[] = state.player.inventory;
    const item = inventory.find((i: Item) => i.id === itemId);
    if (!item) return null;

    if (isConsumable(item)) return buildConsumableModal(state.player, item);
    if (isEquipment(item)) return buildEquipmentModal(state.player, item);

    return freezeViewModel({
        itemId: item.id,
        name: item.name,
        description: item.description,
        mode: 'view' as ItemModalMode,
        confirmPrompt: '',
        confirmLabel: 'CLOSE',
        previewLines: [item.description] as readonly string[],
        statDeltas: [] as readonly StatDelta[],
        replacingName: null,
    });
}

function buildConsumableModal(player: Character, item: Item): ItemModalViewModel {
    // `isConsumable(item)` has narrowed at the call site; cast through.
    const consumable = item as Consumable;
    // Prefer the engine's structured `healAmount`; fall back to parsing
    // a legacy `effectId` string for fixtures / records that haven't
    // migrated yet.
    const legacyEffect = consumable.effectId ?? '';
    const heal = consumable.healAmount ?? parseHealAmount(legacyEffect);
    const projectedHp = heal > 0
        ? Math.min(player.maxHealth, player.health + heal)
        : player.health;
    const hpDelta = projectedHp - player.health;

    const previewLines: string[] = [];
    if (consumable.healAmount && consumable.healAmount > 0) {
        previewLines.push(`Heal ${consumable.healAmount} HP`);
    } else if (legacyEffect) {
        previewLines.push(legacyEffect);
    }
    if (hpDelta > 0) {
        previewLines.push(`HP ${player.health} → ${projectedHp} (+${hpDelta})`);
    } else if (legacyEffect && heal === 0) {
        previewLines.push('No HP change.');
    }

    return freezeViewModel({
        itemId: item.id,
        name: item.name,
        description: item.description,
        mode: 'use' as ItemModalMode,
        confirmPrompt: `Drink the ${item.name.toLowerCase()}?`,
        confirmLabel: 'DRINK',
        previewLines: previewLines as readonly string[],
        statDeltas: [] as readonly StatDelta[],
        replacingName: null,
    });
}

function buildEquipmentModal(player: Character, item: Item): ItemModalViewModel {
    const eq = item as Equipment;
    const isAlreadyEquipped = selectIsEquippedFirstOfSlot(player.inventory, eq);
    const replacing = isAlreadyEquipped ? null : selectFindEquippedInSlot(player.inventory, eq);

    // Calculate actual stat changes by simulating equipment application.
    // derivedStats are guaranteed present after v1→v2 persistence migration
    const before: DerivedStats = player.derivedStats;
    
    // Simulate the stat changes this equipment would cause
    let after: DerivedStats;
    if (isAlreadyEquipped) {
        // If already equipped, simulate unequipping to show what we'd lose
        if (replacing) {
            // There's a replacement item that would become equipped
            const tempPlayer = engineUnequipItem(player, eq.slot);
            after = tempPlayer.derivedStats;
        } else {
            // No replacement, just show current stats (no change)
            after = before;
        }
    } else {
        // Not equipped, simulate equipping to show what we'd gain
        const equippedPlayer = engineEquipItem(player, eq);
        after = equippedPlayer.derivedStats;
    }
    const statDeltas: StatDelta[] = [
        delta('PHYS ATK', before.physicalAttack, after.physicalAttack, 'physicalAttack'),
        delta('PHYS DEF', before.physicalDefense, after.physicalDefense, 'physicalDefense'),
        delta('MENT ATK', before.mentalAttack, after.mentalAttack, 'mentalAttack'),
        delta('EMOT DEF', before.emotionalDefense, after.emotionalDefense, 'emotionalDefense'),
    ];

    // User-jot 2026-05-22 (oversight 29th): equipment needs an
    // 'unequip' option in addition to equip + discard. Under
    // mobile's "first-equipment-per-slot = worn" convention,
    // unequip = swap to a different slot-peer (move the worn
    // item to the back of its slot peers). When the worn item
    // is the sole entry in its slot, there's no peer to swap to
    // — the row falls back to display-only with the WORN label
    // (engine-true "unequip to bare" requires a mobile-side
    // unequipped-marker that's not in scope today).
    const slotPeerCount = player.inventory.filter(
        (it: Item): it is Equipment =>
            isEquipment(it) && (it as Equipment).slot === eq.slot,
    ).length;
    const canUnequip = isAlreadyEquipped && slotPeerCount > 1;
    const wornSibling = canUnequip
        ? player.inventory.find(
              (it: Item): it is Equipment =>
                  isEquipment(it)
                  && (it as Equipment).slot === eq.slot
                  && it.id !== eq.id,
          ) ?? null
        : null;

    // Phase 36 + user-jot 2026-05-22 confirmLabel matrix:
    // - Not equipped, slot empty → 'EQUIP'
    // - Not equipped, slot has worn sibling → 'EQUIP · REPLACE <NAME>'
    // - Equipped, has peer → 'UNEQUIP · WEAR <NAME>' (or just
    //   'UNEQUIP' if no clear next-up — but slotPeerCount > 1
    //   guarantees at least one)
    // - Equipped, sole item in slot → 'WORN' (display-only).
    let confirmLabel: string;
    let mode: ItemModalMode;
    if (isAlreadyEquipped && canUnequip) {
        mode = 'unequip';
        confirmLabel = wornSibling !== null
            ? `UNEQUIP · WEAR ${wornSibling.name.toUpperCase()}`
            : 'UNEQUIP';
    } else if (isAlreadyEquipped) {
        // Sole item in slot — 'view' mode (no action on confirm);
        // confirmLabel stays 'WORN' to communicate display-only.
        mode = 'view';
        confirmLabel = 'WORN';
    } else if (replacing !== null) {
        mode = 'equip';
        confirmLabel = `EQUIP · REPLACE ${replacing.name.toUpperCase()}`;
    } else {
        mode = 'equip';
        confirmLabel = 'EQUIP';
    }

    const previewLines: string[] = [
        `Slot · ${eq.slot.toUpperCase()}`,
        mode === 'unequip'
            ? wornSibling !== null
                ? `Worn now. Swaps with ${wornSibling.name}.`
                : 'Worn now.'
            : isAlreadyEquipped
              ? 'Worn now.'
              : `${eq.slot.charAt(0).toUpperCase() + eq.slot.slice(1)} slot.`,
    ];

    return freezeViewModel({
        itemId: item.id,
        name: item.name,
        description: item.description,
        mode,
        confirmPrompt: mode === 'unequip'
            ? `Stop wearing the ${item.name.toLowerCase()}?`
            : `Wear the ${item.name.toLowerCase()}?`,
        confirmLabel,
        previewLines: previewLines as readonly string[],
        statDeltas: statDeltas as readonly StatDelta[],
        replacingName: replacing === null ? null : replacing.name,
    });
}

function delta(label: string, before: number, after: number, id?: string): StatDelta {
    return id !== undefined
        ? { label, before, after, delta: after - before, id }
        : { label, before, after, delta: after - before };
}

