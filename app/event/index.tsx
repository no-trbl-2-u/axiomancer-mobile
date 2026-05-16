import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path as SvgPath } from 'react-native-svg';

import { isDialogueAppliedEvent } from 'axiomancer-mechanics';

import { ActionIcon } from '@/components/ActionIcon';
import { ScreenBg } from '@/components/ScreenBg';
import { SectionLabel } from '@/components/SectionLabel';
import { Splatter } from '@/components/Splatter';
import { useGameActions, useGameEvents, useGameState } from '@/state/GameStoreProvider';
import {
    selectEventViewModel,
    selectHasActiveEvent,
    type EventChoice,
    type EventConsequence,
    type ChoiceAccentKey,
} from '@/state/presenters/event.engine';
import { AXM, FONTS } from '@/theme/axm';

import { EventArt } from '@/components/event/EventArt';

function resolveAccent(key: ChoiceAccentKey): string {
    if (key === 'blood') return AXM.blood;
    if (key === 'sulfur') return AXM.sulfur;
    if (key === 'parchment') return AXM.parchment;
    if (key === 'rust') return AXM.rust;
    return AXM.bone;
}

function consequenceLabel(c: EventConsequence): string {
    if (c.kind === 'damage') return `-${c.amount ?? 0} HP`;
    if (c.kind === 'heal') return `+${c.amount ?? 0} HP`;
    if (c.kind === 'currency') return `+${c.amount ?? 0} ${c.amount === 1 ? 'shilling' : 'shillings'}`;
    if (c.kind === 'moral') {
        const delta = c.amount ?? 0;
        return `${delta > 0 ? '+' : ''}${delta} morale`;
    }
    if (c.kind === 'item') return c.label ?? 'item';
    if (c.kind === 'flag') return c.label ?? 'flag';
    if (c.kind === 'quest-start') return `quest: ${c.label ?? ''}`;
    if (c.kind === 'quest-progress') return `progress: ${c.label ?? ''}`;
    if (c.kind === 'skill-learn') return `skill: ${c.label ?? ''}`;
    return '';
}

function ConsequenceChips({ consequences }: { consequences: readonly EventConsequence[] }) {
    if (consequences.length === 0) return null;
    const shown = consequences.slice(0, 3);
    const overflow = consequences.length - shown.length;
    return (
        <View style={styles.chipRow} testID="event-consequence-chips">
            {shown.map((c, i) => (
                <Text key={i} style={styles.chip}>
                    {consequenceLabel(c)}
                </Text>
            ))}
            {overflow > 0 && (
                <Text style={styles.chip}>{`+${overflow} more`}</Text>
            )}
        </View>
    );
}

function ChoiceRow({
    choice,
    isFirst,
    confirmed,
    onPress,
}: {
    choice: EventChoice;
    isFirst: boolean;
    confirmed: boolean;
    onPress: () => void;
}) {
    const accent = resolveAccent(choice.accentKey);
    return (
        <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`${choice.label}, ${choice.description}`}
            accessibilityState={{ disabled: !choice.enabled }}
            disabled={!choice.enabled}
            onPress={onPress}
            style={[
                styles.choiceRow,
                {
                    borderColor: accent,
                    backgroundColor: isFirst ? '#1a0a0a' : '#0a0a0a',
                    opacity: choice.enabled ? 1 : 0.4,
                },
            ]}
            testID={`event-choice-${choice.id}`}
        >
            <ActionIcon kind={choice.iconKey} size={24} color={accent} />
            <View style={{ flex: 1 }}>
                <Text style={styles.choiceLabel}>{choice.label}</Text>
                <Text style={styles.choiceSub}>{choice.description}</Text>
                <ConsequenceChips consequences={choice.consequences} />
            </View>
            {confirmed && (
                <Text
                    style={[styles.choiceConfirm, { color: accent }]}
                    testID={`event-choice-${choice.id}-confirmed`}
                    accessibilityLiveRegion="polite"
                >
                    ✓
                </Text>
            )}
            <Text style={[styles.choiceArrow, { color: accent }]}>›</Text>
        </TouchableOpacity>
    );
}

/** Tick C: how long the dialogue-confirmation ✓ stays visible. */
const DIALOGUE_CONFIRM_TTL_MS = 500;

