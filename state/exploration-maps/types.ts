import type { NodeType } from '@/state/presenters/exploration.engine';

/**
 * Mobile-side map layout fixture — **visual-layout-only post-Phase-27**.
 *
 * The unlock-graph source of truth lives in the engine's
 * `MapDefinition` registry (`getMapDefinition(continent, name)`); the
 * engine's `revealAdjacent` reducer reads neighbours from there. This
 * fixture is consulted for:
 *
 * - **Visual positions** (`x` / `y`) on the canonical 360×400 viewBox
 *   — the engine doesn't carry pixel coordinates.
 * - **Display labels and per-node thematic blurbs** — author-facing
 *   strings the engine doesn't carry.
 * - **Legacy `availableNodes` unlock propagation** — until the screen
 *   migrates to read the engine's `discoveredNodes` (future Phase 30
 *   TBD), `state/actions.ts:moveToAction` still uses `connectedNodes`
 *   below to call `worldUnlockNode`. Once the screen migrates, the
 *   `connectedNodes` field on `NodeLayout` can be dropped.
 */
export interface NodeLayout {
    /** Stable engine node id (matches MapState.currentNode / completedNodes / availableNodes / lockedNodes). */
    id: string;
    /** Pixel position on the canonical 360×400 viewBox. */
    x: number;
    y: number;
    label: string;
    type: NodeType;
    /** Outbound edges. Used for legacy `availableNodes` unlock propagation in `moveToAction` and for drawing edges in the screen. Engine's `revealAdjacent` reads its own copy from `getMapDefinition`. */
    connectedNodes: readonly string[];
    /** Thematic blurb shown on the node options drawer when this node is currently selectable. */
    description: string;
}

export interface MapLayout {
    /** Engine map name. */
    mapId: string;
    continent: string;
    region: string;
    /** Display copy for the header (e.g. "Map ii of vii · 4 paths remain"). */
    regionProgress: string;
    nodes: readonly NodeLayout[];
}
