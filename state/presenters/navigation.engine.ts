/**
 * Navigation presenter for app shell routing and tab badges.
 *
 * Implements cold-start routing logic, tab badge state, and active
 * tab resolution based on game state. Used by `app/index.tsx` and
 * `app/(tabs)/_layout.tsx`.
 */

import { selectIsInCombat, type GameStore } from 'axiomancer-mechanics';

import type { AppStoreState } from '../store';
import { selectHasActiveEvent } from './event.engine';
import { freezeViewModel } from './freeze';

export type TabRoute = 'exploration' | 'combat' | 'character' | 'memoir' | 'inventory';

export interface TabBadge {
    /** Badge text (e.g., '!', '↑'). */
    text: string;
    /** Badge type for styling. */
    kind: 'event' | 'levelup';
}

export interface NavigationViewModel {
    /** Active tab route for cold-start. */
    activeTab: TabRoute;
    /** Tab badges by route key. */
    badges: Record<TabRoute, TabBadge | null>;
}

/**
 * Determines which tab should be active on cold start based on game
 * state.
 *
 * Priority:
 * 1. Combat if in combat
 * 2. Exploration otherwise
 *
 * Events fire as a full-screen modal (see `app/event/index.tsx` +
 * `selectHasActiveEvent`), not a tab, so they do not participate in
 * tab selection.
 */
export function selectActiveTab(state: GameStore): TabRoute {
    // Legacy turn-based combat was removed from the engine (mechanics
    // 0.37.0). The engine now signals an active encounter via
    // `currentEncounter` (`selectIsInCombat`); live hazard combat runs
    // in the panel's local state, so this only routes for the engine's
    // own encounter bookkeeping.
    if (selectIsInCombat(state)) {
        return 'combat';
    }
    return 'exploration';
}

/**
 * Stable reference for the all-null badge state. Returning a fresh
 * object literal from a zustand selector triggers an infinite render
 * loop because `useStore` compares results by identity. The
 * steady-state path always returns this same frozen instance.
 */
const EMPTY_BADGES: Record<TabRoute, TabBadge | null> = Object.freeze({
    exploration: null,
    combat: null,
    character: null,
    memoir: null,
    inventory: null,
}) as Record<TabRoute, TabBadge | null>;

const EVENT_BADGE: TabBadge = Object.freeze({ text: '!', kind: 'event' });
const LEVELUP_BADGE: TabBadge = Object.freeze({ text: '↑', kind: 'levelup' });

/**
 * Tab badges for actionable states. Both badges park on the
 * `character` tab — the level-up badge logically belongs there (stat
 * upgrades live on the character screen), and the event badge sits
 * alongside until a navigation-pass phase splits them.
 *
 * When both predicates fire simultaneously, level-up wins — it's the
 * higher-agency action (stat-allocation prompt) versus a narrative
 * hint.
 *
 * Phase 29 Tick A: the levelup badge also requires
 * `notifications.levelUpAcknowledged === false` — i.e. a fresh
 * `character:levelup` engine event must have fired since the player
 * last visited the character screen. Avoids nagging after the player
 * has already seen the badge once.
 */
export function selectTabBadges(state: AppStoreState): Record<TabRoute, TabBadge | null> {
    const hasEvent = selectHasActiveEvent(state);
    const player = state.player;
    const experience = Number(player?.experience ?? 0);
    const toNext = Number(player?.experienceToNextLevel ?? 0);
    const xpReady = toNext > 0 && experience >= toNext;
    const levelUpAcknowledged = state.notifications?.levelUpAcknowledged ?? true;
    const levelupReady = xpReady && !levelUpAcknowledged;

    if (!hasEvent && !levelupReady) {
        return EMPTY_BADGES;
    }

    return {
        exploration: null,
        combat: null,
        character: levelupReady ? LEVELUP_BADGE : EVENT_BADGE,
        memoir: null,
        inventory: null,
    };
}

/**
 * Combined navigation view model for app shell.
 */
export function selectNavigationViewModel(state: AppStoreState): NavigationViewModel {
    const vm: NavigationViewModel = {
        activeTab: selectActiveTab(state),
        badges: selectTabBadges(state),
    };

    return freezeViewModel(vm);
}
