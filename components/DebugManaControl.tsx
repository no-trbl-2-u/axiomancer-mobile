/**
 * Dev-only mana drain/restore affordance (Phase 61c).
 *
 * Two buttons on one row inside the DevMenu (Phase 61a):
 *
 *   - `DRAIN` sets `state.combatMana.current` to 0. Verifies the
 *     skill picker's mana-empty disabled branch in the combat
 *     screen.
 *   - `FULL` sets `state.combatMana.current` to `.max`. Restores
 *     mana to ceiling without ending and restarting combat.
 *
 * Both buttons seed the slice with `{ current: 0|max, max:
 * PLAYER_MANA_DEFAULT_MAX }` if it was previously null (no active
 * combat). The combat presenter reads `state.combatMana ?? null`
 * and falls back to a full bar when null; the dev affordance lets
 * the user pre-set a specific mana state before entering combat.
 *
 * Renders null in production. The combatMana slice itself is
 * Phase 60d's lifted-from-Character mobile-only field.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
    PLAYER_MANA_DEFAULT_MAX,
} from '@/state/actions';
import { isDevToolsEnabled } from '@/lib/buildProfile';
import { useGameStore } from '@/state/GameStoreProvider';
import { AXM, FONTS } from '@/theme/axm';

export function DebugManaControl() {
    const store = useGameStore();

    if (!isDevToolsEnabled()) return null;

    const setMana = (current: number) => {
        const cur = store.getState().combatMana;
        const max = cur?.max ?? PLAYER_MANA_DEFAULT_MAX;
         
        store.setState({
            combatMana: { current: Math.max(0, Math.min(current, max)), max },
        });
    };

    return (
        <View style={styles.row}>
            <View style={styles.labelCol}>
                <Text style={styles.label}>DEBUG · MANA</Text>
                <Text style={styles.sub}>drain or fill the combat slice</Text>
            </View>
            <View style={styles.buttonGroup}>
                <Pressable
                    style={styles.button}
                    onPress={() => setMana(0)}
                    accessibilityRole="button"
                    accessibilityLabel="Drain combat mana to zero"
                    testID="debug-mana-drain-button"
                >
                    <Text style={styles.buttonLabel}>DRAIN</Text>
                </Pressable>
                <Pressable
                    style={styles.button}
                    onPress={() => setMana(Number.MAX_SAFE_INTEGER)}
                    accessibilityRole="button"
                    accessibilityLabel="Fill combat mana to maximum"
                    testID="debug-mana-full-button"
                >
                    <Text style={styles.buttonLabel}>FULL</Text>
                </Pressable>
            </View>
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
    buttonGroup: { flexDirection: 'row', gap: 6 },
    button: {
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: AXM.sulfur,
        backgroundColor: AXM.bg,
    },
    buttonLabel: {
        fontFamily: FONTS.gothic,
        fontSize: 11,
        color: AXM.sulfur,
        letterSpacing: 1,
    },
});
