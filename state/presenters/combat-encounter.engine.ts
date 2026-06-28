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
    handCards as engineHandCards, getCard, getSkillById,
    getDraftedDie, isPhaseStanceRevealed, cardReadPreview,
    revealedCurrentStance, resolveRead, getSignatureSkill,
    lookupEffect, READ_DAMAGE_MULT, COLOR_MATCH_DAMAGE_BONUS,
    type CombatEncounterState, type CombatCard, type CombatManaDie,
    type CombatThreatPhase, type CombatIntentType, type CombatReadResult,
    type CombatSummary, type SignatureSkill, type Stance,
    type Skill, type SkillCombatEffects,
} from 'axiomancer-mechanics';
import { effectGlyph, GLYPH_COLORS, type StatusGlyph } from '@/components/combat/statusGlyphs';
import { keywordForEffect, keywordForVerb, keywordGloss } from '@/state/combat/keywords';
import { resolveEnemyArchetype } from '@/state/presenters/enemy-art';

// ── Stance palette (Heart/Body/Mind/Wild/X) ──────────────────────────────────

export const STANCE_COLORS: Record<string, string> = {
    // Body=RED, Mind=BLUE, Heart=PURPLE, Wild=GOLD (owner-specified dice palette).
    heart: '#9a5fd0', body: '#d6543f', mind: '#4f7fd6', wild: '#d9b44a', x: '#5a5a5a',
};
const DIE_GLYPHS: Record<string, string> = { heart: '♥', body: '⚡', mind: '★', wild: '✦', x: '✕' };
const STANCE_LABELS: Record<string, string> = { heart: 'HEART', body: 'BODY', mind: 'MIND', wild: 'WILD', x: 'X' };

// Mirror of the engine's TOP_ACTION_CHIP — the HP a FREE (no-die) action chips.
// Not on the public barrel, so duplicated here (kept in sync by hand).
const FREE_CHIP_HP = 2;
// Verb-class card colours (these map to verbs, not Effects, so they aren't in GLYPH_COLORS).
const GUARD_COLOR = '#9aa0a6';
const STRIKE_COLOR = '#c2a14e';
const BEFRIEND_COLOR = '#5bbf6a';
const INERT_COLOR = '#6b6257';

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
export type CombatCardKind = 'dot' | 'stun' | 'regen' | 'guard' | 'strike' | 'weaken' | 'inert' | 'befriend';

/** Render-ready, HONEST card FACE. Every number is a real unit derived from the
 *  skill's AUTHORED effect (never the abstract "impact"). `heroText` is '' when the
 *  kind has no honest number (strike/weaken/inert/befriend) — the face renders a
 *  qualitative word there instead. Real-units-or-no-number: never a fabricated value. */
export interface CombatCardFaceVM {
    kind: CombatCardKind;
    keyword: string | null;        // UPPERCASE keyword for the face (e.g. 'BLEED')
    glyph: string;                 // sourced from statusGlyphs → matches the board chip
    categoryColor: string;
    stanceColor: string;
    heroText: string;              // POWER value in real units; '' = no honest number
    heroSub: string | null;        // e.g. '(18)'
    freeHeroText: string;          // the no-die value
    freeHeroSub: string | null;
    verbLine: string;              // plain who/what
    powerRail: string;
    readDependent: boolean;        // guard/strike scale with the read; dot/stun/regen do not
    inert: boolean;                // engine doesn't read it yet → greyed, no number
    guardBase: number | null;
}

/** Render-ready card DETAIL (the inspect modal) — the SAME numbers as the face. */
export interface CombatCardDetailVM {
    subtitle: string;
    metaChip: string;
    outcomeLine: string;
    outcomeStats: { label: string; value: string }[];
    stacksText: string | null;
    freeLine: string;
    powerLine: string;
    readNote: string;
    mathLine: string;
    keywords: { name: string; def: string; minor: boolean }[];
}

