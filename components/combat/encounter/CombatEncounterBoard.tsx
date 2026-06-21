/**
 * Spec 25 §7 — Hazard-Pattern Combat board.
 *
 * The full-information combat surface: two Pressure Tracks (the central
 * element), the enemy threat timeline, the enemy effect panel, the stance-dice
 * board, and the skill-card hand. Tap a card's FREE / POWER button to play it;
 * END PHASE resolves the current threat phase. The board renders engine-derived
 * view models (via `combatPresenter`) and never computes rules (ADR-0001/0003).
 */

import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { lookupEffect, type CombatEncounterState } from 'axiomancer-mechanics';
import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';
import {
    pressureView, threatTimelineView, handView, diceView, effectsView,
    type HandCardView, type PressureTrackView, type ThreatPhaseView, type DieView,
} from '../combatPresenter';
import { StatusEffectBadge } from './StatusEffectBadge';

const VERB_GLYPH: Record<string, string> = {
    'direct-dot': '🔥', 'direct-control': '⛓', 'stat-debuff': '▼',
    'buff-self': '🛡', 'direct-damage': '⚔', 'befriend': '🕊', 'retreat': '🏳',
};

const DIE_GLYPH: Record<string, string> = { heart: '♥', body: '⚡', mind: '★', wild: '✦', x: '✕' };

export interface CombatBoardProps {
    state: CombatEncounterState;
    onPlay: (uid: string, useBottom: boolean) => void;
    onEndPhase: () => void;
}

// ── Pressure tracks (central element, §7.1) ──────────────────────────────────

function PressureMeter({ track }: { track: PressureTrackView }) {
    const styles = useStyles();
    const AXM = usePalette();
    const pct = Math.round(track.pct * 100);
    return (
        <View
            style={styles.meter}
            testID={`combat-track-${track.key}`}
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel={`${track.label}: ${track.value} of ${track.threshold}${track.reached ? ', threshold reached' : ''}`}
        >
            <View style={styles.meterHead}>
                <Text style={[styles.meterLabel, { color: track.color }]}>{track.label}</Text>
                <Text style={styles.meterValue}>
                    <Text style={{ color: track.color }}>{track.value}</Text>
                    <Text style={{ color: AXM.bone }}> / {track.threshold}</Text>
                    {track.reached ? ' ✓' : ''}
                </Text>
            </View>
            <View style={[styles.meterTrack, { borderColor: `${track.color}55` }]}>
                <View
                    testID={`combat-track-${track.key}-fill`}
                    style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, backgroundColor: track.color }}
                />
                {/* phase-clear tick */}
                <View style={[styles.tick, { left: `${Math.round(track.phaseTickPct * 100)}%`, backgroundColor: AXM.parchment }]} />
            </View>
        </View>
    );
}

// ── Threat timeline (§7.2) ───────────────────────────────────────────────────

function ThreatChip({ phase }: { phase: ThreatPhaseView }) {
    const styles = useStyles();
    const AXM = usePalette();
    const mark = phase.mark === 'clear' ? '○' : phase.mark === 'overwhelmed' ? '✕' : '·';
    const markColor = phase.mark === 'clear' ? '#5bbf6a' : phase.mark === 'overwhelmed' ? AXM.blood : AXM.bone;
    return (
        <View
            style={[
                styles.threatChip,
                { borderColor: phase.isCurrent ? phase.stanceColor : AXM.ash, opacity: phase.isFuture ? 0.5 : 1 },
            ]}
            testID={`combat-threat-${phase.index}`}
        >
            <View style={styles.threatHead}>
                <Text style={[styles.threatStance, { color: phase.stanceColor }]}>{phase.stance.toUpperCase()}</Text>
                <Text style={[styles.threatMark, { color: markColor }]}>{mark}</Text>
            </View>
            <Text style={styles.threatReq}>D{phase.dotRequired} · C{phase.controlRequired}</Text>
            <Text style={styles.threatText} numberOfLines={2}>{phase.threatText}</Text>
        </View>
    );
}

// ── Dice board (§7.4) ────────────────────────────────────────────────────────

function DieChip({ die }: { die: DieView }) {
    const styles = useStyles();
    const AXM = usePalette();
    const dim = !die.available;
    return (
        <View
            style={[styles.die, { borderColor: die.colorHex, backgroundColor: `${die.colorHex}${dim ? '11' : '33'}`, opacity: dim ? 0.45 : 1 }]}
            testID={`combat-die-${die.id}`}
            accessible
            accessibilityLabel={`${die.color} die, ${die.state}`}
        >
            <Text style={[styles.dieGlyph, { color: dim ? AXM.bone : die.colorHex }]}>{DIE_GLYPH[die.color] ?? '?'}</Text>
            {die.temporary && <Text style={styles.dieTag}>+</Text>}
        </View>
    );
}

// ── Hand card (§7.3) ─────────────────────────────────────────────────────────

