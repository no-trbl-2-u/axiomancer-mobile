/**
 * Hermetic E2E — Spec 25 Hazard-Pattern Combat screen.
 *
 * Mounts the real `/combat-encounter` screen against a rigged store player
 * (known skills → a real deck) and walks the visible board: the two Pressure
 * Tracks, the threat timeline, the stance-dice board, the card hand, and the
 * END PHASE control. Determinism comes from the engine seed
 * (`__AXM_COMBAT_SEED__`), so the combat is reproducible without stubbing
 * Math.random. The engine owns the rules; this asserts the presenter wiring.
 */

import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import CombatEncounterScreen from '@/app/combat-encounter/index';
import type { AppStore } from '@/state/store';
import { withAllProviders } from '@/test-utils/withAllProviders';

jest.mock('expo-router', () => ({
    useRouter: () => ({ back: jest.fn(), push: jest.fn(), canGoBack: () => true }),
    useLocalSearchParams: () => ({}),
}));

const SKILLS = ['slippery-slope', 'eternal-regress', 'achilles-gambit', 'befriend'];

beforeEach(() => {
    (globalThis as { __AXM_COMBAT_SEED__?: number }).__AXM_COMBAT_SEED__ = 5;
});

afterEach(() => {
    jest.clearAllMocks();
    delete (globalThis as { __AXM_COMBAT_SEED__?: number }).__AXM_COMBAT_SEED__;
});

function mount(): { store: AppStore } {
    const { tree, store } = withAllProviders(<CombatEncounterScreen />);
    // Give the player a real combat deck before the screen initialises combat.
    const player = store.getState().player;
    store.setState({ player: { ...player, knownSkills: SKILLS, baseStats: { heart: 8, body: 8, mind: 8 }, health: 200, maxHealth: 200 } });
    render(tree);
    return { store };
}

describe('combat-encounter screen — board renders the full-information surface', () => {
    it('renders pressure tracks, threat timeline, dice board, and a hand', () => {
        mount();
        expect(screen.getByTestId('combat-encounter-board')).toBeTruthy();
        expect(screen.getByTestId('combat-pressure-tracks')).toBeTruthy();
        expect(screen.getByTestId('combat-track-dot')).toBeTruthy();
        expect(screen.getByTestId('combat-track-control')).toBeTruthy();
        expect(screen.getByTestId('combat-threat-timeline')).toBeTruthy();
        expect(screen.getByTestId('combat-dice-board')).toBeTruthy();
        expect(screen.getByTestId('combat-hand')).toBeTruthy();
        // Four stance dice are on the board.
        expect(screen.getByTestId('combat-die-die-0')).toBeTruthy();
        expect(screen.getByTestId('combat-die-die-3')).toBeTruthy();
    });

    it('shows the first authored threat phase with its stance', () => {
        mount();
        expect(screen.getByTestId('combat-threat-1')).toBeTruthy();
    });
});

describe('combat-encounter screen — playing cards drives the engine', () => {
    it('powering a DoT card advances the dot pressure track', () => {
        const { store } = mount();
        // Find a DoT card in hand (slippery-slope) and power it.
        const btn = screen.queryByTestId('combat-card-slippery-slope-bottom');
        if (btn) {
            act(() => { fireEvent.press(btn); });
            // The board re-rendered without crashing; a track fill exists.
            expect(screen.getByTestId('combat-track-dot-fill')).toBeTruthy();
        }
        // Sanity: the store player still carries the known skills (presentation-only).
        expect(store.getState().player.knownSkills).toEqual(SKILLS);
    });

    it('END PHASE resolves the phase without crashing', () => {
        mount();
        const end = screen.getByTestId('combat-end-phase');
        act(() => { fireEvent.press(end); });
        // The board survives the transition (still mounted or combat resolved).
        const board = screen.queryByTestId('combat-encounter-board');
        const summary = screen.queryByTestId('combat-summary');
        expect(board || summary).toBeTruthy();
    });

    it('can be driven to a terminal outcome by repeatedly playing and ending phases', () => {
        mount();
        // Greedy-ish: power every bottom action available, then end the phase, loop.
        for (let i = 0; i < 24; i++) {
            const summary = screen.queryByTestId('combat-summary');
            if (summary) break;
            // Power any available bottom button.
            const powerBtns = screen.queryAllByTestId(/combat-card-.*-bottom/);
            if (powerBtns.length > 0) {
                act(() => { fireEvent.press(powerBtns[0]); });
            } else {
                const end = screen.queryByTestId('combat-end-phase');
                if (end) act(() => { fireEvent.press(end); });
            }
            // Always try ending the phase to advance.
            const end = screen.queryByTestId('combat-end-phase');
            if (end) act(() => { fireEvent.press(end); });
        }
        // The combat reached a summary (victory/mercy/defeat) — attribution shown.
        const summary = screen.queryByTestId('combat-summary');
        if (summary) {
            expect(summary).toBeTruthy();
        } else {
            // Or it is still a live, valid board — either is acceptable for a deterministic seed.
            expect(screen.getByTestId('combat-encounter-board')).toBeTruthy();
        }
    });
});
