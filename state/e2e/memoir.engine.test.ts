/**
 * Hermetic E2E Tests — MEMOIR presenter (Phase 33).
 *
 * Tick A pins the VM shape end-to-end. Ticks B-D will extend with
 * quest / alignment / chronicle cases. The shape contract here is
 * stable across those extensions — only the section *contents* fill
 * in.
 *
 * Hermetic = self-contained + deterministic + isolated.
 * See docs/testing.md for the full standard.
 */

import { afterEach, describe, it, expect, jest } from '@jest/globals';
import { createGameStore } from 'axiomancer-mechanics';

import { createMemoryAdapter } from '@/test-utils/memoryAdapter';
import {
    selectMemoirViewModel,
    type MemoirViewModel,
} from '@/state/presenters/memoir.engine';

afterEach(() => {
    jest.restoreAllMocks();
});

describe('selectMemoirViewModel: shape contract', () => {
    it('returns a fully-shaped MemoirViewModel for a fresh game', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm: MemoirViewModel = selectMemoirViewModel(store.getState());

        // Headers + section eyebrows — all sourced from the VM so the
        // screen carries no inline literals (Hard Rule #8).
        expect(typeof vm.headerEyebrow).toBe('string');
        expect(vm.headerEyebrow.length).toBeGreaterThan(0);
        expect(typeof vm.headerSubline).toBe('string');
        expect(vm.headerSubline.length).toBeGreaterThan(0);
        expect(vm.chronicleEyebrow).toBe('✠ A CHRONICLE');
        expect(vm.questsEyebrow).toBe('✠ ERRANDS');
        expect(vm.questsActiveEyebrow).toBe('✠ AT HAND');
        expect(vm.questsCompletedEyebrow).toBe('✠ COMPLETED');
        expect(vm.questsForgottenEyebrow).toBe('✠ FORGOTTEN');
        expect(vm.measureEyebrow).toBe('✠ MEASURE');

        // Sections — Tick A ships empty placeholders.
        expect(Array.isArray(vm.chronicle)).toBe(true);
        expect(vm.chronicle.length).toBe(0);
        expect(Array.isArray(vm.quests.active)).toBe(true);
        expect(Array.isArray(vm.quests.completed)).toBe(true);
        expect(Array.isArray(vm.quests.forgotten)).toBe(true);

        // Alignment defaults — Tick C will populate from state.moralMeter
        // and the highest-base-stat heuristic.
        expect(vm.moralAlignment.value).toBe(0);
        expect(vm.moralAlignment.chip.label).toBe('UNDECLARED');
        expect(vm.moralAlignment.chip.tintKey).toBe('bone');
        expect(vm.philosophicalAlignment.label).toBe('untested.');
        expect(vm.philosophicalAlignment.provisional).toBe(true);

        // Quote slot — null until a follow-up phase wires alignments.
        expect(vm.philosopherQuote).toBeNull();

        // Empty-state copy locked per the brief.
        expect(vm.emptyChronicle).toBe('the page is bare.');
        expect(vm.emptyQuests).toBe('no errands written here.');
        expect(vm.emptyMoral).toBe('the scales are level.');
        expect(vm.emptyPhilosophical).toBe('untested.');
    });

    it('substitutes the player name into the header sub-line when available', () => {
        const store = createGameStore(createMemoryAdapter());
        // Fresh-game player is created with a default name. Confirm the
        // sub-line picks that name up rather than falling back.
        const playerName = store.getState().player?.name ?? '';
        const vm = selectMemoirViewModel(store.getState());

        if (playerName.length > 0) {
            expect(vm.headerSubline).toContain(playerName);
            expect(vm.headerSubline.endsWith('pilgrim.')).toBe(true);
        }
    });

    it('returns a deep-frozen view model so callers cannot mutate it', () => {
        const store = createGameStore(createMemoryAdapter());
        const vm = selectMemoirViewModel(store.getState());

        expect(Object.isFrozen(vm)).toBe(true);
        expect(Object.isFrozen(vm.quests)).toBe(true);
        expect(Object.isFrozen(vm.moralAlignment)).toBe(true);
        expect(Object.isFrozen(vm.philosophicalAlignment)).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// Tick B — quests section reads state.quests
// ---------------------------------------------------------------------------

/**
 * Build a synthetic `QuestLog`-shaped object and inject it via
 * `store.setState`. Cast through `any` because the engine's
 * `Quest` / `QuestLog` types pull from `./types` which the engine
 * dist currently doesn't emit (see engine-team handoff doc Issue 2).
 */
function setQuests(
    store: ReturnType<typeof createGameStore>,
    log: {
        available?: unknown[];
        active?: unknown[];
        completed?: unknown[];
    },
): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    store.setState({ quests: log } as any);
}

function makeQuest(
    name: string,
    objectives: Array<{
        id: string;
        type?: string;
        target?: string;
        text?: string;
        currentCount?: number;
        requiredCount?: number;
    }>,
    overrides: Record<string, unknown> = {},
): Record<string, unknown> {
    return {
        name,
        status: 'active',
        description: '',
        objectives: objectives.map((o) => ({
            id: o.id,
            type: o.type ?? 'reach',
            target: o.target ?? 'somewhere',
            text: o.text,
            currentCount: o.currentCount ?? 0,
            requiredCount: o.requiredCount ?? 1,
        })),
        ...overrides,
    };
}

describe('selectMemoirViewModel: quests section', () => {
    it('returns empty quest sections for a fresh game (engine creates an empty QuestLog)', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm = selectMemoirViewModel(store.getState());

        expect(vm.quests.active).toEqual([]);
        expect(vm.quests.completed).toEqual([]);
        expect(vm.quests.forgotten).toEqual([]);
    });

    it('renders active quests with their objectives and a derived done flag', () => {
        const store = createGameStore(createMemoryAdapter());
        setQuests(store, {
            available: [],
            active: [
                makeQuest('Find the Lost Pilgrim', [
                    {
                        id: 'reach-cairn',
                        type: 'reach',
                        target: 'cairn-of-bone',
                        text: 'Reach the cairn of bone.',
                        currentCount: 1,
                        requiredCount: 1,
                    },
                    {
                        id: 'kill-watcher',
                        type: 'kill',
                        target: 'cairn-watcher',
                        currentCount: 0,
                        requiredCount: 2,
                    },
                ]),
            ],
            completed: [],
        });

        const vm = selectMemoirViewModel(store.getState());

        expect(vm.quests.active).toHaveLength(1);
        const quest = vm.quests.active[0];
        expect(quest.id).toBe('Find the Lost Pilgrim');
        expect(quest.name).toBe('Find the Lost Pilgrim');
        expect(quest.status).toBe('active');
        expect(quest.objectives).toHaveLength(2);

        // Objective with `text` uses it verbatim; the done flag derives
        // from currentCount >= requiredCount.
        expect(quest.objectives[0].text).toBe('Reach the cairn of bone.');
        expect(quest.objectives[0].done).toBe(true);

        // Objective without `text` falls back to a synthesized
        // `<type>: <target>` line; the kill is unfinished (0/2).
        expect(quest.objectives[1].text).toBe('kill: cairn-watcher');
        expect(quest.objectives[1].done).toBe(false);
    });

    it('mirrors completed quest names as rows with no objectives (engine drops the Quest object on completion)', () => {
        const store = createGameStore(createMemoryAdapter());
        setQuests(store, {
            available: [],
            active: [],
            completed: ['Tend the Hearth', 'Read the Stars'],
        });

        const vm = selectMemoirViewModel(store.getState());

        expect(vm.quests.completed).toHaveLength(2);
        expect(vm.quests.completed[0].name).toBe('Tend the Hearth');
        expect(vm.quests.completed[0].status).toBe('completed');
        expect(vm.quests.completed[0].objectives).toEqual([]);
        expect(vm.quests.completed[1].name).toBe('Read the Stars');
    });

    it('keeps the forgotten section empty (engine has no failed-quest concept today)', () => {
        const store = createGameStore(createMemoryAdapter());
        // Even when arbitrary stuff lives elsewhere on the log, forgotten stays empty
        // because the mapper has no source for it.
        setQuests(store, {
            available: [makeQuest('Available Quest', [])],
            active: [makeQuest('Active Quest', [])],
            completed: ['Completed Quest'],
        });

        const vm = selectMemoirViewModel(store.getState());

        expect(vm.quests.forgotten).toEqual([]);
    });
});

// ---------------------------------------------------------------------------
// Tick C — moral + provisional philosophical alignment
//
// Bands per Phase 33 brief §"Tick C": -100..-66 RUTHLESS, -65..-34
// STERN, -33..33 UNDECLARED, 34..65 BENEVOLENT, 66..100 SAINTLY.
// Philosophical alignment: highest base stat wins, ties favour Heart,
// 3-way tie returns the `untested.` empty state.
// ---------------------------------------------------------------------------

function setMoralMeter(store: ReturnType<typeof createGameStore>, value: number): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    store.setState({ moralMeter: value } as any);
}

