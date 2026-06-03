/**
 * Token primitives — the resource pool that replaces MP.
 *
 * Five tokens accrue during combat (body · mind · heart · fallacy · paradox).
 * Each skill demands a combination (Skill.resourceCost on the engine side,
 * `axiomancer-mechanics@0.6.x`), not a single mana number.
 *
 * Pure UI: no store reads, no engine calls. Caller passes `tokens` and
 * `cost` in; helpers like `canAfford` live alongside in tokens.fixture.
 *
 * Ported from `axiomancer/project/screens/tokens.jsx` in the design handoff,
 * adapted for React Native + react-native-svg.
 */

import React from 'react';
import { View, Text, StyleSheet, type TextStyle } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

import { AXM, FONTS } from '@/theme/axm';
import {
    TOKEN,
    TOKEN_KEYS,
    type TokenKey,
    type TokenCounts,
} from '@/state/mocks/tokens.fixture';

export interface TokenIconProps {
    kind: TokenKey;
    size?: number;
    color?: string;
}

/** Tiny woodcut glyph for a single token type. */
export function TokenIcon({ kind, size = 16, color }: TokenIconProps) {
    const c = color ?? TOKEN[kind].color;
    switch (kind) {
        case 'body':
            return (
                <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
                    <Path
                        d="M3 7 C 3 5, 5 4, 7 4 L 12 4 C 13 4, 13.5 5, 13.5 6 L 13.5 10 C 13.5 12, 12 13, 10 13 L 6 13 C 4 13, 3 12, 3 10.5 Z"
                        fill={c} fillOpacity={0.25}
                        stroke={c} strokeWidth={1.4} strokeLinejoin="round" strokeLinecap="round"
                    />
                    <Path d="M5.5 6 V 4.8 M 8 6 V 4.8 M 10.5 6 V 4.8 M 13 6 V 4.8"
                        stroke={c} strokeWidth={1.4} strokeLinecap="round" />
                    <Path d="M3 8.5 H 13.5" stroke={c} strokeWidth={1.4} strokeLinecap="round" />
                </Svg>
            );
        case 'mind':
            return (
                <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
                    <Path
                        d="M1.5 8 C 4 4, 12 4, 14.5 8 C 12 12, 4 12, 1.5 8 Z"
                        fill={c} fillOpacity={0.18} stroke={c} strokeWidth={1.3} strokeLinejoin="round"
                    />
                    <Circle cx={8} cy={8} r={2.3} fill={c} />
                    <Circle cx={8.7} cy={7.4} r={0.6} fill={AXM.bg} />
                </Svg>
            );
        case 'heart':
            return (
                <Svg width={size} height={size} viewBox="0 0 16 16">
                    <Path
                        d="M8 13.5 C 2.5 9.5, 1.5 6, 3 4 C 5 2, 7 3, 8 5 C 9 3, 11 2, 13 4 C 14.5 6, 13.5 9.5, 8 13.5 Z"
                        fill={c} stroke={c} strokeWidth={0.8} strokeLinejoin="round"
                    />
                    <Path d="M5 5 L 7 7 M 11 5 L 9 7"
                        stroke={AXM.bg} strokeWidth={0.8} opacity={0.6} />
                </Svg>
            );
        case 'fallacy':
            return (
                <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
                    <Circle cx={8} cy={8} r={6.5}
                        stroke={c} strokeWidth={1} strokeDasharray="1.5,1.2" fill="none" />
                    <Path d="M4 4 L 12 12 M 12 4 L 9 7 M 4 12 L 7 9"
                        stroke={c} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
            );
        case 'paradox':
            return (
                <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
                    <Path
                        d="M3 8 C 3 6, 4.5 4.5, 6 4.5 C 7.5 4.5, 8 6, 8 8 C 8 10, 8.5 11.5, 10 11.5 C 11.5 11.5, 13 10, 13 8 C 13 6, 11.5 4.5, 10 4.5 C 8.5 4.5, 8 6, 8 8 C 8 10, 7.5 11.5, 6 11.5 C 4.5 11.5, 3 10, 3 8 Z"
                        stroke={c} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"
                    />
                </Svg>
            );
        default:
            return null;
    }
}

export interface TokenChipProps {
    kind: TokenKey;
    count?: number;
    dim?: boolean;
    glow?: boolean;
    compact?: boolean;
}

