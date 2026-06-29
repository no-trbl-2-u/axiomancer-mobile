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

import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { StyleProp, TextStyle } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
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
    CombatSignatureVM, CombatEffectChipVM, CombatCardFaceVM,
} from '@/state/presenters/combat-encounter.engine';
import { armedReadValue } from '@/state/presenters/combat-encounter.engine';
import type { CombatReadResult } from 'axiomancer-mechanics';
import { TrashGlyph, LedgerMark } from '@/components/hazard/glyphs';
import { CombatCombatantPane, type CombatFx } from './CombatCombatantPane';
import { CombatDie } from './CombatDie';

// The single bundled card art (one photo across every card for now — see TODO at
// CombatCardFace). Per-card differentiation is preserved via the stance tint +
// the keyword/category glyph until per-card art exists.
const CARD_ART = require('@/assets/images/cards/circe-placeholder.jpg');
// Die glyph per stance (mirrors the engine's DIE_GLYPHS, kept local to the board).
const DIE_GLYPHS: Record<string, string> = { heart: '♥', body: '⚡', mind: '★', wild: '✦', x: '✕' };

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

// Render a sentence with each keyword name BOLDED (Sanguine-Step style). Shared by
// the large inspect card FACE (here) and the inspect modal (CombatEncounterPanel).
export function OutcomeText({ text, names, base, bold }: { text: string; names: string[]; base: StyleProp<TextStyle>; bold: StyleProp<TextStyle> }) {
    const escaped = names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).filter(Boolean);
    if (escaped.length === 0) return <Text style={base}>{text}</Text>;
    const upper = new Set(names.map((n) => n.toUpperCase()));
    const parts = text.split(new RegExp(`(${escaped.join('|')})`, 'gi'));
    return (
        <Text style={base}>
            {parts.map((p, i) => (upper.has(p.toUpperCase()) ? <Text key={i} style={bold}>{p}</Text> : <Text key={i}>{p}</Text>))}
        </Text>
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
                <Pressable onPress={onNewTurn} testID="combat-new-turn" accessibilityRole="button" accessibilityLabel="New turn — discard your dice and roll two fresh ones (the enemy does NOT act)" style={styles.newTurn}>
                    <Text style={styles.newTurnText}>↻ NEW TURN</Text>
                </Pressable>
            </View>
            <View style={styles.trayDice}>
                {vm.dice.map((die) => {
                    const draggable = !vm.hasDraft && !die.isX && !die.drafted && !die.spent;
                    const isAssigned = assignedDieIds.has(die.id);
                    // The drawn X/dud die is non-draggable — render it as a small greyed
                    // pip so it doesn't pad the tray with an unusable full-size slot.
                    if (die.isX) {
                        return (
                            <View key={die.id} style={styles.dieXPip} accessible accessibilityLabel="X die — unusable this turn">
                                <Text style={styles.dieXGlyph}>✕</Text>
                            </View>
                        );
                    }
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
                            <Animated.View>
                                {node}
                            </Animated.View>
                        </GestureDetector>
                    ) : (
                        <View key={die.id}>{node}</View>
                    );
                })}
                {vm.dice.length === 0 && <Text style={styles.trayEmpty}>press NEW TURN to roll</Text>}
            </View>
        </View>
    );
}

// ── Staged card (die slot · PREVIEW · APPLY) ─────────────────────────────────

