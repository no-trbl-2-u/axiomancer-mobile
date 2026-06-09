/**
 * Hermetic surface test — SkillRow module.
 *
 * Pins the named export contract for the skill row
 * component. Full behavior is covered by broader combat
 * presenter tests at `state/e2e/combat.engine.test.ts`.
 */

import { describe, expect, it } from '@jest/globals';

import { SkillRow } from '@/components/combat/SkillRow';

describe('SkillRow: module surface', () => {
    it('exports a named SkillRow symbol', () => {
        expect(SkillRow).toBeDefined();
        expect(typeof SkillRow).toBe('function');
    });

    it('SkillRow is a valid React component', () => {
        // Component should accept props matching SkillRowProps interface
        expect(SkillRow.length).toBeGreaterThanOrEqual(1);
    });
});