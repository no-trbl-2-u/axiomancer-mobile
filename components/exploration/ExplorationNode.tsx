import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AXM, FONTS } from '@/theme/axm';
import { NodeMark } from '@/components/NodeMark';
import { useTooltip } from '@/hooks/useTooltip';
import type { ExplorationNode as ExplorationNodeType, NodeType } from '@/state/presenters/exploration.engine';

const EVENT_BADGE: Record<NodeType, { c: string; label: string }> = {
    encounter: { c: AXM.blood, label: 'ENCOUNTER' },
    treasure: { c: AXM.sulfur, label: 'TREASURE' },
    boss: { c: AXM.blood, label: 'BOSS' },
    quest: { c: AXM.sulfur, label: 'QUEST' },
    rest: { c: AXM.rust, label: 'REST' },
    gather: { c: AXM.bone, label: 'GATHER' },
    current: { c: AXM.sulfur, label: 'HERE' },
    hazard: { c: AXM.rust, label: 'HAZARD' },
};

interface ExplorationNodeProps {
    node: ExplorationNodeType;
    onNodePress: (n: ExplorationNodeType) => void;
    shouldShowLabel: boolean;
}

/**
 * ExplorationNode — per-node touch target on the exploration map.
 *
 * Single-tap commits movement (existing onNodePress behaviour);
 * long-press fires the kind:'map-node' tooltip (Phase 74 follow-up
 * walkthrough — Exploration Tick 1). Mirrors the Phase 75
 * skill-row pattern: tap is reserved for the action, long-press
 * for the explanation. Extracted from the parent's map() body so
 * each node owns its own measure ref.
 */
export function ExplorationNode({ node: n, onNodePress, shouldShowLabel }: ExplorationNodeProps) {
    const tooltip = useTooltip();
    const ref = useRef<View | null>(null);
    const ev = EVENT_BADGE[n.type] ?? EVENT_BADGE.encounter;
    const left = (n.x - 18) / 360 * 100;
    const top = (n.y - 18) / 400 * 100;
    const dim = n.kind === 'locked';
    
    return (
        <TouchableOpacity
            ref={ref}
            accessibilityRole="button"
            accessibilityLabel={`${n.label}, ${
                n.kind === 'locked' ? 'sealed'
                    : n.kind === 'completed' ? 'walked'
                        : n.kind === 'current' ? 'here'
                            : 'open'
            }`}
            accessibilityHint="hold to read node type description"
            accessibilityState={{ disabled: n.kind !== 'available' }}
            onPress={() => onNodePress(n)}
            onLongPress={() => tooltip.show({ kind: 'map-node', id: n.type, anchorRef: ref })}
            activeOpacity={n.kind === 'available' ? 0.7 : 1}
            testID={`node-${n.id}`}
            style={[
                styles.nodeWrap,
                { left: `${left}%` as unknown as number, top: `${top}%` as unknown as number },
                dim && styles.nodeWrapLocked,
            ]}
        >
            <NodeMark kind={n.kind} size={36} />
            {n.kind === 'available' && shouldShowLabel && (
                <View style={[styles.nodeLabel, { backgroundColor: AXM.nodeBg }]}>
                    <Text style={[styles.nodeLabelText, { color: dim ? AXM.bone : AXM.parchment }]}>
                        {n.label}
                    </Text>
                </View>
            )}
            {n.kind === 'available' && shouldShowLabel && (
                <View style={[styles.nodeTypeBadge, { backgroundColor: ev.c }]}>
                    <Text style={styles.nodeTypeBadgeText}>{ev.label}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    nodeWrap: {
        position: 'absolute',
        width: 36,
        alignItems: 'center',
        zIndex: 3,
    },
    nodeWrapLocked: {
        opacity: 0.45,
    },
    nodeLabel: {
        marginTop: 2,
        paddingHorizontal: 4,
        paddingVertical: 1,
        backgroundColor: AXM.nodeBg,
    },
    nodeLabelText: {
        fontFamily: FONTS.sans,
        fontSize: 9,
        letterSpacing: 1.4,
        textTransform: 'uppercase',
    },
    nodeTypeBadge: {
        marginTop: 1,
        paddingHorizontal: 3,
        paddingVertical: 1,
    },
    nodeTypeBadgeText: {
        fontFamily: FONTS.sans,
        fontSize: 8,
        letterSpacing: 1,
        color: AXM.bg,
    },
});