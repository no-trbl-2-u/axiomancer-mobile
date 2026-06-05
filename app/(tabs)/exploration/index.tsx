import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTooltip } from '@/hooks/useTooltip';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { AXM, FONTS } from '@/theme/axm';
import { ScreenBg } from '@/components/ScreenBg';
import { StatusCard } from '@/components/StatusCard';
import { SectionLabel } from '@/components/SectionLabel';
import { NodeMark } from '@/components/NodeMark';
import { ActionIcon } from '@/components/ActionIcon';
import { Splatter } from '@/components/Splatter';
import { ExplorationCodexHeader } from '@/components/ExplorationCodexHeader';
import { useAesthetic } from '@/state/aesthetic-mode';
import { useCombatMode } from '@/state/combat-mode';
import { selectExplorationCodexHeader } from '@/state/presenters/exploration.codex.engine';
import { useGameActions, useGameState, useGameStore } from '@/state/GameStoreProvider';
import {
    selectExplorationViewModel,
    type ExplorationNode,
    type ExplorationOption,
    type NodeType,
} from '@/state/presenters/exploration.engine';
import {
    selectEventViewModel,
    selectHasActiveEvent,
} from '@/state/presenters/event.engine';
import { EncounterModalOverlay } from '@/components/event/EncounterModalOverlay';

const EVENT_BADGE: Record<NodeType, { c: string; label: string }> = {
    encounter: { c: AXM.blood, label: 'ENCOUNTER' },
    treasure: { c: AXM.sulfur, label: 'TREASURE' },
    boss: { c: AXM.blood, label: 'BOSS' },
    quest: { c: AXM.sulfur, label: 'QUEST' },
    rest: { c: AXM.rust, label: 'REST' },
    gather: { c: AXM.bone, label: 'GATHER' },
    current: { c: AXM.sulfur, label: 'HERE' },
};

const OPTION_ICON: Record<NodeType, string> = {
    rest: 'flame',
    gather: 'bag',
    current: 'eye',
    encounter: 'flee',
    treasure: 'scroll',
    boss: 'sword',
    quest: 'scroll',
};

