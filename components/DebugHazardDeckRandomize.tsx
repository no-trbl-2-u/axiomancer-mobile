/**
 * Dev-only hazard deck randomizer. Replaces the player's acquired
 * hazard cards with a random pull from EVERY defined card (starter +
 * reward pool), so deck-variety testing doesn't require grinding
 * reward picks. Renders null outside dev builds.
 */

import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { isDevToolsEnabled } from '@/lib/buildProfile';
import { useGameActions } from '@/state/GameStoreProvider';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

export function DebugHazardDeckRandomize() {
    const styles = useStyles();
    const actions = useGameActions();
    const [lastGrant, setLastGrant] = useState<string[] | null>(null);

    if (!isDevToolsEnabled()) return null;

    const onPress = () => {
        setLastGrant(actions.randomizeHazardDeck());
    };

    return (
        <View style={styles.row}>
            <View style={styles.labelCol}>
                <Text style={styles.label}>DEBUG · RANDOMIZE HAZARD DECK</Text>
                <Text style={styles.sub} numberOfLines={2}>
                    {lastGrant === null
                        ? 'random acquired cards from the full pool'
                        : `granted: ${lastGrant.join(', ')}`}
                </Text>
            </View>
            <Pressable
                style={styles.button}
                onPress={onPress}
                accessibilityRole="button"
                accessibilityLabel="Randomize the hazard deck from the full card pool"
                testID="debug-hazard-deck-randomize"
            >
                <Text style={styles.buttonLabel}>SHUFFLE FATE</Text>
            </Pressable>
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderTopWidth: 1,
        borderTopColor: AXM.ash,
    },
    labelCol: { flex: 1, paddingRight: 8 },
    label: { fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1.5, color: AXM.bone },
    sub: { fontFamily: FONTS.mono, fontSize: 9, color: AXM.ash, marginTop: 2 },
    button: {
        borderWidth: 1,
        borderColor: AXM.rust,
        paddingVertical: 6,
        paddingHorizontal: 14,
        backgroundColor: AXM.rustSubtle,
    },
    buttonLabel: { fontFamily: FONTS.gothic, fontSize: 14, letterSpacing: 2, color: AXM.rust },
}));
