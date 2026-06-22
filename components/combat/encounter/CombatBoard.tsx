/**
 * Spec 26 / 26b — the Combat board. A direct structural adaptation of
 * `HazardBoard.tsx`: same drag model (drag a card up to stage; drag to SCRAP to
 * discard; tap to read), same fanned hand dock, same segmented meters — with
 * combat sections replacing the hazard ones:
 *
 *   header (enemy · phase · round · ledger)
 *   combatant pane (portraits, enemy HP, player HP, status FRONT AND CENTRE)
 *   pressure tracks (DoT Erosion + Control Saturation)
 *   conviction + Signature Skills bar
 *   2-die DRAFT tray (tap one → your stance; the other → ◆) + the read banner
 *   play area (the staged card → FREE / POWER with your drafted die)
 *   dock (SCRAP · fanned hand · END PHASE)
 *
 * The drag ghost renders at screen level in `app/combat-encounter/index.tsx`.
 */

import React, { useCallback, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    FadeIn, FadeInDown, LinearTransition, runOnJS,
    useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';

import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';
import type {
    CombatViewModel, CombatCardVM, CombatTrackVM, CombatDieVM,
    CombatSignatureVM, CombatEffectChipVM, CombatThresholdPhaseVM,
} from '@/state/presenters/combat-encounter.engine';
import { TrashGlyph, LedgerMark } from '@/components/hazard/glyphs';
import { CombatCombatantPane } from './CombatCombatantPane';
import { CombatDie } from './CombatDie';

// ── Drag plumbing (cards only — dice are tapped to draft) ────────────────────

export type DragPayload = { type: 'card'; from: 'hand' | 'play'; uid: string; card: CombatCardVM };

export interface DragController {
    begin: (payload: DragPayload, x: number, y: number) => void;
    move: (x: number, y: number) => void;
    end: (x: number, y: number) => void;
    active: DragPayload | null;
}

interface Rect { x: number; y: number; width: number; height: number; }
function rectContains(r: Rect | null, x: number, y: number, pad = 0): boolean {
    if (!r) return false;
    return x >= r.x - pad && x <= r.x + r.width + pad && y >= r.y - pad && y <= r.y + r.height + pad;
}
function measureRect(ref: React.RefObject<View | null>): Promise<Rect | null> {
    return new Promise((resolve) => {
        const node = ref.current;
        if (!node) { resolve(null); return; }
        node.measureInWindow((x, y, width, height) => resolve({ x, y, width, height }));
    });
}

const READ_ACCENT: Record<string, string> = {
    advantage: '#5bbf6a', neutral: '#c2a14e', disadvantage: '#e2543b', none: '#8a8273',
};

// ── Pressure track ───────────────────────────────────────────────────────────

function PressureTrack({ track, projected }: { track: CombatTrackVM; projected: number }) {
    const AXM = usePalette();
    const styles = useStyles();
    const projPct = track.threshold > 0 ? Math.min(1, (track.value + projected) / track.threshold) : track.pct;
    return (
        <View style={styles.track} testID={`combat-track-${track.key}`}>
            <View style={styles.trackHead}>
                <Text style={[styles.trackLabel, { color: track.color }]}>{track.label}</Text>
                <Text style={styles.trackVal}>
                    <Text style={{ color: track.reached ? track.color : AXM.parchment }}>{track.value}</Text>
                    {projected > 0 ? <Text style={{ color: track.color }}> +{projected}</Text> : null}
                    <Text style={{ color: AXM.bone }}> / {track.threshold} WIN{track.reached ? ' ✓' : ''}</Text>
                </Text>
            </View>
            <View style={styles.barTrack} testID={`combat-track-${track.key}-fill`}>
                {projected > 0 ? <View style={[styles.barProj, { width: `${Math.round(projPct * 100)}%`, backgroundColor: track.color }]} /> : null}
                <Animated.View layout={LinearTransition.duration(160)} style={[styles.barFill, { width: `${Math.round(track.pct * 100)}%`, backgroundColor: track.color }]} />
            </View>
            <Text style={[styles.phaseClear, { color: track.phaseMet ? '#5bbf6a' : AXM.bone }]}>
                phase clear {track.phaseProgress}/{track.phaseReq}{track.phaseMet ? ' ✓ CLEARED' : ''}
            </Text>
        </View>
    );
}

// ── Threat timeline (the always-revealed, learnable pattern) ─────────────────

const TL_ACCENT: Record<CombatThresholdPhaseVM['mark'], string> = {
    current: '#d4c026', clear: '#5bbf6a', overwhelmed: '#e2543b', pending: '#8a8273',
};

function ThreatTimeline({ phases, momentumNote }: { phases: CombatThresholdPhaseVM[]; momentumNote: string | null }) {
    const styles = useStyles();
    return (
        <View style={styles.timelineWrap} testID="combat-threat-timeline">
            <View style={styles.timelineRow}>
                {phases.map((p) => {
                    const accent = TL_ACCENT[p.mark];
                    const mark = p.mark === 'clear' ? '✓' : p.mark === 'overwhelmed' ? '✗' : p.mark === 'current' ? '▸' : '·';
                    return (
                        <View
                            key={p.index}
                            style={[styles.tlChip, { borderColor: accent, opacity: p.mark === 'pending' ? 0.6 : 1, backgroundColor: p.mark === 'current' ? 'rgba(212,192,38,0.14)' : 'transparent' }]}
                            accessibilityRole="text"
                            accessibilityLabel={`Phase ${p.index}: clear ${p.dot} DoT or ${p.control} Control. ${p.mark}`}
                        >
                            <Text style={[styles.tlPhase, { color: accent }]}>{mark} P{p.index}</Text>
                            <Text style={styles.tlReq}>🔥{p.dot} ⛓{p.control}</Text>
                        </View>
                    );
                })}
            </View>
            {momentumNote && <Text style={styles.momentum}>⟜ {momentumNote}</Text>}
        </View>
    );
}

// ── Signature Skills bar ─────────────────────────────────────────────────────

function SignatureBar({ conviction, signatures, onCast }: { conviction: number; signatures: CombatSignatureVM[]; onCast: (id: string) => void }) {
    const AXM = usePalette();
    const styles = useStyles();
    return (
        <View style={styles.sigPanel} testID="combat-signature-bar">
            <Text style={styles.sigHead}>◆ {conviction} — SIGNATURE SKILLS</Text>
            <View style={styles.sigRow}>
                {signatures.map((s) => (
                    <Pressable
                        key={s.id}
                        disabled={!s.affordable}
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined); onCast(s.id); }}
                        testID={`combat-signature-${s.id}`}
                        accessibilityRole="button"
                        accessibilityState={{ disabled: !s.affordable }}
                        accessibilityLabel={`${s.name}, costs ${s.cost} conviction. ${s.description}${s.affordable ? '' : ' — not enough conviction'}`}
                        style={[styles.sigChip, { borderColor: s.affordable ? AXM.sulfur : AXM.ash, opacity: s.affordable ? 1 : 0.45 }]}
                    >
                        <Text style={[styles.sigIcon, { color: s.affordable ? AXM.sulfur : AXM.bone }]}>{s.icon}</Text>
                        <Text style={[styles.sigName, { color: s.affordable ? AXM.parchment : AXM.bone }]} numberOfLines={1}>{s.name}</Text>
                        <Text style={[styles.sigCost, { color: s.affordable ? AXM.sulfur : AXM.ash }]}>◆{s.cost}</Text>
                    </Pressable>
                ))}
            </View>
        </View>
    );
}

