/**
 * Dev-only player-tier presets for the Kid's mobile evidence runs
 * (Phase 131).
 *
 * The pre-existing `applyCharacterPreset` (Phase 59) swaps the
 * player for one of three engine archetypes (apprentice / wanderer
 * / sage). T's Kid playthrough matrix needs a finer, level-explicit
 * ladder — exactly `L1`, `L15`, `L30`, `L50` — each seeded with
 * level-relevant skills and equipment so encounter / combat evidence
 * is reproducible rather than anecdotal random-state scouting.
 *
 * These are mobile-side `CharacterPreset` rows fed through the
 * engine's own `buildCharacterFromPreset`, so all derived math
 * (maxHealth, derivedStats, item rolls at the preset level) stays
 * engine-owned. We invent no formulas here — only the curated
 * level / stat / skill / gear *selection* per tier.
 *
 * Component mount is `isDevToolsEnabled()`-guarded; production never
 * reaches this.
 */

import {
    buildCharacterFromPreset,
    type Character,
    type CharacterPreset,
} from 'axiomancer-mechanics';

import type { AppStore } from '@/state/store';

export type PlayerTierPresetId = 'kid-l1' | 'kid-l15' | 'kid-l30' | 'kid-l50';

export interface PlayerTierPreset {
    id: PlayerTierPresetId;
    /** Short button label (e.g. "L15"). */
    label: string;
    /** One-line summary surfaced under the button row. */
    summary: string;
    /** The engine-shaped preset fed through `buildCharacterFromPreset`. */
    preset: CharacterPreset;
}

export interface ApplyPlayerTierPresetResult {
    applied: boolean;
    presetId: PlayerTierPresetId | null;
    label: string | null;
    level: number | null;
}

// Skill tiers mirror the engine's preset tiers (Character/presets.ts).
// We re-declare the ids here so the curated per-level loadouts read
// at a glance; `buildCharacterFromPreset` validates them against the
// skill library at build time.
const TIER_1_SKILLS = [
    'ad-hominem-strike',
    'false-dilemma',
    'appeal-to-pity',
    'achilles-gambit',
    'liars-echo',
    'ship-of-theseus',
    'befriend',
];
const TIER_2_SKILLS = ['mob-appeal', 'undistributed-middle', 'eternal-regress'];
const TIER_3_SKILLS = ['sorites-cascade', 'straw-giant', 'bootstrap-paradox'];
const TIER_2_SYNERGY_SKILLS = [
    'resonance-bleed',
    'intensity-feedback',
    'bat-swarm-thoughtform',
    'resonance-burst',
    'resonance-detonation',
];

/**
 * The L1/L15/L30/L50 ladder. Each tier escalates base stats, known
 * skills, equipment tier, and consumable stock so the preset is
 * useful for combat and encounter evidence — not a naked stat-only
 * shell. Equipment template ids are real engine rows
 * (`equipmentTemplates` / `uniqueTemplates`); the consumable ids are
 * real `consumableLibrary` rows.
 */
