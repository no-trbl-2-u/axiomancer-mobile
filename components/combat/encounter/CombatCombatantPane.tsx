/**
 * Spec 26 §4.3 + 26b — the combatant pane. Replaces the Hazard crisis strip.
 *
 * Enemy (left) and player (right) side by side, each with a PORTRAIT, a visible
 * HP bar, and big legible STATUS-EFFECT chips (the doctrine: status effects are
 * the main fun and must be front-and-centre). The enemy side adds the INTENT
 * telegraph and the hidden-STANCE read: a "?" plus the thematic tell until the
 * stance is revealed, then the stance colour + label.
 *
 * Resolution FEEDBACK (driven off the engine's typed `CombatEvent` stream, fed in
 * via `fx`): the HP bars TWEEN (with a ghost-trail chunk), the enemy bust does a
 * small wind-up nudge toward the divider while the player recoils + red-flashes,
 * floating "-N" numbers rise over the struck combatant, and resolved-but-empty
 * turns flourish "DENIED". Beats are small, side-by-side, and non-blocking.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
    runOnJS, useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming,
} from 'react-native-reanimated';

import { EnemyPortrait } from '@/components/event/enemy-art/EnemyPortrait';
import { PlayerPortrait } from '@/components/art/PlayerPortrait';
import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';
import type {
    CombatEnemyPaneVM, CombatPlayerPaneVM, CombatEffectChipVM,
} from '@/state/presenters/combat-encounter.engine';
import type { CombatEvent } from 'axiomancer-mechanics';
import { effectGlyph } from '@/components/combat/statusGlyphs';
import { keywordForEffect } from '@/state/combat/keywords';
import { IntentIcon } from './IntentIcon';

/** A bump of resolved engine events the pane animates. `seq` rises on each new
 *  resolution so the effect fires exactly once per APPLY / END PHASE. */
export interface CombatFx { seq: number; events: CombatEvent[]; }

type Float = { id: number; text: string; color: string; dx: number };

function HpBar({ pct, value, max, color }: { pct: number; value: number; max: number; color: string }) {
    const AXM = usePalette();
    const styles = useStyles();
    const w = useSharedValue(pct);
    const ghost = useSharedValue(pct);
    useEffect(() => {
        const clamped = Math.max(0, Math.min(1, pct));
        // Ghost trail lingers at the old width, then catches up — exposing the
        // drained chunk for ~½s on a hit.
        ghost.value = withDelay(140, withTiming(clamped, { duration: 340 }));
        w.value = withTiming(clamped, { duration: 230 });
    }, [pct, w, ghost]);
    const fillStyle = useAnimatedStyle(() => ({ width: `${Math.max(0, Math.min(1, w.value)) * 100}%` }));
    const ghostStyle = useAnimatedStyle(() => ({ width: `${Math.max(0, Math.min(1, ghost.value)) * 100}%` }));
    return (
        <View style={styles.hpWrap} accessible accessibilityRole="progressbar" accessibilityLabel={`VITAE ${value} of ${max}`} accessibilityValue={{ min: 0, max, now: value }}>
            <View style={styles.hpTrack}>
                <Animated.View style={[styles.hpGhost, ghostStyle]} />
                <Animated.View style={[styles.hpFill, fillStyle, { backgroundColor: color }]} />
            </View>
            <Text style={[styles.hpText, { color: AXM.parchment }]}>♥ {value}<Text style={{ color: AXM.bone }}> / {max}</Text></Text>
        </View>
    );
}

/** A single floating "-N" / "DENIED" / keyword that rises and fades, then
 *  self-removes. `dx` jitters it horizontally so simultaneous floats (−N + DoT
 *  tick + BLOCKED) don't pile onto one pixel. */
