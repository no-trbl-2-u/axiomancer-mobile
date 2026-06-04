/**
 * Screen-level presenter for LevelUpModal enhancement (Phase 105).
 *
 * Implements `selectLevelUpViewModel` for derived stats preview functionality.
 * Uses engine truth via deriveStats for accurate preview calculations.
 */

import type { BaseStats, Character, GameStore, deriveStats } from 'axiomancer-mechanics';
import { deriveStats as engineDeriveStats } from 'axiomancer-mechanics';
import { freezeViewModel } from './freeze';

export interface PreviewAllocation {
    heart: number;
    body: number;
    mind: number;
}

export interface LevelUpViewModel {
    /** Character display name */
    characterName: string;
    /** Current level */
    fromLevel: number;
    /** Target level after allocation */
    toLevel: number;
    /** Total stat points to allocate */
    totalPoints: number;
    /** Current base stats before allocation */
    current: { heart: number; body: number; mind: number };
    /** Current derived stats for preview baseline */
    currentDerived: {
        heart: { attack: number; skill: number; defense: number };
        body: { attack: number; skill: number; defense: number };
        mind: { attack: number; skill: number; defense: number };
    };
}

/**
 * Enhanced view model factory for LevelUpModal with derived stats preview.
 * 
 * @param state Game state
 * @param allocation Current pending allocation (for preview calculation)
 * @returns Complete view model for LevelUpModal with preview data
 */
export function selectLevelUpViewModel(
    state: GameStore,
    allocation: PreviewAllocation = { heart: 0, body: 0, mind: 0 }
): LevelUpViewModel {
    const player = state.player;
    
    // Extract current base stats
    const current = {
        heart: player.baseStats.heart,
        body: player.baseStats.body,
        mind: player.baseStats.mind,
    };

    // Map engine derived stats to our preview format
    const currentDerived = {
        heart: {
            attack: player.derivedStats.emotionalAttack,
            skill: player.derivedStats.emotionalSkill,
            defense: player.derivedStats.emotionalDefense,
        },
        body: {
            attack: player.derivedStats.physicalAttack,
            skill: player.derivedStats.physicalSkill,
            defense: player.derivedStats.physicalDefense,
        },
        mind: {
            attack: player.derivedStats.mentalAttack,
            skill: player.derivedStats.mentalSkill,
            defense: player.derivedStats.mentalDefense,
        },
    };

    return freezeViewModel({
        characterName: player.name,
        fromLevel: player.level,
        toLevel: player.level + 1,
        totalPoints: player.availableStatPoints ?? 0,
        current,
        currentDerived,
    });
}

/**
 * Calculate derived stats preview using engine truth.
 * Applies allocation to base stats and uses engine deriveStats for accurate preview.
 */
export function calculateDerivedPreview(
    baseStats: BaseStats,
    allocation: PreviewAllocation
): {
    heart: { attack: number; skill: number; defense: number };
    body: { attack: number; skill: number; defense: number };
    mind: { attack: number; skill: number; defense: number };
} {
    // Apply allocation to base stats
    const projectedStats: BaseStats = {
        heart: baseStats.heart + allocation.heart,
        body: baseStats.body + allocation.body,
        mind: baseStats.mind + allocation.mind,
    };

    // Use engine truth for derived stats calculation
    const derivedStats = engineDeriveStats(projectedStats);

    // Map engine derived stats to our preview format
    return {
        heart: {
            attack: derivedStats.emotionalAttack,
            skill: derivedStats.emotionalSkill,
            defense: derivedStats.emotionalDefense,
        },
        body: {
            attack: derivedStats.physicalAttack,
            skill: derivedStats.physicalSkill,
            defense: derivedStats.physicalDefense,
        },
        mind: {
            attack: derivedStats.mentalAttack,
            skill: derivedStats.mentalSkill,
            defense: derivedStats.mentalDefense,
        },
    };
}