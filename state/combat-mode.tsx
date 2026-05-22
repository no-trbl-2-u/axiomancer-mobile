/**
 * UI-only flag tracking whether the player is currently in combat.
 *
 * This is a temporary shim: once Spec 02 wires the engine store into the
 * app, callers should swap to `useGameStore(s => s.combat !== null)` and
 * this module can be deleted.
 *
 * Also carries a one-shot "last outcome" signal (Phase 41 port) the
 * exploration screen reads to render the post-victory aftermath
 * banner. When combat exits via `exitCombatWith(outcome)`, the
 * outcome stays on the context until the next consumer calls
 * `clearLastOutcome()` (typically the banner's auto-dismiss timer).
 */

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type CombatOutcome = 'victory' | 'defeat' | 'flee' | 'parley';

/**
 * Phase 70 Tick A — snapshot captured at the moment combat exits
 * with `victory` (or, in later ticks, `parley` / `defeat`). The
 * combat slice is cleared as part of `actions.endCombat()`, so the
 * aftermath panel can't read live state — the calling site snapshots
 * the fields the panel needs and stashes them here for the modal
 * mode swap to consume.
 *
 * Tick A populates `enemy` + `finalBlow` only. Currency / loot
 * surface in later ticks once the engine exposes them; until then
 * the presenter renders `null` and the panel collapses those rows.
 *
 * Discriminated union so later ticks can extend without churn — the
 * `variant` field keys off the outcome class. Tick A ships
 * `'victory'` only.
 */
export type AftermathData =
    | {
          variant: 'victory';
          enemy: { name: string; description: string; level: number };
          finalBlow: { skillName: string | null; damage: number; descriptor: string | null } | null;
          xpReward: number | null;
      }
    | { variant: 'parley'; enemy: { name: string; description: string; level: number } }
    | { variant: 'defeat'; enemy: { name: string; description: string; level: number } };

/**
 * Display chrome for the post-combat aftermath banner, keyed off the
 * outcome. Lifted off the screen (was inline branching in
 * `app/(tabs)/exploration/index.tsx`) per Hard Rule #8 — no display
 * literals in the view layer. Filed via critique pass 16 (MED voice
 * finding). Per-outcome copy chosen to fit the ritual register —
 * 'IT IS DONE / The foe fell.' is the victory finality; 'IT IS WON /
 * The foe yielded.' reads as a parley peace. `defeat` and `flee`
 * return null because the banner stays silent on those paths (the
 * mount-side guard in exploration filters them out, but the helper
 * is total for safety).
 */
export interface AftermathCopy {
    eyebrow: string;
    title: string;
    /** Italic subtitle below the title. Currently invariant across
     * outcomes that surface a banner; kept as a field so future
     * outcome-specific subtitles can branch without re-touching
     * the screen. */
    subtitle: string;
}

const AFTERMATH_SUBTITLE = 'The map returns. Walk on.';

export function selectAftermathCopy(outcome: CombatOutcome): AftermathCopy | null {
    switch (outcome) {
        case 'victory':
            return {
                eyebrow: 'IT IS DONE',
                title: 'The foe fell.',
                subtitle: AFTERMATH_SUBTITLE,
            };
        case 'parley':
            return {
                eyebrow: 'IT IS WON',
                title: 'The foe yielded.',
                subtitle: AFTERMATH_SUBTITLE,
            };
        case 'defeat':
        case 'flee':
            return null;
    }
}

