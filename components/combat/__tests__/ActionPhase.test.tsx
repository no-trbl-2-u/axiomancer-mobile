/**
 * Hermetic surface test — ActionPhase module.
 *
 * Pins the named export contract for the combat action selection
 * phase component. Full behavior is covered by broader combat
 * presenter tests at `state/e2e/combat.engine.test.ts`.
 */

import { describe, expect, it } from '@jest/globals';

import { ActionPhase } from '@/components/combat/ActionPhase';

describe('ActionPhase: module surface', () => {
    it('exports a named ActionPhase symbol', () => {
        expect(ActionPhase).toBeDefined();
        expect(typeof ActionPhase).toBe('function');
    });

    it('ActionPhase is a valid React component', () => {
        // Component should accept props matching ActionPhaseProps interface
        expect(ActionPhase.length).toBeGreaterThanOrEqual(1);
    });
});