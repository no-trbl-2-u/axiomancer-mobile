/**
 * Hermetic E2E Tests — Exploration event pools (jot c3c4e4e
 * resolution).
 *
 * Pins the registration contract: after `registerExplorationEventPools()`
 * fires, `resolveMapEvent` returns the expected event kind for every
 * node type across both seeded maps. Pre-registration, the engine
 * returns `{ kind: 'none' }` for every node — the pool registry
 * starts empty.
 *
 * Hermetic = self-contained + deterministic + isolated.
 */

import { afterEach, describe, expect, it } from '@jest/globals';
import {
    createNewGameState,
    getCoastalMap,
    resolveMapEvent,
    type GameState,
} from 'axiomancer-mechanics';

// Side-effect import: registering pools at module load time means
// pools are present for every test in this file. The pool registry
// is global engine state; the engine's `_clearMapEventPoolRegistry`
// helper is declared in the dist .d.ts but not actually exported in
// 0.10.0's runtime build, so we can't reset between tests. We
// instead pin "covered by registration" behavior and rely on the
// engine's per-node-id override key to demonstrate scope (an
// unregistered node id returns `none`).
import {
    registerExplorationEventPools,
    setChaosMode,
} from '@/state/exploration-maps/event-pools';
import { fishingVillageLayout } from '@/state/exploration-maps/fishing-village.layout';
import { northernForestLayout } from '@/state/exploration-maps/northern-forest.layout';

// Belt-and-braces: explicit re-register in case module hoisting
// caused the side-effect to fire in a different order than expected.
registerExplorationEventPools();

function stateAt(mapName: 'fishing-village' | 'northern-forest', nodeId: string): GameState {
    const base = createNewGameState();
    const map = getCoastalMap(mapName);
    return {
        ...base,
        world: {
            ...base.world,
            currentMap: { ...map, currentNode: nodeId },
        },
    };
}

describe('exploration event-pool registration', () => {
    it('an unregistered node id returns kind=none (proves the override is per-node, not blanket)', () => {
        const state = stateAt('fishing-village', 'definitely-not-a-real-node-id');
        const result = resolveMapEvent(state);
        expect(result.event.kind).toBe('none');
    });

    it('encounter node on fishing-village fires an encounter event', () => {
        const state = stateAt('fishing-village', 'fv-3');
        const result = resolveMapEvent(state);
        expect(result.event.kind).toBe('encounter');
    });

    it('encounter node on northern-forest fires an encounter event', () => {
        const state = stateAt('northern-forest', 'nf-3');
        const result = resolveMapEvent(state);
        expect(result.event.kind).toBe('encounter');
    });

    it('boss node fires an encounter with isBoss=true', () => {
        const state = stateAt('fishing-village', 'fv-5');
        const result = resolveMapEvent(state);
        expect(result.event.kind).toBe('encounter');
        if (result.event.kind === 'encounter') {
            expect(result.event.isBoss).toBe(true);
        }
    });

    it('rest node fires a rest event', () => {
        const state = stateAt('fishing-village', 'fv-1');
        const result = resolveMapEvent(state);
        expect(result.event.kind).toBe('rest');
    });

    it('gather node fires a gathering event', () => {
        const state = stateAt('fishing-village', 'fv-2');
        const result = resolveMapEvent(state);
        expect(result.event.kind).toBe('gathering');
    });

    it('treasure node fires a loot-cache event', () => {
        const state = stateAt('fishing-village', 'fv-4');
        const result = resolveMapEvent(state);
        expect(result.event.kind).toBe('loot-cache');
    });

    it('quest node fires an interaction event', () => {
        const state = stateAt('fishing-village', 'fv-6');
        const result = resolveMapEvent(state);
        expect(result.event.kind).toBe('interaction');
    });

    it('is idempotent — calling registerExplorationEventPools twice doesn\'t break behavior', () => {
        registerExplorationEventPools();
        registerExplorationEventPools();
        const state = stateAt('fishing-village', 'fv-3');
        const result = resolveMapEvent(state);
        expect(result.event.kind).toBe('encounter');
    });

    it('covers every node in fishing-village layout with a pool override', () => {
        registerExplorationEventPools();
        // Every non-'current' node should resolve to something other
        // than 'none' (since we registered a pool for every node type
        // the layout uses).
        for (const node of fishingVillageLayout.nodes) {
            if (node.type === 'current') continue;
            const state = stateAt('fishing-village', node.id);
            const result = resolveMapEvent(state);
            expect({ id: node.id, kind: result.event.kind }).not.toEqual({
                id: node.id,
                kind: 'none',
            });
        }
    });

    it('covers every node in northern-forest layout with a pool override', () => {
        registerExplorationEventPools();
        for (const node of northernForestLayout.nodes) {
            if (node.type === 'current') continue;
            const state = stateAt('northern-forest', node.id);
            const result = resolveMapEvent(state);
            expect({ id: node.id, kind: result.event.kind }).not.toEqual({
                id: node.id,
                kind: 'none',
            });
        }
    });
});