export interface CombatModeApi {
    inCombat: boolean;
    enterCombat: () => void;
    exitCombat: () => void;
    /**
     * One-shot signal of the previous combat's outcome, or `null`
     * when there's nothing fresh to surface. Cleared by
     * `clearLastOutcome()` once the consumer has acted on it.
     */
    lastOutcome: CombatOutcome | null;
    /**
     * Exit combat and stash the outcome for the next consumer to
     * read. Equivalent to `exitCombat()` followed by setting the
     * outcome; combined into one call so the in-combat → outcome
     * transition is atomic for downstream effects.
     */
    exitCombatWith: (outcome: CombatOutcome, data?: AftermathData) => void;
    /** Clear the lastOutcome signal — called after a consumer acts on it. */
    clearLastOutcome: () => void;
    /**
     * Phase 70 Tick A — snapshot stashed alongside `lastOutcome`.
     * The aftermath panel reads this for enemy / final-blow / reward
     * data instead of the (now-null) combat slice. Cleared by
     * `dismissAftermath()` when the panel's CARRY ON button fires.
     */
    aftermathData: AftermathData | null;
    /**
     * Phase 70 Tick A — the encounter-modal aftermath panel's
     * CARRY ON button calls this to atomically clear the outcome
     * signal, drop the snapshot, and close the encounter modal. The
     * combat slice itself is cleared earlier (by `actions.endCombat()`
     * at the moment the exit fired); this is just the modal-side
     * teardown.
     */
    dismissAftermath: () => void;
    /**
     * Phase 63c — true while the encounter modal is mounted (prelude,
     * in-modal combat, or aftermath). Drives two contracts:
     *
     *   1. Exploration keeps `<EncounterModalOverlay>` mounted across
     *      the entire prelude → combat → aftermath lifecycle, even
     *      after `state.combat` goes non-null (which would otherwise
     *      flip `selectHasActiveEvent` to false and unmount the modal
     *      mid-encounter).
     *   2. The tab bar hides while a modal session is active, enforcing
     *      the "hard stop" — user can't switch tabs until the encounter
     *      resolves (chat1: "user cannot exit these modals").
     *
     * Set true via `openEncounterModal()` when the encounter prelude
     * mounts; cleared via `closeEncounterModal()` when the aftermath
     * dismisses (or the player flees / dies).
     */
    inEncounterModal: boolean;
    openEncounterModal: () => void;
    closeEncounterModal: () => void;
}

const CombatModeContext = createContext<CombatModeApi | null>(null);

export function CombatModeProvider({ children }: { children: React.ReactNode }) {
    const [inCombat, setInCombat] = useState<boolean>(false);
    const [lastOutcome, setLastOutcome] = useState<CombatOutcome | null>(null);
    const [aftermathData, setAftermathData] = useState<AftermathData | null>(null);
    const [inEncounterModal, setInEncounterModal] = useState<boolean>(false);

    const enterCombat = useCallback(() => {
        setInCombat(true);
        setLastOutcome(null);
        setAftermathData(null);
    }, []);
    const exitCombat = useCallback(() => setInCombat(false), []);
    const exitCombatWith = useCallback((outcome: CombatOutcome, data?: AftermathData) => {
        setInCombat(false);
        setLastOutcome(outcome);
        setAftermathData(data ?? null);
    }, []);
    const clearLastOutcome = useCallback(() => {
        setLastOutcome(null);
        setAftermathData(null);
    }, []);
    const openEncounterModal = useCallback(() => setInEncounterModal(true), []);
    const closeEncounterModal = useCallback(() => setInEncounterModal(false), []);
    const dismissAftermath = useCallback(() => {
        setLastOutcome(null);
        setAftermathData(null);
        setInEncounterModal(false);
    }, []);

    const value = useMemo<CombatModeApi>(
        () => ({
            inCombat,
            enterCombat,
            exitCombat,
            lastOutcome,
            exitCombatWith,
            clearLastOutcome,
            aftermathData,
            dismissAftermath,
            inEncounterModal,
            openEncounterModal,
            closeEncounterModal,
        }),
        [
            inCombat,
            enterCombat,
            exitCombat,
            lastOutcome,
            exitCombatWith,
            clearLastOutcome,
            aftermathData,
            dismissAftermath,
            inEncounterModal,
            openEncounterModal,
            closeEncounterModal,
        ],
    );

    return <CombatModeContext.Provider value={value}>{children}</CombatModeContext.Provider>;
}

export function useCombatMode(): CombatModeApi {
    const ctx = useContext(CombatModeContext);
    if (ctx === null) {
        throw new Error('useCombatMode must be used inside <CombatModeProvider>');
    }
    return ctx;
}
