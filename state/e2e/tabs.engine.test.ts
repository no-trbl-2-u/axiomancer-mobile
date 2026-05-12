/**
 * Hermetic E2E Tests — Tab visibility presenter
 *
 * Combat is mutually exclusive with exploration. The bottom tab bar
 * shows MAP when out of combat and COMBAT when in combat — never both.
 *
 * Hermetic = self-contained + deterministic + isolated.
 * See docs/testing.md for the full standard.
 */

import { afterEach, describe, it, expect, jest } from '@jest/globals';

import { isTabHidden, selectVisibleTabs, type TabKey } from '@/state/presenters/tabs.engine';

afterEach(() => {
    jest.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Happy path — out-of-combat shows MAP, in-combat shows COMBAT
// ---------------------------------------------------------------------------

describe('selectVisibleTabs: happy path', () => {
    it('shows the exploration tab when not in combat', () => {
        const vm = selectVisibleTabs(false);

        expect(vm.visibleTabs).toContain('exploration');
        expect(vm.hiddenTabs).toContain('combat');
    });

    it('shows the combat tab when in combat', () => {
        const vm = selectVisibleTabs(true);

        expect(vm.visibleTabs).toContain('combat');
        expect(vm.hiddenTabs).toContain('exploration');
    });
});

// ---------------------------------------------------------------------------
// Mutual exclusion invariant
// ---------------------------------------------------------------------------

describe('selectVisibleTabs: mutual exclusion', () => {
    it('never shows MAP and COMBAT at the same time, in either mode', () => {
        for (const inCombat of [false, true]) {
            const vm = selectVisibleTabs(inCombat);
            const exploreVisible = vm.visibleTabs.includes('exploration');
            const combatVisible = vm.visibleTabs.includes('combat');

            expect(exploreVisible && combatVisible).toBe(false);
            expect(exploreVisible || combatVisible).toBe(true);
        }
    });

    it('places exactly one of MAP/COMBAT in hiddenTabs in either mode', () => {
        for (const inCombat of [false, true]) {
            const vm = selectVisibleTabs(inCombat);
            const hidden = vm.hiddenTabs.filter(
                (t) => t === 'exploration' || t === 'combat',
            );

            expect(hidden).toHaveLength(1);
        }
    });
});

// ---------------------------------------------------------------------------
// Always-visible tabs invariant
// ---------------------------------------------------------------------------

describe('selectVisibleTabs: always-visible tabs', () => {
    it.each([false, true])(
        'always shows SHEET, SACK, and EVENT (inCombat=%p)',
        (inCombat) => {
            const vm = selectVisibleTabs(inCombat);

            expect(vm.visibleTabs).toEqual(
                expect.arrayContaining(['character', 'inventory', 'event']),
            );
            expect(vm.hiddenTabs).not.toEqual(
                expect.arrayContaining(['character', 'inventory', 'event']),
            );
        },
    );

    it('returns 4 visible tabs (1 positional + 3 always-visible)', () => {
        for (const inCombat of [false, true]) {
            const vm = selectVisibleTabs(inCombat);
            expect(vm.visibleTabs).toHaveLength(4);
        }
    });

    it('lists the positional tab first so it remains the leftmost in the bar', () => {
        expect(selectVisibleTabs(false).visibleTabs[0]).toBe('exploration');
        expect(selectVisibleTabs(true).visibleTabs[0]).toBe('combat');
    });
});

// ---------------------------------------------------------------------------
// isTabHidden helper — inverse view of the same selector
// ---------------------------------------------------------------------------

describe('isTabHidden: agreement with selectVisibleTabs', () => {
    const allTabs: TabKey[] = ['exploration', 'combat', 'character', 'inventory', 'event'];

    it.each([false, true])(
        'agrees with selectVisibleTabs for every tab when inCombat=%p',
        (inCombat) => {
            const vm = selectVisibleTabs(inCombat);

            for (const tab of allTabs) {
                const hidden = isTabHidden(inCombat, tab);
                expect(hidden).toBe(vm.hiddenTabs.includes(tab));
                expect(hidden).toBe(!vm.visibleTabs.includes(tab));
            }
        },
    );
});

// ---------------------------------------------------------------------------
// Purity / referential transparency
// ---------------------------------------------------------------------------

describe('selectVisibleTabs: purity', () => {
    it('returns deep-equal results for repeated calls with the same input', () => {
        const a = selectVisibleTabs(false);
        const b = selectVisibleTabs(false);

        expect(a).toEqual(b);
    });

    it('returns a fresh array each call so callers cannot mutate shared state', () => {
        const vm = selectVisibleTabs(false);
        vm.visibleTabs.push('combat');

        // A subsequent call still returns the canonical value.
        expect(selectVisibleTabs(false).visibleTabs).not.toContain('combat');
    });
});
