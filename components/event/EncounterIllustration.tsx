import { StyleSheet } from 'react-native';
import Svg, { Path, Circle, Ellipse, Line, G } from 'react-native-svg';

import { AXM } from '@/theme/axm';

export function EncounterIllustration() {
    return (
        <Svg viewBox="0 0 374 320" width="100%" height="100%" style={StyleSheet.absoluteFillObject}>
            <Line x1={0} y1={200} x2={374} y2={200} stroke={AXM.bone} strokeWidth={0.5} opacity={0.4} />
            {[40, 100, 280, 340].map((x, i) => (
                <G key={i}>
                    <Path d={`M${x} 60 L ${x} 220`} stroke={AXM.parchment} strokeWidth={2} />
                    <Path d={`M${x - 30} 90 L ${x + 30} 90 M ${x - 25} 130 L ${x + 20} 125`} stroke={AXM.parchment} strokeWidth={1.5} />
                    <Ellipse cx={x} cy={130} rx={3} ry={6} fill={AXM.parchment} />
                    <Line x1={x - 20} y1={90} x2={x - 20} y2={115} stroke={AXM.parchment} strokeWidth={1} />
                    <Circle cx={x - 20} cy={120} r={4} fill="#0a0a0a" stroke={AXM.parchment} strokeWidth={1} />
                </G>
            ))}
            <G transform="translate(187 200)">
                <Ellipse cx={0} cy={0} rx={60} ry={12} fill="#06050a" stroke={AXM.parchment} strokeWidth={1} />
                <Path d="M-50 0 L -55 -20 L -40 -30 L -25 -10 L -10 -38 L 5 -22 L 25 -45 L 38 -25 L 50 -8 L 55 0 Z"
                    fill="#0a0a0a" stroke={AXM.parchment} strokeWidth={1.5} />
                <G transform="translate(0 -50)">
                    <Ellipse cx={0} cy={0} rx={14} ry={20} fill="#0a0a0a" stroke={AXM.parchment} strokeWidth={1.5} />
                    {[[-6, -8], [6, -8], [-8, -2], [8, -2], [0, -12]].map((p, i) => (
                        <Circle key={i} cx={p[0]} cy={p[1]} r={1.5} fill={AXM.blood} />
                    ))}
                    <Path d="M-12 0 L -28 8 L -22 18 M 12 0 L 28 8 L 22 18 M -10 14 L -20 26 M 10 14 L 20 26"
                        stroke={AXM.parchment} strokeWidth={1.5} fill="none" />
                    <Path d="M-8 6 L 8 6" stroke={AXM.blood} strokeWidth={1.5} />
                </G>
            </G>
            <Circle cx={60} cy={50} r={20} fill="none" stroke={AXM.parchment} strokeWidth={1.5} />
            <Path d="M50 50 q 10 -8 20 0" stroke={AXM.blood} strokeWidth={1.5} fill="none" />
            <G stroke={AXM.bone} strokeWidth={0.5} opacity={0.3}>
                {Array.from({ length: 60 }).map((_, i) => (
                    <Line key={i} x1={i * 7} y1={210 + (i % 4) * 3} x2={i * 7 + 10} y2={210 + (i % 4) * 3} />
                ))}
            </G>
        </Svg>
    );
}
