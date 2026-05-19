/**
 * Codex header strip for the exploration screen — Phase 50 tick D.
 *
 * Two-token mono strip rendered above the region header when
 * `useAesthetic()` returns `'codex'`. Left side gets the region
 * token in parchment (the region name is the primary frame for
 * the map view); right side gets the current-node id in bone.
 *
 * Pure display — content comes from
 * `selectExplorationCodexHeader(vm)`.
 *
 * Design source: `design/handoff-2026-05-16/project/app.jsx`
 * `function ScreenWildsCodex` header line.
 *
 * Visually similar to `components/event/EventCodexHeader.tsx`
 * but with parchment-left rather than blood-left — exploration's
 * status is "where you are", not "what you face".
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AXM, FONTS } from '@/theme/axm';

export interface ExplorationCodexHeaderProps {
    left: string;
    right: string;
}

export function ExplorationCodexHeader({ left, right }: ExplorationCodexHeaderProps) {
    return (
        <View style={styles.row} accessibilityRole="header">
            <Text style={styles.leftText}>{left}</Text>
            <Text style={styles.rightText}>{right}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 6,
        backgroundColor: AXM.bg,
        borderBottomWidth: 1,
        borderBottomColor: AXM.ash,
    },
    leftText: {
        fontFamily: FONTS.mono,
        fontSize: 10,
        letterSpacing: 1,
        color: AXM.parchment,
    },
    rightText: {
        fontFamily: FONTS.mono,
        fontSize: 10,
        letterSpacing: 1,
        color: AXM.bone,
    },
});
