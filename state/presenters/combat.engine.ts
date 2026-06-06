/**
 * Screen-level presenter for `app/(tabs)/combat.tsx`.
 *
 * Maps the engine's `CombatState` (plus optional ephemeral UI state)
 * into a fully-shaped `CombatViewModel`. Every UI surface on the
 * combat screen — enemy panel, battle log, player HUD, stance picker,
 * action picker, skill picker, resolve panel — reads exclusively from
 * this VM. The screen itself owns no game logic.
 *
 * Per Spec 03 (Q1 A, Q2 A, Q3 A, Q5 B) and Spec 04 (Q1 A, Q2 A, Q3 A,
 * Q4 C, Q5 carousel, Q6 C):
 * - Naming: `selectCombatViewModel`.
 * - Args: `(state, localUi?)` — `localUi` holds preview-only state
 *   (stance the player is composing before commit, skill preview).
 * - Phase: read from `state.combat.phase`. The screen never owns phase.
 * - Skills: read from `state/selectors/combat-skills.ts` — the
 *   engine `skillLibrary` adapter (Phase 16, engine 0.10.2's
 *   top-level `skillLibrary` + `getSkillById`). Previously the
 *   data came from a hand-rolled 6-entry mock at
 *   `state/mocks/combat.skills.fixture.ts`; Phase 16 deleted it.
 * - VM is data only — no event handlers, no colour tokens, no icon
 *   instances. The screen resolves icons from stable `iconKind` keys.
 */

import {
    FRIENDSHIP_COUNTER_MAX,
    determineAdvantage,
    lookupEffect,
    resolveEffectiveAdvantage,
    type ActiveEffect,
    type Advantage,
    type DerivedStats,
    type Stance,
} from 'axiomancer-mechanics';

import type { AppStoreState } from '@/state/store';
import { useMemo } from 'react';

import {
    COMBAT_SKILLS,
    type SkillCategoryKey,
} from '@/state/selectors/combat-skills';
import { useGameState } from '../GameStoreProvider';

import {
    selectCombatHudViewModel,
    type CombatHudViewModel,
} from './combat-hud.engine';
import { MAX_EFFECTS_SHOWN } from './constants';
import { freezeViewModel } from './freeze';
import { toRomanLower as toRoman } from './roman';
import { STANCES } from './stances';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CombatPhaseKey =
    | 'choosing_stance'
    | 'choosing_action'
    | 'choosing_skill'
    | 'resolving'
    | 'ended';

export type StanceKey = 'heart' | 'body' | 'mind';

export type ActionKey = 'attack' | 'defend' | 'skill' | 'item';

export type AdvantageKind = 'adv' | 'dis' | 'neutral';

export type LogSeverity =
    | 'info'
    | 'damage'
    | 'crit'
    | 'heal'
    | 'effect'
    | 'friendship'
    | 'system';

export type ResolveOutcomeKind = 'damage' | 'crit' | 'friendship' | 'miss';

export interface CombatLocalUi {
    /** Stance the player has previewed but not yet committed. */
    selectedStance?: StanceKey;
    /** Skill the player has previewed but not yet committed. */
    selectedSkillId?: string;
}

export interface CombatEffectDisplay {
    /** Stable id (icon + colour key for the chip). */
    kind: string;
    /**
     * Raw engine `effectId` (e.g. `'tier1_body_attack'`).
     * Empty string when the source effect has no engine id —
     * callers (Phase 75 tooltip wiring) treat empty as "no
     * tooltip lookup possible".
     */
    effectId: string;
    /** Display name. */
    name: string;
    /** Remaining duration in rounds; `null` for indefinite. */
    duration: number | null;
    /** Stack intensity. */
    intensity: number;
    /** Visual tint hint — `'buff' | 'debuff' | null`. */
    tint: 'buff' | 'debuff' | null;
}

export interface CombatEnemySummary {
    name: string;
    /** e.g. `'elite'`; empty string when no combat. */
    tier: string;
    hp: number;
    hpMax: number;
    /** [0, 1] for the bar. */
    hpRatio: number;
    /** Last stance the enemy declared (or showed); `null` before round 1 resolves. */
    lastStance: StanceKey | null;
    /** Mind-mark stacks on the enemy. */
    mindMarks: number;
    /** Active effects (truncated for the UI). */
    effects: readonly CombatEffectDisplay[];
    /** Italicised flavour line under the name. */
    flavor: string;
}

export interface CombatPlayerSummary {
    hp: number;
    hpMax: number;
    /** [0, 1]. */
    hpRatio: number;
    /** Total combat resources (engine truth). */
    totalResources: number;
    /** Estimated max resources for ratio calculation. */
    maxResources: number;
    /** [0, 1]. */
    resourceRatio: number;
    effects: readonly CombatEffectDisplay[];
}

export interface StanceOption {
    key: StanceKey;
    /** Capitalised label, e.g. `'HEART'`. */
    label: string;
    /** Display label of the stance this one counters, e.g. `'BODY'`. */
    counters: string;
    /** Display label of the stance this one is weak to. */
    weakTo: string;
    derived: { attack: number; skill: number; defense: number };
    /** Relative to the enemy's last stance (or `'neutral'` when unknown). */
    advantage: AdvantageKind;
    /**
     * Two-word lowercase gloss under the stance label on the picker
     * card — ports the design's `prototype.jsx:285-287` table:
     * heart='parley, mercy'; body='iron, force'; mind='cipher, ruse'.
     * Reads as a fly-by lore line, distinct from the longer `hint`
     * the action picker carries. Phase 47 port.
     */
    gloss: string;
}

export interface StancePickerSlice {
    options: readonly StanceOption[];
    /**
     * The stance the player has currently selected/previewed. `null`
     * when nothing is selected yet — Phase 65 Tick B dropped the
     * `'heart'` default so no stance card appears pre-highlighted
     * on combat entry. The screen treats `null` as "no card
     * highlighted" (no `isSel` matches).
     */
    selected: StanceKey | null;
    /** False when the engine state isn't ready to accept a commit. */
    canConfirm: boolean;
}

export interface ActionOption {
    key: ActionKey;
    label: string;
    hint: string;
    /** Stable icon kind the screen maps to a glyph component. */
    iconKind: 'sword' | 'shield' | 'arcane' | 'bag';
    /** Stable palette key the screen resolves to a colour. */
    accentKind: 'blood' | 'parchment' | 'sulfur' | 'rust';
    /** False when the action is not yet implemented (greyed in UI). */
    enabled: boolean;
}

