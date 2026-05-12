/**
 * Typed action layer for the engine store.
 *
 * Per Spec 04: the combat screen never dispatches engine reducers
 * directly — it calls these actions. Each one wraps a small bit of
 * engine state and writes the result back through `updateCombat`.
 *
 * Resource (mana) accounting on the player today is a presentation
 * placeholder: `axiomancer-mechanics@0.3.0` does not ship a player
 * mana slice yet. The action layer stamps `mana`/`maxMana` onto the
 * in-combat `player` so the HUD has a number to render. Once the
 * engine ships resources (engine Spec ~04), drop the local accounting
 * and read straight from the engine.
 */

import {
    appendLog as combatAppendLog,
    setPhase as combatSetPhase,
    setPlayerAction as combatSetPlayerAction,
    setPlayerStance as combatSetPlayerStance,
    determineAdvantage,
    determineCombatEnd,
    determineEnemyAction,
    incrementFriendship as combatIncrementFriendship,
    resolveCombatRound,
    type CombatPhase,
    type CombatState,
    type Enemy,
    type Item,
    type Stance,
} from 'axiomancer-mechanics';

import {
    COMBAT_SKILLS_FIXTURE,
    type CombatSkillFixture,
} from './mocks/combat.skills.fixture';
import type { AppStore } from './store';

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
    save: () => void;
}

// ---------------------------------------------------------------------------
// Player mana scaffolding (presentation placeholder)
// ---------------------------------------------------------------------------

const PLAYER_MANA_DEFAULT = 14;
const PLAYER_MANA_START = 9;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ensureManaOnCombatPlayer(combat: CombatState): CombatState {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const player = combat.player as unknown as Record<string, any>;
    if (typeof player.mana === 'number' && typeof player.maxMana === 'number') {
        return combat;
    }
    return {
        ...combat,
        player: {
            ...combat.player,
            mana: PLAYER_MANA_START,
            maxMana: PLAYER_MANA_DEFAULT,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
    };
}

function findSkill(skillId: string): CombatSkillFixture | null {
    return COMBAT_SKILLS_FIXTURE.find((s) => s.id === skillId) ?? null;
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
            const after = store.getState().combat;
            if (after !== null) {
                store.getState().updateCombat(ensureManaOnCombatPlayer(after));
            }
        },
        endCombat: () => store.getState().endCombat(),
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

            // Hand-rolled skill lookup: the engine resolver needs one
            // when the player picks a skill. Today it returns null for
            // every entry (engine Spec 04 will replace this with the
            // real skill library). The presenter still surfaces the
            // skill picker; the round just resolves as a basic action.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const skillLookup = (_id: string) => null as any;

            const playerCombatAction = skillId
                ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ({ stance: playerStance, action: 'attack' } as any)
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
            nextWithEnemy = ensureManaOnCombatPlayer(nextWithEnemy);

            // Mana accounting placeholder — burn mana for skills.
            if (skillId) {
                const skill = findSkill(skillId);
                if (skill !== null) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const p = nextWithEnemy.player as unknown as Record<string, any>;
                    const currentMana = Number(p.mana ?? 0);
                    nextWithEnemy = {
                        ...nextWithEnemy,
                        player: {
                            ...nextWithEnemy.player,
                            mana: Math.max(0, currentMana - skill.manaCost),
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        } as any,
                    };
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
        save: () => store.getState().save(),
    };
}

// Re-export the friendship reducer as a no-arg incrementer for tests
// that want to drive the friendship win condition without rolling
// through `resolveRound` repeatedly.
export function incrementCombatFriendship(combat: CombatState): CombatState {
    return combatIncrementFriendship(combat);
}