function CardRow({ card, onPlay }: { card: HandCardView; onPlay: (uid: string, useBottom: boolean) => void }) {
    const styles = useStyles();
    const AXM = usePalette();
    const bandColor = card.costBand === 'cheap' ? '#5bbf6a' : card.costBand === 'costly' ? AXM.blood : AXM.bone;
    return (
        <View style={[styles.card, { borderLeftColor: card.stanceColor }]} testID={`combat-card-${card.cardId}`}>
            <View style={styles.cardMain}>
                <View style={styles.cardTitleRow}>
                    <Text style={styles.cardGlyph}>{VERB_GLYPH[card.verbClass] ?? '•'}</Text>
                    <Text style={[styles.cardName, { color: card.stanceColor }]} numberOfLines={1}>{card.name}</Text>
                    <Text style={[styles.cardBand, { color: bandColor, borderColor: bandColor }]}>
                        {card.costBand === 'cheap' ? 'FREE' : card.costBand === 'costly' ? `${card.dieCost} DICE` : '1 DIE'}
                    </Text>
                </View>
                <Text style={styles.cardDesc} numberOfLines={2}>{card.bottomActionText}</Text>
            </View>
            <View style={styles.cardBtns}>
                <Pressable
                    onPress={() => onPlay(card.uid, false)}
                    testID={`combat-card-${card.cardId}-top`}
                    accessibilityRole="button"
                    accessibilityLabel={`${card.name} free action`}
                    style={[styles.cardBtn, { borderColor: AXM.bone }]}
                >
                    <Text style={[styles.cardBtnText, { color: AXM.bone }]}>FREE</Text>
                </Pressable>
                <Pressable
                    onPress={() => onPlay(card.uid, true)}
                    testID={`combat-card-${card.cardId}-bottom`}
                    accessibilityRole="button"
                    accessibilityLabel={`${card.name} powered action, ${card.advantage}`}
                    style={[styles.cardBtn, { borderColor: bandColor, backgroundColor: `${bandColor}22` }]}
                >
                    <Text style={[styles.cardBtnText, { color: bandColor }]}>
                        POWER{card.track !== 'none' ? ` +${card.bottomPressurePreview}` : ''}
                    </Text>
                </Pressable>
            </View>
        </View>
    );
}

// ── The board ────────────────────────────────────────────────────────────────

export const CombatEncounterBoard = React.memo(function CombatEncounterBoard({ state, onPlay, onEndPhase }: CombatBoardProps) {
    const styles = useStyles();
    const AXM = usePalette();
    const tracks = pressureView(state);
    const timeline = threatTimelineView(state);
    const hand = handView(state);
    const dice = diceView(state);
    const enemyEffects = effectsView(state.enemy.effects, lookupEffect);
    const playerEffects = effectsView(state.player.effects, lookupEffect);
    const enemyHpPct = Math.max(0, Math.round((state.enemy.health / Math.max(1, state.enemy.maxHealth)) * 100));
    const playerHpPct = Math.max(0, Math.round((state.player.health / Math.max(1, state.player.maxHealth)) * 100));

    return (
        <View style={styles.root} testID="combat-encounter-board">
            {/* enemy header */}
            <View style={styles.enemyBar}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.enemyName} numberOfLines={1}>{state.enemy.name}</Text>
                    <View style={styles.hpTrack}>
                        <View style={[styles.hpFill, { width: `${enemyHpPct}%`, backgroundColor: AXM.blood }]} />
                    </View>
                </View>
                <Text style={styles.roundLabel}>R{state.round}</Text>
            </View>

            {/* enemy effects (§7.6) */}
            {enemyEffects.length > 0 && (
                <View style={styles.effectRow} testID="combat-enemy-effects">
                    {enemyEffects.map(e => <StatusEffectBadge key={e.effectId} effect={e} compact />)}
                </View>
            )}

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 8 }}>
                {/* PRESSURE TRACKS — the central element */}
                <View style={styles.pressurePanel} testID="combat-pressure-tracks">
                    {tracks.map(t => <PressureMeter key={t.key} track={t} />)}
                </View>

                {/* THREAT TIMELINE */}
                <Text style={styles.sectionLabel}>THREAT SEQUENCE</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.threatRow} testID="combat-threat-timeline">
                    {timeline.map(p => <ThreatChip key={p.index} phase={p} />)}
                </ScrollView>

                {/* DICE BOARD */}
                <Text style={styles.sectionLabel}>STANCE DICE</Text>
                <View style={styles.diceRow} testID="combat-dice-board">
                    {dice.map(d => <DieChip key={d.id} die={d} />)}
                </View>

                {/* HAND */}
                <Text style={styles.sectionLabel}>HAND — PLAY A CARD</Text>
                <View testID="combat-hand">
                    {hand.map(c => <CardRow key={c.uid} card={c} onPlay={onPlay} />)}
                    {hand.length === 0 && <Text style={styles.empty}>no cards — end the phase</Text>}
                </View>
            </ScrollView>

            {/* player + end phase */}
            <View style={styles.footer}>
                <View style={{ flex: 1 }}>
                    <View style={styles.hpTrack}>
                        <View style={[styles.hpFill, { width: `${playerHpPct}%`, backgroundColor: '#5bbf6a' }]} />
                    </View>
                    {playerEffects.length > 0 && (
                        <View style={styles.effectRowSm} testID="combat-player-effects">
                            {playerEffects.map(e => <StatusEffectBadge key={e.effectId} effect={e} compact />)}
                        </View>
                    )}
                </View>
                <Pressable onPress={onEndPhase} testID="combat-end-phase" accessibilityRole="button" accessibilityLabel="End phase" style={[styles.endBtn, { borderColor: AXM.sulfur }]}>
                    <Text style={[styles.endText, { color: AXM.sulfur }]}>END PHASE</Text>
                </Pressable>
            </View>
        </View>
    );
});

