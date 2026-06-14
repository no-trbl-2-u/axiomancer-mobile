/**
 * Rest encounter ("The Night Watch") — store action glue.
 *
 * The pure engine lives in `axiomancer-mechanics` (World/Rest); these
 * wrappers thread the night through the mobile `rest` slice and, at
 * claim, apply the dawn outcome to the real `GameState`: vitae
 * restored by `healFraction`, lingering effects cleansed when the
 * fire held, dream keepsakes banked as flags. A night never harms
 * the player — the engine guarantees heal ≥ 0.
 */

import type { GameState } from 'axiomancer-mechanics';

import {
    chooseRestOption as engineChooseOption,
    chooseRestPosture as engineChoosePosture,
    claimRestOutcome as engineClaim,
    continueRestWatch as engineContinue,
    createRestSession,
} from 'axiomancer-mechanics';
import type { RestOutcomeTier, RestPosture, RestSession } from 'axiomancer-mechanics';
import { resolveMinigameSeed } from '../minigame-seeds';
import { EMPTY_REST_SLICE, type AppStore } from '../store';

/** Flag prefix banking a held dream / watchful find. */
export const REST_KEEPSAKE_FLAG_PREFIX = 'night-keepsake:';

/**
 * Dev/test seed override (`globalThis.__AXM_REST_SEED__`), mirroring
 * the hazard/gathering/quest hooks.
 */
declare global {
    // eslint-disable-next-line no-var
    var __AXM_REST_SEED__: number | undefined;
}

function setSession(store: AppStore, session: RestSession | null): void {
    store.setState({ rest: { session } });
}

export interface BeginRestOptions {
    seed?: number;
    /** Authored baseline from the map-event payload (default 1.0). */
    healFraction?: number;
}

export function beginRestAction(store: AppStore, options: BeginRestOptions = {}): boolean {
    const state = store.getState();
    if (state.rest?.session) return false; // one night at a time
    const seed = resolveMinigameSeed('rest', options.seed, globalThis.__AXM_REST_SEED__);
    setSession(store, createRestSession(seed, options.healFraction ?? 1.0));
    return true;
}

export function chooseRestPostureAction(store: AppStore, posture: RestPosture): void {
    const s = store.getState().rest?.session;
    if (!s) return;
    setSession(store, engineChoosePosture(s, posture));
}

export function chooseRestOptionAction(store: AppStore, optionId: string): void {
    const s = store.getState().rest?.session;
    if (!s) return;
    setSession(store, engineChooseOption(s, optionId));
}

export function continueRestWatchAction(store: AppStore): void {
    const s = store.getState().rest?.session;
    if (!s) return;
    setSession(store, engineContinue(s));
}

export interface ClaimRestOutcomeResult {
    applied: boolean;
    healed: number;
    cleansed: boolean;
    tier: RestOutcomeTier | null;
    keepsakes: readonly string[];
}

const NOOP_CLAIM: ClaimRestOutcomeResult = Object.freeze({
    applied: false,
    healed: 0,
    cleansed: false,
    tier: null,
    keepsakes: Object.freeze([]),
});

/**
 * Confirms the dawn ledger and applies the night to the engine
 * `GameState`: heal (fraction of max vitae, capped), effect cleanse
 * when the fire held, keepsakes banked as flags. Clears the slice and
 * persists.
 */
export function claimRestOutcomeAction(store: AppStore): ClaimRestOutcomeResult {
    const s = store.getState().rest?.session;
    if (!s || !s.outcome) return NOOP_CLAIM;
    const done = engineClaim(s);
    if (done.phase !== 'done') return NOOP_CLAIM;

    const outcome = s.outcome;
    const state = store.getState() as unknown as GameState;
    const player = state.player;

    const healed = Math.min(
        player.maxHealth - player.health,
        Math.round(player.maxHealth * outcome.healFraction),
    );

    let flags = state.flags ?? [];
    for (const keepsake of outcome.keepsakes) {
        const flag = `${REST_KEEPSAKE_FLAG_PREFIX}${keepsake}`;
        if (!flags.includes(flag)) flags = [...flags, flag];
    }

    store.setState({
        player: {
            ...player,
            health: player.health + healed,
            ...(outcome.cleansed ? { effects: [] } : {}),
        },
        flags,
        rest: EMPTY_REST_SLICE,
    } as never);

    try {
        store.getState().save();
    } catch {
        // Persistence failures must not strand the player on the ledger.
    }

    return {
        applied: true,
        healed,
        cleansed: outcome.cleansed,
        tier: outcome.tier,
        keepsakes: outcome.keepsakes,
    };
}

/** Clears the night without a heal (dev / navigation escape). */
export function abandonRestAction(store: AppStore): void {
    setSession(store, null);
}