export default function ExplorationScreen() {
    const {
        enterCombat,
        inEncounterModal,
        openEncounterModal,
        recordDeepestNode,
    } = useCombatMode();
    const { mode: aesthetic } = useAesthetic();
    const store = useGameStore();
    const actions = useGameActions();
    // Per the design's prototype.jsx flow, tapping a non-available node
    // surfaces a brief lowercase-ritual toast then auto-clears. Local
    // UI state; not on the presenter contract — pure feedback.
    const [nodeTip, setNodeTip] = useState<string | null>(null);
    useEffect(() => {
        if (nodeTip === null) return;
        const handle = setTimeout(() => setNodeTip(null), 1600);
        return () => clearTimeout(handle);
    }, [nodeTip]);
    // Subscribe to the world slice so the screen re-renders on moves
    // and map transitions. The selector pattern is the same as inventory.
    const world = useGameState((s) => (s as unknown as { world: unknown }).world);
    const eventSlice = useGameState((s) => s.event);
    const combat = useGameState((s) => s.combat);
    const quests = useGameState((s) => s.quests);
    const flags = useGameState((s) => s.flags);
    const vm = useMemo(
        () => selectExplorationViewModel(store.getState()),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [store, world],
    );
    // Encounter-modal overlay state (Phase 32 design-handoff port).
    // The overlay mounts when the engine has a pending combat-prelude
    // event and combat hasn't started yet. Same VM the standalone
    // `app/event` route reads; this is a second consumer of it.
    const eventVm = useMemo(
        () => selectEventViewModel({ event: eventSlice, combat, quests, flags } as never),
        [eventSlice, combat, quests, flags],
    );
    const hasEvent = useMemo(
        () => selectHasActiveEvent({ event: eventSlice, combat } as never),
        [eventSlice, combat],
    );
    // Phase 63c — the modal mount lifecycle now spans the full
    // encounter session (prelude → combat → aftermath), not just
    // the moment `selectHasActiveEvent` returns true. Once combat
    // starts, `selectHasActiveEvent` flips false (it short-circuits
    // when `state.combat !== null` — Spec 08 Q4 = Future spec for
    // mid-combat events), which would otherwise unmount the modal
    // mid-encounter. The `inEncounterModal` flag (combat-mode)
    // keeps the modal mounted across that boundary.
    const preludeReady = hasEvent && eventVm.kind === 'combat-prelude';
    const showEncounterModal = inEncounterModal || preludeReady;

    // Open the encounter session the first time the prelude appears
    // for a given event. The flag is the modal's lifecycle anchor;
    // the modal itself drives the close via aftermath dismissal
    // (Phase 63c follow-on or 63d).
    useEffect(() => {
        if (preludeReady && !inEncounterModal) {
            openEncounterModal();
        }
    }, [preludeReady, inEncounterModal, openEncounterModal]);

    const nodeById = useMemo(() => {
        const m = new Map<string, ExplorationNode>();
        for (const n of vm.nodes) m.set(n.id, n);
        return m;
    }, [vm.nodes]);

    // Phase 107 — Create set of node IDs that should show labels
    // (only unvisited available nodes that are currently shown as options)
    const labeledNodeIds = useMemo(() => {
        return new Set(vm.options.slice(0, 4).map(opt => opt.nodeId));
    }, [vm.options]);

    // Pinch + pan over the map view (Q2=B). Reanimated shared values
    // drive a single transform; gestures compose simultaneously so the
    // user can zoom and drag at once.
    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const tx = useSharedValue(0);
    const ty = useSharedValue(0);
    const savedTx = useSharedValue(0);
    const savedTy = useSharedValue(0);

    const pinch = Gesture.Pinch()
        .onUpdate((e) => {
            const next = savedScale.value * e.scale;
            scale.value = Math.min(3, Math.max(0.6, next));
        })
        .onEnd(() => {
            savedScale.value = scale.value;
        });

    const pan = Gesture.Pan()
        .onUpdate((e) => {
            tx.value = savedTx.value + e.translationX;
            ty.value = savedTy.value + e.translationY;
        })
        .onEnd(() => {
            savedTx.value = tx.value;
            savedTy.value = ty.value;
        });

    const composed = Gesture.Simultaneous(pinch, pan);

    const mapTransform = useAnimatedStyle(() => ({
        transform: [
            { translateX: tx.value },
            { translateY: ty.value },
            { scale: scale.value },
        ],
    }));

    const onNodePress = (node: ExplorationNode) => {
        // Per the prototype.jsx flow (design handoff 2026-05-19 entry
        // file): tapping a locked or completed node surfaces a brief
        // toast acknowledging the no-op, then auto-dismisses. Previous
        // behavior returned silently — players couldn't tell whether
        // the tap registered. Sealed node message updated to match
        // Phase 94 specification.
        if (node.kind === 'locked') {
            setNodeTip('This path is sealed.');
            return;
        }
        if (node.kind === 'completed') {
            setNodeTip('walked already');
            return;
        }
        if (node.kind !== 'available') return;
        const result = actions.moveTo(node.id);
        // Phase 70 Tick C — run-stats counter. Each successful move
        // updates the deepest-node-id reading; the defeat panel
        // surfaces it in the run-summary ledger. Records on move,
        // not on node-tap, so failed taps (locked / completed) don't
        // bump the figure.
        if (result.moved) {
            recordDeepestNode(node.id);
        }
        // Phase 32 design-handoff port (2026-05-16): encounter / boss
        // taps no longer fast-path straight into combat. Instead the
        // arrival resolves the map event, populating the pending event
        // slice; the screen's render path then mounts
        // <EncounterModalOverlay> over the map so the player must pick
        // FIGHT or FLEE (chat1: "user cannot exit these modals"). Phase
        // 63b (2026-05-21) extended this so combat itself plays inside
        // the same modal — FIGHT transitions the overlay's internal mode
        // 'prelude' → 'combat' and renders <CombatPanel> in-place
        // instead of routing to the /combat tab.
        if (result.moved && node.triggersCombat) {
            actions.resolveCurrentMapEvent();
        }
    };

    const onEncounterFight = () => {
        // Phase 63b — modal-contained encounter. Drop the
        // `router.replace('/combat')` call; the EncounterModalOverlay
        // now transitions its internal mode 'prelude' → 'combat' on
        // FIGHT and renders <CombatPanel> in-place. Aftermath +
        // dismissal back to exploration land in Phase 63c.
        actions.pickEventChoice('fight');
        enterCombat();
    };

    const onEncounterFlee = () => {
        actions.pickEventChoice('flee');
    };

    const onOptionPress = (option: ExplorationOption) => {
        const node = nodeById.get(option.nodeId);
        if (!node) return;
        onNodePress(node);
    };

    return (
        <ScreenBg>
            <StatusCard />

            {aesthetic === 'codex' && (() => {
                const { left, right } = selectExplorationCodexHeader(vm);
                return <ExplorationCodexHeader left={left} right={right} />;
            })()}

            {/* Region Header */}
            <View style={styles.regionHeader}>
                <View>
                    <SectionLabel size={9} style={styles.continentLabel}>{vm.continent}</SectionLabel>
                    <Text style={styles.regionTitle}>{vm.region}</Text>
                    <Text style={styles.regionSub}>{vm.regionProgress}</Text>
                </View>
            </View>

            {/* Node Graph */}
            <View style={styles.graphWrap}>
                <View style={[StyleSheet.absoluteFillObject, styles.graphBackground]} />
                <Splatter color={AXM.blood} size={170} seed={3} style={styles.bloodSplatter} />
                <Splatter color={AXM.sulfur} size={130} seed={9} style={styles.sulfurSplatter} />

                {/* Compass */}
                <Text style={styles.compass}>N ↑ · scale: leagues</Text>
                <Text style={styles.nodeGraphLabel}>NODE GRAPH</Text>

                <GestureDetector gesture={composed}>
                    <Animated.View style={[StyleSheet.absoluteFillObject, mapTransform]}>
                        {/* SVG edges */}
                        <Svg viewBox="0 0 360 400" width="100%" height="100%" style={StyleSheet.absoluteFillObject}>
                            {vm.edges.map((e, i) => {
                                const A = nodeById.get(e.fromId);
                                const B = nodeById.get(e.toId);
                                if (!A || !B) return null;
                                const mx = (A.x + B.x) / 2 + Math.sin(i * 3) * 12;
                                const my = (A.y + B.y) / 2 + Math.cos(i * 5) * 10;
                                return (
                                    <G key={`${e.fromId}|${e.toId}`}>
                                        <Path
                                            d={`M ${A.x} ${A.y} Q ${mx} ${my} ${B.x} ${B.y}`}
                                            stroke={e.traveled ? AXM.parchment : (e.locked ? AXM.ash : AXM.bone)}
                                            strokeWidth={e.traveled ? 2.5 : 1.6}
                                            strokeDasharray={e.locked ? '4 4' : undefined}
                                            fill="none"
                                            opacity={e.traveled ? 0.9 : 0.6}
                                            strokeLinecap="round"
                                        />
                                        {e.traveled && <Circle cx={mx} cy={my} r={2} fill={AXM.sulfur} />}
                                    </G>
                                );
                            })}
                            <G opacity={0.4} stroke={AXM.bone} strokeWidth={1} fill="none">
                                <Path d="M40 250 q 20 -20 40 -10 q 10 12 -10 18 q -22 4 -30 -8 z" />
                                <Path d="M250 280 q 30 -20 60 -5 q 8 18 -20 22 q -38 -2 -40 -17 z" />
                            </G>
                        </Svg>

                        {/* Node markers */}
                        {vm.nodes.map((n) => (
                            <MapNodeMarker 
                                key={n.id} 
                                node={n} 
                                onNodePress={onNodePress} 
                                shouldShowLabel={labeledNodeIds.has(n.id)} 
                            />
                        ))}
                    </Animated.View>
                </GestureDetector>

                {vm.eventCallout && (
                    <View style={styles.eventCallout}>
                        <View style={styles.eventCalloutRow}>
                            <ActionIcon kind={vm.eventCallout.iconKey} size={20} color={AXM.blood} />
                            <SectionLabel size={9} color={AXM.blood}>NEW EVENT</SectionLabel>
                        </View>
                        <Text style={styles.eventCalloutText}>{vm.eventCallout.title}</Text>
                    </View>
                )}

                <View style={styles.legend}>
                    <Text style={styles.legendText}>{vm.legend.left}</Text>
                    <Text style={styles.legendText}>{vm.legend.right}</Text>
                </View>
            </View>

            {/* Node options drawer (Q6) — available next steps with thematic blurb */}
            <View style={styles.drawer}>
                <View style={styles.drawerHeader}>
                    <SectionLabel size={10}>{vm.drawerCopy.title}</SectionLabel>
                </View>
                {vm.options.length === 0 ? (
                    <View style={styles.drawerEmpty} testID="options-empty">
                        <Text style={styles.drawerEmptyText}>{vm.drawerCopy.emptyMessage}</Text>
                    </View>
                ) : (
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.stepCardScroll}
                    >
                        {vm.options.slice(0, 4).map((opt) => {
                            const accent =
                                opt.type === 'encounter' || opt.type === 'boss'
                                    ? AXM.blood
                                    : opt.type === 'treasure'
                                      ? AXM.sulfur
                                      : AXM.parchment;
                            return (
                                <TouchableOpacity
                                    key={opt.nodeId}
                                    style={[styles.stepCard, { borderLeftColor: accent }]}
                                    onPress={() => onOptionPress(opt)}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Travel to ${opt.label}, ${opt.leagues} leagues away`}
                                    testID={`option-${opt.nodeId}`}
                                >
                                    <View style={[styles.stepCardIconBox, { borderColor: AXM.bone }]}>
                                        <ActionIcon
                                            kind={OPTION_ICON[opt.type]}
                                            size={18}
                                            color={accent}
                                        />
                                    </View>
                                    <View style={styles.stepCardMid}>
                                        <Text style={styles.stepCardTitle} numberOfLines={1}>
                                            {opt.label}
                                        </Text>
                                        <Text style={styles.stepCardHint} numberOfLines={1}>
                                            {opt.description.toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={styles.stepCardLeagues}>
                                        <Text style={styles.stepCardLeaguesLabel}>{vm.drawerCopy.leaguesLabel}</Text>
                                        <Text style={styles.stepCardLeaguesNum}>{opt.leagues}</Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                )}
            </View>

            {showEncounterModal && (
                <EncounterModalOverlay
                    vm={eventVm}
                    onFight={onEncounterFight}
                    onFlee={onEncounterFlee}
                />
            )}
            {nodeTip !== null && <NodeToast tip={nodeTip} />}
            {/* Phase 70 Tick B — `<AftermathBanner>` retired. Both
              * victory and parley outcomes now render inside
              * `<EncounterModalOverlay>` via `<CombatVictoryPanel>`
              * / `<CombatFriendshipPanel>`. Defeat (Tick C pending)
              * and flee paths intentionally don't surface anything
              * on the exploration screen — the seal dismisses
              * silently in those cases. */}
        </ScreenBg>
    );
}

/**
 * Locked / consumed node feedback toast with a fade-in entrance.
 * Phase 44 port from prototype.jsx:633-637 `@keyframes fade`
 * (opacity 0 → 1, 200ms). The parent unmounts the toast on
 * timeout (the existing useEffect at line 60-65); this component
 * handles the mount-time fade-in only.
 */
/**
 * MapNodeMarker — per-node touch target on the exploration map.
 *
 * Single-tap commits movement (existing onNodePress behaviour);
 * long-press fires the kind:'map-node' tooltip (Phase 74 follow-up
 * walkthrough — Exploration Tick 1). Mirrors the Phase 75
 * skill-row pattern: tap is reserved for the action, long-press
 * for the explanation. Extracted from the parent's map() body so
 * each node owns its own measure ref.
 */
function MapNodeMarker({
    node: n,
    onNodePress,
    shouldShowLabel,
}: {
    node: ExplorationNode;
    onNodePress: (n: ExplorationNode) => void;
    shouldShowLabel: boolean;
}) {
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
                <View style={[styles.nodeLabel, { backgroundColor: dim ? 'rgba(10,10,10,0.95)' : 'rgba(10,10,10,0.85)' }]}>
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

function NodeToast({ tip }: { tip: string }) {
    const opacity = useSharedValue(0);
    useEffect(() => {
        opacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.ease) });
    }, [opacity]);
    const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

    return (
        <Animated.View
            pointerEvents="none"
            style={[styles.nodeToast, animStyle]}
            testID="exploration-node-toast"
        >
            <Text style={styles.nodeToastText}>{tip}</Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    regionHeader: {
        paddingHorizontal: 14,
        paddingTop: 12,
        paddingBottom: 4,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    regionTitle: {
        fontFamily: FONTS.gothic,
        fontSize: 26,
        lineHeight: 28,
        color: AXM.parchment,
        marginTop: 2,
    },
    regionSub: {
        fontFamily: FONTS.serif,
        fontSize: 11,
        color: AXM.bone,
        fontStyle: 'italic',
        marginTop: 1,
    },
    graphWrap: {
        marginHorizontal: 10,
        marginVertical: 6,
        height: 400,
        position: 'relative',
        overflow: 'hidden',
    },
    compass: {
        position: 'absolute',
        top: 10,
        left: 10,
        fontFamily: FONTS.mono,
        fontSize: 9,
        color: AXM.bone,
        letterSpacing: 1,
        zIndex: 2,
    },
    nodeGraphLabel: {
        position: 'absolute',
        top: 10,
        right: 12,
        fontFamily: FONTS.gothic,
        fontSize: 14,
        color: AXM.parchment,
        opacity: 0.6,
        letterSpacing: 2,
        zIndex: 2,
    },
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
        backgroundColor: 'rgba(10,10,10,0.85)',
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
    eventCallout: {
        position: 'absolute',
        top: 50,
        right: 12,
        width: 130,
        backgroundColor: AXM.bg,
        borderWidth: 1,
        borderColor: AXM.blood,
        padding: 8,
        zIndex: 4,
    },
    eventCalloutRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    eventCalloutText: {
        fontFamily: FONTS.gothic,
        fontSize: 13,
        color: AXM.parchment,
        marginTop: 2,
        lineHeight: 15,
    },
    legend: {
        position: 'absolute',
        bottom: 8,
        left: 12,
        right: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        zIndex: 2,
    },
    legendText: {
        fontFamily: FONTS.mono,
        fontSize: 8,
        color: AXM.bone,
        letterSpacing: 1,
    },
    drawer: {
        paddingHorizontal: 10,
        paddingBottom: 8,
    },
    drawerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        paddingHorizontal: 4,
        paddingBottom: 4,
    },
    drawerEmpty: {
        marginHorizontal: 4,
        paddingVertical: 18,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: AXM.ash,
        borderStyle: 'dashed',
    },
    drawerEmptyText: {
        fontFamily: FONTS.serifItalic,
        fontSize: 13,
        color: AXM.bone,
    },
    stepCardScroll: {
        gap: 6,
        paddingVertical: 2,
    },
    stepCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: AXM.panelBg,
        borderWidth: 1,
        borderColor: 'rgba(232, 223, 200, 0.12)',
        borderLeftWidth: 2,
    },
    stepCardIconBox: {
        width: 28,
        height: 28,
        borderWidth: 1,
        backgroundColor: AXM.bg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepCardMid: {
        flex: 1,
        minWidth: 0,
    },
    stepCardTitle: {
        fontFamily: FONTS.serif,
        fontSize: 14,
        color: AXM.parchment,
        lineHeight: 16,
    },
    stepCardHint: {
        fontFamily: FONTS.sans,
        fontSize: 9,
        color: AXM.bone,
        letterSpacing: 1.6,
        marginTop: 3,
    },
    stepCardLeagues: {
        alignItems: 'flex-end',
        gap: 2,
    },
    stepCardLeaguesLabel: {
        fontFamily: FONTS.mono,
        fontSize: 9,
        color: AXM.bone,
    },
    stepCardLeaguesNum: {
        fontFamily: FONTS.mono,
        fontSize: 18,
        color: AXM.parchment,
    },
    // Locked / consumed node feedback toast (port design spec — design's
    // prototype.jsx flow). Bottom-center, brief auto-dismiss, parchment
    // text over an ash-bordered panel.
    nodeToast: {
        position: 'absolute',
        bottom: 32,
        left: 24,
        right: 24,
        backgroundColor: AXM.panelBg,
        borderWidth: 1,
        borderColor: AXM.bone,
        padding: 10,
        alignItems: 'center',
    },
    nodeToastText: {
        fontFamily: FONTS.serifItalic,
        fontSize: 12,
        color: AXM.parchment,
    },
    continentLabel: {
        color: AXM.bone,
    },
    graphBackground: {
        backgroundColor: '#16130d',
    },
    bloodSplatter: {
        position: 'absolute',
        top: -10,
        right: -10,
        opacity: 0.35,
    },
    sulfurSplatter: {
        position: 'absolute',
        bottom: 30,
        left: -20,
        opacity: 0.18,
    },
});