// ── Dice draft tray ──────────────────────────────────────────────────────────

function DiceTray({ vm, onDraft, onNewTurn }: { vm: CombatViewModel; onDraft: (id: string) => void; onNewTurn: () => void }) {
    const AXM = usePalette();
    const styles = useStyles();
    const readColor = READ_ACCENT[vm.read.result] ?? AXM.bone;
    return (
        <View style={styles.tray} testID="combat-dice-tray">
            <View style={styles.trayHead}>
                <Text style={styles.trayLabel}>⬡ DRAFT YOUR STANCE — TAP ONE DIE</Text>
                <Pressable onPress={onNewTurn} testID="combat-new-turn" accessibilityRole="button" accessibilityLabel="New turn — roll two fresh dice" style={styles.newTurn}>
                    <Text style={styles.newTurnText}>↻ NEW TURN</Text>
                </Pressable>
            </View>
            <View style={styles.trayDice}>
                {vm.dice.map((die) => (
                    <Pressable
                        key={die.id}
                        disabled={vm.hasDraft || die.isX}
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid).catch(() => undefined); onDraft(die.id); }}
                        accessibilityRole="button"
                    >
                        <CombatDie die={die} size={56} dimmed={vm.hasDraft} />
                        {!vm.hasDraft && die.readPip && die.readPip !== 'none' ? (
                            <Text style={[styles.diePip, { color: READ_ACCENT[die.readPip] }]}>
                                {die.readPip === 'advantage' ? '▲ ADV' : die.readPip === 'disadvantage' ? '▼ DIS' : '— EVEN'}
                            </Text>
                        ) : null}
                        {vm.hasDraft && !die.drafted && <Text style={styles.dieConv}>→ +1 ◆</Text>}
                        {die.drafted && <Text style={[styles.dieConv, { color: AXM.sulfur }]}>{die.spent ? 'SPENT' : 'STANCE'}</Text>}
                    </Pressable>
                ))}
                {vm.dice.length === 0 && <Text style={styles.trayEmpty}>press NEW TURN to roll</Text>}
            </View>
            {vm.hasDraft ? (
                <View style={[styles.readBanner, { borderColor: readColor }]} testID="combat-read-banner">
                    <Text style={[styles.readText, { color: readColor }]}>READ: {vm.read.text}</Text>
                    {!vm.drafted && <Text style={styles.spentHint}>stance die spent — POWER landed nothing, or press ↻ NEW TURN</Text>}
                </View>
            ) : (
                <Text style={styles.draftHint}>the die you pick is your stance · the other becomes ◆ Conviction</Text>
            )}
        </View>
    );
}

