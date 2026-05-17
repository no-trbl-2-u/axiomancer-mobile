/**
 * Screen-level presenter for `app/(tabs)/exploration/index.tsx`.
 *
 * Spec 07: drives the exploration view-model from `state.world`. Node
 * positions, labels, types, and connectivity live in a per-map fixture
 * (`app/(tabs)/exploration/maps/<map-id>.layout.ts`, Q1=A); engine state
 * supplies the completed / available / locked buckets and the
 * presenter-tracked `currentNodeId`. Tapping a locked node is a no-op
 * (Q5=B) — the screen renders locked nodes desaturated to convey state.
 */

import type { GameStore } from 'axiomancer-mechanics';

import { readCurrentNodeId } from '../actions';
import { getMapLayout, type NodeLayout } from '@/state/exploration-maps';
import { freezeViewModel } from './freeze';

export type NodeKind = 'completed' | 'current' | 'available' | 'locked';
export type NodeType =
    | 'rest'
    | 'gather'
    | 'current'
    | 'encounter'
    | 'treasure'
    | 'boss'
    | 'quest';

export interface ExplorationNode {
    /** Stable engine node ID. */
    id: string;
    /** Pixel position on the canonical 360×400 viewBox. */
    x: number;
    y: number;
    kind: NodeKind;
    label: string;
    type: NodeType;
    /** True when tapping the node should trigger combat. */
    triggersCombat: boolean;
}

export interface ExplorationEdge {
    fromId: string;
    toId: string;
    /** True when the player has already traversed this edge. */
    traveled: boolean;
    /** True when either endpoint is locked. */
    locked: boolean;
}

export interface ExplorationAction {
    /** Stable action key (snake_case engine name). */
    key: string;
    /** Display label, may contain `\n` for two-line cards. */
    label: string;
    /** Icon key the screen maps to an `ActionIcon` kind. */
    iconKey: string;
    /** Sub-label tag (`'TRAVEL · 1 TURN'`). */
    tag: string;
    selected: boolean;
}

/**
 * League indicator for the WHITHER, PILGRIM? step-cards — three buckets
 * (I = closest, II = middle, III = farthest). Pure presenter derivation
 * from Euclidean distance between the current node and the option node
 * on the canonical 360×400 viewBox. Ported from the prototype's
 * `StepCardClickable` (see `prototype.jsx:184-208` in the Claude Design
 * handoff — every step-card carries a `leagues` glyph on its right).
 */
export type LeagueBucket = 'I' | 'II' | 'III';

export interface ExplorationOption {
    /** Engine node id the option moves the player to. */
    nodeId: string;
    label: string;
    type: NodeType;
    /** Thematic blurb sourced from the layout fixture. */
    description: string;
    /** Distance indicator for the step-card right column. */
    leagues: LeagueBucket;
}

export interface ExplorationViewModel {
    continent: string;
    region: string;
    /** Localised "Map ii of vii" string. */
    regionProgress: string;
    /** In-game day number (Roman numerals already formatted). */
    dayDisplay: string;
    /** Engine map id (used to drive map transitions). */
    mapId: string;
    /** Engine node id of the player's current location. */
    currentNodeId: string;
    nodes: readonly ExplorationNode[];
    edges: readonly ExplorationEdge[];
    actions: readonly ExplorationAction[];
    /** Next-step picker shown beneath the map (Q6). */
    options: readonly ExplorationOption[];
    /**
     * Drawer-strip copy. Lowercase ritual register where narrative;
     * uppercase chrome where chrome. The screen renders every field
     * verbatim so view-layer code carries no display literals
     * (Hard Rule #8). `emptyMessage` shows when `options` is empty;
     * `title` is the section eyebrow above the step-card list;
     * `leaguesLabel` is the right-column header on each step-card.
     */
    drawerCopy: {
        emptyMessage: string;
        title: string;
        leaguesLabel: string;
    };
    /** Optional event callout banner; `null` when no callout. */
    eventCallout: { title: string; iconKey: string } | null;
    /** Legend bottom strip — pre-formatted display strings. */
    legend: { left: string; right: string };
}

const ACTION_ICON_BY_TYPE: Record<NodeType, string> = {
    rest: 'flame',
    gather: 'bag',
    current: 'eye',
    encounter: 'flee',
    treasure: 'scroll',
    boss: 'sword',
    quest: 'scroll',
};

const ACTION_TAG_BY_TYPE: Record<NodeType, string> = {
    rest: 'HEAL · COSTLY',
    gather: 'NODE · GATHER',
    current: 'YOU ARE HERE',
    encounter: 'TRAVEL · 1 TURN',
    treasure: 'SKILL · MIND',
    boss: 'TRAVEL · BOSS',
    quest: 'LORE',
};

const ENCOUNTER_NODE_TYPES = new Set<NodeType>(['encounter', 'boss']);

function classifyNode(
    layout: NodeLayout,
    currentNodeId: string,
    completed: readonly string[],
    available: readonly string[],
): NodeKind {
    if (layout.id === currentNodeId) return 'current';
    if (completed.includes(layout.id)) return 'completed';
    if (available.includes(layout.id)) return 'available';
    return 'locked';
}

