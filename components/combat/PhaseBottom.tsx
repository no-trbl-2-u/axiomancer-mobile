import React, { useEffect, useRef, useMemo } from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import * as Haptics from 'expo-haptics';

import { AXM, FONTS } from '@/theme/axm';
import { useTooltip } from '@/hooks/useTooltip';
import { SectionLabel } from '@/components/SectionLabel';
import { StanceGlyph } from '@/components/StanceGlyph';
import { ActionIcon } from '@/components/ActionIcon';
import { TooltipTarget } from '@/components/tooltip/TooltipTarget';
import { toRomanLower } from '@/state/presenters/roman';
import type {
    ActionOption,
    CombatViewModel,
    ResolveSlice,
    SkillOption,
    StanceKey,
    StanceOption,
} from '@/state/presenters/combat.engine';

const ACCENT_BY_KIND: Record<ActionOption['accentKind'], string> = {
    blood: AXM.blood,
    parchment: AXM.parchment,
    sulfur: AXM.sulfur,
    rust: AXM.rust,
};

export interface PhaseBottomProps {
    vm: CombatViewModel;
    onPickStance: (s: StanceKey) => void;
    onPickAction: (k: ActionOption['key']) => void;
    onPickSkill: (s: SkillOption) => void;
    onGoBackToPhase: (phase: 'choosing_stance' | 'choosing_action' | 'choosing_skill') => void;
    onFlee: () => void;
    onContinue: () => void;
    onLeave: () => void;
}

