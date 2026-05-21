/**
 * Hermetic unit tests — combat-skills adapter (Phase 16).
 *
 * Pins the mapping contract from the engine's `Skill` to the
 * mobile `CombatSkill` row: shape coverage, name uppercased,
 * category + stance literal-union safety, manaCost is the
 * resource-cost sum.
 */

import { describe, expect, it } from '@jest/globals';
import { skillLibrary, getSkillById } from 'axiomancer-mechanics';

import {
    COMBAT_SKILLS,
    getCombatSkillById,
    type CombatSkill,
} from '@/state/selectors/combat-skills';

describe('COMBAT_SKILLS: library coverage', () => {
    it('mirrors the engine library length 1:1', () => {
        expect(COMBAT_SKILLS).toHaveLength(skillLibrary.length);
    });

    it('every entry has a non-empty id, name, description', () => {
        for (const skill of COMBAT_SKILLS) {
            expect(skill.id.length).toBeGreaterThan(0);
            expect(skill.name.length).toBeGreaterThan(0);
            expect(skill.description.length).toBeGreaterThan(0);
        }
    });

    it('every name is uppercase', () => {
        for (const skill of COMBAT_SKILLS) {
            expect(skill.name).toBe(skill.name.toUpperCase());
        }
    });

    it('every category is a known SkillCategoryKey literal', () => {
        const known: ReadonlyArray<CombatSkill['category']> = ['fallacy', 'paradox'];
        for (const skill of COMBAT_SKILLS) {
            expect(known).toContain(skill.category);
        }
    });

    it('every stance is a known StanceKey literal', () => {
        const known: ReadonlyArray<CombatSkill['stance']> = ['heart', 'body', 'mind'];
        for (const skill of COMBAT_SKILLS) {
            expect(known).toContain(skill.stance);
        }
    });
});

describe('COMBAT_SKILLS: manaCost mapping', () => {
    it('manaCost equals the sum of every resourceCost key', () => {
        for (const combat of COMBAT_SKILLS) {
            const engine = getSkillById(combat.id);
            expect(engine).toBeDefined();
            const r = engine!.resourceCost;
            const expected =
                (r.body ?? 0) + (r.mind ?? 0) + (r.heart ?? 0) + (r.fallacy ?? 0) + (r.paradox ?? 0);
            expect(combat.manaCost).toBe(expected);
        }
    });

    it('manaCost is a non-negative integer (no NaN, no fractions)', () => {
        for (const skill of COMBAT_SKILLS) {
            expect(Number.isInteger(skill.manaCost)).toBe(true);
            expect(skill.manaCost).toBeGreaterThanOrEqual(0);
        }
    });
});

describe('getCombatSkillById: resolution', () => {
    it('returns the mapped row for a known engine id', () => {
        const first = COMBAT_SKILLS[0];
        const found = getCombatSkillById(first.id);
        expect(found).not.toBeNull();
        expect(found!.id).toBe(first.id);
        expect(found!.name).toBe(first.name);
        expect(found!.manaCost).toBe(first.manaCost);
    });

    it('returns null for an unknown id (e.g. legacy pre-Phase-16 ids)', () => {
        expect(getCombatSkillById('not-a-real-skill')).toBeNull();
        // Legacy mock id from the fixture that did NOT match an engine id.
        expect(getCombatSkillById('ad-hominem')).toBeNull();
    });

    it('round-trips: every COMBAT_SKILLS entry resolves via id', () => {
        for (const skill of COMBAT_SKILLS) {
            const resolved = getCombatSkillById(skill.id);
            expect(resolved).toEqual(skill);
        }
    });
});
