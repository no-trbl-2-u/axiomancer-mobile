/**
 * Navigation presenter for app shell routing and tab badges.
 *
 * Implements cold-start routing logic, tab badge state, and active tab
 * resolution based on game state. Used by app/index.tsx and tab layout.
 */

import type { GameStore } from 'axiomancer-mechanics';
import { freezeViewModel } from './freeze';

export type TabRoute = 'exploration' | 'combat' | 'character' | 'inventory' | 'event';

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
 * 2. Event if active event exists  
 * 3. Exploration otherwise
 */
export function selectActiveTab(state: GameStore): TabRoute {
    // Combat takes highest priority
    if (state.combat) {
        return 'combat';
    }
    
    // TODO: When engine exposes active events, check here
    // if (state.activeEvent) {
    //     return 'event';
    // }
    
    // Default to exploration
    return 'exploration';
}

/**
 * Tab badges for actionable states (new events, level-ups ready).
 */
export function selectTabBadges(state: GameStore): Record<TabRoute, TabBadge | null> {
    const badges: Record<TabRoute, TabBadge | null> = {
        exploration: null,
        combat: null,
        character: null,
        inventory: null,
        event: null,
    };

    // Character badge for level-up ready (when XP >= next level threshold)
    if (state.player && state.player.level < 20) {
        // TODO: When engine exposes XP and level-up logic, implement here
        // const xpForNext = calculateXPForLevel(state.player.level + 1);
        // if (state.player.experience >= xpForNext) {
        //     badges.character = { text: '!', kind: 'levelup' };
        // }
    }

    // Event badge for new/unread events
    // TODO: When engine exposes event state, implement here
    // if (state.events?.some(event => event.isNew)) {
    //     badges.event = { text: '1', kind: 'event' };
    // }

    return badges;
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