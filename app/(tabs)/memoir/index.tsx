import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

import { ScreenBg } from '@/components/ScreenBg';
import { SectionLabel } from '@/components/SectionLabel';
import { useGameState } from '@/state/GameStoreProvider';
import {
    selectMemoirViewModel,
    type MemoirViewModel,
} from '@/state/presenters/memoir.engine';
import { AXM, FONTS } from '@/theme/axm';

/**
 * MEMOIR screen — read-only journal surface. Phase 33 Tick A
 * renders the four section shells with presenter-sourced
 * empty-state copy; Ticks B-D fill in the real reads.
 *
 * Subscribes to slim slices and memo's the VM (Phase 30 Tick A
 * pattern) — `useGameState(selectMemoirViewModel)` would churn
 * `useSyncExternalStore` because the VM is a frozen-new object
 * every call.
 */
export default function MemoirScreen() {
    const player = useGameState((s) => s.player);
    const quests = useGameState((s) => s.quests);
    const moralMeter = useGameState((s) => s.moralMeter);
    // Subscribing to `_recentEvents` here even though Tick A doesn't
    // read it yet — Tick D's chronicle mapper will, and arming the
    // subscription now means the screen rebuilds the chronicle
    // automatically when the ring buffer ticks.
    const recentEvents = useGameState((s) => s._recentEvents);
    const vm = useMemo<MemoirViewModel>(
        () =>
            selectMemoirViewModel({
                player,
                quests,
                moralMeter,
                _recentEvents: recentEvents,
            } as never),
        [player, quests, moralMeter, recentEvents],
    );

    return (
        <ScreenBg>
            <ScrollView contentContainerStyle={styles.scroll}>
                {/* Header */}
                <View style={styles.header}>
                    <SectionLabel size={10} color={AXM.bone}>
                        {vm.headerEyebrow}
                    </SectionLabel>
                    <Text style={styles.subline}>{vm.headerSubline}</Text>
                </View>

                {/* Chronicle */}
                <View style={styles.section} testID="memoir-chronicle">
                    <SectionLabel size={10}>{vm.chronicleEyebrow}</SectionLabel>
                    {vm.chronicle.length === 0 ? (
                        <Text style={styles.emptyLine}>{vm.emptyChronicle}</Text>
                    ) : (
                        vm.chronicle.map((entry) => (
                            <View key={entry.id} style={styles.chronicleRow}>
                                <Text style={styles.chronicleLabel}>
                                    {entry.label}
                                </Text>
                                <Text style={styles.chronicleBody}>
                                    {entry.body}
                                </Text>
                            </View>
                        ))
                    )}
                </View>

                {/* Errands */}
                <View style={styles.section} testID="memoir-quests">
                    <SectionLabel size={10}>{vm.questsEyebrow}</SectionLabel>
                    {vm.quests.active.length === 0 &&
                    vm.quests.completed.length === 0 &&
                    vm.quests.forgotten.length === 0 ? (
                        <Text style={styles.emptyLine}>{vm.emptyQuests}</Text>
                    ) : (
                        <>
                            {vm.quests.active.length > 0 && (
                                <View style={styles.questGroup}>
                                    <SectionLabel size={9} color={AXM.bone}>
                                        {vm.questsActiveEyebrow}
                                    </SectionLabel>
                                </View>
                            )}
                            {vm.quests.completed.length > 0 && (
                                <View style={styles.questGroup}>
                                    <SectionLabel size={9} color={AXM.bone}>
                                        {vm.questsCompletedEyebrow}
                                    </SectionLabel>
                                </View>
                            )}
                            {vm.quests.forgotten.length > 0 && (
                                <View style={styles.questGroup}>
                                    <SectionLabel size={9} color={AXM.bone}>
                                        {vm.questsForgottenEyebrow}
                                    </SectionLabel>
                                </View>
                            )}
                        </>
                    )}
                </View>

                {/* Measure */}
                <View style={styles.section} testID="memoir-measure">
                    <SectionLabel size={10}>{vm.measureEyebrow}</SectionLabel>
                    <View style={styles.measureRow}>
                        <View style={styles.measureChip}>
                            <Text style={styles.measureLabel}>
                                {vm.moralAlignment.chip.label}
                            </Text>
                        </View>
                        <View style={styles.measureChip}>
                            <Text style={styles.measureLabel}>
                                {vm.philosophicalAlignment.label}
                            </Text>
                        </View>
                    </View>
                    {vm.philosopherQuote !== null && (
                        <Text style={styles.quote}>{vm.philosopherQuote}</Text>
                    )}
                </View>
            </ScrollView>
        </ScreenBg>
    );
}

const styles = StyleSheet.create({
    scroll: { paddingBottom: 32 },
    header: { padding: 14, paddingBottom: 4 },
    subline: {
        fontFamily: FONTS.serifItalic,
        fontSize: 11,
        color: AXM.bone,
        marginTop: 2,
    },
    section: { padding: 14, paddingTop: 12 },
    emptyLine: {
        fontFamily: FONTS.mono,
        fontSize: 10,
        letterSpacing: 1,
        color: AXM.ash,
        marginTop: 6,
        textTransform: 'uppercase',
    },
    chronicleRow: {
        marginTop: 6,
        borderLeftWidth: 1,
        borderLeftColor: AXM.ash,
        paddingLeft: 8,
    },
    chronicleLabel: {
        fontFamily: FONTS.mono,
        fontSize: 9,
        letterSpacing: 1.5,
        color: AXM.bone,
    },
    chronicleBody: {
        fontFamily: FONTS.serif,
        fontSize: 11,
        color: AXM.parchment,
        lineHeight: 14,
        marginTop: 1,
    },
    questGroup: { marginTop: 6 },
    measureRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
    measureChip: {
        flex: 1,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: AXM.ash,
        backgroundColor: '#100d0a',
    },
    measureLabel: {
        fontFamily: FONTS.gothic,
        fontSize: 14,
        color: AXM.parchment,
        letterSpacing: 1,
    },
    quote: {
        fontFamily: FONTS.serifItalic,
        fontSize: 11,
        color: AXM.sulfur,
        marginTop: 8,
        lineHeight: 14,
    },
});
