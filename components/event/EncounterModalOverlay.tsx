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
 *
 * All display strings (eyebrow, sash label, seal-bar label, flee-
 * disabled hint) come from `vm.preludeChrome` — no inline literals
 * per Hard Rule #8. The component returns `null` when
 * `vm.preludeChrome === null` (defensive against narrative-choice
 * variants slipping into the overlay path; the presenter normally
 * guarantees `preludeChrome` is populated for `kind === 'combat-
 * prelude'` VMs via `withPreludeChrome`). Component-level pins live
 * in `components/event/__tests__/EncounterModalOverlay.test.tsx`.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path as SvgPath } from 'react-native-svg';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    Easing,
} from 'react-native-reanimated';

import { CombatPanel } from '@/components/combat/CombatPanel';
import { EventArt } from '@/components/event/EventArt';
import { EventCodexHeader } from '@/components/event/EventCodexHeader';
import { Splatter } from '@/components/Splatter';
import { ActionIcon } from '@/components/ActionIcon';
import { AXM, FONTS } from '@/theme/axm';
import { useAesthetic } from '@/state/aesthetic-mode';
import { useGameState } from '@/state/GameStoreProvider';
import { selectEventCodexHeader } from '@/state/presenters/event.codex.engine';
import type { EventViewModel } from '@/state/presenters/event.engine';

/**
 * Modal mode state machine (Phase 63b).
 *
 * - `prelude`  — initial render: sealed bars + FIGHT/FLEE buttons
 *                (the original Phase 32 design-handoff port).
 * - `combat`   — after the player taps FIGHT, the panel content
 *                swaps to `<CombatPanel>` so the entire encounter
 *                lives inside the same modal that opened on the
 *                encounter trigger. No more `router.replace('/combat')`.
 * - `aftermath`— reserved for Phase 63c (post-round victory / parley
 *                / flee summary inside the modal). Not yet wired.
 */
