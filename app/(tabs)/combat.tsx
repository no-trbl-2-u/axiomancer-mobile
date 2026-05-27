/**
 * Combat screen — UI shell.
 *
 * Per Spec 04: this file holds no game logic. Every value it renders
 * is read from `selectCombatViewModel`; every state change it triggers
 * goes through `useGameActions()`. Phase ownership is on the engine
 * (`combat.phase`); the screen only previews the player's current
 * stance via local UI state until the player commits.
 *
 * Phase layout (Phase 32 sub-tick C, commit `9222bf9` — port from
 * the Claude Design handoff): the four phases stance / action /
 * skill / resolving render as a vertical PhaseStack. Each row sits
 * in one of three states:
 *   - past    — collapsed to one line with a right-aligned summary
 *               of the committed value (e.g. "BODY" / "STRIKE");
 *   - current — expanded panel with the active picker inline +
 *               sulfur dot indicator on the header strip;
 *   - future  — dimmed label only in ash, no body.
 * The skill row hides itself when the picked action wasn't 'skill'
 * (driven by `vm.phaseStack[i].visible`). Pre-Phase-32 this surface
 * was a horizontal swipe carousel; the swap removed the swipe-to-
 * change-phase affordance — committed phases stay committed within
 * a round.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle, Ellipse, Defs, RadialGradient, Stop } from 'react-native-svg';

import { AXM, FONTS } from '@/theme/axm';
import { useAesthetic } from '@/state/aesthetic-mode';
import { useCombatMode } from '@/state/combat-mode';
import { useGameActions, useGameState } from '@/state/GameStoreProvider';
import { createMockEncounterEnemy } from '@/state/mocks/combat.mock';
import {
    useCombatViewModel,
    type ActionOption,
    type CombatLogEntryDisplay,
    type CombatViewModel,
    type SkillOption,
    type StanceKey,
} from '@/state/presenters/combat.engine';
import { selectCodexStatusLine } from '@/state/presenters/combat.codex.engine';
import { CodexStatusStrip } from '@/components/CodexStatusStrip';
import { ScreenBg } from '@/components/ScreenBg';
import { SectionLabel } from '@/components/SectionLabel';
import { StatBar } from '@/components/StatBar';
import { StanceGlyph } from '@/components/StanceGlyph';
import { EffectChip } from '@/components/EffectChip';
import { FriendshipMeter } from '@/components/FriendshipMeter';
import { MindMark } from '@/components/MindMark';
import { DifficultyBadge } from '@/components/DifficultyBadge';
import { Splatter } from '@/components/Splatter';
import { PhaseBottom } from '@/components/combat/PhaseBottom';
import { TooltipTarget } from '@/components/tooltip/TooltipTarget';

// ---------------------------------------------------------------------------
// Local UI state (Q2: stance preview lives here until the user commits)
// ---------------------------------------------------------------------------

const LOG_SEVERITY_COLOR: Record<CombatLogEntryDisplay['severity'], string> = {
    info: AXM.parchment,
    damage: AXM.blood,
    crit: AXM.sulfur,
    heal: '#5a8a3a',
    effect: AXM.rust,
    friendship: AXM.rust,
    system: AXM.bone,
};

// ---------------------------------------------------------------------------
// Screen
//
// Phase 63a (2026-05-21): the inner content was extracted into a
// named-export `<CombatPanel>` so the same combat surface can
// mount inside `EncounterModalOverlay` (Phase 63b) without
// double-wrapping `<ScreenBg>`. Default-export `CombatScreen`
// stays as the tab shell that wraps `<CombatPanel>` in
// `<ScreenBg>`.
// ---------------------------------------------------------------------------

export default function CombatScreen() {
    return (
        <ScreenBg>
            <CombatPanel />
        </ScreenBg>
    );
}

/**
 * The combat surface without its outer ScreenBg wrap. Returns
 * the loading state OR the active combat render — neither
 * branch wraps in ScreenBg, so callers can mount this inside
 * any container (tab shell, modal overlay, etc.) and own the
 * outer scrolling / safe-area behaviour.
 */
