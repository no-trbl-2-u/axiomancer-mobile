/**
 * Hazard minigame — store action implementations.
 *
 * The pure engine (`state/hazard/engine.ts`) owns every rule; these
 * wrappers thread the session through the mobile store slice and, at
 * claim time, apply the outcome to the real engine `GameState`
 * (VITAE, max VITAE, currency, deck flags). See
 * `docs/hazard-v2-vs-mechanics-divergence.md` for what applies live
 * vs. what is recorded as flags pending engine systems.
 */

import type { GameState } from 'axiomancer-mechanics';

import {
    acknowledgeHazardOutcome as engineAcknowledgeOutcome,
    claimHazardRewards as engineClaimRewards,
    continueHazardAfterResolve as engineContinueAfterResolve,
    createHazardSession,
    finishHazardRolling as engineFinishRolling,
    powerHazardCard as enginePowerCard,
    resolveHazardRound as engineResolveRound,
    selectHazardRoute as engineSelectRoute,
    stageHazardCard as engineStageCard,
    unstageHazardCard as engineUnstageCard,
} from './engine';
import {
    HAZARD_CACHE_SHILLINGS,
    HAZARD_CRACK_CARD,
    HAZARD_LIBRARY,
    HAZARD_MAXHP_SCAR,
    HAZARD_MINHP_LOSS,
    HAZARD_RELIC_SHILLINGS,
    HAZARD_VITAE_REWARD,
} from './content';
import { appendAcquiredCard, hazardDeckBag } from './deck-flags';
import type { HazardRouteKey, HazardSessionState } from './types';
import type { AppStore } from '../store';

export interface MobileHazardSlice {
    session: HazardSessionState | null;
}

export const EMPTY_HAZARD_SLICE: MobileHazardSlice = Object.freeze({ session: null });

/** Flag set by the `curse` consequence — future combat integration hook. */
export const HAZARD_HEXED_FLAG = 'hazard-hexed';
/** Flag prefix for banked paradox tokens granted by the `token` reward. */
export const HAZARD_TOKEN_FLAG_PREFIX = 'hazard-token-banked:';

/**
 * Dev/test seed override. The Playwright playthrough (and any dev
 * tooling) sets `globalThis.__AXM_HAZARD_SEED__` /
 * `globalThis.__AXM_HAZARD_ID__` before triggering a hazard to get a
 * reproducible session. Ignored when unset.
 */
declare global {
    // eslint-disable-next-line no-var
    var __AXM_HAZARD_SEED__: number | undefined;
    // eslint-disable-next-line no-var
    var __AXM_HAZARD_ID__: string | undefined;
}

function currentBag(store: AppStore): string[] {
    const flags = (store.getState() as unknown as GameState).flags ?? [];
    return hazardDeckBag(flags);
}

function setSession(store: AppStore, session: HazardSessionState | null): void {
    store.setState({ hazard: { session } });
}

export interface BeginHazardOptions {
    hazardId?: string;
    seed?: number;
}

