/**
 * Hermetic presenter tests — mercy choice slice (Phase 103, updated Phase 104).
 *
 * Pins:
 *   - Phase 104: Mercy choice disabled until engine contracts available
 *   - Enemy name display in choice context (preserved for future use)
 *   - Accessibility labels for both choice paths (preserved)
 *   - Inactive state when combat is null or ended
 *   - [needs-engine-release] — Engine mercy choice state required for activation
 */

import { describe, expect, it } from '@jest/globals';
import { FRIENDSHIP_COUNTER_MAX } from 'axiomancer-mechanics';

import { selectCombatViewModel } from '@/state/presenters/combat.engine';
import type { AppStoreState } from '@/state/store';
import { createAppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

function makeBaseState(): AppStoreState {
    const store = createAppStore({ adapter: createMemoryAdapter() });
    return store.getState();
}

describe('selectCombatViewModel: mercy choice slice', () => {
    it('returns inactive mercy choice when no combat', () => {
        const state = makeBaseState();
        state.combat = null;

        const vm = selectCombatViewModel(state);
        expect(vm.mercyChoice.isActive).toBe(false);
        expect(vm.mercyChoice.enemyName).toBe('');
    });

    it('returns inactive mercy choice when friendship counter below max', () => {
        const state = makeBaseState();
        state.combat = {
            active: true,
            phase: 'choosing_stance',
            round: 1,
            friendshipCounter: FRIENDSHIP_COUNTER_MAX - 1,
            player: { name: 'Test Player', health: 100, maxHealth: 100, effects: [] },
            enemy: { name: 'TEST FOE', health: 50, maxHealth: 100 },
            playerChoice: {},
            enemyChoice: {},
            log: [],
            combatResources: { body: 0, mind: 0, heart: 0, fallacy: 0, paradox: 0 },
        } as any;

        const vm = selectCombatViewModel(state);
        expect(vm.mercyChoice.isActive).toBe(false);
    });

    it('returns inactive mercy choice even when friendship counter reaches max (Phase 104)', () => {
        const state = makeBaseState();
        state.combat = {
            active: true,
            phase: 'choosing_stance',
            round: 1,
            friendshipCounter: FRIENDSHIP_COUNTER_MAX,
            player: { name: 'Test Player', health: 100, maxHealth: 100, effects: [] },
            enemy: { name: 'TEST FOE', health: 50, maxHealth: 100 },
            playerChoice: {},
            enemyChoice: {},
            log: [],
            combatResources: { body: 0, mind: 0, heart: 0, fallacy: 0, paradox: 0 },
        } as any;

        const vm = selectCombatViewModel(state);
        // Phase 104 — Mercy choice disabled until engine contracts are available
        expect(vm.mercyChoice.isActive).toBe(false);
        expect(vm.mercyChoice.enemyName).toBe('TEST FOE');
    });

    it('returns inactive mercy choice when combat is ended', () => {
        const state = makeBaseState();
        state.combat = {
            active: false,
            phase: 'ended',
            round: 3,
            friendshipCounter: FRIENDSHIP_COUNTER_MAX,
            player: { name: 'Test Player', health: 100, maxHealth: 100, effects: [] },
            enemy: { name: 'TEST FOE', health: 0, maxHealth: 100 },
            playerChoice: {},
            enemyChoice: {},
            log: [],
            combatResources: { body: 0, mind: 0, heart: 0, fallacy: 0, paradox: 0 },
        } as any;

        const vm = selectCombatViewModel(state);
        expect(vm.mercyChoice.isActive).toBe(false);
    });

    it('includes enemy name in choice hints and accessibility labels (Phase 104 - disabled)', () => {
        const state = makeBaseState();
        state.combat = {
            active: true,
            phase: 'choosing_action',
            round: 2,
            friendshipCounter: FRIENDSHIP_COUNTER_MAX,
            player: { name: 'Test Player', health: 80, maxHealth: 100, effects: [] },
            enemy: { name: 'SHADOW WOLF', health: 30, maxHealth: 80 },
            playerChoice: {},
            enemyChoice: {},
            log: [],
            combatResources: { body: 1, mind: 2, heart: 1, fallacy: 0, paradox: 0 },
        } as any;

        const vm = selectCombatViewModel(state);
        // Phase 104 — Modal disabled but labels still populated for future use
        expect(vm.mercyChoice.isActive).toBe(false);
        expect(vm.mercyChoice.enemyName).toBe('SHADOW WOLF');
        expect(vm.mercyChoice.spareHint).toBe('preserve shadow wolf · path of mercy');
        expect(vm.mercyChoice.a11y.spare).toBe('Spare SHADOW WOLF, choosing mercy and consequence');
        expect(vm.mercyChoice.a11y.exploit).toBe('Exploit the opening for a guaranteed critical attack against SHADOW WOLF');
    });

    it('provides fallback enemy name when enemy name is empty (Phase 104 - disabled)', () => {
        const state = makeBaseState();
        state.combat = {
            active: true,
            phase: 'resolving',
            round: 1,
            friendshipCounter: FRIENDSHIP_COUNTER_MAX,
            player: { name: 'Test Player', health: 100, maxHealth: 100, effects: [] },
            enemy: { name: '', health: 40, maxHealth: 60 },
            playerChoice: {},
            enemyChoice: {},
            log: [],
            combatResources: { body: 0, mind: 0, heart: 2, fallacy: 0, paradox: 0 },
        } as any;

        const vm = selectCombatViewModel(state);
        // Phase 104 — Modal disabled but fallback logic preserved
        expect(vm.mercyChoice.isActive).toBe(false);
        expect(vm.mercyChoice.enemyName).toBe('ADVERSARY');
        expect(vm.mercyChoice.spareHint).toBe('preserve adversary · path of mercy');
    });

    it('includes standard choice labels and descriptions', () => {
        const state = makeBaseState();
        state.combat = {
            active: true,
            phase: 'choosing_skill',
            round: 1,
            friendshipCounter: FRIENDSHIP_COUNTER_MAX,
            player: { name: 'Test Player', health: 100, maxHealth: 100, effects: [] },
            enemy: { name: 'GOBLIN SCOUT', health: 25, maxHealth: 40 },
            playerChoice: {},
            enemyChoice: {},
            log: [],
            combatResources: { body: 0, mind: 1, heart: 1, fallacy: 0, paradox: 0 },
        } as any;

        const vm = selectCombatViewModel(state);
        expect(vm.mercyChoice.spareLabel).toBe('SPARE');
        expect(vm.mercyChoice.exploitLabel).toBe('EXPLOIT');
        expect(vm.mercyChoice.exploitHint).toBe('seize the opening · guaranteed critical');
    });
});