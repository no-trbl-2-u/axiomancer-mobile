/**
 * Spec 25 — Hazard-Pattern Combat screen.
 *
 * A self-contained card-and-dice combat surface (the engine `CombatEncounterState`
 * is pure, so the screen holds it in local state and dispatches engine
 * transitions, mirroring the Hazard minigame's phase-orchestration role). The
 * engine owns every rule; this screen renders the board, the mercy modal, and
 * the post-combat attribution summary, then returns to the prior screen.
 *
 * Determinism: the encounter seed reads `globalThis.__AXM_COMBAT_SEED__` when
 * present (e2e / screenshot smoke), else a fixed dev seed.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    initializeCombatEncounter, rollEncounterDice, playCombatCard,
    resolveThreatPhase, selectEncounterMercyChoice, buildCombatSummary,
    type CombatEncounterState,
} from 'axiomancer-mechanics';

import { ScreenBg } from '@/components/ScreenBg';
import { CombatEncounterBoard } from '@/components/combat/encounter/CombatEncounterBoard';
import { CombatSummaryModal } from '@/components/combat/encounter/CombatSummaryModal';
import { useGameState } from '@/state/GameStoreProvider';
import { createMockEncounterEnemy } from '@/state/mocks/combat.mock';
import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';

function readSeed(explicit?: string): number {
    const g = (globalThis as { __AXM_COMBAT_SEED__?: number }).__AXM_COMBAT_SEED__;
    if (typeof g === 'number') return g;
    const n = explicit ? Number(explicit) : NaN;
    return Number.isFinite(n) ? n : 12025;
}

/**
 * Demo deck for the dev/standalone launch: a representative spread of verb
 * classes (DoT, control, direct-damage, befriend) across stances so the board
 * shows real status-effect cards. Merged into the player's known skills when
 * they have none yet (the dev affordance has no real encounter context). Real
 * encounter wiring would pass the live player + enemy instead.
 */
const DEMO_SKILLS = ['slippery-slope', 'eternal-regress', 'achilles-gambit', 'befriend'];

function withDemoDeck<T extends { knownSkills?: string[]; baseStats?: { heart: number; body: number; mind: number }; health?: number; maxHealth?: number }>(player: T): T {
    const known = player.knownSkills ?? [];
    if (known.length >= 3) return player;
    // Dev/standalone demo: a capable strategist so status effects land and the
    // fight is winnable (real encounter wiring would pass the live player).
    const merged = Array.from(new Set([...known, ...DEMO_SKILLS]));
    return {
        ...player,
        knownSkills: merged,
        baseStats: { heart: 12, body: 12, mind: 12 },
        health: 160,
        maxHealth: 160,
    };
}

export default function CombatEncounterScreen() {
    const styles = useStyles();
    const AXM = usePalette();
    const router = useRouter();
    const params = useLocalSearchParams<{ seed?: string }>();
    const player = useGameState((s) => s.player);

    const [state, setState] = useState<CombatEncounterState | null>(null);

    // Lazily initialise once the player is available.
    const initial = useMemo(() => {
        if (!player) return null;
        const enemy = createMockEncounterEnemy();
        const seed = readSeed(params.seed);
        const init = initializeCombatEncounter(withDemoDeck(player), enemy, undefined, seed);
        return rollEncounterDice(init).state;
    }, [player, params.seed]);

    const live = state ?? initial;

    const onPlay = useCallback((uid: string, useBottom: boolean) => {
        setState((prev) => {
            const s = prev ?? initial;
            if (!s || s.phase !== 'phase-play') return s;
            return playCombatCard(s, { uid }, useBottom).state;
        });
    }, [initial]);

    const onEndPhase = useCallback(() => {
        setState((prev) => {
            const s = prev ?? initial;
            if (!s || s.phase !== 'phase-play') return s;
            return resolveThreatPhase(s).state;
        });
    }, [initial]);

    const onMercy = useCallback((choice: 'spare' | 'exploit') => {
        setState((prev) => {
            const s = prev ?? initial;
            if (!s) return s;
            return selectEncounterMercyChoice(s, choice).state;
        });
    }, [initial]);

    const onClose = useCallback(() => {
        if (router.canGoBack()) router.back();
    }, [router]);

    if (!live) {
        return <ScreenBg><View style={styles.root} testID="combat-encounter-empty" /></ScreenBg>;
    }

    const summary = live.finalOutcome ? buildCombatSummary(live) : null;
    const mercy = live.phase === 'mercy-choice' && !live.finalOutcome;

    return (
        <ScreenBg>
            <View style={styles.root}>
                <CombatEncounterBoard state={live} onPlay={onPlay} onEndPhase={onEndPhase} />

                {mercy && (
                    <View style={styles.backdrop} testID="combat-mercy">
                        <View style={[styles.mercyPanel, { borderColor: '#a86bdc' }]}>
                            <Text style={styles.mercyTitle}>{live.enemy.name} is overwhelmed.</Text>
                            <Text style={styles.mercySub}>The will to fight has drained away.</Text>
                            <View style={styles.mercyBtns}>
                                <Pressable onPress={() => onMercy('spare')} testID="combat-mercy-spare" accessibilityRole="button" accessibilityLabel="Spare" style={[styles.mercyBtn, { borderColor: '#5bbf6a' }]}>
                                    <Text style={[styles.mercyBtnText, { color: '#5bbf6a' }]}>SPARE</Text>
                                </Pressable>
                                <Pressable onPress={() => onMercy('exploit')} testID="combat-mercy-exploit" accessibilityRole="button" accessibilityLabel="Exploit" style={[styles.mercyBtn, { borderColor: AXM.blood }]}>
                                    <Text style={[styles.mercyBtnText, { color: AXM.blood }]}>EXPLOIT</Text>
                                </Pressable>
                            </View>
                        </View>
                    </View>
                )}

                {summary && <CombatSummaryModal summary={summary} onClose={onClose} />}
            </View>
        </ScreenBg>
    );
}

const useStyles = makeStyles((AXM) => ({
    root: { flex: 1 },
    backdrop: { ...({ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const), backgroundColor: 'rgba(0,0,0,0.8)', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 40 },
    mercyPanel: { width: '100%', maxWidth: 380, borderWidth: 2, backgroundColor: AXM.panelBg, padding: 18, alignItems: 'center' },
    mercyTitle: { fontFamily: FONTS.gothic, fontSize: 18, color: AXM.parchment, textAlign: 'center' },
    mercySub: { fontFamily: FONTS.serifItalic, fontStyle: 'italic', fontSize: 13, color: AXM.bone, textAlign: 'center', marginTop: 4, marginBottom: 14 },
    mercyBtns: { flexDirection: 'row', gap: 12 },
    mercyBtn: { borderWidth: 2, paddingHorizontal: 22, paddingVertical: 9 },
    mercyBtnText: { fontFamily: FONTS.gothic, fontSize: 16, letterSpacing: 1 },
}));
