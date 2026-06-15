/**
 * Token system fixture — palette, key list, 12-skill library, accrual rules.
 *
 * Mirrors the engine's `Skill.resourceCost` shape on
 * `axiomancer-mechanics@0.6.x`. Engine work to re-export `skillLibrary`
 * top-level is tracked in ROADMAP.md (gap G); until that lands, this
 * fixture is the consumer-side source of truth for the token UI.
 *
 * Ported from `axiomancer/project/screens/tokens.jsx` in the design handoff.
 *
 * Accent foregrounds track the active theme's AXM accents (body→blood,
 * heart→rust, fallacy→parchment, paradox→sulfur) so the skill-fuel row
 * stays consistent with the rest of the palette. `mind` keeps its own
 * steel-blue (no AXM equivalent). The dark chip backgrounds are tuned
 * per-token and stay fixed.
 */

import { AXM } from '@/theme/axm';
import type { Palette } from '@/theme/palette';

export type TokenKey = 'body' | 'mind' | 'heart' | 'fallacy' | 'paradox';

/**
 * The accent colour for a token kind, resolved from the **live** palette
 * so token chips re-paint on a theme switch. `body→blood`, `heart→rust`,
 * `fallacy→parchment`, `paradox→sulfur`; `mind` keeps its own steel-blue
 * (no AXM equivalent). Render-time callers pass `usePalette()`.
 *
 * The static `TOKEN[kind].color` below is a default-theme snapshot kept
 * for the (non-rendered) crucible engine view-model; UI reads colour via
 * this function instead.
 */
export function tokenColor(kind: TokenKey, palette: Palette): string {
    switch (kind) {
        case 'body':
            return palette.blood;
        case 'heart':
            return palette.rust;
        case 'fallacy':
            return palette.parchment;
        case 'paradox':
            return palette.sulfur;
        case 'mind':
            return '#6b8eb0';
    }
}

export interface TokenMeta {
    /** Foreground / stroke. */
    color: string;
    /** Filled chip background. */
    bg: string;
    /** Long display label (caps). */
    label: string;
    /** Three-letter short label (caps). */
    short: string;
}

export const TOKEN_KEYS: readonly TokenKey[] = ['body', 'mind', 'heart', 'fallacy', 'paradox'] as const;

export const TOKEN: Record<TokenKey, TokenMeta> = {
    body:    { color: AXM.blood,     bg: '#1a0808', label: 'BODY',    short: 'BDY' },
    mind:    { color: '#6b8eb0',     bg: '#0b1018', label: 'MIND',    short: 'MND' },
    heart:   { color: AXM.rust,      bg: '#1a0d08', label: 'HEART',   short: 'HRT' },
    fallacy: { color: AXM.parchment, bg: '#16140e', label: 'FALLACY', short: 'FAL' },
    paradox: { color: AXM.sulfur,    bg: '#16140a', label: 'PARADOX', short: 'PDX' },
};

export type TokenCounts = Record<TokenKey, number>;

export interface TokenSkillFixture {
    id: string;
    name: string;
    cat: 'fallacy' | 'paradox';
    stance: 'heart' | 'body' | 'mind';
    tier: 1 | 2 | 3;
    cost: Partial<TokenCounts>;
    desc: string;
}

/**
 * 12 skills — 4 per stance, 6 fallacy / 6 paradox, tiers 1–3.
 * Shape mirrors `axiomancer-mechanics@0.6 skillLibrary`.
 */
