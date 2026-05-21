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
    consumableLibrary,
    equipmentTemplates,
    registerMapEventPool,
    setNodeEventPoolOverride,
    type EnemySlug,
    type Equipment,
    type EquipmentTemplate,
    type Item,
    type MapEventPool,
    type Material,
} from 'axiomancer-mechanics';

import { fishingVillageLayout } from './fishing-village.layout';
import { northernForestLayout } from './northern-forest.layout';
import type { NodeType } from '@/state/presenters/exploration.engine';

const CONTINENT = 'coastal-continent';

/** Pool id constants — kept on a single object so the
 * node-type-to-pool mapping is easy to scan. */
const POOL_IDS = {
    restCommon: 'rest-common',
    /** Fallback gather pool — used if a node doesn't have a
     * per-map gather override (defensive default). */
    gatherCommon: 'gather-common',
    /** Per-map gather pools — Phase 57 (1-2 materials per locale). */
    gatherFishingVillage: 'gather-fishing-village',
    gatherNorthernForest: 'gather-northern-forest',
    /** Fallback treasure pool — defensive default. */
    treasureCommon: 'treasure-common',
    /** Per-map treasure pools — Phase 57 (1-3 items per locale). */
    treasureFishingVillage: 'treasure-fishing-village',
    treasureNorthernForest: 'treasure-northern-forest',
    /** Fallback quest pool — used only if a quest node lacks a
     * per-node override. Production should always have an override
     * registered (see QUEST_NPCS), so this is a defensive default. */
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

/**
 * Phase 56 — per-quest-node NPC mapping. The engine's
 * interaction handler threads `npcName` straight through to the
 * event payload; the dialogue lookup happens later when the
 * player picks a choice. Thematic names sourced from each quest
 * node's layout description so the surfaced NPC matches the
 * narrative copy on the node.
 *
 * Key format: `<continent>:<mapId>:<nodeId>` → npcName.
 */
const QUEST_NPCS: Record<string, string> = {
    // fv-6 "Ash Mire": "The mire where the boy-priest told you to look."
    'coastal-continent:fishing-village:fv-6': 'boy-priest',
    // nf-6 "Pilgrim's Cairn": "A cairn raised by some earlier pilgrim. Names worn flat."
    'coastal-continent:northern-forest:nf-6': 'forgotten-pilgrim',
};

/** Pool id for a specific quest-node NPC. */
function questPoolIdFor(mapId: string, nodeId: string): string {
    return `quest-${mapId}-${nodeId}`;
}

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

function gatherPool(id: string, items: ReadonlyArray<Item> = []): MapEventPool {
    return {
        id,
        entries: [
            {
                kind: 'gathering',
                weight: 1,
                payload: { kind: 'gathering', items },
            },
        ],
    };
}

function treasurePool(
    id: string,
    items: ReadonlyArray<Item> = [],
    currency: number = 0,
): MapEventPool {
    return {
        id,
        entries: [
            {
                kind: 'loot-cache',
                weight: 1,
                payload: { kind: 'loot-cache', items, currency },
            },
        ],
    };
}

/** Phase 57 — synthesize a Material item. Engine 0.10.0 doesn't
 * ship a Material library; mobile constructs them inline from
 * the BaseItem + Material shape (id / name / description /
 * category='material' / quantity). */
function material(id: string, name: string, description: string, quantity = 1): Material {
    return {
        id,
        name,
        description,
        category: 'material',
        quantity,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any as Material;
}

/** Phase 57 — convert an EquipmentTemplate to a full Equipment
 * item by stamping the BaseItem fields the template lacks.
 * Mirrors the helper in `state/actions.ts:templateToEquipment`
 * (Phase 54 origin); duplicated here to avoid cross-importing
 * the action layer from the data layer. */
function templateToEquipment(template: EquipmentTemplate): Equipment {
    return {
        ...template,
        category: 'equipment',
        stackable: false,
        quantity: 1,
        rarity: 'common',
        modifiers: [],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any as Equipment;
}

/** Lookup helper — pull a consumable from the engine library or
 * return null. */
function consumable(id: string): Item | null {
    const found = consumableLibrary.find((c) => c.id === id);
    return (found ?? null) as Item | null;
}

/** Lookup helper — pull an equipment template + convert. */
function equipment(id: string): Item | null {
    const tpl = equipmentTemplates.find((t) => t.id === id);
    return tpl ? templateToEquipment(tpl) : null;
}

/** Compact item-list factory: filters out lookup misses so callers
 * can list a few candidate ids without crashing on a typo. */
function items(...candidates: ReadonlyArray<Item | null>): ReadonlyArray<Item> {
    return candidates.filter((c): c is Item => c !== null);
}

function questPool(id: string, npcName: string = 'pilgrim'): MapEventPool {
    // Quest nodes thread to the engine's interaction handler — the
    // engine's `interaction` payload carries an npcName which the
    // dialogue runtime resolves. Per-quest-node mappings live in
    // `QUEST_NPCS`; the questCommon pool here is the fallback
    // used if a quest node lacks an override.
    return {
        id,
        entries: [
            {
                kind: 'interaction',
                weight: 1,
                payload: { kind: 'interaction', npcName },
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
 * Phase 57 — per-map treasure rosters. fishing-village treasure
 * leans coastal/early-game (low-tier consumables + cloth/leather
 * gear); northern-forest treasure leans mid-tier and forest-
 * themed (still pulls from the same engine libraries since 0.10.0
 * doesn't ship locale-segmented item registries).
 */
const FISHING_VILLAGE_TREASURE: ReadonlyArray<Item> = items(
    consumable('minor-healing-potion'),
    equipment('leather-cap'),
    equipment('cloth-wrap'),
);

const NORTHERN_FOREST_TREASURE: ReadonlyArray<Item> = items(
    consumable('healing-potion'),
    consumable('clarity-serum'),
    equipment('iron-blade'),
);

/**
 * Phase 57 — per-map gathering rosters. Synthesized Materials
 * since 0.10.0 doesn't expose a Material library; each material
 * is locale-themed.
 */
const FISHING_VILLAGE_GATHER: ReadonlyArray<Item> = [
    material(
        'barnacle-cluster',
        'Barnacle Cluster',
        'A handful of barnacles scraped from a piling. Stinks of low tide.',
    ),
    material(
        'salt-rope',
        'Salt-Rope',
        'A coil of frayed rope, white with sea salt. Sturdy enough.',
    ),
];

const NORTHERN_FOREST_GATHER: ReadonlyArray<Item> = [
    material(
        'moth-dust',
        'Moth-Dust',
        'A pinch of pale dust shaken from a lullaby-moth wing.',
    ),
    material(
        'larch-ash',
        'Pinch of Larch Ash',
        'Ash from a cold hearth. Smells faintly of resin.',
    ),
];

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

/** Phase 56 — per-quest-node pools sourced from QUEST_NPCS. */
const QUEST_POOLS: ReadonlyArray<MapEventPool> = (() => {
    const out: MapEventPool[] = [];
    for (const key of Object.keys(QUEST_NPCS)) {
        const [_continent, mapId, nodeId] = key.split(':');
        const npcName = QUEST_NPCS[key];
        out.push(questPool(questPoolIdFor(mapId, nodeId), npcName));
    }
    return out;
})();

/** All pools the mobile loop registers with the engine. */
const POOLS: ReadonlyArray<MapEventPool> = [
    restPool(POOL_IDS.restCommon),
    // Phase 57 — per-map gather + treasure pools with content.
    gatherPool(POOL_IDS.gatherCommon),
    gatherPool(POOL_IDS.gatherFishingVillage, FISHING_VILLAGE_GATHER),
    gatherPool(POOL_IDS.gatherNorthernForest, NORTHERN_FOREST_GATHER),
    treasurePool(POOL_IDS.treasureCommon),
    treasurePool(POOL_IDS.treasureFishingVillage, FISHING_VILLAGE_TREASURE, 5),
    treasurePool(POOL_IDS.treasureNorthernForest, NORTHERN_FOREST_TREASURE, 10),
    questPool(POOL_IDS.questCommon),
    ...QUEST_POOLS,
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

/** Maps a node type to the right pool id for a given map +
 * specific node id. Phase 56 layers per-quest-node overrides on
 * top of the per-type defaults: a quest node with a `QUEST_NPCS`
 * entry resolves to its per-node pool; quest nodes without an
 * entry fall back to `questCommon`. */
function poolIdForNode(mapId: string, nodeId: string, nodeType: NodeType): string | null {
    switch (nodeType) {
        case 'rest':
            return POOL_IDS.restCommon;
        case 'gather':
            if (mapId === 'fishing-village') return POOL_IDS.gatherFishingVillage;
            if (mapId === 'northern-forest') return POOL_IDS.gatherNorthernForest;
            return POOL_IDS.gatherCommon;
        case 'treasure':
            if (mapId === 'fishing-village') return POOL_IDS.treasureFishingVillage;
            if (mapId === 'northern-forest') return POOL_IDS.treasureNorthernForest;
            return POOL_IDS.treasureCommon;
        case 'quest': {
            const npcKey = `${CONTINENT}:${mapId}:${nodeId}`;
            if (QUEST_NPCS[npcKey]) {
                return questPoolIdFor(mapId, nodeId);
            }
            return POOL_IDS.questCommon;
        }
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
            const poolId = poolIdForNode(layout.mapId, node.id, node.type);
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

/**
 * Phase 61f — DEV-only per-node event-kind override. Targets the
 * current node with a pool matching the requested kind so the
 * next `resolveMapEvent` fires that kind regardless of the node's
 * canonical type. Sibling to `setChaosMode` but per-node + per-kind
 * rather than chaos-wide.
 *
 * No-op in production (`__DEV__` false). Returns `true` if the
 * override was applied, `false` if the kind has no matching pool
 * (or `__DEV__` is false).
 */
export function forceEventKindOnNode(
    mapId: string,
    nodeId: string,
    kind: NodeType,
): boolean {
    if (!__DEV__) return false;
    const poolId = poolIdForNode(mapId, nodeId, kind);
    if (poolId === null) return false;
    setNodeEventPoolOverride(CONTINENT, mapId, nodeId, poolId);
    return true;
}

// Auto-register on module load. The pool registry is global engine
// state; one registration at app boot is sufficient.
registerExplorationEventPools();

// Re-export for tests + the auto-seed flow.
export { POOL_IDS };