function setBaseStats(
    store: ReturnType<typeof createGameStore>,
    stats: { heart: number; body: number; mind: number },
): void {
    const player = store.getState().player;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    store.setState({ player: { ...player, baseStats: stats } } as any);
}

describe('selectMemoirViewModel: moral alignment', () => {
    it('defaults to UNDECLARED (bone tint) at moralMeter = 0', () => {
        const store = createGameStore(createMemoryAdapter());
        const vm = selectMemoirViewModel(store.getState());
        expect(vm.moralAlignment.value).toBe(0);
        expect(vm.moralAlignment.chip).toEqual({ label: 'UNDECLARED', tintKey: 'bone' });
    });

    it.each([
        [-100, 'RUTHLESS', 'blood'],
        [-70, 'RUTHLESS', 'blood'],
        [-66, 'RUTHLESS', 'blood'],
        [-65, 'STERN', 'rust'],
        [-40, 'STERN', 'rust'],
        [-34, 'STERN', 'rust'],
        [-33, 'UNDECLARED', 'bone'],
        [33, 'UNDECLARED', 'bone'],
        [34, 'BENEVOLENT', 'sulfur'],
        [50, 'BENEVOLENT', 'sulfur'],
        [65, 'BENEVOLENT', 'sulfur'],
        [66, 'SAINTLY', 'parchment'],
        [100, 'SAINTLY', 'parchment'],
    ])(
        'maps moralMeter %p to band %s (tint %s)',
        (value, label, tint) => {
            const store = createGameStore(createMemoryAdapter());
            setMoralMeter(store, value as number);
            const vm = selectMemoirViewModel(store.getState());
            expect(vm.moralAlignment.value).toBe(value);
            expect(vm.moralAlignment.chip.label).toBe(label);
            expect(vm.moralAlignment.chip.tintKey).toBe(tint);
        },
    );

    it('clamps moralMeter outside [-100, 100] to the boundary band', () => {
        const store = createGameStore(createMemoryAdapter());
        setMoralMeter(store, 200);
        let vm = selectMemoirViewModel(store.getState());
        expect(vm.moralAlignment.value).toBe(100);
        expect(vm.moralAlignment.chip.label).toBe('SAINTLY');

        setMoralMeter(store, -500);
        vm = selectMemoirViewModel(store.getState());
        expect(vm.moralAlignment.value).toBe(-100);
        expect(vm.moralAlignment.chip.label).toBe('RUTHLESS');
    });
});

