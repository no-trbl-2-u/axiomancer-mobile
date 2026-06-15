import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NodeGrid } from '../NodeGrid';

const mockNodes = [
    {
        id: 'node-1',
        label: 'First Node',
        kind: 'available' as const,
        type: 'encounter' as const,
        x: 100,
        y: 200,
        triggersCombat: true,
    },
    {
        id: 'node-2',
        label: 'Second Node',
        kind: 'available' as const,
        type: 'treasure' as const,
        x: 300,
        y: 400,
        triggersCombat: false,
    },
    {
        id: 'node-3',
        label: 'Third Node',
        kind: 'locked' as const,
        type: 'boss' as const,
        x: 500,
        y: 600,
        triggersCombat: true,
    },
];

const mockOnNodePress = jest.fn();

describe('NodeGrid', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders all nodes correctly', () => {
        const labeledNodeIds = new Set(['node-1', 'node-3']);
        const { getByTestId } = render(
            <NodeGrid
                nodes={mockNodes}
                onNodePress={mockOnNodePress}
                labeledNodeIds={labeledNodeIds}
            />
        );

        expect(getByTestId('node-node-1')).toBeDefined();
        expect(getByTestId('node-node-2')).toBeDefined();
        expect(getByTestId('node-node-3')).toBeDefined();
    });

    it('renders empty grid correctly', () => {
        const { toJSON } = render(
            <NodeGrid
                nodes={[]}
                onNodePress={mockOnNodePress}
                labeledNodeIds={new Set<string>()}
            />
        );

        expect(toJSON()).toEqual(null);
    });

    it('passes onNodePress handler to available nodes only', () => {
        const labeledNodeIds = new Set<string>();
        const { getByTestId } = render(
            <NodeGrid
                nodes={mockNodes}
                onNodePress={mockOnNodePress}
                labeledNodeIds={labeledNodeIds}
            />
        );

        fireEvent.press(getByTestId('node-node-1'));
        expect(mockOnNodePress).toHaveBeenCalledWith(mockNodes[0]);

        fireEvent.press(getByTestId('node-node-2'));
        expect(mockOnNodePress).toHaveBeenCalledWith(mockNodes[1]);

        // Locked nodes don't trigger onPress due to accessibility disabled state
        fireEvent.press(getByTestId('node-node-3'));
        expect(mockOnNodePress).toHaveBeenCalledTimes(2); // Only 2 calls, not 3
        expect(mockOnNodePress).not.toHaveBeenCalledWith(mockNodes[2]);
    });

    it('correctly passes labeled node IDs to child components', () => {
        const labeledNodeIds = new Set(['node-1', 'node-2']);
        const { getByText, queryByText } = render(
            <NodeGrid
                nodes={mockNodes}
                onNodePress={mockOnNodePress}
                labeledNodeIds={labeledNodeIds}
            />
        );

        // Node 1 should show label (in set and available)
        expect(getByText('First Node')).toBeDefined();
        expect(getByText('ENCOUNTER')).toBeDefined();

        // Node 2 should show label (in set and available)
        expect(getByText('Second Node')).toBeDefined();
        expect(getByText('TREASURE')).toBeDefined();

        // Node 3 should not show label (locked nodes don't show labels even if in set)
        expect(queryByText('Third Node')).toBeNull();
        expect(queryByText('BOSS')).toBeNull();
    });

    it('handles single node correctly', () => {
        const singleNode = [mockNodes[0]];
        const labeledNodeIds = new Set(['node-1']);
        const { getByTestId, getByText } = render(
            <NodeGrid
                nodes={singleNode}
                onNodePress={mockOnNodePress}
                labeledNodeIds={labeledNodeIds}
            />
        );

        expect(getByTestId('node-node-1')).toBeDefined();
        expect(getByText('First Node')).toBeDefined();

        fireEvent.press(getByTestId('node-node-1'));
        expect(mockOnNodePress).toHaveBeenCalledWith(singleNode[0]);
    });

    it('handles labeled nodes set changes correctly', () => {
        const initialLabeledIds = new Set(['node-1']);
        const { getByText, queryByText, rerender } = render(
            <NodeGrid
                nodes={mockNodes}
                onNodePress={mockOnNodePress}
                labeledNodeIds={initialLabeledIds}
            />
        );

        // Initially only node 1 should show label
        expect(getByText('First Node')).toBeDefined();
        expect(queryByText('Second Node')).toBeNull();

        // Update to show node 2 instead
        const updatedLabeledIds = new Set(['node-2']);
        rerender(
            <NodeGrid
                nodes={mockNodes}
                onNodePress={mockOnNodePress}
                labeledNodeIds={updatedLabeledIds}
            />
        );

        // Now only node 2 should show label
        expect(queryByText('First Node')).toBeNull();
        expect(getByText('Second Node')).toBeDefined();
    });

    it('handles available nodes only showing labels', () => {
        // Test with mixed available and locked nodes
        const availableOnlyNodes = [
            {
                id: 'avail-1',
                label: 'Available Node',
                kind: 'available' as const,
                type: 'encounter' as const,
                x: 100,
                y: 200,
                triggersCombat: true,
            },
            {
                id: 'locked-1',
                label: 'Locked Node',
                kind: 'locked' as const,
                type: 'boss' as const,
                x: 300,
                y: 400,
                triggersCombat: true,
            },
        ];
        
        const labeledNodeIds = new Set(['avail-1', 'locked-1']);
        const { getByText, queryByText } = render(
            <NodeGrid
                nodes={availableOnlyNodes}
                onNodePress={mockOnNodePress}
                labeledNodeIds={labeledNodeIds}
            />
        );

        // Available node should show label even though both are in the set
        expect(getByText('Available Node')).toBeDefined();
        expect(getByText('ENCOUNTER')).toBeDefined();
        
        // Locked node should NOT show label even though it's in the set
        expect(queryByText('Locked Node')).toBeNull();
        expect(queryByText('BOSS')).toBeNull();
    });
});