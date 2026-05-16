/**
 * Pure presenter for the tab bar visibility.
 *
 * Combat is mutually exclusive with exploration — the player cannot move
 * around the world while in a fight, and there is no out-of-combat
 * "combat" screen to enter, so the bottom tab bar shows exactly one of
 * {MAP, COMBAT} at any time.
 *
 * Tested in state/e2e/tabs.engine.test.ts.
 */

export type TabKey = 'exploration' | 'combat' | 'character' | 'inventory';

export interface TabsViewModel {
    /** Tabs the user can currently see in the bottom bar, in display order. */
    visibleTabs: TabKey[];
    /** Tabs registered with the router but hidden from the bar (href: null). */
    hiddenTabs: TabKey[];
}

/**
 * Display titles for the bottom tab bar, keyed by route name.
 * Lives on the presenter so the screen has no inline string
 * literals on the navigation chrome (Hard Rule #8). Pinned by
 * `state/e2e/tabs.engine.test.ts` — Phase 30 Tick B added this
 * extraction in response to a user-observed runtime regression
 * where the tab labels rendered as `{ TAB NAME }"--index"`
 * literally (the user saw raw template-string output in place of
 * the configured titles). Pinning the strings here makes any
 * future regression visible at verify time even if the
 * `_layout.tsx` `title:` props end up bypassed.
 *
 * Phase 31 (Tabs design pass, 2026-05-16) flipped the four
 * strings from the mixed-register pre-fix set
 * (`MAP · COMBAT · SHEET · SACK` — three places + one
 * event-state) to the coherent all-places register the user
 * picked via `/oversight`: `WILDS · STRIFE · SELF · SACK`.
 */
export const TAB_TITLES: Record<TabKey, string> = {
    exploration: 'WILDS',
    combat: 'STRIFE',
    character: 'SELF',
    inventory: 'SACK',
};

const ALWAYS_VISIBLE: TabKey[] = ['character', 'inventory'];

export function selectVisibleTabs(inCombat: boolean): TabsViewModel {
    const positional: TabKey = inCombat ? 'combat' : 'exploration';
    const hidden: TabKey = inCombat ? 'exploration' : 'combat';

    return {
        visibleTabs: [positional, ...ALWAYS_VISIBLE],
        hiddenTabs: [hidden],
    };
}

export function isTabHidden(inCombat: boolean, tab: TabKey): boolean {
    return selectVisibleTabs(inCombat).hiddenTabs.includes(tab);
}
