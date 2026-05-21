/**
 * Hermetic integration tests — `useCombatViewModel` hook contract.
 *
 * Phase 65 Tick A. The `[9.8]` AUDIT row root-caused to React
 * Compiler interaction with `useMemo` + `store.getState()` reads
 * inside the hook factory: the compiler's static analysis could not
 * see store reads, treated the manual deps array as a hint, and
 * cached the vm across renders so `vm.phase` stayed
 * `'choosing_action'` even when engine `combat.phase` advanced to
 * `'resolving'`.
 *
 * The fix is the `'use no memo'` directive on the hook (opting out
 * of the compiler so the manual `useMemo` is respected). These tests
 * mount a wrapper component that uses the hook through the full
 * provider stack, dispatch through the action layer end-to-end, and
 * assert the vm shape on every render. Jest itself doesn't invoke
 * React Compiler, so this catches *the intent* — if a future
 * refactor breaks the deps array semantically (or if React Compiler
 * is removed later and we forget to migrate), the same pattern in
 * the production build will surface here.
 */

import { describe, expect, it } from '@jest/globals';
import { act, render } from '@testing-library/react-native';
import { createEnemy } from 'axiomancer-mechanics';
import React from 'react';
import { Text, View } from 'react-native';

import { createAppActions } from '@/state/actions';
import { useCombatViewModel } from '@/state/presenters/combat.engine';
import { withAllProviders } from '@/test-utils/withAllProviders';

function makeTestEnemy() {
    return createEnemy({
        id: 'test-foe',
        name: 'Test Foe',
        description: 'A test enemy',
        level: 1,
        baseStats: { heart: 2, body: 2, mind: 2 },
        mapName: 'fishing-village',
        logic: 'random',
    });
}

/**
 * Thin probe component that exposes the current `vm.phase` /
 * `vm.enemy.hp` / `vm.player.hp` / `vm.stancePicker.selected` as
 * testIDs so the test body can read them after each act() pulse.
 */
function CombatVmProbe({ selectedStance }: { selectedStance?: 'heart' | 'body' | 'mind' }) {
    const vm = useCombatViewModel({ selectedStance });
    return (
        <View>
            <Text testID="probe-phase">{vm.phase}</Text>
            <Text testID="probe-enemy-hp">{String(vm.enemy.hp)}</Text>
            <Text testID="probe-player-hp">{String(vm.player.hp)}</Text>
            <Text testID="probe-is-in-combat">{String(vm.isInCombat)}</Text>
            <Text testID="probe-stance-selected">{vm.stancePicker.selected ?? 'none'}</Text>
        </View>
    );
}

describe('useCombatViewModel: phase advances through React render cycles', () => {
    it('vm.phase flips from choosing_action to resolving after actions.resolveRound() (the [9.8] regression check)', () => {
        const { tree, store } = withAllProviders(<CombatVmProbe selectedStance="mind" />);
        const actions = createAppActions(store);

        const rendered = render(tree);

        // Boot combat + advance to choosing_action.
        act(() => {
            actions.startCombat(makeTestEnemy());
            actions.setPlayerStance('mind');
            actions.setCombatPhase('choosing_action');
        });
        expect(rendered.getByTestId('probe-phase').children[0]).toBe('choosing_action');
        expect(rendered.getByTestId('probe-is-in-combat').children[0]).toBe('true');

        // The bug: tap ATTACK → action layer dispatches
        // setPlayerAction + resolveRound → engine combat.phase
        // becomes 'resolving'. The hook must re-render and reflect
        // the new phase in the vm. Before the [9.8] fix, vm.phase
        // stayed stuck at 'choosing_action'.
        act(() => {
            actions.setPlayerAction('attack');
            actions.resolveRound();
        });
        expect(store.getState().combat?.phase).toBe('resolving');
        expect(rendered.getByTestId('probe-phase').children[0]).toBe('resolving');
    });

    it('vm.enemy.hp + vm.player.hp track engine combat.enemy.health + combat.player.health across rounds', () => {
        const { tree, store } = withAllProviders(<CombatVmProbe selectedStance="body" />);
        const actions = createAppActions(store);
        const rendered = render(tree);

        act(() => {
            actions.startCombat(makeTestEnemy());
            actions.setPlayerStance('body');
            actions.setCombatPhase('choosing_action');
            actions.setPlayerAction('attack');
            actions.resolveRound();
        });

        // The engine ran a round; both fighters' HP should reflect
        // the resolved state, not the pre-startCombat baseline.
        const after = store.getState().combat!;
        expect(rendered.getByTestId('probe-enemy-hp').children[0]).toBe(String(after.enemy.health));
        expect(rendered.getByTestId('probe-player-hp').children[0]).toBe(String(after.player.health));
    });

    it('vm.phase advances through every state in a full round-trip without staleness', () => {
        const { tree, store } = withAllProviders(<CombatVmProbe selectedStance="heart" />);
        const actions = createAppActions(store);
        const rendered = render(tree);

        act(() => actions.startCombat(makeTestEnemy()));
        expect(rendered.getByTestId('probe-phase').children[0]).toBe('choosing_stance');

        act(() => {
            actions.setPlayerStance('heart');
            actions.setCombatPhase('choosing_action');
        });
        expect(rendered.getByTestId('probe-phase').children[0]).toBe('choosing_action');

        act(() => actions.setCombatPhase('choosing_skill'));
        expect(rendered.getByTestId('probe-phase').children[0]).toBe('choosing_skill');

        act(() => {
            actions.setPlayerAction('attack');
            actions.resolveRound();
        });
        expect(rendered.getByTestId('probe-phase').children[0]).toBe('resolving');

        act(() => actions.nextRound());
        expect(rendered.getByTestId('probe-phase').children[0]).toBe('choosing_stance');
    });
});

describe('useCombatViewModel: no-combat fallback', () => {
    it('vm.isInCombat is false + vm.phase is choosing_stance when no combat is active', () => {
        const { tree } = withAllProviders(<CombatVmProbe />);
        const rendered = render(tree);
        expect(rendered.getByTestId('probe-is-in-combat').children[0]).toBe('false');
        expect(rendered.getByTestId('probe-phase').children[0]).toBe('choosing_stance');
    });
});
