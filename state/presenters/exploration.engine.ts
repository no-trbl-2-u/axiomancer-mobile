/**
 * Screen-level presenter for `app/(tabs)/exploration.tsx`.
 *
 * Stub per Spec 03 step (2). Spec 07 replaces the fixture with reads
 * from the engine's `WorldState` (current continent, node graph,
 * available actions per node).
 *
 * VM is *data only*; the screen resolves icons and palette by
 * mapping `kind`/`type` keys to its components.
 */

import type { GameStore } from 'axiomancer-mechanics';

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

export interface ExplorationViewModel {
    continent: string;
    region: string;
    /** Localised "Map ii of vii" string. */
    regionProgress: string;
    /** In-game day number (Roman numerals already formatted). */
    dayDisplay: string;
    nodes: readonly ExplorationNode[];
    edges: readonly ExplorationEdge[];
    actions: readonly ExplorationAction[];
    /** Optional event callout banner; `null` when no callout. */
    eventCallout: { title: string; iconKey: string } | null;
    /** Legend bottom strip — pre-formatted display strings. */
    legend: { left: string; right: string };
}

const STUB_VM: ExplorationViewModel = {
    continent: 'CONTINENT · IRON SKY',
    region: 'The Hanged Wood',
    regionProgress: 'Map ii of vii · 4 paths remain',
    dayDisplay: 'XXIV',
    nodes: [],
    edges: [],
    actions: [],
    eventCallout: null,
    legend: { left: '● TRODDEN  ◌ OPEN  ✕ SHUT', right: 'vii nodes · iii sealed' },
};

/**
 * Returns the exploration view-model. **Stub** — Spec 07 wires real
 * engine reads.
 */
export function selectExplorationViewModel(_state: GameStore): ExplorationViewModel {
    return freezeViewModel(STUB_VM);
}
