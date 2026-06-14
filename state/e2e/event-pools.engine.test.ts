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
    createMapState,
    createNewGameState,
    getMapDefinition,
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
    poolIdForNode,
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
    // Phase 60a — adopted `createMapState(getMapDefinition(...))`
    // pattern. Both fishing-village and northern-forest are in the
    // `coastal-continent` registry.
    const map = createMapState(getMapDefinition('coastal-continent', mapName));
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

    it('the quest-board node (fv-15 Sea Cave) fires a quest event', () => {
        // One-quest-per-map (2026-06-14): fv-15 is fishing-village's
        // single quest beat, the build-the-boat board. (fv-6 and fv-20
        // were re-typed to encounter / treasure.)
        const state = stateAt('fishing-village', 'fv-15');
        const result = resolveMapEvent(state);
        expect(result.event.kind).toBe('quest');
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

describe('multi-entry encounter pools (Phase 55)', () => {
    it('fishing-village encounter pool samples ≥2 distinct enemy ids across 20 resolves', () => {
        const enemyIds = new Set<string>();
        for (let i = 0; i < 20; i++) {
            const state = stateAt('fishing-village', 'fv-3');
            const result = resolveMapEvent(state);
            expect(result.event.kind).toBe('encounter');
            if (result.event.kind === 'encounter') {
                enemyIds.add(result.event.encounter.enemies[0].id);
            }
        }
        expect(enemyIds.size).toBeGreaterThanOrEqual(2);
    });

    it('northern-forest encounter pool samples ≥2 distinct enemy ids across 20 resolves', () => {
        const enemyIds = new Set<string>();
        for (let i = 0; i < 20; i++) {
            const state = stateAt('northern-forest', 'nf-3');
            const result = resolveMapEvent(state);
            expect(result.event.kind).toBe('encounter');
            if (result.event.kind === 'encounter') {
                enemyIds.add(result.event.encounter.enemies[0].id);
            }
        }
        expect(enemyIds.size).toBeGreaterThanOrEqual(2);
    });

    it('all sampled fishing-village enemies belong to the fishing-village roster', () => {
        const ALLOWED_FV_IDS = new Set([
            'enemy-tidepool-crab',
            'enemy-sea-mist-wisp',
            'enemy-wet-hound',
            'enemy-mournful-gull',
        ]);
        for (let i = 0; i < 20; i++) {
            const state = stateAt('fishing-village', 'fv-3');
            const result = resolveMapEvent(state);
            if (result.event.kind === 'encounter') {
                expect(ALLOWED_FV_IDS.has(result.event.encounter.enemies[0].id)).toBe(true);
            }
        }
    });

    it('all sampled northern-forest enemies belong to the northern-forest roster', () => {
        const ALLOWED_NF_IDS = new Set([
            'enemy-lullaby-moth',
            'enemy-disatree',
            'enemy-forest-sprite',
            'enemy-argumentative-crow',
        ]);
        for (let i = 0; i < 20; i++) {
            const state = stateAt('northern-forest', 'nf-3');
            const result = resolveMapEvent(state);
            if (result.event.kind === 'encounter') {
                expect(ALLOWED_NF_IDS.has(result.event.encounter.enemies[0].id)).toBe(true);
            }
        }
    });

    it('boss nodes still pin to a single signature enemy (not multi-sampled)', () => {
        // The boss pools stay single-entry per Phase 55's brief —
        // bosses are signature encounters, not variety draws. Across
        // 10 resolves on fv-5 (Black Cairn, boss type), every sample
        // should be the coastal-tyrant.
        const ids = new Set<string>();
        for (let i = 0; i < 10; i++) {
            const state = stateAt('fishing-village', 'fv-5');
            const result = resolveMapEvent(state);
            if (result.event.kind === 'encounter') {
                ids.add(result.event.encounter.enemies[0].id);
            }
        }
        expect(ids).toEqual(new Set(['enemy-coastal-tyrant']));
    });
});

describe('fishing village starter-tier enemy bias (Phase 120)', () => {
    it('first encounter node (fv-3) favors starter-tier enemies across 20 seeded resolves', () => {
        // Phase 120 rebalanced fishing-village encounter weights from 3:3:1:1
        // to 5:5:1:1 (simple:simple:normal:normal) for gentler new-player experience.
        // With the new weights, ~83% of encounters should be starter-tier
        // (tidepool-crab or sea-mist-wisp).
        const starterTierIds = new Set([
            'enemy-tidepool-crab',
            'enemy-sea-mist-wisp',
        ]);
        
        let starterCount = 0;
        const totalSamples = 20;
        
        for (let i = 0; i < totalSamples; i++) {
            const state = stateAt('fishing-village', 'fv-3');
            const result = resolveMapEvent(state);
            expect(result.event.kind).toBe('encounter');
            
            if (result.event.kind === 'encounter') {
                const enemyId = result.event.encounter.enemies[0].id;
                if (starterTierIds.has(enemyId)) {
                    starterCount++;
                }
            }
        }
        
        // With 5:5:1:1 weights (10:2 ratio), expect at least 12/20 = 60% starter-tier
        // to account for RNG variance while still validating the bias exists.
        expect(starterCount).toBeGreaterThanOrEqual(12);
        expect(starterCount / totalSamples).toBeGreaterThanOrEqual(0.6);
    });

    it('all fishing-village encounter enemies are still from the expected roster (weight change only)', () => {
        // Ensure the weight change in Phase 120 didn't accidentally introduce
        // new enemies - the roster should remain the same, only weights changed.
        const EXPECTED_FV_ROSTER = new Set([
            'enemy-tidepool-crab',
            'enemy-sea-mist-wisp', 
            'enemy-wet-hound',
            'enemy-mournful-gull',
        ]);
        
        const sampledIds = new Set<string>();
        for (let i = 0; i < 30; i++) {
            const state = stateAt('fishing-village', 'fv-3');
            const result = resolveMapEvent(state);
            if (result.event.kind === 'encounter') {
                sampledIds.add(result.event.encounter.enemies[0].id);
            }
        }
        
        for (const id of sampledIds) {
            expect(EXPECTED_FV_ROSTER.has(id)).toBe(true);
        }
        
        // Should still sample multiple varieties (not just starter-tier)
        expect(sampledIds.size).toBeGreaterThanOrEqual(2);
    });
});

describe('per-quest-node NPC wiring (Phase 56)', () => {
    // One-quest-per-map (2026-06-14): fishing-village's quest beat is now
    // the build-the-boat board at fv-15 (see the quest-board suite); the
    // old NPC-interaction quest stubs fv-6 / fv-20 were re-typed to
    // encounter / treasure. Northern-forest keeps its single quest as an
    // NPC interaction (no board content ships for that map yet).
    it('nf-6 (Pilgrim\'s Cairn) resolves to an interaction with the forgotten-pilgrim', () => {
        const state = stateAt('northern-forest', 'nf-6');
        const result = resolveMapEvent(state);
        expect(result.event.kind).toBe('interaction');
        if (result.event.kind === 'interaction') {
            expect(result.event.npcName).toBe('forgotten-pilgrim');
        }
    });

    it('the re-typed fv-6 (Ash Mire) is now an encounter, not a quest interaction', () => {
        const state = stateAt('fishing-village', 'fv-6');
        const result = resolveMapEvent(state);
        expect(result.event.kind).toBe('encounter');
    });

    it('the re-typed fv-20 (Hermit Hut) is now a treasure cache, not a quest interaction', () => {
        const state = stateAt('fishing-village', 'fv-20');
        const result = resolveMapEvent(state);
        expect(result.event.kind).toBe('loot-cache');
    });
});

describe('per-map treasure + gathering payloads (Phase 57)', () => {
    it('fv-4 (Drowned Shrine, treasure) fires a loot-cache with non-empty items', () => {
        const state = stateAt('fishing-village', 'fv-4');
        const result = resolveMapEvent(state);
        expect(result.event.kind).toBe('loot-cache');
        if (result.event.kind === 'loot-cache') {
            expect(result.event.items.length).toBeGreaterThanOrEqual(1);
        }
    });

    it('northern-forest treasure fires distinct items from fishing-village treasure', () => {
        const fvState = stateAt('fishing-village', 'fv-4');
        const nfState = stateAt('northern-forest', 'nf-4');
        const fv = resolveMapEvent(fvState);
        const nf = resolveMapEvent(nfState);

        expect(fv.event.kind).toBe('loot-cache');
        expect(nf.event.kind).toBe('loot-cache');

        if (fv.event.kind === 'loot-cache' && nf.event.kind === 'loot-cache') {
            const fvIds = new Set(fv.event.items.map((i) => i.id));
            const nfIds = new Set(nf.event.items.map((i) => i.id));
            // The per-map rosters are disjoint by design (fv leans
            // early-game; nf leans mid-tier).
            for (const id of fvIds) {
                expect(nfIds.has(id)).toBe(false);
            }
        }
    });

    it('fv-2 (Crossing, gather) fires a gathering event with non-empty materials', () => {
        const state = stateAt('fishing-village', 'fv-2');
        const result = resolveMapEvent(state);
        expect(result.event.kind).toBe('gathering');
        if (result.event.kind === 'gathering') {
            expect(result.event.items.length).toBeGreaterThanOrEqual(1);
            // All items in a gather pool should be Material-category.
            for (const item of result.event.items) {
                expect(item.category).toBe('material');
            }
        }
    });

    it('northern-forest gather drops moth-dust / larch-ash (locale-themed materials)', () => {
        const state = stateAt('northern-forest', 'nf-2');
        const result = resolveMapEvent(state);
        expect(result.event.kind).toBe('gathering');
        if (result.event.kind === 'gathering') {
            const ids = new Set(result.event.items.map((i) => i.id));
            const NF_GATHER = new Set(['moth-dust', 'larch-ash']);
            // Every dropped material belongs to the nf roster.
            for (const id of ids) {
                expect(NF_GATHER.has(id)).toBe(true);
            }
        }
    });

    it('treasure event carries currency (per-map: fv=5, nf=10)', () => {
        const fvState = stateAt('fishing-village', 'fv-4');
        const nfState = stateAt('northern-forest', 'nf-4');
        const fv = resolveMapEvent(fvState);
        const nf = resolveMapEvent(nfState);
        if (fv.event.kind === 'loot-cache') {
            expect(fv.event.currency).toBe(5);
        }
        if (nf.event.kind === 'loot-cache') {
            expect(nf.event.currency).toBe(10);
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

describe('NodeType <-> pool-id prefix contract (mechanics-ui audit [3.0] exploration row 4)', () => {
    // Without this contract a new map added with a `type: 'encounter'`
    // node but no encounter-pool registration would render the
    // encounter step-card AND fire a non-encounter event — the kind
    // of silent layout/pool mismatch the audit flagged.
    //
    // Pinning: `poolIdForNode(mapId, nodeId, type)` must return a
    // pool id whose prefix matches `type` (or `null` for the
    // current-location pseudo-type). All quest nodes resolve to
    // a `quest-*` id whether they have a per-node override or
    // fall back to `quest-common`.

    const PREFIX_BY_TYPE: Record<string, string> = {
        rest: 'rest-',
        gather: 'gather-',
        treasure: 'treasure-',
        quest: 'quest-',
        encounter: 'encounter-',
        boss: 'boss-',
        hazard: 'hazard-',
    };

    for (const layout of [fishingVillageLayout, northernForestLayout]) {
        for (const node of layout.nodes) {
            const expectedPrefix = PREFIX_BY_TYPE[node.type];
            // 'current' is the player's location pseudo-type; poolId
            // should be null (no event attaches).
            if (node.type === 'current') {
                it(`${layout.mapId}:${node.id} (current) → null pool id`, () => {
                    expect(poolIdForNode(layout.mapId, node.id, node.type)).toBeNull();
                });
                continue;
            }
            it(`${layout.mapId}:${node.id} (${node.type}) → pool id starts with "${expectedPrefix}"`, () => {
                const id = poolIdForNode(layout.mapId, node.id, node.type);
                expect(id).not.toBeNull();
                expect(id!.startsWith(expectedPrefix)).toBe(true);
            });
        }
    }

    it('every non-current node type in the PREFIX_BY_TYPE map matches the NodeType union (drift catch)', () => {
        // Sanity: if the engine ever adds a new node type, this
        // assertion is a chokepoint that drives the test author to
        // also extend PREFIX_BY_TYPE. We assert the present set
        // covers the layouts' actual types.
        const usedTypes = new Set<string>();
        for (const layout of [fishingVillageLayout, northernForestLayout]) {
            for (const node of layout.nodes) {
                if (node.type !== 'current') usedTypes.add(node.type);
            }
        }
        for (const t of usedTypes) {
            expect(PREFIX_BY_TYPE[t]).toBeDefined();
        }
    });
});
