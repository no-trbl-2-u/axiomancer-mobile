import React from 'react';
import { ExplorationNode } from './ExplorationNode';
import type { ExplorationNode as ExplorationNodeType } from '@/state/presenters/exploration.engine';

interface NodeGridProps {
    nodes: readonly ExplorationNodeType[];
    onNodePress: (node: ExplorationNodeType) => void;
    labeledNodeIds: Set<string>;
}

export function NodeGrid({ nodes, onNodePress, labeledNodeIds }: NodeGridProps) {
    return (
        <>
            {/* Node markers */}
            {nodes.map((n) => (
                <ExplorationNode
                    key={n.id}
                    node={n}
                    onNodePress={onNodePress}
                    shouldShowLabel={labeledNodeIds.has(n.id)}
                />
            ))}
        </>
    );
}