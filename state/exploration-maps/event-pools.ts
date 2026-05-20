/**
 * Map event pool registration — bridges mobile-side node-type
 * signal to the engine's `resolveMapEvent` lookup.
 *
 * Background (per /jot c3c4e4e): walking onto an encounter node
 * in either fishing-village or northern-forest produced no event
 * because the engine's pool registry was empty — `resolveMapEvent`
 * returns `{ kind: 'none' }` when no pool is registered for the
 * current node. Mobile's layout files annotate every node with a
 * `type` (encounter / boss / rest / gather / treasure / quest) for
 * display, but the engine doesn't carry that signal; it expects
 * the host to register pools per node id.
 *
 * Resolution strategy:
 *   - One pool per node type (rest / gather / treasure / quest)
 *     shared across maps; per-map encounter / boss pools so the
 *     enemy slug matches the locale (e.g. fishing-village
 *     encounters fire `tidepool-crab`, northern-forest fires
 *     `disatree`).
 *   - For each node in the mobile layout, register a per-node
 *     override mapping its type to the corresponding pool id.
 *
 * Registration is a global engine-state side-effect; safe to call
 * multiple times (the engine's Map.set semantics make it idempotent).
 * Production registers on import via `app/_layout.tsx`; tests can
 * re-call freely.
 */

import {
    registerMapEventPool,
    setNodeEventPoolOverride,
    type EnemySlug,
    type MapEventPool,
} from 'axiomancer-mechanics';

import { fishingVillageLayout } from './fishing-village.layout';
import { northernForestLayout } from './northern-forest.layout';
import type { NodeType } from '@/state/presenters/exploration.engine';

const CONTINENT = 'coastal-continent';

/** Pool id constants — kept on a single object so the
 * node-type-to-pool mapping is easy to scan. */
const POOL_IDS = {
    restCommon: 'rest-common',
    gatherCommon: 'gather-common',
    treasureCommon: 'treasure-common',
    questCommon: 'quest-common',
    encounterFishingVillage: 'encounter-fishing-village',
    encounterNorthernForest: 'encounter-northern-forest',
    bossFishingVillage: 'boss-fishing-village',
    bossNorthernForest: 'boss-northern-forest',
    /** Phase 58: DEV-only pool with weighted entries across
     * multiple event kinds. When `setChaosMode(true)` is called,
     * every node in both layouts gets overridden to this pool so
     * the user can stumble into any event kind from any node for
     * manual testing. */
    chaos: 'chaos-pool',
} as const;

function encounterPool(id: string, enemySlug: EnemySlug, isBoss = false): MapEventPool {
    return {
        id,
        entries: [
            {
                kind: 'encounter',
                weight: 1,
                payload: { kind: 'encounter', enemySlug, isBoss },
            },
        ],
    };
}

/**
 * Phase 55 — multi-entry encounter pool: weighted entries
 * across multiple enemy slugs so the same node samples a
 * variety of foes across visits. Simple-tier foes carry
 * higher weight than normal-tier so the encounter feel
 * matches the locale's difficulty curve.
 */
interface WeightedEnemy {
    slug: EnemySlug;
    weight: number;
}

function multiEncounterPool(id: string, enemies: ReadonlyArray<WeightedEnemy>): MapEventPool {
    return {
        id,
        entries: enemies.map((e) => ({
            kind: 'encounter' as const,
            weight: e.weight,
            payload: { kind: 'encounter' as const, enemySlug: e.slug },
        })),
    };
}

function restPool(id: string): MapEventPool {
    return {
        id,
        entries: [
            {
                kind: 'rest',
                weight: 1,
                payload: { kind: 'rest', healFraction: 0.5 },
            },
        ],
    };
}

function gatherPool(id: string): MapEventPool {
    return {
        id,
        entries: [
            {
                kind: 'gathering',
                weight: 1,
                payload: { kind: 'gathering', items: [] },
            },
        ],
    };
}

function treasurePool(id: string): MapEventPool {
    return {
        id,
        entries: [
            {
                kind: 'loot-cache',
                weight: 1,
                payload: { kind: 'loot-cache' },
            },
        ],
    };
}

function questPool(id: string): MapEventPool {
    // Quest nodes thread to the engine's interaction handler — the
    // engine's `interaction` payload carries an npcName which the
    // dialogue runtime resolves. Mobile uses a generic placeholder
    // npc name for now; per-node NPC wiring is a follow-up.
    return {
        id,
        entries: [
            {
                kind: 'interaction',
                weight: 1,
                payload: { kind: 'interaction', npcName: 'pilgrim' },
            },
        ],
    };
}

function chaosPool(id: string): MapEventPool {
    // Weighted entries across multiple event kinds so a single
    // node can fire encounter / hazard / gathering / loot-cache /
    // rest with non-trivial spread. Equal weights for a true
    // sampling distribution.
    return {
        id,
        entries: [
            {
                kind: 'encounter',
                weight: 1,
                payload: { kind: 'encounter', enemySlug: 'tidepool-crab' },
            },
            {
                kind: 'hazard',
                weight: 1,
                payload: { kind: 'hazard', damage: 5 },
            },
            {
                kind: 'gathering',
                weight: 1,
                payload: { kind: 'gathering', items: [] },
            },
            {
                kind: 'loot-cache',
                weight: 1,
                payload: { kind: 'loot-cache' },
            },
            {
                kind: 'rest',
                weight: 1,
                payload: { kind: 'rest', healFraction: 0.5 },
            },
        ],
    };
}

