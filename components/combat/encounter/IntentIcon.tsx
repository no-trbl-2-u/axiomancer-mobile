/**
 * Spec 26 §2.4 — the enemy intent telegraph. Shows what the enemy will DO at
 * phase-end if not cleared (icon + label), with a grayed next-phase preview.
 * The STANCE (the RPS axis) is deliberately NOT shown here — it is hidden and
 * read from the thematic tell (Spec 26b §2).
 */

import React from 'react';
import { Text, View } from 'react-native';

import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';
import type { CombatIntentVM } from '@/state/presenters/combat-encounter.engine';

export function IntentIcon({ intent, onPress }: { intent: CombatIntentVM; onPress?: () => void }) {
    const styles = useStyles();
    return (
        <View
            style={styles.wrap}
            testID="combat-intent"
            accessible
            accessibilityRole="text"
            accessibilityLabel={`Enemy intent: ${intent.label}. ${intent.description}`}
            onTouchEnd={onPress}
        >
            <View style={styles.row}>
                <Text style={[styles.icon, { color: intent.color }]}>{intent.icon}</Text>
                <Text style={[styles.label, { color: intent.color }]}>{intent.label}</Text>
                {intent.damage > 0 && <Text style={[styles.stakes, { color: intent.color }]}>♥{intent.damage}</Text>}
                {intent.debuffs && <Text style={styles.debuffMark}>☠</Text>}
            </View>
            {intent.next && (
                <Text style={styles.next}>
                    next: {intent.next.icon} {intent.next.label}
                </Text>
            )}
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    wrap: { alignItems: 'flex-start' },
    row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    icon: { fontSize: 16, lineHeight: 18 },
    label: { fontFamily: FONTS.sans, fontSize: 13, letterSpacing: 1.2 },
    stakes: { fontFamily: FONTS.mono, fontSize: 12, letterSpacing: 0.3 },
    debuffMark: { fontFamily: FONTS.sans, fontSize: 12, color: '#a86bdc' },
    next: { fontFamily: FONTS.mono, fontSize: 9, color: AXM.ash, letterSpacing: 0.5, marginTop: 1 },
}));