export const PLAYER_TIER_PRESETS: readonly PlayerTierPreset[] = Object.freeze([
    {
        id: 'kid-l1',
        label: 'L1',
        summary: 'fresh start — tier-1 fallacies, no gear',
        preset: {
            id: 'kid-l1',
            name: 'Kid · L1',
            summary: 'Tier-1 evidence baseline.',
            level: 1,
            baseStats: { heart: 5, body: 5, mind: 5 },
            equipment: [],
            knownSkills: [...TIER_1_SKILLS],
            equippedSkills: TIER_1_SKILLS.slice(0, 4),
            consumables: [{ id: 'minor-healing-potion', quantity: 3 }],
            currency: 0,
        },
    },
    {
        id: 'kid-l15',
        label: 'L15',
        summary: 'mid kit — tier-1/2 skills, steel + chain',
        preset: {
            id: 'kid-l15',
            name: 'Kid · L15',
            summary: 'Mid-tier evidence kit.',
            level: 15,
            baseStats: { heart: 12, body: 14, mind: 12 },
            equipment: [
                { templateId: 'steel-blade', slot: 'weapon' },
                { templateId: 'chain-mail', slot: 'armor' },
                { templateId: 'chain-coif', slot: 'head' },
                { templateId: 'leather-coat', slot: 'body' },
                { templateId: 'chain-gauntlets', slot: 'hands' },
                { templateId: 'leather-boots', slot: 'feet' },
                { templateId: 'silver-ring', slot: 'accessory' },
            ],
            knownSkills: [...TIER_1_SKILLS, ...TIER_2_SKILLS, ...TIER_2_SYNERGY_SKILLS],
            equippedSkills: [
                'ad-hominem-strike',
                'ship-of-theseus',
                'resonance-bleed',
                'resonance-burst',
            ],
            consumables: [
                { id: 'healing-potion', quantity: 5 },
                { id: 'antidote', quantity: 2 },
            ],
            currency: 50,
        },
    },
    {
        id: 'kid-l30',
        label: 'L30',
        summary: 'late kit — every tier, mithril + plate',
        preset: {
            id: 'kid-l30',
            name: 'Kid · L30',
            summary: 'Late-tier evidence kit.',
            level: 30,
            baseStats: { heart: 24, body: 28, mind: 26 },
            equipment: [
                { templateId: 'mithril-blade', slot: 'weapon' },
                { templateId: 'plate-mail', slot: 'armor' },
                { templateId: 'full-helm', slot: 'head' },
                { templateId: 'scaled-coat', slot: 'body' },
                { templateId: 'plate-gauntlets', slot: 'hands' },
                { templateId: 'iron-greaves', slot: 'feet' },
                { templateId: 'gold-ring', slot: 'accessory' },
            ],
            knownSkills: [
                ...TIER_1_SKILLS,
                ...TIER_2_SKILLS,
                ...TIER_3_SKILLS,
                ...TIER_2_SYNERGY_SKILLS,
            ],
            equippedSkills: [
                'sorites-cascade',
                'bootstrap-paradox',
                'resonance-detonation',
                'bat-swarm-thoughtform',
            ],
            consumables: [
                { id: 'greater-healing-potion', quantity: 6 },
                { id: 'clarity-serum', quantity: 3 },
                { id: 'focus-vial', quantity: 3 },
            ],
            currency: 250,
        },
    },
    {
        id: 'kid-l50',
        label: 'L50',
        summary: 'endgame — all skills, top-tier affixed gear',
        preset: {
            id: 'kid-l50',
            name: 'Kid · L50',
            summary: 'Endgame evidence kit.',
            level: 50,
            baseStats: { heart: 40, body: 44, mind: 42 },
            // Mechanics 0.22.0 trimmed the equipment library; the old
            // dragon-tier ids were removed. Endgame now seeds the
            // top-tier curated affixed L20 variants (the highest
            // requiredLevel rows the trimmed library ships) so the
            // build still arrives geared and affix-backed.
            equipment: [
                { templateId: 'savage-mithril-blade-of-ruin', slot: 'weapon' },
                { templateId: 'adamant-plate-mail-of-warding', slot: 'armor' },
                { templateId: 'full-helm-of-insight', slot: 'head' },
                { templateId: 'scaled-coat-of-thorns', slot: 'body' },
                { templateId: 'plate-gauntlets-of-the-duelist', slot: 'hands' },
                { templateId: 'phantom-iron-greaves-of-shadows', slot: 'feet' },
                { templateId: 'silver-ring-of-resilience', slot: 'accessory' },
            ],
            knownSkills: [
                ...TIER_1_SKILLS,
                ...TIER_2_SKILLS,
                ...TIER_3_SKILLS,
                ...TIER_2_SYNERGY_SKILLS,
            ],
            equippedSkills: [
                'sorites-cascade',
                'straw-giant',
                'bootstrap-paradox',
                'resonance-detonation',
            ],
            consumables: [
                { id: 'supreme-healing-potion', quantity: 8 },
                { id: 'regeneration-tonic', quantity: 3 },
                { id: 'phoenix-tear', quantity: 2 },
                { id: 'greater-resonance-crystal', quantity: 3 },
            ],
            currency: 1000,
        },
    },
]);

export function getPlayerTierPreset(
    presetId: string,
): PlayerTierPreset | undefined {
    return PLAYER_TIER_PRESETS.find((row) => row.id === presetId);
}

/**
 * Replace the player slice with a fresh build of the requested
 * level tier. No-op (`applied: false`) on an unknown id. Mirrors
 * `applyCharacterPresetAction` (Phase 59) — same engine build path,
 * just the finer level ladder.
 */
export function applyPlayerTierPresetAction(
    store: AppStore,
    presetId: string,
): ApplyPlayerTierPresetResult {
    try {
        const row = getPlayerTierPreset(presetId);
        if (!row) {
            return { applied: false, presetId: null, label: null, level: null };
        }
        const nextPlayer = buildCharacterFromPreset(row.preset) as Character;
        store.setState({ player: nextPlayer });
        return {
            applied: true,
            presetId: row.id,
            label: row.label,
            level: row.preset.level,
        };
    } catch (error) {
        console.error(`Failed to apply player tier preset ${presetId}:`, error);
        return { applied: false, presetId: null, label: null, level: null };
    }
}
