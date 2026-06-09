import React from 'react';
import {
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { AXM, FONTS } from '@/theme/axm';
import { SectionLabel } from '@/components/SectionLabel';
import type {
    ActionOption,
    CombatViewModel,
    SkillOption,
    StanceKey,
} from '@/state/presenters/combat.engine';
import { PhaseStack } from './PhaseStack';

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
        <View style={styles.phaseSection} testID={`combat-phase-${vm.phase}`}>
            <View style={styles.phaseHeader}>
                <View style={styles.phaseHeaderLeft}>
                    <View style={styles.phaseIndexBox}>
                        <Text style={styles.phaseIndex}>{Math.max(1, vm.phaseIndex + 1)}</Text>
                    </View>
                    <SectionLabel size={11} style={styles.phaseHeaderLabel}>{vm.phaseHeader}</SectionLabel>
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

const styles = StyleSheet.create({
    phaseSection: { 
        padding: 8, 
        paddingHorizontal: 10, 
        paddingBottom: 14 
    },
    phaseHeader: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: 6 
    },
    phaseHeaderLeft: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 6 
    },
    phaseHeaderLabel: { 
        color: AXM.parchment 
    },
    phaseIndexBox: { 
        width: 18, 
        height: 18, 
        backgroundColor: AXM.sulfur, 
        alignItems: 'center', 
        justifyContent: 'center' 
    },
    phaseIndex: { 
        fontFamily: FONTS.gothic, 
        fontSize: 14, 
        color: AXM.bg 
    },
    phasePips: { 
        flexDirection: 'row', 
        gap: 3 
    },
    pip: { 
        width: 14, 
        height: 4 
    },
    pipActive: { 
        backgroundColor: AXM.sulfur 
    },
    pipInactive: { 
        backgroundColor: AXM.ash 
    },
});