// ── Staged card (FREE / POWER) ───────────────────────────────────────────────

function StagedCard({ card, drafted, onPlay, gesture }: { card: CombatCardVM; drafted: boolean; onPlay: (uid: string, useBottom: boolean) => void; gesture: ReturnType<typeof Gesture.Exclusive> }) {
    const AXM = usePalette();
    const styles = useStyles();
    const readBorder = card.read ? READ_ACCENT[card.read] : card.stanceColor;
    return (
        <View style={styles.stagedCol}>
            <GestureDetector gesture={gesture}>
                <Animated.View entering={FadeInDown.duration(180)} style={[styles.stagedCard, { borderColor: readBorder }]} testID={`combat-staged-${card.uid}`}>
                    <View style={[styles.cardStanceBar, { backgroundColor: card.stanceColor }]} />
                    <Text style={styles.cardName} numberOfLines={1}>{card.name}</Text>
                    <Text style={styles.cardTier}>{card.stance.toUpperCase()} · T{card.tier}{card.colorMatch ? ' · MATCH' : ''}</Text>
                    <Text style={styles.cardBody} numberOfLines={3}>{card.bottomActionText}</Text>
                </Animated.View>
            </GestureDetector>
            <View style={styles.actionRow}>
                <Pressable onPress={() => { Haptics.selectionAsync().catch(() => undefined); onPlay(card.uid, false); }} testID={`combat-free-${card.uid}`} accessibilityRole="button" accessibilityLabel={`Free action: ${card.topActionText}`} style={[styles.actBtn, { borderColor: AXM.bone }]}>
                    <Text style={[styles.actText, { color: AXM.parchment }]}>FREE</Text>
                </Pressable>
                <Pressable disabled={!drafted} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => undefined); onPlay(card.uid, true); }} testID={`combat-power-${card.uid}`} accessibilityRole="button" accessibilityState={{ disabled: !drafted }} accessibilityLabel={drafted ? `Power action with your stance die: ${card.bottomActionText}` : `Power is locked — draft a stance die first. ${card.bottomActionText}`} style={[styles.actBtn, { borderColor: drafted ? readBorder : AXM.ash, opacity: drafted ? 1 : 0.5 }]}>
                    <Text style={[styles.actText, { color: drafted ? readBorder : AXM.bone }]}>POWER{drafted && card.track !== 'none' ? ` +${card.bottomPressurePreview}` : ''}</Text>
                </Pressable>
            </View>
            {drafted
                ? <Text style={styles.actHint}>POWER spends your stance die · FREE plays for +1, no die</Text>
                : <Text style={[styles.actHint, { color: '#c2a14e' }]}>↑ draft a stance die above to POWER this card — or play FREE for +1</Text>}
        </View>
    );
}

// ── END PHASE button ─────────────────────────────────────────────────────────

