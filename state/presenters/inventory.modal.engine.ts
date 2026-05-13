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
    type DerivedStats,
    type Equipment,
    type GameStore,
    type Item,
} from 'axiomancer-mechanics';

import { freezeViewModel } from './freeze';
import { parseHealAmount } from '../actions';

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
    });
}

function buildConsumableModal(player: Character, item: Item): ItemModalViewModel {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const effect = String((item as any).effect ?? '');
    const heal = parseHealAmount(effect);
    const projectedHp = heal > 0
        ? Math.min(player.maxHealth, player.health + heal)
        : player.health;
    const hpDelta = projectedHp - player.health;

    const previewLines: string[] = [];
    if (effect) previewLines.push(effect);
    if (hpDelta > 0) {
        previewLines.push(`HP ${player.health} → ${projectedHp} (+${hpDelta})`);
    } else if (effect && heal === 0) {
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
    });
}

function buildEquipmentModal(player: Character, item: Item): ItemModalViewModel {
    const eq = item as Equipment;
    const isAlreadyEquipped = isEquippedFirstOfSlot(player, eq);

    // Equipment in this engine snapshot carries no stat modifiers, so
    // the deltas are all 0 today. The contract stabilises the UI ahead
    // of engine Spec ~05 shipping real modifiers.
    const before: DerivedStats = player.derivedStats ?? deriveStats(player.baseStats);
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

    return freezeViewModel({
        itemId: item.id,
        name: item.name,
        description: item.description,
        mode: 'equip' as ItemModalMode,
        confirmPrompt: `Wear the ${item.name.toLowerCase()}?`,
        confirmLabel: isAlreadyEquipped ? 'WORN' : 'EQUIP',
        previewLines: previewLines as readonly string[],
        statDeltas: statDeltas as readonly StatDelta[],
    });
}

function delta(label: string, before: number, after: number): StatDelta {
    return { label, before, after, delta: after - before };
}

function isEquippedFirstOfSlot(player: Character, target: Equipment): boolean {
    const inventory: readonly Item[] = player.inventory;
    for (const item of inventory) {
        if (isEquipment(item) && (item as Equipment).slot === target.slot) {
            return item.id === target.id;
        }
    }
    return false;
}
