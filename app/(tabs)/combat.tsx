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

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
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
    type ResolveSlice,
    type SkillOption,
    type StanceKey,
    type StanceOption,
} from '@/state/presenters/combat.engine';
import { selectCodexStatusLine } from '@/state/presenters/combat.codex.engine';
import { toRomanLower } from '@/state/presenters/roman';
import { CodexStatusStrip } from '@/components/CodexStatusStrip';
import { ScreenBg } from '@/components/ScreenBg';
import { SectionLabel } from '@/components/SectionLabel';
import { StatBar } from '@/components/StatBar';
import { StanceGlyph } from '@/components/StanceGlyph';
import { EffectChip } from '@/components/EffectChip';
import { FriendshipMeter } from '@/components/FriendshipMeter';
import { MindMark } from '@/components/MindMark';
import { DifficultyBadge } from '@/components/DifficultyBadge';
import { ActionIcon } from '@/components/ActionIcon';
import { Splatter } from '@/components/Splatter';
import { useTooltip } from '@/hooks/useTooltip';
import type { TooltipKind } from '@/state/presenters/tooltip.engine';

// ---------------------------------------------------------------------------
// Local UI state (Q2: stance preview lives here until the user commits)
// ---------------------------------------------------------------------------

const ACCENT_BY_KIND: Record<ActionOption['accentKind'], string> = {
    blood: AXM.blood,
    parchment: AXM.parchment,
    sulfur: AXM.sulfur,
    rust: AXM.rust,
};

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
// Tap-tooltip wrapper (Phase 75) — additive tap target around any
// HUD element that should explain itself on tap. Renders a Pressable
// that holds its own measure ref and forwards `show({ kind, id })`
// on tap. Empty `id` short-circuits — useful for fixture-built
// effects that have no engine id.
// ---------------------------------------------------------------------------
interface TooltipTargetProps {
    kind: TooltipKind;
    id: string;
    children: React.ReactNode;
    accessibilityLabel?: string;
    accessibilityHint?: string;
    testID?: string;
}

function TooltipTarget({
    kind,
    id,
    children,
    accessibilityLabel,
    accessibilityHint,
    testID,
}: TooltipTargetProps) {
    const tooltip = useTooltip();
    const ref = useRef<View | null>(null);
    return (
        <Pressable
            ref={ref}
            onPress={() => {
                if (!id) return;
                tooltip.show({ kind, id, anchorRef: ref });
            }}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            accessibilityHint={accessibilityHint}
            testID={testID}
        >
            {children}
        </Pressable>
    );
}

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
            // Phase 70 Tick B — same snapshot pattern as victory; the
            // CombatFriendshipPanel reads the snapshot from
            // combat-mode after actions.endCombat() clears the slice.
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
                      // Engine doesn't yet expose per-foe codex
                      // entries; the panel collapses the journal
                      // section when this is null.
                      journalEntry: null,
                  }
                : undefined;
            actions.endCombat();
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
// Phase bottom panel — header + vertical PhaseStack
// ---------------------------------------------------------------------------

interface PhaseBottomProps {
    vm: CombatViewModel;
    onPickStance: (s: StanceKey) => void;
    onPickAction: (k: ActionOption['key']) => void;
    onPickSkill: (s: SkillOption) => void;
    onGoBackToPhase: (phase: 'choosing_stance' | 'choosing_action' | 'choosing_skill') => void;
    onFlee: () => void;
    onContinue: () => void;
    onLeave: () => void;
}