export function beginHazardAction(store: AppStore, options: BeginHazardOptions = {}): boolean {
    const state = store.getState();
    if (state.hazard?.session) return false; // one crisis at a time
    const seed =
        options.seed ??
        globalThis.__AXM_HAZARD_SEED__ ??
        // Non-deterministic by design outside tests: mix wall clock and
        // Math.random into a 32-bit seed.
        ((Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0);
    let hazardId = options.hazardId ?? globalThis.__AXM_HAZARD_ID__;
    if (!hazardId) {
        hazardId = HAZARD_LIBRARY[Math.abs(seed) % HAZARD_LIBRARY.length].id;
    }
    const session = createHazardSession(seed, currentBag(store), hazardId);
    setSession(store, session);
    return true;
}

export function selectHazardRouteAction(store: AppStore, route: HazardRouteKey): void {
    const s = store.getState().hazard?.session;
    if (!s) return;
    setSession(store, engineSelectRoute(s, route, currentBag(store)));
}

export function finishHazardRollingAction(store: AppStore): void {
    const s = store.getState().hazard?.session;
    if (!s) return;
    setSession(store, engineFinishRolling(s));
}

export function stageHazardCardAction(store: AppStore, uid: string): void {
    const s = store.getState().hazard?.session;
    if (!s) return;
    setSession(store, engineStageCard(s, uid, currentBag(store)));
}

export function unstageHazardCardAction(store: AppStore, uid: string): void {
    const s = store.getState().hazard?.session;
    if (!s) return;
    setSession(store, engineUnstageCard(s, uid));
}

export function powerHazardCardAction(store: AppStore, uid: string, dieId: string): void {
    const s = store.getState().hazard?.session;
    if (!s) return;
    setSession(store, enginePowerCard(s, uid, dieId, currentBag(store)));
}

export function resolveHazardRoundAction(store: AppStore): void {
    const s = store.getState().hazard?.session;
    if (!s) return;
    setSession(store, engineResolveRound(s));
}

export function continueHazardAfterResolveAction(store: AppStore): void {
    const s = store.getState().hazard?.session;
    if (!s) return;
    setSession(store, engineContinueAfterResolve(s, currentBag(store)));
}

export function acknowledgeHazardOutcomeAction(store: AppStore): void {
    const s = store.getState().hazard?.session;
    if (!s) return;
    setSession(store, engineAcknowledgeOutcome(s));
}

export interface ClaimHazardRewardsResult {
    applied: boolean;
    vitaeDelta: number;
    maxVitaeDelta: number;
    shillings: number;
    cardAdded: string | null;
    crackAdded: boolean;
    tokensBanked: number;
    tokensLost: boolean;
    hexed: boolean;
}

const NOOP_CLAIM: ClaimHazardRewardsResult = Object.freeze({
    applied: false,
    vitaeDelta: 0,
    maxVitaeDelta: 0,
    shillings: 0,
    cardAdded: null,
    crackAdded: false,
    tokensBanked: 0,
    tokensLost: false,
    hexed: false,
});

/**
 * Confirms the rewards modal and applies the whole outcome to the
 * engine `GameState`:
 *
 *  rewards     — `vitae` heals; `cache`/`relic` grant shillings;
 *                `token` banks a paradox-token flag.
 *  reserves    — +1 VITAE per unspent non-hex die (REC#3).
 *  consequences— `minhp` damages; `maxhp` scars max VITAE;
 *                `deadcard` shuffles a CRACK into the deck flags;
 *                `tokens` clears banked token flags; `curse` sets the
 *                hexed flag.
 *  penalty     — route penaltyVitae × lost rounds.
 *  card pick   — appended to the persistent deck flags.
 *
 * VITAE never drops below 1 here: hazards maim, they do not kill
 * (documented divergence — the engine has no out-of-combat death).
 */
export function claimHazardRewardsAction(store: AppStore, cardId: string | null): ClaimHazardRewardsResult {
    const s = store.getState().hazard?.session;
    if (!s || !s.outcome) return NOOP_CLAIM;
    const done = engineClaimRewards(s, cardId);
    if (done.phase !== 'done') return NOOP_CLAIM;

    const outcome = s.outcome;
    const state = store.getState() as unknown as GameState;
    let flags = (state.flags ?? []).slice();
    let vitaeDelta = 0;
    let maxVitaeDelta = 0;
    let shillings = 0;
    let tokensBanked = 0;
    let tokensLost = false;
    let hexed = false;
    let crackAdded = false;

    for (const reward of outcome.rewards) {
        if (reward === 'vitae') vitaeDelta += HAZARD_VITAE_REWARD;
        if (reward === 'cache') shillings += HAZARD_CACHE_SHILLINGS;
        if (reward === 'relic') shillings += HAZARD_RELIC_SHILLINGS;
        if (reward === 'token') {
            tokensBanked += 1;
            flags = [...flags, `${HAZARD_TOKEN_FLAG_PREFIX}${Date.now()}-${flags.length}`];
        }
    }
    vitaeDelta += outcome.reserveBonus;

    for (const consequence of outcome.consequences) {
        if (consequence === 'minhp') vitaeDelta -= HAZARD_MINHP_LOSS;
        if (consequence === 'maxhp') maxVitaeDelta -= HAZARD_MAXHP_SCAR;
        if (consequence === 'deadcard') {
            flags = appendAcquiredCard(flags, HAZARD_CRACK_CARD.id);
            crackAdded = true;
        }
        if (consequence === 'tokens') {
            tokensLost = true;
            flags = flags.filter((f) => !f.startsWith(HAZARD_TOKEN_FLAG_PREFIX));
        }
        if (consequence === 'curse') {
            hexed = true;
            if (!flags.includes(HAZARD_HEXED_FLAG)) flags = [...flags, HAZARD_HEXED_FLAG];
        }
    }
    vitaeDelta -= outcome.penaltyVitae;

    if (done.pickedRewardCardId) {
        flags = appendAcquiredCard(flags, done.pickedRewardCardId);
    }

    const player = state.player;
    const newMax = Math.max(5, player.maxHealth + maxVitaeDelta);
    const newHealth = Math.min(newMax, Math.max(1, player.health + vitaeDelta));
    store.setState({
        player: {
            ...player,
            maxHealth: newMax,
            health: newHealth,
            currency: player.currency + shillings,
        },
        flags,
        hazard: { session: null },
    } as never);

    // Persist immediately — the hazard's spoils and scars are exactly the
    // kind of moment the explicit-save policy exists for.
    try {
        store.getState().save();
    } catch {
        // Persistence failures must not strand the player on the modal.
    }

    return {
        applied: true,
        vitaeDelta,
        maxVitaeDelta,
        shillings,
        cardAdded: done.pickedRewardCardId,
        crackAdded,
        tokensBanked,
        tokensLost,
        hexed,
    };
}

/** Clears the session without rewards or penalties (dev / navigation escape). */
export function abandonHazardAction(store: AppStore): void {
    setSession(store, null);
}
