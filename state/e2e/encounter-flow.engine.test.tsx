/**
 * Hermetic integration tests — encounter modal flow (Phase 64 Tick B+C).
 *
 * Mounts the encounter modal with the full provider stack
 * (`withAllProviders`) and drives the prelude → combat
 * transition end-to-end. Each test pins a contract that a
 * single-component test couldn't reach — the bugs caught by
 * commits `ce90615` (route-replace removal) and `d460b64`
 * (modal stays mounted after event-slice clear) would have
 * surfaced here at test time, not in the preview build.
 *
 * Hermetic = self-contained + deterministic + isolated. See
 * `docs/testing.md`.
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import { createEnemy } from 'axiomancer-mechanics';
import React from 'react';

import { EncounterModalOverlay } from '@/components/event/EncounterModalOverlay';
import { withAllProviders } from '@/test-utils/withAllProviders';
import type { EventViewModel } from '@/state/presenters/event.engine';

afterEach(() => {
    jest.restoreAllMocks();
});

function makePreludeVm(overrides: Partial<EventViewModel> = {}): EventViewModel {
    return {
        kind: 'combat-prelude',
        variant: 'encounter',
        artSlug: 'encounter',
        badge: 'ENCOUNTER',
        badgeAccentKey: 'blood',
        title: 'CAIRN-ROT',
        subtitle: 'something stirs',
        body: 'level 1 · 10 hp.',
        choices: [
            {
                id: 'fight',
                label: 'FIGHT',
                description: 'Combat',
                consequences: [],
                iconKey: 'sword',
                accentKey: 'blood',
                enabled: true,
                subtitle: null, decode: null,
            },
            {
                id: 'flee',
                label: 'FLEE',
                description: 'Luck Save',
                consequences: [],
                iconKey: 'flee',
                accentKey: 'bone',
                enabled: true,
                subtitle: null, decode: null,
            },
        ],
        lore: null,
        canSkip: false,
        preludeChrome: {
            eyebrow: 'ENCOUNTER',
            sashLabel: 'STRIFE STIRS',
            sealLabel: 'SEALED · NO RETREAT',
            fleeDisabledHint: 'no retreat from this one.',
        },
        chrome: {
            reckoningEyebrow: '✠ A RECKONING',
            skipLabel: 'SKIP ›',
            emptyBackLabel: 'BACK',
            emptyBackSub: 'RETURN',
        },
        sourceNodeType: null,
        ...overrides,
    };
}

function makeTestEnemy() {
    return createEnemy({
        id: 'test-foe',
        name: 'Test Foe',
        description: 'A test enemy',
        level: 1,
        baseStats: { heart: 1, body: 1, mind: 1 },
        mapName: 'fishing-village',
        logic: 'random',
    });
}

describe('integration: encounter modal prelude → combat lifecycle', () => {
    it('mounts the overlay on a combat-prelude VM under the full provider stack', () => {
        const { tree } = withAllProviders(
            <EncounterModalOverlay vm={makePreludeVm()} onFight={() => {}} onFlee={() => {}} />,
        );
        const rendered = render(tree);
        expect(rendered.queryByTestId('encounter-modal-overlay')).not.toBeNull();
        expect(rendered.queryByTestId('encounter-modal-fight')).not.toBeNull();
    });

    it('keeps the overlay mounted across a parent re-render with cleared VM (the d460b64 regression check)', () => {
        // Phase 63 shipped with a bug where the overlay's
        // unconditional `if (vm.kind !== 'combat-prelude') return null`
        // fired the moment `pickEventChoice('fight')` cleared the
        // event slice, unmounting the modal mid-encounter. This
        // test simulates that re-render and asserts the overlay
        // stays in the tree once mode has flipped to 'combat'.
        const { tree, store } = withAllProviders(
            <EncounterModalOverlay vm={makePreludeVm()} onFight={() => {}} onFlee={() => {}} />,
        );
        const { rerender, queryByTestId, getByTestId } = render(tree);

        // Tap FIGHT — internal mode flips prelude → combat.
        fireEvent.press(getByTestId('encounter-modal-fight'));
        expect(queryByTestId('encounter-modal-combat-mode')).not.toBeNull();

        // Re-render with a VM whose kind is no longer combat-prelude,
        // simulating what the parent (exploration) passes after the
        // event slice clears. The overlay used to return null here.
        const clearedVm: EventViewModel = {
            ...makePreludeVm(),
            kind: 'narrative-choice',
            preludeChrome: null,
        };
        const { tree: rerenderTree } = withAllProviders(
            <EncounterModalOverlay vm={clearedVm} onFight={() => {}} onFlee={() => {}} />,
            { store }, // keep the same store so combat-mode state persists
        );
        rerender(rerenderTree);

        // Overlay + combat-mode wrap stay mounted; prelude FIGHT
        // button is gone (we're past prelude now).
        expect(queryByTestId('encounter-modal-overlay')).not.toBeNull();
        expect(queryByTestId('encounter-modal-combat-mode')).not.toBeNull();
        expect(queryByTestId('encounter-modal-fight')).toBeNull();
    });

    it('overlay does NOT mount when vm.kind is not combat-prelude AND mode has not advanced', () => {
        const narrativeVm: EventViewModel = {
            ...makePreludeVm(),
            kind: 'narrative-choice',
            preludeChrome: null,
        };
        const { tree } = withAllProviders(
            <EncounterModalOverlay vm={narrativeVm} onFight={() => {}} onFlee={() => {}} />,
        );
        const rendered = render(tree);
        // Initial render: mode is 'prelude' (default) AND vm isn't
        // combat-prelude → early-return null. Nothing in the tree.
        expect(rendered.toJSON()).toBeNull();
    });
});

describe('integration: combat-in-modal — engine state actually mutates on action tap', () => {
    // Phase 64 Tick C — the [9.8] combat-mechanics row's narrowing
    // step. User report: "choosing the Action does nothing but logs
    // it to the screen." The diagnostic toast firing confirms the
    // handler runs; the question is whether the downstream
    // `actions.setPlayerAction` + `actions.resolveRound` actually
    // mutate engine state. This test answers it directly by
    // driving combat from action layer + asserting engine state.

    it('startCombat populates combat slice; setPlayerStance commits to combat.playerChoice', () => {
        const { store } = withAllProviders(<></>);
        expect(store.getState().combat).toBeNull();

        store.getState().startCombat(makeTestEnemy());
        expect(store.getState().combat).not.toBeNull();
        expect(store.getState().combat?.phase).toBe('choosing_stance');

        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { setPlayerStance: combatSetPlayerStance } = require('axiomancer-mechanics');
        const combat = store.getState().combat!;
        store.getState().updateCombat(combatSetPlayerStance(combat, 'heart'));

        const after = store.getState().combat!;
        expect(after.playerChoice.stance).toBe('heart');
    });

    it('action layer: resolveRound runs end-to-end and engine combat.phase advances to resolving', () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { createAppActions } = require('@/state/actions');
        const { store } = withAllProviders(<></>);
        const actions = createAppActions(store);

        actions.startCombat(makeTestEnemy());
        actions.setPlayerStance('heart');
        actions.setCombatPhase('choosing_action');
        actions.setPlayerAction('attack');

        const result = actions.resolveRound();

        // After resolveRound, engine state should be in the
        // 'resolving' phase with a round outcome (not bailed early).
        // If this assertion fails on a future change, the [9.8]
        // symptom of "action does nothing" likely has the same root
        // cause as whatever broke this test.
        expect(store.getState().combat?.phase).toBe('resolving');
        // Sanity: resolveRound returned a meaningful result, not the
        // null-return early-exit.
        expect(result.endReason).toBeDefined();
    });
});
