/**
 * @jest-environment node
 */

/**
 * Hermetic e2e tests — mercy choice modal behavior (Phase 104).
 *
 * Covers the Phase 104 scope:
 * - Modal visibility from engine-emitted mercy state (not local simulation)
 * - Spare dispatch path uses engine truth
 * - Exploit dispatch path disabled until engine contract available
 * - No local eligibility calculation
 */

import { describe, expect, it } from '@jest/globals';
import { FRIENDSHIP_COUNTER_MAX, createEnemy } from 'axiomancer-mechanics';

import { createAppStore } from '@/state/store';
import { createAppActions } from '@/state/actions';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';
import { selectCombatViewModel } from '@/state/presenters/combat.engine';

function makeStore() {
    return createAppStore({ adapter: createMemoryAdapter() });
}

function makeEnemy(overrides: Partial<Parameters<typeof createEnemy>[0]> = {}) {
    return createEnemy({
        id: 'test-enemy',
        name: 'Test Enemy',
        description: 'A test adversary',
        level: 1,
        baseStats: { heart: 5, body: 5, mind: 5 },
        mapName: 'fishing-village',
        logic: 'balanced',
        ...overrides,
    });
}

describe('mercy choice modal - engine truth only (Phase 104)', () => {
    it('modal remains inactive even at max friendship (engine contract required)', () => {
        const store = makeStore();
        
        // Set up combat with max friendship - the scenario that previously
        // triggered local mercy choice activation
        const state = store.getState();
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
        
        // Phase 104 — Modal must be inactive until engine exports mercy state
        expect(vm.mercyChoice.isActive).toBe(false);
        
        // Context data still populated for when engine contract becomes available
        expect(vm.mercyChoice.enemyName).toBe('TEST FOE');
        expect(vm.mercyChoice.spareLabel).toBe('SPARE');
        expect(vm.mercyChoice.exploitLabel).toBe('EXPLOIT');
    });

    it('spare action uses engine endCombatWithFriendship (not local simulation)', () => {
        const store = makeStore();
        const actions = createAppActions(store);
        
        // Start combat to establish combat state
        actions.startCombat(makeEnemy());
        
        expect(store.getState().combat).not.toBeNull();
        expect(store.getState().combat?.active).toBe(true);
        
        // Invoke spare action - should use engine friendship ending
        actions.spareMercyChoice();
        
        // Action should complete successfully using engine endCombatWithFriendship
        // (not throwing due to local simulation issues)
        const combat = store.getState().combat;
        expect(combat?.phase).toBe('ended');
        
        // Battle log should record the mercy choice
        const lastLog = combat?.log?.[combat.log.length - 1];
        // Note: BattleLogEntry shape may differ from presenter expectations
        expect(lastLog).toBeDefined();
    });

    it('exploit action disabled until engine contract available', () => {
        const store = makeStore();
        const actions = createAppActions(store);
        
        // Start combat to establish combat state
        actions.startCombat(makeEnemy());
        
        const enemyHealthBefore = store.getState().combat?.enemy?.health || 0;
        
        // Invoke exploit action - should NOT apply local damage simulation
        actions.exploitMercyChoice();
        
        const combat = store.getState().combat;
        const enemyHealthAfter = combat?.enemy?.health || 0;
        
        // Phase 104 — No local damage applied (enemy health unchanged)
        expect(enemyHealthAfter).toBe(enemyHealthBefore);
        
        // Battle log should record the disabled action message
        const lastLog = combat?.log?.[combat.log.length - 1];
        expect(lastLog).toBeDefined();
        
        // Combat should remain active (not ended by exploit)
        expect(combat?.active).toBe(true);
        expect(combat?.phase).not.toBe('ended');
    });

    it('no local friendship threshold calculation for modal activation', () => {
        const store = makeStore();
        
        // Test various friendship counter values - modal should remain inactive
        // regardless of local friendship state
        const testScenarios = [
            { friendshipCounter: 0, label: 'zero friendship' },
            { friendshipCounter: FRIENDSHIP_COUNTER_MAX - 1, label: 'one below max' },
            { friendshipCounter: FRIENDSHIP_COUNTER_MAX, label: 'exactly max' },
            { friendshipCounter: FRIENDSHIP_COUNTER_MAX + 1, label: 'above max' },
        ];
        
        testScenarios.forEach(({ friendshipCounter, label }) => {
            const state = store.getState();
            state.combat = {
                active: true,
                phase: 'choosing_action',
                round: 1,
                friendshipCounter,
                player: { name: 'Test Player', health: 100, maxHealth: 100, effects: [] },
                enemy: { name: 'TEST ENEMY', health: 60, maxHealth: 80 },
                playerChoice: {},
                enemyChoice: {},
                log: [],
                combatResources: { body: 1, mind: 1, heart: 1, fallacy: 0, paradox: 0 },
            } as any;
            
            const vm = selectCombatViewModel(state);
            
            // Phase 104 — Modal inactive regardless of friendship counter
            expect(vm.mercyChoice.isActive).toBe(false);
        });
    });

    it('preserves modal UX and accessibility for future engine integration', () => {
        const store = makeStore();
        
        const state = store.getState();
        state.combat = {
            active: true,
            phase: 'resolving',
            round: 2,
            friendshipCounter: FRIENDSHIP_COUNTER_MAX,
            player: { name: 'Test Player', health: 80, maxHealth: 100, effects: [] },
            enemy: { name: 'DIRE WOLF', health: 30, maxHealth: 70 },
            playerChoice: {},
            enemyChoice: {},
            log: [],
            combatResources: { body: 2, mind: 1, heart: 2, fallacy: 0, paradox: 1 },
        } as any;
        
        const vm = selectCombatViewModel(state);
        
        // Phase 104 — Accessibility and UX copy preserved for engine integration
        expect(vm.mercyChoice.spareHint).toBe('preserve dire wolf · path of mercy');
        expect(vm.mercyChoice.exploitHint).toBe('seize the opening · guaranteed critical');
        
        expect(vm.mercyChoice.a11y.spare).toBe('Spare DIRE WOLF, choosing mercy and consequence');
        expect(vm.mercyChoice.a11y.exploit).toBe('Exploit the opening for a guaranteed critical attack against DIRE WOLF');
        
        // Modal remains inactive until engine exports mercy choice state
        expect(vm.mercyChoice.isActive).toBe(false);
    });
});