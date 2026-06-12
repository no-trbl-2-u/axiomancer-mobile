/**
 * /dialogue — the dedicated NPC interaction screen (Phase 137).
 *
 * Renders the same composed event view-model the generic modal used
 * (dialogue-cursor walking, alignment/quest gating, consequence
 * chips all live in `state/presenters/event.engine`), with chrome
 * built for a conversation: nameplate, spoken text panel, replies.
 */

import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ScreenBg } from '@/components/ScreenBg';
import { useGameActions, useGameState } from '@/state/GameStoreProvider';
import {
    selectEventViewModel,
    selectHasActiveEvent,
    type EventChoice,
} from '@/state/presenters/event.engine';
import { AXM, FONTS } from '@/theme/axm';

function ReplyRow({ choice, onPress }: { choice: EventChoice; onPress: () => void }) {
    return (
        <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`${choice.label}, ${choice.description}`}
            accessibilityState={{ disabled: !choice.enabled }}
            disabled={!choice.enabled}
            onPress={onPress}
            style={[styles.replyRow, { opacity: choice.enabled ? 1 : 0.4 }]}
            testID={`dialogue-choice-${choice.id}`}
        >
            <Text style={styles.replyMark}>—</Text>
            <View style={styles.flexOne}>
                <Text style={styles.replyLabel}>{choice.label}</Text>
                {choice.description.length > 0 && (
                    <Text style={styles.replyDesc}>{choice.description}</Text>
                )}
            </View>
        </TouchableOpacity>
    );
}

export default function DialogueScreen() {
    // Same stable-slice subscription doctrine as the event screen —
    // the presenter returns a fresh frozen object per call.
    const slice = useGameState((s) => s.event);
    const combat = useGameState((s) => s.combat);
    const quests = useGameState((s) => s.quests);
    const flags = useGameState((s) => s.flags);
    const vm = useMemo(
        () => selectEventViewModel({ event: slice, combat, quests, flags } as never),
        [slice, combat, quests, flags],
    );
    const hasEvent = useMemo(
        () => selectHasActiveEvent({ event: slice, combat } as never),
        [slice, combat],
    );
    const actions = useGameActions();
    const router = useRouter();

    useEffect(() => {
        if (!hasEvent && router.canGoBack()) router.back();
    }, [hasEvent, router]);

    if (!hasEvent) return <ScreenBg><View /></ScreenBg>;

    return (
        <ScreenBg>
            <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={styles.eyebrow}>◉ PARLEY</Text>
                <View style={styles.nameplate} testID="dialogue-nameplate">
                    <Text style={styles.name}>{vm.title}</Text>
                    {vm.subtitle.length > 0 && <Text style={styles.subtitle}>{vm.subtitle}</Text>}
                </View>

                <View style={styles.speech} testID="dialogue-speech">
                    <Text style={styles.speechText}>{vm.body}</Text>
                </View>

                <Text style={styles.sectionLabel}>{vm.chrome.reckoningEyebrow}</Text>
                {vm.choices.map(choice => (
                    <ReplyRow
                        key={choice.id}
                        choice={choice}
                        onPress={() => actions.pickEventChoice(choice.id)}
                    />
                ))}

                <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Walk away"
                    onPress={actions.dismissEvent}
                    style={styles.abandon}
                    testID="dialogue-leave"
                >
                    <Text style={styles.abandonText}>TIP YOUR CAP AND GO</Text>
                </TouchableOpacity>
            </ScrollView>
        </ScreenBg>
    );
}

const styles = StyleSheet.create({
    scroll: { padding: 14, paddingBottom: 24 },
    eyebrow: {
        fontFamily: FONTS.sans,
        fontSize: 10,
        letterSpacing: 2.2,
        color: AXM.parchment,
        marginBottom: 8,
    },
    nameplate: {
        borderBottomWidth: 2,
        borderBottomColor: AXM.sulfur,
        paddingBottom: 6,
        marginBottom: 10,
    },
    name: {
        fontFamily: FONTS.gothic,
        fontSize: 30,
        lineHeight: 34,
        color: AXM.parchment,
    },
    subtitle: { fontFamily: FONTS.serifItalic, fontSize: 11, color: AXM.bone, marginTop: 2 },
    speech: {
        borderWidth: 1,
        borderColor: AXM.ash,
        backgroundColor: AXM.panelBg,
        padding: 12,
        marginBottom: 10,
    },
    speechText: {
        fontFamily: FONTS.serif,
        fontSize: 14,
        lineHeight: 21,
        color: AXM.parchment,
    },
    sectionLabel: {
        fontFamily: FONTS.sans,
        fontSize: 10,
        letterSpacing: 2.2,
        color: AXM.bone,
        marginBottom: 6,
    },
    replyRow: {
        flexDirection: 'row',
        gap: 8,
        borderWidth: 2,
        borderColor: AXM.bone,
        backgroundColor: AXM.bg,
        padding: 10,
        marginBottom: 6,
    },
    replyMark: { fontFamily: FONTS.gothic, fontSize: 16, color: AXM.sulfur },
    replyLabel: { fontFamily: FONTS.gothic, fontSize: 16, color: AXM.parchment, letterSpacing: 1 },
    replyDesc: {
        fontFamily: FONTS.mono,
        fontSize: 8,
        color: AXM.bone,
        marginTop: 2,
        textTransform: 'uppercase',
    },
    abandon: { alignSelf: 'center', marginTop: 14, padding: 6 },
    abandonText: { fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 2, color: AXM.ash },
    flexOne: { flex: 1 },
});