function PhaseBottom({ vm, onPickStance, onPickAction, onPickSkill, onGoBackToPhase, onFlee, onContinue, onLeave }: PhaseBottomProps) {
    return (
        <View style={styles.phaseSection} testID={`combat-phase-${vm.phase}`}>
            <View style={styles.phaseHeader}>
                <View style={styles.phaseHeaderLeft}>
                    <View style={styles.phaseIndexBox}>
                        <Text style={styles.phaseIndex}>{Math.max(1, vm.phaseIndex + 1)}</Text>
                    </View>
                    <SectionLabel size={11} style={{ color: AXM.parchment }}>{vm.phaseHeader}</SectionLabel>
                </View>
                <View style={styles.phasePips}>
                    {vm.phaseOrder.map((_, i) => (
                        <View key={i} style={[styles.pip, vm.phaseIndex >= i ? styles.pipActive : styles.pipInactive]} />
                    ))}
                </View>
            </View>

            <PhaseStack
                vm={vm}
                onPickStance={onPickStance}
                onPickAction={onPickAction}
                onPickSkill={onPickSkill}
                onGoBackToPhase={onGoBackToPhase}
                onFlee={onFlee}
                onContinue={onContinue}
                onLeave={onLeave}
            />
        </View>
    );
}

// ---------------------------------------------------------------------------
// Phase stack — vertical list of phase rows
//
// Phase 32 design-handoff port (2026-05-16) per prototype.jsx:238-281.
// Replaces the horizontal swipe carousel with a vertical stack:
//   - past rows collapse to a single line with a right-aligned
//     summary value (e.g. 'BODY', 'STRIKE');
//   - the current row expands into a panel with the active picker
//     inline and a sulfur dot indicator;
//   - future rows render label-only in ash.
// The skill row hides itself when the picked action isn't 'skill'
// (the presenter signals this via `entry.visible`).
// ---------------------------------------------------------------------------

function PhaseStack({
    vm,
    onPickStance,
    onPickAction,
    onPickSkill,
    onGoBackToPhase,
    onFlee,
    onContinue,
    onLeave,
}: {
    vm: CombatViewModel;
    onPickStance: (s: StanceKey) => void;
    onPickAction: (k: ActionOption['key']) => void;
    onPickSkill: (s: SkillOption) => void;
    onGoBackToPhase: (phase: 'choosing_stance' | 'choosing_action' | 'choosing_skill') => void;
    onFlee: () => void;
    onContinue: () => void;
    onLeave: () => void;
}) {
    return (
        <View style={stack_styles.column} testID="combat-phase-stack">
            {vm.phaseStack
                .filter((entry) => entry.visible)
                .map((entry) => {
                    // Phase 73 (user-direct 2026-05-23) — past rows for
                    // pre-resolve phases are tappable. Tapping rewinds
                    // the engine phase so the player can re-pick. The
                    // resolving row stays passive: the player commits
                    // via LET IT FALL, so there's no "past resolving"
                    // to undo without unrolling the engine.
                    const reversiblePast =
                        entry.state === 'past'
                        && (entry.key === 'choosing_stance'
                            || entry.key === 'choosing_action'
                            || entry.key === 'choosing_skill');
                    const HeaderContainer: React.ComponentType<{ children: React.ReactNode }> = reversiblePast
                        ? ({ children }) => (
                            <TouchableOpacity
                                onPress={() => onGoBackToPhase(entry.key as 'choosing_stance' | 'choosing_action' | 'choosing_skill')}
                                style={stack_styles.rowHeader}
                                accessibilityRole="button"
                                accessibilityLabel={`Change ${entry.label}`}
                                testID={`phase-stack-undo-${entry.key}`}
                            >
                                {children}
                            </TouchableOpacity>
                        )
                        : ({ children }) => <View style={stack_styles.rowHeader}>{children}</View>;
                    return (
                    <View
                        key={entry.key}
                        style={[
                            stack_styles.row,
                            entry.state === 'current' && stack_styles.rowCurrent,
                        ]}
                        testID={`phase-stack-row-${entry.key}`}
                    >
                        <HeaderContainer>
                            <Text
                                style={[
                                    stack_styles.rowLabel,
                                    entry.state === 'past' && { color: AXM.bone },
                                    entry.state === 'future' && { color: AXM.ash },
                                ]}
                            >
                                {entry.label}
                            </Text>
                            <View style={stack_styles.rowRule} />
                            {entry.state === 'past' && entry.summary.length > 0 && (
                                <Text style={[stack_styles.rowSummary, reversiblePast && stack_styles.rowSummaryUndo]}>
                                    {entry.summary}
                                </Text>
                            )}
                            {entry.state === 'current' && (
                                <View style={stack_styles.rowDot} />
                            )}
                        </HeaderContainer>
                        {entry.state === 'current' && (
                            <View style={stack_styles.rowBody}>
                                {entry.key === 'choosing_stance' && (
                                    <StancePhase
                                        options={vm.stancePicker.options}
                                        selected={vm.stancePicker.selected}
                                        onPick={onPickStance}
                                        a11yLabels={vm.a11y}
                                    />
                                )}
                                {entry.key === 'choosing_action' && (
                                    <ActionPhase
                                        options={vm.actionPicker.options}
                                        fleeAvailable={vm.actionPicker.fleeAvailable}
                                        fleeHint={vm.actionPicker.fleeHint}
                                        onPick={onPickAction}
                                        onFlee={onFlee}
                                    />
                                )}
                                {entry.key === 'choosing_skill' && (
                                    <SkillPhase
                                        skills={vm.skillPicker.skills}
                                        availableCount={vm.skillPicker.availableCount}
                                        totalCount={vm.skillPicker.totalCount}
                                        onPick={onPickSkill}
                                    />
                                )}
                                {(entry.key === 'resolving') && (
                                    <ResolvePanel
                                        resolve={vm.resolve}
                                        canContinue={vm.phase !== 'ended'}
                                        onContinue={onContinue}
                                        onLeave={onLeave}
                                    />
                                )}
                            </View>
                        )}
                    </View>
                    );
                })}
        </View>
    );
}