/**
 * Per-map encounter rosters — sourced from
 * `EnemiesByMap[mapName]` in the engine 0.10.0 library. Simple-
 * difficulty foes weighted 3×; normal-difficulty foes weighted 1×
 * so the encounter feel matches the locale's level curve while
 * keeping variety in every visit. Elite / boss enemies stay out
 * of the standard encounter pool — they ship through the
 * dedicated boss-pool overrides on boss-typed nodes.
 */
const FISHING_VILLAGE_ENCOUNTERS: ReadonlyArray<WeightedEnemy> = [
    { slug: 'tidepool-crab', weight: 3 },   // simple
    { slug: 'sea-mist-wisp', weight: 3 },   // simple
    { slug: 'wet-hound', weight: 1 },       // normal
    { slug: 'mournful-gull', weight: 1 },   // normal
];

const NORTHERN_FOREST_ENCOUNTERS: ReadonlyArray<WeightedEnemy> = [
    { slug: 'lullaby-moth', weight: 3 },        // simple
    { slug: 'disatree', weight: 1 },            // normal
    { slug: 'forest-sprite', weight: 1 },       // normal
    { slug: 'argumentative-crow', weight: 1 },  // normal
];

/** All pools the mobile loop registers with the engine. */
const POOLS: ReadonlyArray<MapEventPool> = [
    restPool(POOL_IDS.restCommon),
    gatherPool(POOL_IDS.gatherCommon),
    treasurePool(POOL_IDS.treasureCommon),
    questPool(POOL_IDS.questCommon),
    // Fishing-village + northern-forest encounter pools (Phase 55) —
    // weighted across multiple enemies per map.
    multiEncounterPool(POOL_IDS.encounterFishingVillage, FISHING_VILLAGE_ENCOUNTERS),
    multiEncounterPool(POOL_IDS.encounterNorthernForest, NORTHERN_FOREST_ENCOUNTERS),
    // Boss pools stay single-entry — bosses are signature encounters.
    encounterPool(POOL_IDS.bossFishingVillage, 'coastal-tyrant', true),
    encounterPool(POOL_IDS.bossNorthernForest, 'the-disagreement', true),
    // Phase 58 — DEV chaos pool.
    chaosPool(POOL_IDS.chaos),
];

/** Maps a node type to the right pool id for a given map. */
function poolIdForNode(mapId: string, nodeType: NodeType): string | null {
    switch (nodeType) {
        case 'rest':
            return POOL_IDS.restCommon;
        case 'gather':
            return POOL_IDS.gatherCommon;
        case 'treasure':
            return POOL_IDS.treasureCommon;
        case 'quest':
            return POOL_IDS.questCommon;
        case 'encounter':
            if (mapId === 'fishing-village') return POOL_IDS.encounterFishingVillage;
            if (mapId === 'northern-forest') return POOL_IDS.encounterNorthernForest;
            return POOL_IDS.encounterFishingVillage;
        case 'boss':
            if (mapId === 'fishing-village') return POOL_IDS.bossFishingVillage;
            if (mapId === 'northern-forest') return POOL_IDS.bossNorthernForest;
            return POOL_IDS.bossFishingVillage;
        case 'current':
            // 'current' is the player's current location — no event
            // attaches to it (it's a display state, not a node
            // resolution).
            return null;
    }
}

/**
 * Register every pool + node override the mobile exploration
 * layouts imply. Safe to call multiple times — pool ids and
 * override keys overwrite on each call.
 */
export function registerExplorationEventPools(): void {
    for (const pool of POOLS) registerMapEventPool(pool);

    for (const layout of [fishingVillageLayout, northernForestLayout]) {
        for (const node of layout.nodes) {
            const poolId = poolIdForNode(layout.mapId, node.type);
            if (poolId !== null) {
                setNodeEventPoolOverride(CONTINENT, layout.mapId, node.id, poolId);
            }
        }
    }
}

/**
 * Phase 58 — DEV-only chaos mode toggle. When `on === true`,
 * overrides every node in both layouts to the chaos pool so the
 * user can sample any event kind from any node for manual
 * testing. When `on === false`, restores the canonical per-node
 * overrides by re-calling `registerExplorationEventPools()`.
 *
 * No-op in production (`__DEV__` false) so the toggle has no
 * effect on shipped builds; the toggle's component caller is
 * itself `__DEV__`-guarded but this is belt-and-braces.
 */
export function setChaosMode(on: boolean): void {
    if (!__DEV__) return;
    if (on) {
        for (const layout of [fishingVillageLayout, northernForestLayout]) {
            for (const node of layout.nodes) {
                if (node.type === 'current') continue;
                setNodeEventPoolOverride(
                    CONTINENT,
                    layout.mapId,
                    node.id,
                    POOL_IDS.chaos,
                );
            }
        }
    } else {
        registerExplorationEventPools();
    }
}

// Auto-register on module load. The pool registry is global engine
// state; one registration at app boot is sufficient.
registerExplorationEventPools();

// Re-export for tests + the auto-seed flow.
export { POOL_IDS };