/**
 * Phase 70 Tick A — capture the last log entry's skill / damage /
 * result-descriptor as the "final blow" snapshot the aftermath
 * panel shows. Engine doesn't tag skill *name* on log entries
 * (only the skillId on the action), so we surface the id (uppercased)
 * or the action verb (`attack` / `defend` / `skill` / `item` /
 * `flee`) as the fallback. A presenter-side name lookup is a
 * promotion candidate when the writers add display names.
 */
function buildFinalBlowSnapshot(combat: CombatStateLike): {
    skillName: string | null;
    damage: number;
    descriptor: string | null;
} | null {
    const last = combat.log[combat.log.length - 1];
    if (last === undefined) return null;
    // Defensive optional chaining — same shape-mismatch the
    // defeat-branch snapshot guards against. Engine types
    // playerAction as required, but log entries can ship the
    // field undefined in practice.
    const rawName =
        last.playerAction?.skillId
        ?? last.playerAction?.action
        ?? null;
    return {
        skillName: rawName !== null ? rawName.toUpperCase() : null,
        damage: last.damageToEnemy ?? 0,
        descriptor:
            typeof last.result === 'string' && last.result.length > 0
                ? last.result
                : null,
    };
}

// Structural type — the bits buildFinalBlowSnapshot reads. Avoids
// dragging the full engine CombatState import in for one helper.
type CombatStateLike = {
    log: {
        playerAction?: { skillId?: string; action?: string };
        damageToEnemy?: number;
        result?: string;
    }[];
};

/**
 * Phase 78 — derive a short preview line from a codex entry body.
 * Takes the first sentence (split on the first period), truncates
 * to ≤120 chars at a word boundary, strips the trailing period.
 * The aftermath panel appends `'…'` itself.
 */
export function derivePreview(body: string): string {
    const trimmed = body.trim();
    if (trimmed.length === 0) return '';
    const firstPeriod = trimmed.indexOf('.');
    const firstSentence =
        firstPeriod > 0 ? trimmed.slice(0, firstPeriod) : trimmed;
    if (firstSentence.length <= 120) return firstSentence;
    const cutoff = firstSentence.lastIndexOf(' ', 120);
    return cutoff > 0 ? firstSentence.slice(0, cutoff) : firstSentence.slice(0, 120);
}

