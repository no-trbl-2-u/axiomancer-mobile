import { StyleSheet } from 'react-native';
import Svg, { Path, Circle, Ellipse, G, Line } from 'react-native-svg';

import { AXM } from '@/theme/axm';
import type { EventArtSlug } from '@/state/presenters/event-assets';

/**
 * Placeholder illustrations for non-encounter event kinds. Each is a
 * single procedural SVG keyed by slug; the real artwork ships via the
 * asset-swap workflow (see SVG_ASSET_SPEC.md). The visual variety is
 * deliberately minimal — the brief calls these out as "remain as
 * placeholders, but their slugs come from the engine."
 */
export function PlaceholderIllustration({ slug }: { slug: EventArtSlug }) {
    return (
        <Svg viewBox="0 0 374 320" width="100%" height="100%" style={StyleSheet.absoluteFillObject}>
            <G stroke={AXM.bone} strokeWidth={0.5} opacity={0.3}>
                {Array.from({ length: 60 }).map((_, i) => (
                    <Line key={i} x1={i * 7} y1={200 + (i % 4) * 3} x2={i * 7 + 10} y2={200 + (i % 4) * 3} />
                ))}
            </G>
            {slug === 'rest' && (
                <G>
                    <Path d="M120 220 L 187 130 L 254 220 Z" fill="#0a0a0a" stroke={AXM.parchment} strokeWidth={2} />
                    <Circle cx={187} cy={160} r={6} fill={AXM.sulfur} />
                    <Path d="M170 200 q 17 -20 34 0" stroke={AXM.blood} strokeWidth={1.5} fill="none" />
                </G>
            )}
            {slug === 'gathering' && (
                <G>
                    {[60, 120, 180, 240, 300].map((x, i) => (
                        <G key={i}>
                            <Path d={`M${x} 220 L ${x + 12} 180 L ${x + 24} 220 Z`} fill={AXM.parchment} opacity={0.7} />
                            <Circle cx={x + 12} cy={170} r={3} fill={AXM.sulfur} />
                        </G>
                    ))}
                </G>
            )}
            {slug === 'loot-cache' && (
                <G transform="translate(187 170)">
                    <Path d="M-40 -10 L -40 30 L 40 30 L 40 -10 L 30 -20 L -30 -20 Z"
                        fill="#1a1810" stroke={AXM.sulfur} strokeWidth={2} />
                    <Circle cx={0} cy={10} r={5} fill={AXM.sulfur} />
                    <Path d="M-40 -10 L 40 -10" stroke={AXM.sulfur} strokeWidth={1.5} />
                </G>
            )}
            {slug === 'interaction-generic' && (
                <G transform="translate(187 170)">
                    <Ellipse cx={0} cy={-10} rx={18} ry={22} fill="#0a0a0a" stroke={AXM.parchment} strokeWidth={2} />
                    <Path d="M-25 25 L -25 70 L 25 70 L 25 25 Z" fill="#06050a" stroke={AXM.parchment} strokeWidth={1.5} />
                    <Circle cx={-6} cy={-12} r={2} fill={AXM.parchment} />
                    <Circle cx={6} cy={-12} r={2} fill={AXM.parchment} />
                </G>
            )}
            {slug === 'village' && (
                <G transform="translate(187 200)">
                    {[-80, -30, 30, 80].map((x, i) => (
                        <G key={i} transform={`translate(${x} 0)`}>
                            <Path d="M-20 0 L 0 -25 L 20 0 L 20 30 L -20 30 Z" fill="#0a0a0a" stroke={AXM.parchment} strokeWidth={1.5} />
                            <Path d="M-5 10 L 5 10 L 5 28 L -5 28 Z" fill={AXM.parchment} opacity={0.4} />
                        </G>
                    ))}
                </G>
            )}
            {slug === 'cutscene' && (
                <G transform="translate(187 150)">
                    <Circle cx={0} cy={0} r={50} fill="none" stroke={AXM.sulfur} strokeWidth={1.5} opacity={0.6} />
                    <Circle cx={0} cy={0} r={30} fill="none" stroke={AXM.sulfur} strokeWidth={1} opacity={0.4} />
                    <Path d="M-10 0 L 10 0 M 0 -10 L 0 10" stroke={AXM.parchment} strokeWidth={1} />
                </G>
            )}
            {slug === 'hazard' && (
                <G transform="translate(187 180)">
                    <Path d="M-50 30 L 0 -40 L 50 30 Z" fill="none" stroke={AXM.blood} strokeWidth={2} />
                    <Path d="M0 -20 L 0 10 M 0 18 L 0 24" stroke={AXM.blood} strokeWidth={2} />
                </G>
            )}
        </Svg>
    );
}
