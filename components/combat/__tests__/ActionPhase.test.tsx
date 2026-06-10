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
        // React.memo returns an object (MemoizedComponent), not a function
        expect(typeof ActionPhase).toBe('object');
    });

    it('ActionPhase is a valid React component', () => {
        // React.memo components have a $$typeof property
        expect(ActionPhase).toHaveProperty('$$typeof');
    });
});