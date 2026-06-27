/**
 * CombatEncounterPanel — the Spec 26 / 26b card-and-dice combat surface,
 * extracted from `app/combat-encounter/index.tsx` (Phase 200) so the same
 * surface can be hosted by BOTH the dev route AND in-place inside the live
 * `EncounterModalOverlay` when the player triggers a map encounter.
 *
 * The engine `CombatEncounterState` is pure, so the panel holds it in local
 * React state and dispatches engine transitions; the presenter
 * (`buildCombatViewModel`) owns the mapping; the board owns the UI. The
 * drag ghost renders at panel root (top/left 0) and the board's drag uses
 * window coords, so the panel MUST be mounted full-bleed from the window
 * origin (the dev route wraps it in `<ScreenBg>`; the modal renders it as a
 * full-screen layer).
 *
 * Live play (`persistOutcome`) hand-rolls the economy write-back the new
 * engine intentionally omits (it has no economy layer — verified against
 * mechanics 0.28.0): final HP → player.health, `enemy.xpReward` →
 * experience (+ cascade level-ups), `rollLoot(enemy.loot)` → inventory.
 * Mirrors what the legacy `END_COMBAT` reducer did for the old combat. The
 * deckbuilder reward card is written regardless — it's the new system's own
 * reward (Spec 26b §C). Defeat HP / run reset is the host's concern.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import {
    initializeCombatEncounter, rollEncounterDice, playCombatCard, resolveThreatPhase,
    startTurn, endTurn, draftStanceDie, discardCombatCard, playSignatureSkill,
    selectEncounterMercyChoice, buildCombatSummary, rollCombatCardRewards, addRewardCard,
    rollLoot, addItem,
    type CombatEncounterState, type CombatOutcome, type Character, type Enemy,
} from 'axiomancer-mechanics';

import { CombatBoard, type DragController, type DragPayload } from '@/components/combat/encounter/CombatBoard';
import { CombatDie } from '@/components/combat/encounter/CombatDie';
import { CombatSummaryModal } from '@/components/combat/encounter/CombatSummaryModal';
import { CombatRewardsOverlay } from '@/components/combat/encounter/CombatRewardsOverlay';
import { CombatTutorialPrimer } from '@/components/combat/encounter/CombatTutorialPrimer';
import { CombatTutorialCoach } from '@/components/combat/encounter/CombatTutorialCoach';
import { currentCombatTutorialStep } from '@/components/combat/encounter/combat-tutorial-steps';
import { EnemyPortrait } from '@/components/event/enemy-art/EnemyPortrait';
import { INTENT_ICONS, buildCombatViewModel, rewardOfferVMs, type CombatCardVM, type CombatEffectChipVM } from '@/state/presenters/combat-encounter.engine';
import { useGameState, useGameStore } from '@/state/GameStoreProvider';
import { COMBAT_TUTORIAL_FLAG, completeCombatTutorialAction } from '@/state/combat/store-actions';
import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';

type DropResolver = (payload: DragPayload, x: number, y: number) => void | Promise<void>;

export interface CombatEncounterPanelProps {
    /** The foe to fight (live: the real map encounter enemy; dev: a mock). */
    enemy: Enemy;
    /** Player snapshot used to initialise the encounter (deck derives from knownSkills). */
    bootstrapPlayer: Character;
    /** Optional explicit deck (engine derives one from knownSkills when omitted). */
    deck?: string[];
    /** Deterministic seed. */
    seed?: number;
    /** Force the first-fight tutorial primer/coach even if the flag is set. */
    forceTutorial?: boolean;
    /**
     * Live play: hand-roll HP/XP/loot/level-up back onto the persistent
     * player on combat end. Dev sandbox passes false so test runs don't
     * mutate the player's real progression.
     */
    persistOutcome?: boolean;
    /** Fired once when the player dismisses the terminal summary. */
    onExit: (outcome: CombatOutcome | null) => void;
}

type StoreLike = ReturnType<typeof useGameStore>;

/**
 * Economy write-back for a finished hazard encounter — the bridge the new
 * engine omits. Victory/mercy grant XP (+ cascade level-ups); victory also
 * rolls item loot. Final HP persists for every outcome except defeat (the
 * host's run-reset full-heals there). The deckbuilder card is handled
 * separately (it's claimed mid-flow via `addRewardCard`).
 */
