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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawMana: number | undefined = (player as any).mana;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawMaxMana: number | undefined = (player as any).maxMana;

    // When the engine has no mana system (both fields absent), treat the bar
    // as full rather than empty.  An explicit mana=0 with no maxMana still
    // yields 0 because the player has spent all their mana.
    const manaPercent: number = rawMana === undefined
        ? 1
        : (rawMaxMana ?? 0) > 0
            ? clamp(rawMana / rawMaxMana!, 0, 1)
            : 0;

    const effects = player.effects
        .slice(0, MAX_EFFECTS_SHOWN)
        .map(toDisplay);

    return { hpPercent, manaPercent, effects };
}
