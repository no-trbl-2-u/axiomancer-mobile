/**
 * Dev-only friendship counter override (Phase 62c).
 *
 * Two buttons inside the DevMenu:
 *
 *   - `+1`    — increment `state.combat.friendshipCounter` by 1
 *   - `RESET` — set the counter to 0
 *
 * Combat-only — the friendshipCounter lives on the engine
 * `CombatState`, so the affordance no-ops + console.warns when
 * no combat is active. Sibling pattern to `DebugEffectApply`'s
 * BLEED · FOE branch (warns when no enemy to debuff).
 *
 * Renders null outside `__DEV__`. Tests the parley-path end-of-
 * combat branch — the engine ends combat with the `friendship`
 * outcome when the counter hits `FRIENDSHIP_COUNTER_MAX`.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useGameStore } from '@/state/GameStoreProvider';
import { AXM, FONTS } from '@/theme/axm';

export function DebugFriendship() {
    const store = useGameStore();

    if (!__DEV__) return null;

    const onIncrement = () => {
        const combat = store.getState().combat;
        if (!combat) {
            // eslint-disable-next-line no-console
            console.warn('DebugFriendship: no active combat to mutate.');
            return;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        store.setState({
            combat: { ...combat, friendshipCounter: (combat.friendshipCounter ?? 0) + 1 },
        } as any);
    };

    const onReset = () => {
        const combat = store.getState().combat;
        if (!combat) {
            // eslint-disable-next-line no-console
            console.warn('DebugFriendship: no active combat to reset.');
            return;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        store.setState({
            combat: { ...combat, friendshipCounter: 0 },
        } as any);
    };

    return (
        <View style={styles.row}>
            <View style={styles.labelCol}>
                <Text style={styles.label}>DEBUG · FRIEND</Text>
                <Text style={styles.sub}>parley counter (combat-only)</Text>
            </View>
            <View style={styles.buttonGroup}>
                <Pressable
                    style={styles.button}
                    onPress={onIncrement}
                    accessibilityRole="button"
                    accessibilityLabel="Increment friendship counter by one"
                    testID="debug-friendship-increment"
                >
                    <Text style={styles.buttonLabel}>+1</Text>
                </Pressable>
                <Pressable
                    style={styles.button}
                    onPress={onReset}
                    accessibilityRole="button"
                    accessibilityLabel="Reset friendship counter to zero"
                    testID="debug-friendship-reset"
                >
                    <Text style={styles.buttonLabel}>RESET</Text>
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
