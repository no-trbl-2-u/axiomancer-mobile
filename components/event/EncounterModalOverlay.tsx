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
import Svg, { Path as SvgPath, Circle as SvgCircle, Defs as SvgDefs, RadialGradient as SvgRadialGradient, Stop as SvgStop } from 'react-native-svg';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    Easing,
} from 'react-native-reanimated';

import { CombatPanel } from '@/components/combat/CombatPanel';
import { CombatDefeatPanel } from '@/components/event/aftermath/CombatDefeatPanel';
import { CombatFriendshipPanel } from '@/components/event/aftermath/CombatFriendshipPanel';
import { CombatVictoryPanel } from '@/components/event/aftermath/CombatVictoryPanel';
import { EventArt } from '@/components/event/EventArt';
import { EventCodexHeader } from '@/components/event/EventCodexHeader';
import { Splatter } from '@/components/Splatter';
import { ActionIcon } from '@/components/ActionIcon';
import { AXM, FONTS } from '@/theme/axm';
import { useAesthetic } from '@/state/aesthetic-mode';
import { useCombatMode } from '@/state/combat-mode';
import { useGameState, useGameStore } from '@/state/GameStoreProvider';
import { selectAftermathViewModel } from '@/state/presenters/aftermath.engine';
import {
    selectEncounterSealChrome,
    type EncounterSealMode,
} from '@/state/presenters/encounter-seal.engine';
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
    // Phase 70 Tick A — `combat` flips to `aftermath` when the
    // combat-mode shim's `lastOutcome === 'victory'`; the modal
    // body swaps from `<CombatPanel>` to `<CombatVictoryPanel>`
    // in place, and the seal stays closed until the panel's
    // CARRY ON button fires `dismissAftermath()`.
    const [mode, setMode] = useState<EncounterModalMode>('prelude');
    const {
        lastOutcome,
        aftermathData,
        dismissAftermath,
        resetRunStats,
    } = useCombatMode();
    const handleFight = useCallback(() => {
        onFight();
        setMode('combat');
    }, [onFight]);

    // Phase 70 Tick A — watch the outcome signal. On 'victory' (the
    // only branch with a Tick A panel), swap mode to 'aftermath'.
    // Phase 70 Tick B — extend to 'parley' (friendship panel).
    // Phase 70 Tick C — extend to 'defeat' (defeat panel).
    useEffect(() => {
        if (
            mode === 'combat'
            && (lastOutcome === 'victory' || lastOutcome === 'parley' || lastOutcome === 'defeat')
            && aftermathData !== null
        ) {
            setMode('aftermath');
        }
    }, [mode, lastOutcome, aftermathData]);

    // Phase 70 Tick C — BEGIN AGAIN restarts the run. Full-heal the
    // player + reset the run-stats counters + dismiss. Engine-level
    // "new game" / fresh-seed restart is a follow-up; this is the
    // minimum meaningful "start over" hook.
    const store = useGameStore();
    const handleBeginAgain = useCallback(() => {
        const state = store.getState();
        if (state.player !== undefined) {
            store.setState({
                player: {
                    ...state.player,
                    health: state.player.maxHealth,
                } as never,
            });
        }
        resetRunStats();
        dismissAftermath();
    }, [store, resetRunStats, dismissAftermath]);

    const aftermathVm = selectAftermathViewModel(aftermathData);

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
    // Phase 71 — phase-aware seal chrome. Round count comes from
    // the engine combat slice (defaults to 1 in prelude / when the
    // slice isn't live).
    const combatRound = useGameState((s) => s.combat?.round ?? 1);
    const sealChrome = selectEncounterSealChrome(mode as EncounterSealMode, combatRound);
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
    // synchronously). Gate the early-return on mode: only the
    // prelude branch needs the prelude VM. Combat mode reads from
    // the engine combat slice via `<CombatPanel>`; aftermath mode
    // (Phase 70 Tick A) reads from the snapshot stashed in
    // `combat-mode` and surfaced via `aftermathVm`.
    const preludeRenderable = vm.kind === 'combat-prelude' && vm.preludeChrome !== null;
    if (mode === 'prelude' && !preludeRenderable) return null;
    if (mode === 'aftermath' && aftermathVm === null) {
        // Defensive — should not happen because we only flip into
        // aftermath when aftermathData is non-null. If it does (e.g.
        // a stale outcome signal), fall back to closing the modal.
        return null;
    }
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
            {/* Phase 73 — chain bars now sit OUTSIDE the seal panel
              * to match the design (`prototype.jsx:558-569` for the
              * top chain, `:605-617` for the bottom). The panel is
              * inset between them so the diamond strands frame the
              * seal rather than living inside its border. */}
            <ChainBarFixed position="top" label={sealChrome.topLabel} accentColor={sealChrome.accentColor} />
            <Animated.View
                style={[
                    styles.panel,
                    // Phase 71/73 — phase-aware border + glow. Border
                    // color tracks the seal chrome (blood in prelude /
                    // combat, sulfur on aftermath). boxShadow uses the
                    // glow color so the outer halo around the panel
                    // matches the seal-state accent (rgba colors come
                    // from selectEncounterSealChrome).
                    {
                        borderColor: sealChrome.accentColor,
                        shadowColor: sealChrome.glowColor,
                        boxShadow: `0 0 0 1px #0a0a0a, 0 0 24px ${sealChrome.glowColor}, inset 0 0 60px rgba(0,0,0,0.7)`,
                    },
                    panelStyle,
                ]}
            >
                {/* Phase 73 — four corner rivets inside the seal,
                  * porting the design's `PtRivet` chrome (handoff
                  * bundle `prototype.jsx:580-583`). */}
                <Rivet position="tl" />
                <Rivet position="tr" />
                <Rivet position="bl" />
                <Rivet position="br" />
                {mode === 'aftermath' && aftermathVm !== null && aftermathVm.kind === 'victory' ? (
                    <CombatVictoryPanel
                        vm={aftermathVm}
                        onContinue={dismissAftermath}
                    />
                ) : mode === 'aftermath' && aftermathVm !== null && aftermathVm.kind === 'parley' ? (
                    <CombatFriendshipPanel
                        vm={aftermathVm}
                        onContinue={dismissAftermath}
                    />
                ) : mode === 'aftermath' && aftermathVm !== null && aftermathVm.kind === 'defeat' ? (
                    <CombatDefeatPanel
                        vm={aftermathVm}
                        onBeginAgain={handleBeginAgain}
                        onLetClose={dismissAftermath}
                    />
                ) : mode === 'combat' ? (
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
                    </>
                )}
            </Animated.View>
            {/* Phase 73 — bottom chain, also outside the panel. */}
            <ChainBarFixed
                position="bottom"
                label={sealChrome.bottomLabel}
                accentColor={sealChrome.accentColor}
            />
        </View>
    );
}

