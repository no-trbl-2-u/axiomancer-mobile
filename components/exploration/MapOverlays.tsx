import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AXM, FONTS } from '@/theme/axm';

interface MapOverlaysProps {
    legend: {
        left: string;
        right: string;
    };
}

export function MapOverlays({ legend }: MapOverlaysProps) {
    return (
        <>
            {/* Compass */}
            <Text style={styles.compass}>N ↑ · scale: leagues</Text>
            <Text style={styles.nodeGraphLabel}>NODE GRAPH</Text>

            {/* Legend */}
            <View style={styles.legend}>
                <Text style={styles.legendText}>{legend.left}</Text>
                <Text style={styles.legendText}>{legend.right}</Text>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    compass: {
        position: 'absolute',
        top: 10,
        left: 10,
        fontFamily: FONTS.mono,
        fontSize: 9,
        color: AXM.bone,
        letterSpacing: 1,
        zIndex: 2,
    },
    nodeGraphLabel: {
        position: 'absolute',
        top: 10,
        right: 12,
        fontFamily: FONTS.gothic,
        fontSize: 14,
        color: AXM.parchment,
        opacity: 0.6,
        letterSpacing: 2,
        zIndex: 2,
    },
    legend: {
        position: 'absolute',
        bottom: 8,
        left: 12,
        right: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        zIndex: 2,
    },
    legendText: {
        fontFamily: FONTS.mono,
        fontSize: 8,
        color: AXM.bone,
        letterSpacing: 1,
    },
});