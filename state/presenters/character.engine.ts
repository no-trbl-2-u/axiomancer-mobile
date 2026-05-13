/**
 * Screen-level presenter for `app/(tabs)/character/index.tsx`.
 *
 * Implements `selectCharacterViewModel` from engine state (Spec 05).
 * Reads player stats, derived stats, save/test modifiers, active effects,
 * and equipment slots directly from `state.player`. Skills are deferred
 * to engine Spec 04.
 *
 * VM is *data only* per Q5 — no colour tokens, no icons. The screen
 * resolves `StanceGlyph` from `stanceKey`, etc.
 */

import {
    lookupEffect,
    type ActiveEffect,
    type Character,
    type Equipment,
    type GameStore,
} from 'axiomancer-mechanics';

import { freezeViewModel } from './freeze';

export type StanceKey = 'heart' | 'body' | 'mind';
export type EffectKind = 'buff' | 'debuff' | 'poison' | 'bleed';
export type EffectTint = 'buff' | 'debuff';

export interface BaseStatRow {
    /** Stable key the component maps to a `StanceGlyph` kind. */
    stanceKey: StanceKey;
    /** Display label, e.g. `'HEART'`. */
    label: string;
    /** Raw stat value. */
    value: number;
}

export interface DerivedStatRow {
    /** Row label, e.g. `'PHYSICAL'`. */
    label: string;
    attack: number;
    skill: number;
    defense: number;
}

export interface SaveOrTestRow {
    label: string;
    /** Already-formatted display string (e.g. `'14'` or `'+2'`). */
    value: string;
}

export interface CharacterEffectRow {
    name: string;
    kind: EffectKind;
    tint: EffectTint;
    /** Remaining duration in rounds. */
    duration: number | null;
    intensity: number;
    description: string;
}

export interface EquipmentSlotRow {
    /** Slot label, e.g. `'Head'`. */
    name: string;
    /** Equipped item name, or `null` when empty. */
    item: string | null;
}

export interface CharacterSkillRow {
    name: string;
    category: 'fallacy' | 'paradox';
    stanceKey: StanceKey;
}

export interface CharacterViewModel {
    /** Pre-formatted display name (may include explicit `\n` line breaks). */
    displayName: string;
    /** Subtitle / role flavour line. */
    subtitle: string;
    level: number;
    xp: number;
    xpMax: number;
    base: readonly BaseStatRow[];
    derived: readonly DerivedStatRow[];
    /** Average of the three base stats — the engine's "luck" surface. */
    luck: number;
    saves: readonly SaveOrTestRow[];
    effects: readonly CharacterEffectRow[];
    equipment: readonly EquipmentSlotRow[];
    skills: readonly CharacterSkillRow[];
}

// Equipment slots in display order, matching engine EquipmentSlot literals 1:1.
const SLOT_ORDER = ['head', 'body', 'hands', 'feet', 'weapon', 'armor', 'accessory'] as const;
type SlotKey = typeof SLOT_ORDER[number];

const SLOT_LABELS: Record<SlotKey, string> = {
    head: 'Head',
    body: 'Body',
    hands: 'Hands',
    feet: 'Feet',
    weapon: 'Weapon',
    armor: 'Armor',
    accessory: 'Accessory',
};

function buildBase(player: Character): readonly BaseStatRow[] {
    const { heart, body, mind } = player.baseStats;
    return [
        { stanceKey: 'heart', label: 'HEART', value: heart },
        { stanceKey: 'body', label: 'BODY', value: body },
        { stanceKey: 'mind', label: 'MIND', value: mind },
    ];
}

function buildDerived(player: Character): readonly DerivedStatRow[] {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = (player as any).derivedStats;
    return [
        { label: 'PHYSICAL', attack: d.physicalAttack, skill: d.physicalSkill, defense: d.physicalDefense },
        { label: 'MENTAL',   attack: d.mentalAttack,   skill: d.mentalSkill,   defense: d.mentalDefense   },
        { label: 'EMOTIONAL',attack: d.emotionalAttack, skill: d.emotionalSkill, defense: d.emotionalDefense },
    ];
}

function buildSaves(player: Character): readonly SaveOrTestRow[] {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const n = (player as any).nonCombatStats;
    const sign = (v: number) => (v >= 0 ? `+${v}` : `${v}`);
    return [
        { label: 'Body Save',  value: String(n.physicalSave) },
        { label: 'Mind Save',  value: String(n.mentalSave) },
        { label: 'Heart Save', value: String(n.emotionalSave) },
        { label: 'Body Test',  value: sign(n.physicalTest) },
        { label: 'Mind Test',  value: sign(n.mentalTest) },
        { label: 'Heart Test', value: sign(n.emotionalTest) },
    ];
}

function buildEffects(player: Character): readonly CharacterEffectRow[] {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const effects: ActiveEffect[] = (player as any).effects ?? [];
    return effects.map((ae) => {
        const def = lookupEffect(ae.effectId);
        const rawKind = def?.type ?? 'debuff';
        const kind = (rawKind === 'buff' ? 'buff' : 'debuff') as EffectKind;
        return {
            name: def?.name ?? ae.effectId,
            kind,
            tint: (kind === 'buff' ? 'buff' : 'debuff') as EffectTint,
            duration: ae.remainingDuration,
            intensity: ae.intensity,
            description: def?.description ?? '',
        };
    });
}

function buildEquipment(player: Character): readonly EquipmentSlotRow[] {
    const bySlot = new Map<string, string>();
    for (const item of player.inventory) {
        if (item.category === 'equipment') {
            const eq = item as Equipment;
            if (!bySlot.has(eq.slot)) bySlot.set(eq.slot, eq.name);
        }
    }
    return SLOT_ORDER.map((slot) => ({
        name: SLOT_LABELS[slot],
        item: bySlot.get(slot) ?? null,
    }));
}

/**
 * Derives the character view-model from game state.
 * All fields are driven by the engine's `state.player`. Skills are
 * empty until engine Spec 04 ships known-skill reads.
 */
export function selectCharacterViewModel(state: GameStore): CharacterViewModel {
    const player = state.player;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const luck: number = (player as any).derivedStats?.luck ?? 0;

    return freezeViewModel({
        displayName: player.name,
        subtitle: 'PILGRIM',
        level: player.level,
        xp: player.experience,
        xpMax: player.experienceToNextLevel,
        base: buildBase(player),
        derived: buildDerived(player),
        luck,
        saves: buildSaves(player),
        effects: buildEffects(player),
        equipment: buildEquipment(player),
        skills: [],
    });
}
