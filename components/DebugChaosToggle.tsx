/**
 * Dev-only chaos-mode toggle (Phase 58, user-direct via
 * /oversight 2026-05-20 13th call).
 *
 * User ask: "the 'encounters' (combat, hazard, gathering, etc)
 * are randomized for now so I can continue testing manually."
 *
 * When ON, calls `setChaosMode(true)` which overrides every node
 * in both exploration layouts to the chaos pool. The pool has
 * weighted entries across encounter / hazard / gathering /
 * loot-cache / rest, so walking any node samples randomly across
 * those event kinds.
 *
 * When OFF (default), calls `setChaosMode(false)` which restores
 * the canonical per-node-type overrides.
 *
 * Renders null in production.
 */

import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { isDevToolsEnabled } from '@/lib/buildProfile';
import { setChaosMode } from '@/state/exploration-maps/event-pools';
import { AXM, FONTS } from '@/theme/axm';

export function DebugChaosToggle() {
    const [chaosOn, setChaosOn] = useState<boolean>(false);

    if (!isDevToolsEnabled()) return null;

    const onPress = () => {
        const next = !chaosOn;
        setChaosOn(next);
        setChaosMode(next);
    };

    return (
        <View style={styles.row}>
            <View style={styles.labelCol}>
                <Text style={styles.label}>DEBUG · CHAOS</Text>
                <Text style={styles.sub}>
                    {chaosOn
                        ? 'every node fires a random event kind'
                        : 'canonical per-node types'}
                </Text>
            </View>
            <Pressable
                style={[styles.button, chaosOn ? styles.buttonOn : styles.buttonOff]}
                onPress={onPress}
                accessibilityRole="button"
                accessibilityLabel={`Toggle chaos mode, currently ${chaosOn ? 'on' : 'off'}`}
                testID="debug-chaos-toggle"
            >
                <Text
                    style={[
                        styles.buttonLabel,
                        chaosOn ? styles.buttonLabelOn : styles.buttonLabelOff,
                    ]}
                >
                    {chaosOn ? 'CHAOS' : 'CALM'}
                </Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        marginTop: 8,
        marginHorizontal: 12,
        paddingVertical: 8,
        paddingHorizontal: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: AXM.ash,
        borderStyle: 'dashed',
        backgroundColor: AXM.panelBg,
    },
    labelCol: { flexDirection: 'column', flex: 1, paddingRight: 8 },
    label: {
        fontFamily: FONTS.mono,
        fontSize: 9,
        letterSpacing: 1.5,
        color: AXM.bone,
    },
    sub: {
        fontFamily: FONTS.mono,
        fontSize: 10,
        color: AXM.parchment,
        marginTop: 2,
    },
    button: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderWidth: 1,
    },
    buttonOn: {
        borderColor: AXM.blood,
        backgroundColor: AXM.bg,
    },
    buttonOff: {
        borderColor: AXM.sulfur,
        backgroundColor: AXM.selectFill,
    },
    buttonLabel: {
        fontFamily: FONTS.gothic,
        fontSize: 12,
        letterSpacing: 1.5,
    },
    buttonLabelOn: { color: AXM.blood },
    buttonLabelOff: { color: AXM.sulfur },
});
