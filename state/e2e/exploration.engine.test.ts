/**
 * Hermetic E2E Tests — Exploration screen presenter (Spec 07)
 *
 * Drives `selectExplorationViewModel` and the world action layer
 * (moveTo / changeMap) end-to-end through the engine store. Hermetic =
 * self-contained + deterministic + isolated. See docs/testing.md for
 * the full standard.
 */

import { afterEach, describe, it, expect, jest } from '@jest/globals';
import { createGameStore, getCoastalMap } from 'axiomancer-mechanics';

import { createMemoryAdapter } from '@/test-utils/memoryAdapter';
import { createAppActions } from '@/state/actions';
import {
    selectExplorationViewModel,
    type ExplorationViewModel,
} from '@/state/presenters/exploration.engine';

afterEach(() => {
    jest.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Shape contract
// ---------------------------------------------------------------------------

describe('selectExplorationViewModel: shape contract', () => {
    it('returns a totally-shaped ExplorationViewModel for a fresh game', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm: ExplorationViewModel = selectExplorationViewModel(store.getState());

        expect(typeof vm.continent).toBe('string');
        expect(typeof vm.region).toBe('string');
        expect(typeof vm.regionProgress).toBe('string');
        expect(typeof vm.dayDisplay).toBe('string');
        expect(typeof vm.mapId).toBe('string');
        expect(typeof vm.currentNodeId).toBe('string');
        expect(Array.isArray(vm.nodes)).toBe(true);
        expect(Array.isArray(vm.edges)).toBe(true);
        expect(Array.isArray(vm.actions)).toBe(true);
        expect(Array.isArray(vm.options)).toBe(true);
        expect(typeof vm.legend.left).toBe('string');
        expect(typeof vm.legend.right).toBe('string');
    });

    it('eventCallout is either null or a {title, iconKey} object', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm = selectExplorationViewModel(store.getState());

        if (vm.eventCallout !== null) {
            expect(typeof vm.eventCallout.title).toBe('string');
            expect(typeof vm.eventCallout.iconKey).toBe('string');
        } else {
            expect(vm.eventCallout).toBeNull();
        }
    });
});

describe('selectExplorationViewModel: invariants', () => {
    it('the returned VM is deep-frozen', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm = selectExplorationViewModel(store.getState());

        expect(Object.isFrozen(vm)).toBe(true);
        expect(Object.isFrozen(vm.nodes)).toBe(true);
        expect(Object.isFrozen(vm.edges)).toBe(true);
        expect(Object.isFrozen(vm.legend)).toBe(true);
    });
});

