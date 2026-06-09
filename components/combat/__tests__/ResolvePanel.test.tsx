/**
 * Hermetic surface test — ResolvePanel module.
 *
 * Pins the named export contract for the combat resolution
 * phase component. Full behavior is covered by broader combat
 * presenter tests at `state/e2e/combat.engine.test.ts`.
 */

import { describe, expect, it } from '@jest/globals';

import { ResolvePanel } from '@/components/combat/ResolvePanel';

describe('ResolvePanel: module surface', () => {
    it('exports a named ResolvePanel symbol', () => {
        expect(ResolvePanel).toBeDefined();
        expect(typeof ResolvePanel).toBe('function');
    });

    it('ResolvePanel is a valid React component', () => {
        // Component should accept props matching ResolvePanelProps interface
        expect(ResolvePanel.length).toBeGreaterThanOrEqual(1);
    });
});