/**
 * Spec 25 §7.6 — Status-effect badge.
 *
 * Renders one active effect as a glyph + intensity + remaining duration, colour
 * coded by category. The glyph mapping is owned by `statusGlyphs.ts` (engine
 * provides the effect; mobile owns the visual). A MAX badge marks intensity 10.
 */

import React from 'react';
import { Text, View } from 'react-native';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';
import type { ActiveEffectView } from '../combatPresenter';

export function StatusEffectBadge({ effect, compact = false }: { effect: ActiveEffectView; compact?: boolean }) {
    const styles = useStyles();
    const g = effect.glyph;
    return (
        <View
            style={[styles.badge, { borderColor: `${g.color}88`, backgroundColor: `${g.color}22` }]}
            testID={`combat-effect-${effect.effectId}`}
            accessible
            accessibilityLabel={`${g.label}, intensity ${effect.intensity}, ${effect.duration < 0 ? 'permanent' : `${effect.duration} rounds left`}${effect.isMax ? ', maxed' : ''}`}
        >
            <Text style={[styles.glyph, { color: g.color }]}>{g.glyph}</Text>
            {!compact && <Text style={[styles.name, { color: g.color }]} numberOfLines={1}>{g.label}</Text>}
            <View style={styles.meta}>
                <Text style={[styles.int, { color: g.color }]}>×{effect.intensity}</Text>
                {effect.duration >= 0 && <Text style={styles.dur}>{effect.duration}t</Text>}
            </View>
            {effect.isMax && (
                <View style={[styles.maxPip, { backgroundColor: g.color }]}>
                    <Text style={styles.maxText}>MAX</Text>
                </View>
            )}
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderWidth: 1,
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 4,
    },
    glyph: { fontSize: 16, lineHeight: 18 },
    name: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 0.6, maxWidth: 96 },
    meta: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
    int: { fontFamily: FONTS.mono, fontSize: 12 },
    dur: { fontFamily: FONTS.mono, fontSize: 10, color: AXM.bone },
    maxPip: { paddingHorizontal: 3, paddingVertical: 1, borderRadius: 2, marginLeft: 2 },
    maxText: { fontFamily: FONTS.sans, fontSize: 8, letterSpacing: 0.6, color: '#000' },
}));