const useStyles = makeStyles((AXM) => ({
    root: { flex: 1, backgroundColor: AXM.bg },
    enemyBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 6 },
    enemyName: { fontFamily: FONTS.gothic, fontSize: 17, color: AXM.parchment, letterSpacing: 0.5 },
    roundLabel: { fontFamily: FONTS.mono, fontSize: 13, color: AXM.bone },
    hpTrack: { height: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1, borderColor: AXM.ash, marginTop: 3, overflow: 'hidden' },
    hpFill: { position: 'absolute', left: 0, top: 0, bottom: 0 },
    effectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, paddingHorizontal: 12, paddingBottom: 6 },
    effectRowSm: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
    pressurePanel: { marginHorizontal: 10, marginTop: 6, padding: 10, backgroundColor: 'rgba(6,5,4,0.7)', borderWidth: 1, borderColor: AXM.ash, gap: 10 },
    meter: {},
    meterHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 },
    meterLabel: { fontFamily: FONTS.sans, fontSize: 13, letterSpacing: 1.2 },
    meterValue: { fontFamily: FONTS.mono, fontSize: 13 },
    meterTrack: { height: 16, borderWidth: 1, backgroundColor: 'rgba(0,0,0,0.45)', overflow: 'hidden' },
    tick: { position: 'absolute', top: 0, bottom: 0, width: 2, opacity: 0.8 },
    sectionLabel: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 1.6, color: AXM.bone, marginTop: 12, marginBottom: 5, marginHorizontal: 12 },
    threatRow: { flexDirection: 'row', gap: 7, paddingHorizontal: 12 },
    threatChip: { width: 116, borderWidth: 1, backgroundColor: 'rgba(0,0,0,0.35)', padding: 6 },
    threatHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    threatStance: { fontFamily: FONTS.sans, fontSize: 12, letterSpacing: 1 },
    threatMark: { fontFamily: FONTS.mono, fontSize: 14 },
    threatReq: { fontFamily: FONTS.mono, fontSize: 10, color: AXM.bone, marginTop: 2 },
    threatText: { fontFamily: FONTS.serifItalic, fontStyle: 'italic', fontSize: 10, color: AXM.parchmentDim, marginTop: 3 },
    diceRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 12, justifyContent: 'center' },
    die: { width: 46, height: 46, borderWidth: 2, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
    dieGlyph: { fontSize: 22, lineHeight: 24 },
    dieTag: { position: 'absolute', top: 1, right: 3, fontFamily: FONTS.mono, fontSize: 10, color: AXM.sulfur },
    card: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 10, marginBottom: 6, paddingVertical: 6, paddingHorizontal: 8, borderWidth: 1, borderLeftWidth: 4, borderColor: AXM.ash, backgroundColor: 'rgba(0,0,0,0.3)' },
    cardMain: { flex: 1 },
    cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    cardGlyph: { fontSize: 16 },
    cardName: { flex: 1, fontFamily: FONTS.sans, fontSize: 14, letterSpacing: 0.6 },
    cardBand: { fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 0.5, borderWidth: 1, paddingHorizontal: 3, paddingVertical: 1 },
    cardDesc: { fontFamily: FONTS.mono, fontSize: 10, color: AXM.bone, marginTop: 2 },
    cardBtns: { gap: 4 },
    cardBtn: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, minWidth: 64, alignItems: 'center' },
    cardBtnText: { fontFamily: FONTS.sans, fontSize: 12, letterSpacing: 0.8 },
    empty: { fontFamily: FONTS.serifItalic, fontStyle: 'italic', fontSize: 13, color: AXM.ash, textAlign: 'center', marginVertical: 10 },
    footer: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: AXM.ash },
    endBtn: { borderWidth: 2, paddingHorizontal: 14, paddingVertical: 8 },
    endText: { fontFamily: FONTS.gothic, fontSize: 15, letterSpacing: 1 },
}));