export interface ActionPickerSlice {
    options: readonly ActionOption[];
    /**
     * Per Spec 04 Q6: flee is a no-op; the screen shows `fleeMessage`
     * as a toast instead of resolving a flee roll. Real flee semantics
     * wait on an engine luck-save surface (no candidate yet).
     */
    fleeAvailable: boolean;
    fleeMessage: string;
    /**
     * Sub-label rendered beneath the flee button in the action picker.
     * Lowercase ritual register; the screen renders verbatim. Lives on
     * the VM so view-layer code carries no ritual copy (Hard Rule #8).
     */
    fleeHint: string;
    /**
     * Toast string surfaced when the player taps the Item action.
     * The action is a no-op until Spec 06 wires the combat-side
     * inventory picker; until then the screen flashes this string.
     * Presenter-sourced (Hard Rule #8) — siblings `fleeMessage` /
     * `fleeHint` did the same earlier.
     */
    itemMessage: string;
}

export interface SkillOption {
    id: string;
    name: string;
    description: string;
    category: SkillCategoryKey;
    stance: StanceKey;
    manaCost: number;
    /** False = greyed out (wrong stance or insufficient resources). */
    enabled: boolean;
    disabledReason: 'wrong-stance' | 'insufficient-resources' | null;
}

export interface SkillPickerSlice {
    skills: readonly SkillOption[];
    /** Number of currently-castable skills (matches stance + cost). */
    availableCount: number;
    totalCount: number;
}

export interface ResolveSlice {
    /** Stance the player committed to this round; falls back to `'heart'`. */
    playerStance: StanceKey;
    /** Stance the enemy committed to; falls back to `'mind'`. */
    enemyStance: StanceKey;
    advantageLabel: 'ADVANTAGE' | 'DISADVANTAGE' | 'NEUTRAL';
    advantageKind: AdvantageKind;
    /** Display roll values from the last resolved round. */
    playerRoll: number;
    enemyRoll: number;
    /** Outcome bucket — drives the banner colour + header label. */
    outcome: ResolveOutcomeKind;
    /** Primary number — `'–14'` or `'FRIEND +1'`. */
    primaryText: string;
    /** Banner subtitle, e.g. `'BLEED · 2 ROUNDS APPLIED'`. */
    message: string;
    /** Pre-formatted header, e.g. `'❦ PARLEY · HEART OPENS'`. */
    header: string;
    /**
     * Continue-button label for the ResolvePanel — `'✠ NEXT ROUND'`
     * mid-fight, `'✠ DEPART'` once combat has ended. Lifted onto the
     * VM per Hard Rule #8 (CRITIQUE pass 8 HIGH drain); the screen
     * reads `vm.resolve.nextActionLabel` rather than inlining the
     * literals.
     */
    nextActionLabel: string;
}

// Phase 98 — Updated to player-friendly terminology per combat UX overhaul.
// "LET IT FALL" becomes "COMMIT" to be more comprehensible to new players
// while maintaining the gravity of committing the round. Terminal variant
// uses "COMMIT · IT IS DONE" to signal the encounter is about to release.
const COMMIT_LABEL = 'COMMIT ━━━━━ ▸';
const COMMIT_TERMINAL_LABEL = 'COMMIT · IT IS DONE ▸';

export interface CombatLogEntryDisplay {
    severity: LogSeverity;
    text: string;
}

/**
 * One row in the prototype's vertical phase stack — the centerpiece of
 * the STRIFE redesign per `prototype.jsx:238-281` (PhaseStackLive).
 * The four engine phases (stance → action → skill → resolving) render
 * as a vertical list, each in one of three states:
 *
 *   - `past`    : collapsed one-line summary with the chosen value
 *                 (e.g. `'BODY'`, `'STRIKE'`); dim caption color.
 *   - `current` : expanded panel with the active picker inline and a
 *                 sulfur dot indicator on the header strip.
 *   - `future`  : dimmed label only; ash color; no body.
 *
 * The skill row only appears when the action picked was `'skill'`
 * (`visible: false` otherwise). Lifted onto the VM so the screen
 * carries no phase-label or summary literals (Hard Rule #8).
 */
export type PhaseStackEntryState = 'past' | 'current' | 'future';

export interface PhaseStackEntry {
    /** Engine phase key (matches `CombatViewModel.phase`). */
    key: CombatPhaseKey;
    /**
     * Display label — `"I · STAND"` / `"II · DO"` / `"III · CRAFT"` /
     * `"IV · LET"`. Mono-shaped numerals + sans uppercase verb.
     */
    label: string;
    /** Render state relative to the current engine phase. */
    state: PhaseStackEntryState;
    /**
     * Past-state summary value (e.g. `'BODY'` for a committed stance,
     * `'SKILL'` for a committed action). Sourced from
     * `combat.playerChoice.stance` (past stance row) +
     * `combat.playerChoice.action` (past action row); the engine
     * preserves both across phase changes. Empty string on future
     * rows (no spoiler on un-committed phases) and on the skill row
     * (the engine doesn't yet expose the picked skill id; future
     * refinement once the skill VM ships its selection surface). The
     * Phase 38 close-out pinned the stance + action contracts
     * hermetically (see `state/e2e/combat.engine.test.ts`).
     */
    summary: string;
    /**
     * False for the skill row when the player picked a non-skill action
     * (so the skill phase doesn't render in the stack). True for every
     * other row regardless of state.
     */
    visible: boolean;
}

export interface CrucibleToken {
    /** Token type key (body, mind, heart, fallacy, paradox). */
    key: string;
    /** Token display glyph (◐, ◑, ◒, ◓, ◉). */
    glyph: string;
    /** Short display name (BOD, MND, HRT, FAL, PRX). */
    short: string;
    /** Current token count from engine state. */
    count: number;
    /** Display color for the token. */
    color: string;
}

export interface MercyChoiceSlice {
    /** True when the mercy choice modal should be shown. */
    isActive: boolean;
    /** Enemy name for context in the modal. */
    enemyName: string;
    /** Spare/befriend choice display label. */
    spareLabel: string;
    /** Spare/befriend choice hint text. */
    spareHint: string;
    /** Exploit/critical choice display label. */
    exploitLabel: string;
    /** Exploit/critical choice hint text. */
    exploitHint: string;
    /** Accessibility labels for the choices. */
    a11y: {
        spare: string;
        exploit: string;
    };
}

