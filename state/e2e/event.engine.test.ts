/**
 * Hermetic E2E Tests — Event screen presenter (Phase 6).
 *
 * Drives `selectEventViewModel` and `selectHasActiveEvent` against
 * fixture `ProcessNodeResult` shapes injected into the mobile event
 * slice. Composition is pure — no engine RNG, no live dispatch.
 *
 * Hermetic = self-contained + deterministic + isolated.
 * See docs/testing.md for the full standard.
 */

import { afterEach, describe, it, expect, jest } from '@jest/globals';
import type { ProcessNodeResult } from 'axiomancer-mechanics';

import { createMemoryAdapter } from '@/test-utils/memoryAdapter';
import { createAppStore, type AppStore, EMPTY_EVENT_SLICE } from '@/state/store';
import {
    selectEventViewModel,
    selectHasActiveEvent,
    type EventViewModel,
} from '@/state/presenters/event.engine';

afterEach(() => {
    jest.restoreAllMocks();
});

const ALLOWED_KINDS = ['combat-prelude', 'narrative-choice'] as const;
const ALLOWED_VARIANTS = ['encounter', 'boss', 'quest', 'rest', 'gather', 'npc'] as const;
const ALLOWED_ACCENTS = ['blood', 'sulfur', 'parchment', 'bone', 'rust'] as const;
const ALLOWED_SLUGS = ['encounter', 'boss', 'rest', 'gather', 'treasure', 'npc-generic'] as const;

function makeStore(): AppStore {
    return createAppStore({ adapter: createMemoryAdapter() });
}

function setPending(store: AppStore, result: ProcessNodeResult) {
    store.setState({
        event: {
            ...EMPTY_EVENT_SLICE,
            pending: result,
        },
    });
}

function makeEncounterResult(opts: { isBoss?: boolean } = {}): ProcessNodeResult {
    const enemy = {
        id: 'cairn-rot',
        name: 'Cairn-rot',
        level: 3,
        health: 24,
    } as never;
    return {
        gameState: undefined as never,
        event: {
            kind: 'encounter',
            encounter: { enemy },
            isBoss: opts.isBoss ?? false,
        },
        objectivesProgressed: [],
        questsCompleted: [],
        message: 'A figure stirs.',
    };
}

function makeRestResult(healed: number, message: string): ProcessNodeResult {
    return {
        gameState: undefined as never,
        event: { kind: 'rest', healed },
        objectivesProgressed: [],
        questsCompleted: [],
        message,
    };
}

function makeGatherResult(): ProcessNodeResult {
    return {
        gameState: undefined as never,
        event: {
            kind: 'gather',
            items: [
                { id: 'herb', name: 'Witherwort', category: 'material' } as never,
                { id: 'flint', name: 'Flint shard', category: 'material' } as never,
            ],
        },
        objectivesProgressed: [],
        questsCompleted: [],
        message: 'You gather what you can.',
    };
}

function makeNoneResult(): ProcessNodeResult {
    return {
        gameState: undefined as never,
        event: { kind: 'none' },
        objectivesProgressed: [],
        questsCompleted: [],
        message: '',
    };
}

describe('selectHasActiveEvent', () => {
    it('returns false on a fresh store (no pending)', () => {
        const store = makeStore();
        expect(selectHasActiveEvent(store.getState())).toBe(false);
    });

    it('returns false when pending event kind is "none"', () => {
        const store = makeStore();
        setPending(store, makeNoneResult());
        expect(selectHasActiveEvent(store.getState())).toBe(false);
    });

    it('returns true for an encounter result', () => {
        const store = makeStore();
        setPending(store, makeEncounterResult());
        expect(selectHasActiveEvent(store.getState())).toBe(true);
    });

    it('returns true for a rest result', () => {
        const store = makeStore();
        setPending(store, makeRestResult(5, 'You rest.'));
        expect(selectHasActiveEvent(store.getState())).toBe(true);
    });

    it('short-circuits to false when combat is active', () => {
        const store = makeStore();
        setPending(store, makeEncounterResult());
        store.setState({ combat: { phase: 'choose' } as never });
        expect(selectHasActiveEvent(store.getState())).toBe(false);
    });
});

