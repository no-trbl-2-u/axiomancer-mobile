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
            {slug === 'gather' && (
                <G>
                    {[60, 120, 180, 240, 300].map((x, i) => (
                        <G key={i}>
                            <Path d={`M${x} 220 L ${x + 12} 180 L ${x + 24} 220 Z`} fill={AXM.parchment} opacity={0.7} />
                            <Circle cx={x + 12} cy={170} r={3} fill={AXM.sulfur} />
                        </G>
                    ))}
                </G>
            )}
            {slug === 'treasure' && (
                <G transform="translate(187 170)">
                    <Path d="M-40 -10 L -40 30 L 40 30 L 40 -10 L 30 -20 L -30 -20 Z"
                        fill="#1a1810" stroke={AXM.sulfur} strokeWidth={2} />
                    <Circle cx={0} cy={10} r={5} fill={AXM.sulfur} />
                    <Path d="M-40 -10 L 40 -10" stroke={AXM.sulfur} strokeWidth={1.5} />
                </G>
            )}
            {slug === 'npc-generic' && (
                <G transform="translate(187 170)">
                    <Ellipse cx={0} cy={-10} rx={18} ry={22} fill="#0a0a0a" stroke={AXM.parchment} strokeWidth={2} />
                    <Path d="M-25 25 L -25 70 L 25 70 L 25 25 Z" fill="#06050a" stroke={AXM.parchment} strokeWidth={1.5} />
                    <Circle cx={-6} cy={-12} r={2} fill={AXM.parchment} />
                    <Circle cx={6} cy={-12} r={2} fill={AXM.parchment} />
                </G>
            )}
        </Svg>
    );
}
