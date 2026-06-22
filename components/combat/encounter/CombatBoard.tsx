/**
 * Spec 26 / 26b — the Combat board (HP model + drag-to-power UX, 2026-06-22).
 *
 * Adapted from `HazardBoard.tsx`'s drag model. The interaction is now:
 *   1. drag a card UP into the play area to STAGE it (drag to SCRAP to discard);
 *   2. drag a DIE onto the staged card to power it (the die is *selected*, not
 *      yet committed — you can re-drag a different die);
 *   3. read the PREVIEW ("if you apply this") — the stance-read + projected hit;
 *   4. tap APPLY to commit — drafts the die + powers the card in ONE step.
 *      Applying is irreversible; there is no FREE/POWER split and no undo.
 * A landed status refreshes the drafted die (the combo loop) so the next staged
 * card can be APPLYd straight away without dragging a new die.
 *
 *   header (enemy · phase · round · ledger)
 *   combatant pane (portraits, enemy HP — the SOLE bar, player HP, statuses)
 *   conviction + Signature Skills bar
 *   die tray (drag a die onto your card · NEW TURN)
 *   play area (the staged card → its die slot → PREVIEW → APPLY) — fills the modal
 *   dock (SCRAP · fanned hand · END PHASE)
 *
 * The drag ghost renders at screen level in `CombatEncounterPanel`.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
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
    CombatViewModel, CombatCardVM, CombatDieVM,
    CombatSignatureVM, CombatEffectChipVM,
} from '@/state/presenters/combat-encounter.engine';
import { TrashGlyph, LedgerMark } from '@/components/hazard/glyphs';
import { CombatCombatantPane } from './CombatCombatantPane';
import { CombatDie } from './CombatDie';

// ── Drag plumbing (cards AND dice) ───────────────────────────────────────────

export type DragPayload =
    | { type: 'card'; from: 'hand' | 'play'; uid: string; card: CombatCardVM }
    | { type: 'die'; dieId: string; die: CombatDieVM };

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
const READ_LABEL: Record<string, string> = {
    advantage: '▲ ADVANTAGE', neutral: '— EVEN', disadvantage: '▼ DISADVANTAGE', none: '? UNKNOWN',
};

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

// ── Die tray (drag a die onto your staged card) ──────────────────────────────

function DiceTray({
    vm, dieGesture, onNewTurn, draggingDieId, assignedDieIds,
}: {
    vm: CombatViewModel;
    dieGesture: (die: CombatDieVM) => ReturnType<typeof Gesture.Exclusive>;
    onNewTurn: () => void;
    draggingDieId: string | null;
    assignedDieIds: Set<string>;
}) {
    const AXM = usePalette();
    const styles = useStyles();
    return (
        <View style={styles.tray} testID="combat-dice-tray">
            <View style={styles.trayHead}>
                <Text style={styles.trayLabel}>⬡ DRAG A DIE ONTO YOUR CARD</Text>
                <Pressable onPress={onNewTurn} testID="combat-new-turn" accessibilityRole="button" accessibilityLabel="End turn — discard your dice and roll two fresh ones" style={styles.newTurn}>
                    <Text style={styles.newTurnText}>↻ END TURN</Text>
                </Pressable>
            </View>
            <View style={styles.trayDice}>
                {vm.dice.map((die) => {
                    const draggable = !vm.hasDraft && !die.isX && !die.drafted && !die.spent;
                    const isAssigned = assignedDieIds.has(die.id);
                    const node = (
                        <View style={isAssigned ? styles.dieAssigned : undefined}>
                            <CombatDie die={die} size={56} dimmed={(vm.hasDraft && !die.drafted) || draggingDieId === die.id} />
                            {draggable && die.readPip && die.readPip !== 'none' ? (
                                <Text style={[styles.diePip, { color: READ_ACCENT[die.readPip] }]}>
                                    {die.readPip === 'advantage' ? '▲ ADV' : die.readPip === 'disadvantage' ? '▼ DIS' : '— EVEN'}
                                </Text>
                            ) : null}
                            {vm.hasDraft && !die.drafted && <Text style={styles.dieConv}>→ +1 ◆</Text>}
                            {die.drafted && <Text style={[styles.dieConv, { color: AXM.sulfur }]}>{die.spent ? 'SPENT' : 'STANCE'}</Text>}
                        </View>
                    );
                    return draggable ? (
                        <GestureDetector key={die.id} gesture={dieGesture(die)}>
                            <Animated.View accessible accessibilityRole="button" accessibilityLabel={`${die.color} die. Drag it onto your staged card to power it.`}>
                                {node}
                            </Animated.View>
                        </GestureDetector>
                    ) : (
                        <View key={die.id}>{node}</View>
                    );
                })}
                {vm.dice.length === 0 && <Text style={styles.trayEmpty}>press END TURN to roll</Text>}
            </View>
        </View>
    );
}

// ── Staged card (die slot · PREVIEW · APPLY) ─────────────────────────────────

function StagedCard({
    card, assignedDie, read, onApply, gesture, register, compact = false,
}: {
    card: CombatCardVM;
    assignedDie: CombatDieVM | null;
    read: string;
    onApply: () => void;
    gesture: ReturnType<typeof Gesture.Exclusive>;
    register: (node: View | null) => void;
    compact?: boolean;
}) {
    const AXM = usePalette();
    const styles = useStyles();
    const armed = assignedDie !== null;
    const readColor = armed ? (READ_ACCENT[read] ?? AXM.bone) : AXM.bone;
    const cardW = compact ? 70 : 88;
    return (
        <View style={styles.stagedCol}>
            <GestureDetector gesture={gesture}>
                <Animated.View
                    ref={(node) => register(node as unknown as View | null)}
                    entering={FadeInDown.duration(180)}
                    style={[
                        styles.stagedCard,
                        { borderColor: armed ? readColor : card.stanceColor, width: cardW },
                        compact && { paddingRight: 22, minHeight: 78 },
                    ]}
                    testID={`combat-staged-${card.uid}`}
                    accessible
                    accessibilityRole="button"
                    accessibilityLabel={`${card.name} staged. Tap to unstage.`}
                >
                    <View style={[styles.cardStanceBar, { backgroundColor: card.stanceColor }]} />
                    {assignedDie && (
                        <View style={styles.cardDie} testID="combat-staged-die">
                            <CombatDie die={assignedDie} size={compact ? 22 : 28} />
                        </View>
                    )}
                    <Text style={[styles.cardName, compact && { fontSize: 10, lineHeight: 11 }]} numberOfLines={2}>{card.name}</Text>
                    <Text style={[styles.cardTier, compact && { fontSize: 8 }]}>{card.stance[0].toUpperCase()} · T{card.tier}</Text>
                    {armed && (
                        <Text style={[styles.cardRead, { color: readColor }, compact && { fontSize: 8 }]}>
                            {read === 'advantage' ? '▲ ADV' : read === 'disadvantage' ? '▼ DIS' : '— EVN'}
                        </Text>
                    )}
                </Animated.View>
            </GestureDetector>
            <Pressable
                onPress={() => { Haptics.impactAsync(armed ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined); onApply(); }}
                testID={`combat-apply-${card.uid}`}
                accessibilityRole="button"
                accessibilityLabel={armed ? `Apply powered: ${card.bottomActionText}` : `Apply free: ${card.topActionText}`}
                style={[
                    styles.applyBtn,
                    { borderColor: armed ? readColor : AXM.bone, backgroundColor: armed ? 'rgba(91,191,106,0.14)' : 'rgba(0,0,0,0.4)', width: cardW },
                    compact && { paddingVertical: 3 },
                ]}
            >
                <Text style={[styles.applyText, { color: armed ? readColor : AXM.parchment }, compact && { fontSize: 10 }]}>APPLY</Text>
            </Pressable>
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
            <Pressable onPress={onPress} testID="combat-end-phase" accessibilityRole="button" accessibilityLabel="End phase — the enemy acts, then the next phase begins" style={[styles.playBtn, { borderColor: AXM.sulfur, backgroundColor: 'rgba(212,192,38,0.16)' }]}>
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
    stagedUids: string[];
    /** Commit the staged card. `power` true → power it with `dieId` (null when a die
     *  is already drafted, the combo case); `power` false → the FREE base action,
     *  no die (hazard model — the die is optional). */
    onApply: (uid: string, dieId: string | null, power: boolean) => void;
    onStage: (uid: string) => void;
    onUnstage: (uid: string) => void;
    onDiscard: (uid: string) => void;
    onSignature: (id: string) => void;
    onNewTurn: () => void;
    onEndPhase: () => void;
    onInspect: (card: CombatCardVM) => void;
    onChip?: (e: CombatEffectChipVM) => void;
}

