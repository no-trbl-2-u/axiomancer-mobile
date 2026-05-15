/**
 * Navigation presenter for app shell routing and tab badges.
 *
 * Implements cold-start routing logic, tab badge state, and active tab
 * resolution based on game state. Used by app/index.tsx and tab layout.
 */

import type { GameStore } from 'axiomancer-mechanics';
import { freezeViewModel } from './freeze';

export type TabRoute = 'exploration' | 'combat' | 'character' | 'inventory';

export interface TabBadge {
    /** Badge text (e.g., '1', '!', '•') */
    text: string;
    /** Badge type for styling */
    kind: 'event' | 'levelup';
}

export interface NavigationViewModel {
    /** Active tab route for cold-start */
    activeTab: TabRoute;
    /** Tab badges by route key */
    badges: Record<TabRoute, TabBadge | null>;
}

/**
 * Determines which tab should be active on cold start based on game state.
 *
 * Priority:
 * 1. Combat if in combat
 * 2. Exploration otherwise
 *
 * Events fire as a full-screen modal (see `app/event.tsx` + `selectHasActiveEvent`),
 * not a tab, so they do not participate in tab selection.
 */
export function selectActiveTab(state: GameStore): TabRoute {
    // Combat takes highest priority
    if (state.combat) {
        return 'combat';
    }

    // Default to exploration
    return 'exploration';
}

// Stable reference for the all-null badge state. Returning a fresh object
// literal from a zustand selector triggers an infinite render loop because
// `useStore` compares results by identity. Until badge sources land,
// every caller gets this same frozen instance.
const EMPTY_BADGES: Record<TabRoute, TabBadge | null> = Object.freeze({
    exploration: null,
    combat: null,
    character: null,
    inventory: null,
}) as Record<TabRoute, TabBadge | null>;

/**
 * Tab badges for actionable states (new events, level-ups ready).
 *
 * Once badge sources are wired up, build the result object only when one of
 * the inputs is truthy — never allocate on the steady-state path, or wrap
 * the consumer with `useShallow` so identity churn doesn't loop the store.
 */
export function selectTabBadges(_state: GameStore): Record<TabRoute, TabBadge | null> {
    // Level-up and event badges derive from engine XP / active-event
    // state. Until the engine exposes those surfaces, return the stable
    // EMPTY_BADGES sentinel.
    return EMPTY_BADGES;
}

/**
 * Combined navigation view model for app shell.
 */
export function selectNavigationViewModel(state: GameStore): NavigationViewModel {
    const vm: NavigationViewModel = {
        activeTab: selectActiveTab(state),
        badges: selectTabBadges(state),
    };

    return freezeViewModel(vm);
}