export default function EventScreen() {
    // Subscribe to stable slices to avoid getSnapshot identity churn:
    // selectEventViewModel returns a frozen new object every call, which
    // would loop useSyncExternalStore if used directly as a selector.
    // The screen pulls the underlying slices and memos the VM downstream.
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

    // Tick C: when the engine emits `dialogue:applied` (via the action
    // layer's applyDialogue), briefly flash a ✓ next to the matching
    // choice row so the player sees their pick land before the modal
    // re-renders the next dialogue node. Component-local state, not a
    // slice — the flash is intentionally ephemeral.
    const [lastConfirmedChoiceId, setLastConfirmedChoiceId] =
        useState<string | null>(null);
    const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useGameEvents((event) => {
        if (!isDialogueAppliedEvent(event)) return;
        // The engine dispatches APPLY_DIALOGUE with payload {tree, choice};
        // the emitted event surfaces it via payload.action.payload.choice.
        const payload = event.payload as unknown as {
            action?: { payload?: { choice?: { id?: string } } };
            choice?: { id?: string };
        };
        const choiceId: string | undefined =
            payload?.action?.payload?.choice?.id ?? payload?.choice?.id;
        if (typeof choiceId !== 'string' || choiceId.length === 0) return;
        setLastConfirmedChoiceId(choiceId);
        if (confirmTimerRef.current !== null) {
            clearTimeout(confirmTimerRef.current);
        }
        confirmTimerRef.current = setTimeout(() => {
            setLastConfirmedChoiceId(null);
            confirmTimerRef.current = null;
        }, DIALOGUE_CONFIRM_TTL_MS);
    });

    useEffect(
        () => () => {
            if (confirmTimerRef.current !== null) {
                clearTimeout(confirmTimerRef.current);
            }
        },
        [],
    );

    const onPick = (choiceId: string) => {
        actions.pickEventChoice(choiceId);
    };

    const onSkip = () => {
        actions.dismissEvent();
    };

    const onBack = () => {
        router.back();
    };

    // Auto-close the modal when the event slice clears (e.g. after a
    // pick that resolves the pending event, or a skip).
    useEffect(() => {
        if (!hasEvent && router.canGoBack()) {
            router.back();
        }
    }, [hasEvent, router]);

    const isBoss = vm.variant === 'boss';
    const illustrationHeight = isBoss ? 360 : 320;
    const badgeAccent = resolveAccent(vm.badgeAccentKey);
    const preludeChrome = vm.preludeChrome;

    if (!hasEvent) {
        return (
            <ScreenBg>
                <View style={styles.emptyArea} testID="event-empty">
                    <Text style={styles.eventTitle}>{vm.title}</Text>
                    <Text style={styles.bodyText}>{vm.body}</Text>
                    <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Back"
                        onPress={onBack}
                        style={[styles.choiceRow, { borderColor: AXM.bone, backgroundColor: '#0a0a0a' }]}
                        testID="event-choice-back"
                    >
                        <ActionIcon kind="flee" size={24} color={AXM.bone} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.choiceLabel}>BACK</Text>
                            <Text style={styles.choiceSub}>RETURN</Text>
                        </View>
                        <Text style={[styles.choiceArrow, { color: AXM.bone }]}>›</Text>
                    </TouchableOpacity>
                </View>
            </ScreenBg>
        );
    }

    return (
        <ScreenBg>
            {preludeChrome !== null && (
                <View style={styles.preludeHeader} testID="event-prelude-header">
                    <Svg width={10} height={10} viewBox="0 0 10 10">
                        <SvgPath d="M5 1 L 7 7 L 3 7 Z" fill={AXM.blood} />
                    </Svg>
                    <Text style={styles.preludeHeaderText}>{preludeChrome.eyebrow}</Text>
                </View>
            )}
            <View style={[styles.illustration, { height: illustrationHeight }]}>
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#06050a' }]} />
                <EventArt slug={vm.artSlug} />
                {preludeChrome !== null ? (
                    <View style={styles.strifeSash} testID="event-strife-sash">
                        <Text style={styles.strifeSashText}>{preludeChrome.sashLabel}</Text>
                    </View>
                ) : (
                    <View style={styles.badge}>
                        <Text
                            style={[styles.badgeText, { color: badgeAccent, borderColor: badgeAccent }]}
                        >
                            {isBoss ? '☠ ' : '✠ '}
                            {vm.badge}
                        </Text>
                    </View>
                )}
                <Splatter
                    color={AXM.blood}
                    size={180}
                    seed={45}
                    style={{ position: 'absolute', top: -20, right: -30, opacity: isBoss ? 0.7 : 0.5 }}
                />
            </View>

            <View style={styles.titleArea}>
                <Text style={[styles.eventTitle, isBoss && styles.eventTitleBoss]}>{vm.title}</Text>
                {vm.subtitle.length > 0 && (
                    <Text style={styles.eventSub}>— {vm.subtitle}</Text>
                )}
            </View>

            <View style={styles.body}>
                <Text style={styles.bodyText}>
                    {vm.body.length > 0 && (
                        <>
                            <Text style={styles.dropCap}>{vm.body[0]}</Text>
                            {vm.body.slice(1)}
                        </>
                    )}
                </Text>
                {vm.lore !== null && (
                    <View style={styles.loreBox}>
                        <Text style={styles.loreText}>{vm.lore}</Text>
                    </View>
                )}
                {vm.canSkip && (
                    <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Skip"
                        onPress={onSkip}
                        style={styles.skipBtn}
                        testID="event-skip"
                    >
                        <Text style={styles.skipText}>SKIP ›</Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.choices}>
                <SectionLabel size={10} style={{ marginBottom: 6 }}>
                    ✠ A RECKONING
                </SectionLabel>
                {vm.choices.map((choice, i) => (
                    <ChoiceRow
                        key={choice.id}
                        choice={choice}
                        isFirst={i === 0}
                        confirmed={lastConfirmedChoiceId === choice.id}
                        onPress={() => onPick(choice.id)}
                    />
                ))}
            </View>
        </ScreenBg>
    );
}

