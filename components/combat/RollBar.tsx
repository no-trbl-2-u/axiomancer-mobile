import React from 'react';
import { Text, View } from 'react-native';

import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

export interface RollBarProps {
    value: number;
    max: number;
    color: string;
    label: string;
}

export const RollBar = React.memo(function RollBar({ value, max, color, label }: RollBarProps) {
    const styles = useStyles();
    const pct = Math.min(1, Math.max(0, value / max));
    return (
        <View style={styles.rollBarRow}>
            <Text style={[styles.rollBarValue, { color }]}>{value}</Text>
            <View style={styles.rollBarTrack}>
                <View style={[styles.rollBarFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
            </View>
            <Text style={styles.rollBarLabel}>{label}</Text>
        </View>
    );
});

const useStyles = makeStyles((AXM) => ({
    rollBarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    rollBarValue: {
        fontFamily: FONTS.mono,
        fontSize: 12,
        fontWeight: '700',
        width: 24,
        textAlign: 'right',
    },
    rollBarTrack: {
        flex: 1,
        height: 4,
        backgroundColor: AXM.ash,
        borderRadius: 2,
        marginHorizontal: 8,
    },
    rollBarFill: {
        height: '100%',
        borderRadius: 2,
    },
    rollBarLabel: {
        fontFamily: FONTS.sans,
        fontSize: 9,
        color: AXM.ash,
        letterSpacing: 0.5,
        width: 40,
    },
}));