// ---------------------------------------------------------------------------
// Stance phase
// ---------------------------------------------------------------------------

function StancePhase({
    options,
    selected,
    onPick,
    a11yLabels,
}: {
    options: readonly StanceOption[];
    /** `null` = no card highlighted (no default stance). Phase 65 Tick B. */
    selected: StanceKey | null;
    onPick: (s: StanceKey) => void;
    a11yLabels: { stanceHeart: string; stanceBody: string; stanceMind: string };
}) {
    return (
        <View style={stance_styles.row}>
            {options.map((opt) => {
                const isAdv = opt.advantage === 'adv';
                const isDis = opt.advantage === 'dis';
                const isSel = selected === opt.key;
                const accent = isAdv ? AXM.sulfur : isDis ? AXM.blood : AXM.parchment;
                return (
                    <TouchableOpacity
                        key={opt.key}
                        onPress={() => onPick(opt.key)}
                        style={stance_styles.cardTouch}
                        accessibilityRole="button"
                        accessibilityLabel={
                            opt.key === 'heart' ? a11yLabels.stanceHeart :
                            opt.key === 'body' ? a11yLabels.stanceBody :
                            a11yLabels.stanceMind
                        }
                        accessibilityState={{ selected: isSel }}
                    >
                        <View style={[stance_styles.card, { borderColor: isSel ? AXM.sulfur : accent, backgroundColor: isSel ? '#1a1410' : '#0a0a0a' }]}>
                            {(isAdv || isDis) && (
                                <TooltipTarget
                                    kind="stance-chip"
                                    id={isAdv ? 'adv' : 'dis'}
                                    accessibilityLabel={isAdv ? 'Advantage' : 'Disadvantage'}
                                    accessibilityHint="tap to explain"
                                    testID={`combat-stance-${opt.key}-advdis`}
                                >
                                    <View style={[stance_styles.advBadge, { borderColor: isAdv ? AXM.sulfur : AXM.blood }]}>
                                        <Text style={[stance_styles.advText, { color: isAdv ? AXM.sulfur : AXM.blood }]}>
                                            {isAdv ? 'ADV' : 'DIS'}
                                        </Text>
                                    </View>
                                </TooltipTarget>
                            )}
                            {/* Phase-62 bug-sweep 2026-05-21: pointerEvents='none'
                                so the SVG can't consume taps that should reach
                                the surrounding TouchableOpacity. The Heart glyph
                                renders via SvgXml which can intercept touches
                                inside the SVG bounding box on some platforms. */}
                            <View style={stance_styles.glyphWrap} pointerEvents="none">
                                <StanceGlyph kind={opt.key} size={48} color={accent} />
                            </View>
                            <Text style={[stance_styles.stanceName, { color: accent }]}>{opt.label}</Text>
                            <Text style={stance_styles.stanceGloss}>{opt.gloss}</Text>
                            <Text style={stance_styles.stanceMeta}>BEATS {opt.counters} · WEAK {opt.weakTo}</Text>
                            <View style={stance_styles.divider} />
                            <View style={stance_styles.statRow}>
                                <Text style={stance_styles.statKey}>ATTACK</Text>
                                <Text style={[stance_styles.statVal, { color: accent }]}>{opt.derived.attack}</Text>
                            </View>
                            <View style={stance_styles.statRow}>
                                <Text style={stance_styles.statKey}>SKILL</Text>
                                <Text style={[stance_styles.statVal, { color: accent }]}>{opt.derived.skill}</Text>
                            </View>
                            <View style={stance_styles.statRow}>
                                <Text style={stance_styles.statKey}>DEFENSE</Text>
                                <Text style={[stance_styles.statVal, { color: accent }]}>{opt.derived.defense}</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

// ---------------------------------------------------------------------------
// Action phase
// ---------------------------------------------------------------------------

function ActionPhase({
    options,
    fleeAvailable,
    fleeHint,
    onPick,
    onFlee,
}: {
    options: readonly ActionOption[];
    fleeAvailable: boolean;
    fleeHint: string;
    onPick: (k: ActionOption['key']) => void;
    onFlee: () => void;
}) {
    return (
        <View>
            <CrucibleStrip />
            <View style={action_styles.grid}>
                {options.map((opt) => {
                    const accent = ACCENT_BY_KIND[opt.accentKind];
                    return (
                        <TouchableOpacity
                            key={opt.key}
                            onPress={() => onPick(opt.key)}
                            disabled={!opt.enabled}
                            style={[action_styles.cardTouch, !opt.enabled && { opacity: 0.45 }]}
                            accessibilityRole="button"
                            accessibilityLabel={`Action ${opt.label}`}
                            accessibilityState={{ disabled: !opt.enabled }}
                        >
                            <View style={[action_styles.card, { borderColor: accent }]}>
                                <ActionIcon kind={opt.iconKind} size={32} color={accent} />
                                <View style={action_styles.textCol}>
                                    <Text style={action_styles.label}>{opt.label}</Text>
                                    <Text style={action_styles.hint}>{opt.hint}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>
            {fleeAvailable && (
                <TouchableOpacity
                    onPress={onFlee}
                    style={action_styles.fleeRow}
                    accessibilityRole="button"
                    accessibilityLabel="Flee combat"
                >
                    <Text style={action_styles.flee}>{fleeHint}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

/**
 * Token Crucible inline strip — Phase 49 port from
 * `design/handoff-2026-05-16/project/prototype.jsx:303-322`. Compact
 * horizontal row showing the player's current 5-token pool above
 * the action picker so the player can see their resources before
 * committing an action.
 *
 * Phase 73 (user-direct 2026-05-23) — strip is read-only inside
 * combat. The pre-Phase-73 `OPEN ▸` button routed to a standalone
 * Token Crucible screen; that screen has been removed (it was a
 * design-reference sheet, not a player surface).
 *
 * Token counts currently sourced from a local mock — engine doesn't
 * yet expose `player.tokens`. Wiring real engine state is a follow-
 * up once the engine ships the surface.
 */
function CrucibleStrip() {
    const pool: readonly { key: string; glyph: string; count: number; color: string }[] = [
        { key: 'body', glyph: '◐', count: 2, color: AXM.blood },
        { key: 'mind', glyph: '◒', count: 1, color: AXM.rust },
        { key: 'heart', glyph: '◑', count: 2, color: AXM.bone },
        { key: 'fallacy', glyph: '◓', count: 1, color: AXM.parchment },
        { key: 'paradox', glyph: '◉', count: 1, color: AXM.sulfur },
    ];
    return (
        <View style={crucible_strip_styles.row} testID="combat-crucible-strip">
            <Text style={crucible_strip_styles.eyebrow}>CRUCIBLE</Text>
            <View style={crucible_strip_styles.tokens}>
                {pool.map((t) => (
                    <View key={t.key} style={crucible_strip_styles.tokenCol}>
                        <Text style={[crucible_strip_styles.tokenGlyph, { color: t.count > 0 ? t.color : AXM.ash }]}>
                            {t.glyph}
                        </Text>
                        <Text style={[crucible_strip_styles.tokenCount, { color: t.count > 0 ? AXM.parchment : AXM.bone }]}>
                            {t.count}
                        </Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

const crucible_strip_styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 6,
        paddingHorizontal: 8,
        borderWidth: 1,
        borderColor: AXM.ash,
        backgroundColor: AXM.deepBg,
        marginBottom: 8,
    },
    eyebrow: {
        fontFamily: FONTS.sans,
        fontSize: 9,
        color: AXM.bone,
        letterSpacing: 2,
    },
    tokens: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 4,
    },
    tokenCol: {
        flexDirection: 'column',
        alignItems: 'center',
    },
    tokenGlyph: {
        fontFamily: FONTS.gothic,
        fontSize: 14,
    },
    tokenCount: {
        fontFamily: FONTS.mono,
        fontSize: 9,
    },
    openBtn: {
        paddingHorizontal: 4,
    },
    openBtnText: {
        fontFamily: FONTS.sans,
        fontSize: 10,
        color: AXM.bone,
        letterSpacing: 1.2,
    },
});

// ---------------------------------------------------------------------------
// Skill phase
// ---------------------------------------------------------------------------

function SkillPhase({
    skills,
    availableCount,
    totalCount,
    onPick,
}: {
    skills: readonly SkillOption[];
    availableCount: number;
    totalCount: number;
    onPick: (s: SkillOption) => void;
}) {
    // Phase 73 — port the design's SkillPickerLive shape
    // (`prototype.jsx:391-419`). Vertical list of single-row buttons
    // (no horizontal card scroll, no category badge, single ash
    // border). Row layout: stance glyph (24px) | name + description
    // stacked | cost stacked. User-direct 2026-05-23: only show
    // skills that are currently castable — disabled rows (wrong
    // stance or insufficient resources) are filtered out entirely so
    // the picker shows what the player can actually pick this round.
    const available = skills.filter((s) => s.enabled);
    return (
        <View style={skill_styles.list}>
            {available.map((s) => (
                <SkillRow key={s.id} skill={s} onPick={onPick} />
            ))}
            {available.length === 0 && (
                <Text style={skill_styles.emptyHint}>none open · stance bound.</Text>
            )}
            <Text style={skill_styles.availHint}>
                {availableCount} of {totalCount} open · stance bound.
            </Text>
        </View>
    );
}

function SkillRow({ skill: s, onPick }: { skill: SkillOption; onPick: (s: SkillOption) => void }) {
    // Phase 75 — single-tap commits the skill (locked Phase 73
    // behaviour); long-press fires the tap-tooltip with the full
    // engine description. Long-press is the natural mobile pattern
    // when tap is already reserved for an action.
    const tooltip = useTooltip();
    const ref = useRef<View | null>(null);
    return (
        <View ref={ref}>
            <TouchableOpacity
                onPress={() => onPick(s)}
                onLongPress={() => tooltip.show({ kind: 'skill', id: s.id, anchorRef: ref })}
                style={skill_styles.row}
                accessibilityRole="button"
                accessibilityLabel={`Skill ${s.name}`}
                accessibilityHint="hold to read full description"
                testID={`combat-skill-row-${s.id}`}
            >
                <StanceGlyph kind={s.stance} size={24} color={AXM.parchment} />
                <View style={skill_styles.rowText}>
                    <Text style={skill_styles.skillName} numberOfLines={1}>{s.name}</Text>
                    <Text style={skill_styles.skillDesc} numberOfLines={2}>
                        {s.description}
                    </Text>
                </View>
                <View style={skill_styles.rowCostCol}>
                    <Text style={skill_styles.costValue}>
                        {toRomanLower(s.manaCost, '·')}
                    </Text>
                </View>
            </TouchableOpacity>
        </View>
    );
}

// ---------------------------------------------------------------------------
// Resolve phase
// ---------------------------------------------------------------------------

function ResolvePanel({
    resolve,
    canContinue,
    onContinue,
    onLeave,
}: {
    resolve: ResolveSlice;
    canContinue: boolean;
    onContinue: () => void;
    onLeave: () => void;
}) {
    const advColor =
        resolve.advantageKind === 'adv' ? AXM.sulfur
            : resolve.advantageKind === 'dis' ? AXM.blood
                : AXM.parchment;
    const isFriend = resolve.outcome === 'friendship';
    const isCrit = resolve.outcome === 'crit';

    // Trigger haptics for crit/fumble per Phase 10 spec
    useEffect(() => {
        if (isCrit) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } else if (resolve.outcome === 'miss') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    }, [isCrit, resolve.outcome]);

    // Phase 73 (user-direct 2026-05-23) — port the design's
    // ResolvePaneLive layout (`prototype.jsx:421-450`). Three-column
    // grid: YOU | VS | ENEMY, each centered, with a tiny eyebrow
    // caption, a big sulfur/parchment Roman roll, and an italic
    // action verb beneath. Single sulfur-bordered LET IT FALL button
    // commits the round.
    return (
        <View style={resolve_styles.wrap}>
            <View style={resolve_styles.vsGrid}>
                <View style={resolve_styles.vsCol}>
                    <Text style={resolve_styles.vsEyebrow}>YOU</Text>
                    <Text style={[resolve_styles.vsRoll, { color: advColor }]}>
                        {resolve.playerRoll}
                    </Text>
                    <Text style={resolve_styles.vsVerb}>{resolve.header.toLowerCase()}</Text>
                </View>
                <View style={resolve_styles.vsDivider}>
                    <Text style={resolve_styles.vsDividerRule}>━━</Text>
                    <Text style={resolve_styles.vsLabel}>VS</Text>
                    <Text style={resolve_styles.vsDividerRule}>━━</Text>
                </View>
                <View style={resolve_styles.vsCol}>
                    <Text style={resolve_styles.vsEyebrow}>FOE</Text>
                    <Text style={resolve_styles.vsRoll}>{resolve.enemyRoll}</Text>
                    <Text style={resolve_styles.vsVerb}>{resolve.message.toLowerCase()}</Text>
                </View>
            </View>
            {isCrit && (
                <Text style={resolve_styles.critFlag}>CRIT — DOUBLE</Text>
            )}
            <TouchableOpacity
                onPress={canContinue ? onContinue : onLeave}
                style={[resolve_styles.letBtn, { borderColor: isFriend ? AXM.rust : AXM.sulfur }]}
                accessibilityRole="button"
                accessibilityLabel={canContinue ? 'Continue to next round' : 'Leave combat'}
            >
                <Text style={[resolve_styles.letText, { color: isFriend ? AXM.rust : AXM.sulfur }]}>
                    {resolve.nextActionLabel}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

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
    logBox: { backgroundColor: '#06050a', borderWidth: 1, borderColor: AXM.ash, borderStyle: 'dashed', padding: 5, paddingHorizontal: 8, height: 78, overflow: 'hidden' },
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
    phaseSection: { padding: 8, paddingHorizontal: 10, paddingBottom: 14 },
    phaseHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
    phaseHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    phaseIndexBox: { width: 18, height: 18, backgroundColor: AXM.sulfur, alignItems: 'center', justifyContent: 'center' },
    phaseIndex: { fontFamily: FONTS.gothic, fontSize: 14, color: '#0a0a0a' },
    phasePips: { flexDirection: 'row', gap: 3 },
    pip: { width: 14, height: 4 },
    pipActive: { backgroundColor: AXM.sulfur },
    pipInactive: { backgroundColor: AXM.ash },
    toast: {
        position: 'absolute', bottom: 32, left: 24, right: 24,
        backgroundColor: AXM.panelBg,
        borderWidth: 1, borderColor: AXM.bone,
        padding: 10, alignItems: 'center',
    },
    toastText: { fontFamily: FONTS.serifItalic, fontSize: 12, color: AXM.parchment },
});

const stack_styles = StyleSheet.create({
    column: { flexDirection: 'column', gap: 8 },
    row: { padding: 8, paddingHorizontal: 12 },
    rowCurrent: {
        backgroundColor: AXM.panelBg,
        borderWidth: 1,
        borderColor: 'rgba(232, 223, 200, 0.12)',
        padding: 12,
        paddingTop: 12,
        paddingBottom: 14,
    },
    rowHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    rowLabel: {
        fontFamily: FONTS.sans,
        fontSize: 10,
        letterSpacing: 2.2,
        color: AXM.parchment,
    },
    rowRule: { flex: 1, height: 1, backgroundColor: 'rgba(232, 223, 200, 0.12)' },
    rowSummary: {
        fontFamily: FONTS.sans,
        fontSize: 9,
        letterSpacing: 1.4,
        color: AXM.bone,
    },
    // Phase 73 — past rows the player can re-pick (stance / action /
    // skill) underline the summary in sulfur so the tap target reads
    // as an "undo" affordance, not a flat past-record. The
    // TouchableOpacity wraps the entire rowHeader.
    rowSummaryUndo: { color: AXM.sulfur, borderBottomWidth: 1, borderBottomColor: AXM.sulfur, paddingBottom: 1 },
    rowDot: { width: 5, height: 5, backgroundColor: AXM.sulfur },
    rowBody: { marginTop: 10 },
});

const stance_styles = StyleSheet.create({
    row: { flexDirection: 'row', gap: 6 },
    cardTouch: { flex: 1 },
    card: { borderWidth: 2, padding: 8, paddingHorizontal: 6, minHeight: 178 },
    advBadge: { position: 'absolute', top: 4, right: 4, borderWidth: 1, paddingHorizontal: 3, paddingVertical: 1, backgroundColor: '#0a0a0a', zIndex: 1 },
    advText: { fontFamily: FONTS.sans, fontSize: 8, letterSpacing: 1 },
    glyphWrap: { alignItems: 'center', marginTop: 4, marginBottom: 2 },
    stanceName: { textAlign: 'center', fontFamily: FONTS.gothic, fontSize: 17, letterSpacing: 1 },
    // Phase 47 port — two-word lowercase gloss under each stance
    // label (prototype.jsx:285-287). Italic serif, bone-color, tight
    // spacing to read as a fly-by lore line above the BEATS / WEAK
    // metadata row.
    stanceGloss: { textAlign: 'center', fontFamily: FONTS.serifItalic, fontSize: 9, color: AXM.bone, marginTop: 1, marginBottom: 2 },
    stanceMeta: { textAlign: 'center', fontFamily: FONTS.mono, fontSize: 7, color: AXM.bone, letterSpacing: 0.5, marginBottom: 4 },
    divider: { borderTopWidth: 1, borderTopColor: AXM.ash, marginBottom: 3 },
    statRow: { flexDirection: 'row', justifyContent: 'space-between', lineHeight: 14 },
    statKey: { fontFamily: FONTS.mono, fontSize: 9, color: AXM.bone },
    statVal: { fontFamily: FONTS.gothic, fontSize: 12 },
});

const action_styles = StyleSheet.create({
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    cardTouch: { width: '48%' },
    card: { backgroundColor: '#0a0a0a', borderWidth: 2, padding: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 64 },
    textCol: { flex: 1 },
    label: { fontFamily: FONTS.gothic, fontSize: 18, color: AXM.parchment, lineHeight: 20, letterSpacing: 1 },
    hint: { fontFamily: FONTS.mono, fontSize: 8, color: AXM.bone, letterSpacing: 1, marginTop: 2 },
    fleeRow: { alignItems: 'center', marginTop: 8 },
    flee: { fontFamily: FONTS.serifItalic, fontSize: 11, color: AXM.bone, borderBottomWidth: 1, borderBottomColor: AXM.bone, paddingBottom: 1 },
});

const skill_styles = StyleSheet.create({
    // Phase 73 — vertical row list, gap 6 (matches the design's
    // `flexDirection: 'column', gap: 6` on the picker root).
    list: { flexDirection: 'column', gap: 6 },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: AXM.ash,
        backgroundColor: 'transparent',
    },
    rowDim: { opacity: 0.6 },
    rowText: { flex: 1, minWidth: 0 },
    rowCostCol: { alignItems: 'flex-end', minWidth: 48 },
    skillName: { fontFamily: FONTS.serif, fontSize: 14, color: AXM.parchment },
    skillDesc: { fontFamily: FONTS.mono, fontSize: 9, color: AXM.bone, marginTop: 2, lineHeight: 12 },
    costValue: { fontFamily: FONTS.mono, fontSize: 14, color: AXM.parchment },
    // Empty state when the picker has no castable skills given the
    // current stance and resource pools. Mirrors the design's
    // empty-list registers — short ritual line, bone color.
    emptyHint: { textAlign: 'center', paddingVertical: 14, fontFamily: FONTS.serifItalic, fontSize: 12, color: AXM.bone },
    availHint: { textAlign: 'center', marginTop: 6, fontFamily: FONTS.mono, fontSize: 9, color: AXM.bone, letterSpacing: 1 },
});

const resolve_styles = StyleSheet.create({
    // Phase 73 — port the design's ResolvePaneLive
    // (`prototype.jsx:421-450`). Vertical stack: 3-col VS grid +
    // optional CRIT flag + LET IT FALL button.
    wrap: { flexDirection: 'column', gap: 10 },
    vsGrid: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 8 },
    vsCol: { flex: 1, alignItems: 'center' },
    vsDivider: { alignItems: 'center', gap: 2 },
    vsDividerRule: { fontFamily: FONTS.mono, fontSize: 11, color: AXM.bone },
    vsLabel: { fontFamily: FONTS.sans, fontSize: 9, color: AXM.sulfur, letterSpacing: 1.4 },
    vsEyebrow: { fontFamily: FONTS.sans, fontSize: 9, color: AXM.bone, letterSpacing: 1.4 },
    vsRoll: { fontFamily: FONTS.mono, fontSize: 26, color: AXM.parchment, marginTop: 2, lineHeight: 28 },
    vsVerb: { fontFamily: FONTS.serifItalic, fontSize: 11, color: AXM.parchment, marginTop: 2 },
    critFlag: { textAlign: 'center', fontFamily: FONTS.sans, fontSize: 10, color: AXM.sulfur, letterSpacing: 2 },
    // Single sulfur-bordered button at the bottom — `LET IT FALL`.
    // No backgroundColor on the button itself so the panel's deepBg
    // shows through.
    letBtn: { paddingVertical: 12, alignItems: 'center', borderWidth: 1, backgroundColor: AXM.bg },
    letText: { fontFamily: FONTS.sans, fontSize: 12, letterSpacing: 2 },
});