const styles = StyleSheet.create({
    illustration: { margin: 8, marginTop: 0, position: 'relative', overflow: 'hidden' },
    preludeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(232, 223, 200, 0.12)',
    },
    preludeHeaderText: {
        fontFamily: FONTS.sans,
        fontSize: 10,
        letterSpacing: 2.2,
        color: AXM.blood,
    },
    strifeSash: {
        position: 'absolute',
        top: 0,
        left: 0,
        backgroundColor: AXM.blood,
        paddingTop: 3,
        paddingBottom: 3,
        paddingLeft: 14,
        paddingRight: 18,
    },
    strifeSashText: {
        fontFamily: FONTS.sans,
        fontSize: 10,
        letterSpacing: 1.4,
        color: AXM.bg,
    },
    badge: {
        position: 'absolute',
        top: 12,
        left: 12,
        paddingVertical: 4,
        paddingHorizontal: 8,
        backgroundColor: '#0a0a0a',
        borderWidth: 2,
        borderColor: AXM.blood,
    },
    badgeText: { fontFamily: FONTS.gothic, fontSize: 14, letterSpacing: 2 },
    titleArea: { paddingHorizontal: 14, paddingTop: 8 },
    eventTitle: {
        fontFamily: FONTS.gothic,
        fontSize: 28,
        lineHeight: 30,
        letterSpacing: 1,
        color: AXM.parchment,
    },
    eventTitleBoss: {
        fontSize: 38,
        lineHeight: 40,
        textShadowColor: AXM.blood,
        textShadowOffset: { width: 3, height: 3 },
        textShadowRadius: 0,
    },
    eventSub: { fontFamily: FONTS.serifItalic, fontSize: 11, color: AXM.bone, marginTop: 2 },
    body: { paddingHorizontal: 14, paddingTop: 8 },
    bodyText: { fontFamily: FONTS.serif, fontSize: 12, color: AXM.parchment, lineHeight: 18 },
    dropCap: { fontFamily: FONTS.gothic, fontSize: 36, lineHeight: 34, color: AXM.blood },
    loreBox: {
        marginTop: 8,
        padding: 6,
        paddingHorizontal: 8,
        borderLeftWidth: 2,
        borderLeftColor: AXM.sulfur,
    },
    loreText: {
        fontFamily: FONTS.serifItalic,
        fontSize: 10,
        color: AXM.sulfur,
        lineHeight: 14,
    },
    skipBtn: {
        marginTop: 8,
        alignSelf: 'flex-end',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderWidth: 1,
        borderColor: AXM.bone,
    },
    skipText: {
        fontFamily: FONTS.mono,
        fontSize: 10,
        letterSpacing: 2,
        color: AXM.bone,
    },
    choices: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 16, gap: 6 },
    choiceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 9,
        paddingHorizontal: 12,
        borderWidth: 2,
    },
    choiceLabel: {
        fontFamily: FONTS.gothic,
        fontSize: 18,
        color: AXM.parchment,
        lineHeight: 20,
        letterSpacing: 1.5,
    },
    choiceSub: {
        fontFamily: FONTS.mono,
        fontSize: 8,
        color: AXM.bone,
        letterSpacing: 1,
        marginTop: 2,
        textTransform: 'uppercase',
    },
    choiceArrow: { fontFamily: FONTS.gothic, fontSize: 18 },
    choiceConfirm: {
        fontFamily: FONTS.gothic,
        fontSize: 18,
        marginRight: 4,
    },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
    chip: {
        fontFamily: FONTS.mono,
        fontSize: 8,
        letterSpacing: 1,
        color: AXM.bone,
        borderWidth: 1,
        borderColor: AXM.ash,
        paddingHorizontal: 4,
        paddingVertical: 1,
    },
    emptyArea: { padding: 24, gap: 12 },
});
