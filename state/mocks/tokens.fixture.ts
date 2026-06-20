/**
 * Token **presentation meta** — palette, key list, accrual-rule copy.
 *
 * Skill data (ids, costs, tiers, stances, descriptions) is NO LONGER
 * defined here: the Token Crucible presenter
 * (`state/presenters/token-crucible.engine.ts`) sources skills from the
 * engine's `skillLibrary`, which is the single source of truth. The
 * previously-local `TOKEN_SKILLS` list had drifted out of sync with the
 * engine (wrong costs / tiers / stances) and was removed.
 *
 * What remains here is genuinely mobile-side:
 *  - `TOKEN` / `TOKEN_KEYS` / `tokenColor` — token palette + labels (UI chrome).
 *  - `TOKEN_RULES` — token-accrual explainer copy. **Scaffolding** (per
 *    ADR-0003): the engine ships no token-accrual ruleset yet, so this is
 *    a mobile-authored design proposal pending engine support. Replace
 *    with an engine export when one lands; do not treat as truth.
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
