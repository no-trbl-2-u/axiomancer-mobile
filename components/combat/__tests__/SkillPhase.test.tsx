/**
 * Hermetic surface test — SkillPhase module.
 *
 * Pins the named export contract for the skill selection
 * phase component. Full behavior is covered by broader combat
 * presenter tests at `state/e2e/combat.engine.test.ts`.
 */

import { describe, expect, it } from '@jest/globals';

import { SkillPhase } from '@/components/combat/SkillPhase';

describe('SkillPhase: module surface', () => {
    it('exports a named SkillPhase symbol', () => {
        expect(SkillPhase).toBeDefined();
        expect(typeof SkillPhase).toBe('function');
    });

    it('SkillPhase is a valid React component', () => {
        // Component should accept props matching SkillPhaseProps interface
        expect(SkillPhase.length).toBeGreaterThanOrEqual(1);
    });
});