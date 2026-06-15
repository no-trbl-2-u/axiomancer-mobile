import React, { useRef } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';
import { useTooltip } from '@/hooks/useTooltip';
import { StanceGlyph } from '@/components/StanceGlyph';
import type { StanceOption, StanceKey } from '@/state/presenters/combat.engine';

export interface StanceCardProps {
    opt: StanceOption;
    isSel: boolean;
    onPick: (s: StanceKey) => void;
    a11yLabel: string;
}

export function StanceCard({
    opt,
    isSel,
    onPick,
    a11yLabel,
}: StanceCardProps) {
    const styles = useStyles();
    const AXM = usePalette();
    const isAdv = opt.advantage === 'adv';
    const isDis = opt.advantage === 'dis';
    const accent = isAdv ? AXM.sulfur : isDis ? AXM.blood : AXM.parchment;
    const tooltip = useTooltip();
    const ref = useRef<View | null>(null);
    return (
        <View ref={ref} style={styles.outer}>
            <TouchableOpacity
                onPress={() => onPick(opt.key)}
                onLongPress={(isAdv || isDis) ? () => tooltip.show({ kind: 'stance-chip', id: opt.key, anchorRef: ref }) : undefined}
                style={styles.cardTouch}
                testID={`combat-stance-${opt.key}`}
                accessibilityRole="button"
                accessibilityLabel={`${a11yLabel}${(isAdv || isDis) ? ` with ${isAdv ? 'advantage' : 'disadvantage'}` : ''}`}
                accessibilityHint={(isAdv || isDis) ? 'hold to read advantage description' : undefined}
                accessibilityState={{ selected: isSel }}
            >
                <View style={[styles.card, { borderColor: isSel ? AXM.sulfur : accent, backgroundColor: isSel ? AXM.selectFill : AXM.bg }]}>
                    {(isAdv || isDis) && (
                        <View
                            style={[styles.advBadge, { borderColor: isAdv ? AXM.sulfur : AXM.blood }]}
                            testID={`combat-stance-${opt.key}-advdis`}
                            pointerEvents="none"
                        >
                            <Text style={[styles.advText, { color: isAdv ? AXM.sulfur : AXM.blood }]}>
                                {isAdv ? 'ADV' : 'DIS'}
                            </Text>
                        </View>
                    )}
                            <View style={styles.glyphWrap} pointerEvents="none">
                                <StanceGlyph kind={opt.key} size={32} color={accent} />
                            </View>
                            <Text style={[styles.stanceName, { color: accent }]} numberOfLines={1} adjustsFontSizeToFit>{opt.label}</Text>
                            <Text style={styles.stanceGloss} numberOfLines={2}>{opt.gloss}</Text>
                            <View style={styles.triangleMeta}>
                                <View style={styles.metaLine}>
                                    <Text style={styles.metaVerb}>BEATS</Text>
                                    <StanceGlyph kind={opt.counters.toLowerCase() as StanceKey} size={9} color={AXM.sulfur} />
                                    <Text style={[styles.metaTarget, { color: AXM.sulfur }]}>{opt.counters.slice(0, 3)}</Text>
                                </View>
                                <View style={styles.metaLine}>
                                    <Text style={styles.metaVerb}>WEAK</Text>
                                    <StanceGlyph kind={opt.weakTo.toLowerCase() as StanceKey} size={9} color={AXM.blood} />
                                    <Text style={[styles.metaTarget, { color: AXM.blood }]}>{opt.weakTo.slice(0, 3)}</Text>
                                </View>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.statRow}>
                                <Text style={styles.statKey}>ATK</Text>
                                <Text style={[styles.statVal, { color: accent }]}>{opt.derived.attack}</Text>
                            </View>
                            <View style={styles.statRow}>
                                <Text style={styles.statKey}>SKL</Text>
                                <Text style={[styles.statVal, { color: accent }]}>{opt.derived.skill}</Text>
                            </View>
                            <View style={styles.statRow}>
                                <Text style={styles.statKey}>DEF</Text>
                                <Text style={[styles.statVal, { color: accent }]}>{opt.derived.defense}</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    // Each card flexes to share the row evenly so all three stances fit
    // on a 390px screen (previously fixed at 160px, which overflowed and
    // clipped the edge stances — the MIND stance was unreachable).
    outer: {
        flex: 1,
    },
    cardTouch: {
        width: '100%',
        height: 214,
        borderRadius: 3,
    },
    card: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 3,
        backgroundColor: AXM.bg,
        padding: 7,
        alignItems: 'center',
        position: 'relative',
    },
    advBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 24,
        height: 16,
        borderWidth: 1,
        borderRadius: 2,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: AXM.bg,
        zIndex: 1,
    },
    advText: {
        fontFamily: FONTS.sans,
        fontSize: 8,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    glyphWrap: {
        marginTop: 12,
        marginBottom: 6,
    },
    stanceName: {
        fontFamily: FONTS.gothic,
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 1,
        textAlign: 'center',
        marginBottom: 4,
    },
    stanceGloss: {
        fontFamily: FONTS.serif,
        fontSize: 9,
        color: AXM.bone,
        textAlign: 'center',
        lineHeight: 11,
        marginBottom: 8,
        flexGrow: 1,
    },
    triangleMeta: {
        alignSelf: 'stretch',
        marginBottom: 8,
    },
    metaLine: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    // Legibility (critic round): BEATS/WEAK + ATN/SKL/DEF labels were
    // ash (#46403a ≈ 2.1:1 on bg) at 7–8px — unreadable for low vision.
    // Lift to bone (≈ 6.5:1) and nudge the 7px tokens to 8px.
    metaVerb: {
        fontFamily: FONTS.sans,
        fontSize: 8,
        color: AXM.bone,
        width: 30,
        letterSpacing: 0.5,
    },
    metaTarget: {
        fontFamily: FONTS.sans,
        fontSize: 8,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    divider: {
        alignSelf: 'stretch',
        height: 1,
        backgroundColor: AXM.ash,
        marginBottom: 6,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignSelf: 'stretch',
        marginBottom: 2,
    },
    statKey: {
        fontFamily: FONTS.sans,
        fontSize: 9,
        color: AXM.bone,
        letterSpacing: 0.5,
    },
    statVal: {
        fontFamily: FONTS.mono,
        fontSize: 10,
        fontWeight: '600',
    },
}));