/**
 * MEMOIR presenter (Phase 33).
 *
 * Pure mapper from `GameStore` to the journal surface's view-model.
 * Phase 33 Tick A ships the SHAPE only — every section returns an
 * empty / placeholder fixture so the screen mounts and tests can pin
 * the contract before the real reads land in Ticks B-D.
 *
 * - Tick A (this commit): VM shape + empty-section placeholders.
 * - Tick B: quests section reads `state.quests` (engine QuestLog).
 * - Tick C: moral + provisional philosophical alignment readouts.
 * - Tick D: chronicle from `state._recentEvents` (Phase 25 ring buffer).
 *
 * The screen consumes this VM via the slim-slice + `useMemo` pattern
 * (Phase 30 Tick A). Calling `useGameState(selectMemoirViewModel)`
 * directly would churn `useSyncExternalStore` because the VM is a
 * frozen-new object every call.
 */

import type { GameStore } from 'axiomancer-mechanics';
import { freezeViewModel } from './freeze';

/**
 * One typed-event-derived chronicle row. Ticks D will populate from
 * the mobile `_recentEvents` ring buffer; Tick A ships an empty list.
 */
export interface ChronicleEntry {
    /** Stable id for keying — composed from event type + ordinal. */
    id: string;
    /** One of the engine event types the chronicle mapper recognizes. */
    kind: 'combat:ended' | 'character:levelup' | 'world:moved' | 'dialogue:applied';
    /** Short ALL-CAPS label rendered as the lead of the row. */
    label: string;
    /** Body line in the gothic body register, rendered beneath the label. */
    body: string;
}

/**
 * One quest row. Tick B will populate from `state.quests`; Tick A
 * ships empty sub-sections.
 */
export interface MemoirQuestRow {
    id: string;
    name: string;
    description: string;
    status: 'active' | 'completed' | 'failed';
    objectives: ReadonlyArray<{ id: string; text: string; done: boolean }>;
}

/**
 * Moral alignment chip — reads `state.moralMeter` via Tick C.
 * Tick A ships the `'UNDECLARED'` band as a placeholder.
 */
export interface MoralAlignment {
    /** Raw moral-meter value from the engine. Tick A: 0. */
    value: number;
    /** Display chip — band label + theme tint key. */
    chip: { label: string; tintKey: 'blood' | 'rust' | 'bone' | 'sulfur' | 'parchment' };
}

/**
 * Provisional philosophical alignment — Tick C derives from the
 * highest base stat (heart > body > mind, ties → heart) and marks
 * `provisional: true`. The follow-up phase that ships real
 * alignments swaps the mapping without schema change.
 */
export interface PhilosophicalAlignment {
    /** Display label: 'of the Heart' / 'of the Body' / 'of the Mind' / 'untested'. */
    label: string;
    /** One-line rationale shown beneath the label (or empty in the untested state). */
    rationale: string;
    /** Always `true` until exact alignments are defined upstream. */
    provisional: boolean;
}

export interface MemoirViewModel {
    /** Header eyebrow + sub-line. */
    headerEyebrow: string;
    headerSubline: string;
    /** Section eyebrows — pinned on the VM so the screen carries no literals. */
    chronicleEyebrow: string;
    questsEyebrow: string;
    questsActiveEyebrow: string;
    questsCompletedEyebrow: string;
    questsForgottenEyebrow: string;
    measureEyebrow: string;
    /** Chronicle section — Tick D populates from `_recentEvents`. */
    chronicle: ReadonlyArray<ChronicleEntry>;
    /** Quest sections — Tick B populates from `state.quests`. */
    quests: {
        active: ReadonlyArray<MemoirQuestRow>;
        completed: ReadonlyArray<MemoirQuestRow>;
        forgotten: ReadonlyArray<MemoirQuestRow>;
    };
    /** Alignment readouts — Tick C populates. */
    moralAlignment: MoralAlignment;
    philosophicalAlignment: PhilosophicalAlignment;
    /**
     * Philosopher quote slot. Renders nothing when `null` — a
     * follow-up phase wires the lookup once exact alignments + a
     * quote inventory are defined. Tick A through Tick D all emit
     * `null` here.
     */
    philosopherQuote: string | null;
    /** Empty-state copy lines, pinned per Phase 33 brief. */
    emptyChronicle: string;
    emptyQuests: string;
    emptyMoral: string;
    emptyPhilosophical: string;
}

const DEFAULT_MORAL: MoralAlignment = Object.freeze({
    value: 0,
    chip: Object.freeze({ label: 'UNDECLARED', tintKey: 'bone' }),
}) as MoralAlignment;

const DEFAULT_PHILOSOPHICAL: PhilosophicalAlignment = Object.freeze({
    label: 'untested.',
    rationale: '',
    provisional: true,
}) as PhilosophicalAlignment;

const FALLBACK_VM: MemoirViewModel = Object.freeze({
    headerEyebrow: '✠ THE BOOK OF DEEDS',
    headerSubline: 'gathering pages…',
    chronicleEyebrow: '✠ A CHRONICLE',
    questsEyebrow: '✠ ERRANDS',
    questsActiveEyebrow: '✠ AT HAND',
    questsCompletedEyebrow: '✠ COMPLETED',
    questsForgottenEyebrow: '✠ FORGOTTEN',
    measureEyebrow: '✠ MEASURE',
    chronicle: Object.freeze([]) as ReadonlyArray<ChronicleEntry>,
    quests: Object.freeze({
        active: Object.freeze([]) as ReadonlyArray<MemoirQuestRow>,
        completed: Object.freeze([]) as ReadonlyArray<MemoirQuestRow>,
        forgotten: Object.freeze([]) as ReadonlyArray<MemoirQuestRow>,
    }) as MemoirViewModel['quests'],
    moralAlignment: DEFAULT_MORAL,
    philosophicalAlignment: DEFAULT_PHILOSOPHICAL,
    philosopherQuote: null,
    emptyChronicle: 'the page is bare.',
    emptyQuests: 'no errands written here.',
    emptyMoral: 'the scales are level.',
    emptyPhilosophical: 'untested.',
}) as MemoirViewModel;

/**
 * Pure mapper from game state → `MemoirViewModel`.
 *
 * Tick A: returns the FALLBACK shape with the player's display
 * name substituted into the header sub-line where available.
 * Ticks B-D populate the four sections in turn; the shape contract
 * pinned by `state/e2e/memoir.engine.test.ts` is stable across those
 * extensions.
 */
export function selectMemoirViewModel(state: GameStore): MemoirViewModel {
    const player = state.player;
    const subline =
        player && typeof player.name === 'string' && player.name.length > 0
            ? `${player.name}, pilgrim.`
            : FALLBACK_VM.headerSubline;
    return freezeViewModel({
        ...FALLBACK_VM,
        headerSubline: subline,
    });
}
