import React from 'react';
import {
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { AXM, FONTS } from '@/theme/axm';
import type { CrucibleToken } from '@/state/presenters/combat.engine';

/**
 * Persistent combat resource tracker (crucible "skill fuel").
 *
 * Replaces the action-phase-only CrucibleStrip "legend" (user
 * direction 2026-06-06): the five resource tokens (BOD/HRT/MND/FAL/
 * PRX) now live in the player HUD footer so the pool stays visible in
 * every phase — stance, action, skill, and resolve — and the player
 * can watch fuel accrue round to round.
 *
 * Each token reads as glyph + 3-letter label + exact count, plus a
 * thin fill bar. Resources have no engine-defined ceiling (they
 * accrue +1 per qualifying round), so FILL_CAP only scales the bar;
 * the numeric count is always the source of truth and is shown
 * verbatim, including values above the cap.
 */

/** Soft cap used purely to scale the fill bar — not a real resource ceiling. */
const FILL_CAP = 5;

export function CombatResourceTracker({ tokens }: { tokens: readonly CrucibleToken[] }) {
    return (
        <View style={styles.row} testID="combat-resource-tracker">
            <View style={styles.labelCol}>
                <Text style={styles.eyebrow}>SKILL</Text>
                <Text style={styles.subLabel}>FUEL</Text>
            </View>
            <View style={styles.tokens}>
                {tokens.map((t) => {
                    const depleted = t.count <= 0;
                    const tint = depleted ? AXM.ash : t.color;
                    const fillPct = Math.min(1, Math.max(0, t.count / FILL_CAP));
                    return (
                        <View key={t.key} style={styles.tokenCol} testID={`combat-resource-token-${t.key}`}>
                            <View style={styles.tokenHead}>
                                <Text style={[styles.glyph, { color: tint }]}>{t.glyph}</Text>
                                <Text style={[styles.count, { color: depleted ? AXM.ash : AXM.parchment }]}>
                                    {t.count}
                                </Text>
                            </View>
                            <View style={styles.track}>
                                <View
                                    style={[styles.fill, { width: `${fillPct * 100}%`, backgroundColor: tint }]}
                                />
                            </View>
                            <Text style={[styles.short, { color: tint }]}>{t.short}</Text>
                        </View>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 5,
        paddingHorizontal: 8,
        borderWidth: 1,
        borderColor: AXM.ash,
        backgroundColor: AXM.bg,
        marginBottom: 8,
    },
    labelCol: {
        gap: 0,
    },
    eyebrow: {
        fontFamily: FONTS.sans,
        fontSize: 9,
        color: AXM.bone,
        letterSpacing: 2,
    },
    subLabel: {
        fontFamily: FONTS.mono,
        fontSize: 7,
        color: AXM.ash,
        letterSpacing: 1,
    },
    tokens: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 6,
    },
    tokenCol: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
    },
    tokenHead: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 3,
    },
    glyph: {
        fontFamily: FONTS.gothic,
        fontSize: 15,
    },
    count: {
        fontFamily: FONTS.gothic,
        fontSize: 13,
        lineHeight: 14,
    },
    track: {
        width: '100%',
        height: 3,
        backgroundColor: AXM.deepBg,
        borderWidth: 1,
        borderColor: AXM.ash,
        overflow: 'hidden',
    },
    fill: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
    },
    short: {
        fontFamily: FONTS.sans,
        fontSize: 8,
        letterSpacing: 1,
    },
});
