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

describe('per-quest-node NPC wiring (Phase 56)', () => {
    it('fv-6 (Ash Mire) resolves to an interaction with the boy-priest', () => {
        const state = stateAt('fishing-village', 'fv-6');
        const result = resolveMapEvent(state);
        expect(result.event.kind).toBe('interaction');
        if (result.event.kind === 'interaction') {
            // The engine's resolved interaction event carries the
            // npcName threaded from the pool payload. Layout
            // description for fv-6 names the "boy-priest".
            expect(result.event.npcName).toBe('boy-priest');
        }
    });

    it('nf-6 (Pilgrim\'s Cairn) resolves to an interaction with the forgotten-pilgrim', () => {
        const state = stateAt('northern-forest', 'nf-6');
        const result = resolveMapEvent(state);
        expect(result.event.kind).toBe('interaction');
        if (result.event.kind === 'interaction') {
            expect(result.event.npcName).toBe('forgotten-pilgrim');
        }
    });

    it('per-quest pools are distinct — each quest node fires its own npcName, not a shared placeholder', () => {
        const fvState = stateAt('fishing-village', 'fv-6');
        const nfState = stateAt('northern-forest', 'nf-6');
        const fvResult = resolveMapEvent(fvState);
        const nfResult = resolveMapEvent(nfState);

        const fvName = fvResult.event.kind === 'interaction' ? fvResult.event.npcName : null;
        const nfName = nfResult.event.kind === 'interaction' ? nfResult.event.npcName : null;

        expect(fvName).toBeDefined();
        expect(nfName).toBeDefined();
        expect(fvName).not.toBe(nfName);
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
