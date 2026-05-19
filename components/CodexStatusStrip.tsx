/**
 * Codex status strip — Phase 50 tick B.
 *
 * Mono status line that sits at the top of the combat screen when
 * `useAesthetic()` returns `'codex'`. Renders the line composed by
 * `selectCodexStatusLine(vm)` — the screen itself decides whether
 * to mount this; the strip is pure display.
 *
 * Design source: `design/handoff-2026-05-16/project/app.jsx`
 * `function ScreenStrifeCodex` — the first mono ENC=… line.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AXM, FONTS } from '@/theme/axm';

export interface CodexStatusStripProps {
    line: string;
}

export function CodexStatusStrip({ line }: CodexStatusStripProps) {
    return (
        <View style={styles.row}>
            <Text style={styles.text} accessibilityRole="header">
                {line}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        paddingHorizontal: 14,
        paddingTop: 8,
        paddingBottom: 4,
        backgroundColor: AXM.bg,
        borderBottomWidth: 1,
        borderBottomColor: AXM.ash,
    },
    text: {
        fontFamily: FONTS.mono,
        fontSize: 10,
        letterSpacing: 1,
        color: AXM.bone,
    },
});