export const CombatBoard = React.memo(function CombatBoard({
    vm, drag, stagedUids, onApply, onStage, onUnstage, onDiscard, onSignature, onNewTurn, onEndPhase, onInspect, onChip,
}: CombatBoardProps) {
    const AXM = usePalette();
    const styles = useStyles();
    const playAreaRef = useRef<View | null>(null);
    const trashRef = useRef<View | null>(null);
    // Per-staged-card measurable frames — used to drop a die onto a SPECIFIC card.
    const stagedRefs = useRef<Map<string, View>>(new Map());

    // Per-card die selection: the die the player has dragged onto each staged card
    // but not yet APPLYd. Local UI state — selecting/re-selecting is free; APPLY is
    // the commit. (Combat drafts ONE stance die per turn, so once a die is drafted
    // it — or its combo refresh — powers whichever card APPLYs next; before that,
    // each staged card shows the die dragged onto it.)
    const [pendingDieByUid, setPendingDieByUid] = useState<Record<string, string>>({});
    const stagedKey = stagedUids.join(',');
    // Clear pending selections when the turn's dice change…
    useEffect(() => { setPendingDieByUid({}); }, [vm.turnLabel]);
    // …and drop entries for cards that are no longer staged.
    useEffect(() => {
        setPendingDieByUid((prev) => {
            const next: Record<string, string> = {};
            for (const uid of stagedUids) if (prev[uid]) next[uid] = prev[uid];
            return next;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stagedKey]);

    const draftedDie = vm.dice.find((d) => d.drafted && !d.spent) ?? null;
    // The die that will power a staged card: a combo-refreshed drafted die powers
    // the next card straight away; otherwise the die dragged onto THAT card (if it's
    // still usable). null → the card APPLYs FREE (no die).
    const assignedDieFor = (uid: string): CombatDieVM | null => {
        if (draftedDie) return draftedDie;
        const pid = pendingDieByUid[uid];
        if (!pid) return null;
        const d = vm.dice.find((x) => x.id === pid) ?? null;
        return d && !d.spent && !d.isX && !d.drafted ? d : null;
    };
    const readFor = (die: CombatDieVM | null): string =>
        (die ? (die.drafted ? vm.read.result : die.readPip) : 'none') ?? 'none';
    // Dim every die that's already drafted or pending-assigned to some card.
    const assignedDieIds = new Set<string>(
        [draftedDie?.id, ...Object.values(pendingDieByUid)].filter(Boolean) as string[],
    );

    const resolveDrop = useCallback(async (payload: DragPayload, x: number, y: number) => {
        if (x < 0 && y < 0) return;
        if (payload.type === 'die') {
            // Per-card targeting: drop a die onto a SPECIFIC staged card to power it.
            let target: string | null = null;
            for (const uid of stagedUids) {
                const node = stagedRefs.current.get(uid);
                if (!node) continue;
                const rect = await measureRect({ current: node });
                if (rectContains(rect, x, y, 16)) { target = uid; break; }
            }
            // Forgiveness: a die dropped loosely in the play area lands on the one
            // eligible card (the single staged card, else the first still without a die).
            if (!target) {
                const playRect = await measureRect(playAreaRef);
                if (rectContains(playRect, x, y, 24) && stagedUids.length > 0) {
                    target = stagedUids.length === 1
                        ? stagedUids[0]
                        : (stagedUids.find((u) => !pendingDieByUid[u]) ?? stagedUids[0]);
                }
            }
            if (target) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid).catch(() => undefined);
                const t = target;
                setPendingDieByUid((prev) => ({ ...prev, [t]: payload.dieId }));
            }
            return;
        }
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onDiscard, onStage, onUnstage, onInspect, stagedKey, pendingDieByUid]);

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

    const dieGesture = (die: CombatDieVM) => {
        const pan = Gesture.Pan().minDistance(8)
            .onStart((e) => { runOnJS(drag.begin)({ type: 'die', dieId: die.id, die }, e.absoluteX, e.absoluteY); })
            .onUpdate((e) => { runOnJS(drag.move)(e.absoluteX, e.absoluteY); })
            .onEnd((e) => { runOnJS(drag.end)(e.absoluteX, e.absoluteY); })
            .onFinalize((e, ok) => { if (!ok) runOnJS(drag.end)(-1, -1); });
        return Gesture.Exclusive(pan);
    };

    const stagedSet = new Set(stagedUids);
    // Staged cards, in stage order (filtered to those still in hand).
    const stagedCards = stagedUids
        .map((uid) => vm.hand.find((c) => c.uid === uid))
        .filter((c): c is CombatCardVM => Boolean(c));
    const fan = vm.hand.filter((c) => !stagedSet.has(c.uid));
    const n = fan.length;
    const mid = (n - 1) / 2;
    const overlap = n > 6 ? 48 : n > 4 ? 34 : 18;
    const draggingDieId = drag.active?.type === 'die' ? drag.active.dieId : null;
    const draggingCardUid = drag.active?.type === 'card' ? drag.active.uid : null;

    // Commit ONE staged card: powered with its assigned die (drafting it first
    // unless one is already drafted — the combo case), else the FREE base action.
    const handleApply = (uid: string) => {
        const adie = assignedDieFor(uid);
        if (adie) onApply(uid, adie.drafted ? null : adie.id, true);
        else onApply(uid, null, false);
        setPendingDieByUid((prev) => { const next = { ...prev }; delete next[uid]; return next; });
    };

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

            {/* play area — fixed-height zone, flex:1 wrapper absorbs leftover space */}
            <View style={{ flex: 1 }}>
                <View ref={playAreaRef} style={[styles.playArea, { borderColor: stagedCards.length ? `${AXM.sulfur}88` : AXM.ash }]} testID="combat-play-area">
                    <View style={styles.playHead}>
                        <Text style={[styles.playLabel, { color: stagedCards.length ? AXM.sulfur : AXM.bone }]}>PLAY AREA{stagedCards.length > 1 ? ` · ${stagedCards.length} STAGED` : ''}</Text>
                        <Text style={styles.deckCounts}>DECK {vm.deckCount} · DISCARD {vm.discardCount}</Text>
                    </View>
                    {stagedCards.length > 0 ? (
                        <View style={[styles.playCards, stagedCards.length > 3 && { gap: 6 }]}>
                            {stagedCards.map((card) => {
                                const adie = assignedDieFor(card.uid);
                                return (
                                    <StagedCard
                                        key={card.uid}
                                        card={card}
                                        assignedDie={adie}
                                        read={readFor(adie)}
                                        onApply={() => handleApply(card.uid)}
                                        gesture={stagedGesture(card)}
                                        register={(node) => { if (node) stagedRefs.current.set(card.uid, node); else stagedRefs.current.delete(card.uid); }}
                                        compact={stagedCards.length > 3}
                                    />
                                );
                            })}
                        </View>
                    ) : (
                        <View style={styles.playEmpty}>
                            <Text style={styles.playEmptyText}>drag cards up to stage them</Text>
                        </View>
                    )}
                </View>
            </View>

            <SignatureBar conviction={vm.conviction} signatures={vm.signatures} onCast={onSignature} />

            <DiceTray vm={vm} dieGesture={dieGesture} onNewTurn={onNewTurn} draggingDieId={draggingDieId} assignedDieIds={assignedDieIds} />

            {/* dock */}
            <View style={styles.dock}>
                <View ref={trashRef} style={[styles.trashBin, draggingCardUid ? { borderColor: AXM.blood, backgroundColor: AXM.bloodSubtle, borderStyle: 'solid' } : null]} testID="combat-trash" accessible accessibilityLabel="Scrap bin. Drag a card here to discard it.">
                    <TrashGlyph size={20} color={draggingCardUid ? AXM.blood : AXM.bone} />
                    <Text style={[styles.trashLabel, draggingCardUid ? { color: AXM.blood } : null]}>SCRAP</Text>
                </View>
                <View style={styles.fan} testID="combat-hand">
                    {fan.map((card, i) => (
                        <GestureDetector key={card.uid} gesture={handCardGesture(card)}>
                            <Animated.View
                                entering={FadeIn.duration(180)} layout={LinearTransition.duration(160)}
                                style={{
                                    marginLeft: i === 0 ? 0 : -overlap,
                                    zIndex: draggingCardUid === card.uid ? 30 : i,
                                    opacity: draggingCardUid === card.uid ? 0.3 : 1,
                                    transform: [{ translateY: Math.abs(i - mid) * 8 }, { rotate: `${(i - mid) * 5}deg` }],
                                }}
                                testID={`combat-hand-${card.uid}`}
                                accessible accessibilityRole="button"
                                accessibilityLabel={`${card.name}, ${card.stance} ${card.effectKind} card. ${card.bottomActionText}`}
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
    const EFFECT_GLYPH: Record<string, string> = { dot: '🔥', control: '⛓', none: '◆' };
    const gold = card.rarity === 'gold';
    return (
        <View style={[styles.handCard, { borderColor: gold ? '#d9b44a' : card.stanceColor }]}>
            <View style={[styles.cardStanceBar, { backgroundColor: card.stanceColor }]} />
            <Text style={styles.handName} numberOfLines={2}>{gold ? '★ ' : ''}{card.name}</Text>
            <Text style={[styles.handTrack, { color: card.stanceColor }]}>{EFFECT_GLYPH[card.effectKind]} {card.stance[0].toUpperCase()}</Text>
            {card.effectKind !== 'none' && <Text style={styles.handPrev}>+{card.bottomDamagePreview}</Text>}
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    root: { flex: 1, backgroundColor: '#0c0a08' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: 8, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: AXM.ash },
    headerTitle: { fontFamily: FONTS.gothic, fontSize: 17, color: AXM.parchment, letterSpacing: 0.5 },
    phaseBadge: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 1.2, color: AXM.bg, paddingHorizontal: 5, paddingVertical: 1, overflow: 'hidden' },
    roundLabel: { fontFamily: FONTS.mono, fontSize: 11, color: AXM.bone, letterSpacing: 0.8 },

    sigPanel: { paddingHorizontal: 12, paddingVertical: 4, backgroundColor: 'rgba(212,192,38,0.07)', borderBottomWidth: 1, borderBottomColor: AXM.ash },
    sigHead: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 1.2, color: AXM.sulfur, marginBottom: 4 },
    sigRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
    sigChip: { flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderRadius: 3, paddingHorizontal: 5, paddingVertical: 3, backgroundColor: 'rgba(0,0,0,0.4)' },
    sigIcon: { fontSize: 12 },
    sigName: { fontFamily: FONTS.sans, fontSize: 10, letterSpacing: 0.4, maxWidth: 96 },
    sigCost: { fontFamily: FONTS.mono, fontSize: 10 },

    // Compact die tray — leaves the vertical budget to the play area.
    tray: { paddingHorizontal: 12, paddingTop: 6, paddingBottom: 6, backgroundColor: 'rgba(0,0,0,0.35)', borderBottomWidth: 1, borderBottomColor: AXM.ash },
    trayHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
    trayLabel: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 1, color: AXM.bone },
    newTurn: { borderWidth: 1, borderColor: AXM.bone, paddingHorizontal: 7, paddingVertical: 2 },
    newTurnText: { fontFamily: FONTS.mono, fontSize: 10, color: AXM.parchment, letterSpacing: 0.8 },
    trayDice: { flexDirection: 'row', gap: 22, justifyContent: 'center', alignItems: 'flex-start', minHeight: 68 },
    dieAssigned: { opacity: 0.4 },
    dieConv: { fontFamily: FONTS.mono, fontSize: 9, color: AXM.bone, textAlign: 'center', marginTop: 2, letterSpacing: 0.5 },
    diePip: { fontFamily: FONTS.sans, fontSize: 10, textAlign: 'center', marginTop: 2, letterSpacing: 0.6 },
    trayEmpty: { fontFamily: FONTS.serifItalic, fontStyle: 'italic', fontSize: 13, color: AXM.ash, alignSelf: 'center' },

    // Play area — fixed height for two card rows (flex wrapper above absorbs leftover space).
    playArea: { height: 290, marginHorizontal: 10, marginTop: 8, borderWidth: 1.5, borderStyle: 'dashed', backgroundColor: 'rgba(212,192,38,0.04)', paddingHorizontal: 8, paddingTop: 6, paddingBottom: 6 },
    playHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
    playLabel: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 1.2 },
    deckCounts: { fontFamily: FONTS.mono, fontSize: 10, color: AXM.bone, letterSpacing: 1 },
    playEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    playEmptyText: { fontFamily: FONTS.serifItalic, fontStyle: 'italic', fontSize: 13, color: AXM.ash, textAlign: 'center' },

    // Compact row-wrap play area — small fixed-width cards laid out in rows.
    playCards: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', alignContent: 'flex-start', paddingTop: 2 },
    stagedCol: { alignItems: 'center', gap: 3 },
    stagedCard: { width: 88, minHeight: 95, borderWidth: 2, borderRadius: 4, backgroundColor: '#1a160f', paddingLeft: 6, paddingRight: 30, paddingTop: 7, paddingBottom: 6, overflow: 'hidden' },
    cardDie: { position: 'absolute', top: 5, right: 4, zIndex: 2 },
    cardStanceBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
    cardName: { fontFamily: FONTS.gothic, fontSize: 12, color: AXM.parchment, marginLeft: 3, lineHeight: 13 },
    cardTier: { fontFamily: FONTS.mono, fontSize: 9, color: AXM.bone, letterSpacing: 0.4, marginLeft: 3, marginTop: 3 },
    cardRead: { fontFamily: FONTS.sans, fontSize: 9, letterSpacing: 0.8, marginLeft: 3, marginTop: 2 },
    actHint: { fontFamily: FONTS.mono, fontSize: 11, color: '#c2a14e', textAlign: 'center', letterSpacing: 0.3, paddingHorizontal: 12 },

    applyBtn: { width: 88, borderWidth: 1.5, borderRadius: 3, paddingVertical: 4, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
    applyText: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 1.4 },

    dock: { height: 148, borderTopWidth: 1, borderTopColor: AXM.ash },
    trashBin: { position: 'absolute', left: 8, bottom: 10, zIndex: 40, width: 58, height: 58, borderRadius: 29, borderWidth: 1.5, borderStyle: 'dashed', borderColor: AXM.ash, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
    trashLabel: { fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1, color: AXM.bone, marginTop: 1 },
    fan: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 10 },
    handCard: { width: 86, height: 112, borderWidth: 1.5, borderRadius: 4, backgroundColor: '#16130c', paddingHorizontal: 7, paddingVertical: 7, overflow: 'hidden', justifyContent: 'flex-start' },
    handName: { fontFamily: FONTS.gothic, fontSize: 13, color: AXM.parchment, marginLeft: 4, lineHeight: 15 },
    handTrack: { fontFamily: FONTS.sans, fontSize: 12, letterSpacing: 0.5, marginLeft: 4, marginTop: 5 },
    handPrev: { fontFamily: FONTS.mono, fontSize: 12, color: AXM.parchment, marginLeft: 4, marginTop: 'auto' },

    playWrap: { position: 'absolute', right: 10, bottom: 12, zIndex: 40, shadowColor: AXM.sulfur, shadowRadius: 14, shadowOffset: { width: 0, height: 0 }, elevation: 8 },
    playBtn: { width: 72, height: 72, borderRadius: 36, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
    playText: { fontFamily: FONTS.gothic, fontSize: 16, letterSpacing: 1, lineHeight: 17 },
    playSub: { fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1, marginTop: 1 },
}));
