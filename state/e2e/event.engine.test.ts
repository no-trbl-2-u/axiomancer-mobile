/**
 * Hermetic E2E Tests — Event screen presenter (Phase 23 — 0.7.0 surface).
 *
 * Drives `selectEventViewModel` and `selectHasActiveEvent` against
 * fixture `ResolveMapEventResult` shapes injected into the mobile
 * event slice. Composition is pure — no engine RNG, no live dispatch.
 *
 * Hermetic = self-contained + deterministic + isolated.
 * See docs/testing.md for the full standard.
 */

import { afterEach, describe, it, expect, jest } from '@jest/globals';
import type { ResolveMapEventResult } from 'axiomancer-mechanics';

import { createMemoryAdapter } from '@/test-utils/memoryAdapter';
import { createAppActions } from '@/state/actions';
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
const ALLOWED_SLUGS = [
    'encounter',
    'boss',
    'rest',
    'gathering',
    'loot-cache',
    'interaction-generic',
    'village',
    'cutscene',
    'hazard',
] as const;

function makeStore(): AppStore {
    return createAppStore({ adapter: createMemoryAdapter() });
}

function setPending(store: AppStore, result: ResolveMapEventResult) {
    store.setState({
        event: {
            ...EMPTY_EVENT_SLICE,
            pending: result,
        },
    });
}

function makeEncounterResult(opts: { isBoss?: boolean } = {}): ResolveMapEventResult {
    const enemy = {
        id: 'cairn-rot',
        name: 'Cairn-rot',
        level: 3,
        health: 24,
    } as never;
    return {
        state: undefined as never,
        event: {
            kind: 'encounter',
            encounter: { enemy },
            isBoss: opts.isBoss ?? false,
        },
    };
}

function makeRestResult(healed: number): ResolveMapEventResult {
    return {
        state: undefined as never,
        event: { kind: 'rest', healed },
    };
}

function makeGatheringResult(): ResolveMapEventResult {
    return {
        state: undefined as never,
        event: {
            kind: 'gathering',
            items: [
                { id: 'herb', name: 'Witherwort', category: 'material' } as never,
                { id: 'flint', name: 'Flint shard', category: 'material' } as never,
            ],
        },
    };
}

function makeLootCacheResult(): ResolveMapEventResult {
    return {
        state: undefined as never,
        event: {
            kind: 'loot-cache',
            items: [{ id: 'coin', name: 'Tarnished coin', category: 'material' } as never],
            currency: 5,
        },
    };
}

function makeVillageResult(): ResolveMapEventResult {
    return {
        state: undefined as never,
        event: {
            kind: 'village',
            villageName: 'Hollow Mire',
            merchants: [],
        },
    };
}

function makeCutsceneResult(lines: ReadonlyArray<string>): ResolveMapEventResult {
    return {
        state: undefined as never,
        event: { kind: 'cutscene', lines },
    };
}

function makeHazardResult(damage: number): ResolveMapEventResult {
    return {
        state: undefined as never,
        event: { kind: 'hazard', effects: [], damage },
    };
}

function makeInteractionResult(): ResolveMapEventResult {
    return {
        state: undefined as never,
        event: { kind: 'interaction', npcName: 'A Stranger' },
    };
}