function ChainBarFixed({
    position,
    label,
    accentColor,
}: {
    position: 'top' | 'bottom';
    label: string;
    accentColor: string;
}) {
    return (
        <View
            style={[
                styles.chainBarFixed,
                position === 'top' ? styles.chainBarTop : styles.chainBarBottom,
            ]}
            testID="encounter-modal-chain"
            pointerEvents="none"
        >
            <Text
                style={[styles.chainDiamonds, { color: accentColor }]}
                numberOfLines={1}
                ellipsizeMode="clip"
            >
                {DIAMOND_STRAND}
            </Text>
            <Text style={[styles.chainText, { color: accentColor }]}>{label}</Text>
            <Text
                style={[styles.chainDiamonds, { color: accentColor }]}
                numberOfLines={1}
                ellipsizeMode="clip"
            >
                {DIAMOND_STRAND}
            </Text>
        </View>
    );
}

// Diamond strand flanking the label — ports the design's
// `<span>◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆</span>` chrome on either side of
// `SEALED · …`. The character itself comes from the mono font;
// letter-spacing matches the design (~2px) so the strand reads as
// a chain of rivets, not run-on glyphs. Phase 73 port from the
// 2026-05-23 handoff bundle (`prototype.jsx:566 / :614`).
const DIAMOND_STRAND = '◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆';

function ChainBar({ label, accentColor }: { label: string; accentColor: string }) {
    return (
        <View style={styles.chainBar} testID="encounter-modal-chain">
            <Text
                style={[styles.chainDiamonds, { color: accentColor }]}
                numberOfLines={1}
                ellipsizeMode="clip"
            >
                {DIAMOND_STRAND}
            </Text>
            <Text style={[styles.chainText, { color: accentColor }]}>{label}</Text>
            <Text
                style={[styles.chainDiamonds, { color: accentColor }]}
                numberOfLines={1}
                ellipsizeMode="clip"
            >
                {DIAMOND_STRAND}
            </Text>
        </View>
    );
}

