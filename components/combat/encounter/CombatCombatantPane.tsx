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
import { Pressable, Text, View } from 'react-native';
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
import { IntentIcon } from './IntentIcon';

/** A bump of resolved engine events the pane animates. `seq` rises on each new
 *  resolution so the effect fires exactly once per APPLY / END PHASE. */
export interface CombatFx { seq: number; events: CombatEvent[]; }

type Float = { id: number; text: string; color: string };

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

/** A single floating "-N" / "DENIED" that rises and fades, then self-removes. */
function FloatNum({ text, color, onDone }: { text: string; color: string; onDone: () => void }) {
    const styles = useStyles();
    const ty = useSharedValue(0);
    const op = useSharedValue(1);
    useEffect(() => {
        op.value = withDelay(120, withTiming(0, { duration: 760 }));
        ty.value = withTiming(-30, { duration: 880 }, (fin) => { if (fin) runOnJS(onDone)(); });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const st = useAnimatedStyle(() => ({ opacity: op.value, transform: [{ translateY: ty.value }] }));
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

    // Portrait feedback shared values: enemy wind-up nudge toward the divider; the
    // player's recoil jitter; the player hit-flash.
    const enemyShift = useSharedValue(0);
    const enemyScale = useSharedValue(1);
    const playerShift = useSharedValue(0);
    const playerFlash = useSharedValue(0);

    const pushEnemy = useCallback((text: string, color: string) => {
        const id = (idRef.current += 1);
        setEnemyFloats((p) => [...p, { id, text, color }]);
    }, []);
    const pushPlayer = useCallback((text: string, color: string) => {
        const id = (idRef.current += 1);
        setPlayerFloats((p) => [...p, { id, text, color }]);
    }, []);
    const dropEnemy = useCallback((id: number) => setEnemyFloats((p) => p.filter((f) => f.id !== id)), []);
    const dropPlayer = useCallback((id: number) => setPlayerFloats((p) => p.filter((f) => f.id !== id)), []);

    useEffect(() => {
        if (!fx || fx.seq === 0 || fx.seq === lastSeq.current) return;
        lastSeq.current = fx.seq;
        let playerDmg = 0;
        let enemyDmg = 0;
        let denied = false;
        let threatFired = false;
        const ticks: { side: 'enemy' | 'player'; amount: number }[] = [];
        for (const e of fx.events) {
            if (e.kind === 'damage-dealt') {
                if (e.target === 'self') playerDmg += e.amount; else enemyDmg += e.amount;
            } else if (e.kind === 'dot-tick') {
                ticks.push({ side: e.target === 'self' ? 'player' : 'enemy', amount: e.amount });
            } else if (e.kind === 'phase-resolved' && e.mark === 'clear') {
                denied = true;
            } else if (e.kind === 'threat-fired') {
                threatFired = true;
            }
        }
        // (a) the player took damage → enemy wind-up nudge (small, toward the divider)
        //     then player recoil + red flash + floating "-N" + Heavy haptic.
        if (playerDmg > 0) {
            enemyScale.value = withSequence(withTiming(1.08, { duration: 110 }), withTiming(1, { duration: 200 }));
            enemyShift.value = withSequence(withTiming(10, { duration: 110 }), withTiming(0, { duration: 220 }));
            playerShift.value = withSequence(withTiming(6, { duration: 70 }), withTiming(-4, { duration: 70 }), withTiming(0, { duration: 90 }));
            playerFlash.value = withSequence(withTiming(0.5, { duration: 90 }), withTiming(0, { duration: 260 }));
            pushPlayer(`-${playerDmg}`, '#e2543b');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => undefined);
            // (c) guard absorption — telegraphed damage exceeded what actually landed.
            const blocked = enemy.intent.damage - playerDmg;
            if (threatFired && blocked > 0) pushPlayer(`BLOCKED ${blocked}`, '#9aa0a6');
        } else if (denied || (threatFired && enemy.intent.damage > 0)) {
            // (b) the turn resolved with no damage to the player → DENIED flourish
            //     over the enemy (teaches "variety / guard denies the turn").
            pushEnemy('DENIED', '#d9b44a');
        }
        // (d) symmetric — the player's APPLY landed on the enemy → flinch + float.
        if (enemyDmg > 0) {
            enemyShift.value = withSequence(withTiming(-6, { duration: 70 }), withTiming(0, { duration: 160 }));
            pushEnemy(`-${enemyDmg}`, AXM.parchment);
        }
        // (e) DoT ticks float over the combatant they erode.
        for (const t of ticks) {
            if (t.side === 'player') pushPlayer(`-${t.amount}`, '#a86bdc');
            else pushEnemy(`-${t.amount}`, '#e08a3b');
        }
    }, [fx, enemy.intent.damage, AXM.parchment, enemyScale, enemyShift, playerShift, playerFlash, pushEnemy, pushPlayer]);

    const enemyAnim = useAnimatedStyle(() => ({ transform: [{ translateX: enemyShift.value }, { scale: enemyScale.value }] }));
    const playerAnim = useAnimatedStyle(() => ({ transform: [{ translateX: playerShift.value }] }));
    const flashAnim = useAnimatedStyle(() => ({ opacity: playerFlash.value }));

    return (
        <View style={styles.pane} testID="combat-combatant-pane">
            {/* ENEMY */}
            <View style={styles.side}>
                <View style={styles.floatLayer} pointerEvents="none">
                    {enemyFloats.map((f) => <FloatNum key={f.id} text={f.text} color={f.color} onDone={() => dropEnemy(f.id)} />)}
                </View>
                <View style={styles.headRow}>
                    <Animated.View style={[styles.portraitFrame, { borderColor: enemy.stanceColor }, enemyAnim]}>
                        <EnemyPortrait enemyArtKey={enemy.artKey} isBoss={enemy.isBoss} width={52} height={62} label={`${enemy.name} portrait`} />
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
                <Animated.View style={[styles.hitFlash, flashAnim]} pointerEvents="none" />
                <View style={styles.floatLayer} pointerEvents="none">
                    {playerFloats.map((f) => <FloatNum key={f.id} text={f.text} color={f.color} onDone={() => dropPlayer(f.id)} />)}
                </View>
                <View style={styles.headRow}>
                    <Animated.View style={[styles.portraitFrame, { borderColor: AXM.sulfur }, playerAnim]}>
                        <PlayerPortrait width={52} height={62} />
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
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    pane: { flexDirection: 'row', backgroundColor: 'rgba(8,6,5,0.9)', borderBottomWidth: 1, borderBottomColor: AXM.ash, paddingHorizontal: 8, paddingVertical: 7, minHeight: 146 },
    side: { flex: 1, paddingHorizontal: 4 },
    divider: { width: 1, backgroundColor: AXM.ash, marginHorizontal: 2 },
    headRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    portraitFrame: { borderWidth: 2, borderRadius: 4, padding: 1, backgroundColor: AXM.deepBg },
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
    hitFlash: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#e2543b', zIndex: 15 },
}));
