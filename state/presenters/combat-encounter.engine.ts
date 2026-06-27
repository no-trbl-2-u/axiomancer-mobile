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
import { keywordForEffect, keywordForVerb, keywordGloss } from '@/state/combat/keywords';
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
    /** General keyword definition for the on-board status tooltip (null if unmapped). */
    gloss: string | null;
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
    /** The keyword for the primary status effect this card applies (e.g. "Bleed"), or null. */
    effectName: string | null;
    /** One-liner for the FREE (no-die) action — plain mechanical language, zero thematic. */
    freeLine: string;
    /** One-liner for the POWERED (with-die) action — plain mechanical language, zero thematic. */
    poweredLine: string;
    /** Mechanical description of the primary effect from its payload (HP/turn, stuns, etc.). Null for utility/self cards. */
    mechanicalDesc: string | null;
    /** Keyword glossary entries for this card (status keyword + verb-class keyword like GUARD). */
    keywords: { name: string; def: string }[];
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
        const glyph = effectGlyph(def as Parameters<typeof effectGlyph>[0]);
        const kw = keywordForEffect(ae.effectId);
        return {
            effectId: ae.effectId, intensity: ae.intensity, duration: ae.remainingDuration,
            isMax: ae.intensity >= 10,
            // Show the keyword on the chip's label (a11y/tooltip) instead of the thematic name.
            glyph: kw ? { ...glyph, label: kw } : glyph,
            gloss: keywordGloss(kw),
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

/** Derive a plain-English mechanical description from the effect's payload. */
function buildMechanicalDesc(effectId: string | null): string | null {
    if (!effectId) return null;
    const eff = lookupEffect(effectId);
    if (!eff) return null;
    const p = eff.payload as {
        damageOverTime?: { damagePerRound: number };
        actionRestriction?: { skipTurn?: boolean; forcedStance?: string; blockedStances?: string[] };
        statModifiers?: { stat: string; value: number }[];
        rollModifier?: number;
        defenseModifier?: number;
    };
    const parts: string[] = [];
    if (p.damageOverTime) {
        parts.push(`Deals ${p.damageOverTime.damagePerRound} HP per turn for ${eff.duration} turns per stack`);
    }
    if (p.actionRestriction) {
        const r = p.actionRestriction;
        if (r.skipTurn) parts.push('Enemy loses their action for the phase (1 phase per stack)');
        if (r.forcedStance) parts.push(`Forces enemy into ${r.forcedStance} stance`);
        if (r.blockedStances?.length) parts.push(`Blocks enemy ${r.blockedStances.join('/')} stance`);
    }
    if (p.statModifiers?.length) {
        const mods = p.statModifiers.map(m => `${m.stat} ${m.value > 0 ? '+' : ''}${m.value}`).join(', ');
        parts.push(`Enemy stats: ${mods}`);
    }
    if ((p.rollModifier ?? 0) < 0) parts.push(`Enemy roll modifier: ${p.rollModifier}`);
    if ((p.defenseModifier ?? 0) < 0) parts.push(`Enemy defense: ${p.defenseModifier}`);
    if (eff.stacking === 'intensity') parts.push('Stacks up to 10×');
    return parts.length ? parts.join('. ') + '.' : null;
}

/** Generate the FREE and POWERED one-liners for the card detail and face split. */
function buildActionLines(card: CombatCard): { freeLine: string; poweredLine: string } {
    const stanceLabel = STANCE_LABELS[card.stance] ?? card.stance.toUpperCase();
    const kw = keywordForEffect(card.primaryEffectId)
        ?? (card.primaryEffectId ? lookupEffect(card.primaryEffectId)?.name ?? null : null);
    const preview = card.bottomDamagePreview;
    switch (card.verbClass) {
        case 'direct-dot':
            return {
                freeLine: `Apply ${kw ?? 'a DoT'} ×1 (weak) — ticks HP each turn — no die needed`,
                poweredLine: `Apply ${kw ?? 'a DoT'} ×full (~${preview} total impact) — needs 1 die — any colour (${stanceLabel} = bonus)`,
            };
        case 'direct-control':
        case 'stat-debuff':
            return {
                freeLine: `Apply ${kw ?? 'a debuff'} ×1 (weak) — hinders the enemy — no die needed`,
                poweredLine: `Apply ${kw ?? 'a debuff'} ×full (~${preview} control impact) — needs 1 die — any colour (${stanceLabel} = bonus)`,
            };
        case 'direct-damage':
            return {
                freeLine: `Deal a small amount of direct HP damage to the enemy — no die needed`,
                poweredLine: `Deal ~${preview} direct HP damage to the enemy — needs 1 die — any colour (${stanceLabel} = bonus)`,
            };
        case 'buff-self':
            return {
                freeLine: `Apply ${kw ?? 'a buff'} (weak) to yourself — no die needed`,
                poweredLine: `Apply ${kw ?? 'a buff'} (full) to yourself — needs 1 die — any colour (${stanceLabel} = bonus)`,
            };
        case 'defend':
            return {
                freeLine: `Gain GUARD (weak) — absorbs the enemy's next attack — no die needed`,
                poweredLine: `Gain GUARD — fully absorbs the enemy's next attack — needs 1 die — any colour (${stanceLabel} = bonus)`,
            };
        case 'befriend':
            return {
                freeLine: `Attempt mercy — weak chance if enemy is near defeat — no die needed`,
                poweredLine: `If enemy HP is low: end combat peacefully (befriend them) — needs 1 die — any colour (${stanceLabel} = bonus)`,
            };
        default:
            return { freeLine: card.topActionText, poweredLine: card.bottomActionText };
    }
}

/** Glossary entries for a card's inspect overlay — its status keyword and any
 *  verb-class keyword (e.g. a defend card grants GUARD). Deduped, uppercased. */
function cardKeywords(card: CombatCard): { name: string; def: string }[] {
    const out: { name: string; def: string }[] = [];
    const seen = new Set<string>();
    const push = (kw: string | null) => {
        if (!kw || seen.has(kw)) return;
        seen.add(kw);
        out.push({ name: kw.toUpperCase(), def: keywordGloss(kw) ?? '' });
    };
    push(keywordForEffect(card.primaryEffectId));
    push(keywordForVerb(card.verbClass));
    return out;
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
            effectName: keywordForEffect(card.primaryEffectId)
                ?? (card.primaryEffectId ? lookupEffect(card.primaryEffectId)?.name ?? null : null),
            ...buildActionLines(card),
            mechanicalDesc: buildMechanicalDesc(card.primaryEffectId),
            keywords: cardKeywords(card),
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
