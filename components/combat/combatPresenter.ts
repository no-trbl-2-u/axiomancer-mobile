/**
 * Spec 25 §7 — Hazard-Pattern Combat presenter.
 *
 * Pure adapters from the engine `CombatEncounterState` to render-ready view
 * models. Mobile renders these; it never computes combat rules (ADR-0001/0003).
 * Every number here comes from the engine — this module only shapes it for the
 * Pressure Tracks, threat timeline, hand, dice board, and effect panel.
 */

import {
    handCards as engineHandCards,
    cardDieCostPreview,
    buildCombatSummary,
    type CombatEncounterState,
    type CombatCard,
    type CombatManaDie,
    type CombatThreatPhase,
    type CombatSummary,
} from 'axiomancer-mechanics';
import { effectGlyph, type StatusGlyph } from './statusGlyphs';

/** Heart / Body / Mind / Wild / X display palette for dice + card stance. */
export const STANCE_COLORS: Record<string, string> = {
    heart: '#d6543f',
    body: '#4f7fd6',
    mind: '#9a5fd0',
    wild: '#d9b44a',
    x: '#5a5a5a',
};

export interface PressureTrackView {
    key: 'dot' | 'control';
    label: string;
    value: number;
    threshold: number;
    /** 0..1 fill toward the global victory/mercy threshold. */
    pct: number;
    /** Per-phase clear target as a 0..1 tick position on the bar. */
    phaseTickPct: number;
    /** True once the global threshold is crossed. */
    reached: boolean;
    color: string;
}

export function pressureView(state: CombatEncounterState): PressureTrackView[] {
    const t = state.pressureTracks;
    const phase = currentPhase(state);
    const mk = (key: 'dot' | 'control', label: string, color: string, phaseReq: number): PressureTrackView => {
        const value = t[key];
        const threshold = key === 'dot' ? t.dotThreshold : t.controlThreshold;
        return {
            key, label, value, threshold,
            pct: threshold > 0 ? Math.min(1, value / threshold) : 0,
            phaseTickPct: threshold > 0 ? Math.min(1, phaseReq / threshold) : 0,
            reached: value >= threshold,
            color,
        };
    };
    return [
        mk('dot', 'DoT Erosion', '#e2543b', phase?.dotPressureRequired ?? 0),
        mk('control', 'Control Saturation', '#a86bdc', phase?.controlPressureRequired ?? 0),
    ];
}

export interface ThreatPhaseView {
    index: number;
    stance: string;
    stanceColor: string;
    dotRequired: number;
    controlRequired: number;
    threatText: string;
    mark: 'clear' | 'overwhelmed' | 'pending';
    isCurrent: boolean;
    isFuture: boolean;
}

export function threatTimelineView(state: CombatEncounterState): ThreatPhaseView[] {
    return state.threatPhases.map((p, i) => ({
        index: p.index,
        stance: p.enemyStance,
        stanceColor: STANCE_COLORS[p.enemyStance] ?? '#888',
        dotRequired: p.dotPressureRequired,
        controlRequired: p.controlPressureRequired,
        threatText: p.threatAction.description,
        mark: state.threatMarks[i] ?? 'pending',
        isCurrent: i === state.currentPhaseIndex,
        isFuture: i > state.currentPhaseIndex,
    }));
}

export interface HandCardView {
    uid: string;
    cardId: string;
    name: string;
    stance: string;
    stanceColor: string;
    verbClass: string;
    track: 'dot' | 'control' | 'none';
    tier: 1 | 2 | 3;
    category: 'fallacy' | 'paradox' | null;
    topActionText: string;
    bottomActionText: string;
    bottomPressurePreview: number;
    /** RPS indicator for the current phase (§7.3). */
    advantage: 'advantage' | 'neutral' | 'disadvantage';
    dieCost: number;
    /** 'cheap' | 'normal' | 'costly' — UI border keying. */
    costBand: 'cheap' | 'normal' | 'costly';
}

export function handView(state: CombatEncounterState): HandCardView[] {
    return engineHandCards(state).map(({ uid, card }: { uid: string; card: CombatCard }) => {
        const cost = cardDieCostPreview(state, card);
        const costBand = cost.advantage === 'advantage' ? 'cheap' : cost.advantage === 'disadvantage' ? 'costly' : 'normal';
        return {
            uid,
            cardId: card.id,
            name: card.name,
            stance: card.stance,
            stanceColor: STANCE_COLORS[card.stance] ?? '#888',
            verbClass: card.verbClass,
            track: card.track,
            tier: card.tier,
            category: card.category,
            topActionText: card.topActionText,
            bottomActionText: card.bottomActionText,
            bottomPressurePreview: card.bottomPressurePreview,
            advantage: cost.advantage,
            dieCost: cost.cost,
            costBand,
        };
    });
}

export interface DieView {
    id: string;
    color: string;
    colorHex: string;
    glyph: string;
    state: string;
    available: boolean;
    temporary: boolean;
}

const DIE_GLYPHS: Record<string, string> = { heart: '♥', body: '⚡', mind: '★', wild: '✦', x: '✕' };

export function diceView(state: CombatEncounterState): DieView[] {
    return state.dice.map((d: CombatManaDie) => ({
        id: d.id,
        color: d.color,
        colorHex: STANCE_COLORS[d.color] ?? '#888',
        glyph: DIE_GLYPHS[d.color] ?? '?',
        state: d.state,
        available: d.state === 'available',
        temporary: d.temporary,
    }));
}

export interface ActiveEffectView {
    effectId: string;
    intensity: number;
    duration: number;
    isMax: boolean;
    glyph: StatusGlyph;
}

/** Active effects on a combatant, with glyphs (§7.6). `lookupEffect` resolves
 *  the effect definition (passed in from the engine barrel by the caller). */
export function effectsView(
    effects: { effectId: string; intensity: number; remainingDuration: number }[],
    lookupEffect: (id: string) => { id: string; name?: string; type?: 'buff' | 'debuff'; category?: string; payload?: unknown } | undefined,
): ActiveEffectView[] {
    return effects.map(ae => {
        const def = lookupEffect(ae.effectId) ?? { id: ae.effectId };
        return {
            effectId: ae.effectId,
            intensity: ae.intensity,
            duration: ae.remainingDuration,
            isMax: ae.intensity >= 10,
            glyph: effectGlyph(def as Parameters<typeof effectGlyph>[0]),
        };
    });
}

export function summaryView(state: CombatEncounterState): CombatSummary {
    return buildCombatSummary(state);
}

function currentPhase(state: CombatEncounterState): CombatThreatPhase | undefined {
    return state.threatPhases[Math.min(state.currentPhaseIndex, state.threatPhases.length - 1)];
}
