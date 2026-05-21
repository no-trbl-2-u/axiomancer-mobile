/**
 * Hermetic surface test — CombatPanel module (Phase 63a).
 *
 * Pins the named export contract so the modal-contained
 * encounter refactor (Phase 63b) has a stable import path.
 * The full render behavior is exercised by the broader combat
 * presenter / screen tests at `state/e2e/combat.engine.test.ts`
 * and `state/e2e/combat.screen.test.tsx`.
 */

import { describe, expect, it } from '@jest/globals';

import { CombatPanel } from '@/components/combat/CombatPanel';

describe('CombatPanel: module surface', () => {
    it('exports a named CombatPanel symbol', () => {
        expect(CombatPanel).toBeDefined();
        expect(typeof CombatPanel).toBe('function');
    });

    it('re-exports from the canonical combat tab implementation', () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const tabModule = require('@/app/(tabs)/combat');
        expect(CombatPanel).toBe(tabModule.CombatPanel);
    });
});