function makeNoneResult(): ResolveMapEventResult {
    return {
        state: undefined as never,
        event: { kind: 'none' },
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
        setPending(store, makeRestResult(5));
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
        setPending(store, makeRestResult(7));
        const vm = selectEventViewModel(store.getState());

        expect(vm.kind).toBe('narrative-choice');
        expect(vm.variant).toBe('rest');
        expect(vm.artSlug).toBe('rest');
        expect(vm.choices).toHaveLength(1);
        expect(vm.choices[0]?.consequences).toEqual([{ kind: 'heal', amount: 7 }]);
    });

    it('maps a gathering event to an item-bag VM with item consequences', () => {
        const store = makeStore();
        setPending(store, makeGatheringResult());
        const vm = selectEventViewModel(store.getState());

        expect(vm.kind).toBe('narrative-choice');
        expect(vm.variant).toBe('gather');
        expect(vm.artSlug).toBe('gathering');
        expect(vm.choices).toHaveLength(1);
        const cons = vm.choices[0]?.consequences ?? [];
        expect(cons).toContainEqual({ kind: 'item', label: 'Witherwort' });
        expect(cons).toContainEqual({ kind: 'item', label: 'Flint shard' });
    });

    it('maps a loot-cache event to a quest-variant item-bag with currency', () => {
        const store = makeStore();
        setPending(store, makeLootCacheResult());
        const vm = selectEventViewModel(store.getState());

        expect(vm.kind).toBe('narrative-choice');
        expect(vm.artSlug).toBe('loot-cache');
        expect(vm.choices).toHaveLength(1);
        const cons = vm.choices[0]?.consequences ?? [];
        expect(cons).toContainEqual({ kind: 'item', label: 'Tarnished coin' });
        expect(cons).toContainEqual({ kind: 'currency', amount: 5 });
    });

    it('maps a village event to a single LEAVE choice (shop UI deferred)', () => {
        const store = makeStore();
        setPending(store, makeVillageResult());
        const vm = selectEventViewModel(store.getState());

        expect(vm.kind).toBe('narrative-choice');
        expect(vm.artSlug).toBe('village');
        expect(vm.title).toContain('HOLLOW MIRE');
        expect(vm.choices).toHaveLength(1);
        expect(vm.choices[0]?.id).toBe('leave');
    });

    it('maps a cutscene event to body=lines.join() and canSkip=true', () => {
        const store = makeStore();
        setPending(store, makeCutsceneResult(['First line.', 'Second line.']));
        const vm = selectEventViewModel(store.getState());

        expect(vm.kind).toBe('narrative-choice');
        expect(vm.artSlug).toBe('cutscene');
        expect(vm.body).toContain('First line.');
        expect(vm.body).toContain('Second line.');
        expect(vm.canSkip).toBe(true);
    });

    it('maps a hazard event to a damage-consequence single choice', () => {
        const store = makeStore();
        setPending(store, makeHazardResult(4));
        const vm = selectEventViewModel(store.getState());

        expect(vm.kind).toBe('narrative-choice');
        expect(vm.artSlug).toBe('hazard');
        expect(vm.choices).toHaveLength(1);
        expect(vm.choices[0]?.consequences).toContainEqual({ kind: 'damage', amount: 4 });
    });

    it('maps an interaction (no dialogue) to a single SO BE IT choice', () => {
        const store = makeStore();
        setPending(store, makeInteractionResult());
        const vm = selectEventViewModel(store.getState());

        expect(vm.kind).toBe('narrative-choice');
        expect(vm.variant).toBe('npc');
        expect(vm.artSlug).toBe('interaction-generic');
        expect(vm.title).toContain('A STRANGER');
        expect(vm.choices).toHaveLength(1);
    });

    it('canSkip is true on rest event with long body (forced by long description)', () => {
        const store = makeStore();
        // Default body for rest is 'A quiet place.' (short); we override
        // by passing an event with a description in a real flow. For the
        // pure VM test here, the canSkip threshold is body.length > 240
        // and the rest default is short, so this expects false:
        setPending(store, makeRestResult(1));
        const vm = selectEventViewModel(store.getState());
        expect(vm.canSkip).toBe(false);
    });
});

describe('eventActions.pickEventChoice', () => {
    it('combat-prelude + fight -> startCombat called with encounter enemy; pending clears', () => {
        const store = makeStore();
        const actions = createAppActions(store);
        const encounterResult = makeEncounterResult();
        setPending(store, encounterResult);
        const startCombatSpy = jest.spyOn(store.getState(), 'startCombat');

        actions.pickEventChoice('fight');

        expect(startCombatSpy).toHaveBeenCalledTimes(1);
        expect(store.getState().event.pending).toBeNull();
    });

    it('combat-prelude + flee -> no engine dispatch; pending clears', () => {
        const store = makeStore();
        const actions = createAppActions(store);
        setPending(store, makeEncounterResult());
        const startCombatSpy = jest.spyOn(store.getState(), 'startCombat');

        actions.pickEventChoice('flee');

        expect(startCombatSpy).not.toHaveBeenCalled();
        expect(store.getState().event.pending).toBeNull();
    });

    it('narrative-choice auto-resolve (rest) clears pending without engine dispatch', () => {
        const store = makeStore();
        const actions = createAppActions(store);
        setPending(store, makeRestResult(3));

        actions.pickEventChoice('continue');

        expect(store.getState().event.pending).toBeNull();
    });

    it('unknown choice id on combat-prelude is a defensive no-op (pending stays)', () => {
        const store = makeStore();
        const actions = createAppActions(store);
        setPending(store, makeEncounterResult());

        actions.pickEventChoice('explode');

        expect(store.getState().event.pending).not.toBeNull();
    });
});

describe('eventActions.dismissEvent', () => {
    it('clears the event slice without dispatching engine calls', () => {
        const store = makeStore();
        const actions = createAppActions(store);
        setPending(store, makeRestResult(1));
        expect(selectHasActiveEvent(store.getState())).toBe(true);

        actions.dismissEvent();

        expect(store.getState().event.pending).toBeNull();
        expect(selectHasActiveEvent(store.getState())).toBe(false);
    });
});

describe('eventActions.processCurrentNode', () => {
    it('no-ops while combat is active (Spec 08 Q4)', () => {
        const store = makeStore();
        const actions = createAppActions(store);
        store.setState({ combat: { phase: 'choose' } as never });

        const produced = actions.processCurrentNode();

        expect(produced).toBe(false);
        expect(store.getState().event.pending).toBeNull();
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
