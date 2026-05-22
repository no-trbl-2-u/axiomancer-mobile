/**
 * Typed action layer for the engine store.
 *
 * Per Spec 04 the combat screen never dispatches engine reducers
 * directly — it calls these actions. Each one wraps a small bit of
 * engine state and writes the result back through `updateCombat`.
 *
 * Resource (mana) accounting on the in-combat player is a
 * presentation placeholder until Phase 21 (engine-driven skill
 * resolution) wires the engine's per-resource pools. **Phase 60d**
 * lifted mana off `Character` (engine 0.10.1+ removed those fields
 * from the public type) onto a mobile-only `combatMana` slice on
 * `AppStoreState`. The slice is `null` outside combat and gets
 * seeded on `startCombat`, decremented on skill burn, and cleared on
 * `endCombat`. Phase 16 is `[skipped]` pending an
 * `axiomancer-mechanics` release that re-exports `skillLibrary` /
 * `getSkillById`; once that lands and Phase 16 ships, the stop-gap
 * pool gets replaced.
 */

import {
    appendLog as combatAppendLog,
    applyDialogueChoice,
    buildCharacterFromPreset,
    setPhase as combatSetPhase,
    setPlayerAction as combatSetPlayerAction,
    setPlayerStance as combatSetPlayerStance,
    changeMap as worldChangeMap,
    completeNode as worldCompleteNode,
    consumableLibrary,
    createMapState,
    determineAdvantage,
    determineCombatEnd,
    determineEnemyAction,
    equipmentTemplates,
    getDialogueNode,
    getMapDefinition,
    getPresetById,
    getSkillById,
    healCharacter,
    incrementFriendship as combatIncrementFriendship,
    isConsumable,
    isEquipment,
    markNodeConsumed,
    resolveCombatRound,
    resolveMapEvent,
    revealAdjacent,
    unlockNode as worldUnlockNode,
    type Character,
    type CombatPhase,
    type CombatState,
    type Consumable,
    type DialogueChoice,
    type DialogueTree,
    type Enemy,
    type Equipment,
    type EquipmentTemplate,
    type GameState,
    type Item,
    type MapName,
    type MapState,
    type ResolveMapEventResult,
    type Stance,
    type WorldState,
} from 'axiomancer-mechanics';

import { getMapLayout } from '@/state/exploration-maps';

import {
    COMBAT_SKILLS,
    getCombatSkillById,
    type CombatSkill,
} from '@/state/selectors/combat-skills';
import { EMPTY_EVENT_SLICE, type AppStore } from './store';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CombatActionKey = 'attack' | 'defend' | 'skill' | 'item';

/** Severity buckets the screen uses to colour log lines. */
export type LogSeverityKey =
    | 'info'
    | 'damage'
    | 'crit'
    | 'heal'
    | 'effect'
    | 'friendship'
    | 'system';

export interface MoveToResult {
    /** True when the engine state was advanced. */
    moved: boolean;
    /** Engine node id the player now occupies (unchanged on no-op). */
    currentNodeId: string;
    /** True when the target was locked or not currently reachable. */
    locked: boolean;
}

/** Phase 54 — debug seed action summary. */
export interface DebugSeedResult {
    /** Count of items pushed to the player's inventory across categories. */
    itemsAdded: number;
    /** Count of skills appended to the player's `knownSkills` list. */
    skillsLearned: number;
    /** True when the current map was successfully re-seeded. */
    mapReset: boolean;
}

/** Phase 59 — character-preset adoption result. */
export interface ApplyCharacterPresetResult {
    /** True when the preset id matched an engine preset and `player` was replaced. */
    applied: boolean;
    /** Resolved preset id ('apprentice' / 'wanderer' / 'sage'), or null when unknown. */
    presetId: string | null;
    /** Display name from the preset, or null when unknown. */
    presetName: string | null;
}

export interface ResolveRoundResult {
    /** True when the engine's `determineCombatEnd` is no longer `'ongoing'`. */
    combatEnded: boolean;
    /** Who/what triggered the end. */
    endReason: 'player' | 'ko' | 'friendship' | 'ongoing';
    /** Damage dealt to the enemy this round (positive). */
    damageToEnemy: number;
    /** Damage taken by the player this round (positive). */
    damageToPlayer: number;
    /** Friendship counter delta this round (usually 0 or +1). */
    friendshipDelta: number;
}

