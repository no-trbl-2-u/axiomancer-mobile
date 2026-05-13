import type { NodeType } from '@/state/presenters/exploration.engine';

export interface NodeLayout {
    /** Stable engine node id (matches WorldMap.startingNode.id / completedNodes / availableNodes / lockedNodes). */
    id: string;
    /** Pixel position on the canonical 360×400 viewBox. */
    x: number;
    y: number;
    label: string;
    type: NodeType;
    /** Outbound edges. Used for unlock propagation on `moveTo` and for drawing edges. */
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