describe('selectExplorationViewModel: store lifecycle', () => {
    it('selecting the VM does not call adapter.save', () => {
        const adapter = createMemoryAdapter();
        const store = createGameStore(adapter);
        const saveSpy = jest.spyOn(adapter, 'save');

        selectExplorationViewModel(store.getState());

        expect(saveSpy).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// Engine reads — fresh game state
// ---------------------------------------------------------------------------

describe('selectExplorationViewModel: engine reads', () => {
    it('classifies the starting node as `current` and seeds available/locked', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm = selectExplorationViewModel(store.getState());

        expect(vm.mapId).toBe('fishing-village');
        expect(vm.currentNodeId).toBe('fv-1');

        const byId = Object.fromEntries(vm.nodes.map((n) => [n.id, n]));
        expect(byId['fv-1'].kind).toBe('current');
        expect(byId['fv-2'].kind).toBe('available');
        expect(byId['fv-3'].kind).toBe('locked');
        expect(byId['fv-10'].kind).toBe('locked');
    });

    it('exposes options for each currently available node with a thematic description', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm = selectExplorationViewModel(store.getState());

        expect(vm.options.map((o) => o.nodeId)).toEqual(['fv-2']);
        expect(vm.options[0].description.length).toBeGreaterThan(0);
    });

    it('marks encounter/boss available nodes as triggersCombat', () => {
        const store = createGameStore(createMemoryAdapter());
        const actions = createAppActions(store);

        // Walk to fv-2 so fv-3 (encounter) and fv-4 (treasure) become available.
        actions.moveTo('fv-2');

        const vm = selectExplorationViewModel(store.getState());
        const fv3 = vm.nodes.find((n) => n.id === 'fv-3')!;
        const fv4 = vm.nodes.find((n) => n.id === 'fv-4')!;

        expect(fv3.kind).toBe('available');
        expect(fv3.triggersCombat).toBe(true);
        expect(fv4.kind).toBe('available');
        expect(fv4.triggersCombat).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// moveTo action — happy path
// ---------------------------------------------------------------------------

describe('moveTo action: happy path', () => {
    it('marks the target completed, advances currentNodeId, and unlocks connected nodes', () => {
        const store = createGameStore(createMemoryAdapter());
        const actions = createAppActions(store);

        const result = actions.moveTo('fv-2');

        expect(result).toEqual({ moved: true, currentNodeId: 'fv-2', locked: false });

        const vm = selectExplorationViewModel(store.getState());
        expect(vm.currentNodeId).toBe('fv-2');
        const byId = Object.fromEntries(vm.nodes.map((n) => [n.id, n]));
        expect(byId['fv-2'].kind).toBe('current');
        // fv-3 and fv-4 are the layout-declared neighbours of fv-2 and
        // should now be reachable.
        expect(byId['fv-3'].kind).toBe('available');
        expect(byId['fv-4'].kind).toBe('available');
    });

    it('refreshes the options drawer with the new available nodes after a move', () => {
        const store = createGameStore(createMemoryAdapter());
        const actions = createAppActions(store);

        actions.moveTo('fv-2');

        const vm = selectExplorationViewModel(store.getState());
        const optionIds = vm.options.map((o) => o.nodeId).sort();
        expect(optionIds).toEqual(['fv-3', 'fv-4']);
    });
});

// ---------------------------------------------------------------------------
// moveTo action — locked / invalid targets (Q5=B no-op)
// ---------------------------------------------------------------------------

describe('moveTo action: locked / invalid targets', () => {
    it('refuses to move to a locked node and leaves state untouched', () => {
        const store = createGameStore(createMemoryAdapter());
        const actions = createAppActions(store);
        const before = store.getState();

        const result = actions.moveTo('fv-5');

        expect(result.moved).toBe(false);
        expect(result.locked).toBe(true);
        expect(result.currentNodeId).toBe('fv-1');

        // The world slice is unchanged on a refused move.
        expect(store.getState().world).toBe(before.world);
    });

    it('refuses to move to a non-existent node', () => {
        const store = createGameStore(createMemoryAdapter());
        const actions = createAppActions(store);

        const result = actions.moveTo('not-a-real-node');

        expect(result.moved).toBe(false);
    });

    it('refuses to revisit an already-completed node', () => {
        const store = createGameStore(createMemoryAdapter());
        const actions = createAppActions(store);

        actions.moveTo('fv-2');
        const result = actions.moveTo('fv-2');

        expect(result.moved).toBe(false);
    });

    it('exposes locked nodes through the VM so the screen can desaturate them', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm = selectExplorationViewModel(store.getState());

        const locked = vm.nodes.filter((n) => n.kind === 'locked').map((n) => n.id);
        expect(locked.length).toBeGreaterThan(0);
        // Locked nodes never trigger combat — taps are a no-op (Q5=B).
        for (const n of vm.nodes) {
            if (n.kind === 'locked') expect(n.triggersCombat).toBe(false);
        }
    });
});

// ---------------------------------------------------------------------------
// Map transition
// ---------------------------------------------------------------------------

describe('changeMap action: map transition', () => {
    it('swaps the engine currentMap and resets currentNodeId to the new startingNode', () => {
        const store = createGameStore(createMemoryAdapter());
        const actions = createAppActions(store);

        actions.changeMap('northern-forest');

        const vm = selectExplorationViewModel(store.getState());
        expect(vm.mapId).toBe('northern-forest');
        expect(vm.currentNodeId).toBe('nf-1');
        expect(store.getState().world.currentMap.name).toBe('northern-forest');
    });

    it('loads the new layout fixture so node positions and labels update', () => {
        const store = createGameStore(createMemoryAdapter());
        const actions = createAppActions(store);

        actions.changeMap('northern-forest');

        const vm = selectExplorationViewModel(store.getState());
        const ids = vm.nodes.map((n) => n.id);
        expect(ids).toEqual(expect.arrayContaining(['nf-1', 'nf-2', 'nf-3']));
        expect(ids.every((id) => id.startsWith('nf-'))).toBe(true);
    });

    it('also accepts the WorldMap returned by getCoastalMap as a sanity hint', () => {
        // The action accepts a MapName string; this assertion proves the
        // engine still ships the expected map under that name. Post-Spec
        // 08 Q5A, `getCoastalMap` returns a runtime `MapState`, so the
        // starting node id surfaces as `currentNode` on a fresh map.
        const map = getCoastalMap('northern-forest');
        expect(map.name).toBe('northern-forest');
        expect(map.currentNode).toBe('nf-1');
    });
});

// ---------------------------------------------------------------------------
// Lifecycle — multi-step navigation
// ---------------------------------------------------------------------------

describe('exploration lifecycle: multi-step navigation', () => {
    it('navigating two nodes leaves both as completed in the engine state', () => {
        const store = createGameStore(createMemoryAdapter());
        const actions = createAppActions(store);

        actions.moveTo('fv-2');
        actions.moveTo('fv-4');

        const completed = store.getState().world.currentMap.completedNodes;
        expect(completed).toEqual(expect.arrayContaining(['fv-2', 'fv-4']));

        const vm = selectExplorationViewModel(store.getState());
        const byId = Object.fromEntries(vm.nodes.map((n) => [n.id, n]));
        expect(byId['fv-2'].kind).toBe('completed');
        expect(byId['fv-4'].kind).toBe('current');
        // fv-5 and fv-6 are downstream of fv-4 per the layout fixture.
        expect(byId['fv-5'].kind).toBe('available');
        expect(byId['fv-6'].kind).toBe('available');
    });

    it('a move does not implicitly call adapter.save (Spec 09 hook)', () => {
        const adapter = createMemoryAdapter();
        const store = createGameStore(adapter);
        const actions = createAppActions(store);
        const saveSpy = jest.spyOn(adapter, 'save');

        actions.moveTo('fv-2');

        expect(saveSpy).not.toHaveBeenCalled();

        actions.save();
        expect(saveSpy).toHaveBeenCalledTimes(1);
    });
});