/** Single chip showing one token type with its count. Five fit in a row on a phone. */
export function TokenChip({ kind, count = 0, dim = false, glow = false, compact = false }: TokenChipProps) {
    const t = TOKEN[kind];
    const has = count > 0;
    return (
        <View
            style={[
                styles.chip,
                {
                    minWidth: compact ? 36 : 44,
                    paddingVertical: compact ? 2 : 3,
                    paddingHorizontal: compact ? 4 : 5,
                    backgroundColor: has ? t.bg : AXM.bg,
                    borderColor: has ? t.color : AXM.ash,
                    opacity: dim ? 0.4 : 1,
                },
                glow && has && { shadowColor: t.color, shadowOpacity: 0.9, shadowRadius: 6, elevation: 6 },
            ]}
        >
            <TokenIcon kind={kind} size={compact ? 14 : 16} color={has ? t.color : AXM.bone} />
            <Text
                style={[
                    compact ? styles.compactCount : styles.regularCount,
                    { color: has ? t.color : AXM.bone }
                ]}
            >{count}</Text>
            <Text
                style={[
                    styles.shortLabel,
                    { color: has ? t.color : AXM.bone }
                ]}
            >{t.short}</Text>
        </View>
    );
}

export interface TokenRackProps {
    tokens?: Partial<TokenCounts>;
    highlightKind?: TokenKey | null;
    compact?: boolean;
}

/** Live pool — replaces the MP bar in the combat HUD. Always visible in combat. */
export function TokenRack({ tokens = {}, highlightKind = null, compact = false }: TokenRackProps) {
    return (
        <View style={[styles.rack, { paddingVertical: compact ? 2 : 4, paddingHorizontal: 4 }]}>
            {!compact && (
                <View style={styles.rackLabelCol}>
                    <Text style={[styles.rackLabel, { fontSize: 8 }]}>⚱</Text>
                    <Text style={[styles.rackLabel, { fontSize: 7 }]}>POOL</Text>
                </View>
            )}
            {TOKEN_KEYS.map(k => (
                <TokenChip
                    key={k}
                    kind={k}
                    count={tokens[k] ?? 0}
                    glow={highlightKind === k && (tokens[k] ?? 0) > 0}
                    compact={compact}
                />
            ))}
        </View>
    );
}

export interface TokenCostProps {
    cost?: Partial<TokenCounts>;
    tokens?: Partial<TokenCounts>;
    size?: number;
    dense?: boolean;
}

/**
 * Per-skill cost: a flat row of small pips, one per required token unit.
 * Pips lacking the corresponding token render as dashed outlines.
 */
export function TokenCost({ cost = {}, tokens = {}, size = 14, dense = false }: TokenCostProps) {
    const entries: TokenKey[] = TOKEN_KEYS.flatMap(k => Array.from({ length: cost[k] || 0 }, () => k));
    if (entries.length === 0) {
        return <Text style={styles.freeCostLabel}>FREE</Text>;
    }
    const owed: TokenCounts = { body: 0, mind: 0, heart: 0, fallacy: 0, paradox: 0 };
    const lacks = entries.map(k => {
        owed[k] += 1;
        return (tokens[k] ?? 0) < owed[k];
    });
    return (
        <View style={[styles.costRow, { gap: dense ? 2 : 3 }]}>
            {entries.map((k, i) => {
                const c = TOKEN[k];
                const missing = lacks[i];
                return (
                    <View
                        key={i}
                        style={[
                            styles.costPip,
                            {
                                width: size, 
                                height: size,
                                backgroundColor: missing ? 'transparent' : c.bg,
                                borderStyle: missing ? 'dashed' : 'solid',
                                borderColor: c.color,
                                opacity: missing ? 0.45 : 1,
                            }
                        ]}
                    >
                        <TokenIcon kind={k} size={size - 6} color={c.color} />
                    </View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    chip: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    compactCount: {
        fontFamily: FONTS.gothic,
        fontSize: 13,
        lineHeight: 14,
        marginTop: 1,
    } satisfies TextStyle,
    regularCount: {
        fontFamily: FONTS.gothic,
        fontSize: 16,
        lineHeight: 17,
        marginTop: 1,
    } satisfies TextStyle,
    shortLabel: {
        fontFamily: FONTS.mono,
        fontSize: 6,
        letterSpacing: 1,
        opacity: 0.75,
        marginTop: 1,
    } satisfies TextStyle,
    freeCostLabel: {
        fontFamily: FONTS.mono,
        fontSize: 9,
        color: AXM.bone,
        letterSpacing: 1,
    } satisfies TextStyle,
    costRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    costPip: {
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    rack: {
        flexDirection: 'row',
        gap: 4,
        backgroundColor: AXM.deepBg,
        borderWidth: 1,
        borderColor: AXM.ash,
        borderLeftWidth: 2,
        borderLeftColor: AXM.sulfur,
    },
    rackLabelCol: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingRight: 4,
        borderRightWidth: 1,
        borderRightColor: AXM.ash,
        borderStyle: 'dashed',
    },
    rackLabel: {
        fontFamily: FONTS.sans,
        letterSpacing: 1.5,
        color: AXM.bone,
        textTransform: 'uppercase',
    } satisfies TextStyle,
});
