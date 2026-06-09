import React, { useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AXM, FONTS } from '@/theme/axm';
import { useTooltip } from '@/hooks/useTooltip';
import { StanceGlyph } from '@/components/StanceGlyph';
import { toRomanLower } from '@/state/presenters/roman';
import type { SkillOption } from '@/state/presenters/combat.engine';

export interface SkillRowProps {
    skill: SkillOption;
    onPick: (s: SkillOption) => void;
}

export function SkillRow({ skill: s, onPick }: SkillRowProps) {
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
                style={[styles.row, isFocused && styles.focusedRow]}
                accessibilityRole="button"
                accessibilityLabel={`Skill ${s.name}`}
                accessibilityHint="hold to read full description"
                testID={`combat-skill-row-${s.id}`}
            >
                <StanceGlyph kind={s.stance} size={24} color={AXM.parchment} />
                <View style={styles.rowText}>
                    <Text style={styles.skillName} numberOfLines={1}>{s.name}</Text>
                    <Text style={styles.skillDesc} numberOfLines={2}>
                        {s.description}
                    </Text>
                </View>
                <View style={styles.rowCostCol}>
                    <Text style={styles.costValue}>
                        {toRomanLower(s.manaCost, '·')}
                    </Text>
                </View>
            </TouchableOpacity>
        </View>
    );
}

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
    skillDesc: {
        fontFamily: FONTS.serif,
        fontSize: 10,
        color: AXM.bone,
        lineHeight: 12,
    },
    rowCostCol: {
        alignItems: 'flex-end',
        justifyContent: 'center',
        marginLeft: 8,
    },
    costValue: {
        fontFamily: FONTS.mono,
        fontSize: 10,
        color: AXM.sulfur,
        fontWeight: '600',
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