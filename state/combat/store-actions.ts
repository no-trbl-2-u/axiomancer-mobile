/**
 * Combat (hazard-pattern encounter) store-actions — mobile UI layer.
 *
 * The encounter engine (`CombatEncounterState`) is pure and the
 * `/combat-encounter` screen holds it in local React state, so unlike the
 * gathering/hazard slices there is no mobile combat session slice here. The
 * only thing that must outlive a single encounter is the *first-fight tutorial*
 * flag, so this module is deliberately tiny: one persistent flag and the action
 * that sets it, mirroring `completeGatheringTutorialAction`.
 */

import type { GameState } from 'axiomancer-mechanics';

import type { AppStore } from '../store';

/**
 * Flag set once the guided first hazard-combat tutorial is completed or
 * skipped, so it never auto-runs again. Lives on `GameState.flags` (a flat
 * string array that rides the save) — no migration needed: old saves simply
 * lack it and read as "not yet seen".
 */
export const COMBAT_TUTORIAL_FLAG = 'combat-tutorial-done';

/**
 * Marks the guided first combat as done (completed or skipped): sets the
 * persistent flag so the first-fight trigger never re-runs it, and persists.
 * Idempotent — safe to call again (e.g. when the dev button force-replays the
 * tutorial on a save that already has the flag).
 */
export function completeCombatTutorialAction(store: AppStore, skipped: boolean): void {
    const state = store.getState() as unknown as GameState;
    if (!(state.flags ?? []).includes(COMBAT_TUTORIAL_FLAG)) {
        store.setState({ flags: [...(state.flags ?? []), COMBAT_TUTORIAL_FLAG] } as never);
        try {
            store.getState().save();
        } catch {
            // Persistence failures must not strand the coach.
        }
    }
    void skipped;
}