// Four corner rivets inside the seal panel — ports the design's
// `PtRivet` components (`prototype.jsx:621-630`) which render as
// metallic dots with a radial highlight at top-left, dark base,
// thin black border. We approximate the gradient via SVG so it
// reads the same on web + native.
function Rivet({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) {
    const offsetStyle =
        position === 'tl' ? styles.rivetTL :
        position === 'tr' ? styles.rivetTR :
        position === 'bl' ? styles.rivetBL :
        styles.rivetBR;
    return (
        <View style={[styles.rivetWrap, offsetStyle]} pointerEvents="none">
            <Svg width={8} height={8} viewBox="0 0 8 8">
                <SvgDefs>
                    <SvgRadialGradient id="rivetFill" cx="35%" cy="30%" r="65%">
                        <SvgStop offset="0%" stopColor="#6a625a" />
                        <SvgStop offset="60%" stopColor="#2a2520" />
                        <SvgStop offset="100%" stopColor="#0a0a0a" />
                    </SvgRadialGradient>
                </SvgDefs>
                <SvgCircle cx={4} cy={4} r={3.5} fill="url(#rivetFill)" stroke="#0a0a0a" strokeWidth={0.5} />
            </Svg>
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
        // Phase 73 (2026-05-23, user-direct): pull the panel
        // close to all four screen edges. The seal should fill
        // the available real estate so the combat content
        // (enemy + log + phase stack + HUD) has room to breathe
        // without the body scrolling for every interaction. The
        // top/bottom insets leave 26px for the SEALED chain bars
        // that sit OUTSIDE the panel per the design
        // (`prototype.jsx:558-617`): each chain bar is 18px tall,
        // pinned 4px in from the screen edge, plus a 4px breath
        // gap before the panel border begins.
        left: 8,
        right: 8,
        top: 26,
        bottom: 22,
        // Phase 73 — match the design's panel fill `#0a0807`
        // (`prototype.jsx:574`). Slightly warmer than AXM.bg so
        // the panel reads as a sealed parchment leaf rather
        // than the same flat near-black as the page behind it.
        backgroundColor: '#0a0807',
        // Phase 72 — border bumped 1px → 2px to match the design
        // bundle's PtEncounterFlow (`prototype.jsx:574`)
        // `border: 2px solid $accent`. The color itself comes
        // from `sealChrome.accentColor` (Phase 71).
        borderWidth: 2,
        borderColor: AXM.rust,
        // Phase 73 — port the design's `boxShadow: 0 0 0 1px
        // #0a0a0a, 0 0 24px <accent-tint>, inset 0 0 60px
        // rgba(0,0,0,0.7)` (`prototype.jsx:576`). React Native's
        // legacy shadowProps can only carry the outer halo, so
        // we surface the dark 1px outer ring + inset darken via
        // `boxShadow` (RN 0.76+ web-compatible) and keep the
        // shadow* keys as a native fallback for older Android.
        // The accent-tint outer glow is driven by sealChrome.
        boxShadow:
            '0 0 0 1px #0a0a0a, 0 0 24px rgba(192,21,42,0.35), inset 0 0 60px rgba(0,0,0,0.7)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.8,
        shadowRadius: 24,
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
    // Phase 73 — chain bars OUTSIDE the panel, pinned to the screen
    // edges. Mirrors the design's `position: absolute, top: 0,
    // height: 18` / `bottom: 72, height: 18` chrome
    // (`prototype.jsx:558 / :605`). Gradient backgrounds + thin
    // accent rule are kept as native shadows because RN can't do
    // CSS gradients without an extra dep; the diamond strand + label
    // already carry the seal signal.
    chainBarFixed: {
        position: 'absolute',
        left: 4,
        right: 4,
        height: 18,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        backgroundColor: '#0e0506',
    },
    chainBarTop: {
        top: 4,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(192, 21, 42, 0.55)',
    },
    chainBarBottom: {
        bottom: 4,
        borderTopWidth: 1,
        borderTopColor: 'rgba(192, 21, 42, 0.55)',
    },
    chainRule: {
        flex: 1,
        height: 1,
        backgroundColor: AXM.rust,
        opacity: 0.6,
    },
    // Phase 73 — diamond strand flanking the chain label. Mono
    // glyph, narrow letter-spacing to keep the strand readable as
    // a chain rather than a run of glyphs. Width is `flex: 1` so
    // the label stays centered with equal-width strands either
    // side. `overflow: hidden` clips on phones too narrow to fit
    // the full strand.
    chainDiamonds: {
        flex: 1,
        fontFamily: FONTS.mono,
        fontSize: 8,
        letterSpacing: 2,
        color: AXM.blood,
        opacity: 0.85,
        overflow: 'hidden',
    },
    chainText: {
        fontFamily: FONTS.sans,
        fontSize: 9,
        letterSpacing: 2.4,
        color: AXM.blood,
        textAlign: 'center',
        paddingHorizontal: 6,
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
    // Phase 73 — corner rivets. Absolute-positioned 8px SVG dots
    // pinned 6px in from each panel corner. zIndex above the chain
    // bars + body so they read as part of the panel's metal-binding
    // chrome rather than getting clipped by content.
    rivetWrap: {
        position: 'absolute',
        width: 8,
        height: 8,
        zIndex: 5,
    },
    rivetTL: { top: 6, left: 6 },
    rivetTR: { top: 6, right: 6 },
    rivetBL: { bottom: 6, left: 6 },
    rivetBR: { bottom: 6, right: 6 },
    // Phase 72 — combat-body horizontal inset aligns with the
    // design bundle's `PtCombatBody` outer wrap
    // (`design/handoff-2026-05-23/project/prototype.jsx:697`
    // `padding: '8px 14px 12px'`). Pre-Phase-72 the scroll was
    // edge-to-edge and the EnemyPanel + phase rows looked cramped
    // against the modal border.
    combatScrollContent: { paddingBottom: 12, paddingHorizontal: 4 },
});