export interface CombatCardVM {
    uid: string; cardId: string; name: string; stance: string; stanceColor: string;
    verbClass: string; effectKind: 'dot' | 'control' | 'none'; rarity?: 'gold'; tier: 1 | 2 | 3;
    category: 'fallacy' | 'paradox' | null;
    topActionText: string; bottomActionText: string; bottomDamagePreview: number;
    /** Honest, render-ready 5-zone face — real units, zero abstraction. */
    face: CombatCardFaceVM;
    /** Honest, render-ready inspect detail (outcome + free/die + math + keywords). */
    detail: CombatCardDetailVM;
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

// ── Honest card view-models (face + detail) ──────────────────────────────────

type EffectPayloadLike = {
    damageOverTime?: { damagePerRound: number };
    actionRestriction?: { skipTurn?: boolean };
    regeneration?: { healthPerRound?: number };
    rollModifier?: number;
    rollModifierPerIntensity?: number;
};

/** THE single forward-compat honesty gate: the kind of HONEST, engine-read effect,
 *  or null for effects the live HP engine still doesn't quantify (→ greyed, number-
 *  less). Widened for mechanics 0.33.0: a negative roll modifier now weakens (and a
 *  variety denies) the enemy's turn, so it counts as 'weaken'. */
export function engineHonestKind(effectId: string | null | undefined): 'dot' | 'stun' | 'regen' | 'weaken' | null {
    if (!effectId) return null;
    const e = lookupEffect(effectId);
    if (!e) return null;
    const p = (e.payload ?? {}) as EffectPayloadLike;
    if (p.damageOverTime) return 'dot';
    if (p.actionRestriction?.skipTurn) return 'stun';
    if ((p.regeneration?.healthPerRound ?? 0) > 0) return 'regen';
    if ((p.rollModifier ?? 0) < 0 || (p.rollModifierPerIntensity ?? 0) < 0) return 'weaken';
    return null;
}

function glyphFor(effectId: string): string {
    const e = lookupEffect(effectId);
    return e ? effectGlyph(e as Parameters<typeof effectGlyph>[0]).glyph : '◆';
}

interface PrimaryResolution {
    kind: CombatCardKind;
    ce: SkillCombatEffects | null;
    guardAmount: number | null;
    riders: SkillCombatEffects[];
}

/** Resolve a card's PRIMARY combat effect + its kind. Reads the skill's
 *  combatEffects / specialMechanics directly — NOT card.primaryEffectId, which is
 *  null for guard/regen cards (it = primaryEnemyEffectId). */
export function resolvePrimary(card: CombatCard, skill: Skill | undefined): PrimaryResolution {
    const vc = card.verbClass;
    if (vc === 'defend') {
        const g = (skill?.specialMechanics ?? []).find(m => m.kind === 'guard') as { amount?: number } | undefined;
        return { kind: 'guard', ce: null, guardAmount: g?.amount ?? 0, riders: [] };
    }
    if (vc === 'befriend') return { kind: 'befriend', ce: null, guardAmount: null, riders: [] };
    if (vc === 'direct-damage') return { kind: 'strike', ce: null, guardAmount: null, riders: [] };
    if (vc === 'buff-self') {
        const self = (skill?.combatEffects ?? []).filter(e => e.appliedTo === 'self');
        const primary = self.find(s => engineHonestKind(s.effectId) === 'regen') ?? self[0] ?? null;
        const kind: CombatCardKind = engineHonestKind(primary?.effectId) === 'regen' ? 'regen' : 'inert';
        return { kind, ce: primary, guardAmount: null, riders: self.filter(s => s !== primary) };
    }
    // direct-dot | direct-control | stat-debuff → opponent effects
    const opp = (skill?.combatEffects ?? []).filter(e => e.appliedTo === 'opponent');
    const primary = opp.find(o => engineHonestKind(o.effectId)) ?? opp[0] ?? null;
    const k = engineHonestKind(primary?.effectId);
    const kind: CombatCardKind = k === 'dot' ? 'dot' : k === 'stun' ? 'stun' : k === 'weaken' ? 'weaken' : 'inert';
    return { kind, ce: primary, guardAmount: null, riders: opp.filter(o => o !== primary) };
}

interface CardCalc extends PrimaryResolution {
    keyword: string | null;
    glyph: string;
    categoryColor: string;
    perTurn: number; turns: number; total: number;
    freePerTurn: number; freeTurns: number; freeTotal: number;
    skips: number;
    dpr: number; intensity: number; stacks: boolean;
}

/** Single source of the numbers — faceStats AND detailStats both read this, so the
 *  face and the inspect modal can never drift. All values are AUTHORED units from
 *  getSkillById(card.skillId).combatEffects (not effect-library defaults). */
function cardCalc(card: CombatCard, skill: Skill | undefined): CardCalc {
    const pr = resolvePrimary(card, skill);
    const out: CardCalc = {
        ...pr, keyword: null, glyph: '◆', categoryColor: STRIKE_COLOR,
        perTurn: 0, turns: 0, total: 0, freePerTurn: 0, freeTurns: 0, freeTotal: 0,
        skips: 0, dpr: 0, intensity: 1, stacks: false,
    };
    const eff = pr.ce ? lookupEffect(pr.ce.effectId) : undefined;
    switch (pr.kind) {
        case 'dot': {
            const p = (eff?.payload ?? {}) as EffectPayloadLike;
            out.intensity = pr.ce?.intensity ?? 1;
            out.turns = pr.ce?.duration ?? eff?.duration ?? 0;
            out.dpr = p.damageOverTime?.damagePerRound ?? 0;
            out.perTurn = out.dpr * out.intensity;
            out.total = out.perTurn * out.turns;
            out.keyword = keywordForEffect(pr.ce?.effectId);
            out.glyph = pr.ce ? glyphFor(pr.ce.effectId) : '🔥';
            out.categoryColor = GLYPH_COLORS.dot;
            out.stacks = eff?.stacking === 'intensity';
            break;
        }
        case 'regen': {
            const p = (eff?.payload ?? {}) as EffectPayloadLike;
            out.intensity = pr.ce?.intensity ?? 1;
            out.turns = pr.ce?.duration ?? eff?.duration ?? 0;
            out.dpr = p.regeneration?.healthPerRound ?? 0;
            out.perTurn = out.dpr * out.intensity;
            out.total = out.perTurn * out.turns;
            out.freePerTurn = out.dpr;
            out.freeTurns = eff?.duration ?? 0;
            out.freeTotal = out.dpr * out.freeTurns;
            out.keyword = keywordForEffect(pr.ce?.effectId);
            out.glyph = pr.ce ? glyphFor(pr.ce.effectId) : '✚';
            out.categoryColor = GLYPH_COLORS.regen;
            break;
        }
        case 'stun': {
            out.skips = pr.ce?.duration ?? eff?.duration ?? 1;
            out.keyword = keywordForEffect(pr.ce?.effectId);
            out.glyph = pr.ce ? glyphFor(pr.ce.effectId) : '💫';
            out.categoryColor = GLYPH_COLORS.control;
            break;
        }
        case 'weaken': {
            out.keyword = keywordForEffect(pr.ce?.effectId);
            out.glyph = pr.ce ? glyphFor(pr.ce.effectId) : '⛓';
            out.categoryColor = GLYPH_COLORS.control;
            break;
        }
        case 'guard':
            out.keyword = 'Guard'; out.glyph = '🛡'; out.categoryColor = GUARD_COLOR; break;
        case 'strike':
            out.keyword = null; out.glyph = '◆'; out.categoryColor = STRIKE_COLOR; break;
        case 'befriend':
            out.keyword = null; out.glyph = '🕊'; out.categoryColor = BEFRIEND_COLOR; break;
        case 'inert':
        default:
            out.keyword = keywordForEffect(pr.ce?.effectId);
            out.glyph = eff && pr.ce ? glyphFor(pr.ce.effectId) : '▽';
            out.categoryColor = INERT_COLOR;
            break;
    }
    return out;
}

function buildDetailKeywords(card: CombatCard, c: CardCalc): { name: string; def: string; minor: boolean }[] {
    const out: { name: string; def: string; minor: boolean }[] = [];
    const seen = new Set<string>();
    const push = (kw: string | null, minor: boolean) => {
        if (!kw) return;
        const up = kw.toUpperCase();
        if (seen.has(up)) return;
        seen.add(up);
        out.push({ name: up, def: keywordGloss(kw) ?? '', minor });
    };
    if (c.kind === 'guard') push(keywordForVerb(card.verbClass), false);
    else push(c.keyword, c.kind === 'inert');
    // A rider is "minor" only if the engine still doesn't read it (engineHonestKind null).
    for (const r of c.riders) push(keywordForEffect(r.effectId), engineHonestKind(r.effectId) === null);
    return out;
}

/** Honest card FACE view-model (the 5-zone hand card). */
export function faceStats(card: CombatCard, skill?: Skill): CombatCardFaceVM {
    const c = cardCalc(card, skill);
    const stanceColor = STANCE_COLORS[card.stance] ?? '#888';
    const kw = c.keyword ? c.keyword.toUpperCase() : null;
    const free = `${FREE_CHIP_HP} HP`;
    const base = { glyph: c.glyph, categoryColor: c.categoryColor, stanceColor };
    switch (c.kind) {
        case 'dot': return { ...base, kind: 'dot', keyword: kw, heroText: `${c.total}`, heroSub: `${c.perTurn}/turn · ${c.turns} turns`, freeHeroText: free, freeHeroSub: null, verbLine: 'foe loses HP each turn', powerRail: c.keyword ?? 'DoT', readDependent: false, inert: false, guardBase: null };
        case 'stun': return { ...base, kind: 'stun', keyword: kw, heroText: `skip ${c.skips}t`, heroSub: null, freeHeroText: free, freeHeroSub: null, verbLine: "the foe can't act", powerRail: c.keyword ?? 'Stun', readDependent: false, inert: false, guardBase: null };
        case 'weaken': return { ...base, kind: 'weaken', keyword: kw, heroText: '', heroSub: 'weakens its next hit', freeHeroText: free, freeHeroSub: null, verbLine: "weakens the foe's hit", powerRail: c.keyword ?? 'Weaken', readDependent: false, inert: false, guardBase: null };
        case 'regen': return { ...base, kind: 'regen', keyword: kw, heroText: `${c.total}`, heroSub: `${c.perTurn}/turn · ${c.turns} turns`, freeHeroText: `${c.freeTotal}`, freeHeroSub: `${c.freePerTurn}/turn · ${c.freeTurns} turns`, verbLine: 'heal yourself each turn', powerRail: c.keyword ?? 'Regen', readDependent: false, inert: false, guardBase: null };
        case 'guard': { const b = c.guardAmount ?? 0; return { ...base, kind: 'guard', keyword: 'GUARD', heroText: `Guard ${b}`, heroSub: null, freeHeroText: `Guard ${Math.max(1, Math.round(b * 0.5))}`, freeHeroSub: null, verbLine: 'block the next hit', powerRail: `${b} ↑read`, readDependent: true, inert: false, guardBase: b }; }
        case 'strike': return { ...base, kind: 'strike', keyword: 'STRIKE', heroText: '', heroSub: 'small direct hit', freeHeroText: 'small chip', freeHeroSub: null, verbLine: 'a small direct hit', powerRail: 'full ↑read', readDependent: true, inert: false, guardBase: null };
        case 'befriend': return { ...base, kind: 'befriend', keyword: 'SPARE', heroText: '', heroSub: 'spare a near-dead foe', freeHeroText: 'mercy', freeHeroSub: null, verbLine: 'spare a near-dead foe', powerRail: 'mercy', readDependent: false, inert: false, guardBase: null };
        case 'inert':
        default: return { ...base, kind: 'inert', keyword: kw ?? 'DEBUFF', heroText: '', heroSub: card.verbClass === 'buff-self' ? 'buff yourself' : 'weakens the foe', freeHeroText: card.verbClass === 'buff-self' ? 'weak buff' : free, freeHeroSub: null, verbLine: card.verbClass === 'buff-self' ? 'buff yourself' : 'weakens the foe', powerRail: c.keyword ?? '—', readDependent: false, inert: true, guardBase: null };
    }
}

/** Honest card DETAIL view-model (the inspect modal) — same numbers as the face. */
export function detailStats(card: CombatCard, skill?: Skill): CombatCardDetailVM {
    const c = cardCalc(card, skill);
    const Title = c.keyword ?? '';
    const STANCE = STANCE_LABELS[card.stance] ?? card.stance.toUpperCase();
    const metaChip = `${card.stance.toUpperCase()} · TIER ${card.tier} · ${card.effectKind === 'dot' ? 'DOT' : card.effectKind === 'control' ? 'CONTROL' : card.verbClass.toUpperCase()}`;
    const keywords = buildDetailKeywords(card, c);
    const free = FREE_CHIP_HP;
    const match = `Any die works; a ${STANCE} die matches (+${COLOR_MATCH_DAMAGE_BONUS} and a stronger read).`;
    switch (c.kind) {
        case 'dot': return { subtitle: `${Title} the enemy — damage over time.`, metaChip, outcomeLine: `${Title} the enemy: ${c.perTurn} HP/turn for ${c.turns} turns — ${c.total} HP total.`, outcomeStats: [{ label: 'PER TURN', value: `${c.perTurn}` }, { label: 'TURNS', value: `${c.turns}` }, { label: 'TOTAL', value: `${c.total}` }], stacksText: c.stacks ? 'Stacks up to 10× — re-applying piles on more.' : null, freeLine: `◇ FREE (no die): deal ${free} HP now. No ${Title} lands without a die.`, powerLine: `◆ WITH A DIE: apply ${Title} — ${c.perTurn} HP/turn for ${c.turns} turns (${c.total} total), plus a small hit. ${match}`, readNote: `The read scales only the small strike, not the ${Title} — ${c.total} is exact.`, mathLine: `${c.perTurn}/turn = ${c.dpr} base × ${c.intensity} intensity · ${c.turns} turns · ${c.total} HP total${c.stacks ? ' · stacks to 10×' : ''}.`, keywords };
        case 'stun': return { subtitle: `${Title} the enemy — it loses its turns.`, metaChip, outcomeLine: `The enemy skips its next ${c.skips} turns — ${c.skips} telegraphed attacks it never makes.`, outcomeStats: [{ label: 'SKIPS', value: `${c.skips} turns` }], stacksText: null, freeLine: `◇ FREE (no die): deal ${free} HP now. No ${Title} without a die.`, powerLine: `◆ WITH A DIE: ${Title} — the foe skips its next ${c.skips} actions, plus a small hit. ${match}`, readNote: `The read scales only the small strike, not the ${Title} — skip ${c.skips} is exact.`, mathLine: `skip ${c.skips}t = ${Title.toLowerCase()} duration ${c.skips} (each turn it would act is cancelled).`, keywords };
        case 'weaken': return { subtitle: `${Title} the enemy — its attacks hit softer.`, metaChip, outcomeLine: `Weaken the enemy: its next telegraphed attack hits softer. Stack a VARIETY of controls to deny its turn entirely.`, outcomeStats: [], stacksText: null, freeLine: `◇ FREE (no die): deal ${free} HP now. No ${Title} without a die.`, powerLine: `◆ WITH A DIE: apply ${Title} — the foe's next hit is weakened, plus a small hit. ${match}`, readNote: `${Title} weakens the enemy's hit; pile on different controls to deny the turn outright.`, mathLine: `${Title} lowers the enemy's attack roll; combined controls past a threshold deny the turn (exact amount is engine-tuned).`, keywords };
        case 'regen': return { subtitle: 'Heal yourself over time.', metaChip, outcomeLine: `Regenerate: heal ${c.perTurn} HP/turn for ${c.turns} turns — ${c.total} HP total.`, outcomeStats: [{ label: 'PER TURN', value: `${c.perTurn}` }, { label: 'TURNS', value: `${c.turns}` }, { label: 'TOTAL', value: `${c.total}` }], stacksText: null, freeLine: `◇ FREE (no die): a weak regen — ${c.freePerTurn} HP/turn for ${c.freeTurns} turns (${c.freeTotal} total).`, powerLine: `◆ WITH A DIE: regenerate ${c.perTurn} HP/turn for ${c.turns} turns (${c.total} total). Any die; a ${STANCE} die matches.`, readNote: `Heals YOU — no read needed; ${c.total} is exact.`, mathLine: `${c.perTurn}/turn = ${c.dpr} base × ${c.intensity} intensity · ${c.turns} turns · ${c.total} total. FREE = ${c.dpr} base × 1 · ${c.freeTurns} turns · ${c.freeTotal}.`, keywords };
        case 'guard': { const b = c.guardAmount ?? 0; const freeG = Math.max(1, Math.round(b * 0.5)); const adv = Math.max(1, Math.round(b * READ_DAMAGE_MULT.advantage)); const dis = Math.max(1, Math.round(b * READ_DAMAGE_MULT.disadvantage)); return { subtitle: 'Guard yourself — soak the next hit.', metaChip, outcomeLine: `Gain Guard ${b} — absorbs up to ${b} damage from the enemy's NEXT attack, then it's gone. One-shot; does not stack.`, outcomeStats: [{ label: 'GUARD', value: `${b} (▲${adv} · —${b} · ▼${dis})` }], stacksText: null, freeLine: `◇ FREE (no die): a weak brace — Guard ${freeG}.`, powerLine: `◆ WITH A DIE: Guard ${b}; ▲ read raises it to ${adv}, ▼ read drops it to ${dis}; +${COLOR_MATCH_DAMAGE_BONUS} if a ${STANCE} die matches.`, readNote: `The read scales this: ▲ advantage ×${READ_DAMAGE_MULT.advantage}, ▼ disadvantage ×${READ_DAMAGE_MULT.disadvantage}.`, mathLine: `FREE = round(${b} × ½) = ${freeG}.  POWER = round(${b} × read) + ${COLOR_MATCH_DAMAGE_BONUS} on a colour match.`, keywords }; }
        case 'strike': return { subtitle: 'A small direct hit.', metaChip, outcomeLine: 'A small direct hit — the weak baseline; status erodes faster.', outcomeStats: [], stacksText: null, freeLine: '◇ FREE (no die): chip a sliver of HP.', powerLine: `◆ WITH A DIE: a full direct hit (scales with your ${skill?.scalingStat ?? 'stat'}); ▲ read ×${READ_DAMAGE_MULT.advantage}, ▼ ×${READ_DAMAGE_MULT.disadvantage}.`, readNote: `The read scales this hit: ▲ ×${READ_DAMAGE_MULT.advantage}, ▼ ×${READ_DAMAGE_MULT.disadvantage}.`, mathLine: `≈ (basePower ${skill?.basePower ?? '?'} + your ${skill?.scalingStat ?? 'stat'}) × 0.25 × read — needs live stats, so no fixed number.`, keywords };
        case 'befriend': return { subtitle: 'Spare a near-dead foe.', metaChip, outcomeLine: 'Befriend — usable when the enemy is near defeat (low HP); ends the fight peacefully (mercy) instead of a kill.', outcomeStats: [], stacksText: null, freeLine: '◇ FREE (no die): attempt mercy on a near-dead foe.', powerLine: '◆ WITH A DIE: if the enemy HP is low, end combat peacefully (befriend).', readNote: 'Watch the enemy HP bar — befriend lands only when it is low.', mathLine: 'No fixed number — a conditional outcome gated on low enemy HP.', keywords };
        case 'inert':
        default: return { subtitle: `${Title || 'Effect'} — minor right now.`, metaChip, outcomeLine: `${Title || 'This effect'} — minor right now. The live engine does not read it yet, so it is shown without a number (no fabricated value).`, outcomeStats: [], stacksText: null, freeLine: `◇ FREE (no die): deal ${free} HP now.`, powerLine: `◆ WITH A DIE: apply ${Title || 'the effect'}, plus a small hit. ${match}`, readNote: 'The read scales only the small strike.', mathLine: `${Title || 'This effect'} is not read by the live HP engine yet — no number shown.`, keywords };
    }
}

/** Exact powered Guard value at the moment of commit (read known) — StagedCard only.
 *  null for non-read-dependent kinds (dot/stun/regen show their static hero) and for
 *  strike (which stays qualitative 'HIT' + a read pip). */
export function armedReadValue(face: CombatCardFaceVM, read: CombatReadResult, colorMatch: boolean): number | null {
    if (face.kind !== 'guard' || face.guardBase == null) return null;
    return Math.max(1, Math.round(face.guardBase * READ_DAMAGE_MULT[read])) + (colorMatch ? COLOR_MATCH_DAMAGE_BONUS : 0);
}

function handVM(state: CombatEncounterState): CombatCardVM[] {
    const drafted = getDraftedDie(state);
    return engineHandCards(state)
        // Retreat is no longer an in-combat card — fleeing is offered at the
        // encounter prelude (ENGAGE / FLEE), not from the hand.
        .filter(({ card }: { card: CombatCard }) => card.id !== 'card-retreat' && card.verbClass !== 'retreat')
        .map(({ uid, card }: { uid: string; card: CombatCard }) => {
        const preview = drafted ? cardReadPreview(state, card) : null;
        const skill = card.skillId ? getSkillById(card.skillId) : undefined;
        return {
            uid, cardId: card.id, name: card.name, stance: card.stance,
            stanceColor: STANCE_COLORS[card.stance] ?? '#888',
            verbClass: card.verbClass, effectKind: card.effectKind, rarity: card.rarity, tier: card.tier, category: card.category,
            topActionText: card.topActionText, bottomActionText: card.bottomActionText,
            bottomDamagePreview: card.bottomDamagePreview,
            face: faceStats(card, skill),
            detail: detailStats(card, skill),
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