export function CombatPanel() {
    const router = useRouter();
    const {
        exitCombat,
        exitCombatWith,
        inEncounterModal,
        closeEncounterModal,
        encountersFaced,
        deepestNodeId,
    } = useCombatMode();
    const { mode: aesthetic } = useAesthetic();
    const combat = useGameState((s) => s.combat);
    const currentMapId = useGameState((s) => s.world?.currentMap?.name ?? null);
    // Phase 65 Tick B — no default starting stance. `null` until the
    // player taps a stance card; the picker shows no card pre-highlighted
    // on combat entry. Was previously `'heart'`, which surfaced as a
    // user-confusing "Heart is already selected" UX.
    const [selectedStance, setSelectedStance] = useState<StanceKey | null>(null);
    const vm = useCombatViewModel({ selectedStance: selectedStance ?? undefined });
    const actions = useGameActions();
    const [toast, setToast] = useState<string | null>(null);

    useEffect(() => {
        if (combat === null) {
            actions.startCombat(createMockEncounterEnemy());
        }
    }, [combat, actions]);

    useEffect(() => {
        if (toast === null) return;
        const handle = setTimeout(() => setToast(null), 1800);
        return () => clearTimeout(handle);
    }, [toast]);

    const onPickStance = useCallback((stance: StanceKey) => {
        setSelectedStance(stance);
        actions.setPlayerStance(stance);
        actions.setCombatPhase('choosing_action');
    }, [actions]);

    const onPickAction = useCallback((key: ActionOption['key']) => {
        if (key === 'skill') {
            actions.setCombatPhase('choosing_skill');
            return;
        }
        if (key === 'item') {
            setToast(vm.actionPicker.itemMessage);
            return;
        }
        actions.setPlayerAction(key);
        actions.resolveRound();
    }, [actions, vm.actionPicker.itemMessage]);

    const onPickSkill = useCallback((skill: SkillOption) => {
        if (!skill.enabled) return;
        actions.setPlayerAction('skill', skill.id);
        actions.resolveRound();
    }, [actions]);

    // Phase 73 (user-direct 2026-05-23) — past phase rows are tappable
    // so a player can undo a stance or action choice before the round
    // resolves. Set the engine phase back to the tapped phase; the
    // picker for that phase re-mounts as the current row and the
    // player can pick again. The committed choice is preserved until
    // the player commits a new one (the engine's setStance / setAction
    // overwrite). Resolving rounds can't be "undone" — but the player
    // hasn't yet pressed LET IT FALL, so re-picking the action is
    // still meaningful up to that point.
    const onGoBackToPhase = useCallback((phase: 'choosing_stance' | 'choosing_action' | 'choosing_skill') => {
        actions.setCombatPhase(phase);
    }, [actions]);

    // Phase 63c — when CombatPanel runs inside the encounter modal,
    // combat-end handlers skip the `router.replace('/exploration')`
    // and instead close the encounter modal in-place; the exploration
    // screen is already mounted underneath the modal, so dismissing
    // the modal returns the player to the map naturally. The legacy
    // tab-context path still routes (kept for the /combat route
    // until Phase 63d retires it).
    const finalizeCombatExit = useCallback(() => {
        if (inEncounterModal) {
            closeEncounterModal();
        } else {
            router.replace('/exploration' as never);
        }
    }, [inEncounterModal, closeEncounterModal, router]);

    const onContinueRound = useCallback(() => {
        // Combat-end outcome resolution for the aftermath banner (Phase 41
        // port). Order matters: friendship max BEFORE enemy HP because a
        // parley fight ends when the friendship counter hits the cap even
        // if the enemy hasn't dropped. Player HP <= 0 is the defeat branch.
        if (vm.friendshipCounter >= vm.friendshipCounterMax) {
            // Phase 78 — capture combat.enemy.journalEntry BEFORE
            // actions.endCombat() clears the slice. The engine
            // report tells us which entry unlocked (by id+title);
            // the body comes from the live enemy's journalEntry
            // field. The engine guards against re-unlocking entries
            // already in state.codex.unlockedEntries — repeat
            // friendships with the same foe report no unlock and
            // the snapshot stays journalEntry: null.
            const enemyJournalEntry = combat?.enemy.journalEntry ?? null;
            const report = actions.endCombat();
            const codexUnlocked = report?.friendshipReward?.codexEntryUnlocked ?? null;
            const journalEntrySnapshot =
                codexUnlocked && enemyJournalEntry
                    ? {
                          bookName: 'CODEX',
                          entryTitle: codexUnlocked.title.toUpperCase(),
                          preview: derivePreview(enemyJournalEntry.body),
                      }
                    : null;
            const parleySnapshot = combat !== null
                ? {
                      variant: 'parley' as const,
                      enemy: {
                          name: combat.enemy.name,
                          description: combat.enemy.description,
                          level: combat.enemy.level,
                          // Phase 76 — thread engine narrative lines
                          // through. Optional; the presenter falls back
                          // to a generic per-tier phrase when absent.
                          pactLines: combat.enemy.pactLines,
                      },
                      xpReward: combat.enemy.xpReward ?? null,
                      journalEntry: journalEntrySnapshot,
                  }
                : undefined;
            exitCombatWith('parley', parleySnapshot);
            if (!inEncounterModal) {
                finalizeCombatExit();
            }
            return;
        }
        if (vm.enemy.hp <= 0) {
            // Phase 70 Tick A — snapshot the combat state before
            // endCombat() clears the slice, so the in-modal
            // CombatVictoryPanel has data to render. When we're
            // inside the encounter modal, skip finalizeCombatExit:
            // the panel's CARRY ON button drives dismissal via
            // dismissAftermath() instead. The legacy /combat tab
            // path (modal-less) finalizes immediately — that route
            // is unused in practice (encounters always open the
            // modal), but the branch stays for the /combat tab's
            // direct-mount harness pass.
            const aftermathSnapshot = combat !== null
                ? {
                      variant: 'victory' as const,
                      enemy: {
                          name: combat.enemy.name,
                          description: combat.enemy.description,
                          level: combat.enemy.level,
                          // Phase 76 — engine narrative lines (optional).
                          finalBlowLines: combat.enemy.finalBlowLines,
                      },
                      finalBlow: buildFinalBlowSnapshot(combat),
                      xpReward: combat.enemy.xpReward ?? null,
                  }
                : undefined;
            actions.endCombat();
            exitCombatWith('victory', aftermathSnapshot);
            if (!inEncounterModal) {
                finalizeCombatExit();
            }
            return;
        }
        if (vm.player.hp <= 0) {
            // Phase 70 Tick C — same snapshot pattern as victory /
            // parley. The defeat panel reads enemy + killer + run
            // summary from the AftermathData snapshot after
            // actions.endCombat() clears the slice.
            const defeatSnapshot = combat !== null
                ? {
                      variant: 'defeat' as const,
                      enemy: {
                          name: combat.enemy.name,
                          description: combat.enemy.description,
                          level: combat.enemy.level,
                          // Phase 76 — engine narrative lines (optional).
                          causeLines: combat.enemy.causeLines,
                      },
                      characterName: combat.player.name,
                      // Damage figure here is what the enemy dealt
                      // to the player on the killing round (mirror
                      // of the victory branch's damageToEnemy).
                      // Defensive optional chaining on enemyAction —
                      // the engine's BattleLogEntry types it as a
                      // required CombatAction, but a user-reported
                      // crash 2026-05-23 ("boss test encounter tried
                      // to use a skill") showed the field can be
                      // undefined in practice when a boss's enemy
                      // action lands on the killing log entry. Read
                      // defensively rather than trust the engine type.
                      finalBlow: (() => {
                          const last = combat.log[combat.log.length - 1];
                          if (last === undefined) return null;
                          const rawName =
                              last.enemyAction?.skillId
                              ?? last.enemyAction?.action
                              ?? null;
                          return {
                              skillName: rawName !== null ? rawName.toUpperCase() : null,
                              damage: last.damageToPlayer ?? 0,
                              descriptor:
                                  typeof last.result === 'string' && last.result.length > 0
                                      ? last.result
                                      : null,
                          };
                      })(),
                      runSummary: {
                          roundsEndured: combat.round,
                          encountersFaced,
                          deepestNodeId,
                          currentMapId,
                      },
                  }
                : undefined;
            actions.endCombat();
            exitCombatWith('defeat', defeatSnapshot);
            if (!inEncounterModal) {
                finalizeCombatExit();
            }
            return;
        }
        actions.nextRound();
    }, [
        actions,
        combat,
        exitCombatWith,
        finalizeCombatExit,
        inEncounterModal,
        encountersFaced,
        deepestNodeId,
        currentMapId,
        vm.enemy.hp,
        vm.player.hp,
        vm.friendshipCounter,
        vm.friendshipCounterMax,
    ]);

    const onFlee = useCallback(() => {
        setToast(vm.actionPicker.fleeMessage);
    }, [vm.actionPicker.fleeMessage]);

    const onLeaveCombat = useCallback(() => {
        actions.endCombat();
        // `onLeaveCombat` is the early-exit DEPART path before the
        // resolve phase; treat as 'flee' (the banner stays silent).
        exitCombat();
        finalizeCombatExit();
    }, [actions, exitCombat, finalizeCombatExit]);

    if (!vm.isInCombat) {
        // First render before useEffect runs the bootstrap. The pre-
        // Phase-30 placeholder was an empty <View>, which the user
        // observed as "combat encounter is blank" — the visible
        // `loadingMessage` keeps the screen from collapsing to a void.
        return (
            <View style={styles.loadingWrap} testID="combat-screen-loading">
                <Text style={styles.loadingText}>{vm.loadingMessage}</Text>
            </View>
        );
    }

    return (
        <>
            {aesthetic === 'codex' && (
                <CodexStatusStrip line={selectCodexStatusLine(vm)} />
            )}
            <EnemyPanel vm={vm} />
            <BattleLog log={vm.log} round={vm.round} emptyMessage={vm.logEmptyMessage} />
            {/* Phase 73 — PlayerHud now renders AFTER the phase stack
              * to match the design's PtCombatBody order (`prototype.jsx:
              * 692-711`): enemy / round strip / phase stack (scrollable) /
              * player HUD at the bottom. Pre-Phase-73 the HUD sat above
              * the phase stack, which read as a player-summary block
              * before the action choices — the design wires it as a
              * "your turn" footer beneath the active picker. */}
            <PhaseBottom
                vm={vm}
                onPickStance={onPickStance}
                onPickAction={onPickAction}
                onPickSkill={onPickSkill}
                onGoBackToPhase={onGoBackToPhase}
                onFlee={onFlee}
                onContinue={onContinueRound}
                onLeave={onLeaveCombat}
            />
            <PlayerHud vm={vm} />
            {toast !== null && (
                <View style={styles.toast} accessibilityLiveRegion="polite">
                    <Text style={styles.toastText}>{toast}</Text>
                </View>
            )}
        </>
    );
}

