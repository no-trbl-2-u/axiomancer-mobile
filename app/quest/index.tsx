/**
 * /quest — the Quest Board minigame screen ("The Boy's Almanac").
 *
 * The story-quest encounter plays as a tabletop board game inside the
 * fiction: a loop of spaces, a wooden piece, a carved bone die. All
 * rules live in `axiomancer-mechanics` (World/QuestBoard); this
 * screen renders the presenter VM and dispatches store actions only.
 */

import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';

import { QuestBoardTrack } from '@/components/quest/QuestBoardTrack';
import {
    QuestDuskOverlay,
    QuestIntroOverlay,
    QuestOutcomeOverlay,
    QuestSpaceOverlay,
} from '@/components/quest/QuestOverlays';
import { ScreenBg } from '@/components/ScreenBg';
import { useGameActions, useGameState } from '@/state/GameStoreProvider';
import { selectQuestBoardVM } from '@/state/presenters/quest.engine';
import { AXM, FONTS } from '@/theme/axm';

export default function QuestScreen() {
    // Subscribe to the stable slice; memo the VM downstream (the
    // presenter returns a fresh object every call — same doctrine as
    // the event screen's getSnapshot note).
    const slice = useGameState((s) => s.quest);
    const vm = useMemo(() => selectQuestBoardVM({ quest: slice }), [slice]);
    const actions = useGameActions();
    const router = useRouter();
    const { width } = useWindowDimensions();

    // Auto-close when the session clears (claim or abandon).
    useEffect(() => {
        if (!vm.active && router.canGoBack()) router.back();
    }, [vm.active, router]);

    if (!vm.active) return <ScreenBg><View /></ScreenBg>;

    const boardSize = Math.min(width - 16, 420);
    const stretchPips = Array.from({ length: vm.stretchesPerDay }, (_, i) => i < vm.stretch);

    return (
        <ScreenBg>
            <ScrollView contentContainerStyle={styles.scroll}>
                {/* Scene strip */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{vm.title}</Text>
                    <Text style={styles.headerSub}>
                        DAY {vm.day} · {vm.tierPreview.toUpperCase()} PACE
                    </Text>
                </View>

                {/* Resources */}
                <View style={styles.resourceRow} testID="quest-resources">
                    <Text style={styles.resource}>⚲ FISH {vm.fish}</Text>
                    <Text style={styles.resource}>♥ VIGOR {vm.vigor}/{vm.maxVigor}</Text>
                    {vm.wind > 0 && <Text style={[styles.resource, { color: AXM.sulfur }]}>≋ WIND +{vm.wind}</Text>}
                    <View style={styles.pipRow} accessibilityLabel={`Stretch ${vm.stretch} of ${vm.stretchesPerDay}`}>
                        {stretchPips.map((spent, i) => (
                            <Text key={i} style={[styles.pip, spent && { color: AXM.ash }]}>●</Text>
                        ))}
                    </View>
                </View>

                {/* The board */}
                <QuestBoardTrack spaces={vm.spaces} size={boardSize}>
                    {/* Center well: the hull ledger + the bone die */}
                    <View style={styles.wellParts} testID="quest-parts">
                        {vm.parts.map(p => (
                            <Text key={p.kind} style={styles.partLine}>
                                {p.label}{' '}
                                <Text style={{ color: p.fitted >= p.required ? AXM.heal : AXM.parchment }}>
                                    {p.fitted}/{p.required}
                                </Text>
                                {p.carried > 0 && <Text style={{ color: AXM.sulfur }}>  +{p.carried}</Text>}
                            </Text>
                        ))}
                    </View>
                    {vm.lastRoll !== null && (
                        <Text style={styles.lastRoll} testID="quest-last-roll">
                            ⚄ {vm.lastRoll.die}
                            {vm.lastRoll.bonus > 0 ? ` +${vm.lastRoll.bonus}` : ''}
                        </Text>
                    )}
                    <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Cast the bone die"
                        accessibilityState={{ disabled: vm.phase !== 'idle' }}
                        disabled={vm.phase !== 'idle'}
                        onPress={actions.rollQuestBone}
                        style={[styles.rollButton, { opacity: vm.phase === 'idle' ? 1 : 0.4 }]}
                        testID="quest-roll"
                    >
                        <Text style={styles.rollText}>CAST THE BONE</Text>
                    </TouchableOpacity>
                </QuestBoardTrack>

                {/* Charms tray */}
                <Text style={styles.sectionLabel}>CHARMS</Text>
                <View style={styles.charmTray} testID="quest-charms">
                    {vm.charms.map(charm => (
                        <TouchableOpacity
                            key={charm.id}
                            accessibilityRole="button"
                            accessibilityLabel={`${charm.name}. ${charm.desc}`}
                            accessibilityState={{ disabled: !charm.usable }}
                            disabled={!charm.usable}
                            onPress={() => actions.useQuestCharm(charm.id)}
                            style={[
                                styles.charmCard,
                                charm.primed && { borderColor: AXM.sulfur },
                                charm.used && { opacity: 0.35 },
                            ]}
                            testID={`quest-charm-${charm.id}`}
                        >
                            <Text style={styles.charmName}>{charm.name}</Text>
                            <Text style={styles.charmDesc}>
                                {charm.used ? 'SPENT' : charm.primed ? 'PRIMED' : charm.desc}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Vows strip */}
                <Text style={styles.sectionLabel}>VOWS</Text>
                <View style={styles.vowStrip} testID="quest-vows">
                    {vm.vows.map(v => (
                        <Text
                            key={v.id}
                            style={[
                                styles.vowChip,
                                v.status === 'kept' && { color: AXM.heal, borderColor: AXM.heal },
                                v.status === 'broken' && { color: AXM.blood, borderColor: AXM.blood },
                            ]}
                        >
                            {v.name}
                        </Text>
                    ))}
                </View>

                {/* Escape hatch */}
                <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Fold the board away"
                    onPress={actions.abandonQuestBoard}
                    style={styles.abandon}
                    testID="quest-abandon"
                >
                    <Text style={styles.abandonText}>FOLD THE BOARD AWAY</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Overlays by phase */}
            {vm.phase === 'intro' && (
                <QuestIntroOverlay vm={vm} onBegin={actions.startQuestBoardPlay} />
            )}
            {vm.phase === 'space' && vm.pending !== null && (
                <QuestSpaceOverlay
                    pending={vm.pending}
                    onChoose={actions.chooseQuestSpaceOption}
                    onContinue={actions.continueQuestSpace}
                />
            )}
            {vm.phase === 'dusk' && (
                <QuestDuskOverlay
                    day={vm.day}
                    collapsed={vm.collapsedToday}
                    onContinue={actions.acknowledgeQuestDusk}
                />
            )}
            {vm.phase === 'outcome' && vm.outcome !== null && (
                <QuestOutcomeOverlay
                    outcome={vm.outcome}
                    onClaim={actions.claimQuestBoardCompletion}
                />
            )}
        </ScreenBg>
    );
}

const styles = StyleSheet.create({
    scroll: { padding: 8, paddingBottom: 24 },
    header: { paddingHorizontal: 6, paddingTop: 4, paddingBottom: 8 },
    headerTitle: {
        fontFamily: FONTS.gothic,
        fontSize: 24,
        lineHeight: 28,
        color: AXM.parchment,
        letterSpacing: 1,
    },
    headerSub: {
        fontFamily: FONTS.sans,
        fontSize: 12,
        letterSpacing: 2.2,
        color: AXM.bone,
        marginTop: 2,
    },
    resourceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 6,
        paddingBottom: 8,
    },
    resource: {
        fontFamily: FONTS.sans,
        fontSize: 14,
        letterSpacing: 1.5,
        color: AXM.parchment,
    },
    pipRow: { flexDirection: 'row', gap: 3, marginLeft: 'auto' },
    pip: { color: AXM.sulfur, fontSize: 12 },
    wellParts: { alignItems: 'flex-start', gap: 1 },
    partLine: {
        fontFamily: FONTS.mono,
        fontSize: 12,
        letterSpacing: 0.5,
        color: AXM.bone,
    },
    lastRoll: {
        fontFamily: FONTS.gothic,
        fontSize: 20,
        color: AXM.sulfur,
        marginTop: 4,
    },
    rollButton: {
        marginTop: 6,
        borderWidth: 2,
        borderColor: AXM.sulfur,
        paddingVertical: 6,
        paddingHorizontal: 14,
        backgroundColor: AXM.bg,
    },
    rollText: {
        fontFamily: FONTS.gothic,
        fontSize: 15,
        letterSpacing: 2,
        color: AXM.sulfur,
    },
    sectionLabel: {
        fontFamily: FONTS.sans,
        fontSize: 12,
        letterSpacing: 2.2,
        color: AXM.bone,
        marginTop: 12,
        marginBottom: 4,
        paddingHorizontal: 6,
    },
    charmTray: { flexDirection: 'row', gap: 6, paddingHorizontal: 6 },
    charmCard: {
        flex: 1,
        borderWidth: 1,
        borderColor: AXM.ash,
        backgroundColor: AXM.panelBg,
        padding: 8,
    },
    charmName: {
        fontFamily: FONTS.gothic,
        fontSize: 13,
        color: AXM.sulfur,
        letterSpacing: 1,
    },
    charmDesc: {
        fontFamily: FONTS.mono,
        fontSize: 11,
        color: AXM.bone,
        marginTop: 2,
    },
    vowStrip: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 6 },
    vowChip: {
        fontFamily: FONTS.sans,
        fontSize: 12,
        letterSpacing: 1.5,
        color: AXM.bone,
        borderWidth: 1,
        borderColor: AXM.ash,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    abandon: { alignSelf: 'center', marginTop: 18, padding: 6 },
    abandonText: {
        fontFamily: FONTS.mono,
        fontSize: 12,
        letterSpacing: 2,
        color: AXM.ash,
    },
});