export interface AppActions {
    startCombat: (enemy: Enemy) => void;
    endCombat: () => void;
    setCombatPhase: (phase: CombatPhase) => void;
    /** Sets the player's committed stance for the round. */
    setPlayerStance: (stance: Stance) => void;
    /** Sets the player's committed action (`'attack' | 'defend' | 'skill'`). */
    setPlayerAction: (action: CombatActionKey, skillId?: string) => void;
    /**
     * Resolves a full round through the engine resolver, mutates the
     * combat slice, appends human-readable log entries, and transitions
     * the engine phase to `'resolving'`.
     */
    resolveRound: () => ResolveRoundResult;
    /** Transitions phase back to `choosing_stance` and bumps the round. */
    nextRound: () => void;
    addItem: (item: Item) => void;
    removeItem: (itemId: string) => void;
    useConsumable: (itemId: string) => void;
    /**
     * Apply a consumable's effect to the player and decrement the stack
     * (Spec 06 Q2=A). Heals parsed from the consumable's `effect` string
     * (e.g. `"Heal 6 HP"` / `"Restore 4 HP"` / `"+10 HP"`). No-op when
     * the item isn't a consumable or doesn't exist.
     */
    useItem: (itemId: string) => UseItemResult;
    /**
     * Soft-equip an item by reordering inventory so it is the first
     * occurrence of its slot — the convention shared with
     * `selectCharacterViewModel`. No-op when the item isn't equipment.
     */
    equipItem: (itemId: string) => void;
    /** Discard an item — wraps `removeItem` with a quest-item guard. */
    dropItem: (itemId: string) => void;
    /**
     * Move the player to a connected, available node.
     * Marks the target completed, advances `currentNodeId`, and unlocks
     * outbound edges declared in the screen-side layout fixture
     * (`app/(tabs)/exploration/maps/<map>.layout.ts`).
     */
    moveTo: (nodeId: string) => MoveToResult;
    /** Swap the active map within the current continent. */
    changeMap: (mapName: MapName) => void;
    /**
     * Dev-only seed action (Phase 54). Adds representative items
     * across categories, teaches a handful of fixture skills, and
     * resets the current map back to its starting node. Returns a
     * summary so the calling UI can toast the result. Component
     * mount is `__DEV__`-guarded; production never reaches this.
     */
    debugSeed: () => DebugSeedResult;
    /**
     * Dev-only character preset adoption (Phase 59). Looks up the
     * engine `characterPresets` row by id and replaces the player
     * slice with a fresh `buildCharacterFromPreset(preset)` result.
     * No-op (returns `applied: false`) when the id is unknown.
     * Component mount is `__DEV__`-guarded; production never reaches
     * this.
     */
    applyCharacterPreset: (presetId: string) => ApplyCharacterPresetResult;
    save: () => void;
    /**
     * Run `resolveMapEvent(state)` on the current node, cache the
     * `ResolveMapEventResult` in the mobile event slice, and apply
     * the resulting `state` to the engine store. No-ops while combat
     * is active (Spec 08 Q4 = Future spec).
     *
     * Returns `true` when an event was produced (kind !== 'none').
     *
     */
    resolveCurrentMapEvent: () => boolean;
    /**
     * Resolve the currently-pending event by id. Branches on VM kind:
     *  - combat-prelude + 'fight'  -> startCombat(encounter.enemies[0]); clear
     *  - combat-prelude + 'flee'   -> clear (no combat)
     *  - narrative-choice + NPC dialogue with cursor -> applyDialogue;
     *    advance cursor if `nextNode !== null`, else clear
     *  - narrative-choice + auto-resolve (rest/gather/treasure/quest)
     *    -> clear (engine already advanced state via resolveMapEvent)
     */
    pickEventChoice: (choiceId: string) => void;
    /** Clear the pending event without dispatching any engine call. */
    dismissEvent: () => void;
}

export interface UseItemResult {
    /** Item was found and a consumable. */
    applied: boolean;
    /** Healing applied to player HP (positive integer). */
    healed: number;
    /** Damage applied to player HP (positive integer). */
    damaged: number;
}

// ---------------------------------------------------------------------------
// Combat mana scaffolding (Phase 60d — lifted to mobile-only slice)
// ---------------------------------------------------------------------------

/**
 * Default-max + starting current for the mobile-side combat mana
 * scaffolding. The values match the prior `ensureManaOnCombatPlayer`
 * scaffolding so existing tests and presenters land on the same
 * numbers. Both will be replaced when Phase 21 wires the engine's
 * per-resource pools.
 */
export const PLAYER_MANA_DEFAULT_MAX = 14;
export const PLAYER_MANA_DEFAULT_START = 9;

function seedCombatMana(store: AppStore): void {
    const cur = store.getState().combatMana;
    if (cur !== null) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    store.setState({
        combatMana: { current: PLAYER_MANA_DEFAULT_START, max: PLAYER_MANA_DEFAULT_MAX },
    } as any);
}

function clearCombatMana(store: AppStore): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    store.setState({ combatMana: null } as any);
}

function burnCombatMana(store: AppStore, cost: number): void {
    const cur = store.getState().combatMana;
    if (cur === null) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    store.setState({
        combatMana: { current: Math.max(0, cur.current - cost), max: cur.max },
    } as any);
}

function findSkill(skillId: string): CombatSkill | null {
    return getCombatSkillById(skillId);
}

// ---------------------------------------------------------------------------
// Log + resolve summary helpers
// ---------------------------------------------------------------------------

function pushLog(
    combat: CombatState,
    severity: LogSeverityKey,
    text: string,
): CombatState {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return combatAppendLog(combat, { severity, text } as any);
}

