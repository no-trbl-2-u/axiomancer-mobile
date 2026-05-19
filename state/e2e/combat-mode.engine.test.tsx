/**
 * Hermetic E2E Tests — Combat-mode context (Phase 41 follow-up)
 *
 * Pins the one-shot `lastOutcome` signal that the exploration screen
 * reads to render the post-victory aftermath banner. The signal
 * lives on the React-context shim at `state/combat-mode.tsx` (still
 * UI-only; not engine state yet — see the file's own JSDoc on the
 * Spec 02 migration plan).
 *
 * Hermetic = self-contained + deterministic + isolated. Uses
 * `react-test-renderer` semantics via React's createRoot + a small
 * effect-driven probe component to read the context API.
 */

import { afterEach, describe, it, expect } from '@jest/globals';
import { renderHook, act } from '@testing-library/react-native';
import React from 'react';

import { CombatModeProvider, useCombatMode } from '@/state/combat-mode';

afterEach(() => {
    // Each test isolates via its own renderHook; nothing global to reset.
});

function wrapper({ children }: { children: React.ReactNode }) {
    return <CombatModeProvider>{children}</CombatModeProvider>;
}

describe('combat-mode: lastOutcome signal', () => {
    it('starts null on a fresh provider', () => {
        const { result } = renderHook(() => useCombatMode(), { wrapper });
        expect(result.current.lastOutcome).toBeNull();
    });

    it('exitCombatWith stashes the outcome and flips inCombat to false', () => {
        const { result } = renderHook(() => useCombatMode(), { wrapper });
        act(() => result.current.enterCombat());
        expect(result.current.inCombat).toBe(true);
        expect(result.current.lastOutcome).toBeNull();

        act(() => result.current.exitCombatWith('victory'));
        expect(result.current.inCombat).toBe(false);
        expect(result.current.lastOutcome).toBe('victory');
    });

    it('exitCombatWith works for every CombatOutcome variant', () => {
        for (const outcome of ['victory', 'defeat', 'flee', 'parley'] as const) {
            const { result } = renderHook(() => useCombatMode(), { wrapper });
            act(() => result.current.enterCombat());
            act(() => result.current.exitCombatWith(outcome));
            expect(result.current.lastOutcome).toBe(outcome);
        }
    });

    it('clearLastOutcome resets to null without re-entering combat', () => {
        const { result } = renderHook(() => useCombatMode(), { wrapper });
        act(() => result.current.enterCombat());
        act(() => result.current.exitCombatWith('victory'));
        expect(result.current.lastOutcome).toBe('victory');

        act(() => result.current.clearLastOutcome());
        expect(result.current.lastOutcome).toBeNull();
        expect(result.current.inCombat).toBe(false);
    });

    it('enterCombat clears any stale lastOutcome from the prior fight', () => {
        const { result } = renderHook(() => useCombatMode(), { wrapper });
        act(() => result.current.enterCombat());
        act(() => result.current.exitCombatWith('victory'));
        expect(result.current.lastOutcome).toBe('victory');

        // Without a clearLastOutcome between fights, the new
        // enterCombat must reset — otherwise the banner from the
        // last fight would race the next aftermath signal.
        act(() => result.current.enterCombat());
        expect(result.current.lastOutcome).toBeNull();
        expect(result.current.inCombat).toBe(true);
    });

    it('plain exitCombat does NOT change lastOutcome (DEPART path stays silent)', () => {
        const { result } = renderHook(() => useCombatMode(), { wrapper });
        act(() => result.current.enterCombat());
        // No exitCombatWith call — the early-DEPART path uses plain
        // exitCombat so the banner stays silent.
        act(() => result.current.exitCombat());
        expect(result.current.inCombat).toBe(false);
        expect(result.current.lastOutcome).toBeNull();
    });
});