function StagedCard({
    card, assignedDie, read, onApply, gesture, register, compact = false, popKey = 0,
}: {
    card: CombatCardVM;
    assignedDie: CombatDieVM | null;
    read: string;
    onApply: () => void;
    gesture: ReturnType<typeof Gesture.Exclusive>;
    register: (node: View | null) => void;
    compact?: boolean;
    /** Rising nonce: when it changes (>0) this card just received a dropped die →
     *  a brief 1.05 scale-pop confirms the drop landed HERE (and only here). */
    popKey?: number;
}) {
    const AXM = usePalette();
    const styles = useStyles();
    const f = card.face;
    // Drop-confirmation pop (120ms up / 120ms back) on the card the die landed on.
    const pop = useSharedValue(1);
    useEffect(() => {
        if (popKey > 0) pop.value = withSequence(withTiming(1.05, { duration: 120 }), withTiming(1, { duration: 120 }));
    }, [popKey, pop]);
    const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
    const armed = assignedDie !== null;
    const readColor = armed ? (READ_ACCENT[read] ?? AXM.bone) : AXM.bone;
    const cardW = compact ? 78 : 96;
    const cardH = compact ? 104 : 128;
    // The PAID line shows the POWER value; for read-dependent kinds (guard) it is
    // recomputed live at the known read so the staged number is exact at commit.
    let heroOverride: string | undefined;
    if (armed && f.readDependent) {
        const colorMatch = assignedDie!.color === card.stance || assignedDie!.color === 'wild';
        const g = armedReadValue(f, read as CombatReadResult, colorMatch);
        if (g != null) heroOverride = `Guard ${g}`;
    }
    const readPip = armed && f.readDependent
        ? (read === 'advantage' ? '▲' : read === 'disadvantage' ? '▼' : '—')
        : null;
    return (
        <View style={styles.stagedCol}>
            <GestureDetector gesture={gesture}>
                <Animated.View
                    ref={(node) => register(node as unknown as View | null)}
                    entering={FadeInDown.duration(180)}
                    testID={`combat-staged-${card.uid}`}
                    accessible
                    accessibilityRole="button"
                    accessibilityLabel={`${card.name} staged — ${f.verbLine}. Tap to unstage.`}
                >
                  {/* inner wrapper carries the drop-pop scale so it never fights the
                      outer entering animation's transform. */}
                  <Animated.View style={popStyle}>
                    <CombatCardFace
                        card={card}
                        width={cardW}
                        height={cardH}
                        accent={armed ? readColor : null}
                        readPip={readPip}
                        heroOverride={heroOverride}
                        showCostPip={false}
                    >
                        {assignedDie && (
                            <View style={styles.cardDie} testID="combat-staged-die">
                                <CombatDie die={assignedDie} size={compact ? 22 : 28} />
                            </View>
                        )}
                    </CombatCardFace>
                  </Animated.View>
                </Animated.View>
            </GestureDetector>
            <Pressable
                onPress={() => { Haptics.impactAsync(armed ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined); onApply(); }}
                testID={`combat-apply-${card.uid}`}
                accessibilityRole="button"
                accessibilityLabel={armed ? `Apply powered: ${card.bottomActionText}` : `Apply free: ${card.topActionText}`}
                hitSlop={8}
                style={[
                    styles.applyBtn,
                    { borderColor: armed ? readColor : AXM.bone, backgroundColor: armed ? 'rgba(91,191,106,0.14)' : 'rgba(0,0,0,0.4)', width: cardW },
                    compact && { paddingVertical: 3 },
                ]}
            >
                <Text style={[styles.applyText, { color: armed ? readColor : AXM.parchment }, compact && { fontSize: 10 }]} numberOfLines={1} adjustsFontSizeToFit>{armed ? 'APPLY · POWER' : 'APPLY · FREE'}</Text>
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
    /** Latest resolved engine events (drives enemy/player resolution feedback). */
    fx?: CombatFx;
}

export const CombatBoard = React.memo(function CombatBoard({
    vm, drag, stagedUids, onApply, onStage, onUnstage, onDiscard, onSignature, onNewTurn, onEndPhase, onInspect, onChip, fx,
}: CombatBoardProps) {
    const AXM = usePalette();
    const styles = useStyles();
    // Null-safe insets (the context is null with no SafeAreaProvider, e.g. in tests).
    const bottomInset = useContext(SafeAreaInsetsContext)?.bottom ?? 0;
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
    // Rising drop-confirmation nonce for the card a die just landed on (scale-pop).
    const [dropPop, setDropPop] = useState<{ uid: string; n: number }>({ uid: '', n: 0 });
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
    // The ONE staged card the shared drafted (combo) die visibly arms: the next card
    // that will consume it — the first staged card without its own dropped die, else
    // the first staged card. The die's COMMIT stays shared (handleApply powers
    // whichever card APPLYs); only its DISPLAY is bound here so the combo die doesn't
    // light up every staged card at once.
    const comboTargetUid = draftedDie
        ? (stagedUids.find((u) => !pendingDieByUid[u]) ?? stagedUids[0] ?? null)
        : null;
    // DISPLAY (decoupled from commit): resolve the per-card dropped die FIRST (only
    // when still usable), then show the drafted/combo die on the single comboTargetUid,
    // else null → the card reads as FREE (no die).
    const assignedDieFor = (uid: string): CombatDieVM | null => {
        const pid = pendingDieByUid[uid];
        if (pid) {
            const d = vm.dice.find((x) => x.id === pid);
            if (d && !d.spent && !d.isX && !d.drafted) return d;
        }
        if (draftedDie && uid === comboTargetUid) return draftedDie;
        return null;
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
                setDropPop((prev) => ({ uid: t, n: prev.n + 1 }));   // confirm the drop landed HERE
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
            }
            // Drag that misses the play area is a no-op — the pan gesture already
            // fired, so the Exclusive tap handler is suppressed. Inspect is tap-only.
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
    // Relaxed overlap for small hands (5-6 cards) so faces breathe; tight at 7+ (width
    // is the binding constraint on a ~390pt phone — cap/scroll there rather than widen).
    const overlap = n > 6 ? 26 : n > 4 ? 14 : 12;
    const draggingDieId = drag.active?.type === 'die' ? drag.active.dieId : null;
    const draggingCardUid = drag.active?.type === 'card' ? drag.active.uid : null;

    // Commit ONE staged card. The drafted die stays SHARED: if a drafted die exists,
    // APPLY this card powered regardless of comboTargetUid (binding consumption to one
    // uid would be a combo regression); else if this card has a usable dropped die,
    // draft+power it; else FREE (no die).
    const handleApply = (uid: string) => {
        if (draftedDie) {
            onApply(uid, null, true);
        } else {
            const pid = pendingDieByUid[uid];
            const pending = pid ? vm.dice.find((x) => x.id === pid) ?? null : null;
            if (pending && !pending.spent && !pending.isX && !pending.drafted) onApply(uid, pending.id, true);
            else onApply(uid, null, false);
        }
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
                <View style={{ alignItems: 'flex-end', gap: 3 }}>
                    <View style={{ flexDirection: 'row', gap: 4 }} testID="combat-ledger">
                        {vm.ledger.map((m, i) => <LedgerMark key={i} kind={m === 'clear' ? 'O' : m === 'overwhelmed' ? 'X' : 'pending'} size={20} />)}
                    </View>
                    {/* DECK/DISCARD moved out of the collapsed play strip into the header. */}
                    <Text style={styles.deckCounts}>DECK {vm.deckCount} · DISCARD {vm.discardCount}</Text>
                </View>
            </View>

            <CombatCombatantPane enemy={vm.enemy} player={vm.player} conviction={vm.conviction} onChip={onChip} fx={fx} />

            {/* play area — collapses to a slim hint strip while empty, grows to flex:1
                once a card is staged. While empty the wrapper RELEASES its flex (0) so
                the reclaimed height routes to the dock (the fan grows + lifts) instead of
                sitting as a dead band above the Signature bar. LinearTransition animates
                the one reflow bidirectionally so staged cards never pop. */}
            <View style={{ flex: 1 }}>
                <Animated.View
                    ref={(node) => { playAreaRef.current = node as unknown as View | null; }}
                    layout={LinearTransition.duration(220)}
                    style={[styles.playArea, styles.playAreaActive, { borderColor: stagedCards.length ? `${AXM.sulfur}88` : AXM.ash }]}
                    testID="combat-play-area"
                >
                    <View style={styles.playHead}>
                        <Text style={[styles.playLabel, { color: stagedCards.length ? AXM.sulfur : AXM.bone }]}>PLAY AREA{stagedCards.length > 1 ? ` · ${stagedCards.length} STAGED` : ''}</Text>
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
                                        popKey={dropPop.uid === card.uid ? dropPop.n : 0}
                                    />
                                );
                            })}
                        </View>
                    ) : (
                        <Text style={styles.playEmptyStrip} numberOfLines={1}>drag a card up to stage · tap a card to read it</Text>
                    )}
                </Animated.View>
            </View>

            <SignatureBar conviction={vm.conviction} signatures={vm.signatures} onCast={onSignature} />

            <DiceTray vm={vm} dieGesture={dieGesture} onNewTurn={onNewTurn} draggingDieId={draggingDieId} assignedDieIds={assignedDieIds} />

            {/* dock — claims the reclaimed flex while nothing is staged so the fan grows
                + lifts into the void (instead of clipping off the bottom edge). */}
            <View style={styles.dock}>
                {/* SCRAP — only present while a card is being dragged (no permanent
                    footprint). Kept mounted/hidden rather than unmounted so the drop
                    measurement still resolves against its ref after the drag ends. */}
                <View
                    ref={trashRef}
                    pointerEvents={draggingCardUid ? 'auto' : 'none'}
                    style={[styles.trashBin, draggingCardUid ? { borderColor: AXM.blood, backgroundColor: AXM.bloodSubtle, borderStyle: 'solid', opacity: 1 } : { opacity: 0 }]}
                    testID="combat-trash"
                    accessible
                    accessibilityLabel="Scrap bin. Drag a card here to discard it."
                >
                    <TrashGlyph size={20} color={draggingCardUid ? AXM.blood : AXM.bone} />
                    <Text style={[styles.trashLabel, draggingCardUid ? { color: AXM.blood } : null]}>SCRAP</Text>
                </View>
                <View style={[styles.fan, { paddingBottom: Math.max(bottomInset, 24) + 14 }]} testID="combat-hand">
                    {fan.map((card, i) => (
                        <GestureDetector key={card.uid} gesture={handCardGesture(card)}>
                            <Animated.View
                                entering={FadeIn.duration(180)} layout={LinearTransition.duration(160)}
                                style={{
                                    marginLeft: i === 0 ? 0 : -overlap,
                                    zIndex: draggingCardUid === card.uid ? 30 : i,
                                    opacity: draggingCardUid === card.uid ? 0.3 : 1,
                                    transform: [{ translateY: Math.abs(i - mid) * 3 }, { rotate: `${(i - mid) * 3}deg` }],
                                }}
                                testID={`combat-hand-${card.uid}`}
                                accessible accessibilityRole="button"
                                accessibilityLabel={`${card.name}, ${card.stance} card. ${card.face.verbLine}.`}
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

// Fallback word for a face that has no honest number (heroText === '').
function heroFace(f: CombatCardFaceVM): string {
    if (f.heroText) return f.heroText;
    switch (f.kind) {
        case 'strike': return 'HIT';
        case 'befriend': return 'SPARE';
        case 'weaken': return 'softens';
        default: return 'minor';   // inert
    }
}

// The PAID line reads "KEYWORD value"; strip a leading keyword word from the
// hero string so it doesn't double (keyword GUARD + "Guard 12" → "12").
function paidValueText(f: CombatCardFaceVM, hero?: string): string {
    const base = hero ?? (f.heroText || heroFace(f));
    if (f.keyword) {
        const stripped = base.replace(new RegExp('^' + f.keyword + '\\s*', 'i'), '');
        return stripped || base;
    }
    return base;
}

/**
 * The shared card FACE — Mage-Knight "advanced action" shape — instanced small
 * in the hand and LARGE in the inspect modal so the two can never drift.
 *   · real ART (Circe placeholder) fills the top ~48% behind a legibility scrim
 *     plus a stance-tint overlay;
 *   · category glyph top-LEFT, a stance "cost" pip (die glyph) top-RIGHT;
 *   · the FREE (no-die) value demoted to a tiny corner subscript;
 *   · the card NAME on a stance-coloured band;
 *   · the dominant hero "KEYWORD value" line at the bottom.
 *
 * TODO(art): one bundled photo (circe-placeholder.jpg) backs every card today —
 * per-card differentiation is carried by the stance tint + the glyph until
 * per-card art ships; swap CARD_ART for a per-card source then.
 * TODO(frame): the ornate Dawncaster-style frame is approximated with RN borders/
 * bands; drop frame PNGs into the corners/banner slots when they exist.
 */
export function CombatCardFace({
    card, width, height, large = false, accent = null, readPip = null, heroOverride, showCostPip = true, children,
}: {
    card: CombatCardVM;
    width: number;
    height: number;
    large?: boolean;
    /** Override the keyword/value/border colour (the armed staged-card read tint). */
    accent?: string | null;
    /** ▲ / ▼ / — read pip beside the keyword (read-dependent staged cards). */
    readPip?: string | null;
    /** Override the hero value text (e.g. the live-recomputed Guard number). */
    heroOverride?: string;
    /** Hide the stance cost pip (the staged card shows the actual assigned die instead). */
    showCostPip?: boolean;
    children?: React.ReactNode;
}) {
    const AXM = usePalette();
    const styles = useStyles();
    const f = card.face;
    const gold = card.rarity === 'gold';
    // STANCE rides the name band + the art vignette; CATEGORY rides the frame (border)
    // + the glyph watermark — two orthogonal identity axes until per-card art ships.
    const band = gold ? '#d9b44a' : f.stanceColor;
    const baseKw = f.inert ? AXM.ash : f.categoryColor;
    const kwColor = accent ?? baseKw;
    const borderColor = accent ?? (gold ? '#d9b44a' : f.categoryColor);
    const dieGlyph = DIE_GLYPHS[card.stance] ?? '✦';
    const numberless = !f.heroText && !heroOverride;
    const value = numberless ? (f.keyword ?? heroFace(f)) : paidValueText(f, heroOverride);
    return (
        <View style={[styles.faceCard, { width, height, borderColor }]}>
            {/* ART window — top ~58% behind a scrim + stance tint + stance vignette */}
            <View style={styles.faceArt} pointerEvents="none">
                <Image source={CARD_ART} style={StyleSheet.absoluteFill} contentFit="cover" transition={0} />
                <View style={[styles.faceArtTint, { backgroundColor: f.stanceColor }]} />
                {/* TODO(gradient): a flat scrim + stance vignette approximates the
                    rgba(10,8,6,0)→0.85 fade (no expo-linear-gradient in the deps yet). */}
                <View style={styles.faceArtScrim} />
                <View style={[styles.faceArtVignette, { backgroundColor: f.stanceColor }]} />
                {large
                    ? <Text style={[styles.glyphWatermark, f.inert && { opacity: 0.4 }]}>{f.glyph}</Text>
                    : <Text style={[styles.glyphWatermarkSmall, f.inert && { opacity: 0.4 }]}>{f.glyph}</Text>}
                {showCostPip && (
                    // Square stance TAB (not a round cost-orb): these cards have no cost; the
                    // die is optional, so the round MTG/Hearthstone orb mis-read as a resource.
                    <View style={[styles.costPip, large && styles.costPipLarge, { backgroundColor: f.stanceColor }]}>
                        <Text style={[styles.costPipGlyph, large && styles.costPipGlyphLarge]}>{dieGlyph}</Text>
                    </View>
                )}
                {/* FREE value lives in the detail FREE/POWER fork — a floating pip here read as a cost. */}
            </View>
            {children}
            <View style={styles.faceLower}>
                <View style={[styles.nameBand, { backgroundColor: band }]}>
                    <Text style={[styles.nameText, large && styles.nameTextLarge]} numberOfLines={1}>{gold ? '★ ' : ''}{card.name}</Text>
                </View>
                {large ? (
                    /* large inspect card: the effect SENTENCE (keywords bolded, hero number
                       inside it) replaces the small card's terse keyword/value block — stated
                       ONCE, on the card itself (Sanguine-Step shape). */
                    <View style={styles.faceBody}>
                        <OutcomeText
                            text={card.detail.outcomeLine}
                            names={card.detail.keywords.map((k) => k.name)}
                            base={styles.faceEffect}
                            bold={styles.faceEffectBold}
                        />
                    </View>
                ) : (
                    <View style={styles.cardFooter}>
                        <View style={styles.footCol}>
                            <Text style={styles.footFreeLabel} numberOfLines={1}>◇ FREE</Text>
                            <Text style={styles.footFreeVal} numberOfLines={1} adjustsFontSizeToFit>{f.freeHeroText}</Text>
                        </View>
                        <View style={styles.footRule} />
                        <View style={styles.footCol}>
                            <View style={styles.footPaidLabelRow}>
                                <Text style={[styles.footPaidLabel, { color: kwColor }]} numberOfLines={1} adjustsFontSizeToFit>◆ {f.keyword ?? 'DIE'}</Text>
                                {readPip ? <Text style={[styles.paidPip, { color: kwColor }]}>{readPip}</Text> : null}
                            </View>
                            {!numberless ? <Text style={[styles.footPaidVal, { color: kwColor }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text> : null}
                            {f.heroSub ? <Text style={styles.footSub} numberOfLines={1} adjustsFontSizeToFit>{f.heroSub}</Text> : null}
                        </View>
                    </View>
                )}
                {/* large-only TYPE-TAB pinned to the card's bottom edge (replaces the floating
                    detailTypeBanner in the modal). */}
                {large ? (
                    <View style={styles.typeTab}>
                        <Text style={styles.typeTabText} numberOfLines={1}>{card.detail.metaChip}</Text>
                    </View>
                ) : null}
            </View>
        </View>
    );
}

// The fanned hand card — a small instance of the shared face. Height grows into the
// reclaimed play-area void; width stays ~108 (the binding constraint at ~390pt).
function HandCard({ card }: { card: CombatCardVM }) {
    return <CombatCardFace card={card} width={108} height={152} />;
}

const useStyles = makeStyles((AXM) => ({
    root: { flex: 1, backgroundColor: '#0c0a08' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: 8, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: AXM.ash },
    headerTitle: { fontFamily: FONTS.gothic, fontSize: 17, color: AXM.parchment, letterSpacing: 0.5 },
    phaseBadge: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 1.2, color: AXM.bg, paddingHorizontal: 5, paddingVertical: 1, overflow: 'hidden' },
    roundLabel: { fontFamily: FONTS.mono, fontSize: 11, color: AXM.bone, letterSpacing: 0.8 },

    sigPanel: { paddingHorizontal: 12, paddingVertical: 4, backgroundColor: 'rgba(212,192,38,0.07)', borderBottomWidth: 1, borderBottomColor: AXM.ash },
    sigHead: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 1.2, color: AXM.sulfur, marginBottom: 4 },
    // Single non-wrapping row — chips shrink to fit so the row never grows a second
    // line (reclaims vertical budget for the hand).
    sigRow: { flexDirection: 'row', flexWrap: 'nowrap', gap: 4, overflow: 'hidden' },
    sigChip: { flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderRadius: 3, paddingHorizontal: 5, paddingVertical: 3, backgroundColor: 'rgba(0,0,0,0.4)', flexShrink: 1 },
    sigIcon: { fontSize: 12 },
    sigName: { fontFamily: FONTS.sans, fontSize: 10, letterSpacing: 0.4, maxWidth: 72, flexShrink: 1 },
    sigCost: { fontFamily: FONTS.mono, fontSize: 10 },

    // Compact die tray — leaves the vertical budget to the play area.
    tray: { paddingHorizontal: 12, paddingTop: 6, paddingBottom: 6, backgroundColor: 'rgba(0,0,0,0.35)', borderBottomWidth: 1, borderBottomColor: AXM.ash },
    trayHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
    trayLabel: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 1, color: AXM.bone },
    newTurn: { borderWidth: 1, borderColor: AXM.bone, paddingHorizontal: 7, paddingVertical: 2 },
    newTurnText: { fontFamily: FONTS.mono, fontSize: 10, color: AXM.parchment, letterSpacing: 0.8 },
    trayDice: { flexDirection: 'row', gap: 22, justifyContent: 'center', alignItems: 'center', minHeight: 58 },
    dieAssigned: { opacity: 0.4 },
    // Drawn X/dud die — a small greyed pip, not a full slot.
    dieXPip: { width: 24, height: 24, borderRadius: 6, borderWidth: 1, borderColor: '#3a3a3a', backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', opacity: 0.6 },
    dieXGlyph: { fontFamily: FONTS.sans, fontSize: 12, color: '#8a8273' },
    dieConv: { fontFamily: FONTS.mono, fontSize: 9, color: AXM.bone, textAlign: 'center', marginTop: 2, letterSpacing: 0.5 },
    diePip: { fontFamily: FONTS.sans, fontSize: 10, textAlign: 'center', marginTop: 2, letterSpacing: 0.6 },
    trayEmpty: { fontFamily: FONTS.serifItalic, fontStyle: 'italic', fontSize: 13, color: AXM.ash, alignSelf: 'center' },

    // Play area — collapses to a slim hint strip while empty (playAreaCollapsed) and
    // grows to flex:1 once a card is staged (playAreaActive). The flex:1 wrapper above
    // absorbs leftover; the fixed dock below stays pinned and fully visible.
    playArea: { marginHorizontal: 10, marginTop: 8, borderWidth: 1.5, borderStyle: 'dashed', backgroundColor: 'rgba(212,192,38,0.04)', paddingHorizontal: 8, paddingTop: 6, paddingBottom: 6, overflow: 'hidden' },
    playAreaActive: { flex: 1, minHeight: 120 },
    playAreaCollapsed: { height: 64 },
    playHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
    playLabel: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 1.2 },
    deckCounts: { fontFamily: FONTS.mono, fontSize: 10, color: AXM.bone, letterSpacing: 1 },
    playEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    playEmptyText: { fontFamily: FONTS.serifItalic, fontStyle: 'italic', fontSize: 13, color: AXM.ash, textAlign: 'center' },
    // Single-line hint shown inside the collapsed (empty) strip.
    playEmptyStrip: { fontFamily: FONTS.serifItalic, fontStyle: 'italic', fontSize: 12, color: AXM.ash },

    // Compact row-wrap play area — small fixed-width cards laid out in rows.
    playCards: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', alignContent: 'flex-start', paddingTop: 2 },
    stagedCol: { alignItems: 'center', gap: 3 },
    stagedCard: { width: 88, minHeight: 95, borderWidth: 2, borderRadius: 4, backgroundColor: '#14110e', overflow: 'hidden' },
    cardDie: { position: 'absolute', top: 4, right: 4, zIndex: 4 },
    actHint: { fontFamily: FONTS.mono, fontSize: 11, color: '#c2a14e', textAlign: 'center', letterSpacing: 0.3, paddingHorizontal: 12 },

    applyBtn: { width: 88, borderWidth: 1.5, borderRadius: 3, paddingVertical: 4, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
    applyText: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 1.4 },

    // Taller dock (CLIP FIX) so the enlarged hand clears the home indicator.
    dock: { height: 210, borderTopWidth: 1, borderTopColor: AXM.ash },
    // While nothing is staged the dock claims the play-area's released flex so the
    // fan enlarges + lifts into the reclaimed void.
    dockExpanded: { flex: 1 },
    trashBin: { position: 'absolute', left: 8, bottom: 10, zIndex: 40, width: 58, height: 58, borderRadius: 29, borderWidth: 1.5, borderStyle: 'dashed', borderColor: AXM.ash, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
    trashLabel: { fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1, color: AXM.bone, marginTop: 1 },
    // Horizontal gutters (left: SCRAP, right: END PHASE) so the fan never lays a card
    // under either control. paddingBottom is applied inline (safe-area inset).
    fan: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', paddingLeft: 64, paddingRight: 96 },

    // ── Shared card FACE (hand · staged · inspect modal) ──────────────────────
    faceCard: { borderWidth: 1.5, borderRadius: 5, backgroundColor: '#14110e', overflow: 'hidden' },
    // Art raised to 58% (kills the dead mid-card black band) — the name band anchors
    // directly beneath it, paidSection fills the remainder.
    faceArt: { width: '100%', height: '58%', backgroundColor: '#0c0a08' },
    faceArtTint: { ...StyleSheet.absoluteFillObject, opacity: 0.16 },
    // Light bottom scrim only (was 62%/0.6 — that read as a gray wash over the art).
    faceArtScrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '32%', backgroundColor: 'rgba(10,8,6,0.4)' },
    // Stance vignette: a SUBTLE stance-tinted bottom wash so each stance reads as a distinct
    // hue behind the shared placeholder photo — kept light so the art is not washed out.
    faceArtVignette: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '42%', opacity: 0.12 },
    faceLower: { flex: 1 },
    glyphCorner: { position: 'absolute', top: 3, left: 5, fontSize: 12, zIndex: 3 },
    // Small face: the category glyph promoted from a tiny corner mark to a medium
    // centred watermark CONFINED to the art window — differentiates categories harder
    // until per-card art ships (per-card art is the real fix; this is zero-dep/OTA-safe).
    glyphWatermarkSmall: { position: 'absolute', alignSelf: 'center', top: '18%', fontSize: 38, opacity: 0.16, zIndex: 2 },
    // Large inspect card: the category glyph promoted to a faint centred watermark,
    // CONFINED to the art window (never behind the keyword/value text).
    glyphWatermark: { position: 'absolute', alignSelf: 'center', top: '24%', fontSize: 72, opacity: 0.16, zIndex: 2 },
    // Square stance TAB (not a round cost-orb): these cards have no resource cost.
    costPip: { position: 'absolute', top: 3, right: 3, width: 17, height: 17, borderRadius: 3, borderWidth: 1, borderColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', zIndex: 4 },
    costPipLarge: { top: 9, right: 9, width: 32, height: 32, borderRadius: 4, borderWidth: 1.5 },
    costPipGlyph: { fontFamily: FONTS.sans, fontSize: 10, color: '#100d0a' },
    costPipGlyphLarge: { fontSize: 18 },
    freePip: { position: 'absolute', left: 3, top: '40%', maxWidth: '64%', backgroundColor: 'rgba(10,8,6,0.78)', borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1, zIndex: 4 },
    freePipLarge: { left: 10, top: '40%', paddingHorizontal: 8, paddingVertical: 3 },
    freePipText: { fontFamily: FONTS.mono, fontSize: 8, color: AXM.bone, letterSpacing: 0.3 },
    freePipTextLarge: { fontSize: 13 },
    // Bevelled name banner — 1px top highlight + 1px bottom shadow reads as raised metal/wood.
    nameBand: { paddingVertical: 3, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.28)', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.45)' },
    nameText: { fontFamily: FONTS.gothic, fontSize: 12.5, lineHeight: 15, color: '#100d0a', textAlign: 'center' },
    // Large banner: light parchment ink + a drop shadow for contrast (the dark ink on a
    // saturated band was weak).
    nameTextLarge: { fontSize: 22, lineHeight: 26, color: '#f3e9d2', textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 3, textShadowOffset: { width: 0, height: 1 } },
    paidSection: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 6, paddingBottom: 5, paddingTop: 3, backgroundColor: 'rgba(10,8,6,0.62)' },
    paidSectionLarge: { paddingHorizontal: 14, paddingBottom: 13, paddingTop: 8 },
    paidRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    paidKw: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 1 },
    paidKwLarge: { fontSize: 13, letterSpacing: 1.5 },
    paidPip: { fontFamily: FONTS.sans, fontSize: 9 },
    paidVal: { fontFamily: FONTS.mono, fontSize: 19, lineHeight: 21, marginTop: 1 },
    paidValLarge: { fontSize: 24, lineHeight: 28, marginTop: 3 },
    paidSub: { fontFamily: FONTS.mono, fontSize: 8, lineHeight: 10, color: AXM.bone, letterSpacing: 0.2, marginTop: 1 },
    paidSubLarge: { fontSize: 12, lineHeight: 15, marginTop: 2 },
    // Two-column FREE | PAID footer (small hand/staged face) — both legible at one scale,
    // paid value capped so it never dominates (was a single oversized 19px line).
    cardFooter: { flex: 1, flexDirection: 'row', alignItems: 'stretch', backgroundColor: 'rgba(10,8,6,0.62)' },
    footCol: { flex: 1, justifyContent: 'center', paddingHorizontal: 5, paddingVertical: 4 },
    footRule: { width: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.14)', marginVertical: 5 },
    footFreeLabel: { fontFamily: FONTS.sans, fontSize: 8, letterSpacing: 0.8, color: AXM.bone },
    footFreeVal: { fontFamily: FONTS.mono, fontSize: 12, lineHeight: 14, color: AXM.parchment, marginTop: 1 },
    footPaidLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    footPaidLabel: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 0.6 },
    footPaidVal: { fontFamily: FONTS.mono, fontSize: 15, lineHeight: 17, marginTop: 1 },
    footSub: { fontFamily: FONTS.mono, fontSize: 8, lineHeight: 10, color: AXM.bone, marginTop: 1 },
    // large-only effect body (Sanguine-Step shape) — fills the space under the name band.
    // Warm parchment-tone panel behind the effect text (was transparent on dark — the
    // serif read as floating; the warm wash anchors it like the Sanguine-Step scroll).
    faceBody: { flex: 1, justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 8, backgroundColor: 'rgba(38,30,20,0.6)' },
    faceEffect: { fontFamily: FONTS.serif, fontSize: 13.5, lineHeight: 19, color: AXM.parchment, textAlign: 'center' },
    faceEffectBold: { fontFamily: FONTS.gothic, color: AXM.sulfur },
    // large-only TYPE-TAB pinned to the card's bottom edge.
    typeTab: { alignSelf: 'center', marginBottom: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.5)', backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 2, paddingHorizontal: 10, paddingVertical: 3 },
    typeTabText: { fontFamily: FONTS.sans, fontSize: 9, letterSpacing: 1.4, color: AXM.bone },

    playWrap: { position: 'absolute', right: 10, bottom: 12, zIndex: 40, shadowColor: AXM.sulfur, shadowRadius: 14, shadowOffset: { width: 0, height: 0 }, elevation: 8 },
    playBtn: { width: 72, height: 72, borderRadius: 36, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
    playText: { fontFamily: FONTS.gothic, fontSize: 16, letterSpacing: 1, lineHeight: 17 },
    playSub: { fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1, marginTop: 1 },
}));
