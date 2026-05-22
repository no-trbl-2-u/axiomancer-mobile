/**
 * Item-use / item-equip modal presenter for the inventory screen (Spec 06).
 *
 * Q2 / Q5 both call for a confirmation modal that previews the effect
 * of using or equipping an item before it is committed. The helpers
 * here are pure: state → view-model, no side effects.
 */

import {
    deriveStats,
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

export type ItemModalMode = 'use' | 'equip' | 'view';

export interface StatDelta {
    label: string;
    before: number;
    after: number;
    delta: number;
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

    // Equipment in this engine snapshot carries no stat modifiers, so
    // the deltas are all 0 today. The contract stabilises the UI ahead
    // of engine Spec ~05 shipping real modifiers.
    // derivedStats are guaranteed present after v1→v2 persistence migration
    const before: DerivedStats = player.derivedStats;
    const after: DerivedStats = before;
    const statDeltas: StatDelta[] = [
        delta('PHYS ATK', before.physicalAttack, after.physicalAttack),
        delta('PHYS DEF', before.physicalDefense, after.physicalDefense),
        delta('MENT ATK', before.mentalAttack, after.mentalAttack),
        delta('EMOT DEF', before.emotionalDefense, after.emotionalDefense),
    ];

    const previewLines: string[] = [
        `Slot · ${eq.slot.toUpperCase()}`,
        isAlreadyEquipped
            ? 'Already worn.'
            : 'No stat change — engine modifiers pending.',
    ];

    // Phase 36 port: when the equip would replace a worn sibling, the
    // confirm button surfaces the swap so the player can't miss what
    // they're discarding. Bare-slot equip keeps the plain `EQUIP`
    // label.
    let confirmLabel: string;
    if (isAlreadyEquipped) {
        confirmLabel = 'WORN';
    } else if (replacing !== null) {
        confirmLabel = `EQUIP · REPLACE ${replacing.name.toUpperCase()}`;
    } else {
        confirmLabel = 'EQUIP';
    }

    return freezeViewModel({
        itemId: item.id,
        name: item.name,
        description: item.description,
        mode: 'equip' as ItemModalMode,
        confirmPrompt: `Wear the ${item.name.toLowerCase()}?`,
        confirmLabel,
        previewLines: previewLines as readonly string[],
        statDeltas: statDeltas as readonly StatDelta[],
        replacingName: replacing === null ? null : replacing.name,
    });
}

function delta(label: string, before: number, after: number): StatDelta {
    return { label, before, after, delta: after - before };
}

