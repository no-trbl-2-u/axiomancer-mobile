/**
 * Placeholder combat skills the combat screen consumes.
 *
 * Per Spec 04 Q3 answer (A): the engine's skill library ships in
 * `axiomancer-mechanics@0.7.0` under `dist/Skills/skill.library`
 * (`skillLibrary` + `getSkillById`), but is not re-exported from the
 * package top-level — see `plan/AUDIT.md` `[needs-engine-release]`
 * row. Until the engine ships a release with the top-level re-export
 * + the missing `Skills/types.d.ts` in dist, mobile reads from this
 * fixture. Phase 16 (`[skipped]`) tracks the drain.
 */

import type { StanceKey } from '../presenters/combat.engine';

export type SkillCategoryKey = 'fallacy' | 'paradox';

export interface CombatSkillFixture {
    /** Stable id — what the engine resolver will eventually resolve. */
    id: string;
    /** Display name in caps. */
    name: string;
    /** Display description. */
    description: string;
    /** Skill category — drives the chip tint in the picker. */
    category: SkillCategoryKey;
    /** Stance the skill is locked to. */
    stance: StanceKey;
    /** Mana cost — compared against the player's current mana. */
    manaCost: number;
}

// Phase 16 [skipped] drains this when the engine ships the
// `skillLibrary` / `getSkillById` top-level re-export. See file
// header + `plan/AUDIT.md` `[needs-engine-release]` row.
export const COMBAT_SKILLS_FIXTURE: readonly CombatSkillFixture[] = [
    {
        id: 'ad-hominem',
        name: 'AD HOMINEM',
        description: 'Strike the speaker. +2 dmg if foe wounded.',
        category: 'fallacy',
        stance: 'heart',
        manaCost: 3,
    },
    {
        id: 'circular-logic',
        name: 'CIRCULAR LOGIC',
        description: 'Foe loses next action. Costs 1 HP.',
        category: 'fallacy',
        stance: 'mind',
        manaCost: 4,
    },
    {
        id: 'ship-of-theseus',
        name: 'OF THESEUS',
        description: 'Replace foe limb. Disarm 2 rounds.',
        category: 'paradox',
        stance: 'mind',
        manaCost: 5,
    },
    {
        id: 'straw-man',
        name: 'STRAW MAN',
        description: 'Conjure decoy. Absorb next blow.',
        category: 'fallacy',
        stance: 'body',
        manaCost: 2,
    },
    {
        id: 'zenos-blade',
        name: "ZENO'S BLADE",
        description: 'Halve distance forever. Pierce.',
        category: 'paradox',
        stance: 'body',
        manaCost: 6,
    },
    {
        id: 'sorites-heap',
        name: 'SORITES HEAP',
        description: 'Wear foe down. +1 stack each round.',
        category: 'paradox',
        stance: 'heart',
        manaCost: 4,
    },
];
