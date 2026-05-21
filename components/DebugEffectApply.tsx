/**
 * Dev-only active-effect apply affordance (Phase 61e).
 *
 * Two buttons inside the DevMenu:
 *
 *   - `BUFF PLAYER` applies `buff_body_defense_up` to
 *     `player.effects` via the engine's `applyEffect` helper.
 *     Visible on the SELF tab's effects section + on the combat
 *     HUD's effect chips when combat is active.
 *   - `BLEED ENEMY` applies `debuff_bleed` to the current
 *     encounter's first enemy (engine 0.10.2 normalized
 *     Encounter shape, Phase 60b). No-ops cleanly when no
 *     combat is active (logs a console.warn in dev so the user
 *     knows to start combat first).
 *
 * Effect IDs are static per row — full picker UI is out of
 * scope for the dev affordance. Picks reflect a clean buff
 * (defense up) and a recognizable DoT debuff (bleed) so the
 * effect chips render with distinguishable copy on the
 * presenter surfaces.
 *
 * Renders null in production.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { applyEffect, effectsLibrary } from 'axiomancer-mechanics';

import { useGameStore } from '@/state/GameStoreProvider';
import { AXM, FONTS } from '@/theme/axm';

const PLAYER_BUFF_ID = 'buff_body_defense_up';
const ENEMY_DEBUFF_ID = 'debuff_bleed';

export function DebugEffectApply() {
    const store = useGameStore();

    if (!__DEV__) return null;

    const onBuffPlayer = () => {
        const effect = effectsLibrary.registry.get(PLAYER_BUFF_ID);
        if (!effect) return;
        const player = store.getState().player;
        const round = store.getState().combat?.round ?? 0;
        const { activeEffects } = applyEffect(
            [...(player.effects ?? [])],
            effect,
            round,
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        store.setState({
            player: { ...player, effects: activeEffects },
        } as any);
    };

    const onBleedEnemy = () => {
        const effect = effectsLibrary.registry.get(ENEMY_DEBUFF_ID);
        if (!effect) return;
        const combat = store.getState().combat;
        if (!combat || !combat.enemy) {
            // No active combat — dev-only escape hatch can't reach an enemy.
            // eslint-disable-next-line no-console
            console.warn('DebugEffectApply: no active combat enemy to debuff.');
            return;
        }
        const enemy = combat.enemy;
        const round = combat.round ?? 0;
        const { activeEffects } = applyEffect(
            [...(enemy.effects ?? [])],
            effect,
            round,
        );
        const nextEnemy = { ...enemy, effects: activeEffects };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        store.setState({
            combat: { ...combat, enemy: nextEnemy },
        } as any);
    };

    return (
        <View style={styles.row}>
            <View style={styles.labelCol}>
                <Text style={styles.label}>DEBUG · EFFECTS</Text>
                <Text style={styles.sub}>apply a buff / debuff</Text>
            </View>
            <View style={styles.buttonGroup}>
                <Pressable
                    style={styles.button}
                    onPress={onBuffPlayer}
                    accessibilityRole="button"
                    accessibilityLabel="Apply a defense buff to the player"
                    testID="debug-effect-buff-player"
                >
                    <Text style={styles.buttonLabel}>BUFF · ME</Text>
                </Pressable>
                <Pressable
                    style={styles.button}
                    onPress={onBleedEnemy}
                    accessibilityRole="button"
                    accessibilityLabel="Apply bleed to the current combat enemy"
                    testID="debug-effect-bleed-enemy"
                >
                    <Text style={styles.buttonLabel}>BLEED · FOE</Text>
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
