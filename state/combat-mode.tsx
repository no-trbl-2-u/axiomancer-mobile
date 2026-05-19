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
    exitCombatWith: (outcome: CombatOutcome) => void;
    /** Clear the lastOutcome signal — called after a consumer acts on it. */
    clearLastOutcome: () => void;
}

const CombatModeContext = createContext<CombatModeApi | null>(null);

export function CombatModeProvider({ children }: { children: React.ReactNode }) {
    const [inCombat, setInCombat] = useState<boolean>(false);
    const [lastOutcome, setLastOutcome] = useState<CombatOutcome | null>(null);

    const enterCombat = useCallback(() => {
        setInCombat(true);
        setLastOutcome(null);
    }, []);
    const exitCombat = useCallback(() => setInCombat(false), []);
    const exitCombatWith = useCallback((outcome: CombatOutcome) => {
        setInCombat(false);
        setLastOutcome(outcome);
    }, []);
    const clearLastOutcome = useCallback(() => setLastOutcome(null), []);

    const value = useMemo<CombatModeApi>(
        () => ({
            inCombat,
            enterCombat,
            exitCombat,
            lastOutcome,
            exitCombatWith,
            clearLastOutcome,
        }),
        [inCombat, enterCombat, exitCombat, lastOutcome, exitCombatWith, clearLastOutcome],
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