function EndPhaseButton({ onPress }: { onPress: () => void }) {
    const AXM = usePalette();
    const styles = useStyles();
    const pulse = useSharedValue(0);
    React.useEffect(() => {
        pulse.value = withRepeat(withSequence(withTiming(1, { duration: 1100 }), withTiming(0, { duration: 1100 })), -1);
    }, [pulse]);
    const glow = useAnimatedStyle(() => ({ shadowOpacity: 0.3 + pulse.value * 0.4 }));
    return (
        <Animated.View style={[styles.playWrap, glow]}>
            <Pressable onPress={onPress} testID="combat-end-phase" accessibilityRole="button" accessibilityLabel="End phase — resolve pressure against the threat thresholds" style={[styles.playBtn, { borderColor: AXM.sulfur, backgroundColor: 'rgba(212,192,38,0.16)' }]}>
                <Text style={[styles.playText, { color: AXM.sulfur }]}>END</Text>
                <Text style={[styles.playSub, { color: AXM.sulfur }]}>PHASE</Text>
            </Pressable>
        </Animated.View>
    );
}

// ── The board ────────────────────────────────────────────────────────────────

export interface CombatBoardProps {
    vm: CombatViewModel;
    drag: DragController;
    stagedUid: string | null;
    onDraft: (dieId: string) => void;
    onStage: (uid: string) => void;
    onUnstage: (uid: string) => void;
    onPlayCard: (uid: string, useBottom: boolean) => void;
    onDiscard: (uid: string) => void;
    onSignature: (id: string) => void;
    onNewTurn: () => void;
    onEndPhase: () => void;
    onInspect: (card: CombatCardVM) => void;
    onChip?: (e: CombatEffectChipVM) => void;
}

