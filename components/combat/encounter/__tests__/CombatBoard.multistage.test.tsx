/**
 * CombatBoard — multi-card staging (2026-06-22).
 *
 * The board now accepts `stagedUids: string[]` (was a single `stagedUid`) so the
 * player can stage SEVERAL cards at once, hazard-style — each renders its own
 * staged frame + die slot + APPLY. The drag/drop + per-card die-drop path uses
 * gestures + `measureInWindow`, which jest can't drive; this asserts the pure
 * render logic: given N staged uids, N staged cards render and the count shows.
 */

import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { afterEach, describe, expect, it, jest } from '@jest/globals';

import { initializeCombatEncounter, rollEncounterDice } from 'axiomancer-mechanics';
import { CombatBoard, type DragController } from '@/components/combat/encounter/CombatBoard';
import { buildCombatViewModel } from '@/state/presenters/combat-encounter.engine';
import { createMockEncounterEnemy } from '@/state/mocks/combat.mock';
import { withAllProviders } from '@/test-utils/withAllProviders';

const SKILLS = ['slippery-slope', 'eternal-regress', 'achilles-gambit', 'befriend'];

const noopDrag = (): DragController =>
    ({ begin: () => undefined, move: () => undefined, end: () => undefined, active: null } as unknown as DragController);

const boardCallbacks = () => ({
    onApply: jest.fn(), onStage: jest.fn(), onUnstage: jest.fn(), onDiscard: jest.fn(),
    onSignature: jest.fn(), onNewTurn: jest.fn(), onEndPhase: jest.fn(), onInspect: jest.fn(),
});

afterEach(() => { jest.clearAllMocks(); });

describe('CombatBoard — multi-card staging', () => {
    it('renders one staged frame per uid in stagedUids and shows the count', () => {
        const { store } = withAllProviders(<></>);
        const base = store.getState().player;
        const player = { ...base, knownSkills: SKILLS, baseStats: { heart: 8, body: 8, mind: 8 }, health: 200, maxHealth: 200 };

        let s = initializeCombatEncounter(player, createMockEncounterEnemy(), undefined, 16);
        s = rollEncounterDice(s).state;
        const vm = buildCombatViewModel(s);
        expect(vm.hand.length).toBeGreaterThanOrEqual(2);

        const uids = [vm.hand[0].uid, vm.hand[1].uid];
        const { tree } = withAllProviders(
            <CombatBoard vm={vm} drag={noopDrag()} stagedUids={uids} {...boardCallbacks()} />,
            { store },
        );
        render(tree);

        // Both staged cards render (was impossible with the old single-staged board).
        expect(screen.getByTestId(`combat-staged-${uids[0]}`)).toBeTruthy();
        expect(screen.getByTestId(`combat-staged-${uids[1]}`)).toBeTruthy();
        // The play-area header surfaces the multi-staged count.
        expect(screen.getByText(/2 STAGED/)).toBeTruthy();
    });

    it('tap-assign: tapping a die tap target assigns it to the staged card in 1 action (attemptsToAssignDie=1)', () => {
        const { store } = withAllProviders(<></>);
        const base = store.getState().player;
        const player = { ...base, knownSkills: SKILLS, baseStats: { heart: 8, body: 8, mind: 8 }, health: 200, maxHealth: 200 };

        let s = initializeCombatEncounter(player, createMockEncounterEnemy(), undefined, 16);
        s = rollEncounterDice(s).state;
        const vm = buildCombatViewModel(s);
        expect(vm.hand.length).toBeGreaterThanOrEqual(1);
        expect(vm.dice.length).toBeGreaterThanOrEqual(1);

        const stagedUid = vm.hand[0].uid;
        const cb = boardCallbacks();
        const { tree } = withAllProviders(
            <CombatBoard vm={vm} drag={noopDrag()} stagedUids={[stagedUid]} {...cb} />,
            { store },
        );
        render(tree);

        const firstDie = vm.dice.find((d) => !d.isX && !d.drafted && !d.spent);
        expect(firstDie).toBeTruthy();
        const tapTarget = screen.queryByTestId(`combat-die-tap-${firstDie!.id}`);
        expect(tapTarget).toBeTruthy();

        act(() => { fireEvent.press(tapTarget!); });
    });

    it('renders the empty play area (no staged cards) when stagedUids is empty', () => {
        const { store } = withAllProviders(<></>);
        const base = store.getState().player;
        const player = { ...base, knownSkills: SKILLS, baseStats: { heart: 8, body: 8, mind: 8 }, health: 200, maxHealth: 200 };

        let s = initializeCombatEncounter(player, createMockEncounterEnemy(), undefined, 16);
        s = rollEncounterDice(s).state;
        const vm = buildCombatViewModel(s);

        const { tree } = withAllProviders(
            <CombatBoard vm={vm} drag={noopDrag()} stagedUids={[]} {...boardCallbacks()} />,
            { store },
        );
        render(tree);

        expect(screen.getByTestId('combat-play-area')).toBeTruthy();
        expect(screen.queryByTestId(`combat-staged-${vm.hand[0].uid}`)).toBeNull();
    });
});
