import React from 'react';
import {
    ScrollView,
    Text,
    View,
} from 'react-native';

import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';
import type { CombatLogEntryDisplay } from '@/state/presenters/combat.engine';
import { SectionLabel } from '@/components/SectionLabel';

interface CombatLogDisplayProps {
    log: readonly CombatLogEntryDisplay[];
    round: number;
    emptyMessage: string;
}

export function CombatLogDisplay({
    log,
    round,
    emptyMessage,
}: CombatLogDisplayProps) {
    const styles = useStyles();
    const AXM = usePalette();
    const LOG_SEVERITY_COLOR: Record<CombatLogEntryDisplay['severity'], string> = {
        info: AXM.parchment,
        damage: AXM.blood,
        crit: AXM.sulfur,
        heal: AXM.heal,
        effect: AXM.rust,
        friendship: AXM.rust,
        system: AXM.bone,
    };
    return (
        <View style={styles.logWrap}>
            <View style={styles.logBox}>
                <View style={styles.logHeader}>
                    <SectionLabel size={8} color={AXM.bone}>{`⚜ BATTLE LOG · ROUND ${round}`}</SectionLabel>
                    <Text style={styles.logScrollHint}>SCROLL ↑</Text>
                </View>
                {log.length === 0 ? (
                    <Text style={[styles.logLine, { color: AXM.bone }]}>{emptyMessage}</Text>
                ) : (
                    <ScrollView
                        style={styles.logScroll}
                        contentContainerStyle={{ paddingBottom: 4 }}
                        showsVerticalScrollIndicator={false}
                        accessibilityLabel="Battle log"
                    >
                        {log.map((entry, i) => (
                            <View key={i} style={styles.logEntry}>
                                <View style={[styles.logRail, { backgroundColor: LOG_SEVERITY_COLOR[entry.severity] }]} />
                                <Text
                                    style={[styles.logLine, { color: LOG_SEVERITY_COLOR[entry.severity] }]}
                                    accessibilityRole="text"
                                >
                                    {entry.text}
                                </Text>
                            </View>
                        ))}
                    </ScrollView>
                )}
            </View>
            <View style={styles.logLegend}>
                <Text style={styles.logLegendLabel}>LEGEND ·</Text>
                <Text style={[styles.logLegendItem, { color: AXM.blood }]}>■ HARM</Text>
                <Text style={[styles.logLegendItem, { color: AXM.sulfur }]}>■ CRIT</Text>
                <Text style={[styles.logLegendItem, { color: AXM.heal }]}>■ HEAL</Text>
                <Text style={[styles.logLegendItem, { color: AXM.rust }]}>■ EFFECT</Text>
                <Text style={[styles.logLegendItem, { color: AXM.bone }]}>■ INFO</Text>
            </View>
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    logWrap: { padding: 6, paddingHorizontal: 10, paddingBottom: 0 },
    logBox: { backgroundColor: AXM.deepBg, borderWidth: 1, borderColor: AXM.ash, borderStyle: 'dashed', padding: 5, paddingHorizontal: 8, height: 78, overflow: 'hidden' },
    logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
    logScrollHint: { fontFamily: FONTS.mono, fontSize: 8, color: AXM.ash, letterSpacing: 1 },
    logScroll: { flex: 1, marginTop: 2 },
    logEntry: { flexDirection: 'row', gap: 6, paddingVertical: 2 },
    logRail: { width: 4, alignSelf: 'stretch', marginTop: 2, marginBottom: 2 },
    logLine: { fontFamily: FONTS.serif, fontSize: 11, lineHeight: 14, flex: 1 },
    logLegend: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, paddingVertical: 5, paddingHorizontal: 8, borderWidth: 1, borderColor: AXM.ash, backgroundColor: AXM.backdrop },
    logLegendLabel: { fontFamily: FONTS.mono, fontSize: 8, color: AXM.bone, letterSpacing: 1 },
    logLegendItem: { fontFamily: FONTS.mono, fontSize: 8, letterSpacing: 1 },
}));