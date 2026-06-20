import type { NodeType } from '@/state/presenters/exploration.engine';

/**
 * Mobile-side map layout fixture — **pure presentation** (positions + copy).
 *
 * The engine's `MapDefinition` registry (`getMapDefinition(continent, name)`)
 * is the single source of truth for the node GRAPH (which nodes exist, their
 * `connectedNodes`, and traversal/unlock), and the engine's MapEvent pools
 * (`getNodePrimaryEventKind`) are the source of truth for each node's KIND
 * (which icon to show). This fixture now supplies ONLY:
 *
 * - **Visual positions** (`x` / `y`) on the canonical 360×400 viewBox
 *   — the engine carries an abstract `location` grid, not pixel coordinates.
 * - **Display labels and per-node thematic blurbs** — author-facing strings
 *   the engine doesn't carry.
 *
 * `type` and `connectedNodes` are LEGACY/optional and no longer consumed —
 * the presenter reads node kind + edges from the engine. They remain optional
 * so existing fixtures keep compiling; new nodes omit them.
 */
export interface NodeLayout {
    /** Stable engine node id (matches MapState.currentNode / completedNodes / availableNodes / lockedNodes). */
    id: string;
    /** Pixel position on the canonical 360×400 viewBox. */
    x: number;
    y: number;
    label: string;
    /** @deprecated Node kind now comes from the engine (`getNodePrimaryEventKind`). Unused. */
    type?: NodeType;
    /** @deprecated Edges now come from the engine (`getMapDefinition().nodes[].connectedNodes`). Unused. */
    connectedNodes?: readonly string[];
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
