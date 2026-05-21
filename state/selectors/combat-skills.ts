/**
 * Engine skill-library adapter (Phase 16).
 *
 * Bridges the engine's `Skill` shape (axiomancer-mechanics 0.10.2's
 * `skillLibrary` + `getSkillById`, top-level re-exported as of the
 * Phase 60f engine bump) to the mobile presentation row consumed by
 * the combat skill picker.
 *
 * Drains `state/mocks/combat.skills.fixture.ts`. The presenter
 * contract (`SkillOption` in `combat.engine.ts`) is unchanged; only
 * the data source moves.
 *
 * Mapping decisions per the Phase 16 brief §"Decisions made upfront":
 *   - `id` = engine `id` (e.g. `'ad-hominem-strike'`)
 *   - `name` = engine `name`, uppercased for display
 *   - `description` = engine `description` verbatim
 *   - `category` = engine `category` ('fallacy' | 'paradox')
 *   - `stance` = engine `philosophicalAspect` ('body' | 'mind' | 'heart')
 *   - `manaCost` = sum of every resource in `resourceCost`
 *     (body + mind + heart + fallacy + paradox; missing keys 0)
 */

import { skillLibrary, getSkillById, type Skill } from 'axiomancer-mechanics';

import type { StanceKey } from '@/state/presenters/combat.engine';

export type SkillCategoryKey = 'fallacy' | 'paradox';

export interface CombatSkill {
    /** Stable engine skill id. */
    id: string;
    /** Display name in caps. */
    name: string;
    /** Display description. */
    description: string;
    /** Skill category — drives chip tint in the picker. */
    category: SkillCategoryKey;
    /** Stance the skill is locked to. */
    stance: StanceKey;
    /** Mana cost — sum of all resource pools the engine reads from. */
    manaCost: number;
}

function totalResourceCost(skill: Skill): number {
    const r = skill.resourceCost;
    return (r.body ?? 0) + (r.mind ?? 0) + (r.heart ?? 0) + (r.fallacy ?? 0) + (r.paradox ?? 0);
}

function toCombatSkill(skill: Skill): CombatSkill {
    return {
        id: skill.id,
        name: skill.name.toUpperCase(),
        description: skill.description,
        category: skill.category,
        stance: skill.philosophicalAspect,
        manaCost: totalResourceCost(skill),
    };
}

/** Full engine skill library, projected into the combat picker shape. */
export const COMBAT_SKILLS: readonly CombatSkill[] = Object.freeze(
    skillLibrary.map(toCombatSkill),
);

/**
 * Resolve a skill id to its mobile presentation row. Returns `null`
 * when the id is not in the engine library (e.g. legacy ids from a
 * pre-Phase-16 save). Callers should treat `null` the same way they
 * treated a missing fixture entry.
 */
export function getCombatSkillById(id: string): CombatSkill | null {
    const skill = getSkillById(id);
    return skill ? toCombatSkill(skill) : null;
}