export const TOKEN_SKILLS: readonly TokenSkillFixture[] = [
    // ── HEART (4) ──
    { id: 'appeal-to-pity',    name: 'APPEAL TO PITY', cat: 'fallacy', stance: 'heart', tier: 1, cost: { heart: 1 },                       desc: 'Sway with sorrow. Foe holds blow if charmed.' },
    { id: 'ad-hominem-strike', name: 'AD HOMINEM',     cat: 'fallacy', stance: 'heart', tier: 2, cost: { heart: 1, fallacy: 1 },           desc: 'Strike the speaker. +2 dmg if foe wounded.' },
    { id: 'ship-of-theseus',   name: 'OF THESEUS',     cat: 'paradox', stance: 'heart', tier: 2, cost: { heart: 1, paradox: 1 },           desc: 'Replace foe limb. Disarm 2 rounds.' },
    { id: 'bootstrap-paradox', name: 'BOOTSTRAP',      cat: 'paradox', stance: 'heart', tier: 3, cost: { heart: 1, paradox: 2 },           desc: 'Pull tomorrow into now. Reroll the round.' },
    // ── BODY (4) ──
    { id: 'straw-man',         name: 'STRAW MAN',      cat: 'fallacy', stance: 'body',  tier: 1, cost: { body: 1 },                        desc: 'Conjure decoy. Absorb next blow.' },
    { id: 'no-true-scotsman',  name: 'NO TRUE SCOT',   cat: 'fallacy', stance: 'body',  tier: 2, cost: { body: 1, fallacy: 1 },            desc: 'Reframe the wound — heal 4 by denial.' },
    { id: 'zenos-blade',       name: "ZENO'S BLADE",   cat: 'paradox', stance: 'body',  tier: 2, cost: { body: 1, paradox: 1 },            desc: 'Halve distance forever. Pierce.' },
    { id: 'grandfather',       name: 'GRANDFATHER',    cat: 'paradox', stance: 'body',  tier: 3, cost: { body: 2, paradox: 1 },            desc: 'Undo foe ancestor. –10 max HP.' },
    // ── MIND (4) ──
    { id: 'circular-logic',    name: 'CIRCULAR LOGIC', cat: 'fallacy', stance: 'mind',  tier: 1, cost: { mind: 1 },                        desc: 'Foe loses next action. Costs 1 HP.' },
    { id: 'sorites-cascade',   name: 'SORITES HEAP',   cat: 'paradox', stance: 'mind',  tier: 2, cost: { mind: 1, paradox: 1 },            desc: 'Wear foe down. +1 stack each round.' },
    { id: 'gamblers-fallacy',  name: "GAMBLER'S",      cat: 'fallacy', stance: 'mind',  tier: 2, cost: { mind: 1, fallacy: 1 },            desc: 'Force a re-roll on foe — keep worse.' },
    { id: 'eternal-regress',   name: 'ETERNAL REGRESS', cat: 'paradox', stance: 'mind', tier: 3, cost: { mind: 2, paradox: 1, fallacy: 1 }, desc: 'Foe argues itself to dust. 3 turns, ramp.' },
];

export interface TokenAccrualRule {
    kind: TokenKey;
    when: string;
    amount: string;
}

/**
 * How tokens accrue. Surfaces in the Crucible explainer and (later) in the
 * in-combat tooltip. The engine doesn't ship the rules yet — these are the
 * proposal from the design handoff.
 */
export const TOKEN_RULES: readonly TokenAccrualRule[] = [
    { kind: 'body',    when: 'Each round you END in BODY stance',  amount: '+1' },
    { kind: 'mind',    when: 'Each round you END in MIND stance',  amount: '+1' },
    { kind: 'heart',   when: 'Each round you END in HEART stance', amount: '+1' },
    { kind: 'fallacy', when: 'Win a round with ADVANTAGE',         amount: '+1' },
    { kind: 'paradox', when: 'Suffer a hit AND survive',           amount: '+1' },
    { kind: 'body',    when: 'Land a crit while in BODY stance',   amount: '+1' },
    { kind: 'mind',    when: 'Mark a foe via MIND setup action',   amount: '+1' },
    { kind: 'heart',   when: 'Choose dialogue over violence',      amount: '+1' },
    { kind: 'fallacy', when: 'Successfully cast any fallacy',      amount: '+1 (banked)' },
    { kind: 'paradox', when: 'Successfully cast any paradox',      amount: '+1 (banked)' },
];

/** Does the player's pool cover this skill's cost? */
export function canAfford(cost: Partial<TokenCounts> = {}, tokens: Partial<TokenCounts> = {}): boolean {
    for (const k of TOKEN_KEYS) {
        if ((cost[k] ?? 0) > (tokens[k] ?? 0)) return false;
    }
    return true;
}