describe('selectMemoirViewModel: provisional philosophical alignment', () => {
    it('returns untested when all three base stats are equal (3-way tie)', () => {
        const store = createGameStore(createMemoryAdapter());
        setBaseStats(store, { heart: 4, body: 4, mind: 4 });
        const vm = selectMemoirViewModel(store.getState());
        expect(vm.philosophicalAlignment.label).toBe('untested.');
        expect(vm.philosophicalAlignment.rationale).toBe('');
        expect(vm.philosophicalAlignment.provisional).toBe(true);
    });

    it('picks Heart as the largest measure with rationale', () => {
        const store = createGameStore(createMemoryAdapter());
        setBaseStats(store, { heart: 12, body: 5, mind: 7 });
        const vm = selectMemoirViewModel(store.getState());
        expect(vm.philosophicalAlignment.label).toBe('of the Heart');
        expect(vm.philosophicalAlignment.rationale).toBe('Heart is your largest measure (12).');
    });

    it('picks Body as the largest measure with rationale', () => {
        const store = createGameStore(createMemoryAdapter());
        setBaseStats(store, { heart: 3, body: 10, mind: 6 });
        const vm = selectMemoirViewModel(store.getState());
        expect(vm.philosophicalAlignment.label).toBe('of the Body');
        expect(vm.philosophicalAlignment.rationale).toBe('Body is your largest measure (10).');
    });

    it('picks Mind as the largest measure with rationale', () => {
        const store = createGameStore(createMemoryAdapter());
        setBaseStats(store, { heart: 2, body: 4, mind: 9 });
        const vm = selectMemoirViewModel(store.getState());
        expect(vm.philosophicalAlignment.label).toBe('of the Mind');
        expect(vm.philosophicalAlignment.rationale).toBe('Mind is your largest measure (9).');
    });

    it('breaks a Heart/Body tie in favour of Heart (per brief)', () => {
        const store = createGameStore(createMemoryAdapter());
        setBaseStats(store, { heart: 8, body: 8, mind: 3 });
        const vm = selectMemoirViewModel(store.getState());
        expect(vm.philosophicalAlignment.label).toBe('of the Heart');
    });

    it('breaks a Body/Mind tie in favour of Body (highest non-Heart wins)', () => {
        const store = createGameStore(createMemoryAdapter());
        setBaseStats(store, { heart: 2, body: 6, mind: 6 });
        const vm = selectMemoirViewModel(store.getState());
        expect(vm.philosophicalAlignment.label).toBe('of the Body');
    });
});
