/**
 * Token Crucible presenter (Phase 28).
 *
 * Composes the view-model for the Token Crucible screen
 * (`app/crucible.tsx` → `components/TokenCrucible.tsx`) from the
 * `state/mocks/tokens.fixture.ts` fixture data + a caller-supplied
 * `pool` of current token counts.
 *
 * **Pool is an argument, not state.** Engine 0.7 doesn't ship a
 * player-resource surface yet; the Crucible renders against a default
 * pool prop today. When the engine drops a resource API, this
 * presenter swaps to a state-driven selector.
 *
 * Spec source: the Phase 17 retroactive brief at
 * `plan/phases/phase_17_token_crucible.md`.
 */

import {
    TOKEN,
    TOKEN_KEYS,
    TOKEN_RULES,
    TOKEN_SKILLS,
    canAfford,
    type TokenAccrualRule,
    type TokenCounts,
    type TokenKey,
    type TokenMeta,
    type TokenSkillFixture,
} from '../mocks/tokens.fixture';
import { freezeViewModel } from './freeze';

export type StanceKey = 'heart' | 'body' | 'mind';

/** One row in the per-stance skill grid. */
export interface CrucibleSkillRow {
    id: string;
    name: string;
    tier: TokenSkillFixture['tier'];
    cat: TokenSkillFixture['cat'];
    /** Stable cost entries, in TOKEN_KEYS order. Each carries `{ kind, amount }`. */
    costEntries: ReadonlyArray<{ kind: TokenKey; amount: number }>;
    desc: string;
    /** True iff the caller's pool covers this skill's cost. */
    castableNow: boolean;
}

/** One row in the accrual-rules table. */
export interface CrucibleRuleRow extends TokenAccrualRule {
    /** Inline meta for the token kind (color / label / etc.) so the screen doesn't import the palette. */
    meta: TokenMeta;
}

/** One entry in the legend key. */
export interface CrucibleLegendEntry {
    kind: TokenKey;
    meta: TokenMeta;
}

export interface TokenCrucibleViewModel {
    /** The player's (or caller's) current token counts. */
    pool: TokenCounts;
    /** Palette + labels for every token kind. */
    tokenMeta: Record<TokenKey, TokenMeta>;
    /** Stable token-kind order — `body | mind | heart | fallacy | paradox`. */
    tokenKeys: ReadonlyArray<TokenKey>;
    /** Skills partitioned by stance, in fixture order. */
    skillsByStance: Record<StanceKey, ReadonlyArray<CrucibleSkillRow>>;
    /** Total number of skills surfaced (currently 12). */
    totalSkillCount: number;
    /** Count of skills the caller's pool can currently cover. */
    castableSkillCount: number;
    /** Accrual rules table for the explainer panel. */
    rules: ReadonlyArray<CrucibleRuleRow>;
    /** Legend key — one entry per token kind, in `TOKEN_KEYS` order. */
    legend: ReadonlyArray<CrucibleLegendEntry>;
}

const STANCES: ReadonlyArray<StanceKey> = ['heart', 'body', 'mind'];

function buildCostEntries(
    cost: Partial<TokenCounts>,
): ReadonlyArray<{ kind: TokenKey; amount: number }> {
    const out: { kind: TokenKey; amount: number }[] = [];
    for (const kind of TOKEN_KEYS) {
        const amount = cost[kind] ?? 0;
        if (amount > 0) out.push({ kind, amount });
    }
    return out;
}

function buildSkillRow(skill: TokenSkillFixture, pool: TokenCounts): CrucibleSkillRow {
    return {
        id: skill.id,
        name: skill.name,
        tier: skill.tier,
        cat: skill.cat,
        costEntries: buildCostEntries(skill.cost),
        desc: skill.desc,
        castableNow: canAfford(skill.cost, pool),
    };
}

/**
 * Returns the Token Crucible view-model for a given `pool`. Pure —
 * no side effects, no I/O. Caller passes the player's current
 * token counts; the presenter does the per-stance filter + the
 * castable-now check.
 */
export function selectTokenCrucibleViewModel(pool: TokenCounts): TokenCrucibleViewModel {
    const skillsByStance: Record<StanceKey, CrucibleSkillRow[]> = {
        heart: [],
        body: [],
        mind: [],
    };
    let castableSkillCount = 0;
    for (const skill of TOKEN_SKILLS) {
        const row = buildSkillRow(skill, pool);
        skillsByStance[skill.stance].push(row);
        if (row.castableNow) castableSkillCount += 1;
    }

    const rules: CrucibleRuleRow[] = TOKEN_RULES.map((r) => ({ ...r, meta: TOKEN[r.kind] }));
    const legend: CrucibleLegendEntry[] = TOKEN_KEYS.map((kind) => ({ kind, meta: TOKEN[kind] }));

    const vm: TokenCrucibleViewModel = {
        pool,
        tokenMeta: TOKEN,
        tokenKeys: TOKEN_KEYS,
        skillsByStance: {
            heart: skillsByStance.heart,
            body: skillsByStance.body,
            mind: skillsByStance.mind,
        },
        totalSkillCount: TOKEN_SKILLS.length,
        castableSkillCount,
        rules,
        legend,
    };
    return freezeViewModel(vm);
}

/** Re-export `STANCES` for callers that want the canonical render order. */
export const CRUCIBLE_STANCE_ORDER = STANCES;