export const CombatBoard = React.memo(function CombatBoard({
    vm, drag, stagedUid, onDraft, onStage, onUnstage, onPlayCard, onDiscard, onSignature, onNewTurn, onEndPhase, onInspect, onChip,
}: CombatBoardProps) {
    const AXM = usePalette();
    const styles = useStyles();
    const playAreaRef = useRef<View | null>(null);
    const trashRef = useRef<View | null>(null);

    const resolveDrop = useCallback(async (payload: DragPayload, x: number, y: number) => {
        if (x < 0 && y < 0) return;
        if (payload.from === 'hand') {
            const trashRect = await measureRect(trashRef);
            if (rectContains(trashRect, x, y, 18)) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => undefined);
                onDiscard(payload.uid); return;
            }
            const playRect = await measureRect(playAreaRef);
            if (rectContains(playRect, x, y)) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
                onStage(payload.uid);
            } else {
                onInspect(payload.card);
            }
            return;
        }
        if (payload.from === 'play') {
            const playRect = await measureRect(playAreaRef);
            if (!rectContains(playRect, x, y)) onUnstage(payload.uid);
        }
    }, [onDiscard, onStage, onUnstage, onInspect]);

    (drag as DragController & { resolveDrop?: typeof resolveDrop }).resolveDrop = resolveDrop;

    const handCardGesture = (card: CombatCardVM) => {
        const pan = Gesture.Pan().minDistance(10)
            .onStart((e) => { runOnJS(drag.begin)({ type: 'card', from: 'hand', uid: card.uid, card }, e.absoluteX, e.absoluteY); })
            .onUpdate((e) => { runOnJS(drag.move)(e.absoluteX, e.absoluteY); })
            .onEnd((e) => { runOnJS(drag.end)(e.absoluteX, e.absoluteY); })
            .onFinalize((e, ok) => { if (!ok) runOnJS(drag.end)(-1, -1); });
        const tap = Gesture.Tap().maxDistance(9).onEnd(() => { runOnJS(onInspect)(card); });
        return Gesture.Exclusive(pan, tap);
    };

    const stagedGesture = (card: CombatCardVM) => {
        const pan = Gesture.Pan().minDistance(10)
            .onStart((e) => { runOnJS(drag.begin)({ type: 'card', from: 'play', uid: card.uid, card }, e.absoluteX, e.absoluteY); })
            .onUpdate((e) => { runOnJS(drag.move)(e.absoluteX, e.absoluteY); })
            .onEnd((e) => { runOnJS(drag.end)(e.absoluteX, e.absoluteY); })
            .onFinalize((e, ok) => { if (!ok) runOnJS(drag.end)(-1, -1); });
        const tap = Gesture.Tap().maxDistance(9).onEnd(() => { runOnJS(onUnstage)(card.uid); });
        return Gesture.Exclusive(pan, tap);
    };

    const fan = vm.hand.filter((c) => c.uid !== stagedUid);
    const staged = stagedUid ? vm.hand.find((c) => c.uid === stagedUid) ?? null : null;
    const n = fan.length;
    const mid = (n - 1) / 2;
    const overlap = n > 6 ? 48 : n > 4 ? 34 : 18;

    return (
        <View style={styles.root} testID="combat-board">
            {/* header */}
            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle} numberOfLines={1}>{vm.enemy.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <Text style={[styles.phaseBadge, { backgroundColor: AXM.rust }]}>{vm.phaseBadge}</Text>
                        <Text style={styles.roundLabel}>{vm.roundLabel} · {vm.turnLabel}</Text>
                    </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 4 }} testID="combat-ledger">
                    {vm.ledger.map((m, i) => <LedgerMark key={i} kind={m === 'clear' ? 'O' : m === 'overwhelmed' ? 'X' : 'pending'} size={20} />)}
                </View>
            </View>

            <CombatCombatantPane enemy={vm.enemy} player={vm.player} conviction={vm.conviction} onChip={onChip} />

            {/* pressure tracks (with the staged card's real-time projection) */}
            <View style={styles.tracksPanel} testID="combat-pressure-tracks">
                {vm.tracks.map((t) => (
                    <PressureTrack key={t.key} track={t} projected={staged && staged.projected.track === t.key ? staged.projected.amount : 0} />
                ))}
                <ThreatTimeline phases={vm.thresholdPhases} momentumNote={vm.momentumNote} />
            </View>

            <SignatureBar conviction={vm.conviction} signatures={vm.signatures} onCast={onSignature} />

            <DiceTray vm={vm} onDraft={onDraft} onNewTurn={onNewTurn} />

            {/* play area */}
            <View ref={playAreaRef} style={[styles.playArea, { borderColor: staged ? `${AXM.sulfur}88` : AXM.ash }]} testID="combat-play-area">
                <View style={styles.playHead}>
                    <Text style={[styles.playLabel, { color: staged ? AXM.sulfur : AXM.bone }]}>PLAY AREA</Text>
                    <Text style={styles.deckCounts}>DECK {vm.deckCount} · DISCARD {vm.discardCount}</Text>
                </View>
                {staged ? (
                    <StagedCard card={staged} drafted={vm.drafted} onPlay={onPlayCard} gesture={stagedGesture(staged)} />
                ) : (
                    <View style={styles.playEmpty}>
                        <Text style={styles.playEmptyText}>drag a card up — POWER it with your stance die</Text>
                    </View>
                )}
            </View>

            {/* dock */}
            <View style={styles.dock}>
                <View ref={trashRef} style={[styles.trashBin, drag.active ? { borderColor: AXM.blood, backgroundColor: AXM.bloodSubtle, borderStyle: 'solid' } : null]} testID="combat-trash" accessible accessibilityLabel="Scrap bin. Drag a card here to discard it.">
                    <TrashGlyph size={20} color={drag.active ? AXM.blood : AXM.bone} />
                    <Text style={[styles.trashLabel, drag.active ? { color: AXM.blood } : null]}>SCRAP</Text>
                </View>
                <View style={styles.fan} testID="combat-hand">
                    {fan.map((card, i) => (
                        <GestureDetector key={card.uid} gesture={handCardGesture(card)}>
                            <Animated.View
                                entering={FadeIn.duration(180)} layout={LinearTransition.duration(160)}
                                style={{
                                    marginLeft: i === 0 ? 0 : -overlap,
                                    zIndex: drag.active?.uid === card.uid ? 30 : i,
                                    opacity: drag.active?.uid === card.uid ? 0.3 : 1,
                                    transform: [{ translateY: Math.abs(i - mid) * 8 }, { rotate: `${(i - mid) * 5}deg` }],
                                }}
                                testID={`combat-hand-${card.uid}`}
                                accessible accessibilityRole="button"
                                accessibilityLabel={`${card.name}, ${card.stance} ${card.track} card. ${card.bottomActionText}`}
                                accessibilityHint="Drag up to stage, or tap to read"
                            >
                                <HandCard card={card} />
                            </Animated.View>
                        </GestureDetector>
                    ))}
                </View>
                <EndPhaseButton onPress={onEndPhase} />
            </View>
        </View>
    );
});