// ---------------------------------------------------------------------------
// Enemy panel
// ---------------------------------------------------------------------------

function EnemyPanel({ vm }: { vm: CombatViewModel }) {
    const lastStance: StanceKey = vm.enemy.lastStance ?? 'mind';
    // Phase 72 — restructured to the design's left-portrait pattern
    // (`design/handoff-2026-05-23/project/screens-canonical.jsx:213-243`).
    // Three columns: 60×72 framed portrait left, info column middle (flex),
    // STANDS-stance indicator right. Pre-Phase-72 the SVG was a 180×200
    // off-bleed overlay on the right — the user-reported "cleaner placing
    // of the enemy's image/svg" addressed.
    return (
        <View style={styles.enemyPanel}>
            <Splatter
                color={AXM.blood}
                size={100}
                seed={17}
                style={{ position: 'absolute', top: -16, left: -16, opacity: 0.5 }}
            />
            <View style={styles.enemyRow}>
                <View style={styles.enemyPortrait}>
                    <Svg
                        viewBox="0 0 200 200"
                        width={58}
                        height={70}
                        // The detailed hooded silhouette renders smaller now;
                        // the eye/mouth pixels become subtle marks rather than
                        // the dominant chrome they were pre-Phase-72.
                    >
                        <Defs>
                            <RadialGradient id="eg" cx="50%" cy="40%">
                                <Stop offset="0%" stopColor={AXM.blood} stopOpacity={0.4} />
                                <Stop offset="100%" stopColor={AXM.blood} stopOpacity={0} />
                            </RadialGradient>
                        </Defs>
                        <Ellipse cx={100} cy={100} rx={90} ry={80} fill="url(#eg)" />
                        <Path
                            d="M100 30 C 60 30 40 70 50 130 L 30 200 L 170 200 L 150 130 C 160 70 140 30 100 30 Z"
                            fill="#06050a"
                            stroke={AXM.parchment}
                            strokeWidth={1.5}
                        />
                        <Path
                            d="M70 70 Q 100 50 130 70 L 130 110 Q 100 130 70 110 Z"
                            fill="#000"
                        />
                        <Circle cx={85} cy={90} r={3.5} fill={AXM.blood} />
                        <Circle cx={115} cy={90} r={3.5} fill={AXM.blood} />
                    </Svg>
                </View>
                <View style={styles.enemyInfo}>
                    <View style={styles.enemyTopRow}>
                        <Text style={styles.enemyEyebrow}>WHAT WAITS</Text>
                        <View style={{ flex: 1 }} />
                        <DifficultyBadge tier={vm.enemy.tier || 'normal'} />
                        <Text style={styles.roundText}>{vm.roundToken}</Text>
                    </View>
                    <Text style={styles.enemyName} numberOfLines={1}>{vm.enemy.name}</Text>
                    {vm.enemy.flavor !== '' && (
                        <Text style={styles.enemyFlavor} numberOfLines={1}>
                            {`"…${vm.enemy.flavor}"`}
                        </Text>
                    )}
                    <View style={{ marginTop: 6 }}>
                        <StatBar
                            value={vm.enemy.hp}
                            max={vm.enemy.hpMax}
                            color={AXM.blood}
                            label="VITAE"
                            height={8}
                        />
                    </View>
                    <View style={styles.enemyMetaRow}>
                        <FriendshipMeter value={vm.friendshipCounter} max={vm.friendshipCounterMax} />
                        <MindMark stacks={vm.enemy.mindMarks} />
                    </View>
                    {vm.enemy.effects.length > 0 && (
                        <View style={styles.effectsRow}>
                            {vm.enemy.effects.map((e, i) => (
                                <TooltipTarget
                                    key={`${e.kind}-${i}`}
                                    kind="effect"
                                    id={e.effectId}
                                    accessibilityLabel={`Effect ${e.name}`}
                                    accessibilityHint="tap to read description"
                                    testID={`combat-enemy-effect-${i}`}
                                >
                                    <EffectChip
                                        effect={{
                                            ...e,
                                            tint: e.tint ?? undefined,
                                            duration: e.duration ?? undefined,
                                        }}
                                    />
                                </TooltipTarget>
                            ))}
                        </View>
                    )}
                </View>
                <View style={styles.enemyStanceCol}>
                    <Text style={styles.enemyStanceLabel}>STANDS</Text>
                    <StanceGlyph
                        kind={lastStance}
                        size={28}
                        color={vm.enemy.lastStance === null ? AXM.bone : AXM.sulfur}
                    />
                </View>
            </View>
        </View>
    );
}

