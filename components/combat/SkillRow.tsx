import React, { useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AXM, FONTS } from '@/theme/axm';
import { useTooltip } from '@/hooks/useTooltip';
import { StanceGlyph } from '@/components/StanceGlyph';
import type { SkillOption } from '@/state/presenters/combat.engine';

export interface SkillRowProps {
    skill: SkillOption;
    onPick: (s: SkillOption) => void;
}

export const SkillRow = React.memo(function SkillRow({ skill: s, onPick }: SkillRowProps) {
    const tooltip = useTooltip();
    const ref = useRef<View | null>(null);
    const [isFocused, setIsFocused] = useState(false);

    return (
        <View ref={ref}>
            <TouchableOpacity
                onPress={() => onPick(s)}
                onLongPress={() => tooltip.show({ kind: 'skill', id: s.id, anchorRef: ref })}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                style={[styles.row, isFocused && styles.focusedRow, !s.enabled && styles.disabledRow]}
                accessibilityRole="button"
                accessibilityState={{ disabled: !s.enabled }}
                accessibilityLabel={`Skill ${s.name}, ${s.effectText}, costs ${s.costText}${s.enabled ? '' : ', unaffordable'}`}
                accessibilityHint="hold to read full description"
                testID={`combat-skill-row-${s.id}`}
            >
                <StanceGlyph kind={s.stance} size={24} color={s.enabled ? AXM.parchment : AXM.ash} />
                <View style={styles.rowText}>
                    <Text style={[styles.skillName, !s.enabled && styles.dimText]} numberOfLines={1}>{s.name}</Text>
                    <Text style={[styles.skillEffect, !s.enabled && styles.dimText]} numberOfLines={2}>
                        {s.effectText}
                    </Text>
                </View>
                <View style={styles.rowCostCol}>
                    <Text style={[styles.costValue, !s.enabled && styles.costShort]}>
                        {s.costText}
                    </Text>
                </View>
            </TouchableOpacity>
        </View>
    );
});

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 8,
        borderRadius: 3,
        borderWidth: 1,
        borderColor: AXM.ash,
        backgroundColor: AXM.bg,
        marginBottom: 6,
    },
    rowText: {
        flex: 1,
        marginLeft: 12,
    },
    skillName: {
        fontFamily: FONTS.gothic,
        fontSize: 11,
        color: AXM.parchment,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 2,
    },
    skillEffect: {
        fontFamily: FONTS.mono,
        fontSize: 9.5,
        letterSpacing: 0.5,
        color: AXM.bone,
        lineHeight: 12,
    },
    rowCostCol: {
        alignItems: 'flex-end',
        justifyContent: 'center',
        marginLeft: 8,
        maxWidth: 78,
    },
    costValue: {
        fontFamily: FONTS.mono,
        fontSize: 9,
        color: AXM.sulfur,
        fontWeight: '600',
        textAlign: 'right',
    },
    costShort: {
        color: AXM.blood,
    },
    disabledRow: {
        opacity: 0.45,
    },
    dimText: {
        color: AXM.bone,
    },
    focusedRow: {
        borderColor: AXM.sulfur,
        borderWidth: 2,
        shadowColor: AXM.sulfur,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 2,
    },
});