// ── A small fanned hand card ─────────────────────────────────────────────────

function HandCard({ card }: { card: CombatCardVM }) {
    const styles = useStyles();
    const TRACK_GLYPH: Record<string, string> = { dot: '🔥', control: '⛓', none: '◆' };
    return (
        <View style={[styles.handCard, { borderColor: card.stanceColor }]}>
            <View style={[styles.cardStanceBar, { backgroundColor: card.stanceColor }]} />
            <Text style={styles.handName} numberOfLines={2}>{card.name}</Text>
            <Text style={[styles.handTrack, { color: card.stanceColor }]}>{TRACK_GLYPH[card.track]} {card.stance[0].toUpperCase()}</Text>
            {card.track !== 'none' && <Text style={styles.handPrev}>+{card.bottomPressurePreview}</Text>}
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    root: { flex: 1, backgroundColor: '#0c0a08' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: AXM.ash },
    headerTitle: { fontFamily: FONTS.gothic, fontSize: 17, color: AXM.parchment, letterSpacing: 0.5 },
    phaseBadge: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 1.2, color: AXM.bg, paddingHorizontal: 5, paddingVertical: 1, overflow: 'hidden' },
    roundLabel: { fontFamily: FONTS.mono, fontSize: 11, color: AXM.bone, letterSpacing: 0.8 },

    tracksPanel: { paddingHorizontal: 12, paddingVertical: 7, backgroundColor: 'rgba(6,5,4,0.82)', borderBottomWidth: 1, borderBottomColor: AXM.ash, gap: 6 },
    track: {},
    trackHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
    trackLabel: { fontFamily: FONTS.sans, fontSize: 12, letterSpacing: 1.2 },
    trackVal: { fontFamily: FONTS.mono, fontSize: 13 },
    barTrack: { height: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1, borderColor: AXM.ash, marginTop: 2, overflow: 'hidden', position: 'relative' },
    barFill: { position: 'absolute', left: 0, top: 0, bottom: 0 },
    barProj: { position: 'absolute', left: 0, top: 0, bottom: 0, opacity: 0.4 },
    phaseClear: { fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 0.4, marginTop: 1 },
    momentum: { fontFamily: FONTS.mono, fontSize: 10, color: '#c2a14e', letterSpacing: 0.4, marginTop: 3, textAlign: 'center' },
    timelineWrap: { marginTop: 3 },
    timelineRow: { flexDirection: 'row', gap: 5, justifyContent: 'space-between' },
    tlChip: { flex: 1, borderWidth: 1, borderRadius: 3, paddingVertical: 2, paddingHorizontal: 3, alignItems: 'center' },
    tlPhase: { fontFamily: FONTS.sans, fontSize: 10, letterSpacing: 0.5 },
    tlReq: { fontFamily: FONTS.mono, fontSize: 10, color: AXM.parchment, letterSpacing: 0.2, marginTop: 1 },

    sigPanel: { paddingHorizontal: 12, paddingVertical: 5, backgroundColor: 'rgba(212,192,38,0.07)', borderBottomWidth: 1, borderBottomColor: AXM.ash },
    sigHead: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 1.2, color: AXM.sulfur, marginBottom: 4 },
    sigRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
    sigChip: { flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderRadius: 3, paddingHorizontal: 5, paddingVertical: 3, backgroundColor: 'rgba(0,0,0,0.4)' },
    sigIcon: { fontSize: 12 },
    sigName: { fontFamily: FONTS.sans, fontSize: 10, letterSpacing: 0.4, maxWidth: 96 },
    sigCost: { fontFamily: FONTS.mono, fontSize: 10 },

    tray: { paddingHorizontal: 12, paddingTop: 7, paddingBottom: 6, backgroundColor: 'rgba(0,0,0,0.35)' },
    trayHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
    trayLabel: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 1, color: AXM.bone },
    newTurn: { borderWidth: 1, borderColor: AXM.bone, paddingHorizontal: 7, paddingVertical: 2 },
    newTurnText: { fontFamily: FONTS.mono, fontSize: 10, color: AXM.parchment, letterSpacing: 0.8 },
    trayDice: { flexDirection: 'row', gap: 22, justifyContent: 'center', alignItems: 'flex-start', minHeight: 70 },
    dieConv: { fontFamily: FONTS.mono, fontSize: 9, color: AXM.bone, textAlign: 'center', marginTop: 2, letterSpacing: 0.5 },
    diePip: { fontFamily: FONTS.sans, fontSize: 10, textAlign: 'center', marginTop: 2, letterSpacing: 0.6 },
    trayEmpty: { fontFamily: FONTS.serifItalic, fontStyle: 'italic', fontSize: 13, color: AXM.ash, alignSelf: 'center' },
    readBanner: { borderWidth: 1, paddingVertical: 3, paddingHorizontal: 8, marginTop: 5, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
    readText: { fontFamily: FONTS.sans, fontSize: 12, letterSpacing: 0.8, textAlign: 'center' },
    spentHint: { fontFamily: FONTS.mono, fontSize: 9, color: AXM.bone, textAlign: 'center', marginTop: 2 },
    draftHint: { fontFamily: FONTS.serifItalic, fontStyle: 'italic', fontSize: 11, color: AXM.bone, textAlign: 'center', marginTop: 5 },

    playArea: { flex: 1, marginHorizontal: 10, marginVertical: 7, borderWidth: 1.5, borderStyle: 'dashed', backgroundColor: 'rgba(212,192,38,0.04)', paddingHorizontal: 8, paddingVertical: 6 },
    playHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
    playLabel: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 1.2 },
    deckCounts: { fontFamily: FONTS.mono, fontSize: 10, color: AXM.bone, letterSpacing: 1 },
    playEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    playEmptyText: { fontFamily: FONTS.serifItalic, fontStyle: 'italic', fontSize: 13, color: AXM.ash, textAlign: 'center' },
    stagedCol: { alignItems: 'center', gap: 5 },
    stagedCard: { width: 200, borderWidth: 2, borderRadius: 4, backgroundColor: '#1a160f', paddingHorizontal: 9, paddingVertical: 7, overflow: 'hidden' },
    cardStanceBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
    cardName: { fontFamily: FONTS.gothic, fontSize: 15, color: AXM.parchment, marginLeft: 4 },
    cardTier: { fontFamily: FONTS.mono, fontSize: 9, color: AXM.bone, letterSpacing: 0.6, marginLeft: 4, marginTop: 1 },
    cardBody: { fontFamily: FONTS.serif, fontSize: 11, color: AXM.bone, marginLeft: 4, marginTop: 4, lineHeight: 14 },
    actionRow: { flexDirection: 'row', gap: 7 },
    actBtn: { borderWidth: 1.5, paddingHorizontal: 18, paddingVertical: 4, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
    actText: { fontFamily: FONTS.sans, fontSize: 12, letterSpacing: 1.4 },
    actHint: { fontFamily: FONTS.mono, fontSize: 9, color: AXM.bone, textAlign: 'center', marginTop: 3, letterSpacing: 0.3 },

    dock: { height: 150, borderTopWidth: 1, borderTopColor: AXM.ash },
    trashBin: { position: 'absolute', left: 8, bottom: 10, zIndex: 40, width: 60, height: 60, borderRadius: 30, borderWidth: 1.5, borderStyle: 'dashed', borderColor: AXM.ash, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
    trashLabel: { fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1, color: AXM.bone, marginTop: 1 },
    fan: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 10 },
    handCard: { width: 86, height: 112, borderWidth: 1.5, borderRadius: 4, backgroundColor: '#16130c', paddingHorizontal: 7, paddingVertical: 7, overflow: 'hidden', justifyContent: 'flex-start' },
    handName: { fontFamily: FONTS.gothic, fontSize: 13, color: AXM.parchment, marginLeft: 4, lineHeight: 15 },
    handTrack: { fontFamily: FONTS.sans, fontSize: 12, letterSpacing: 0.5, marginLeft: 4, marginTop: 5 },
    handPrev: { fontFamily: FONTS.mono, fontSize: 12, color: AXM.parchment, marginLeft: 4, marginTop: 'auto' },

    playWrap: { position: 'absolute', right: 10, bottom: 12, zIndex: 40, shadowColor: AXM.sulfur, shadowRadius: 14, shadowOffset: { width: 0, height: 0 }, elevation: 8 },
    playBtn: { width: 74, height: 74, borderRadius: 37, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
    playText: { fontFamily: FONTS.gothic, fontSize: 16, letterSpacing: 1, lineHeight: 17 },
    playSub: { fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1, marginTop: 1 },
}));