function FloatNum({ text, color, dx, onDone }: { text: string; color: string; dx: number; onDone: () => void }) {
    const styles = useStyles();
    const ty = useSharedValue(0);
    const op = useSharedValue(1);
    useEffect(() => {
        op.value = withDelay(120, withTiming(0, { duration: 760 }));
        ty.value = withTiming(-30, { duration: 880 }, (fin) => { if (fin) runOnJS(onDone)(); });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const st = useAnimatedStyle(() => ({ opacity: op.value, transform: [{ translateX: dx }, { translateY: ty.value }] }));
    return (
        <Animated.View style={[styles.floatNum, st]} pointerEvents="none">
            <Text style={[styles.floatNumText, { color }]}>{text}</Text>
        </Animated.View>
    );
}

function EffectChips({ effects, onChip, emptyLabel }: { effects: CombatEffectChipVM[]; onChip?: (e: CombatEffectChipVM) => void; emptyLabel: string }) {
    const styles = useStyles();
    if (effects.length === 0) return <Text style={styles.noEffects}>{emptyLabel}</Text>;
    return (
        <View style={styles.chipRow}>
            {effects.map((e) => (
                <Pressable
                    key={e.effectId}
                    onPress={() => onChip?.(e)}
                    style={[styles.chip, { borderColor: `${e.glyph.color}aa` }]}
                    testID={`combat-effect-${e.effectId}`}
                    accessibilityRole="button"
                    accessibilityLabel={`${e.glyph.label}, intensity ${e.intensity}, ${e.duration} turns left${e.isMax ? ', maxed' : ''}`}
                >
                    <Text style={[styles.chipGlyph, { color: e.glyph.color }]}>{e.glyph.glyph}</Text>
                    <Text style={[styles.chipNum, { color: e.glyph.color }]}>{e.isMax ? 'MAX' : `×${e.intensity}`}</Text>
                    <Text style={styles.chipDur}>{e.duration}t</Text>
                </Pressable>
            ))}
        </View>
    );
}

export function CombatCombatantPane({
    enemy, player, conviction, onChip, fx,
}: {
    enemy: CombatEnemyPaneVM;
    player: CombatPlayerPaneVM;
    conviction: number;
    onChip?: (e: CombatEffectChipVM) => void;
    fx?: CombatFx;
}) {
    const AXM = usePalette();
    const styles = useStyles();

    const [enemyFloats, setEnemyFloats] = useState<Float[]>([]);
    const [playerFloats, setPlayerFloats] = useState<Float[]>([]);
    const idRef = useRef(0);
    const lastSeq = useRef(0);

    // Portrait feedback shared values: enemy anticipation+lunge; the player's recoil
    // jitter; the player hit-flash (portrait-scoped); the hitstop squash; the one-frame
    // contact flash/slash at the moment of impact.
    const enemyShift = useSharedValue(0);
    const enemyScale = useSharedValue(1);
    const playerShift = useSharedValue(0);
    const playerFlash = useSharedValue(0);
    const playerHit = useSharedValue(1);
    const contactFlash = useSharedValue(0);
    // Board-level feedback: a damage-scaled screen shake + a red vignette flash.
    const shake = useSharedValue(0);
    const vignette = useSharedValue(0);
    // Reduce-motion gate (recommended) — suppresses the shake + portrait lunge/recoil
    // (the HP tween, floats + haptics still fire so the hit is never silent).
    const reduceMotion = useRef(false);
    useEffect(() => {
        let alive = true;
        AccessibilityInfo.isReduceMotionEnabled().then((on) => { if (alive) reduceMotion.current = on; }).catch(() => undefined);
        const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (on) => { reduceMotion.current = on; });
        return () => { alive = false; sub?.remove?.(); };
    }, []);

    const pushEnemy = useCallback((text: string, color: string, dx = 0) => {
        const id = (idRef.current += 1);
        setEnemyFloats((p) => [...p, { id, text, color, dx }]);
    }, []);
    const pushPlayer = useCallback((text: string, color: string, dx = 0) => {
        const id = (idRef.current += 1);
        setPlayerFloats((p) => [...p, { id, text, color, dx }]);
    }, []);
    const dropEnemy = useCallback((id: number) => setEnemyFloats((p) => p.filter((f) => f.id !== id)), []);
    const dropPlayer = useCallback((id: number) => setPlayerFloats((p) => p.filter((f) => f.id !== id)), []);
    // The -N float + Heavy haptic, fired from the reanimated impact callback (was a
    // JS setTimeout that desynced from the portrait clock under load).
    const landPlayerHit = useCallback((dmg: number, blocked: number, fired: boolean) => {
        pushPlayer(`-${dmg}`, '#e2543b', 0);
        if (fired && blocked > 0) pushPlayer(`BLOCKED ${blocked}`, '#9aa0a6', 34);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => undefined);
    }, [pushPlayer]);
    const impact = useSharedValue(0);

    useEffect(() => {
        if (!fx || fx.seq === 0 || fx.seq === lastSeq.current) return;
        lastSeq.current = fx.seq;
        let playerDmg = 0;
        let enemyDmg = 0;
        let denied = false;
        let threatFired = false;
        const ticks: { side: 'enemy' | 'player'; amount: number }[] = [];
        // (d) status applications the engine already emits but the pane used to DROP —
        // zero-damage control/buff/debuff intents that were otherwise silent.
        const statusFloats: { side: 'enemy' | 'player'; text: string; color: string }[] = [];
        for (const e of fx.events) {
            if (e.kind === 'damage-dealt') {
                if (e.target === 'self') playerDmg += e.amount; else enemyDmg += e.amount;
            } else if (e.kind === 'dot-tick') {
                ticks.push({ side: e.target === 'self' ? 'player' : 'enemy', amount: e.amount });
            } else if (e.kind === 'phase-resolved' && e.mark === 'clear') {
                denied = true;
            } else if (e.kind === 'threat-fired') {
                threatFired = true;
            } else if (e.kind === 'effect-landed') {
                const side = e.target === 'self' ? 'player' : 'enemy';
                const kw = (keywordForEffect(e.effectId) ?? e.effectKind ?? 'effect').toUpperCase();
                const color = e.effect ? effectGlyph(e.effect as Parameters<typeof effectGlyph>[0]).color : (side === 'player' ? '#a86bdc' : '#d9b44a');
                statusFloats.push({ side, text: kw, color });
            } else if (e.kind === 'buff-stripped') {
                // strip_random_buff surfaced (0.36.0): float the removed buff over the affected side.
                const side = e.target === 'self' ? 'player' : 'enemy';
                const label = e.effectName ? `STRIP ${e.effectName.toUpperCase()}` : 'STRIP';
                statusFloats.push({ side, text: label, color: side === 'player' ? '#a86bdc' : '#d9b44a' });
            }
        }
        // (a) the player took damage → enemy ANTICIPATION (pull back) → scale-led lunge,
        //     then a ~100ms-delayed player recoil + portrait flash + "-N" so impact lands
        //     at the lunge apex; a short hitstop squash + one-frame contact flash on top.
        const IMPACT = 100;
        if (playerDmg > 0) {
            // Normalise the hit to its share of max HP so a 4-dmg chip and a 40-dmg
            // crusher no longer feel identical — every beat scales off `norm`.
            const norm = Math.min(1, playerDmg / Math.max(1, player.maxHp));
            const blocked = enemy.intent.damage - playerDmg;
            if (!reduceMotion.current) {
                const lunge = 8 + norm * 10;        // 8–18px enemy lunge apex
                const recoil = 4 + norm * 8;        // 4–12px player recoil
                const flash = 0.35 + norm * 0.4;    // portrait flash strength
                const squash = 0.94 - norm * 0.08;  // hitstop squash depth
                const mag = 4 + norm * 4;           // 4–8px board shake
                enemyScale.value = withSequence(withTiming(0.96, { duration: 90 }), withTiming(1 + norm * 0.14, { duration: 120 }), withTiming(1, { duration: 200 }));
                enemyShift.value = withSequence(withTiming(-6, { duration: 90 }), withTiming(lunge, { duration: 120 }), withTiming(0, { duration: 220 }));
                playerShift.value = withDelay(IMPACT, withSequence(withTiming(recoil, { duration: 70 }), withTiming(-recoil * 0.6, { duration: 70 }), withTiming(0, { duration: 90 })));
                playerFlash.value = withDelay(IMPACT, withSequence(withTiming(flash, { duration: 90 }), withTiming(0, { duration: 260 })));
                // (f) hitstop squash synced to the -N pop, depth ∝ damage.
                playerHit.value = withDelay(IMPACT, withSequence(withTiming(squash, { duration: 50 }), withTiming(1, { duration: 130 })));
                // (e) one-frame contact flash/slash glyph at the player portrait on impact.
                contactFlash.value = withDelay(IMPACT, withSequence(withTiming(1, { duration: 40 }), withTiming(0, { duration: 200 })));
                // board-level screen shake + red vignette at the impact apex (magnitude ∝ damage).
                shake.value = withDelay(IMPACT, withSequence(withTiming(mag, { duration: 40 }), withTiming(-mag * 0.7, { duration: 40 }), withTiming(mag * 0.4, { duration: 40 }), withTiming(0, { duration: 50 })));
                vignette.value = withDelay(IMPACT, withSequence(withTiming(Math.min(0.5, 0.18 + norm * 0.5), { duration: 80 }), withTiming(0, { duration: 360 })));
            }
            // Float + haptic ride the SAME reanimated clock as the lunge (a 1ms timer
            // after the impact delay) so they can't desync from the portrait beats.
            impact.value = 0;
            impact.value = withDelay(IMPACT, withTiming(1, { duration: 1 }, (fin) => { if (fin) runOnJS(landPlayerHit)(playerDmg, blocked, threatFired); }));
        } else if (denied || (threatFired && enemy.intent.damage > 0)) {
            // (b) the turn resolved with no damage to the player → DENIED flourish
            //     over the enemy (teaches "variety / guard denies the turn").
            pushEnemy('DENIED', '#d9b44a', 0);
        }
        // (d-symmetric) the player's APPLY landed on the enemy → flinch + float.
        if (enemyDmg > 0) {
            enemyShift.value = withSequence(withTiming(-6, { duration: 70 }), withTiming(0, { duration: 160 }));
            pushEnemy(`-${enemyDmg}`, AXM.parchment, 0);
        }
        // (c) DoT ticks float over the combatant they erode (alternating x-jitter).
        ticks.forEach((t, k) => {
            const dx = (k % 2 === 0 ? -1 : 1) * (18 + Math.floor(k / 2) * 14);
            if (t.side === 'player') pushPlayer(`-${t.amount}`, '#a86bdc', dx);
            else pushEnemy(`-${t.amount}`, '#e08a3b', dx);
        });
        // (d) never-silent status: float the applied KEYWORD when that side had no other
        //     float (a -N / tick already says "something happened" there).
        const playerHadFloat = playerDmg > 0 || ticks.some((t) => t.side === 'player');
        const enemyHadFloat = enemyDmg > 0 || ticks.some((t) => t.side === 'enemy');
        statusFloats.forEach((s, k) => {
            const dx = (k % 2 === 0 ? 1 : -1) * 28;
            if (s.side === 'player' && !playerHadFloat) pushPlayer(s.text, s.color, dx);
            else if (s.side === 'enemy' && !enemyHadFloat) pushEnemy(s.text, s.color, dx);
        });
    }, [fx, enemy.intent.damage, player.maxHp, AXM.parchment, enemyScale, enemyShift, playerShift, playerFlash, playerHit, contactFlash, shake, vignette, impact, landPlayerHit, pushEnemy, pushPlayer]);

    const enemyAnim = useAnimatedStyle(() => ({ transform: [{ translateX: enemyShift.value }, { scale: enemyScale.value }] }));
    const playerAnim = useAnimatedStyle(() => ({ transform: [{ translateX: playerShift.value }, { scale: playerHit.value }] }));
    const flashAnim = useAnimatedStyle(() => ({ opacity: playerFlash.value }));
    const contactStyle = useAnimatedStyle(() => ({ opacity: contactFlash.value }));
    const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));
    const vignetteStyle = useAnimatedStyle(() => ({ opacity: vignette.value }));

    return (
        <Animated.View style={[styles.pane, shakeStyle]} testID="combat-combatant-pane">
            {/* damage-scaled red vignette flash (pointer-transparent; gated by reduce-motion) */}
            <Animated.View pointerEvents="none" style={[styles.vignette, vignetteStyle]} />
            {/* ENEMY */}
            <View style={styles.side}>
                <View style={styles.floatLayer} pointerEvents="none">
                    {enemyFloats.map((f) => <FloatNum key={f.id} text={f.text} color={f.color} dx={f.dx} onDone={() => dropEnemy(f.id)} />)}
                </View>
                <View style={styles.headRow}>
                    <Animated.View style={[styles.portraitFrame, { borderColor: enemy.stanceColor }, enemyAnim]}>
                        <EnemyPortrait enemyArtKey={enemy.artKey} isBoss={enemy.isBoss} width={64} height={76} label={`${enemy.name} portrait`} />
                    </Animated.View>
                    <View style={styles.headText}>
                        <Text style={styles.name} numberOfLines={1}>{enemy.name}</Text>
                        <IntentIcon intent={enemy.intent} />
                    </View>
                </View>
                <HpBar pct={enemy.hpPct} value={enemy.hp} max={enemy.maxHp} color={AXM.blood} />
                {/* hidden-stance read — badge only, no text telegraph */}
                <View style={styles.stanceRow}>
                    <Text style={[styles.stanceBadge, { color: enemy.revealedStance ? enemy.stanceColor : AXM.bone, borderColor: enemy.revealedStance ? enemy.stanceColor : AXM.ash }]}>
                        🜲 {enemy.stanceLabel}
                    </Text>
                </View>
                <EffectChips effects={enemy.effects} onChip={onChip} emptyLabel="▸ land DoT / Control to erode them" />
            </View>

            <View style={styles.divider} />

            {/* PLAYER */}
            <View style={styles.side}>
                <View style={styles.floatLayer} pointerEvents="none">
                    {playerFloats.map((f) => <FloatNum key={f.id} text={f.text} color={f.color} dx={f.dx} onDone={() => dropPlayer(f.id)} />)}
                </View>
                <View style={styles.headRow}>
                    <Animated.View style={[styles.portraitFrame, { borderColor: AXM.sulfur }, playerAnim]}>
                        <PlayerPortrait width={64} height={76} />
                        {/* (b) hit flash scoped to the PORTRAIT (was an absoluteFill over the whole
                            player column, washing out the HP bar). */}
                        <Animated.View style={[styles.portraitFlash, flashAnim]} pointerEvents="none" />
                        {/* (e) one-frame contact slash at the moment of impact. */}
                        <Animated.View style={[styles.contactSlash, contactStyle]} pointerEvents="none">
                            <Text style={styles.contactSlashText}>✦</Text>
                        </Animated.View>
                    </Animated.View>
                    <View style={styles.headText}>
                        <Text style={styles.name} numberOfLines={1}>{player.name}</Text>
                        <Text style={[styles.conviction, { color: AXM.sulfur }]} testID="combat-conviction">◆ {conviction} CONVICTION</Text>
                    </View>
                </View>
                <HpBar pct={player.hpPct} value={player.hp} max={player.maxHp} color="#5bbf6a" />
                {player.guard > 0 ? <Text style={{ fontFamily: FONTS.mono, fontSize: 11, color: '#6fb3e0', marginTop: 3, letterSpacing: 0.5 }} testID="combat-guard">🛡 {player.guard} GUARD</Text> : null}
                <View style={styles.stanceRow}><Text style={styles.youLabel}>your status</Text></View>
                <EffectChips effects={player.effects} onChip={onChip} emptyLabel="clear — no debuffs on you" />
            </View>
        </Animated.View>
    );
}

