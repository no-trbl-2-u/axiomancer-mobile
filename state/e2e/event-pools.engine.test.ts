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

import { describe, expect, it } from '@jest/globals';
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
import { registerExplorationEventPools } from '@/state/exploration-maps/event-pools';
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
