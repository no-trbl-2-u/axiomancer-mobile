/**
 * Screen-level presenter for `app/(tabs)/character.tsx`.
 *
 * Stub per Spec 03 step (2): exposes the `CharacterViewModel` shape
 * and returns a constant fixture sourced from the engine's player
 * record. Spec 05 replaces the fixture fields with real engine
 * reads (derived stats, saves, equipped items, known skills).
 *
 * VM is *data only* per Q5 — no colour tokens, no icons. The screen
 * resolves `StanceGlyph` from `stanceKey`, etc.
 */

import type { GameStore } from 'axiomancer-mechanics';

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
    /** Remaining duration, or `null` for indefinite effects. */
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

const STUB_VM: CharacterViewModel = {
    displayName: 'WORM-EATEN\nPILGRIM',
    subtitle: 'HOMO MORIENS · PILGRIM',
    level: 7,
    xp: 412,
    xpMax: 600,
    base: [
        { stanceKey: 'heart', label: 'HEART', value: 12 },
        { stanceKey: 'body', label: 'BODY', value: 14 },
        { stanceKey: 'mind', label: 'MIND', value: 10 },
    ],
    derived: [
        { label: 'PHYSICAL', attack: 13, skill: 7, defense: 10 },
        { label: 'MENTAL', attack: 8, skill: 14, defense: 8 },
        { label: 'EMOTIONAL', attack: 11, skill: 9, defense: 6 },
    ],
    luck: 12,
    saves: [
        { label: 'Body Save', value: '14' },
        { label: 'Mind Save', value: '12' },
        { label: 'Heart Save', value: '10' },
        { label: 'Body Test', value: '+2' },
        { label: 'Mind Test', value: '+1' },
        { label: 'Heart Test', value: '+0' },
    ],
    effects: [],
    equipment: [],
    skills: [],
};

/**
 * Returns the character view-model. **Stub** — Specs 04+ wire real
 * engine reads. The shape is the contract; subsequent specs may
 * widen fields (additive) but must not narrow them.
 */
export function selectCharacterViewModel(_state: GameStore): CharacterViewModel {
    return freezeViewModel(STUB_VM);
}
