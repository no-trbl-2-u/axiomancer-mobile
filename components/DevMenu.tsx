/**
 * Dev-only collapsible container for the SELF tab's six Debug*
 * affordances (Phase 61a — first sub-phase of the DEV-mode
 * coverage expansion). Before Phase 61a the toggles + buttons
 * (AestheticDevToggle, DebugSeedButton, DebugCombatButton,
 * DebugMapResetButton, DebugChaosToggle, DebugPresetPicker) sat
 * flat at the bottom of `app/(tabs)/character/index.tsx`, blowing
 * out the layout on dev builds and making the upcoming 61b–61f
 * additions structurally noisier. This component wraps them in
 * a single collapsible group keyed off the same `__DEV__` gate
 * the children already honor.
 *
 * Layout:
 * - One row with `DEV MENU` eyebrow + chevron indicator on the
 *   right (▾ when expanded, ▸ when collapsed).
 * - Default state: collapsed — keeps the SELF tab clean on
 *   first paint; expanding is a single tap.
 * - Children are not unmounted when collapsed (they keep their
 *   own internal state across collapse cycles); the container
 *   just stops rendering them via short-circuit. Re-mounts
 *   happen on every expand-from-collapsed.
 *
 * Production gate: returns `null` outside `__DEV__`. The children
 * also self-gate; the container's gate makes the entire surface
 * disappear cleanly without leaving an empty wrapper.
 */

import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { isDevToolsEnabled } from '@/lib/buildProfile';
import { AXM, FONTS } from '@/theme/axm';

interface DevMenuProps {
    children: React.ReactNode;
    /**
     * Initial expanded state. Defaults to `false` (collapsed).
     * Tests can pass `true` to render with the children expanded
     * without firing the press.
     */
    initiallyExpanded?: boolean;
}

export function DevMenu({ children, initiallyExpanded = false }: DevMenuProps) {
    const [expanded, setExpanded] = useState(initiallyExpanded);

    if (!isDevToolsEnabled()) return null;

    return (
        <View style={styles.root} testID="dev-menu">
            <Pressable
                style={styles.header}
                onPress={() => setExpanded((prev) => !prev)}
                accessibilityRole="button"
                accessibilityLabel={`Dev menu, currently ${expanded ? 'expanded' : 'collapsed'}`}
                testID="dev-menu-header"
            >
                <Text style={styles.label}>DEV MENU</Text>
                <Text style={styles.chevron}>{expanded ? '▾' : '▸'}</Text>
            </Pressable>
            {expanded ? <View testID="dev-menu-body">{children}</View> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        marginTop: 16,
        marginHorizontal: 12,
        borderWidth: 1,
        borderColor: AXM.ash,
        borderStyle: 'dashed',
        backgroundColor: AXM.panelBg,
    },
    header: {
        paddingVertical: 8,
        paddingHorizontal: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    label: {
        fontFamily: FONTS.mono,
        fontSize: 11,
        letterSpacing: 2,
        color: AXM.bone,
    },
    chevron: {
        fontFamily: FONTS.mono,
        fontSize: 14,
        color: AXM.sulfur,
    },
});
