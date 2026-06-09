/**
 * Hermetic surface test — StancePhase module.
 *
 * Pins the named export contract for the stance selection
 * phase component. Full behavior is covered by broader combat
 * presenter tests at `state/e2e/combat.engine.test.ts`.
 */

import { describe, expect, it } from '@jest/globals';

import { StancePhase } from '@/components/combat/StancePhase';

describe('StancePhase: module surface', () => {
    it('exports a named StancePhase symbol', () => {
        expect(StancePhase).toBeDefined();
        expect(typeof StancePhase).toBe('function');
    });

    it('StancePhase is a valid React component', () => {
        // Component should accept props matching StancePhaseProps interface
        expect(StancePhase.length).toBeGreaterThanOrEqual(1);
    });
});