describe('selectEventViewModel: shape contract', () => {
    it('returns the empty-state VM for a fresh game (no pending event)', () => {
        const store = makeStore();
        const vm: EventViewModel = selectEventViewModel(store.getState());

        expect(vm.title).toBe('NO EVENT IN PROGRESS');
        expect(vm.choices).toHaveLength(0);
        expect(ALLOWED_KINDS).toContain(vm.kind);
        expect(ALLOWED_VARIANTS).toContain(vm.variant);
        expect(ALLOWED_ACCENTS).toContain(vm.badgeAccentKey);
        expect(ALLOWED_SLUGS).toContain(vm.artSlug);
    });

    it('every VM choice carries id / label / description / accentKey / iconKey / enabled', () => {
        const store = makeStore();
        setPending(store, makeEncounterResult());
        const vm = selectEventViewModel(store.getState());

        expect(vm.choices.length).toBeGreaterThan(0);
        for (const choice of vm.choices) {
            expect(typeof choice.id).toBe('string');
            expect(typeof choice.label).toBe('string');
            expect(typeof choice.description).toBe('string');
            expect(Array.isArray(choice.consequences)).toBe(true);
            expect(typeof choice.iconKey).toBe('string');
            expect(ALLOWED_ACCENTS).toContain(choice.accentKey);
            expect(typeof choice.enabled).toBe('boolean');
        }
    });

    it('lore is either null or a string', () => {
        const store = makeStore();
        const vm = selectEventViewModel(store.getState());

        if (vm.lore !== null) {
            expect(typeof vm.lore).toBe('string');
        } else {
            expect(vm.lore).toBeNull();
        }
    });
});

describe('selectEventViewModel: combat-prelude composition', () => {
    it('maps a non-boss encounter to kind="combat-prelude" variant="encounter"', () => {
        const store = makeStore();
        setPending(store, makeEncounterResult({ isBoss: false }));
        const vm = selectEventViewModel(store.getState());

        expect(vm.kind).toBe('combat-prelude');
        expect(vm.variant).toBe('encounter');
        expect(vm.artSlug).toBe('encounter');
        expect(vm.badge).toBe('ENCOUNTER');
        expect(vm.title).toContain('CAIRN-ROT');
        expect(vm.choices.map((c) => c.id)).toEqual(['fight', 'flee']);
        expect(vm.choices.find((c) => c.id === 'fight')?.enabled).toBe(true);
    });

    it('maps a boss encounter to variant="boss" and disables flee', () => {
        const store = makeStore();
        setPending(store, makeEncounterResult({ isBoss: true }));
        const vm = selectEventViewModel(store.getState());

        expect(vm.kind).toBe('combat-prelude');
        expect(vm.variant).toBe('boss');
        expect(vm.artSlug).toBe('boss');
        expect(vm.badge).toBe('OMEN OF DOOM');
        expect(vm.choices.find((c) => c.id === 'flee')?.enabled).toBe(false);
    });
});

describe('selectEventViewModel: narrative-choice composition', () => {
    it('maps a rest event to a single-choice VM with heal consequence', () => {
        const store = makeStore();
        setPending(store, makeRestResult(7, 'A quiet place.'));
        const vm = selectEventViewModel(store.getState());

        expect(vm.kind).toBe('narrative-choice');
        expect(vm.variant).toBe('rest');
        expect(vm.artSlug).toBe('rest');
        expect(vm.choices).toHaveLength(1);
        expect(vm.choices[0]?.consequences).toEqual([{ kind: 'heal', amount: 7 }]);
    });

    it('maps a gather event to an item-bag VM with item consequences', () => {
        const store = makeStore();
        setPending(store, makeGatherResult());
        const vm = selectEventViewModel(store.getState());

        expect(vm.kind).toBe('narrative-choice');
        expect(vm.variant).toBe('gather');
        expect(vm.artSlug).toBe('gather');
        expect(vm.choices).toHaveLength(1);
        const cons = vm.choices[0]?.consequences ?? [];
        expect(cons).toContainEqual({ kind: 'item', label: 'Witherwort' });
        expect(cons).toContainEqual({ kind: 'item', label: 'Flint shard' });
    });

    it('canSkip is true on rest event with long body', () => {
        const store = makeStore();
        const long = 'You rest. '.repeat(40);
        setPending(store, makeRestResult(1, long));
        const vm = selectEventViewModel(store.getState());
        expect(vm.canSkip).toBe(true);
    });

    it('canSkip is false on rest event with short body', () => {
        const store = makeStore();
        setPending(store, makeRestResult(1, 'You rest briefly.'));
        const vm = selectEventViewModel(store.getState());
        expect(vm.canSkip).toBe(false);
    });
});

describe('selectEventViewModel: invariants', () => {
    it('the returned VM is deep-frozen', () => {
        const store = makeStore();
        setPending(store, makeEncounterResult());
        const vm = selectEventViewModel(store.getState());

        expect(Object.isFrozen(vm)).toBe(true);
        expect(Object.isFrozen(vm.choices)).toBe(true);
    });

    it('selecting the VM does not call adapter.save', () => {
        const adapter = createMemoryAdapter();
        const store = createAppStore({ adapter });
        setPending(store, makeEncounterResult());
        const saveSpy = jest.spyOn(adapter, 'save');

        selectEventViewModel(store.getState());

        expect(saveSpy).not.toHaveBeenCalled();
    });
});
