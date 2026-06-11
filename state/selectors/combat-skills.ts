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

import {
    skillLibrary,
    getSkillById,
    type Skill,
    type ResourceCost,
    type SkillCombatEffects,
    type SkillTarget,
    type SkillsStatType,
} from 'axiomancer-mechanics';

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
    /** Focus cost — sum of all resource pools (kept for display). */
    manaCost: number;
    /** Per-resource cost from the engine. */
    resourceCost: ResourceCost;
    /** Engine damage inputs — the presenter derives the effect line. */
    basePower: number;
    scalingStat: SkillsStatType;
    scalingMultiplier?: number;
    /** 'enemy' = damage; 'self' = heal. */
    targetType: SkillTarget;
    /** Status effects the skill applies on cast. */
    combatEffects: readonly SkillCombatEffects[];
}

/** Short resource labels — match the crucible-token shorts in the HUD. */
const RESOURCE_SHORT: Record<keyof ResourceCost, string> = {
    body: 'BOD',
    mind: 'MND',
    heart: 'HRT',
    fallacy: 'FAL',
    paradox: 'PRX',
};

/** Compact cost line, e.g. `"2 BOD · 1 PRX"`; `"FREE"` when costless. */
export function skillCostText(cost: ResourceCost): string {
    const parts: string[] = [];
    for (const key of Object.keys(RESOURCE_SHORT) as (keyof ResourceCost)[]) {
        const n = cost[key] ?? 0;
        if (n > 0) parts.push(`${n} ${RESOURCE_SHORT[key]}`);
    }
    return parts.length > 0 ? parts.join(' · ') : 'FREE';
}

/** Prettify an engine effect id for the stat line: 'mind-static' → 'MIND STATIC'. */
function effectName(effectId: string): string {
    return effectId.replace(/[-_]/g, ' ').toUpperCase();
}

/**
 * Compact effect line for the picker row, e.g.
 * `"12 DMG · BLEED 2 (3R)"` or `"9 HEAL · CLARITY (2R)"`.
 * `damage` comes from the engine's `calculateSkillDamage` with the
 * live player's stats (no target resistance — it's an estimate).
 */
export function skillEffectText(skill: CombatSkill, damage: number): string {
    const parts: string[] = [];
    if (damage > 0) parts.push(`${damage} ${skill.targetType === 'self' ? 'HEAL' : 'DMG'}`);
    for (const fx of skill.combatEffects) {
        let label = effectName(fx.effectId);
        if (fx.intensity !== undefined) label += ` ${fx.intensity}`;
        if (fx.duration !== undefined) label += ` (${fx.duration}R)`;
        parts.push(label);
    }
    return parts.length > 0 ? parts.join(' · ') : 'NO DIRECT EFFECT';
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
        resourceCost: skill.resourceCost,
        basePower: skill.basePower,
        scalingStat: skill.scalingStat,
        scalingMultiplier: skill.scalingMultiplier,
        targetType: skill.targetType,
        combatEffects: skill.combatEffects ?? [],
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