function buildEdges(
    nodes: readonly NodeLayout[],
    completed: readonly string[],
    locked: readonly string[],
): ExplorationEdge[] {
    const edges: ExplorationEdge[] = [];
    const seen = new Set<string>();
    for (const node of nodes) {
        for (const target of node.connectedNodes) {
            const key = node.id < target ? `${node.id}|${target}` : `${target}|${node.id}`;
            if (seen.has(key)) continue;
            seen.add(key);
            const traveled = completed.includes(node.id) && completed.includes(target);
            const isLocked = locked.includes(node.id) || locked.includes(target);
            edges.push({ fromId: node.id, toId: target, traveled, locked: isLocked });
        }
    }
    return edges;
}

/**
 * Bucket an Euclidean distance (in 360×400 viewBox pixels) into a
 * three-band league indicator. Cutoffs are calibrated against the
 * canonical layout fixtures — most "next step" hops sit in the 40-140
 * range, so 80 / 160 gives a roughly even three-way split across the
 * shipped maps. Pure function; tested in
 * `state/e2e/exploration.engine.test.ts`.
 */
function leaguesFromDistance(d: number): LeagueBucket {
    if (d <= 80) return 'I';
    if (d <= 160) return 'II';
    return 'III';
}

function buildOptions(
    layout: readonly NodeLayout[],
    available: readonly string[],
    currentNodeId: string,
): ExplorationOption[] {
    const order = new Map(layout.map((n, i) => [n.id, i] as const));
    const current = layout.find((n) => n.id === currentNodeId) ?? null;
    return available
        .filter((id) => order.has(id))
        .sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0))
        .map((id) => {
            const n = layout.find((node) => node.id === id)!;
            const distance =
                current === null
                    ? 0
                    : Math.hypot(n.x - current.x, n.y - current.y);
            return {
                nodeId: n.id,
                label: n.label,
                type: n.type,
                description: n.description,
                leagues: leaguesFromDistance(distance),
            };
        });
}

function buildActions(options: readonly ExplorationOption[]): ExplorationAction[] {
    return options.map((opt, i) => ({
        key: `move-${opt.nodeId}`,
        label: opt.label,
        iconKey: ACTION_ICON_BY_TYPE[opt.type],
        tag: ACTION_TAG_BY_TYPE[opt.type],
        selected: i === 0,
    }));
}

const DRAWER_COPY = {
    emptyMessage: 'the paths close.',
    title: '✠ WHITHER, PILGRIM?',
    leaguesLabel: 'LEAGUES',
} as const;

const FALLBACK_VM: ExplorationViewModel = {
    continent: 'CONTINENT · UNKNOWN',
    region: '—',
    regionProgress: '',
    dayDisplay: 'I',
    mapId: '',
    currentNodeId: '',
    nodes: [],
    edges: [],
    actions: [],
    options: [],
    drawerCopy: DRAWER_COPY,
    eventCallout: null,
    legend: { left: '● TRODDEN  ◌ OPEN  ✕ SHUT', right: '' },
};

export function selectExplorationViewModel(state: GameStore): ExplorationViewModel {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const world = (state as any).world;
    if (!world || !world.currentMap || !world.currentContinent) {
        return freezeViewModel(FALLBACK_VM);
    }

    const layout = getMapLayout(world.currentMap.name);
    if (layout === null) {
        return freezeViewModel({
            ...FALLBACK_VM,
            continent: `CONTINENT · ${String(world.currentContinent.name).toUpperCase()}`,
            region: world.currentMap.name,
            mapId: world.currentMap.name,
            currentNodeId: readCurrentNodeId(world),
        });
    }

    const completed = world.currentMap.completedNodes as readonly string[];
    const available = world.currentMap.availableNodes as readonly string[];
    const locked = world.currentMap.lockedNodes as readonly string[];
    const currentNodeId = readCurrentNodeId(world);

    const nodes: ExplorationNode[] = layout.nodes.map((n) => {
        const kind = classifyNode(n, currentNodeId, completed, available);
        return {
            id: n.id,
            x: n.x,
            y: n.y,
            kind,
            label: n.label,
            type: n.type,
            triggersCombat: kind === 'available' && ENCOUNTER_NODE_TYPES.has(n.type),
        };
    });

    const options = buildOptions(layout.nodes, available, currentNodeId);
    const actions = buildActions(options);
    const edges = buildEdges(layout.nodes, completed, locked);

    return freezeViewModel({
        continent: layout.continent,
        region: layout.region,
        regionProgress: layout.regionProgress,
        dayDisplay: 'XXIV',
        mapId: world.currentMap.name,
        currentNodeId,
        nodes,
        edges,
        actions,
        options,
        drawerCopy: DRAWER_COPY,
        eventCallout: null,
        legend: {
            left: '● TRODDEN  ◌ OPEN  ✕ SHUT',
            right: `${layout.nodes.length} nodes · ${locked.length} sealed`,
        },
    });
}
