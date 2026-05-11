import { clamp } from 'axiomancer-mechanics';
import type { GameState, ActiveEffect } from 'axiomancer-mechanics';

const MAX_EFFECTS_SHOWN = 4;

export interface ActiveEffectDisplay {
    effectId: string;
    intensity: number;
    remainingDuration: number;
}

export interface CombatHudViewModel {
    hpPercent: number;
    manaPercent: number;
    effects: ActiveEffectDisplay[];
}

function toDisplay(e: ActiveEffect): ActiveEffectDisplay {
    return {
        effectId: e.effectId,
        intensity: e.intensity,
        remainingDuration: e.remainingDuration,
    };
}

/**
 * Derives the combat HUD view-model from game state.
 * Reads from the in-combat player snapshot when a battle is active,
 * otherwise from the out-of-combat player.
 */
export function selectCombatHudViewModel(state: GameState): CombatHudViewModel {
    const player = state.combat?.player ?? state.player;

    const hpPercent = player.maxHealth > 0
        ? clamp(player.health / player.maxHealth, 0, 1)
        : 0;

    const manaPercent = player.maxMana > 0
        ? clamp(player.mana / player.maxMana, 0, 1)
        : 0;

    const effects = player.effects
        .slice(0, MAX_EFFECTS_SHOWN)
        .map(toDisplay);

    return { hpPercent, manaPercent, effects };
}