interface ResolutionSummary {
    playerRoll: number;
    enemyRoll: number;
    outcome: 'damage' | 'crit' | 'friendship' | 'miss';
    primaryText: string;
    message: string;
}

function summarizeRoundEvents(
    events: readonly unknown[],
    playerStance: Stance,
    enemyStance: Stance,
    friendshipDelta: number,
): { summary: ResolutionSummary; logLines: { severity: LogSeverityKey; text: string }[] } {
    const logLines: { severity: LogSeverityKey; text: string }[] = [];
    let playerRoll = 0;
    let enemyRoll = 0;
    let damageDealtToEnemy = 0;
    let damageTakenByPlayer = 0;
    let lethal = false;
    let crit = false;

    for (const raw of events) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ev = raw as Record<string, any>;
        if (ev.phase === 'scenario' && ev.kind === 'attack-roll') {
            if (ev.actor === 'player') playerRoll = Number(ev.total ?? 0);
            else enemyRoll = Number(ev.total ?? 0);
        } else if (ev.phase === 'scenario' && ev.kind === 'damage-applied') {
            const amount = Math.max(0, Number(ev.finalDamage ?? 0));
            if (ev.attacker === 'player') {
                damageDealtToEnemy += amount;
                logLines.push({
                    severity: 'damage',
                    text: `Your blade lands — ${amount} damage.`,
                });
            } else {
                damageTakenByPlayer += amount;
                logLines.push({
                    severity: 'damage',
                    text: `Foe strikes — you take ${amount} damage.`,
                });
            }
            if (Number(ev.hpAfter ?? 1) <= 0) lethal = true;
        } else if (ev.phase === 'scenario' && ev.kind === 'contest-outcome') {
            if (ev.winner === 'tie') {
                logLines.push({ severity: 'info', text: 'Blades cross — neither lands.' });
            }
        } else if (ev.phase === 'scenario' && ev.kind === 'both-defend') {
            logLines.push({
                severity: 'friendship',
                text: `Both defend — friendship grows (${ev.friendshipAfter}/${ev.friendshipAfter + 0}).`,
            });
        } else if (ev.phase === 'stance-effects' && ev.kind === 'applied') {
            const effectName = String(ev.effect?.name ?? ev.effect?.id ?? 'effect');
            logLines.push({
                severity: 'effect',
                text: `${ev.actor === 'player' ? 'You' : 'Foe'} apply ${effectName}.`,
            });
        } else if (ev.phase === 'round-start' && ev.kind === 'dot') {
            const who = ev.actor === 'player' ? 'You' : 'Foe';
            logLines.push({
                severity: 'damage',
                text: `${who} take ${ev.amount} from lingering harm.`,
            });
        } else if (ev.phase === 'round-start' && ev.kind === 'regen') {
            const who = ev.actor === 'player' ? 'You' : 'Foe';
            logLines.push({
                severity: 'heal',
                text: `${who} recover ${ev.amount}.`,
            });
        } else if (ev.phase === 'round-end' && ev.kind === 'dot') {
            const who = ev.actor === 'player' ? 'You' : 'Foe';
            logLines.push({
                severity: 'damage',
                text: `${who} bleed for ${ev.amount} at round's end.`,
            });
        } else if (ev.phase === 'skill' && ev.kind === 'damage') {
            damageDealtToEnemy += Math.max(0, Number(ev.amount ?? 0));
            logLines.push({
                severity: 'crit',
                text: `Skill bites — ${ev.amount} damage.`,
            });
            crit = true;
        }
    }

    let outcome: ResolutionSummary['outcome'] = 'miss';
    let primaryText = '—';
    let message = 'No blow lands.';
    if (friendshipDelta > 0) {
        outcome = 'friendship';
        primaryText = `FRIEND +${friendshipDelta}`;
        message = "A pause; the foe's gaze softens.";
    } else if (damageDealtToEnemy > damageTakenByPlayer && damageDealtToEnemy > 0) {
        outcome = crit ? 'crit' : 'damage';
        primaryText = `–${damageDealtToEnemy}`;
        message = lethal ? 'The foe falls.' : 'Wound runs deep.';
    } else if (damageTakenByPlayer > 0) {
        outcome = 'damage';
        primaryText = `–${damageTakenByPlayer}`;
        message = 'You stagger but stand.';
    } else if (damageDealtToEnemy > 0) {
        outcome = 'damage';
        primaryText = `–${damageDealtToEnemy}`;
        message = 'A glancing blow.';
    }

    return {
        summary: {
            playerRoll,
            enemyRoll,
            outcome,
            primaryText,
            message,
        },
        logLines,
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setLastResolution(combat: CombatState, summary: ResolutionSummary): CombatState {
    // CombatState is typed by the engine but is open in dist (types
    // file isn't published) so we tack on a custom field for the VM
    // to read. The metadata entry doubles as a log marker so callers
    // walking the log don't see structured noise.
    return {
        ...combat,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        lastResolution: summary as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
}

// ---------------------------------------------------------------------------
// Action creators
// ---------------------------------------------------------------------------

export function createAppActions(store: AppStore): AppActions {
    return {
        startCombat: (enemy) => {
            store.getState().startCombat(enemy);
            // Phase 60d — seed mobile-only mana slice rather than
            // mutating Character. Idempotent; subsequent re-entries
            // during the same combat keep the prior current value.
            if (store.getState().combat !== null) {
                seedCombatMana(store);
            }
        },
        endCombat: () => {
            store.getState().endCombat();
            // Phase 60d — clear mana slice when combat exits so the
            // next encounter starts fresh.
            clearCombatMana(store);
        },
        setCombatPhase: (phase) => {
            const { combat, updateCombat } = store.getState();
            if (!combat) return;
            updateCombat(combatSetPhase(combat, phase));
        },
        setPlayerStance: (stance) => {
            const { combat, updateCombat } = store.getState();
            if (!combat) return;
            updateCombat(combatSetPlayerStance(combat, stance));
        },
        setPlayerAction: (action, skillId) => {
            const { combat, updateCombat } = store.getState();
            if (!combat) return;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const withAction = combatSetPlayerAction(combat, action as any);
            const finalCombat = skillId
                ? {
                    ...withAction,
                    playerChoice: {
                        ...withAction.playerChoice,
                        skillId,
                    },
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as any
                : withAction;
            updateCombat(finalCombat);
        },
        resolveRound: () => {
            const { combat, updateCombat } = store.getState();
            if (!combat) {
                return {
                    combatEnded: false,
                    endReason: 'ongoing',
                    damageToEnemy: 0,
                    damageToPlayer: 0,
                    friendshipDelta: 0,
                };
            }

            const playerStance: Stance =
                (combat.playerChoice?.stance as Stance) ?? 'heart';
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const requestedAction = (combat.playerChoice?.action as any) ?? 'attack';
            const playerAction = requestedAction === 'item' ? 'attack' : requestedAction;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const skillIdRaw = (combat.playerChoice as any)?.skillId;
            const skillId =
                playerAction === 'skill' && typeof skillIdRaw === 'string'
                    ? skillIdRaw
                    : undefined;

            const enemyAction = determineEnemyAction(combat.enemy);

            // Phase 21 — real engine skill lookup. Pass `getSkillById`
            // so the resolver can apply skill damage / effects rather
            // than treating skill picks as basic attacks.
            const skillLookup = getSkillById;

            // Phase 21 — route `action: 'skill'` through the engine
            // (was previously downgraded to 'attack' when a skillId was
            // set; the engine now resolves the skill itself, using
            // skillLookup above).
            const playerCombatAction =
                skillId !== undefined
                    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ({ stance: playerStance, action: 'skill', skillId } as any)
                    : // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ({ stance: playerStance, action: playerAction } as any);

            const enemyStance: Stance =
                (enemyAction.stance as Stance) ??
                (combat.enemyChoice?.stance as Stance) ??
                'mind';

            const hpEnemyBefore = combat.enemy.health;
            const hpPlayerBefore = combat.player.health;
            const friendshipBefore = combat.friendshipCounter ?? 0;

            const resolution = resolveCombatRound(
                combat,
                playerCombatAction,
                enemyAction,
                skillLookup,
            );

            const nextState: CombatState = resolution.state;
            const damageToEnemy = Math.max(0, hpEnemyBefore - nextState.enemy.health);
            const damageToPlayer = Math.max(0, hpPlayerBefore - nextState.player.health);
            const friendshipDelta = (nextState.friendshipCounter ?? 0) - friendshipBefore;

            const { summary, logLines } = summarizeRoundEvents(
                resolution.combatEvents,
                playerStance,
                enemyStance,
                friendshipDelta,
            );

            // Stash the enemy's revealed stance so the next stance
            // picker can highlight ADV/DIS relative to it.
            let nextWithEnemy: CombatState = {
                ...nextState,
                enemyChoice: {
                    ...(nextState.enemyChoice ?? {}),
                    stance: enemyStance,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    action: enemyAction.action as any,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                },
            };

            // Phase 60d — mana accounting on the mobile-only
            // `combatMana` slice (lifted from Character). Idempotent
            // seed (no-op if startCombat already seeded); then burn
            // the skill's cost.
            seedCombatMana(store);
            if (skillId) {
                const skill = findSkill(skillId);
                if (skill !== null) {
                    burnCombatMana(store, skill.manaCost);
                }
            }

            nextWithEnemy = setLastResolution(nextWithEnemy, summary);

            let withLog = nextWithEnemy;
            for (const line of logLines) {
                withLog = pushLog(withLog, line.severity, line.text);
            }
            withLog = combatSetPhase(withLog, 'resolving');

            updateCombat(withLog);

            const endReason = determineCombatEnd(withLog);

            // Belt-and-braces: confirm we're using the engine's
            // canonical advantage helper somewhere (the presenter
            // mirrors the same triangle and the engine is the source
            // of truth). This call has no side-effects.
            void determineAdvantage(playerStance, enemyStance);

            return {
                combatEnded: endReason !== 'ongoing',
                endReason,
                damageToEnemy,
                damageToPlayer,
                friendshipDelta,
            };
        },
        nextRound: () => {
            const { combat, updateCombat } = store.getState();
            if (!combat) return;
            const cleared: CombatState = {
                ...combat,
                playerChoice: {},
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any;
            updateCombat(combatSetPhase(cleared, 'choosing_stance'));
        },
        // Action creators used elsewhere — wired here for completeness.
        addItem: (item) => store.getState().addItem(item),
        removeItem: (itemId) => store.getState().removeItem(itemId),
        useConsumable: (itemId) => store.getState().useConsumable(itemId),
        useItem: (itemId) => useItemAction(store, itemId),
        equipItem: (itemId) => equipItemAction(store, itemId),
        dropItem: (itemId) => dropItemAction(store, itemId),
        moveTo: (nodeId) => moveToAction(store, nodeId),
        changeMap: (mapName) => changeMapAction(store, mapName),
        debugSeed: () => debugSeedAction(store),
        applyCharacterPreset: (presetId) => applyCharacterPresetAction(store, presetId),
        save: () => store.getState().save(),
        resolveCurrentMapEvent: () => resolveCurrentMapEventAction(store),
        pickEventChoice: (choiceId) => pickEventChoiceAction(store, choiceId),
        dismissEvent: () => dismissEventAction(store),
    };
}

// ---------------------------------------------------------------------------
// Inventory action implementations (Spec 06)
// ---------------------------------------------------------------------------

/**
 * Parse a consumable's free-form `effect` string for a healing value.
 * Recognises patterns like `"Heal N HP"`, `"Restore N HP"`, `"+N HP"`,
 * or `"N HP"`. Returns 0 when no value is found.
 */
export function parseHealAmount(effect: string): number {
    if (!effect) return 0;
    const lowered = effect.toLowerCase();
    // Skip strings that explicitly mention damage so we don't heal from
    // a damage-coded consumable.
    if (/\bdamage|\bharm|\binflict|\bburn|\bpoison|\bbleed/.test(lowered)) {
        const matchDamageOnly = /(?:^|\b)(heal|restore|\+)/.test(lowered);
        if (!matchDamageOnly) return 0;
    }
    const re = /(?:heal|restore|\+)\s*(\d+)\s*hp\b/i;
    const m = effect.match(re);
    if (m && m[1]) return Math.max(0, parseInt(m[1], 10));
    const re2 = /\b(\d+)\s*hp\b/i;
    const m2 = effect.match(re2);
    if (m2 && m2[1]) return Math.max(0, parseInt(m2[1], 10));
    return 0;
}

function useItemAction(store: AppStore, itemId: string): UseItemResult {
    const state = store.getState();
    const inventory: readonly Item[] = state.player.inventory;
    const item = inventory.find((i: Item) => i.id === itemId);
    if (!item || !isConsumable(item)) {
        return { applied: false, healed: 0, damaged: 0 };
    }

    const consumable = item as Consumable;
    const hpBefore = state.player.health;
    // The engine's `store.useConsumable` runs `useConsumableEffect`
    // internally, which already applies `consumable.healAmount` when the
    // structured field is present. We only need to apply heal ourselves
    // for legacy fixtures / records that still encode the value as a
    // free-form `effectId` string ("Heal N HP") — the engine ignores
    // those (lookupEffect returns undefined).
    const legacyHeal = consumable.healAmount != null
        ? 0
        : parseHealAmount(consumable.effectId ?? '');
    let nextPlayer: Character = state.player;
    if (legacyHeal > 0) {
        nextPlayer = healCharacter(nextPlayer, legacyHeal);
    }

    // Apply the player-state update first, then route the stack
    // decrement through the engine's reducer.
    if (nextPlayer !== state.player) {
        store.setState({ player: nextPlayer });
    }
    store.getState().useConsumable(itemId);

    const hpAfter = store.getState().player.health;
    const delta = hpAfter - hpBefore;
    return {
        applied: true,
        healed: Math.max(0, delta),
        damaged: Math.max(0, -delta),
    };
}

function equipItemAction(store: AppStore, itemId: string): void {
    const state = store.getState();
    const inventory: readonly Item[] = state.player.inventory;
    const target = inventory.find((i: Item) => i.id === itemId);
    if (!target || !isEquipment(target)) return;

    const targetSlot = (target as Equipment).slot;

    // Build the reordered inventory:
    //   1. The target item (now first in its slot).
    //   2. All other items, preserving their relative order, with the
    //      old "first in slot" item demoted behind the target.
    const targetIndex = inventory.indexOf(target);
    const rest = inventory.filter((_: Item, idx: number) => idx !== targetIndex);
    const slotPeers: Item[] = [];
    const nonSlot: Item[] = [];
    for (const it of rest) {
        if (isEquipment(it) && (it as Equipment).slot === targetSlot) {
            slotPeers.push(it);
        } else {
            nonSlot.push(it);
        }
    }
    const next: Item[] = [target, ...slotPeers, ...nonSlot];

    store.setState({ player: { ...state.player, inventory: next } });
}

function dropItemAction(store: AppStore, itemId: string): void {
    const state = store.getState();
    const inventory: readonly Item[] = state.player.inventory;
    const target = inventory.find((i: Item) => i.id === itemId);
    if (!target) return;
    // Quest items cannot be discarded — `canDiscard` on the VM mirrors
    // this guard so the screen never offers the action, but defend in
    // depth here for direct dispatch.
    if (target.category === 'quest-item') return;
    store.getState().removeItem(itemId);
}

// Re-export the friendship reducer as a no-arg incrementer for tests
// that want to drive the friendship win condition without rolling
// through `resolveRound` repeatedly.
export function incrementCombatFriendship(combat: CombatState): CombatState {
    return combatIncrementFriendship(combat);
}

// ---------------------------------------------------------------------------
// World actions (Spec 07)
// ---------------------------------------------------------------------------

/**
 * Read the player's current node id from the world slice. As of
 * `axiomancer-mechanics@0.5.0` (Spec 08 Q5A), the runtime `MapState`
 * exposes `currentNode` directly — `createMapState` seeds it from the
 * static definition's `startingNode.id` for a fresh map.
 */
export function readCurrentNodeId(world: WorldState): string {
    return world.currentMap.currentNode;
}

function writeCurrentNodeId(map: MapState, nodeId: string): MapState {
    return { ...map, currentNode: nodeId };
}

function moveToAction(store: AppStore, nodeId: string): MoveToResult {
    const world: WorldState | undefined = store.getState().world;
    if (!world) {
        return { moved: false, currentNodeId: '', locked: false };
    }

    const currentNodeId = readCurrentNodeId(world);
    const map = world.currentMap;
    const available = map.availableNodes;
    const completed = map.completedNodes;

    // Target must be currently reachable. Locked or already-completed
    // taps no-op (the screen also gates this, but defend in depth).
    const isAvailable = available.includes(nodeId);
    const isLocked = map.lockedNodes.includes(nodeId);
    if (!isAvailable) {
        return { moved: false, currentNodeId, locked: isLocked };
    }

    let nextWorld: WorldState = worldCompleteNode(world, nodeId);
    // The engine reducer only *adds* to completedNodes; tidy up the
    // available list so the same node can't be re-entered.
    nextWorld = {
        ...nextWorld,
        currentMap: {
            ...nextWorld.currentMap,
            availableNodes: (nextWorld.currentMap.availableNodes as readonly string[]).filter(
                (n: string) => n !== nodeId,
            ),
        },
    };

    // Propagate unlocks for outbound edges declared in the layout fixture
    // (legacy `availableNodes` population — the screen reads this for
    // the visual graph). The mobile fixture is the source of truth for
    // the *visual* layout (positions + hand-drawn edges); the engine's
    // `MapDefinition` registry is the source of truth for the unlock
    // graph itself (Phase 27).
    const layout = getMapLayout(map.name);
    if (layout !== null) {
        const moved = layout.nodes.find((n) => n.id === nodeId);
        const connected = moved?.connectedNodes ?? [];
        for (const targetId of connected) {
            if (completed.includes(targetId)) continue;
            if (nextWorld.currentMap.availableNodes.includes(targetId)) continue;
            nextWorld = worldUnlockNode(nextWorld, targetId);
        }
    }

    nextWorld = {
        ...nextWorld,
        currentMap: writeCurrentNodeId(nextWorld.currentMap, nodeId),
    };

    // Phase 27: populate the engine's parallel data model
    // (`discoveredNodes`) via `revealAdjacent`. The engine reads
    // neighbours from `getMapDefinition(continent, name).nodes[].connectedNodes`
    // — no mobile-side traversal needed. Coexists with the legacy
    // `availableNodes` population above until the screen migrates
    // (future Phase 30 TBD).
    nextWorld = {
        ...nextWorld,
        currentMap: revealAdjacent(nextWorld.currentMap, nodeId),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    store.setState({ world: nextWorld } as any);

    return { moved: true, currentNodeId: nodeId, locked: false };
}

function changeMapAction(store: AppStore, mapName: MapName): void {
    const world: WorldState | undefined = store.getState().world;
    if (!world) return;

    // Phase 60a — adopted `createMapState(getMapDefinition(...))`
    // pattern. The engine's `getCoastalMap` was the single-arg
    // convenience on 0.10.0 (`getCoastalMap(name)`); 0.10.1+
    // removed it in favour of the two-step
    // `createMapState(getMapDefinition(continent, name))` form.
    // Both paths exist on 0.10.0, so this migration is safe under
    // the current lockfile. Continent is sourced from the current
    // map (Coastal Cradle today; world-state-tracked when the
    // northern continent ships).
    const continent = world.currentMap.continent;
    const nextMap = createMapState(getMapDefinition(continent, mapName));
    const nextWorld = worldChangeMap(world, nextMap);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    store.setState({ world: nextWorld } as any);
}

// ---------------------------------------------------------------------------
// Debug seed (Phase 54 — dev-only manual-testing affordance)
// ---------------------------------------------------------------------------

/** Build a minimal `Equipment` Item from an engine `EquipmentTemplate`.
 * Templates carry the chrome (id/name/description/slot/baseStatModifiers);
 * `Equipment` needs the `BaseItem` shape on top (category, stackable,
 * quantity, rarity, modifiers). For dev-seed purposes we stamp common /
 * unrolled defaults — the engine's `equipItem` reducer and the inventory
 * screen are happy with this shape (verified via the Phase 32 dock work). */
function templateToEquipment(template: EquipmentTemplate): Equipment {
    return {
        ...template,
        category: 'equipment',
        stackable: false,
        quantity: 1,
        rarity: 'common',
        modifiers: [],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any as Equipment;
}

function debugSeedAction(store: AppStore): DebugSeedResult {
    const state = store.getState();
    const addItem = state.addItem;

    let itemsAdded = 0;
    let skillsLearned = 0;

    // 1. One consumable from the engine library (Healing Potion as the
    //    canonical test item). `addItem` is the engine reducer; we
    //    spread to a fresh object so the engine's stack-merge path can
    //    do its work without alias issues.
    const potion = consumableLibrary[0];
    if (potion) {
        addItem({ ...potion });
        itemsAdded++;
    }

    // 2. One equipment per common slot (head / body / weapon). The
    //    inventory dock and equip-replace preview both key off slot,
    //    so covering three slots gives a meaningful smoke test.
    const slots: ReadonlyArray<'head' | 'body' | 'weapon'> = ['head', 'body', 'weapon'];
    for (const slot of slots) {
        const tpl = equipmentTemplates.find((t) => t.slot === slot);
        if (tpl) {
            addItem(templateToEquipment(tpl));
            itemsAdded++;
        }
    }

    // 3. Two skills from the engine's library (covers both paradox +
    //    fallacy categories). Phase 16 swapped the data source from
    //    the local mock to `state/selectors/combat-skills`; engine
    //    0.10.2 now re-exports `skillLibrary` at the top level.
    //    Push directly onto `player.knownSkills` rather than via
    //    `engine.learnSkill` — `learnSkill` enforces level-/stat-
    //    gating which the dev seed should bypass. The ids it adds
    //    are exactly what the picker renders from `COMBAT_SKILLS`.
    const fixtureSkillIds: ReadonlyArray<string> = COMBAT_SKILLS
        .slice(0, 4)
        .map((s) => s.id);
    if (fixtureSkillIds.length > 0) {
        const afterAdd = store.getState();
        const player = afterAdd.player;
        const known = new Set<string>(player.knownSkills ?? []);
        for (const id of fixtureSkillIds) {
            if (!known.has(id)) {
                known.add(id);
                skillsLearned++;
            }
        }
        const nextPlayer: Character = {
            ...player,
            knownSkills: Array.from(known),
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        store.setState({ player: nextPlayer } as any);
    }

    // 4. Reset the current map: re-seed via the engine's two-step
    //    `createMapState(getMapDefinition(continent, name))` +
    //    `changeMap`. Engine guarantees the returned `MapState` is at
    //    `currentNode = startingNode.id` with cleared
    //    discoveredNodes / consumedNodes.
    //    (Phase 60a — migrated from the deprecated single-arg
    //    `getCoastalMap`; both paths exist on 0.10.0 but 0.10.1+
    //    drops the old form.)
    let mapReset = false;
    const world: WorldState | undefined = store.getState().world;
    if (world && world.currentMap) {
        try {
            const fresh = createMapState(
                getMapDefinition(world.currentMap.continent, world.currentMap.name),
            );
            const nextWorld = worldChangeMap(world, fresh);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            store.setState({ world: nextWorld } as any);
            mapReset = true;
        } catch {
            // changeMap can throw if the map name is unknown. Swallow
            // and report — the seed action is best-effort dev affordance.
            mapReset = false;
        }
    }

    return { itemsAdded, skillsLearned, mapReset };
}

function applyCharacterPresetAction(
    store: AppStore,
    presetId: string,
): ApplyCharacterPresetResult {
    const preset = getPresetById(presetId);
    if (!preset) {
        return { applied: false, presetId: null, presetName: null };
    }
    const nextPlayer = buildCharacterFromPreset(preset) as Character;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    store.setState({ player: nextPlayer } as any);
    return { applied: true, presetId: preset.id, presetName: preset.name };
}

// ---------------------------------------------------------------------------
// Event actions (Spec 08 — Phase 6 Tick B)
// ---------------------------------------------------------------------------

function resolveCurrentMapEventAction(store: AppStore): boolean {
    const state = store.getState();
    // Spec 08 Q4 = Future spec: do not stack events on top of combat.
    if (state.combat !== null) return false;

    const gameState = state as unknown as GameState;
    const result: ResolveMapEventResult = resolveMapEvent(gameState);

    // Phase 27: when a non-'none' event resolves, mark the current
    // node consumed in the engine's parallel data model
    // (`consumedNodes`) so future encounters don't re-fire there.
    // Coexists with legacy `completedNodes` (already populated by
    // `moveToAction`'s `worldCompleteNode` call). Screen still reads
    // legacy fields; Phase 30+ TBD migrates the read side.
    let resolvedState: GameState = result.state;
    if (result.event.kind !== 'none') {
        const currentNodeId = resolvedState.world?.currentMap?.currentNode;
        if (currentNodeId) {
            resolvedState = {
                ...resolvedState,
                world: {
                    ...resolvedState.world,
                    currentMap: markNodeConsumed(resolvedState.world.currentMap, currentNodeId),
                },
            };
        }
    }

    // Spread the advanced state onto the store. `event` is mobile-only
    // and survives because `result.state` does not include it.
    const nextEvent = {
        ...(state.event ?? EMPTY_EVENT_SLICE),
        pending: result,
        // If the resolved event is an interaction with a DialogueTree,
        // seed the dialogue cursor at the tree's root so
        // `selectEventViewModel` composes against the right node.
        dialogueCursor:
            result.event.kind === 'interaction' && result.event.dialogue
                ? { tree: result.event.dialogue, nodeId: result.event.dialogue.rootId }
                : null,
        history: [],
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    store.setState({ ...resolvedState, event: nextEvent } as any);

    return result.event.kind !== 'none';
}

function clearEventSlice(store: AppStore): void {
    store.setState({ event: EMPTY_EVENT_SLICE });
}

function pickEventChoiceAction(store: AppStore, choiceId: string): void {
    const state = store.getState();
    const slice = state.event;
    if (!slice || slice.pending === null) return;

    const processed = slice.pending.event;

    // combat-prelude path
    if (processed.kind === 'encounter') {
        if (choiceId === 'fight') {
            // Phase 60b — engine's canonical `Encounter` shape is
            // `{ enemies: Enemy[], origin?: string, rewards?:
            // Reward[] }` (axiomancer-mechanics/dist/World/types.d.ts).
            // The prelude consumes the first enemy. The earlier
            // `as any` cast (closed via [2.5] event-audit row 4)
            // dated back to Phase 60b's migration; the engine type
            // exposes `.enemies` directly today.
            const enemy = processed.encounter.enemies[0];
            store.getState().startCombat(enemy);
            // Phase 60d — seed mobile-only mana slice after the
            // encounter-prelude path starts combat. Matches the
            // direct `actions.startCombat` branch above.
            if (store.getState().combat !== null) {
                seedCombatMana(store);
            }
            clearEventSlice(store);
            return;
        }
        if (choiceId === 'flee') {
            // [4.5] DRIFT fix (mechanics-vs-UI audit row 10):
            // the FLEE button's chrome subtitle reads
            // `forfeit the path · -ii morale` on non-boss
            // encounters. Honour the chrome — shift the
            // engine `moralMeter` by -2 so the SELF tab's
            // alignment readout reflects the cost. Boss
            // flee is engine-disabled in the UI (KNEEL /
            // `enabled: false`) and the subtitle reads
            // `sealed · no retreat` — no morale delta
            // applies there even if the choice somehow
            // dispatched.
            if (!processed.isBoss) {
                store.getState().shiftMoralMeter(-2);
            }
            clearEventSlice(store);
            return;
        }
        // Unknown choice id on combat-prelude — defensive no-op.
        return;
    }

    // npc dialogue path (cursor-driven)
    if (slice.dialogueCursor !== null) {
        const { tree, nodeId } = slice.dialogueCursor;
        const node = getDialogueNode(tree, nodeId);
        // Phase 60c — engine flattened DialogueChoice (dropped `.id`).
        // The presenter now derives `choiceId` from the choice's
        // index in `node.choices`; lookup mirrors that index. If the
        // id isn't a valid index, treat as unknown choice
        // (defensive no-op preserved).
        const idx = Number(choiceId);
        const choices = node.choices ?? [];
        const choice: DialogueChoice | undefined =
            Number.isInteger(idx) && idx >= 0 && idx < choices.length
                ? choices[idx]
                : undefined;
        if (!choice) {
            // Unknown choice on dialogue node — defensive no-op.
            return;
        }

        // applyDialogue advances engine state. Mobile-side: walk the cursor.
        store.getState().applyDialogue(tree, choice);
        const nextState = store.getState() as unknown as GameState;
        const result = applyDialogueChoice(nextState, tree, choice);

        const nextHistory = [
            ...(slice.history as ReadonlyArray<{ nodeId: string; choiceId: string }>),
            { nodeId, choiceId },
        ];

        if (result.nextNode !== null) {
            store.setState({
                event: {
                    ...slice,
                    dialogueCursor: {
                        tree,
                        nodeId: result.nextNode.id ?? nodeId,
                    },
                    history: nextHistory,
                },
            });
        } else {
            // Dialogue tree exhausted — clear the event.
            clearEventSlice(store);
        }
        return;
    }

    // narrative-choice auto-resolve path (rest / gathering / loot-cache /
    // interaction-without-dialogue / village / cutscene / hazard). Engine
    // already advanced state via resolveMapEvent; just clear the event slice.
    clearEventSlice(store);
}

function dismissEventAction(store: AppStore): void {
    clearEventSlice(store);
}
