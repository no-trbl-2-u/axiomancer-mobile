/**
 * Hermetic tests for Phase 105 - Engine-owned stat preview + combat resources
 * 
 * Proves:
 * - Stat preview matches engine API for cross-stat effects
 * - Combat resource values come from engine state
 * - Skill affordability follows engine truth, not local approximation
 */

import { deriveStats, createCharacter } from 'axiomancer-mechanics';
import { 
    selectLevelUpViewModel, 
    calculateDerivedPreview,
    type PreviewAllocation 
} from '../levelup.engine';
import { selectCombatHudViewModel } from '../combat-hud.engine';
import type { AppStoreState } from '@/state/store';
import { EMPTY_EVENT_SLICE } from '@/state/store';

// Create minimal state for testing
function createTestState(overrides: Partial<AppStoreState> = {}): AppStoreState {
    const baseCharacter = createCharacter({
        name: 'TEST_CHARACTER',
        level: 5,
        baseStats: { heart: 10, body: 8, mind: 12 },
    });

    return {
        player: baseCharacter,
        combat: null,
        event: EMPTY_EVENT_SLICE,
        notifications: {
            levelUpAcknowledged: true,
            toast: { text: null, id: 0 },
        },
        ...overrides,
    } as AppStoreState;
}

describe('Phase 105: Engine truth stat preview', () => {
    it('calculateDerivedPreview uses engine deriveStats for accuracy', () => {
        const baseStats = { heart: 10, body: 8, mind: 12 };
        const allocation: PreviewAllocation = { heart: 2, body: 1, mind: 0 };
        
        // Calculate expected result using engine function directly
        const projectedStats = {
            heart: baseStats.heart + allocation.heart,
            body: baseStats.body + allocation.body,
            mind: baseStats.mind + allocation.mind,
        };
        const expected = deriveStats(projectedStats);
        
        // Test our function uses engine truth
        const result = calculateDerivedPreview(baseStats, allocation);
        
        expect(result.heart.attack).toBe(expected.emotionalAttack);
        expect(result.heart.skill).toBe(expected.emotionalSkill);
        expect(result.heart.defense).toBe(expected.emotionalDefense);
        
        expect(result.body.attack).toBe(expected.physicalAttack);
        expect(result.body.skill).toBe(expected.physicalSkill);
        expect(result.body.defense).toBe(expected.physicalDefense);
        
        expect(result.mind.attack).toBe(expected.mentalAttack);
        expect(result.mind.skill).toBe(expected.mentalSkill);
        expect(result.mind.defense).toBe(expected.mentalDefense);
    });

    it('calculateDerivedPreview shows stat cross-effects correctly', () => {
        const baseStats = { heart: 5, body: 5, mind: 5 };
        
        // Test that HEART allocation affects emotional stats
        const heartAllocation = { heart: 5, body: 0, mind: 0 };
        const heartResult = calculateDerivedPreview(baseStats, heartAllocation);
        
        // Verify heart boost primarily affects emotional stats but has cross-effects
        expect(heartResult.heart.attack).toBeGreaterThan(heartResult.body.attack);
        expect(heartResult.heart.attack).toBeGreaterThan(heartResult.mind.attack);
        
        // Test that BODY allocation affects physical stats
        const bodyAllocation = { heart: 0, body: 5, mind: 0 };
        const bodyResult = calculateDerivedPreview(baseStats, bodyAllocation);
        
        expect(bodyResult.body.attack).toBeGreaterThan(bodyResult.heart.attack);
        expect(bodyResult.body.attack).toBeGreaterThan(bodyResult.mind.attack);
    });

    it('selectLevelUpViewModel provides engine-derived current stats', () => {
        const state = createTestState();
        
        // Character should have availableStatPoints for levelup to be active
        state.player.availableStatPoints = 3;
        
        const vm = selectLevelUpViewModel(state);
        
        expect(vm.characterName).toBe('TEST_CHARACTER');
        expect(vm.totalPoints).toBe(3);
        
        // Current derived stats should match engine calculations
        const expectedDerived = deriveStats(state.player.baseStats);
        expect(vm.currentDerived.heart.attack).toBe(expectedDerived.emotionalAttack);
        expect(vm.currentDerived.body.attack).toBe(expectedDerived.physicalAttack);
        expect(vm.currentDerived.mind.attack).toBe(expectedDerived.mentalAttack);
    });
});

describe('Phase 105: Engine combat resources', () => {
    it('combat HUD reads from CombatState.combatResources when available', () => {
        const state = createTestState();
        
        // Set up active combat with engine combat resources
        state.combat = {
            active: true,
            phase: 'choosing_stance',
            round: 1,
            friendshipCounter: 0,
            player: state.player,
            enemy: { name: 'TEST_ENEMY', health: 50, maxHealth: 50 },
            playerChoice: {},
            enemyChoice: {},
            log: [],
            combatResources: {
                heart: 3,
                body: 4,
                mind: 2,
                fallacy: 1,
                paradox: 1,
            },
        } as any;

        const vm = selectCombatHudViewModel(state);
        
        // Should calculate percentage from engine resources, not legacy combatMana
        expect(vm.manaPercent).toBeGreaterThan(0);
        expect(vm.manaPercent).toBeLessThanOrEqual(1);
        
        // Total resources: 3 + 4 + 2 + 1 + 1 = 11, estimated max = 20
        // So percentage should be 11/20 = 0.55
        expect(vm.manaPercent).toBeCloseTo(0.55, 2);
    });

    it('combat HUD shows full bar when combat is inactive', () => {
        const state = createTestState();
        state.combat = null;

        const vm = selectCombatHudViewModel(state);
        
        // Should show full bar when no combat active
        expect(vm.manaPercent).toBe(1.0);
    });

    it('combat HUD handles zero resources gracefully', () => {
        const state = createTestState();
        
        state.combat = {
            combatResources: {
                heart: 0,
                body: 0,
                mind: 0,
                fallacy: 0,
                paradox: 0,
            },
        } as any;

        const vm = selectCombatHudViewModel(state);
        
        // Should show 0 when all resources are depleted
        expect(vm.manaPercent).toBe(0);
    });

    it('combat HUD respects dev overrides for mana hiding', () => {
        const state = createTestState();
        
        state.combat = {
            combatResources: {
                heart: 1,
                body: 1,
                mind: 1,
                fallacy: 1,
                paradox: 1,
            },
        } as any;
        
        state.devOverrides = {
            hud: { hideMana: true, hideEffects: false, hideStance: false },
        };

        const vm = selectCombatHudViewModel(state);
        
        // Should show full bar when mana is hidden via dev override
        expect(vm.manaPercent).toBe(1.0);
    });
});