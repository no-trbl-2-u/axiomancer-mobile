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
    bucketAxis,
    defaultAlignment,
    getAlignmentCell,
    lookupEffect,
    type ActiveEffect,
    type Character,
    type GameStore,
} from 'axiomancer-mechanics';

import { freezeViewModel } from './freeze';
import { firstEquippedPerSlot } from '../selectors/equipment';

export type StanceKey = 'heart' | 'body' | 'mind';
export type EffectKind = 'buff' | 'debuff' | 'poison' | 'bleed';
export type EffectTint = 'buff' | 'debuff';

/**
 * Three philosophical axes the engine 0.10.0 alignment cube tracks
 * (`state.philosophicalAlignment`). Each axis is bucketed via
 * `bucketAxis()` to `low` | `mid` | `high` for display.
 */
export type AlignmentAxisKey = 'epistemology' | 'outlook' | 'scope';
export type AlignmentBucket = 'low' | 'mid' | 'high';

export interface AlignmentAxisRow {
    axisKey: AlignmentAxisKey;
    /** Display label, e.g. `'EPISTEMOLOGY'`. */
    label: string;
    /** Bucketed value for the axis. */
    bucket: AlignmentBucket;
}

export interface AlignmentSlice {
    /** Human-readable cell name from `philosophicalAlignmentLibrary`, e.g.
     * `'Agnostic-Neutral-Relational'`. */
    cellName: string;
    /** Three axis rows in display order: epistemology, outlook, scope. */
    axes: readonly AlignmentAxisRow[];
}

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
    /**
     * Visible placeholder rendered when `effects` is empty. Lowercase
     * ritual register; the screen renders verbatim (uppercased via
     * `textTransform`) so the view layer carries no ritual literal
     * (Hard Rule #8). Sibling to `a11y.effects` which is the
     * full-sentence screen-reader analogue.
     */
    emptyEffectsMessage: string;
    equipment: readonly EquipmentSlotRow[];
    skills: readonly CharacterSkillRow[];
    /**
     * Philosophical alignment cube (Phase 52, engine 0.10.0).
     * Computed from `state.philosophicalAlignment` via the engine's
     * `getAlignmentCell` + `bucketAxis`. Defaults to mid/mid/mid for
     * a fresh game (the engine's `defaultAlignment()` seed).
     */
    alignment: AlignmentSlice;
    /** Accessibility labels for character screen elements. */
    a11y: {
        characterName: string;
        level: string;
        experience: string;
        baseStats: string;
        derivedStats: string;
        saves: string;
        equipment: string;
        effects: string;
        /**
         * Label for the Token Crucible entry button. Lives on the
         * presenter so the screen has no hardcoded a11y literals
         * (Hard Rule #8 — content stays in the proper layer).
         */
        crucibleOpen: string;
        /** Screen-reader analogue for the alignment row. */
        alignment: string;
    };
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
    // derivedStats are guaranteed present after v1→v2 persistence migration
    const d = player.derivedStats;
    return [
        { label: 'PHYSICAL', attack: d.physicalAttack, skill: d.physicalSkill, defense: d.physicalDefense },
        { label: 'MENTAL',   attack: d.mentalAttack,   skill: d.mentalSkill,   defense: d.mentalDefense },
        { label: 'EMOTIONAL',attack: d.emotionalAttack, skill: d.emotionalSkill, defense: d.emotionalDefense },
    ];
}

function buildSaves(player: Character): readonly SaveOrTestRow[] {
    // nonCombatStats are guaranteed present after v1→v2 persistence migration
    const n = player.nonCombatStats;
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
    // Worn-state convention lives in `state/selectors/equipment.ts`
    // (AUDIT [3.5] inventory-audit row 1).
    const worn = firstEquippedPerSlot(player.inventory);
    return SLOT_ORDER.map((slot) => ({
        name: SLOT_LABELS[slot],
        item: worn.get(slot)?.name ?? null,
    }));
}

/**
 * Derives the character view-model from game state.
 * All fields are driven by the engine's `state.player`. Skills are
 * empty until engine Spec 04 ships known-skill reads.
 */
const ALIGNMENT_AXIS_LABELS: Record<AlignmentAxisKey, string> = {
    epistemology: 'EPISTEMOLOGY',
    outlook: 'OUTLOOK',
    scope: 'SCOPE',
};

function buildAlignmentSlice(state: GameStore): AlignmentSlice {
    // The engine's `GameState` exposes the alignment cube as
    // `philosophicalAlignment`. v3 saves backfill it; for any caller
    // that injects a sparse fixture without the field (e.g. test
    // shapes built from `{player} as never`), fall back to the
    // engine's neutral default rather than crashing.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = (state as any).philosophicalAlignment;
    const alignment = (raw && typeof raw === 'object') ? raw : defaultAlignment();

    const cell = getAlignmentCell(alignment);

    const axes: AlignmentAxisRow[] = (Object.keys(ALIGNMENT_AXIS_LABELS) as AlignmentAxisKey[])
        .map((axisKey) => ({
            axisKey,
            label: ALIGNMENT_AXIS_LABELS[axisKey],
            bucket: bucketAxis(alignment[axisKey] ?? 0),
        }));

    return { cellName: cell.label, axes };
}

export function selectCharacterViewModel(state: GameStore): CharacterViewModel {
    const player = state.player;
    // derivedStats.luck is guaranteed present after v1→v2 persistence migration
    const luck: number = player.derivedStats.luck;

    const alignment = buildAlignmentSlice(state);

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
        emptyEffectsMessage: 'none at hand.',
        equipment: buildEquipment(player),
        skills: [],
        alignment,
        a11y: {
            characterName: `Character name: ${player.name}`,
            level: `Level ${player.level}`,
            experience: `Experience: ${player.experience} of ${player.experienceToNextLevel}`,
            baseStats: 'Base statistics: Heart, Body, Mind',
            derivedStats: 'Derived statistics: attack, skill, and defense values',
            saves: 'Saving throws and ability tests',
            equipment: 'Equipment slots and equipped items',
            effects: buildEffects(player).length > 0
                ? `${buildEffects(player).length} active effects`
                : 'No active effects',
            crucibleOpen: 'Open Token Crucible.',
            alignment: `Philosophical alignment: ${alignment.cellName}. ${alignment.axes.map((a) => `${a.label.toLowerCase()} ${a.bucket}`).join(', ')}.`,
        },
    });
}
