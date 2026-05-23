/**
 * Dev-only manual combat trigger (Phase 54 + Phase 53 follow-up,
 * via /jot 39695a5).
 *
 * The STRIFE tab is hidden by the tab mutex (Phase 50 tick D)
 * when no combat is active. Combat starts when an encounter
 * node resolves — but the first map has no encounter nodes
 * (per /jot c3c4e4e), so the user can't reach combat through
 * normal play. This button is the manual escape hatch:
 *
 *   tap → actions.startCombat(createMockEncounterEnemy())
 *       → enterCombat() flips the tab-mutex signal
 *       → router.push('/(tabs)/combat') navigates to STRIFE
 *
 * Renders null in production. Mounts beside the existing
 * AestheticDevToggle + DebugSeedButton on the SELF tab.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { isDevToolsEnabled } from '@/lib/buildProfile';
import { useCombatMode } from '@/state/combat-mode';
import { useGameActions } from '@/state/GameStoreProvider';
import { createMockEncounterEnemy } from '@/state/mocks/combat.mock';
import { AXM, FONTS } from '@/theme/axm';

export function DebugCombatButton() {
    const actions = useGameActions();
    const { enterCombat } = useCombatMode();
    const router = useRouter();

    if (!isDevToolsEnabled()) return null;

    const onPress = () => {
        actions.startCombat(createMockEncounterEnemy());
        enterCombat();
        router.push('/(tabs)/combat');
    };

    return (
        <View style={styles.row}>
            <View style={styles.labelCol}>
                <Text style={styles.label}>DEBUG · COMBAT</Text>
                <Text style={styles.sub}>start a mock encounter</Text>
            </View>
            <Pressable
                style={styles.button}
                onPress={onPress}
                accessibilityRole="button"
                accessibilityLabel="Start a debug combat encounter"
                testID="debug-combat-button"
            >
                <Text style={styles.buttonLabel}>STRIKE</Text>
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
        borderColor: AXM.blood,
        backgroundColor: AXM.bg,
    },
    buttonLabel: {
        fontFamily: FONTS.gothic,
        fontSize: 12,
        color: AXM.blood,
        letterSpacing: 1.5,
    },
});
