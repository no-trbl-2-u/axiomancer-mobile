/**
 * Screen-level presenter for `app/(tabs)/combat.tsx`.
 *
 * Composes `selectCombatHudViewModel` for the HP/mana/effects strip
 * and exposes the rest of the combat state the screen needs to render
 * the enemy panel, stance picker, action grid, and battle log.
 *
 * Per Spec 03:
 * - Q1: `select<Screen>ViewModel` naming.
 * - Q2: takes the engine `GameStore` plus an optional `localUi` arg
 *   for ephemeral UI (selected stance preview, current phase the
 *   player is composing).
 * - Q3: return value is deep-frozen in dev via `freezeViewModel`.
 * - Q5: VM is *data only* — no event handlers, no colour tokens, no
 *   icon names. The screen owns palette and dispatch.
 *
 * Specs 04+ replace the stub fields with real engine reads. Today
 * everything past `hud`, `isInCombat`, `friendshipCounter`, and
 * `friendshipCounterMax` is a placeholder fixture so the screen keeps
 * rendering pending the real wiring.
 */

import { FRIENDSHIP_COUNTER_MAX, type GameStore } from 'axiomancer-mechanics';

import { selectCombatHudViewModel, type CombatHudViewModel } from './combat-hud.engine';
import { freezeViewModel } from './freeze';

export type CombatPhaseKey =
    | 'choosing_stance'
    | 'choosing_action'
    | 'choosing_skill'
    | 'resolving';

export type StanceKey = 'heart' | 'body' | 'mind';

export interface CombatLocalUi {
    /** Phase the player is composing locally. Engine phase wins once Spec 04 wires it. */
    phase?: CombatPhaseKey;
    /** Stance preview before the player commits. */
    selectedStance?: StanceKey;
}

export interface CombatEnemySummary {
    /** Uppercased display name. Empty string when no combat is active. */
    name: string;
    /** Raw difficulty tier string (e.g. `'elite'`); empty when none. */
    tier: string;
    /** Current HP. */
    hp: number;
    /** Max HP — invariant: never zero when `isInCombat` is true. */
    hpMax: number;
    /** Last stance the enemy declared, or `null` before the first round resolves. */
    lastStance: StanceKey | null;
}

export interface CombatViewModel {
    /** True when the engine has an active `combat` slice. */
    isInCombat: boolean;
    /** Composed HUD slice — player HP/mana ratios + active effects. */
    hud: CombatHudViewModel;
    /** Enemy display summary. Fields are total strings; never `undefined`. */
    enemy: CombatEnemySummary;
    /** Friendship counter (Heart-stance parley track). */
    friendshipCounter: number;
    /** Engine-defined ceiling for the friendship counter. */
    friendshipCounterMax: number;
}

const EMPTY_ENEMY: CombatEnemySummary = {
    name: '',
    tier: '',
    hp: 0,
    hpMax: 0,
    lastStance: null,
};

function toStanceKey(value: unknown): StanceKey | null {
    if (value === 'heart' || value === 'body' || value === 'mind') return value;
    return null;
}

/**
 * Screen-level combat presenter. Returns a totally-shaped view-model
 * — every field has a defined value even when no combat is active —
 * so the screen never has to guard for `undefined`.
 */
export function selectCombatViewModel(
    state: GameStore,
    _localUi: CombatLocalUi = {},
): CombatViewModel {
    const hud = selectCombatHudViewModel(state);
    const combat = state.combat;

    if (combat === null) {
        return freezeViewModel({
            isInCombat: false,
            hud,
            enemy: EMPTY_ENEMY,
            friendshipCounter: 0,
            friendshipCounterMax: FRIENDSHIP_COUNTER_MAX,
        });
    }

    const enemyEntity = combat.enemy;
    const enemy: CombatEnemySummary = {
        name: String(enemyEntity.name ?? '').toUpperCase(),
        tier: String(enemyEntity.difficulty ?? ''),
        hp: enemyEntity.health,
        hpMax: enemyEntity.maxHealth,
        lastStance: toStanceKey(combat.enemyChoice?.stance ?? null),
    };

    return freezeViewModel({
        isInCombat: true,
        hud,
        enemy,
        friendshipCounter: combat.friendshipCounter ?? 0,
        friendshipCounterMax: FRIENDSHIP_COUNTER_MAX,
    });
}