function applyHazardOutcome(
    store: StoreLike,
    outcome: CombatOutcome,
    finalState: CombatEncounterState,
    enemy: Enemy,
): void {
    const finalHp = finalState.player.health;
    store.setState((s) => {
        if (!s.player) return {};
        let player: Character = { ...s.player };
        if (outcome !== 'defeat') {
            player = { ...player, health: Math.max(0, Math.min(finalHp, player.maxHealth)) };
        }
        if (outcome === 'victory' || outcome === 'mercy') {
            player = { ...player, experience: player.experience + (enemy.xpReward ?? 0) };
        }
        if (outcome === 'victory') {
            const drop = rollLoot(enemy.loot, Math.random);
            if (drop) {
                player = { ...player, inventory: addItem(player.inventory, drop) };
            }
        }
        return { player };
    });
    // Cascade level-ups through the engine store (applyLevelUps isn't exported,
    // so the LEVEL_UP reducer is the only public path). applyLevelUps already
    // loops internally; the guarded while-loop is belt-and-braces.
    if (outcome === 'victory' || outcome === 'mercy') {
        const levelUp = (store.getState() as { levelUp?: () => void }).levelUp;
        let guard = 0;
        while (
            typeof levelUp === 'function'
            && store.getState().player
            && (store.getState().player as Character).experience >= (store.getState().player as Character).experienceToNextLevel
            && guard < 20
        ) {
            guard += 1;
            levelUp();
        }
    }
}