describe('chaos-mode toggle (Phase 58)', () => {
    afterEach(() => {
        // Restore canonical pools so subsequent tests are not
        // contaminated by chaos overrides. The engine's pool
        // registry is global state.
        setChaosMode(false);
        registerExplorationEventPools();
    });

    it('chaos ON: walking a single node samples multiple event kinds across resolves', () => {
        setChaosMode(true);
        const kinds = new Set<string>();
        for (let i = 0; i < 25; i++) {
            // Re-resolve repeatedly from a fresh state at the same node
            // so consumedNodes doesn't short-circuit subsequent calls.
            const state = stateAt('fishing-village', 'fv-1');
            const result = resolveMapEvent(state);
            kinds.add(result.event.kind);
        }
        // The chaos pool has 5 distinct kinds (encounter / hazard /
        // gathering / loot-cache / rest). Across 25 resolves on a
        // non-seeded RNG we should see at least 3 distinct kinds —
        // very high probability given equal weights.
        expect(kinds.size).toBeGreaterThanOrEqual(3);
    });

    it('chaos OFF: canonical per-node-type pools restore on toggle off', () => {
        setChaosMode(true);
        setChaosMode(false);

        // fv-3 is type 'encounter' in the layout; canonical override
        // routes to the fishing-village encounter pool.
        const state = stateAt('fishing-village', 'fv-3');
        const result = resolveMapEvent(state);
        expect(result.event.kind).toBe('encounter');

        // fv-1 is type 'rest' — canonical override routes to the
        // rest pool.
        const restState = stateAt('fishing-village', 'fv-1');
        const restResult = resolveMapEvent(restState);
        expect(restResult.event.kind).toBe('rest');
    });

    it('chaos ON: fv-1 (rest in canonical) no longer pins to rest', () => {
        setChaosMode(true);
        const kinds = new Set<string>();
        for (let i = 0; i < 20; i++) {
            const state = stateAt('fishing-village', 'fv-1');
            const result = resolveMapEvent(state);
            kinds.add(result.event.kind);
        }
        // Should see SOMETHING other than 'rest' (proves the override
        // swapped). High probability across 20 equal-weight resolves.
        const nonRestKinds = Array.from(kinds).filter((k) => k !== 'rest');
        expect(nonRestKinds.length).toBeGreaterThan(0);
    });

    it('setChaosMode is a no-op in production (__DEV__ false)', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const g = global as any;
        const original = g.__DEV__;
        g.__DEV__ = false;
        try {
            // Canonical pools already registered. Calling setChaosMode
            // here must not swap to chaos.
            setChaosMode(true);

            const state = stateAt('fishing-village', 'fv-3');
            const result = resolveMapEvent(state);
            // fv-3 is an encounter node; canonical override stays.
            expect(result.event.kind).toBe('encounter');
        } finally {
            g.__DEV__ = original;
        }
    });
});