// ---------------------------------------------------------------------------
// Battle log (Q4: full scroll + colour per severity)
// ---------------------------------------------------------------------------

function BattleLog({
    log,
    round,
    emptyMessage,
}: {
    log: readonly CombatLogEntryDisplay[];
    round: number;
    emptyMessage: string;
}) {
    return (
        <View style={styles.logWrap}>
            <View style={styles.logBox}>
                <SectionLabel size={8} color={AXM.bone}>{`⚜ BATTLE LOG · ROUND ${round}`}</SectionLabel>
                {log.length === 0 ? (
                    <Text style={[styles.logLine, { color: AXM.bone }]}>{emptyMessage}</Text>
                ) : (
                    <ScrollView
                        style={styles.logScroll}
                        contentContainerStyle={{ paddingBottom: 4 }}
                        showsVerticalScrollIndicator={false}
                        accessibilityLabel="Battle log"
                    >
                        {log.map((entry, i) => (
                            <Text
                                key={i}
                                style={[styles.logLine, { color: LOG_SEVERITY_COLOR[entry.severity] }]}
                                accessibilityRole="text"
                            >
                                {entry.text}
                            </Text>
                        ))}
                    </ScrollView>
                )}
            </View>
        </View>
    );
}

// ---------------------------------------------------------------------------
// Player HUD
// ---------------------------------------------------------------------------