export function PhaseBottom({ vm, onPickStance, onPickAction, onPickSkill, onGoBackToPhase, onFlee, onContinue, onLeave }: PhaseBottomProps) {
    return (
        <View style={phase_styles.phaseSection} testID={`combat-phase-${vm.phase}`}>
            <View style={phase_styles.phaseHeader}>
                <View style={phase_styles.phaseHeaderLeft}>
                    <View style={phase_styles.phaseIndexBox}>
                        <Text style={phase_styles.phaseIndex}>{Math.max(1, vm.phaseIndex + 1)}</Text>
                    </View>
                    <SectionLabel size={11} style={phase_styles.phaseHeaderLabel}>{vm.phaseHeader}</SectionLabel>
                </View>
                <View style={phase_styles.phasePips}>
                    {vm.phaseOrder.map((_, i) => (
                        <View key={i} style={[phase_styles.pip, vm.phaseIndex >= i ? phase_styles.pipActive : phase_styles.pipInactive]} />
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

function StanceCard({
    opt,
    isSel,
    onPick,
    a11yLabel,
}: {
    opt: StanceOption;
    isSel: boolean;
    onPick: (s: StanceKey) => void;
    a11yLabel: string;
}) {
    const isAdv = opt.advantage === 'adv';
    const isDis = opt.advantage === 'dis';
    const accent = isAdv ? AXM.sulfur : isDis ? AXM.blood : AXM.parchment;
    const tooltip = useTooltip();
    const ref = useRef<View | null>(null);
    return (
        <View ref={ref}>
            <TouchableOpacity
                onPress={() => onPick(opt.key)}
                onLongPress={(isAdv || isDis) ? () => tooltip.show({ kind: 'stance-chip', id: opt.key, anchorRef: ref }) : undefined}
                style={stance_styles.cardTouch}
                accessibilityRole="button"
                accessibilityLabel={`${a11yLabel}${(isAdv || isDis) ? ` with ${isAdv ? 'advantage' : 'disadvantage'}` : ''}`}
                accessibilityHint={(isAdv || isDis) ? 'hold to read advantage description' : undefined}
                accessibilityState={{ selected: isSel }}
            >
                <View style={[stance_styles.card, { borderColor: isSel ? AXM.sulfur : accent, backgroundColor: isSel ? AXM.selectFill : AXM.bg }]}>
                    {(isAdv || isDis) && (
                        <View
                            style={[stance_styles.advBadge, { borderColor: isAdv ? AXM.sulfur : AXM.blood }]}
                            testID={`combat-stance-${opt.key}-advdis`}
                            pointerEvents="none"
                        >
                            <Text style={[stance_styles.advText, { color: isAdv ? AXM.sulfur : AXM.blood }]}>
                                {isAdv ? 'ADV' : 'DIS'}
                            </Text>
                        </View>
                    )}
                            <View style={stance_styles.glyphWrap} pointerEvents="none">
                                <StanceGlyph kind={opt.key} size={32} color={accent} />
                            </View>
                            <Text style={[stance_styles.stanceName, { color: accent }]} numberOfLines={1} adjustsFontSizeToFit>{opt.label}</Text>
                            <Text style={stance_styles.stanceGloss} numberOfLines={2}>{opt.gloss}</Text>
                            <View style={stance_styles.triangleMeta}>
                                <View style={stance_styles.metaLine}>
                                    <Text style={stance_styles.metaVerb}>BEATS</Text>
                                    <StanceGlyph kind={opt.counters.toLowerCase() as StanceKey} size={9} color={AXM.sulfur} />
                                    <Text style={[stance_styles.metaTarget, { color: AXM.sulfur }]}>{opt.counters.slice(0, 3)}</Text>
                                </View>
                                <View style={stance_styles.metaLine}>
                                    <Text style={stance_styles.metaVerb}>WEAK</Text>
                                    <StanceGlyph kind={opt.weakTo.toLowerCase() as StanceKey} size={9} color={AXM.blood} />
                                    <Text style={[stance_styles.metaTarget, { color: AXM.blood }]}>{opt.weakTo.slice(0, 3)}</Text>
                                </View>
                            </View>
                            <View style={stance_styles.divider} />
                            <View style={stance_styles.statRow}>
                                <Text style={stance_styles.statKey}>ATK</Text>
                                <Text style={[stance_styles.statVal, { color: accent }]}>{opt.derived.attack}</Text>
                            </View>
                            <View style={stance_styles.statRow}>
                                <Text style={stance_styles.statKey}>SKL</Text>
                                <Text style={[stance_styles.statVal, { color: accent }]}>{opt.derived.skill}</Text>
                            </View>
                            <View style={stance_styles.statRow}>
                                <Text style={stance_styles.statKey}>DEF</Text>
                                <Text style={[stance_styles.statVal, { color: accent }]}>{opt.derived.defense}</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>
    );
}

function StancePhase({
    options,
    selected,
    onPick,
    a11yLabels,
}: {
    options: readonly StanceOption[];
    selected: StanceKey | null;
    onPick: (s: StanceKey) => void;
    a11yLabels: { stanceHeart: string; stanceBody: string; stanceMind: string };
}) {
    return (
        <View style={stance_styles.row}>
            {options.map((opt) => (
                <StanceCard
                    key={opt.key}
                    opt={opt}
                    isSel={selected === opt.key}
                    onPick={onPick}
                    a11yLabel={
                        opt.key === 'heart' ? a11yLabels.stanceHeart :
                        opt.key === 'body' ? a11yLabels.stanceBody :
                        a11yLabels.stanceMind
                    }
                />
            ))}
        </View>
    );
}

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
                    
                    // Phase 95: Handle disabled ITEM button with tooltip
                    if (!opt.enabled && opt.key === 'item') {
                        return (
                            <TooltipTarget
                                key={opt.key}
                                kind="disabled-action"
                                id={opt.key}
                                style={[action_styles.cardTouch, { opacity: 0.45 }]}
                                accessibilityLabel={`${opt.label} unavailable`}
                                accessibilityHint="Tap for more information"
                                testID={`combat-action-${opt.key}-disabled-tooltip`}
                            >
                                <View style={[action_styles.card, { borderColor: accent }]}>
                                    <ActionIcon kind={opt.iconKind} size={32} color={accent} />
                                    <View style={action_styles.textCol}>
                                        <Text style={action_styles.label}>{opt.label}</Text>
                                        <Text style={action_styles.hint}>{opt.hint}</Text>
                                        <Text style={action_styles.statEffect}>{opt.statEffect}</Text>
                                    </View>
                                </View>
                            </TooltipTarget>
                        );
                    }

                    // Regular enabled actions (or other disabled actions without tooltips)
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
                                    <Text style={action_styles.statEffect}>{opt.statEffect}</Text>
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
    const available = useMemo(() => skills.filter((s) => s.enabled), [skills]);
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

function RollBar({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
    const pct = Math.min(1, Math.max(0, value / max));
    return (
        <View style={resolve_styles.rollBarRow}>
            <Text style={[resolve_styles.rollBarValue, { color }]}>{value}</Text>
            <View style={resolve_styles.rollBarTrack}>
                <View style={[resolve_styles.rollBarFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
            </View>
            <Text style={resolve_styles.rollBarLabel}>{label}</Text>
        </View>
    );
}

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
    const max = Math.max(resolve.playerRoll, resolve.enemyRoll, 20) + 4;

    useEffect(() => {
        if (isCrit) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } else if (resolve.outcome === 'miss') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    }, [isCrit, resolve.outcome]);

    return (
        <View style={resolve_styles.wrap}>
            <View style={resolve_styles.scaleBox}>
                <View style={resolve_styles.scaleHeader}>
                    <View>
                        <Text style={[resolve_styles.scaleEyebrow, { color: AXM.sulfur }]}>YOU · {resolve.playerStance.toUpperCase()}</Text>
                        <Text style={resolve_styles.scaleSubLabel}>ATTACK ROLL</Text>
                    </View>
                    <View style={resolve_styles.centerAlign}>
                        <Text style={[resolve_styles.scaleEyebrow, { color: AXM.bone }]}>VS</Text>
                    </View>
                    <View style={resolve_styles.rightAlign}>
                        <Text style={[resolve_styles.scaleEyebrow, { color: AXM.blood }]}>FOE · {resolve.enemyStance.toUpperCase()}</Text>
                        <Text style={resolve_styles.scaleSubLabel}>FOE DEFENSE</Text>
                    </View>
                </View>
                <RollBar value={resolve.playerRoll} max={max} color={AXM.sulfur} label="YOU" />
                <RollBar value={resolve.enemyRoll} max={max} color={AXM.blood} label="FOE" />
                <Text style={resolve_styles.verdictText}>{resolve.header.toLowerCase()}</Text>
            </View>
            {isCrit && (
                <Text style={resolve_styles.critFlag}>CRIT — DOUBLE</Text>
            )}
            <View style={resolve_styles.ripplesBox}>
                <Text style={resolve_styles.ripplesEyebrow}>RIPPLES</Text>
                <View style={resolve_styles.rippleRow}>
                    <Text style={[resolve_styles.rippleValue, { color: advColor }]}>{resolve.primaryText}</Text>
                    <Text style={resolve_styles.rippleDesc}>{resolve.message}</Text>
                </View>
            </View>
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

const phase_styles = StyleSheet.create({
    phaseSection: { padding: 8, paddingHorizontal: 10, paddingBottom: 14 },
    phaseHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
    phaseHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    phaseHeaderLabel: { color: AXM.parchment },
    phaseIndexBox: { width: 18, height: 18, backgroundColor: AXM.sulfur, alignItems: 'center', justifyContent: 'center' },
    phaseIndex: { fontFamily: FONTS.gothic, fontSize: 14, color: AXM.bg },
    phasePips: { flexDirection: 'row', gap: 3 },
    pip: { width: 14, height: 4 },
    pipActive: { backgroundColor: AXM.sulfur },
    pipInactive: { backgroundColor: AXM.ash },
});

const stack_styles = StyleSheet.create({
    column: { flexDirection: 'column', gap: 8 },
    row: { padding: 8, paddingHorizontal: 12 },
    rowCurrent: {
        backgroundColor: AXM.panelBg,
        borderWidth: 1,
        borderColor: AXM.divider,
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
    rowRule: { flex: 1, height: 1, backgroundColor: AXM.divider },
    rowSummary: {
        fontFamily: FONTS.sans,
        fontSize: 9,
        letterSpacing: 1.4,
        color: AXM.bone,
    },
    rowSummaryUndo: { color: AXM.sulfur, borderBottomWidth: 1, borderBottomColor: AXM.sulfur, paddingBottom: 1 },
    rowDot: { width: 5, height: 5, backgroundColor: AXM.sulfur },
    rowBody: { marginTop: 10 },
});

const stance_styles = StyleSheet.create({
    row: { flexDirection: 'row', gap: 3, justifyContent: 'space-evenly' },
    cardTouch: { flex: 1, minWidth: 0, maxWidth: 120 },
    card: { borderWidth: 2, padding: 5, paddingHorizontal: 3, minHeight: 140, maxWidth: '100%' },
    advBadge: { position: 'absolute', top: 4, right: 4, borderWidth: 1, paddingHorizontal: 3, paddingVertical: 1, backgroundColor: AXM.bg, zIndex: 1 },
    advText: { fontFamily: FONTS.sans, fontSize: 8, letterSpacing: 1 },
    glyphWrap: { alignItems: 'center', marginTop: 3, marginBottom: 2 },
    stanceName: { textAlign: 'center', fontFamily: FONTS.gothic, fontSize: 14, letterSpacing: 0.6 },
    stanceGloss: { textAlign: 'center', fontFamily: FONTS.serifItalic, fontSize: 8, color: AXM.bone, marginTop: -2, marginBottom: 1 },
    triangleMeta: { alignItems: 'center', marginTop: 2, marginBottom: 2, gap: 0.5 },
    metaLine: { flexDirection: 'row', alignItems: 'center', gap: 1.5 },
    metaVerb: { fontFamily: FONTS.mono, fontSize: 6, color: AXM.bone, letterSpacing: 0.6 },
    metaTarget: { fontFamily: FONTS.mono, fontSize: 7, letterSpacing: 0.6 },
    divider: { borderTopWidth: 1, borderTopColor: AXM.ash, marginBottom: 3 },
    statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
    statKey: { fontFamily: FONTS.mono, fontSize: 8, color: AXM.bone, letterSpacing: 1 },
    statVal: { fontFamily: FONTS.gothic, fontSize: 12 },
});

const action_styles = StyleSheet.create({
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    cardTouch: { width: '48%' },
    card: { backgroundColor: AXM.bg, borderWidth: 2, padding: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 64 },
    textCol: { flex: 1 },
    label: { fontFamily: FONTS.gothic, fontSize: 18, color: AXM.parchment, lineHeight: 20, letterSpacing: 1 },
    hint: { fontFamily: FONTS.mono, fontSize: 8, color: AXM.bone, letterSpacing: 1, marginTop: 2 },
    statEffect: { fontFamily: FONTS.mono, fontSize: 7, color: AXM.sulfur, letterSpacing: 1.2, marginTop: 1, textAlign: 'right' },
    fleeRow: { alignItems: 'center', marginTop: 8 },
    flee: { fontFamily: FONTS.serifItalic, fontSize: 11, color: AXM.bone, borderBottomWidth: 1, borderBottomColor: AXM.bone, paddingBottom: 1 },
});

const skill_styles = StyleSheet.create({
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
    rowText: { flex: 1, minWidth: 0 },
    rowCostCol: { alignItems: 'flex-end', minWidth: 48 },
    skillName: { fontFamily: FONTS.serif, fontSize: 14, color: AXM.parchment },
    skillDesc: { fontFamily: FONTS.mono, fontSize: 9, color: AXM.bone, marginTop: 2, lineHeight: 12 },
    costValue: { fontFamily: FONTS.mono, fontSize: 14, color: AXM.parchment },
    emptyHint: { textAlign: 'center', paddingVertical: 14, fontFamily: FONTS.serifItalic, fontSize: 12, color: AXM.bone },
    availHint: { textAlign: 'center', marginTop: 6, fontFamily: FONTS.mono, fontSize: 9, color: AXM.bone, letterSpacing: 1 },
});

const resolve_styles = StyleSheet.create({
    wrap: { flexDirection: 'column', gap: 10 },
    scaleBox: { backgroundColor: AXM.deepBg, borderWidth: 1, borderColor: AXM.ash, padding: 10, paddingBottom: 12 },
    scaleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    scaleEyebrow: { fontFamily: FONTS.sans, fontSize: 9, letterSpacing: 1.4 },
    scaleSubLabel: { fontFamily: FONTS.mono, fontSize: 8.5, color: AXM.bone, letterSpacing: 0.6, marginTop: 1 },
    rollBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
    rollBarValue: { fontFamily: FONTS.gothic, fontSize: 22, width: 32, textAlign: 'right' },
    rollBarTrack: { flex: 1, height: 12, backgroundColor: AXM.deepBg, borderWidth: 1, borderColor: AXM.ash, position: 'relative', overflow: 'hidden' },
    rollBarFill: { position: 'absolute', top: 1, bottom: 1, left: 1 },
    rollBarLabel: { fontFamily: FONTS.mono, fontSize: 8, color: AXM.bone, letterSpacing: 1, width: 24 },
    verdictText: { textAlign: 'center', fontFamily: FONTS.serifItalic, fontSize: 14, color: AXM.parchment, marginTop: 10 },
    critFlag: { textAlign: 'center', fontFamily: FONTS.sans, fontSize: 10, color: AXM.sulfur, letterSpacing: 2 },
    ripplesBox: { backgroundColor: AXM.panelBg, borderWidth: 1, borderColor: AXM.ash, padding: 7, paddingHorizontal: 9 },
    ripplesEyebrow: { fontFamily: FONTS.sans, fontSize: 9, color: AXM.blood, letterSpacing: 2, marginBottom: 3 },
    rippleRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
    rippleValue: { fontFamily: FONTS.gothic, fontSize: 16 },
    rippleDesc: { fontFamily: FONTS.serif, fontSize: 11.5, color: AXM.parchment, flex: 1 },
    letBtn: { paddingVertical: 12, alignItems: 'center', borderWidth: 1, backgroundColor: AXM.bg },
    letText: { fontFamily: FONTS.sans, fontSize: 13, letterSpacing: 3 },
    centerAlign: { alignItems: 'center' },
    rightAlign: { alignItems: 'flex-end' },
});
