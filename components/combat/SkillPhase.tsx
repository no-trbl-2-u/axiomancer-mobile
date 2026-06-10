import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AXM, FONTS } from '@/theme/axm';
import type { SkillOption } from '@/state/presenters/combat.engine';
import { SkillRow } from './SkillRow';

export interface SkillPhaseProps {
    skills: readonly SkillOption[];
    availableCount: number;
    totalCount: number;
    onPick: (s: SkillOption) => void;
}

export const SkillPhase = React.memo(function SkillPhase({
    skills,
    availableCount,
    totalCount,
    onPick,
}: SkillPhaseProps) {
    const available = useMemo(() => skills.filter((s) => s.enabled), [skills]);
    return (
        <View style={styles.list}>
            {available.map((s) => (
                <SkillRow key={s.id} skill={s} onPick={onPick} />
            ))}
            {available.length === 0 && (
                <Text style={styles.emptyHint}>none open · stance bound.</Text>
            )}
            <Text style={styles.availHint}>
                {availableCount} of {totalCount} open · stance bound.
            </Text>
        </View>
    );
});

const styles = StyleSheet.create({
    list: {
        paddingHorizontal: 8,
    },
    emptyHint: {
        fontFamily: FONTS.serif,
        fontSize: 11,
        color: AXM.ash,
        textAlign: 'center',
        fontStyle: 'italic',
        paddingVertical: 16,
    },
    availHint: {
        fontFamily: FONTS.serif,
        fontSize: 10,
        color: AXM.ash,
        textAlign: 'center',
        fontStyle: 'italic',
        marginTop: 8,
    },
});