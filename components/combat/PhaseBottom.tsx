import React, { useEffect, useRef } from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import * as Haptics from 'expo-haptics';

import { AXM, FONTS } from '@/theme/axm';
import { useTooltip } from '@/hooks/useTooltip';
import { TooltipTarget } from '@/components/tooltip/TooltipTarget';
import { SectionLabel } from '@/components/SectionLabel';
import { StanceGlyph } from '@/components/StanceGlyph';
import { ActionIcon } from '@/components/ActionIcon';
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
                    <SectionLabel size={11} style={{ color: AXM.parchment }}>{vm.phaseHeader}</SectionLabel>
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
                        <View style={[stance_styles.card, { borderColor: isSel ? AXM.sulfur : accent, backgroundColor: isSel ? '#1a1410' : AXM.bg }]}>
                            {(isAdv || isDis) && (
                                <TooltipTarget
                                    kind="stance-chip"
                                    id={opt.key}
                                    accessibilityLabel={`Explain ${isAdv ? 'advantage' : 'disadvantage'} on ${opt.label}`}
                                    accessibilityHint="tap to read description"
                                    testID={`combat-stance-${opt.key}-advdis`}
                                >
                                    <View style={[stance_styles.advBadge, { borderColor: isAdv ? AXM.sulfur : AXM.blood }]}>
                                        <Text style={[stance_styles.advText, { color: isAdv ? AXM.sulfur : AXM.blood }]}>
                                            {isAdv ? 'ADV' : 'DIS'}
                                        </Text>
                                    </View>
                                </TooltipTarget>
                            )}
                            <View style={stance_styles.glyphWrap} pointerEvents="none">
                                <StanceGlyph kind={opt.key} size={36} color={accent} />
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

    useEffect(() => {
        if (isCrit) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } else if (resolve.outcome === 'miss') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    }, [isCrit, resolve.outcome]);

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
                    <Text style={resolve_styles.vsDividerRule}>{'━━'}</Text>
                    <Text style={resolve_styles.vsLabel}>VS</Text>
                    <Text style={resolve_styles.vsDividerRule}>{'━━'}</Text>
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

const phase_styles = StyleSheet.create({
    phaseSection: { padding: 8, paddingHorizontal: 10, paddingBottom: 14 },
    phaseHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
    phaseHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
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
    rowSummaryUndo: { color: AXM.sulfur, borderBottomWidth: 1, borderBottomColor: AXM.sulfur, paddingBottom: 1 },
    rowDot: { width: 5, height: 5, backgroundColor: AXM.sulfur },
    rowBody: { marginTop: 10 },
});

const stance_styles = StyleSheet.create({
    row: { flexDirection: 'row', gap: 6 },
    cardTouch: { flex: 1 },
    card: { borderWidth: 2, padding: 8, paddingHorizontal: 6, minHeight: 178 },
    advBadge: { position: 'absolute', top: 4, right: 4, borderWidth: 1, paddingHorizontal: 3, paddingVertical: 1, backgroundColor: AXM.bg, zIndex: 1 },
    advText: { fontFamily: FONTS.sans, fontSize: 8, letterSpacing: 1 },
    glyphWrap: { alignItems: 'center', marginTop: 4, marginBottom: 2 },
    stanceName: { textAlign: 'center', fontFamily: FONTS.gothic, fontSize: 17, letterSpacing: 1 },
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
    card: { backgroundColor: AXM.bg, borderWidth: 2, padding: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 64 },
    textCol: { flex: 1 },
    label: { fontFamily: FONTS.gothic, fontSize: 18, color: AXM.parchment, lineHeight: 20, letterSpacing: 1 },
    hint: { fontFamily: FONTS.mono, fontSize: 8, color: AXM.bone, letterSpacing: 1, marginTop: 2 },
    fleeRow: { alignItems: 'center', marginTop: 8 },
    flee: { fontFamily: FONTS.serifItalic, fontSize: 11, color: AXM.bone, borderBottomWidth: 1, borderBottomColor: AXM.bone, paddingBottom: 1 },
});

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
    vsGrid: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 8 },
    vsCol: { flex: 1, alignItems: 'center' },
    vsDivider: { alignItems: 'center', gap: 2 },
    vsDividerRule: { fontFamily: FONTS.mono, fontSize: 11, color: AXM.bone },
    vsLabel: { fontFamily: FONTS.sans, fontSize: 9, color: AXM.sulfur, letterSpacing: 1.4 },
    vsEyebrow: { fontFamily: FONTS.sans, fontSize: 9, color: AXM.bone, letterSpacing: 1.4 },
    vsRoll: { fontFamily: FONTS.mono, fontSize: 26, color: AXM.parchment, marginTop: 2, lineHeight: 28 },
    vsVerb: { fontFamily: FONTS.serifItalic, fontSize: 11, color: AXM.parchment, marginTop: 2 },
    critFlag: { textAlign: 'center', fontFamily: FONTS.sans, fontSize: 10, color: AXM.sulfur, letterSpacing: 2 },
    letBtn: { paddingVertical: 12, alignItems: 'center', borderWidth: 1, backgroundColor: AXM.bg },
    letText: { fontFamily: FONTS.sans, fontSize: 12, letterSpacing: 2 },
});