export function CombatEncounterPanel({
    enemy,
    bootstrapPlayer,
    deck,
    seed,
    forceTutorial = false,
    persistOutcome = false,
    onExit,
}: CombatEncounterPanelProps) {
    const styles = useStyles();
    const AXM = usePalette();
    const player = useGameState((s) => s.player);
    const store = useGameStore();

    // ── first-fight tutorial (primer panels → turn-one coach) ──
    const seenTutorial = useGameState(
        (s) => ((s as unknown as { flags?: string[] }).flags ?? []).includes(COMBAT_TUTORIAL_FLAG),
    );
    const [primerDone, setPrimerDone] = useState(false);
    const [tutorialDismissed, setTutorialDismissed] = useState(false);
    const tutorialActive = (forceTutorial || !seenTutorial) && !tutorialDismissed;
    const finishTutorial = useCallback((skipped: boolean) => {
        setTutorialDismissed(true);
        completeCombatTutorialAction(store, skipped);
    }, [store]);

    const [state, setState] = useState<CombatEncounterState | null>(null);
    // Multi-card staging (hazard model): several cards can be staged at once; each
    // is APPLYd individually (powered by the die dragged onto it, or FREE).
    const [stagedUids, setStagedUids] = useState<string[]>([]);
    const [detailCard, setDetailCard] = useState<CombatCardVM | null>(null);
    const [tipEffect, setTipEffect] = useState<CombatEffectChipVM | null>(null);
    // Deckbuilder reward (Spec 26b §C) — rolled once on victory, claimed before the summary.
    const [rewardOffers, setRewardOffers] = useState<string[]>([]);
    const [rewardsClaimed, setRewardsClaimed] = useState(false);
    const wroteBackRef = useRef(false);
    const exitedRef = useRef(false);

    // Bootstrap the encounter ONCE — combat must not restart when the store
    // player mutates (e.g. our own write-back) or props re-identify.
    const initial = useMemo(
        () => initializeCombatEncounter(bootstrapPlayer, enemy, deck, seed),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    );

    const live = state ?? initial;
    const vm = useMemo(() => buildCombatViewModel(live), [live]);

    // ── screen-level drag controller (cards only) ──
    const [dragActive, setDragActive] = useState<DragPayload | null>(null);
    const dragRef = useRef<DragPayload | null>(null);
    const dragX = useSharedValue(0);
    const dragY = useSharedValue(0);
    const dragShown = useSharedValue(0);
    const begin = useCallback((payload: DragPayload, x: number, y: number) => {
        dragRef.current = payload; dragX.value = x; dragY.value = y; dragShown.value = 1; setDragActive(payload);
    }, [dragX, dragY, dragShown]);
    const move = useCallback((x: number, y: number) => { dragX.value = x; dragY.value = y; }, [dragX, dragY]);
    const drag: DragController = useMemo(() => ({ begin, move, end: () => undefined, active: dragActive }), [begin, move, dragActive]);
    const end = useCallback((x: number, y: number) => {
        const payload = dragRef.current; dragRef.current = null; dragShown.value = 0; setDragActive(null);
        if (!payload) return;
        const resolver = (drag as DragController & { resolveDrop?: DropResolver }).resolveDrop;
        if (resolver) void resolver(payload, x, y);
    }, [drag, dragShown]);
    drag.end = end;
    const ghostStyle = useAnimatedStyle(() => ({ opacity: dragShown.value, transform: [{ translateX: dragX.value - 37 }, { translateY: dragY.value - 60 }] }));

    // ── engine wiring ──
    const apply = useCallback((fn: (s: CombatEncounterState) => CombatEncounterState) => {
        setState((prev) => { const s = prev ?? initial; return fn(s); });
    }, [initial]);

    const unstageUid = useCallback((uid: string) => setStagedUids((prev) => prev.filter((u) => u !== uid)), []);
    const onEnter = useCallback(() => apply((s) => rollEncounterDice(s).state), [apply]);
    const onStage = useCallback((uid: string) => setStagedUids((prev) => (prev.includes(uid) ? prev : [...prev, uid])), []);
    const onUnstage = useCallback((uid: string) => unstageUid(uid), [unstageUid]);
    // APPLY one staged card (hazard model — the die is OPTIONAL). `power` true →
    // draft the dragged die (unless one is already drafted, the combo case) + power
    // the card (bottom action); `power` false → the FREE base action (top action,
    // no die). One commit; the card leaves staging.
    const onApply = useCallback((uid: string, dieId: string | null, power: boolean) => {
        apply((s) => {
            let ns = s;
            if (power && dieId && s.draftedDieId === null) ns = draftStanceDie(ns, dieId).state;
            return playCombatCard(ns, { uid }, power).state;
        });
        unstageUid(uid);
    }, [apply, unstageUid]);
    const onDiscard = useCallback((uid: string) => { apply((s) => discardCombatCard(s, uid).state); unstageUid(uid); }, [apply, unstageUid]);
    const onSignature = useCallback((id: string) => apply((s) => playSignatureSkill(s, id).state), [apply]);
    const onNewTurn = useCallback(() => { apply((s) => startTurn(endTurn(s).state).state); setStagedUids([]); }, [apply]);
    const onEndPhase = useCallback(() => {
        apply((s) => {
            let ns = resolveThreatPhase(s).state;
            if (ns.phase === 'phase-play' && ns.dice.length === 0) ns = startTurn(ns).state;
            return ns;
        });
        setStagedUids([]);
    }, [apply]);
    const onMercy = useCallback((choice: 'spare' | 'exploit') => apply((s) => selectEncounterMercyChoice(s, choice).state), [apply]);

    const handleExit = useCallback(() => {
        if (exitedRef.current) return;
        exitedRef.current = true;
        onExit(live.finalOutcome ?? null);
    }, [onExit, live.finalOutcome]);

    // Economy write-back — fires once, the instant combat reaches a terminal
    // outcome (so spoils land even if the player lingers on the summary).
    useEffect(() => {
        if (!live.finalOutcome || wroteBackRef.current) return;
        wroteBackRef.current = true;
        if (persistOutcome) applyHazardOutcome(store, live.finalOutcome, live, enemy);
    }, [live.finalOutcome, live, persistOutcome, store, enemy]);

    // Roll the deckbuilder reward once, on victory.
    useEffect(() => {
        if (live.finalOutcome === 'victory' && rewardOffers.length === 0 && !rewardsClaimed && player) {
            setRewardOffers(rollCombatCardRewards(player, Math.random, 3));
        }
    }, [live.finalOutcome, rewardOffers.length, rewardsClaimed, player]);

    // Tutorial completes itself once the turn-one coach script is exhausted.
    useEffect(() => {
        if (tutorialActive && primerDone && vm && live.phase !== 'reveal'
            && currentCombatTutorialStep(live, vm) === -1) {
            finishTutorial(false);
        }
    }, [tutorialActive, primerDone, live, vm, finishTutorial]);

    const onRewardPick = useCallback((cardId: string | null) => {
        if (cardId) store.setState((s) => (s.player ? { player: addRewardCard(s.player, cardId) } : {}));
        setRewardsClaimed(true);
    }, [store]);

    if (!vm) {
        return <View style={styles.root} testID="combat-encounter-empty" />;
    }

    const summary = live.finalOutcome ? buildCombatSummary(live) : null;
    const mercy = live.phase === 'mercy-choice' && !live.finalOutcome;
    const showReveal = live.phase === 'reveal';

    return (
        <View style={styles.root}>
            {!showReveal && (
                <CombatBoard
                    vm={vm}
                    drag={drag}
                    stagedUids={stagedUids}
                    onApply={onApply}
                    onStage={onStage}
                    onUnstage={onUnstage}
                    onDiscard={onDiscard}
                    onSignature={onSignature}
                    onNewTurn={onNewTurn}
                    onEndPhase={onEndPhase}
                    onInspect={setDetailCard}
                    onChip={setTipEffect}
                />
            )}

            {/* CombatRevealOverlay (Spec 26 §7) — read the foe before you commit */}
            {showReveal && (
                <View style={styles.reveal} testID="combat-reveal">
                    <ScrollView contentContainerStyle={styles.revealScroll}>
                        <Text style={styles.revealEyebrow}>⚔ A FOE BARS THE WAY</Text>
                        <View style={[styles.revealPortrait, { borderColor: AXM.blood }]}>
                            <EnemyPortrait enemyArtKey={vm.enemy.artKey} isBoss={vm.enemy.isBoss} width={120} height={140} label={vm.enemy.name} />
                        </View>
                        <Text style={styles.revealName}>{vm.enemy.name}</Text>
                        <Text style={styles.revealHp}>♥ {vm.enemy.hp} / {vm.enemy.maxHp}</Text>
                        {vm.enemy.stanceHint ? <Text style={styles.revealTell}>“{vm.enemy.stanceHint}”</Text> : null}
                        <Text style={styles.revealSection}>THREAT SEQUENCE — they telegraph WHAT, not their stance</Text>
                        {live.threatPhases.map((p, i) => {
                            const meta = INTENT_ICONS[p.intentType ?? 'pass'];
                            return (
                                <View key={i} style={styles.revealPhase}>
                                    <Text style={[styles.revealPhaseIcon, { color: meta.color }]}>{meta.icon}</Text>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.revealPhaseLabel}>PHASE {p.index} · {meta.label}</Text>
                                        <Text style={styles.revealPhaseText} numberOfLines={2}>{p.threatAction.description}</Text>
                                        {p.stanceHint ? <Text style={styles.revealPhaseTell}>🜲 stance hidden — {p.stanceHint}</Text> : null}
                                    </View>
                                </View>
                            );
                        })}
                        <Pressable onPress={onEnter} testID="combat-enter" accessibilityRole="button" accessibilityLabel="Enter combat and roll your first dice" style={[styles.revealBtn, { borderColor: AXM.sulfur }]}>
                            <Text style={[styles.revealBtnText, { color: AXM.sulfur }]}>ENTER COMBAT ›</Text>
                        </Pressable>
                    </ScrollView>
                </View>
            )}

            {/* mercy choice */}
            {mercy && (
                <View style={styles.backdrop} testID="combat-mercy">
                    <View style={[styles.modal, { borderColor: '#a86bdc' }]}>
                        <Text style={styles.modalTitle}>{live.enemy.name} is overwhelmed.</Text>
                        <Text style={styles.modalSub}>The will to fight has drained away.</Text>
                        <View style={styles.modalBtns}>
                            <Pressable onPress={() => onMercy('spare')} testID="combat-mercy-spare" accessibilityRole="button" accessibilityLabel="Spare" style={[styles.modalBtn, { borderColor: '#5bbf6a' }]}><Text style={[styles.modalBtnText, { color: '#5bbf6a' }]}>SPARE</Text></Pressable>
                            <Pressable onPress={() => onMercy('exploit')} testID="combat-mercy-exploit" accessibilityRole="button" accessibilityLabel="Exploit" style={[styles.modalBtn, { borderColor: AXM.blood }]}><Text style={[styles.modalBtnText, { color: AXM.blood }]}>EXPLOIT</Text></Pressable>
                        </View>
                    </View>
                </View>
            )}

            {/* card detail */}
            {detailCard && (
                <Pressable style={styles.backdrop} testID="combat-card-detail" onPress={() => setDetailCard(null)}>
                    <View style={[styles.modal, { borderColor: detailCard.stanceColor }]}>
                        <Text style={styles.modalTitle}>{detailCard.rarity === 'gold' ? '★ ' : ''}{detailCard.name}</Text>
                        <Text style={styles.detailMeta}>{detailCard.stance.toUpperCase()} · TIER {detailCard.tier} · {detailCard.verbClass.toUpperCase()}</Text>

                        <View style={[styles.detailSection, { borderColor: AXM.bone }]}>
                            <Text style={styles.detailSectionLabel}>FREE — no die required</Text>
                            <Text style={styles.detailLine}>{detailCard.freeLine}</Text>
                        </View>

                        <View style={[styles.detailSection, { borderColor: detailCard.stanceColor }]}>
                            <Text style={[styles.detailSectionLabel, { color: detailCard.stanceColor }]}>WITH DIE — 1 {detailCard.stance.toUpperCase()} die required</Text>
                            <Text style={styles.detailLine}>{detailCard.poweredLine}</Text>
                        </View>

                        {detailCard.keywords.length > 0 && (
                            <View style={styles.detailKeywords}>
                                <Text style={styles.detailKeywordsHead}>KEYWORDS</Text>
                                {detailCard.keywords.map((k) => (
                                    <View key={k.name} style={styles.detailKeywordRow}>
                                        <Text style={styles.detailKeywordName}>{k.name}</Text>
                                        <Text style={styles.detailKeywordDef}>{k.def}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        <Text style={styles.detailHint}>tap anywhere to dismiss · drag card up to stage it</Text>
                    </View>
                </Pressable>
            )}

            {/* effect tooltip */}
            {tipEffect && (
                <Pressable style={styles.backdrop} testID="combat-effect-tip" onPress={() => setTipEffect(null)}>
                    <View style={[styles.modal, { borderColor: tipEffect.glyph.color }]}>
                        <Text style={[styles.modalTitle, { color: tipEffect.glyph.color }]}>{tipEffect.glyph.glyph} {tipEffect.glyph.label}</Text>
                        <Text style={styles.detailMeta}>intensity {tipEffect.intensity}{tipEffect.isMax ? ' (MAX)' : ''} · {tipEffect.duration} turns left</Text>
                    </View>
                </Pressable>
            )}

            {/* deckbuilder reward — claimed before the summary on a win */}
            {live.finalOutcome === 'victory' && !rewardsClaimed && rewardOffers.length > 0 && (
                <CombatRewardsOverlay offers={rewardOfferVMs(rewardOffers)} onPick={onRewardPick} />
            )}

            {summary && (rewardsClaimed || live.finalOutcome !== 'victory') && (
                <CombatSummaryModal summary={summary} onClose={handleExit} />
            )}

            {/* first-fight tutorial — primer panels, then the turn-one coach */}
            {tutorialActive && !primerDone && (
                <CombatTutorialPrimer onBegin={() => setPrimerDone(true)} onSkip={() => finishTutorial(true)} />
            )}
            {tutorialActive && primerDone && !showReveal && !summary && !mercy && (
                <CombatTutorialCoach state={live} vm={vm} onSkip={() => finishTutorial(true)} />
            )}

            {/* drag ghost */}
            {dragActive && (
                <Animated.View pointerEvents="none" style={[styles.ghost, ghostStyle]}>
                    {dragActive.type === 'card' ? (
                        <View style={[styles.ghostCard, { borderColor: dragActive.card.stanceColor }]}>
                            <Text style={styles.ghostName} numberOfLines={2}>{dragActive.card.name}</Text>
                        </View>
                    ) : (
                        <CombatDie die={dragActive.die} size={56} />
                    )}
                </Animated.View>
            )}
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    root: { flex: 1, width: '100%', height: '100%' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.8)', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 50 },
    modal: { width: '100%', maxWidth: 380, borderWidth: 2, backgroundColor: AXM.panelBg, padding: 18, alignItems: 'center' },
    modalTitle: { fontFamily: FONTS.gothic, fontSize: 18, color: AXM.parchment, textAlign: 'center' },
    modalSub: { fontFamily: FONTS.serifItalic, fontStyle: 'italic', fontSize: 13, color: AXM.bone, textAlign: 'center', marginTop: 4, marginBottom: 14 },
    modalBtns: { flexDirection: 'row', gap: 12, marginTop: 6 },
    modalBtn: { borderWidth: 2, paddingHorizontal: 22, paddingVertical: 9 },
    modalBtnText: { fontFamily: FONTS.gothic, fontSize: 16, letterSpacing: 1 },
    detailMeta: { fontFamily: FONTS.mono, fontSize: 11, color: AXM.bone, letterSpacing: 0.6, marginTop: 4, marginBottom: 10 },
    detailSection: { alignSelf: 'stretch', borderWidth: 1, borderRadius: 3, padding: 10, marginBottom: 8 },
    detailSectionLabel: { fontFamily: FONTS.sans, fontSize: 10, letterSpacing: 1, color: AXM.bone, marginBottom: 5 },
    detailLine: { fontFamily: FONTS.serif, fontSize: 13, color: AXM.parchment, lineHeight: 18 },
    detailKeywords: { alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 3, padding: 10, marginBottom: 8 },
    detailKeywordsHead: { fontFamily: FONTS.sans, fontSize: 10, letterSpacing: 1.5, color: AXM.bone, opacity: 0.7, marginBottom: 7 },
    detailKeywordRow: { flexDirection: 'row', gap: 9, marginBottom: 6 },
    detailKeywordName: { fontFamily: FONTS.mono, fontSize: 12, letterSpacing: 0.8, color: AXM.sulfur, width: 78 },
    detailKeywordDef: { fontFamily: FONTS.serif, fontSize: 11.5, color: AXM.bone, lineHeight: 15, flex: 1 },
    detailHint: { fontFamily: FONTS.serifItalic, fontStyle: 'italic', fontSize: 11, color: AXM.bone, marginTop: 4, textAlign: 'center' },

    reveal: { flex: 1, backgroundColor: '#0c0a08' },
    revealScroll: { alignItems: 'center', padding: 22, paddingBottom: 40 },
    revealEyebrow: { fontFamily: FONTS.sans, fontSize: 12, letterSpacing: 2, color: AXM.blood, marginBottom: 14, marginTop: 8 },
    revealPortrait: { borderWidth: 2, borderRadius: 6, padding: 6, backgroundColor: AXM.deepBg },
    revealName: { fontFamily: FONTS.gothic, fontSize: 24, color: AXM.parchment, marginTop: 12, textAlign: 'center' },
    revealHp: { fontFamily: FONTS.mono, fontSize: 13, color: AXM.blood, marginTop: 2 },
    revealTell: { fontFamily: FONTS.serifItalic, fontStyle: 'italic', fontSize: 14, color: AXM.bone, textAlign: 'center', marginTop: 10, marginHorizontal: 10, lineHeight: 19 },
    revealSection: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 1.2, color: AXM.sulfur, marginTop: 20, marginBottom: 8, alignSelf: 'stretch' },
    revealPhase: { flexDirection: 'row', gap: 10, alignSelf: 'stretch', borderWidth: 1, borderColor: AXM.ash, backgroundColor: 'rgba(0,0,0,0.35)', padding: 9, marginBottom: 7 },
    revealPhaseIcon: { fontSize: 20, lineHeight: 22 },
    revealPhaseLabel: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 0.6, color: AXM.parchment },
    revealPhaseText: { fontFamily: FONTS.serif, fontSize: 12, color: AXM.bone, marginTop: 2, lineHeight: 15 },
    revealPhaseTell: { fontFamily: FONTS.serifItalic, fontStyle: 'italic', fontSize: 10, color: AXM.ash, marginTop: 3, lineHeight: 13 },
    revealBtn: { borderWidth: 2, paddingHorizontal: 30, paddingVertical: 12, marginTop: 22, backgroundColor: 'rgba(212,192,38,0.12)' },
    revealBtnText: { fontFamily: FONTS.gothic, fontSize: 18, letterSpacing: 1 },

    ghost: { position: 'absolute', top: 0, left: 0, zIndex: 999 },
    ghostCard: { width: 74, height: 104, borderWidth: 2, borderRadius: 4, backgroundColor: '#16130c', padding: 6, transform: [{ scale: 1.05 }], shadowColor: '#000', shadowOpacity: 0.6, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
    ghostName: { fontFamily: FONTS.gothic, fontSize: 12, color: AXM.parchment },
}));