export interface CombatViewModel {
    /** True when the engine has an active `combat` slice. */
    isInCombat: boolean;
    /** Current engine phase. `'choosing_stance'` when no combat is active. */
    phase: CombatPhaseKey;
    /** 1-based current round number; `1` when no combat is active. */
    round: number;
    /** Composed HUD slice. */
    hud: CombatHudViewModel;
    /** Enemy display summary. */
    enemy: CombatEnemySummary;
    /** Player display summary. */
    player: CombatPlayerSummary;
    /** Friendship counter (Heart-stance parley track). */
    friendshipCounter: number;
    /** Engine-defined ceiling for the friendship counter. */
    friendshipCounterMax: number;
    /** Crucible tokens read from engine combat resources. */
    crucibleTokens: readonly CrucibleToken[];
    stancePicker: StancePickerSlice;
    actionPicker: ActionPickerSlice;
    skillPicker: SkillPickerSlice;
    resolve: ResolveSlice;
    /** Mercy choice modal state (Phase 103). */
    mercyChoice: MercyChoiceSlice;
    /** Full battle log; render in a scroll view. */
    log: readonly CombatLogEntryDisplay[];
    /**
     * Placeholder rendered when `log` is empty (combat just started).
     * Lowercase ritual register; the screen renders verbatim — no
     * view-layer literals (Hard Rule #8).
     */
    logEmptyMessage: string;
    /** Header line for the current phase. */
    phaseHeader: string;
    /** 0-based phase index for pip rendering (-1 when combat ended). */
    phaseIndex: number;
    /** Ordered phase keys (matches the pips). */
    phaseOrder: readonly CombatPhaseKey[];
    /**
     * Vertical phase stack (Phase 32 design-handoff port, 2026-05-16).
     * One entry per phase in render order, each carrying its state
     * (past/current/future), label, and past-summary. Drives the
     * `PhaseStack` component on `app/(tabs)/combat.tsx` which
     * replaced the horizontal swipe carousel.
     */
    phaseStack: readonly PhaseStackEntry[];
    /**
     * Pre-formatted "round token" used in the phase header / VS panel,
     * e.g. `'iv vs i'`. Numerals are the player and enemy round counts.
     */
    roundToken: string;
    /**
     * Visible placeholder rendered while the combat tab is bootstrapping
     * its mock encounter (the brief window between mount and the
     * `actions.startCombat` useEffect firing). The pre-Phase-30 screen
     * rendered an empty `<View>` here, which the user observed as
     * "combat encounter is blank." Surfacing this string makes the
     * loading state visible. Lowercase ritual register; the view
     * renders with `textTransform: 'uppercase'` (Hard Rule #8 — no
     * view-layer literals).
     */
    loadingMessage: string;
    /** Accessibility labels for interactive elements. */
    a11y: {
        stanceHeart: string;
        stanceBody: string;
        stanceMind: string;
        actionAttack: string;
        actionDefend: string;
        actionSkill: string;
        actionItem: string;
        playerHp: string;
        playerMana: string;
        enemyHp: string;
        phaseHeader: string;
        roundInfo: string;
    };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PHASE_ORDER: readonly CombatPhaseKey[] = [
    'choosing_stance',
    'choosing_action',
    'choosing_skill',
    'resolving',
];

const PHASE_LABELS: Record<CombatPhaseKey, string> = {
    choosing_stance: '✠ Choose Your Guard',
    choosing_action: '✠ Your Move',
    choosing_skill: '✠ Select Technique',
    resolving: '✠ Strike Unfolds',
    ended: '✠ THE FIGHT IS OVER',
};

/**
 * Vertical-stack labels per prototype.jsx:247 — mono-shaped Roman
 * numeral + sans uppercase verb. Distinct from `PHASE_LABELS` (which
 * powers the top-of-screen header strip with the `✠` flourish). The
 * stack labels are tighter so the past-row collapses cleanly to a
 * single line.
 */
const PHASE_STACK_LABELS: Record<CombatPhaseKey, string> = {
    choosing_stance: 'I · STAND',
    choosing_action: 'II · DO',
    choosing_skill: 'III · CRAFT',
    resolving: 'IV · LET',
    ended: 'IV · LET',
};

const PHASE_STACK_ORDER: readonly CombatPhaseKey[] = [
    'choosing_stance',
    'choosing_action',
    'choosing_skill',
    'resolving',
];

/**
 * Build the vertical phase-stack rows from the current engine phase +
 * picker state. Past-state summary is the chosen value where the
 * engine preserves it: stance is read from `playerChoice.stance` and
 * action from `playerChoice.action` (both survive phase transitions).
 * The skill row's summary stays empty for now — the engine exposes
 * the picked skill id but the presenter has no library-friendly
 * label resolution yet; a future Phase 21 follow-up can populate it.
 * Phase 38 hermetically pinned the stance + action past-summary
 * contracts (combat.engine.test.ts).
 */
function buildPhaseStack(
    currentPhase: CombatPhaseKey,
    selectedStance: StanceKey | null,
    pickedAction: ActionKey | null,
): readonly PhaseStackEntry[] {
    const currentIdx = PHASE_STACK_ORDER.indexOf(
        currentPhase === 'ended' ? 'resolving' : currentPhase,
    );
    return PHASE_STACK_ORDER.map((key, i): PhaseStackEntry => {
        const state: PhaseStackEntryState =
            currentIdx < 0
                ? 'future'
                : i < currentIdx
                  ? 'past'
                  : i === currentIdx
                    ? 'current'
                    : 'future';
        // Skill row hides until the action picker commits 'skill', so the
        // stack reads as 3 rows in the common (non-skill) flow and 4 rows
        // when the player invokes a skill. Also visible when the engine
        // is actively in `choosing_skill` (defensive — should imply
        // pickedAction === 'skill' but guard against engine drift).
        const visible =
            key === 'choosing_skill'
                ? pickedAction === 'skill' || currentPhase === 'choosing_skill'
                : true;
        let summary = '';
        if (state === 'past') {
            if (key === 'choosing_stance' && selectedStance !== null) {
                summary = STANCE_LABEL[selectedStance];
            } else if (key === 'choosing_action' && pickedAction !== null) {
                summary = pickedAction.toUpperCase();
            }
        }
        return Object.freeze({
            key,
            label: PHASE_STACK_LABELS[key],
            state,
            summary,
            visible,
        });
    });
}

const STANCE_LABEL: Record<StanceKey, string> = {
    heart: 'HEART',
    body: 'BODY',
    mind: 'MIND',
};

/** Heart > Body > Mind > Heart — `BEATS[a] === b` ⇔ `a` has advantage over `b`. */
const BEATS: Record<StanceKey, StanceKey> = {
    heart: 'body',
    body: 'mind',
    mind: 'heart',
};

/**
 * Map a Character's engine `derivedStats` (nine values — three per
 * Heart/Body/Mind dimension) to the stance picker's `{attack, skill,
 * defense}` triple per stance. Rounds at the boundary because engine
 * stats are real-valued (`baseStat * STAT_MULTIPLIERS.*`) but the
 * HUD treats them as whole numbers. Returns zero-filled triples when
 * `derivedStats` is absent (early boot / pre-migration fixtures).
 */
function deriveStancePerformance(
    derivedStats: DerivedStats | undefined,
): Record<StanceKey, { attack: number; skill: number; defense: number }> {
    if (!derivedStats) {
        const zero = { attack: 0, skill: 0, defense: 0 };
        return { heart: zero, body: zero, mind: zero };
    }
    return {
        heart: {
            attack: Math.round(derivedStats.emotionalAttack ?? 0),
            skill: Math.round(derivedStats.emotionalSkill ?? 0),
            defense: Math.round(derivedStats.emotionalDefense ?? 0),
        },
        body: {
            attack: Math.round(derivedStats.physicalAttack ?? 0),
            skill: Math.round(derivedStats.physicalSkill ?? 0),
            defense: Math.round(derivedStats.physicalDefense ?? 0),
        },
        mind: {
            attack: Math.round(derivedStats.mentalAttack ?? 0),
            skill: Math.round(derivedStats.mentalSkill ?? 0),
            defense: Math.round(derivedStats.mentalDefense ?? 0),
        },
    };
}

const ACTION_DEFAULTS: readonly ActionOption[] = [
    {
        key: 'attack',
        label: 'ATTACK',
        hint: 'DEAL DAMAGE BY STANCE',
        iconKind: 'sword',
        accentKind: 'blood',
        enabled: true,
    },
    {
        key: 'defend',
        label: 'DEFEND',
        hint: 'REDUCE NEXT HARM',
        iconKind: 'shield',
        accentKind: 'parchment',
        enabled: true,
    },
    {
        key: 'skill',
        label: 'SKILL',
        // User-direct 2026-05-23: drop the "mana" word from
        // user-visible chrome — mana isn't a player-facing
        // single-number mechanic anymore (Phase-62 swept the HUD
        // bar; this is the trailing hint copy).
        hint: 'INVOKE A CRAFT',
        iconKind: 'arcane',
        accentKind: 'sulfur',
        enabled: true,
    },
    {
        key: 'item',
        label: 'ITEM',
        hint: 'USE A CONSUMABLE',
        iconKind: 'bag',
        accentKind: 'rust',
        enabled: false,
    },
];

const EMPTY_ENEMY: CombatEnemySummary = {
    name: '',
    tier: '',
    hp: 0,
    hpMax: 0,
    hpRatio: 0,
    lastStance: null,
    mindMarks: 0,
    effects: [],
    flavor: '',
};

const EMPTY_PLAYER: CombatPlayerSummary = {
    hp: 0,
    hpMax: 0,
    hpRatio: 0,
    totalResources: 0,
    maxResources: 20,
    resourceRatio: 1,
    effects: [],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toStanceKey(value: unknown): StanceKey | null {
    if (value === 'heart' || value === 'body' || value === 'mind') return value;
    return null;
}

function safeRatio(value: number, max: number): number {
    if (!isFinite(value) || !isFinite(max) || max <= 0) return 0;
    if (value <= 0) return 0;
    if (value >= max) return 1;
    return value / max;
}

function classifyEffect(rawEffect: unknown): CombatEffectDisplay {
    // The engine's ActiveEffect shape (per Spec 03 wiring) gives us
    // `effectId`, `intensity`, `remainingDuration`, plus optional
    // metadata depending on tier. We never trust callers to give us
    // anything more than that — anything missing falls back to a
    // sensible default so the chip still renders.
    //
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eff = (rawEffect ?? {}) as Record<string, any>;
    const idRaw: string =
        typeof eff.effectId === 'string'
            ? eff.effectId
            : typeof eff.id === 'string'
                ? eff.id
                : typeof eff.kind === 'string'
                    ? eff.kind
                    : '';
    const id = idRaw.toLowerCase();
    const engineDef = idRaw ? lookupEffect(idRaw) : null;
    const name: string =
        typeof eff.name === 'string' && eff.name.length > 0
            ? eff.name
            : engineDef?.name ?? (idRaw || 'EFFECT');

    const kind = inferEffectKind(id);
    const tint = inferEffectTint(eff, kind);

    const rawDuration = eff.remainingDuration ?? eff.duration ?? null;
    const duration =
        rawDuration === null || rawDuration === undefined
            ? null
            : Number(rawDuration);
    const intensity = Math.max(1, Number(eff.intensity ?? 1));

    return {
        kind,
        effectId: idRaw,
        name,
        duration:
            duration !== null && isFinite(duration) ? Math.max(0, duration) : null,
        intensity,
        tint,
    };
}

function inferEffectKind(idLower: string): string {
    if (idLower.includes('poison')) return 'poison';
    if (idLower.includes('bleed')) return 'bleed';
    if (idLower.includes('stun')) return 'stun';
    if (idLower.includes('burn') || idLower.includes('fire')) return 'burn';
    if (idLower.includes('regen') || idLower.includes('heal')) return 'regen';
    if (idLower.includes('mark')) return 'debuff';
    return idLower || 'effect';
}

function inferEffectTint(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    eff: Record<string, any>,
    kind: string,
): 'buff' | 'debuff' | null {
    const t = typeof eff.tint === 'string' ? eff.tint.toLowerCase() : null;
    if (t === 'buff' || t === 'debuff') return t;
    if (typeof eff.type === 'string') {
        const ty = eff.type.toLowerCase();
        if (ty === 'buff') return 'buff';
        if (ty === 'debuff') return 'debuff';
    }
    if (kind === 'poison' || kind === 'bleed' || kind === 'stun' || kind === 'burn' || kind === 'debuff') {
        return 'debuff';
    }
    if (kind === 'regen') return 'buff';
    return null;
}

function mindMarkCount(effects: readonly unknown[]): number {
    let n = 0;
    for (const raw of effects) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const eff = (raw ?? {}) as Record<string, any>;
        const id: string =
            typeof eff.effectId === 'string'
                ? eff.effectId
                : typeof eff.id === 'string'
                    ? eff.id
                    : '';
        if (id.toLowerCase().includes('mind_mark') || id === 'tier1_mind_mark') {
            n += Math.max(1, Number(eff.intensity ?? 1));
        }
    }
    return n;
}

/**
 * Calculate total combat resources from engine state (Phase 105).
 * Uses engine truth instead of legacy combatMana slice.
 */
function calculateResourceTotals(resources: ResourcePool): { totalResources: number; maxResources: number; resourceRatio: number } {
    const totalResources = resources.body + resources.mind + resources.heart + 
                          resources.fallacy + resources.paradox;
    
    // Estimate max resources based on typical starting values
    const maxResources = 20;
    
    return {
        totalResources,
        maxResources,
        resourceRatio: maxResources > 0 ? safeRatio(totalResources, maxResources) : 1,
    };
}

function rawStanceAdvantage(
    playerStance: StanceKey,
    enemyStance: StanceKey | null,
): AdvantageKind {
    if (enemyStance === null) return 'neutral';
    if (BEATS[playerStance] === enemyStance) return 'adv';
    if (BEATS[enemyStance] === playerStance) return 'dis';
    return 'neutral';
}

/**
 * Mobile `AdvantageKind` ('adv' | 'dis' | 'neutral') is the
 * presenter's wire shape for the stance chip. The engine's
 * `Advantage` is ('advantage' | 'disadvantage' | 'neutral').
 * Map between them at the engine boundary.
 */
function toMobileAdvantage(adv: Advantage): AdvantageKind {
    if (adv === 'advantage') return 'adv';
    if (adv === 'disadvantage') return 'dis';
    return 'neutral';
}

function toEngineAdvantage(kind: AdvantageKind): Advantage {
    if (kind === 'adv') return 'advantage';
    if (kind === 'dis') return 'disadvantage';
    return 'neutral';
}

/**
 * Stance-vs-stance advantage as the *engine* would resolve it
 * for the upcoming roll. Composes the raw triangle (`BEATS`)
 * with the player's active effects via the engine's
 * `resolveEffectiveAdvantage` — so effects like "Inspired"
 * (advantage grants) or "Off-balance" (advantage denies) flip
 * the chip the player sees. Closes the [5.0] DRIFT row from
 * `docs/mechanics-ui-audit-2026-05-21-combat.md`.
 */
function stanceAdvantage(
    playerStance: StanceKey,
    enemyStance: StanceKey | null,
    playerEffects: readonly ActiveEffect[],
): AdvantageKind {
    const raw = rawStanceAdvantage(playerStance, enemyStance);
    if (playerEffects.length === 0) return raw;
    const effective = resolveEffectiveAdvantage(
        toEngineAdvantage(raw),
        // engine signature wants a mutable array; pass a shallow
        // copy to satisfy it without leaking mutation back.
        [...playerEffects],
        playerStance as Stance,
    );
    return toMobileAdvantage(effective);
}

function advantageLabelFor(kind: AdvantageKind): 'ADVANTAGE' | 'DISADVANTAGE' | 'NEUTRAL' {
    if (kind === 'adv') return 'ADVANTAGE';
    if (kind === 'dis') return 'DISADVANTAGE';
    return 'NEUTRAL';
}

const STANCE_GLOSS: Record<StanceKey, string> = {
    heart: 'parley, mercy',
    body: 'iron, force',
    mind: 'cipher, ruse',
};

function buildStanceOptions(
    derivedStats: DerivedStats | undefined,
    enemyLastStance: StanceKey | null,
    playerEffects: readonly ActiveEffect[] = [],
): readonly StanceOption[] {
    const perStance = deriveStancePerformance(derivedStats);
    return STANCES.map((key) => {
        const counters = BEATS[key];
        const weakTo = (Object.keys(BEATS) as StanceKey[]).find(
            (k) => BEATS[k] === key,
        ) ?? 'heart';
        return {
            key,
            label: STANCE_LABEL[key],
            counters: STANCE_LABEL[counters],
            weakTo: STANCE_LABEL[weakTo],
            derived: perStance[key],
            advantage: stanceAdvantage(key, enemyLastStance, playerEffects),
            gloss: STANCE_GLOSS[key],
        };
    });
}

interface ResourcePool {
    body: number; mind: number; heart: number;
    fallacy: number; paradox: number;
}

const EMPTY_POOL: ResourcePool = { body: 0, mind: 0, heart: 0, fallacy: 0, paradox: 0 };

function buildCrucibleTokens(resources: ResourcePool): readonly CrucibleToken[] {
    const { AXM } = require('@/theme/axm');
    return [
        { key: 'body', glyph: '◐', short: 'BOD', count: resources.body, color: AXM.blood },
        { key: 'heart', glyph: '◑', short: 'HRT', count: resources.heart, color: AXM.sulfur },
        { key: 'mind', glyph: '◒', short: 'MND', count: resources.mind, color: AXM.rust },
        { key: 'fallacy', glyph: '◓', short: 'FAL', count: resources.fallacy, color: AXM.bone },
        { key: 'paradox', glyph: '◉', short: 'PRX', count: resources.paradox, color: AXM.parchment },
    ];
}

function canAffordSkill(cost: { body?: number; mind?: number; heart?: number; fallacy?: number; paradox?: number }, pool: ResourcePool): boolean {
    return (cost.body ?? 0) <= pool.body
        && (cost.mind ?? 0) <= pool.mind
        && (cost.heart ?? 0) <= pool.heart
        && (cost.fallacy ?? 0) <= pool.fallacy
        && (cost.paradox ?? 0) <= pool.paradox;
}

function buildSkillPicker(
    stance: StanceKey,
    resources: ResourcePool,
    equippedSkills?: readonly string[],
): SkillPickerSlice {
    const pool = equippedSkills
        ? COMBAT_SKILLS.filter((s) => equippedSkills.includes(s.id))
        : COMBAT_SKILLS;
    const skills: SkillOption[] = pool.map((s) => {
        const wrongStance = s.stance !== stance;
        const tooExpensive = !canAffordSkill(s.resourceCost, resources);
        let disabledReason: SkillOption['disabledReason'] = null;
        if (wrongStance) disabledReason = 'wrong-stance';
        else if (tooExpensive) disabledReason = 'insufficient-resources';
        return {
            id: s.id,
            name: s.name,
            description: s.description,
            category: s.category,
            stance: s.stance,
            manaCost: s.manaCost,
            enabled: !wrongStance && !tooExpensive,
            disabledReason,
        };
    });
    const availableCount = skills.filter((s) => s.enabled).length;
    return {
        skills,
        availableCount,
        totalCount: skills.length,
    };
}

// Lowercase-Roman helper consolidated into `./roman` — `toRoman` is
// imported at the top of the file.

function classifyLogEntry(raw: unknown): CombatLogEntryDisplay {
    if (typeof raw === 'string') {
        return { severity: 'info', text: raw };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = (raw ?? {}) as Record<string, any>;
    const text =
        typeof e.text === 'string' && e.text.length > 0
            ? e.text
            : typeof e.message === 'string'
                ? e.message
                : '';
    const sevRaw =
        typeof e.severity === 'string'
            ? e.severity.toLowerCase()
            : typeof e.kind === 'string'
                ? e.kind.toLowerCase()
                : 'info';
    const severity: LogSeverity = ((): LogSeverity => {
        switch (sevRaw) {
            case 'damage':
            case 'crit':
            case 'heal':
            case 'effect':
            case 'friendship':
            case 'system':
            case 'info':
                return sevRaw;
            default:
                return 'info';
        }
    })();
    return { severity, text };
}

function resolveSliceFromState(
    playerStance: StanceKey | null,
    enemyStance: StanceKey | null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    combat: Record<string, any> | null,
): ResolveSlice {
    const pStance: StanceKey = playerStance ?? 'heart';
    const eStance: StanceKey = enemyStance ?? 'mind';
    // Thread player effects so resolve-slice advantage stays
    // consistent with the picker chip (engine's
    // resolveEffectiveAdvantage applies effect-driven flips).
    const playerEffects: readonly ActiveEffect[] = Array.isArray(combat?.player?.effects)
        ? (combat.player.effects as readonly ActiveEffect[])
        : [];
    const adv = stanceAdvantage(pStance, eStance, playerEffects);
    const advantageLabel = advantageLabelFor(adv);

    // The engine's combat state doesn't expose a structured "last
    // round resolution" today. The action layer stashes the latest
    // resolve metadata under `combat.lastResolution` (opaque to the
    // engine — `BattleLogEntry` is treated as `any` in the published
    // types). We read it defensively; everything is optional.
    const last = combat?.lastResolution ?? null;
    const playerRoll = Number(last?.playerRoll ?? 0);
    const enemyRoll = Number(last?.enemyRoll ?? 0);
    const outcomeRaw = typeof last?.outcome === 'string' ? last.outcome : 'miss';
    const outcome: ResolveOutcomeKind =
        outcomeRaw === 'damage' || outcomeRaw === 'crit' || outcomeRaw === 'friendship' || outcomeRaw === 'miss'
            ? outcomeRaw
            : 'miss';
    const primaryText = typeof last?.primaryText === 'string' ? last.primaryText : '—';
    const message = typeof last?.message === 'string' ? last.message : '';
    let header: string;
    switch (outcome) {
        case 'friendship':
            header = '❦ PARLEY · HEART OPENS';
            break;
        case 'crit':
            header = '✶ CRIT · DOUBLE';
            break;
        case 'damage':
            header = 'STRIKE LANDS';
            break;
        default:
            header = '… NO BLOW LANDS';
    }
    const phaseRaw = String(combat?.phase ?? 'choosing_stance');
    // Phase 72 — `'ended'` is the post-resolve terminal state where
    // the encounter is about to release. Use the heavier "IT IS DONE"
    // variant so the player feels the weight of the closing blow.
    // Mid-fight rounds use the standard heavy-line label.
    const nextActionLabel = phaseRaw === 'ended'
        ? COMMIT_TERMINAL_LABEL
        : COMMIT_LABEL;
    return {
        playerStance: pStance,
        enemyStance: eStance,
        advantageLabel,
        advantageKind: adv,
        playerRoll: isFinite(playerRoll) ? playerRoll : 0,
        enemyRoll: isFinite(enemyRoll) ? enemyRoll : 0,
        outcome,
        primaryText,
        message,
        header,
        nextActionLabel,
    };
}

// Use the engine's `determineAdvantage` to sanity-check our local
// `BEATS` mapping. This is a dev-only assertion; if the engine ever
// changes the triangle the test suite will catch it before users do.
// (Kept as a side-free helper — never throws in prod.)
function _devAssertTriangleMatchesEngine(): void {
    /* istanbul ignore if */
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
        for (const a of STANCES) {
            for (const b of STANCES) {
                const expected = BEATS[a] === b ? 'advantage' : BEATS[b] === a ? 'disadvantage' : 'neutral';
                const got = determineAdvantage(a, b);
                /* istanbul ignore next */
                if (got !== expected && got !== 'neutral' && expected !== 'neutral') {
                    /* istanbul ignore next */
                    if (__DEV__) {
                        // eslint-disable-next-line no-console
                        console.warn('[combat.engine] stance triangle drift', a, b, got, expected);
                    }
                }
            }
        }
    }
}
_devAssertTriangleMatchesEngine();

declare const __DEV__: boolean | undefined;

/**
 * Phase 104 — Build mercy choice slice from engine-emitted mercy state only.
 * 
 * [needs-engine-release] — Replaced local friendship threshold simulation
 * with engine truth consumption. Requires mechanics package to export:
 * - `combat.mercyChoiceState` (or similar) with `isActive` boolean
 * - Engine actions for spare/exploit dispatch (not local damage simulation)
 * - Engine-emitted mercy choice options/labels
 * 
 * For now, mercy choice is disabled until engine contracts are available.
 */
function buildMercyChoiceSlice(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    combat: Record<string, any> | null,
    enemyName: string,
    friendshipCounter: number,
): MercyChoiceSlice {
    // Phase 104 — Remove local friendship threshold logic per doctrine cleanup.
    // Mercy choice activation must come from engine-emitted state, not mobile
    // simulation. Use the engine's mercy choice state.
    
    const isActive = combat?.mercyChoiceActive ?? false;
    
    const cleanEnemyName = combat === null ? '' : (enemyName || 'ADVERSARY');
    
    return {
        isActive,
        enemyName: cleanEnemyName,
        spareLabel: 'SPARE',
        spareHint: `preserve ${cleanEnemyName.toLowerCase()} · path of mercy`,
        exploitLabel: 'EXPLOIT',
        exploitHint: 'seize the opening · guaranteed critical',
        a11y: {
            spare: `Spare ${cleanEnemyName}, choosing mercy and consequence`,
            exploit: `Exploit the opening for a guaranteed critical attack against ${cleanEnemyName}`,
        },
    };
}

function buildCombatA11y(
    enemy: CombatEnemySummary,
    player: CombatPlayerSummary,
    phase: CombatPhaseKey,
    round: number,
    isInCombat: boolean,
): CombatViewModel['a11y'] {
    const enemyHpText = isInCombat 
        ? `${enemy.name} has ${enemy.hp} of ${enemy.hpMax} health`
        : 'No enemy';
    const playerHpText = `You have ${player.hp} of ${player.hpMax} health`;
    const playerManaText = `You have ${player.totalResources} of ${player.maxResources} focus`;
    const phaseText = phase === 'ended' 
        ? 'Combat has ended' 
        : `Combat phase: ${PHASE_LABELS[phase]}`;
    const roundText = isInCombat 
        ? `Round ${round}` 
        : 'Combat not started';

    return {
        stanceHeart: 'Choose Heart stance, beats Body, weak to Mind',
        stanceBody: 'Choose Body stance, beats Mind, weak to Heart', 
        stanceMind: 'Choose Mind stance, beats Heart, weak to Body',
        actionAttack: 'Attack with equipped weapon',
        actionDefend: 'Defend to reduce next harm',
        actionSkill: 'Use a skill that costs focus',
        actionItem: 'Use an item from inventory',
        playerHp: playerHpText,
        playerMana: playerManaText,
        enemyHp: enemyHpText,
        phaseHeader: phaseText,
        roundInfo: roundText,
    };
}

// ---------------------------------------------------------------------------
// Main selector
// ---------------------------------------------------------------------------

export function selectCombatViewModel(
    state: AppStoreState,
    localUi: CombatLocalUi = {},
): CombatViewModel {
    const hud = selectCombatHudViewModel(state);
    const combat = state.combat;

    if (combat === null) {
        const stancePicker: StancePickerSlice = {
            options: buildStanceOptions(state.player?.derivedStats, null),
            selected: localUi.selectedStance ?? null,
            canConfirm: false,
        };
        const skillPicker = buildSkillPicker(stancePicker.selected ?? 'heart', EMPTY_POOL);
        const vm = {
            isInCombat: false,
            phase: 'choosing_stance' as CombatPhaseKey,
            round: 1,
            hud,
            enemy: EMPTY_ENEMY,
            player: EMPTY_PLAYER,
            friendshipCounter: 0,
            friendshipCounterMax: FRIENDSHIP_COUNTER_MAX,
            crucibleTokens: buildCrucibleTokens(EMPTY_POOL),
            stancePicker,
            actionPicker: {
                options: ACTION_DEFAULTS,
                fleeAvailable: true,
                fleeMessage: 'No fleeing yet.',
                fleeHint: 'or … flee like a craven (luck save)',
                itemMessage: 'Hands are empty.',
            },
            skillPicker,
            resolve: resolveSliceFromState(null, null, null),
            mercyChoice: buildMercyChoiceSlice(null, '', 0),
            log: [],
            logEmptyMessage: 'The air shivers. Combat begins.',
            loadingMessage: 'the field stirs.',
            phaseHeader: PHASE_LABELS.choosing_stance,
            phaseIndex: 0,
            phaseOrder: PHASE_ORDER,
            phaseStack: buildPhaseStack('choosing_stance', null, null),
            roundToken: 'i vs i',
            a11y: buildCombatA11y(EMPTY_ENEMY, EMPTY_PLAYER, 'choosing_stance', 1, false),
        };
        return freezeViewModel(vm);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = combat as unknown as Record<string, any>;
    const enemyEntity = c.enemy ?? {};
    const playerEntity = c.player ?? state.player;
    const phaseRaw = String(c.phase ?? 'choosing_stance');
    const phase: CombatPhaseKey =
        phaseRaw === 'choosing_stance'
            || phaseRaw === 'choosing_action'
            || phaseRaw === 'choosing_skill'
            || phaseRaw === 'resolving'
            || phaseRaw === 'ended'
            ? phaseRaw
            : 'choosing_stance';

    const enemyEffectsRaw: readonly unknown[] = Array.isArray(enemyEntity.effects) ? enemyEntity.effects : [];
    const playerEffectsRaw: readonly unknown[] = Array.isArray(playerEntity.effects) ? playerEntity.effects : [];

    const enemyHp = Number(enemyEntity.health ?? 0);
    const enemyHpMax = Number(enemyEntity.maxHealth ?? enemyHp);
    const enemyLastStance = toStanceKey(c.enemyChoice?.stance ?? null);
    const enemyName = String(enemyEntity.name ?? '').toUpperCase();
    const enemyFlavor = typeof enemyEntity.description === 'string'
        ? enemyEntity.description
        : '';

    const enemy: CombatEnemySummary = {
        name: enemyName,
        tier: String(enemyEntity.difficulty ?? ''),
        hp: enemyHp,
        hpMax: enemyHpMax,
        hpRatio: safeRatio(enemyHp, enemyHpMax),
        lastStance: enemyLastStance,
        mindMarks: mindMarkCount(enemyEffectsRaw),
        effects: enemyEffectsRaw.slice(0, MAX_EFFECTS_SHOWN).map(classifyEffect),
        flavor: enemyFlavor,
    };

    const playerHp = Number(playerEntity.health ?? 0);
    const playerHpMax = Number(playerEntity.maxHealth ?? playerHp);
    const rawResources = c.combatResources ?? null;
    const resources: ResourcePool = rawResources !== null
        ? {
            body: Number(rawResources.body ?? 0),
            mind: Number(rawResources.mind ?? 0),
            heart: Number(rawResources.heart ?? 0),
            fallacy: Number(rawResources.fallacy ?? 0),
            paradox: Number(rawResources.paradox ?? 0),
        }
        : EMPTY_POOL;
    const resourceTotals = calculateResourceTotals(resources);
    const player: CombatPlayerSummary = {
        hp: playerHp,
        hpMax: playerHpMax,
        hpRatio: safeRatio(playerHp, playerHpMax),
        ...resourceTotals,
        effects: playerEffectsRaw.slice(0, MAX_EFFECTS_SHOWN).map(classifyEffect),
    };

    // Phase 65 Tick B — no default stance. `previewStance` is `null`
    // until the player either previews via `localUi.selectedStance`
    // (React-side selection) or commits via the engine
    // `playerChoice.stance`. The screen reads `null` as "no card
    // highlighted" so combat entry shows no pre-selected stance.
    const previewStance: StanceKey | null =
        localUi.selectedStance
            ?? toStanceKey(c.playerChoice?.stance ?? null);

    // Thread player effects so `resolveEffectiveAdvantage` (engine)
    // can flip stance chips when effects grant/deny advantage. Empty
    // array on the no-combat path (handled via the default arg above).
    const playerActiveEffects: readonly ActiveEffect[] = Array.isArray(playerEntity.effects)
        ? (playerEntity.effects as readonly ActiveEffect[])
        : [];
    const stancePicker: StancePickerSlice = {
        options: buildStanceOptions(playerEntity.derivedStats, enemy.lastStance, playerActiveEffects),
        selected: previewStance,
        canConfirm: phase === 'choosing_stance',
    };

    // Phase 97 — Fix skill filtering per CRITIQUE [HIGH]. Drop the equipped-gate
    // for learned skills; show all learned skills but filter only by usability
    // (right stance + sufficient resources). Once a skill is learned it should
    // be available in combat. The picker shows all COMBAT_SKILLS (treated as
    // learned skills) and disables only those that are wrong stance or too
    // expensive, not those that are "not equipped".
    const skillPicker = buildSkillPicker(previewStance ?? 'heart', resources);

    const phaseIndex: number = phase === 'ended' ? -1 : PHASE_ORDER.indexOf(phase);
    const friendshipCounter = Number(c.friendshipCounter ?? 0);

    const log: CombatLogEntryDisplay[] = Array.isArray(c.log)
        ? c.log
            .filter((entry: unknown) => {
                if (typeof entry === 'string') return true;
                if (entry === null || typeof entry !== 'object') return false;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const meta = entry as Record<string, any>;
                // Skip pure metadata entries (e.g. lastResolution snapshot).
                return meta.severity !== '__meta';
            })
            .map(classifyLogEntry)
        : [];

    const round = Number(c.round ?? 1);
    const roundToken = `${toRoman(round)} vs ${toRoman(Math.max(1, round - 1))}`;

    const isInCombat = phase !== 'ended';
    const vm = {
        isInCombat,
        phase,
        round,
        hud,
        enemy,
        player,
        friendshipCounter,
        friendshipCounterMax: FRIENDSHIP_COUNTER_MAX,
        crucibleTokens: buildCrucibleTokens(resources),
        stancePicker,
        actionPicker: {
            options: ACTION_DEFAULTS,
            fleeAvailable: true,
            fleeMessage: 'No fleeing yet.',
            fleeHint: 'or … flee like a craven (luck save)',
            itemMessage: 'Hands are empty.',
        },
        skillPicker,
        resolve: resolveSliceFromState(
            toStanceKey(c.playerChoice?.stance ?? null),
            enemy.lastStance,
            c,
        ),
        mercyChoice: buildMercyChoiceSlice(c, enemy.name, friendshipCounter),
        log,
        logEmptyMessage: 'The air shivers. Combat begins.',
        loadingMessage: 'the field stirs.',
        phaseHeader: PHASE_LABELS[phase] ?? PHASE_LABELS.choosing_stance,
        phaseIndex,
        phaseOrder: PHASE_ORDER,
        phaseStack: buildPhaseStack(
            phase,
            toStanceKey(c.playerChoice?.stance ?? null),
            (c.playerChoice?.action ?? null) as ActionKey | null,
        ),
        roundToken,
        a11y: buildCombatA11y(enemy, player, phase, round, isInCombat),
    };
    return freezeViewModel(vm);
}

// ---------------------------------------------------------------------------
// React hook
// ---------------------------------------------------------------------------

/**
 * React hook returning a `CombatViewModel` that's stable by reference
 * when the underlying state (and `localUi`) hasn't changed.
 *
 * `selectCombatViewModel` returns a freshly-constructed object on every
 * call (deep-frozen per Spec 03 Q3). Passing that selector straight into
 * Zustand's `useStore` would loop forever — `useSyncExternalStore`
 * requires `getSnapshot` to return a stable reference for the same
 * snapshot. This hook subscribes to the engine slices the VM actually
 * depends on (`combat`, `player`, `combatMana`) and memoises the VM
 * against them.
 *
 * The `'use no memo'` directive opts this hook out of the React Compiler
 * (enabled in `app.json`). The compiler's static analysis cannot see
 * through `store.getState()` reads, so when the factory body's only
 * tracked deps are `selectedStance` / `selectedSkillId` it ends up
 * caching the vm across renders and never re-running on store-state
 * changes — Phase 65 Tick A root-caused this as the cause of [9.8]
 * "vm.phase stuck at choosing_action despite engine combat.phase
 * advancing to resolving". The manual `useMemo` below + the subscribed
 * slice values + the explicit deps array is the correct intent; the
 * compiler must not second-guess it.
 */
export function useCombatViewModel(localUi: CombatLocalUi = {}): CombatViewModel {
    'use no memo';
    const combat = useGameState((s) => s.combat);
    const player = useGameState((s) => s.player);
    const combatMana = useGameState((s) => s.combatMana);
    const selectedStance = localUi.selectedStance;
    const selectedSkillId = localUi.selectedSkillId;
    return useMemo(
        () => {
            // Build a synthetic state object from the subscribed
            // slices instead of reading `store.getState()`. The
            // selector + `selectCombatHudViewModel` only read these
            // three fields off `state`, so the cast is sound. The
            // important consequence is that `combat`, `player`, and
            // `combatMana` are now *real* data dependencies of the
            // factory body — both the `react-hooks/exhaustive-deps`
            // lint and the React Compiler can see them being read
            // here, which they could not see through the previous
            // opaque `store.getState()` call. Combined with the
            // `'use no memo'` directive above, this guarantees the
            // memo recomputes whenever any subscribed slice changes
            // reference. Phase 65 Tick A.
            const state = { combat, player, combatMana } as unknown as AppStoreState;
            return selectCombatViewModel(state, { selectedStance, selectedSkillId });
        },
        [combat, player, combatMana, selectedStance, selectedSkillId],
    );
}
