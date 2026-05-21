/**
 * Dev-only event-kind force override (Phase 61f).
 *
 * Five kind buttons inside the DevMenu (rest / gather / treasure /
 * quest / encounter). Tapping a kind sets the current map node's
 * event-pool override to the canonical pool for that kind via
 * `forceEventKindOnNode(mapId, nodeId, kind)`. The next
 * `resolveMapEvent(state)` call on that node fires the forced
 * kind instead of the node's canonical type.
 *
 * Per-node + per-kind sibling to `<DebugChaosToggle>` (Phase 58)
 * which chaos-mode-overrides every node to a multi-kind weighted
 * pool. Use this when the user wants a specific kind on the
 * current spot, not a randomized one.
 *
 * Renders null in production. Reads current map/node from
 * `state.world.currentMap`; no-ops cleanly if the player isn't
 * on a recognized continent map (`forceEventKindOnNode` returns
 * false if no pool matches).
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useGameStore } from '@/state/GameStoreProvider';
import { forceEventKindOnNode } from '@/state/exploration-maps/event-pools';
import type { NodeType } from '@/state/presenters/exploration.engine';
import { AXM, FONTS } from '@/theme/axm';

const FORCEABLE_KINDS: ReadonlyArray<{ key: NodeType; label: string }> = [
    { key: 'rest', label: 'REST' },
    { key: 'gather', label: 'GATHER' },
    { key: 'treasure', label: 'TREASURE' },
    { key: 'quest', label: 'QUEST' },
    { key: 'encounter', label: 'FIGHT' },
];

export function DebugEventKindForce() {
    const store = useGameStore();

    if (!__DEV__) return null;

    const onForce = (kind: NodeType) => {
        const world = store.getState().world;
        const map = world?.currentMap;
        if (!map) return;
        const mapId = map.name;
        const nodeId = map.currentNode;
        forceEventKindOnNode(mapId, nodeId, kind);
    };

    return (
        <View style={styles.root}>
            <View style={styles.labelRow}>
                <Text style={styles.label}>DEBUG · KIND</Text>
                <Text style={styles.sub}>force next event on current node</Text>
            </View>
            <View style={styles.buttonGroup}>
                {FORCEABLE_KINDS.map((entry) => (
                    <Pressable
                        key={entry.key}
                        style={styles.button}
                        onPress={() => onForce(entry.key)}
                        accessibilityRole="button"
                        accessibilityLabel={`Force next event on current node to kind ${entry.key}`}
                        testID={`debug-event-kind-${entry.key}`}
                    >
                        <Text style={styles.buttonLabel}>{entry.label}</Text>
                    </Pressable>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        marginTop: 8,
        marginHorizontal: 12,
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: AXM.ash,
        borderStyle: 'dashed',
        backgroundColor: AXM.panelBg,
    },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 },
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
    },
    buttonGroup: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    button: {
        paddingHorizontal: 8,
        paddingVertical: 4,
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