const useStyles = makeStyles((AXM) => ({
    pane: { flexDirection: 'row', backgroundColor: 'rgba(8,6,5,0.9)', borderBottomWidth: 1, borderBottomColor: AXM.ash, paddingHorizontal: 8, paddingVertical: 7, minHeight: 162 },
    // Damage-scaled red vignette flash over the combatant pane.
    vignette: { ...StyleSheet.absoluteFillObject, backgroundColor: '#7a1410', zIndex: 30 },
    side: { flex: 1, paddingHorizontal: 4 },
    divider: { width: 1, backgroundColor: AXM.ash, marginHorizontal: 2 },
    headRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    portraitFrame: { borderWidth: 2, borderRadius: 4, padding: 1, backgroundColor: AXM.deepBg, overflow: 'hidden' },
    headText: { flex: 1 },
    name: { fontFamily: FONTS.gothic, fontSize: 15, color: AXM.parchment, letterSpacing: 0.4 },
    conviction: { fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 0.6, marginTop: 3 },
    hpWrap: { marginTop: 5 },
    hpTrack: { height: 9, backgroundColor: 'rgba(0,0,0,0.55)', borderWidth: 1, borderColor: AXM.ash, overflow: 'hidden' },
    hpFill: { height: '100%', position: 'absolute', left: 0, top: 0, bottom: 0 },
    // Dim trail chunk exposed while the fill drains.
    hpGhost: { height: '100%', position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.22)' },
    hpText: { fontFamily: FONTS.mono, fontSize: 11, marginTop: 2 },
    stanceRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 5, marginTop: 4, minHeight: 24 },
    stanceBadge: { fontFamily: FONTS.sans, fontSize: 12, letterSpacing: 1, borderWidth: 1, paddingHorizontal: 5, paddingVertical: 1, overflow: 'hidden' },
    youLabel: { fontFamily: FONTS.sans, fontSize: 10, letterSpacing: 1, color: AXM.ash },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4, minHeight: 24 },
    noEffects: { fontFamily: FONTS.serifItalic, fontStyle: 'italic', fontSize: 10, color: AXM.ash, marginTop: 6 },
    chip: { flexDirection: 'row', alignItems: 'center', gap: 2, borderWidth: 1, borderRadius: 3, paddingHorizontal: 4, paddingVertical: 2, backgroundColor: 'rgba(0,0,0,0.4)' },
    chipGlyph: { fontSize: 13 },
    chipNum: { fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 0.3 },
    chipDur: { fontFamily: FONTS.mono, fontSize: 9, color: AXM.bone },
    // Resolution feedback overlays.
    floatLayer: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', zIndex: 20 },
    floatNum: { position: 'absolute', top: 2, alignItems: 'center' },
    floatNumText: { fontFamily: FONTS.gothic, fontSize: 20, letterSpacing: 0.5, textShadowColor: '#000', textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 } },
    // Portrait-scoped hit flash (was a full-column wash that drowned the HP bar).
    portraitFlash: { ...StyleSheet.absoluteFillObject, backgroundColor: '#e2543b', zIndex: 5 },
    // One-frame contact slash glyph centred on the struck portrait.
    contactSlash: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', zIndex: 6 },
    contactSlashText: { fontFamily: FONTS.gothic, fontSize: 34, color: '#fff', textShadowColor: '#e2543b', textShadowRadius: 6 },
}));