function PlayerHud({ vm }: { vm: CombatViewModel }) {
    // Phase 73 — port the design's PlayerHUDLive (`prototype.jsx:
    // 452-472`). Sits at the bottom of the seal as a "your turn"
    // footer: stance glyph on the left (sulfur when a stance is
    // committed, bone otherwise), then a column on the right with
    // the VITAE bar across the top and the friendship meter +
    // effect chips on the bottom row. Mana bar omitted per user-
    // direct override (2026-05-23) — only VITAE is player-visible.
    const stance = vm.stancePicker.selected;
    return (
        <View style={styles.playerWrap}>
            <View style={styles.playerInner}>
                <StanceGlyph
                    kind={stance ?? 'body'}
                    size={26}
                    color={stance !== null ? AXM.sulfur : AXM.bone}
                />
                <View style={styles.playerCol}>
                    <StatBar value={vm.player.hp} max={vm.player.hpMax} color={AXM.blood} label="VITAE" height={8} />
                    <View style={styles.playerMetaRow}>
                        <FriendshipMeter
                            value={vm.friendshipCounter}
                            max={vm.friendshipCounterMax}
                        />
                        <View style={{ flex: 1 }} />
                        <View style={styles.playerEffects}>
                            {vm.player.effects.map((e, i) => (
                                <TooltipTarget
                                    key={`${e.kind}-${i}`}
                                    kind="effect"
                                    id={e.effectId}
                                    accessibilityLabel={`Effect ${e.name}`}
                                    accessibilityHint="tap to read description"
                                    testID={`combat-player-effect-${i}`}
                                >
                                    <EffectChip
                                        effect={{ ...e, tint: e.tint ?? undefined, duration: e.duration ?? undefined }}
                                    />
                                </TooltipTarget>
                            ))}
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
}

// ---------------------------------------------------------------------------
// Sub-components extracted to components/combat/PhaseBottom.tsx
// (PhaseStack, StancePhase, ActionPhase, CrucibleStrip, SkillPhase,
// SkillRow, ResolvePanel + their style sheets).
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
    loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
    loadingText: {
        fontFamily: FONTS.mono,
        fontSize: 12,
        letterSpacing: 2,
        color: AXM.bone,
        textTransform: 'uppercase',
    },
    // Phase 72 — three-column EnemyPanel layout matching the design's
    // PtCombatBody EnemyPanel (`screens-canonical.jsx:213-243`).
    // Portrait left (60×72 framed), info middle (flex), stance indicator
    // right. Pre-Phase-72 layout was an off-bleed right-aligned SVG with
    // info absolute-positioned left — surface still rendered as the
    // overlapped collage the user flagged for cleanup.
    enemyPanel: {
        position: 'relative',
        padding: 10,
        paddingHorizontal: 16,
        backgroundColor: AXM.panelBg,
        overflow: 'hidden',
    },
    enemyRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    enemyPortrait: {
        width: 60,
        height: 72,
        backgroundColor: AXM.deepBg,
        borderWidth: 1,
        borderColor: AXM.ash,
        alignItems: 'center',
        justifyContent: 'center',
        // Subtle hatch via thin internal stripe — react-native doesn't
        // ship the `axm-hatch` CSS class the design uses, but the
        // bordered+deepBg backdrop carries the visual contract.
    },
    enemyInfo: { flex: 1, minWidth: 0 },
    enemyEyebrow: {
        fontFamily: FONTS.sans,
        fontSize: 9,
        letterSpacing: 1.8,
        color: AXM.bone,
    },
    enemyTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 2,
    },
    roundText: { fontFamily: FONTS.mono, fontSize: 9, color: AXM.bone },
    enemyName: {
        fontFamily: FONTS.gothic,
        fontSize: 20,
        lineHeight: 22,
        color: AXM.parchment,
        marginTop: 2,
    },
    enemyFlavor: {
        fontFamily: FONTS.serifItalic,
        fontSize: 10,
        color: AXM.bone,
        marginTop: 2,
    },
    enemyMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 5,
    },
    effectsRow: {
        flexDirection: 'row',
        gap: 4,
        marginTop: 5,
        flexWrap: 'wrap',
    },
    enemyStanceCol: {
        alignItems: 'center',
        gap: 4,
        paddingTop: 2,
    },
    enemyStanceLabel: {
        fontFamily: FONTS.sans,
        fontSize: 9,
        letterSpacing: 1.6,
        color: AXM.bone,
    },
    logWrap: { padding: 6, paddingHorizontal: 10, paddingBottom: 0 },
    logBox: { backgroundColor: AXM.deepBg, borderWidth: 1, borderColor: AXM.ash, borderStyle: 'dashed', padding: 5, paddingHorizontal: 8, height: 78, overflow: 'hidden' },
    logScroll: { flex: 1, marginTop: 2 },
    logLine: { fontFamily: FONTS.serif, fontSize: 11, lineHeight: 14, marginTop: 1 },
    // Phase 73 — design's PlayerHUDLive frame (`prototype.jsx:454`).
    // Sits at the bottom of the seal with a deepBg fill + 1px
    // borderTop, padding 8x16. The stance glyph sits left, content
    // column right.
    playerWrap: { paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1, borderTopColor: AXM.ash, backgroundColor: AXM.deepBg },
    playerInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    playerCol: { flex: 1, flexDirection: 'column', gap: 4 },
    playerMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    playerEffects: { flexDirection: 'row', gap: 3 },
    toast: {
        position: 'absolute', bottom: 32, left: 24, right: 24,
        backgroundColor: AXM.panelBg,
        borderWidth: 1, borderColor: AXM.bone,
        padding: 10, alignItems: 'center',
    },
    toastText: { fontFamily: FONTS.serifItalic, fontSize: 12, color: AXM.parchment },
});

