import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AXM } from '@/theme/axm';
import type {
    ActionOption,
    CombatViewModel,
    SkillOption,
    StanceKey,
} from '@/state/presenters/combat.engine';
import { StancePhase } from './StancePhase';
import { ActionPhase } from './ActionPhase';
import { SkillPhase } from './SkillPhase';
import { ResolvePanel } from './ResolvePanel';

export interface PhaseStackProps {
    vm: CombatViewModel;
    onPickStance: (s: StanceKey) => void;
    onPickAction: (k: ActionOption['key']) => void;
    onPickSkill: (s: SkillOption) => void;
    onGoBackToPhase: (phase: 'choosing_stance' | 'choosing_action' | 'choosing_skill') => void;
    onFlee: () => void;
    onContinue: () => void;
    onLeave: () => void;
}

export function PhaseStack({
    vm,
    onPickStance,
    onPickAction,
    onPickSkill,
    onGoBackToPhase,
    onFlee,
    onContinue,
    onLeave,
}: PhaseStackProps) {
    return (
        <View style={styles.column} testID="combat-phase-stack">
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
                                style={styles.rowHeader}
                                accessibilityRole="button"
                                accessibilityLabel={`Change ${entry.label}`}
                                testID={`phase-stack-undo-${entry.key}`}
                            >
                                {children}
                            </TouchableOpacity>
                        )
                        : ({ children }) => <View style={styles.rowHeader}>{children}</View>;
                    return (
                    <View
                        key={entry.key}
                        style={[
                            styles.row,
                            entry.state === 'current' && styles.rowCurrent,
                        ]}
                        testID={`phase-stack-row-${entry.key}`}
                    >
                        <HeaderContainer>
                            <Text
                                style={[
                                    styles.rowLabel,
                                    entry.state === 'past' && { color: AXM.bone },
                                    entry.state === 'future' && { color: AXM.ash },
                                ]}
                            >
                                {entry.label}
                            </Text>
                            <View style={styles.rowRule} />
                            {entry.state === 'past' && entry.summary.length > 0 && (
                                <Text style={[styles.rowSummary, reversiblePast && styles.rowSummaryUndo]}>
                                    {entry.summary}
                                </Text>
                            )}
                            {entry.state === 'current' && (
                                <View style={styles.rowDot} />
                            )}
                        </HeaderContainer>
                        {entry.state === 'current' && (
                            <View style={styles.rowBody}>
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

const styles = StyleSheet.create({
    column: {
        flex: 1,
    },
    row: {
        borderLeftWidth: 3,
        borderColor: 'transparent',
        paddingLeft: 15,
        paddingVertical: 8,
    },
    rowCurrent: {
        borderLeftColor: AXM.sulfur,
    },
    rowHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    rowLabel: {
        fontFamily: 'PirataOne',
        fontSize: 11,
        color: AXM.sulfur,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginRight: 12,
    },
    rowRule: {
        flex: 1,
        height: 1,
        backgroundColor: AXM.ash,
    },
    rowSummary: {
        fontFamily: 'IMFellEnglish',
        fontSize: 11,
        color: AXM.bone,
        marginLeft: 12,
        fontStyle: 'italic',
    },
    rowSummaryUndo: {
        textDecorationLine: 'underline',
    },
    rowDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: AXM.sulfur,
        marginLeft: 12,
    },
    rowBody: {
        paddingTop: 8,
    },
});