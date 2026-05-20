import { clamp } from 'axiomancer-mechanics';
import type { ActiveEffect } from 'axiomancer-mechanics';

import type { AppStoreState } from '@/state/store';

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
 * Derives the combat HUD view-model from app state.
 *
 * - `hpPercent` reads from the in-combat player snapshot when a
 *   battle is active, otherwise from the out-of-combat player.
 * - `manaPercent` reads from the mobile-only `combatMana` slice
 *   (Phase 60d — lifted from Character). When the slice is null
 *   (no active combat or fresh store), the bar shows as full
 *   (1.0) rather than empty.
 */
export function selectCombatHudViewModel(state: AppStoreState): CombatHudViewModel {
    const player = state.combat?.player ?? state.player;

    const hpPercent = player.maxHealth > 0
        ? clamp(player.health / player.maxHealth, 0, 1)
        : 0;

    // `combatMana` is null outside combat and on fresh stores; it
    // may also be undefined when tests construct a raw GameState
    // without going through createAppStore. Both cases land at "full"
    // bar (1.0) — only an explicit zero-current with a positive max
    // counts as "empty".
    const mana = state.combatMana ?? null;
    const manaPercent: number = mana === null
        ? 1
        : mana.max > 0
            ? clamp(mana.current / mana.max, 0, 1)
            : 0;

    const effects = player.effects
        .slice(0, MAX_EFFECTS_SHOWN)
        .map(toDisplay);

    return { hpPercent, manaPercent, effects };
}
