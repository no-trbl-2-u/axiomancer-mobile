import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
} from 'react-native-reanimated';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { AXM } from '@/theme/axm';
import { Splatter } from '@/components/Splatter';
import type { ExplorationNode, ExplorationEdge } from '@/state/presenters/exploration.engine';

interface MapCanvasProps {
    nodes: readonly ExplorationNode[];
    edges: readonly ExplorationEdge[];
    children: React.ReactNode;
}

export function MapCanvas({ nodes, edges, children }: MapCanvasProps) {
    const nodeById = React.useMemo(() => {
        const m = new Map<string, ExplorationNode>();
        for (const n of nodes) m.set(n.id, n);
        return m;
    }, [nodes]);

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

    return (
        <View style={styles.graphWrap}>
            <View style={[StyleSheet.absoluteFillObject, styles.graphBackground]} />
            <Splatter color={AXM.blood} size={170} seed={3} style={styles.bloodSplatter} />
            <Splatter color={AXM.sulfur} size={130} seed={9} style={styles.sulfurSplatter} />

            <GestureDetector gesture={composed}>
                <Animated.View style={[StyleSheet.absoluteFillObject, mapTransform]}>
                    {/* SVG edges */}
                    <Svg viewBox="0 0 360 400" width="100%" height="100%" style={StyleSheet.absoluteFillObject}>
                        {edges.map((e, i) => {
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

                    {children}
                </Animated.View>
            </GestureDetector>
        </View>
    );
}

const styles = StyleSheet.create({
    graphWrap: {
        marginHorizontal: 10,
        marginVertical: 6,
        height: 400,
        position: 'relative',
        overflow: 'hidden',
    },
    graphBackground: {
        backgroundColor: AXM.deepBg,
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