export type EncounterModalMode = 'prelude' | 'combat' | 'aftermath';

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
    // Phase 63b — internal mode. FIGHT advances prelude → combat
    // and bubbles the existing onFight callback up (which still
    // starts combat in the engine but no longer routes away).
    const [mode, setMode] = useState<EncounterModalMode>('prelude');
    const handleFight = useCallback(() => {
        onFight();
        setMode('combat');
    }, [onFight]);

    // Phase 64 follow-up (2026-05-21) — auto-scroll on combat phase
    // change. User-direct symptom: "choosing the Action does nothing
    // but logs it to the screen." Engine layer mutates state
    // correctly per Phase 64's integration tests; the suspected
    // root cause is layout (hypothesis A in AUDIT [9.8]): the
    // ResolvePanel mounts when `combat.phase` flips to 'resolving',
    // but the modal's bounded ScrollView leaves it below the
    // visible viewport. This hook scrolls the modal to bottom
    // whenever the engine phase advances, surfacing the new
    // active row (action picker → resolving → choosing_action of
    // next round) into view.
    const combatScrollRef = useRef<ScrollView>(null);
    const combatPhase = useGameState((s) => s.combat?.phase ?? null);
    useEffect(() => {
        if (mode !== 'combat' || combatPhase === null) return;
        // Defer to next tick so layout finishes before scrolling.
        const handle = setTimeout(() => {
            combatScrollRef.current?.scrollToEnd({ animated: true });
        }, 16);
        return () => clearTimeout(handle);
    }, [mode, combatPhase]);
    const { mode: aesthetic } = useAesthetic();

    // Rise animation (Phase 44 port from prototype.jsx:632-638 — the
    // design's `@keyframes rise`). Backdrop fades in over 280ms;
    // panel translates from translateY(20) → 0 + opacity 0 → 1.
    // Shared values default to the start state so the first frame
    // renders mid-transition rather than at the final state.
    const backdropOpacity = useSharedValue(0);
    const panelOffset = useSharedValue(20);
    const panelOpacity = useSharedValue(0);
    useEffect(() => {
        const timing = { duration: 280, easing: Easing.out(Easing.ease) };
        backdropOpacity.value = withTiming(1, timing);
        panelOffset.value = withTiming(0, timing);
        panelOpacity.value = withTiming(1, timing);
    }, [backdropOpacity, panelOffset, panelOpacity]);

    const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
    const panelStyle = useAnimatedStyle(() => ({
        opacity: panelOpacity.value,
        transform: [{ translateY: panelOffset.value }],
    }));

    // Phase 63c follow-up (2026-05-21): the prelude branch requires
    // a `combat-prelude` VM + populated `preludeChrome`, but the
    // `combat` mode branch MUST stay mounted even after the engine
    // event slice clears (which `pickEventChoice('fight')` does
    // synchronously). Gate the early-return on mode: only non-combat
    // modes need the prelude VM. Combat mode reads from the engine
    // combat slice via `<CombatPanel>`; aftermath (reserved) will
    // read from `lastOutcome`.
    const preludeRenderable = vm.kind === 'combat-prelude' && vm.preludeChrome !== null;
    if (mode !== 'combat' && !preludeRenderable) return null;
    // preludeChrome is non-null in the prelude render path per the
    // early-return above; combat-mode JSX never reads it. The
    // non-null assertions in the prelude branch are safe.
    const isBoss = vm.variant === 'boss';
    const fightChoice = vm.choices.find((c) => c.id === 'fight');
    const fleeChoice = vm.choices.find((c) => c.id === 'flee');
    const fleeEnabled = fleeChoice?.enabled ?? !isBoss;
    // Phase 45 subtitles — italic cost/consequence chrome under each
    // button label (the design's prototype.jsx:481-489 pattern).
    const fightSubtitle = fightChoice?.subtitle ?? null;
    const fleeSubtitle = fleeChoice?.subtitle ?? null;
    return (
        <View
            style={styles.overlay}
            // The backdrop is non-dismissible per chat1: "user cannot
            // exit these modals". No `onPress` handler. `pointerEvents:
            // box-none` would let taps fall through; we want the
            // opposite — swallow all backdrop taps.
            testID="encounter-modal-overlay"
        >
            <Animated.View style={[styles.backdrop, backdropStyle]} />
            <Animated.View style={[styles.panel, panelStyle]}>
                {mode === 'combat' ? (
                    <ScrollView
                        ref={combatScrollRef}
                        style={styles.combatScroll}
                        contentContainerStyle={styles.combatScrollContent}
                        showsVerticalScrollIndicator={false}
                        testID="encounter-modal-combat-mode"
                    >
                        <CombatPanel />
                    </ScrollView>
                ) : (
                    <>
                        {aesthetic === 'codex' && (() => {
                            const { left, right } = selectEventCodexHeader(vm);
                            return <EventCodexHeader left={left} right={right} />;
                        })()}
                        <ChainBar label={vm.preludeChrome!.sealLabel} />

                        <View style={styles.preludeHeader}>
                            <Svg width={10} height={10} viewBox="0 0 10 10">
                                <SvgPath d="M5 1 L 7 7 L 3 7 Z" fill={AXM.blood} />
                            </Svg>
                            <Text style={styles.preludeHeaderText}>
                                {vm.preludeChrome!.eyebrow}
                            </Text>
                        </View>

                        <View style={styles.illustration}>
                            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#06050a' }]} />
                            <EventArt slug={vm.artSlug} />
                            <View style={styles.strifeSash} testID="encounter-modal-sash">
                                <Text style={styles.strifeSashText}>
                                    {vm.preludeChrome!.sashLabel}
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
                                onPress={handleFight}
                                style={[styles.choiceRow, { borderColor: AXM.blood, borderLeftColor: AXM.blood }]}
                                testID="encounter-modal-fight"
                            >
                                <ActionIcon kind="sword" size={20} color={AXM.blood} />
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.choiceLabel, { color: AXM.blood }]}>FIGHT</Text>
                                    {fightSubtitle !== null && (
                                        <Text style={styles.choiceSubtitle} testID="encounter-modal-fight-subtitle">
                                            {fightSubtitle}
                                        </Text>
                                    )}
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
                                    {fleeSubtitle !== null && (
                                        <Text style={styles.choiceSubtitle} testID="encounter-modal-flee-subtitle">
                                            {fleeSubtitle}
                                        </Text>
                                    )}
                                    {!fleeEnabled && fleeSubtitle === null && (
                                        <Text style={styles.choiceSub}>
                                            {vm.preludeChrome!.fleeDisabledHint}
                                        </Text>
                                    )}
                                </View>
                            </TouchableOpacity>
                        </View>

                        <ChainBar label={vm.preludeChrome!.sealLabel} />
                    </>
                )}
            </Animated.View>
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
        // Backdrop opacity tuned to the design's diegetic-stack target
        // (chat 2 §IV — "map persists at 35% opacity behind every
        // modal"). 0.65 backdrop fill = ~35% map visibility. Mirrors
        // `design/handoff-2026-05-16/project/prototype.jsx:454`
        // `'rgba(10,10,10,0.6)'` for the combat-event shell; ours is
        // marginally darker (0.65 vs 0.6) so the panel border reads
        // sharp on the lighter regions of the exploration map. Phase
        // 39 port from the handoff bundle.
        backgroundColor: 'rgba(10, 10, 10, 0.65)',
    },
    panel: {
        position: 'absolute',
        // User-direct tighter insets (2026-05-21): combat content
        // (CombatPanel renders enemy panel + log + HUD +
        // PhaseStack) outgrew the prior `top: 56, bottom: 84`
        // padding tuned for the design's prelude-only modal.
        // The tab bar is hidden during the modal session now
        // (Phase 63c+), so the bottom inset no longer needs to
        // leave room for it. Tightened insets still preserve the
        // chat-2 §IV diegetic-stack continuity (a thin strip of
        // map shows above + below) while giving the combat
        // surface ~120 more vertical pixels to fit content
        // without aggressive scrolling.
        left: 12,
        right: 12,
        top: 24,
        bottom: 24,
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
    // Phase 45 — italic subtitle under each action-button label
    // (ports prototype.jsx:481-489 'ix · vi vitae · adv. unknown'
    // pattern). Distinct from `choiceSub` which is the disabled-FLEE
    // hint (chain-bar-shaped chrome); the subtitle is per-choice
    // cost/consequence preview.
    choiceSubtitle: {
        fontFamily: FONTS.serifItalic,
        fontSize: 11,
        color: AXM.bone,
        marginTop: 2,
    },
    // Phase 63b — combat-mode ScrollView wrap. The panel has a
    // bounded height (top: 56, bottom: 84); CombatPanel renders
    // EnemyPanel + log + HUD + PhaseStack, often taller than the
    // panel viewport, so the scroll lets the player see all of
    // it without breaking the modal containment.
    combatScroll: { flex: 1 },
    combatScrollContent: { paddingBottom: 12 },
});
