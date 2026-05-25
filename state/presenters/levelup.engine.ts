/**
 * Screen-level presenter for LevelUpModal enhancement (Phase 88).
 *
 * Implements `selectLevelUpViewModel` for derived stats preview functionality.
 * Builds on existing character presenter data with preview calculations.
 */

import type { BaseStats, Character, GameStore } from 'axiomancer-mechanics';
import { previewStanceStats, type PreviewAllocation } from '@/lib/previewAllocation';
import { freezeViewModel } from './freeze';

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
 * Calculate derived stats preview for the given allocation.
 * Separate helper so the modal can call it on allocation changes.
 */
export function calculateDerivedPreview(
    baseStats: BaseStats,
    allocation: PreviewAllocation
) {
    return previewStanceStats(baseStats, allocation);
}