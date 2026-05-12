/**
 * Placeholder combat skills the combat screen consumes.
 *
 * Per Spec 04 Q3 answer (A): the engine's skills system (engine Spec
 * 04) is not yet shipped, so the screen reads from this fixture until
 * it is. Replace the imports and the `STANCE_SKILLS` map with engine
 * reads once the engine exposes equipped/known skills on the player.
 *
 * TODO: replace with engine skills (axiomancer-mechanics — engine Spec 04).
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

// TODO: replace with engine skills (axiomancer-mechanics — engine Spec 04).
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
