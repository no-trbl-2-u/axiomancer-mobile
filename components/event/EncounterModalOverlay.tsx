/**
 * Encounter modal overlay (Phase 32 design-handoff port, 2026-05-16).
 *
 * Per the prototype's seam pattern (prototype.jsx PtEventModal +
 * chats/chat1.md "encounters triggered by map movement should now be
 * modals — the user cannot exit these modals"): when the player taps
 * an encounter or boss node, this overlay rises over the exploration
 * map. The backdrop is intentionally non-dismissible — there is no
 * `onPress` handler on the backdrop View. The only way out is to
 * pick FIGHT or (for non-boss encounters) FLEE.
 *
 * The "SEALED · NO RETREAT" chain bars top and bottom carry the
 * diegetic signal that the encounter is committed; the modal will not
 * close until a choice resolves.
 *
 * Renders only when the active event VM has `kind === 'combat-prelude'`.
 * Caller (`app/(tabs)/exploration/index.tsx`) controls mount/unmount
 * via `selectHasActiveEvent` + `vm.kind`.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path as SvgPath } from 'react-native-svg';

import { EventArt } from '@/components/event/EventArt';
import { Splatter } from '@/components/Splatter';
import { ActionIcon } from '@/components/ActionIcon';
import { AXM, FONTS } from '@/theme/axm';
import type { EventViewModel } from '@/state/presenters/event.engine';

interface EncounterModalOverlayProps {
    vm: EventViewModel;
    onFight: () => void;
    onFlee: () => void;
}

export function EncounterModalOverlay({
    vm,
    onFight,
    onFlee,
}: EncounterModalOverlayProps) {
    if (vm.kind !== 'combat-prelude' || vm.preludeChrome === null) return null;
    const isBoss = vm.variant === 'boss';
    const fleeChoice = vm.choices.find((c) => c.id === 'flee');
    const fleeEnabled = fleeChoice?.enabled ?? !isBoss;
    return (
        <View
            style={styles.overlay}
            // The backdrop is non-dismissible per chat1: "user cannot
            // exit these modals". No `onPress` handler. `pointerEvents:
            // box-none` would let taps fall through; we want the
            // opposite — swallow all backdrop taps.
            testID="encounter-modal-overlay"
        >
            <View style={styles.backdrop} />
            <View style={styles.panel}>
                <ChainBar label={vm.preludeChrome.sealLabel} />

                <View style={styles.preludeHeader}>
                    <Svg width={10} height={10} viewBox="0 0 10 10">
                        <SvgPath d="M5 1 L 7 7 L 3 7 Z" fill={AXM.blood} />
                    </Svg>
                    <Text style={styles.preludeHeaderText}>
                        {vm.preludeChrome.eyebrow}
                    </Text>
                </View>

                <View style={styles.illustration}>
                    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#06050a' }]} />
                    <EventArt slug={vm.artSlug} />
                    <View style={styles.strifeSash} testID="encounter-modal-sash">
                        <Text style={styles.strifeSashText}>
                            {vm.preludeChrome.sashLabel}
                        </Text>
                    </View>
                    <Splatter
                        color={AXM.blood}
                        size={140}
                        seed={45}
                        style={{ position: 'absolute', top: -20, right: -30, opacity: isBoss ? 0.7 : 0.5 }}
                    />
                </View>

                <View style={styles.titleArea}>
                    <Text style={[styles.title, isBoss && styles.titleBoss]} numberOfLines={2}>
                        {vm.title}
                    </Text>
                    {vm.subtitle.length > 0 && (
                        <Text style={styles.subtitle} numberOfLines={1}>— {vm.subtitle}</Text>
                    )}
                </View>

                <View style={styles.body}>
                    <Text style={styles.bodyText} numberOfLines={3}>
                        {vm.body}
                    </Text>
                </View>

                <View style={styles.choices}>
                    <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Fight"
                        onPress={onFight}
                        style={[styles.choiceRow, { borderColor: AXM.blood, borderLeftColor: AXM.blood }]}
                        testID="encounter-modal-fight"
                    >
                        <ActionIcon kind="sword" size={20} color={AXM.blood} />
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.choiceLabel, { color: AXM.blood }]}>FIGHT</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Flee"
                        accessibilityState={{ disabled: !fleeEnabled }}
                        disabled={!fleeEnabled}
                        onPress={onFlee}
                        style={[
                            styles.choiceRow,
                            { borderColor: AXM.bone, borderLeftColor: AXM.bone, opacity: fleeEnabled ? 1 : 0.4 },
                        ]}
                        testID="encounter-modal-flee"
                    >
                        <ActionIcon kind="flee" size={20} color={AXM.bone} />
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.choiceLabel, { color: AXM.bone }]}>FLEE</Text>
                            {!fleeEnabled && (
                                <Text style={styles.choiceSub}>
                                    {vm.preludeChrome.fleeDisabledHint}
                                </Text>
                            )}
                        </View>
                    </TouchableOpacity>
                </View>

                <ChainBar label={vm.preludeChrome.sealLabel} />
            </View>
        </View>
    );
}

function ChainBar({ label }: { label: string }) {
    return (
        <View style={styles.chainBar} testID="encounter-modal-chain">
            <View style={styles.chainRule} />
            <Text style={styles.chainText}>{label}</Text>
            <View style={styles.chainRule} />
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(10, 10, 10, 0.85)',
    },
    panel: {
        position: 'absolute',
        left: 12,
        right: 12,
        top: 56,
        bottom: 80,
        backgroundColor: AXM.bg,
        borderWidth: 1,
        borderColor: AXM.rust,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.8,
        shadowRadius: 40,
        elevation: 10,
        flexDirection: 'column',
    },
    chainBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(232, 223, 200, 0.12)',
    },
    chainRule: {
        flex: 1,
        height: 1,
        backgroundColor: AXM.rust,
        opacity: 0.6,
    },
    chainText: {
        fontFamily: FONTS.sans,
        fontSize: 9,
        letterSpacing: 2.4,
        color: AXM.blood,
    },
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
    illustration: {
        height: 200,
        position: 'relative',
        overflow: 'hidden',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(232, 223, 200, 0.12)',
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
    titleArea: { paddingHorizontal: 14, paddingTop: 10 },
    title: {
        fontFamily: FONTS.gothic,
        fontSize: 24,
        lineHeight: 26,
        letterSpacing: 1,
        color: AXM.parchment,
    },
    titleBoss: {
        fontSize: 30,
        lineHeight: 32,
        textShadowColor: AXM.blood,
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 0,
    },
    subtitle: {
        fontFamily: FONTS.serifItalic,
        fontSize: 11,
        color: AXM.bone,
        marginTop: 2,
    },
    body: { paddingHorizontal: 14, paddingTop: 6, flex: 1 },
    bodyText: {
        fontFamily: FONTS.serif,
        fontSize: 12,
        color: AXM.parchment,
        lineHeight: 16,
        fontStyle: 'italic',
    },
    choices: { padding: 12, gap: 6 },
    choiceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: AXM.bg,
        borderWidth: 1,
        borderLeftWidth: 3,
    },
    choiceLabel: {
        fontFamily: FONTS.sans,
        fontSize: 12,
        letterSpacing: 2,
    },
    choiceSub: {
        fontFamily: FONTS.serifItalic,
        fontSize: 10,
        color: AXM.bone,
        marginTop: 2,
    },
});
