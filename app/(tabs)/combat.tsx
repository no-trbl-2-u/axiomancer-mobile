/**
 * Combat screen — UI shell.
 *
 * Per Spec 04: this file holds no game logic. Every value it renders
 * is read from `selectCombatViewModel`; every state change it triggers
 * goes through `useGameActions()`. Phase ownership is on the engine
 * (`combat.phase`); the screen only previews the player's current
 * stance via local UI state until the player commits.
 *
 * Q5 carousel: the three pickers (stance / action / skill) sit in a
 * horizontal pager so the player can slide left from "action" to
 * reselect a stance, or slide right to "skills". The pager position
 * stays in sync with the engine phase. Resolving the round swaps the
 * pager out for the resolve panel.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
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
// Screen
// ---------------------------------------------------------------------------

export default function CombatScreen() {
    const router = useRouter();
    const { exitCombat } = useCombatMode();
    const combat = useGameState((s) => s.combat);
    const [selectedStance, setSelectedStance] = useState<StanceKey>('heart');
    const vm = useCombatViewModel({ selectedStance });
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

    const onContinueRound = useCallback(() => {
        if (vm.enemy.hp <= 0 || vm.player.hp <= 0 || vm.friendshipCounter >= vm.friendshipCounterMax) {
            actions.endCombat();
            exitCombat();
            router.replace('/exploration' as never);
            return;
        }
        actions.nextRound();
    }, [actions, exitCombat, router, vm.enemy.hp, vm.player.hp, vm.friendshipCounter, vm.friendshipCounterMax]);

    const onFlee = useCallback(() => {
        setToast(vm.actionPicker.fleeMessage);
    }, [vm.actionPicker.fleeMessage]);

    const onLeaveCombat = useCallback(() => {
        actions.endCombat();
        exitCombat();
        router.replace('/exploration' as never);
    }, [actions, exitCombat, router]);

    if (!vm.isInCombat) {
        // First render before useEffect runs the bootstrap. The pre-
        // Phase-30 placeholder was an empty <View>, which the user
        // observed as "combat encounter is blank" — the visible
        // `loadingMessage` keeps the screen from collapsing to a void.
        return (
            <ScreenBg>
                <View style={styles.loadingWrap} testID="combat-screen-loading">
                    <Text style={styles.loadingText}>{vm.loadingMessage}</Text>
                </View>
            </ScreenBg>
        );
    }

    return (
        <ScreenBg>
            <EnemyPanel vm={vm} />
            <BattleLog log={vm.log} round={vm.round} emptyMessage={vm.logEmptyMessage} />
            <PlayerHud vm={vm} />
            <PhaseBottom
                vm={vm}
                onPickStance={onPickStance}
                onPickAction={onPickAction}
                onPickSkill={onPickSkill}
                onFlee={onFlee}
                onContinue={onContinueRound}
                onLeave={onLeaveCombat}
            />
            {toast !== null && (
                <View style={styles.toast} accessibilityLiveRegion="polite">
                    <Text style={styles.toastText}>{toast}</Text>
                </View>
            )}
        </ScreenBg>
    );
}

// ---------------------------------------------------------------------------
// Enemy panel
// ---------------------------------------------------------------------------

function EnemyPanel({ vm }: { vm: CombatViewModel }) {
    const lastStance: StanceKey = vm.enemy.lastStance ?? 'mind';
    return (
        <View style={styles.enemyPanel}>
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#100d0a' }]} />
            <Splatter color={AXM.blood} size={120} seed={17} style={{ position: 'absolute', top: -10, left: -10, opacity: 0.6 }} />

            <Svg viewBox="0 0 200 200" width={180} height={200} style={styles.enemySvg}>
                <Defs>
                    <RadialGradient id="eg" cx="50%" cy="40%">
                        <Stop offset="0%" stopColor={AXM.blood} stopOpacity={0.4} />
                        <Stop offset="100%" stopColor={AXM.blood} stopOpacity={0} />
                    </RadialGradient>
                </Defs>
                <Ellipse cx={100} cy={100} rx={90} ry={80} fill="url(#eg)" />
                <Path d="M100 30 C 60 30 40 70 50 130 L 30 200 L 170 200 L 150 130 C 160 70 140 30 100 30 Z"
                    fill="#06050a" stroke={AXM.parchment} strokeWidth={1.5} />
                <Path d="M70 70 Q 100 50 130 70 L 130 110 Q 100 130 70 110 Z" fill="#000" />
                <Circle cx={85} cy={90} r={3.5} fill={AXM.blood} />
                <Circle cx={115} cy={90} r={3.5} fill={AXM.blood} />
                <Circle cx={85} cy={90} r={1.2} fill={AXM.sulfur} />
                <Circle cx={115} cy={90} r={1.2} fill={AXM.sulfur} />
                <Path d="M82 110 L 88 112 L 92 109 L 98 113 L 104 109 L 110 113 L 116 110 L 120 113"
                    stroke={AXM.parchment} strokeWidth={1.2} fill="none" />
            </Svg>

            <View style={styles.enemyInfo}>
                <View style={styles.enemyTopRow}>
                    <DifficultyBadge tier={vm.enemy.tier || 'normal'} />
                    <Text style={styles.roundText}>{vm.roundToken}</Text>
                </View>
                <Text style={styles.enemyName}>{vm.enemy.name}</Text>
                {vm.enemy.flavor !== '' && (
                    <Text style={styles.enemyFlavor}>{`"…${vm.enemy.flavor}"`}</Text>
                )}
                <View style={{ marginTop: 8 }}>
                    <StatBar value={vm.enemy.hp} max={vm.enemy.hpMax} color={AXM.blood} label="VITALS" height={10} />
                </View>
                <View style={styles.enemyMetaRow}>
                    <FriendshipMeter value={vm.friendshipCounter} max={vm.friendshipCounterMax} />
                    <MindMark stacks={vm.enemy.mindMarks} />
                </View>
                <View style={styles.effectsRow}>
                    {vm.enemy.effects.map((e, i) => (
                        <EffectChip key={`${e.kind}-${i}`} effect={{ ...e, tint: e.tint ?? undefined, duration: e.duration ?? undefined }} />
                    ))}
                </View>
                <View style={styles.lastStanceRow}>
                    <SectionLabel size={9}>LAST STANCE →</SectionLabel>
                    <View style={[styles.lastStanceBadge, { borderColor: vm.enemy.lastStance === null ? AXM.bone : AXM.sulfur }]}>
                        <StanceGlyph kind={lastStance} size={12} color={AXM.sulfur} />
                        <Text style={styles.lastStanceText}>{lastStance.toUpperCase()}</Text>
                    </View>
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
    return (
        <View style={styles.playerWrap}>
            <View style={styles.playerBar}>
                <View style={styles.playerBarItem}>
                    <StatBar value={vm.player.hp} max={vm.player.hpMax} color={AXM.blood} label="HP" height={8} />
                </View>
                <View style={styles.playerBarItem}>
                    <StatBar value={vm.player.mana} max={vm.player.manaMax || 1} color={AXM.sulfur} label="MP" height={8} />
                </View>
                <View style={styles.playerEffects}>
                    {vm.player.effects.map((e, i) => (
                        <EffectChip key={`${e.kind}-${i}`} effect={{ ...e, tint: e.tint ?? undefined, duration: e.duration ?? undefined }} />
                    ))}
                </View>
            </View>
        </View>
    );
}

// ---------------------------------------------------------------------------
// Phase bottom panel — header + carousel pager
// ---------------------------------------------------------------------------

interface PhaseBottomProps {
    vm: CombatViewModel;
    onPickStance: (s: StanceKey) => void;
    onPickAction: (k: ActionOption['key']) => void;
    onPickSkill: (s: SkillOption) => void;
    onFlee: () => void;
    onContinue: () => void;
    onLeave: () => void;
}

function PhaseBottom({ vm, onPickStance, onPickAction, onPickSkill, onFlee, onContinue, onLeave }: PhaseBottomProps) {
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
    onFlee,
    onContinue,
    onLeave,
}: {
    vm: CombatViewModel;
    onPickStance: (s: StanceKey) => void;
    onPickAction: (k: ActionOption['key']) => void;
    onPickSkill: (s: SkillOption) => void;
    onFlee: () => void;
    onContinue: () => void;
    onLeave: () => void;
}) {
    return (
        <View style={stack_styles.column} testID="combat-phase-stack">
            {vm.phaseStack
                .filter((entry) => entry.visible)
                .map((entry) => (
                    <View
                        key={entry.key}
                        style={[
                            stack_styles.row,
                            entry.state === 'current' && stack_styles.rowCurrent,
                        ]}
                        testID={`phase-stack-row-${entry.key}`}
                    >
                        <View style={stack_styles.rowHeader}>
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
                                <Text style={stack_styles.rowSummary}>{entry.summary}</Text>
                            )}
                            {entry.state === 'current' && (
                                <View style={stack_styles.rowDot} />
                            )}
                        </View>
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
                                        isEnded={vm.phase === 'ended'}
                                        onContinue={onContinue}
                                        onLeave={onLeave}
                                    />
                                )}
                            </View>
                        )}
                    </View>
                ))}
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
    selected: StanceKey;
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
                                <View style={[stance_styles.advBadge, { borderColor: isAdv ? AXM.sulfur : AXM.blood }]}>
                                    <Text style={[stance_styles.advText, { color: isAdv ? AXM.sulfur : AXM.blood }]}>
                                        {isAdv ? 'ADV' : 'DIS'}
                                    </Text>
                                </View>
                            )}
                            <View style={stance_styles.glyphWrap}>
                                <StanceGlyph kind={opt.key} size={48} color={accent} />
                            </View>
                            <Text style={[stance_styles.stanceName, { color: accent }]}>{opt.label}</Text>
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
    return (
        <View>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={skill_styles.scroll}
                accessibilityLabel="Skill options"
            >
                {skills.map((s) => {
                    const borderColor = s.category === 'paradox' ? AXM.sulfur : AXM.parchment;
                    return (
                        <TouchableOpacity
                            key={s.id}
                            onPress={() => onPick(s)}
                            disabled={!s.enabled}
                            style={[skill_styles.cardTouch, !s.enabled && { opacity: 0.45 }]}
                            accessibilityRole="button"
                            accessibilityLabel={`Skill ${s.name}`}
                            accessibilityState={{ disabled: !s.enabled }}
                        >
                            <View style={[skill_styles.card, {
                                borderColor,
                                borderStyle: s.category === 'paradox' ? 'solid' : 'dashed',
                            }]}>
                                <View style={skill_styles.cardTop}>
                                    <View style={[
                                        skill_styles.catBadge,
                                        s.category === 'paradox'
                                            ? { backgroundColor: AXM.sulfur }
                                            : { borderWidth: 1, borderColor: AXM.parchment },
                                    ]}>
                                        <Text style={[
                                            skill_styles.catText,
                                            { color: s.category === 'paradox' ? '#0a0a0a' : AXM.parchment },
                                        ]}>
                                            {s.category.toUpperCase()}
                                        </Text>
                                    </View>
                                    <StanceGlyph kind={s.stance} size={14} color={AXM.bone} />
                                </View>
                                <Text style={skill_styles.skillName}>{s.name}</Text>
                                <Text style={skill_styles.skillDesc}>{s.description}</Text>
                                <View style={skill_styles.costRow}>
                                    <Text style={skill_styles.costLabel}>cost</Text>
                                    <Text style={[
                                        skill_styles.costValue,
                                        { color: s.disabledReason === 'insufficient-mana' ? AXM.blood : AXM.sulfur },
                                    ]}>
                                        {s.manaCost} MP
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
            <Text style={skill_styles.availHint}>
                {availableCount} of {totalCount} open · stance bound.
            </Text>
        </View>
    );
}

// ---------------------------------------------------------------------------
// Resolve phase
// ---------------------------------------------------------------------------

function ResolvePanel({
    resolve,
    canContinue,
    isEnded,
    onContinue,
    onLeave,
}: {
    resolve: ResolveSlice;
    canContinue: boolean;
    isEnded: boolean;
    onContinue: () => void;
    onLeave: () => void;
}) {
    const advColor =
        resolve.advantageKind === 'adv' ? AXM.sulfur
            : resolve.advantageKind === 'dis' ? AXM.blood
                : AXM.parchment;
    const isFriend = resolve.outcome === 'friendship';
    const isCrit = resolve.outcome === 'crit';
    const accent = isFriend ? AXM.rust : AXM.blood;

    // Trigger haptics for crit/fumble per Phase 10 spec
    useEffect(() => {
        if (isCrit) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } else if (resolve.outcome === 'miss') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    }, [isCrit, resolve.outcome]);

    return (
        <View>
            <View style={resolve_styles.vs}>
                <View style={resolve_styles.vsPlayer}>
                    <SectionLabel size={8}>YOU</SectionLabel>
                    <StanceGlyph kind={resolve.playerStance} size={36} color={advColor} />
                </View>
                <View style={resolve_styles.vsCenter}>
                    <Text style={[resolve_styles.advLabel, { color: advColor }]}>{resolve.advantageLabel}</Text>
                    <View style={resolve_styles.rollRow}>
                        <Text style={resolve_styles.rollText}>
                            YOU <Text style={resolve_styles.rollVal}>{resolve.playerRoll}</Text>
                        </Text>
                        <Text style={resolve_styles.vsText}>vs</Text>
                        <Text style={resolve_styles.rollText}>
                            FOE <Text style={resolve_styles.rollVal}>{resolve.enemyRoll}</Text>
                        </Text>
                    </View>
                </View>
                <View style={resolve_styles.vsFoe}>
                    <SectionLabel size={8}>FOE</SectionLabel>
                    <StanceGlyph kind={resolve.enemyStance} size={36} color={AXM.bone} />
                </View>
            </View>

            <View style={[
                resolve_styles.outcome,
                {
                    borderColor: accent,
                    backgroundColor: isFriend ? '#1a0d05' : '#1a0a0a',
                },
            ]}>
                <Splatter color={accent} size={180} seed={5} style={{ position: 'absolute', top: -30, right: -30, opacity: 0.5 }} />
                <SectionLabel size={9} style={{ position: 'relative' }}>
                    {resolve.header}
                </SectionLabel>
                <Text style={[
                    resolve_styles.damage,
                    isFriend ? { fontSize: 36 } : {},
                    {
                        textShadowColor: accent,
                        textShadowOffset: { width: 3, height: 3 },
                        textShadowRadius: 0,
                    },
                ]}>
                    {resolve.primaryText}
                </Text>
                <Text style={resolve_styles.outcomeText}>
                    {resolve.message}
                </Text>
                {isCrit && (
                    <Text style={[resolve_styles.outcomeText, { color: AXM.sulfur }]}>CRIT — DOUBLE</Text>
                )}
            </View>

            <TouchableOpacity
                onPress={canContinue ? onContinue : onLeave}
                style={resolve_styles.nextBtn}
                accessibilityRole="button"
                accessibilityLabel={canContinue ? 'Continue to next round' : 'Leave combat'}
            >
                <Text style={resolve_styles.nextText}>
                    {isEnded ? '✠ DEPART' : '✠ NEXT ROUND'}
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
    enemyPanel: { position: 'relative', padding: 6, paddingHorizontal: 10, height: 200, overflow: 'hidden' },
    enemySvg: { position: 'absolute', right: -10, bottom: -8, opacity: 0.95 },
    enemyInfo: { position: 'absolute', top: 10, left: 12, right: 110 },
    enemyTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
    roundText: { fontFamily: FONTS.mono, fontSize: 9, color: AXM.bone },
    enemyName: { fontFamily: FONTS.gothic, fontSize: 22, lineHeight: 24, color: AXM.parchment, marginTop: 4, textShadowColor: AXM.blood, textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 0 },
    enemyFlavor: { fontFamily: FONTS.serifItalic, fontSize: 10, color: AXM.bone, marginTop: 2 },
    enemyMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 },
    effectsRow: { flexDirection: 'row', gap: 4, marginTop: 6, flexWrap: 'wrap' },
    lastStanceRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
    lastStanceBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 1, paddingHorizontal: 4, backgroundColor: '#000', borderWidth: 1 },
    lastStanceText: { fontFamily: FONTS.sans, fontSize: 10, color: AXM.sulfur, letterSpacing: 1.5 },
    logWrap: { padding: 6, paddingHorizontal: 10, paddingBottom: 0 },
    logBox: { backgroundColor: '#06050a', borderWidth: 1, borderColor: AXM.ash, borderStyle: 'dashed', padding: 5, paddingHorizontal: 8, height: 78, overflow: 'hidden' },
    logScroll: { flex: 1, marginTop: 2 },
    logLine: { fontFamily: FONTS.serif, fontSize: 11, lineHeight: 14, marginTop: 1 },
    playerWrap: { padding: 4, paddingHorizontal: 10, paddingBottom: 0 },
    playerBar: { backgroundColor: '#100d0a', padding: 5, paddingHorizontal: 8, borderWidth: 1, borderColor: AXM.ash, flexDirection: 'row', gap: 8, alignItems: 'center' },
    playerBarItem: { flex: 1 },
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
        backgroundColor: '#100d0a',
        borderWidth: 1, borderColor: AXM.bone,
        padding: 10, alignItems: 'center',
    },
    toastText: { fontFamily: FONTS.serifItalic, fontSize: 12, color: AXM.parchment },
});

const stack_styles = StyleSheet.create({
    column: { flexDirection: 'column', gap: 8 },
    row: { padding: 8, paddingHorizontal: 12 },
    rowCurrent: {
        backgroundColor: '#100d0a',
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
    scroll: { gap: 6, paddingVertical: 2 },
    cardTouch: { width: 130 },
    card: { backgroundColor: '#0a0a0a', borderWidth: 2, padding: 7, minHeight: 138 },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    catBadge: { paddingVertical: 1, paddingHorizontal: 4 },
    catText: { fontFamily: FONTS.sans, fontSize: 8, letterSpacing: 1.5 },
    skillName: { fontFamily: FONTS.gothic, fontSize: 14, lineHeight: 16, color: AXM.parchment, marginTop: 6 },
    skillDesc: { fontFamily: FONTS.serif, fontSize: 10, color: AXM.bone, marginTop: 4, flex: 1, lineHeight: 13 },
    costRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, paddingTop: 4, borderTopWidth: 1, borderTopColor: AXM.ash },
    costLabel: { fontFamily: FONTS.mono, fontSize: 9, color: AXM.bone },
    costValue: { fontFamily: FONTS.gothic, fontSize: 16 },
    availHint: { textAlign: 'center', marginTop: 6, fontFamily: FONTS.mono, fontSize: 9, color: AXM.bone, letterSpacing: 1 },
});

const resolve_styles = StyleSheet.create({
    vs: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: AXM.ash, padding: 6, paddingHorizontal: 8 },
    vsPlayer: { alignItems: 'center' },
    vsFoe: { alignItems: 'center' },
    vsCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 6 },
    advLabel: { fontFamily: FONTS.gothic, fontSize: 22, letterSpacing: 2 },
    rollRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 1 },
    rollText: { fontFamily: FONTS.mono, fontSize: 10, color: AXM.bone, letterSpacing: 1 },
    rollVal: { fontFamily: FONTS.gothic, fontSize: 14, color: AXM.parchment },
    vsText: { fontFamily: FONTS.mono, fontSize: 10, color: AXM.ash },
    outcome: { position: 'relative', marginTop: 6, padding: 14, paddingHorizontal: 12, paddingBottom: 12, borderWidth: 2, overflow: 'hidden', alignItems: 'center' },
    damage: { fontFamily: FONTS.gothic, fontSize: 64, lineHeight: 68, color: AXM.parchment, position: 'relative' },
    outcomeText: { fontFamily: FONTS.mono, fontSize: 10, color: AXM.parchment, letterSpacing: 1, position: 'relative', textAlign: 'center' },
    nextBtn: { width: '100%', marginTop: 8, padding: 10, paddingHorizontal: 12, backgroundColor: '#0a0a0a', borderWidth: 2, borderColor: AXM.parchment, alignItems: 'center' },
    nextText: { fontFamily: FONTS.gothic, fontSize: 16, letterSpacing: 2, color: AXM.parchment },
});
