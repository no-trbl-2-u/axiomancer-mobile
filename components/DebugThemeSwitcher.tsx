/**
 * Dev-only colour-theme switcher (visual-audit 2026-06).
 *
 * Renders one button per registered theme. Tapping persists the choice
 * and reloads so the whole app re-paints in that palette — the preview
 * affordance the design ask called for ("a few buttons where each
 * changes the colour theme so I can test it before the new worlds
 * exist"). The active theme is highlighted.
 *
 * Production builds render nothing (`isDevToolsEnabled()` is false).
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { isDevToolsEnabled } from '@/lib/buildProfile';
import { AXM, FONTS } from '@/theme/axm';
import { THEME_ORDER, THEME_SPECS, paletteFor } from '@/theme/palette';
import { ACTIVE_THEME_ID, setActiveTheme } from '@/theme/theme-switch';

export function DebugThemeSwitcher() {
    if (!isDevToolsEnabled()) return null;

    return (
        <View style={styles.row} testID="debug-theme-switcher">
            <Text style={styles.label}>COLOUR THEME · DEV</Text>
            <View style={styles.grid}>
                {THEME_ORDER.map((id) => {
                    const def = THEME_SPECS[id];
                    const pal = paletteFor(id);
                    const active = id === ACTIVE_THEME_ID;
                    return (
                        <Pressable
                            key={id}
                            style={[
                                styles.swatch,
                                {
                                    backgroundColor: pal.panelBg,
                                    borderColor: active ? pal.sulfur : AXM.ash,
                                    borderWidth: active ? 2 : 1,
                                },
                            ]}
                            onPress={() => setActiveTheme(id)}
                            accessibilityRole="button"
                            accessibilityState={{ selected: active }}
                            accessibilityLabel={`Theme ${def.name}${active ? ', active' : ''}`}
                            testID={`debug-theme-${id}`}
                        >
                            <View style={styles.dots}>
                                <View style={[styles.dot, { backgroundColor: pal.blood }]} />
                                <View style={[styles.dot, { backgroundColor: pal.sulfur }]} />
                                <View style={[styles.dot, { backgroundColor: pal.rust }]} />
                            </View>
                            <Text style={[styles.name, { color: active ? pal.sulfur : pal.parchment }]}>
                                {def.name}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        marginTop: 16,
        marginHorizontal: 12,
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: AXM.ash,
        borderStyle: 'dashed',
        backgroundColor: AXM.panelBg,
    },
    label: {
        fontFamily: FONTS.mono,
        fontSize: 9,
        letterSpacing: 1.5,
        color: AXM.bone,
        marginBottom: 8,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    swatch: {
        paddingVertical: 6,
        paddingHorizontal: 8,
        minWidth: 92,
    },
    dots: {
        flexDirection: 'row',
        gap: 4,
        marginBottom: 4,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    name: {
        fontFamily: FONTS.sans,
        fontSize: 11,
        letterSpacing: 0.5,
    },
});
