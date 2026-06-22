/**
 * Spec 26 / 26b — Combat board presenter.
 *
 * Pure function `buildCombatViewModel(state)`: maps the engine
 * `CombatEncounterState` into a single render-ready `CombatViewModel`. No store
 * writes, no rules — the engine owns truth, this shapes it for the board
 * (portraits, visible enemy HP, intent telegraph, the hidden-stance read, the
 * 2-die draft, Conviction + Signature Skills, and the two Pressure Tracks).
 *
 * The redesign (Spec 26b): the enemy STANCE is hidden until revealed, so this
 * presenter only surfaces a stance colour/label once `isPhaseStanceRevealed`;
 * otherwise it shows the thematic tell and a "?".
 */

import {
    handCards as engineHandCards, getCard,
    getDraftedDie, isPhaseStanceRevealed, cardReadPreview,
    revealedCurrentStance, resolveRead, getSignatureSkill,
    lookupEffect,
    type CombatEncounterState, type CombatCard, type CombatManaDie,
    type CombatThreatPhase, type CombatIntentType, type CombatReadResult,
    type CombatSummary, type SignatureSkill, type Stance,
} from 'axiomancer-mechanics';
import { effectGlyph, type StatusGlyph } from '@/components/combat/statusGlyphs';
import { resolveEnemyArchetype } from '@/state/presenters/enemy-art';

// ── Stance palette (Heart/Body/Mind/Wild/X) ──────────────────────────────────

export const STANCE_COLORS: Record<string, string> = {
    // Body=RED, Mind=BLUE, Heart=PURPLE, Wild=GOLD (owner-specified dice palette).
    heart: '#9a5fd0', body: '#d6543f', mind: '#4f7fd6', wild: '#d9b44a', x: '#5a5a5a',
};
const DIE_GLYPHS: Record<string, string> = { heart: '♥', body: '⚡', mind: '★', wild: '✦', x: '✕' };
const STANCE_LABELS: Record<string, string> = { heart: 'HEART', body: 'BODY', mind: 'MIND', wild: 'WILD', x: 'X' };

// ── Intent vocabulary (Spec 26 §2.4) ─────────────────────────────────────────

export const INTENT_ICONS: Record<CombatIntentType, { icon: string; label: string; color: string }> = {
    damage: { icon: '⚔', label: 'ATTACKS', color: '#e2543b' },
    debuff: { icon: '☠', label: 'WEAKENS', color: '#a86bdc' },
    buff: { icon: '✦', label: 'RECOVERS', color: '#5bbf6a' },
    block: { icon: '🛡', label: 'DEFENDS', color: '#6b8eb0' },
    pass: { icon: '○', label: 'WAITS', color: '#8a8273' },
    combo: { icon: '⚡', label: 'SURGES', color: '#d9b44a' },
};

// ── View-model types ─────────────────────────────────────────────────────────

export interface CombatEffectChipVM {
    effectId: string; glyph: StatusGlyph; intensity: number; duration: number; isMax: boolean;
}
export interface CombatIntentVM {
    type: CombatIntentType; icon: string; label: string; color: string; description: string;
    /** Total HP damage this phase's threat action deals if NOT cleared (0 if none). */
    damage: number;
    /** True if the threat action also applies a debuff to the player. */
    debuffs: boolean;
    next: { type: CombatIntentType; icon: string; label: string } | null;
}
export interface CombatEnemyPaneVM {
    name: string; artKey: string; isBoss: boolean;
    hp: number; maxHp: number; hpPct: number;
    effects: CombatEffectChipVM[];
    intent: CombatIntentVM;
    /** Revealed stance ('heart'|'body'|'mind') or null while hidden. */
    revealedStance: string | null;
    stanceColor: string;      // accent (revealed stance colour, else neutral)
    stanceLabel: string;      // 'HEART' / '?' …
    stanceHint: string;       // the thematic tell (always shown)
}
export interface CombatPlayerPaneVM {
    name: string; hp: number; maxHp: number; hpPct: number; guard: number; effects: CombatEffectChipVM[];
}
export interface CombatDieVM {
    id: string; color: string; colorHex: string; glyph: string; stanceLabel: string;
    drafted: boolean; spent: boolean; isX: boolean;
    /** Read vs the (revealed) enemy stance: advantage/neutral/disadvantage/none/null(hidden). */
    readPip: CombatReadResult | null;
}
export interface CombatCardVM {
    uid: string; cardId: string; name: string; stance: string; stanceColor: string;
    verbClass: string; effectKind: 'dot' | 'control' | 'none'; rarity?: 'gold'; tier: 1 | 2 | 3;
    category: 'fallacy' | 'paradox' | null;
    topActionText: string; bottomActionText: string; bottomDamagePreview: number;
    /** Read tier if powered with the current drafted die (null until a die is drafted). */
    read: CombatReadResult | null; colorMatch: boolean;
}
export interface CombatSignatureVM {
    id: string; name: string; description: string; cost: number; affordable: boolean; icon: string;
}
export interface CombatReadVM {
    active: boolean; result: CombatReadResult; dieStance: string; enemyStance: string | null;
    text: string;
}
export interface CombatViewModel {
    phase: CombatEncounterState['phase'];
    enemy: CombatEnemyPaneVM;
    player: CombatPlayerPaneVM;
    dice: CombatDieVM[];
    drafted: boolean;           // a USABLE drafted die exists (powers a card)
    hasDraft: boolean;          // a die has been drafted this turn (may be spent)
    needsDraft: boolean;        // dice present, none drafted yet
    diceRolled: boolean;        // a turn pool exists
    read: CombatReadVM;
    conviction: number;
    signatures: CombatSignatureVM[];
    hand: CombatCardVM[];
    ledger: ('clear' | 'overwhelmed' | 'pending')[];
    phaseBadge: string;
    roundLabel: string;
    turnLabel: string;
    deckCount: number;
    discardCount: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function currentPhase(state: CombatEncounterState): CombatThreatPhase | undefined {
    return state.threatPhases[Math.min(state.currentPhaseIndex, state.threatPhases.length - 1)];
}

function chips(effects: { effectId: string; intensity: number; remainingDuration: number }[]): CombatEffectChipVM[] {
    return effects.map(ae => {
        const def = lookupEffect(ae.effectId) ?? { id: ae.effectId };
        return {
            effectId: ae.effectId, intensity: ae.intensity, duration: ae.remainingDuration,
            isMax: ae.intensity >= 10,
            glyph: effectGlyph(def as Parameters<typeof effectGlyph>[0]),
        };
    });
}

function intentVM(state: CombatEncounterState): CombatIntentVM {
    const cur = currentPhase(state);
    const type = (cur?.intentType ?? 'pass') as CombatIntentType;
    const meta = INTENT_ICONS[type];
    const nextPhase = state.threatPhases[state.currentPhaseIndex + 1];
    const next = nextPhase && !cur?.isFinalPhase
        ? (() => { const t = (nextPhase.intentType ?? 'pass') as CombatIntentType; const m = INTENT_ICONS[t]; return { type: t, icon: m.icon, label: m.label }; })()
        : null;
    const effects = cur?.threatAction.effects ?? [];
    const damage = effects.reduce((s, e) => s + (e.damage ?? 0), 0);
    const debuffs = effects.some((e) => !!e.effectId);
    return {
        type, icon: meta.icon, label: cur?.intentLabel ?? meta.label, color: meta.color,
        description: cur?.threatAction.description ?? '', damage, debuffs, next,
    };
}

function enemyPane(state: CombatEncounterState): CombatEnemyPaneVM {
    const e = state.enemy;
    const cur = currentPhase(state);
    const revealed = isPhaseStanceRevealed(state, Math.min(state.currentPhaseIndex, state.threatPhases.length - 1));
    const stance = revealed ? cur?.enemyStance ?? null : null;
    const isBoss = (e.tags ?? []).includes('boss') || /tyrant|boss|sovereign/.test(e.id);
    return {
        name: e.name,
        artKey: e.id,
        isBoss,
        hp: Math.max(0, e.health), maxHp: e.maxHealth,
        hpPct: e.maxHealth > 0 ? Math.max(0, e.health) / e.maxHealth : 0,
        effects: chips(e.effects),
        intent: intentVM(state),
        revealedStance: stance,
        stanceColor: stance ? STANCE_COLORS[stance] : '#6b6257',
        stanceLabel: stance ? STANCE_LABELS[stance] : '?',
        stanceHint: cur?.stanceHint ?? (e as { stanceHint?: string }).stanceHint ?? '',
    };
}

function playerPane(state: CombatEncounterState): CombatPlayerPaneVM {
    const p = state.player;
    return {
        name: p.name ?? 'You', hp: Math.max(0, p.health), maxHp: p.maxHealth,
        hpPct: p.maxHealth > 0 ? Math.max(0, p.health) / p.maxHealth : 0,
        guard: state.guard ?? 0,
        effects: chips(p.effects),
    };
}

function diceVM(state: CombatEncounterState): CombatDieVM[] {
    const drafted = getDraftedDie(state);
    // Per-die read pip — only once the phase stance is known (revealed/scouted).
    const stance = revealedCurrentStance(state) as Stance | null;
    return state.dice.map((d: CombatManaDie) => ({
        id: d.id, color: d.color, colorHex: STANCE_COLORS[d.color] ?? '#888',
        glyph: DIE_GLYPHS[d.color] ?? '?', stanceLabel: STANCE_LABELS[d.color] ?? '?',
        drafted: drafted?.id === d.id, spent: d.state === 'spent', isX: d.color === 'x',
        readPip: stance ? resolveRead(d.color, stance) : null,
    }));
}

function handVM(state: CombatEncounterState): CombatCardVM[] {
    const drafted = getDraftedDie(state);
    return engineHandCards(state)
        // Retreat is no longer an in-combat card — fleeing is offered at the
        // encounter prelude (ENGAGE / FLEE), not from the hand.
        .filter(({ card }: { card: CombatCard }) => card.id !== 'card-retreat' && card.verbClass !== 'retreat')
        .map(({ uid, card }: { uid: string; card: CombatCard }) => {
        const preview = drafted ? cardReadPreview(state, card) : null;
        return {
            uid, cardId: card.id, name: card.name, stance: card.stance,
            stanceColor: STANCE_COLORS[card.stance] ?? '#888',
            verbClass: card.verbClass, effectKind: card.effectKind, rarity: card.rarity, tier: card.tier, category: card.category,
            topActionText: card.topActionText, bottomActionText: card.bottomActionText,
            bottomDamagePreview: card.bottomDamagePreview,
            read: preview?.read ?? null, colorMatch: preview?.colorMatch ?? false,
        };
    });
}

const SIG_ICON: Record<string, string> = {
    scout: '👁', reroll: '🎲', sustain: '✚', control: '⛓', dot: '☠', mercy: '🕊', strike: '⚔', draw: '🎴',
};

function signaturesVM(state: CombatEncounterState): CombatSignatureVM[] {
    // The player's per-archetype kit (Spec 26b §B), resolved on the encounter.
    return state.signatures
        .map(id => getSignatureSkill(id))
        .filter((s): s is SignatureSkill => !!s)
        .map((s: SignatureSkill) => ({
            id: s.id, name: s.name, description: s.description, cost: s.cost,
            affordable: state.conviction >= s.cost,
            icon: SIG_ICON[s.kind] ?? '◆',
        }));
}

const READ_TEXT: Record<CombatReadResult, string> = {
    advantage: 'ADVANTAGE — you read them right (+1 ◆, boosted)',
    neutral: 'NEUTRAL — an even contest',
    disadvantage: 'DISADVANTAGE — they had your number (halved)',
    none: 'WILD — no stance contest',
};

function readVM(state: CombatEncounterState): CombatReadVM {
    const drafted = getDraftedDie(state);
    const cur = currentPhase(state);
    const revealed = isPhaseStanceRevealed(state, Math.min(state.currentPhaseIndex, state.threatPhases.length - 1));
    return {
        active: !!drafted,
        result: state.lastRead,
        dieStance: drafted?.color ?? '',
        enemyStance: revealed ? cur?.enemyStance ?? null : null,
        text: READ_TEXT[state.lastRead] ?? '',
    };
}

// ── Deckbuilder reward offers (Spec 26b §C) ──────────────────────────────────

export interface CombatRewardOfferVM {
    cardId: string; name: string; stance: string; stanceColor: string;
    effectKind: 'dot' | 'control' | 'none'; rarity?: 'gold'; verbClass: string; tier: number; preview: number; text: string;
}

/** Maps reward card ids (from rollCombatCardRewards) into display VMs. */
export function rewardOfferVMs(ids: string[]): CombatRewardOfferVM[] {
    const out: CombatRewardOfferVM[] = [];
    for (const id of ids) {
        const c = getCard(id);
        if (!c) continue;
        out.push({
            cardId: id, name: c.name, stance: c.stance, stanceColor: STANCE_COLORS[c.stance] ?? '#888',
            effectKind: c.effectKind, rarity: c.rarity, verbClass: c.verbClass, tier: c.tier, preview: c.bottomDamagePreview,
            text: c.bottomActionText,
        });
    }
    return out;
}

// ── Entry point ──────────────────────────────────────────────────────────────

export function buildCombatViewModel(state: CombatEncounterState): CombatViewModel {
    const total = state.threatPhases.length;
    const idx = Math.min(state.currentPhaseIndex, total - 1);
    const draftedDie = getDraftedDie(state);
    const usableDraft = !!draftedDie && draftedDie.state === 'available' && draftedDie.color !== 'x';
    return {
        phase: state.phase,
        enemy: enemyPane(state),
        player: playerPane(state),
        dice: diceVM(state),
        drafted: usableDraft,
        hasDraft: !!state.draftedDieId,
        needsDraft: state.dice.length > 0 && !state.draftedDieId,
        diceRolled: state.dice.length > 0,
        read: readVM(state),
        conviction: state.conviction,
        signatures: signaturesVM(state),
        hand: handVM(state),
        ledger: state.threatMarks,
        phaseBadge: `PHASE ${idx + 1}/${total}`,
        roundLabel: `ROUND ${state.round}`,
        turnLabel: `TURN ${state.turn}`,
        deckCount: state.drawPile.length,
        discardCount: state.discard.length,
    };
}
