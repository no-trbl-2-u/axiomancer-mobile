import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ExplorationNode } from '../ExplorationNode';

const mockNode = {
    id: 'node-1',
    label: 'Test Node',
    kind: 'available' as const,
    type: 'encounter' as const,
    x: 100,
    y: 200,
    triggersCombat: true,
};

const mockOnNodePress = jest.fn();

describe('ExplorationNode', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders correctly', () => {
        const { getByTestId } = render(
            <ExplorationNode
                node={mockNode}
                onNodePress={mockOnNodePress}
                shouldShowLabel={false}
            />
        );

        expect(getByTestId('node-node-1')).toBeDefined();
    });

    it('calls onNodePress when pressed', () => {
        const { getByTestId } = render(
            <ExplorationNode
                node={mockNode}
                onNodePress={mockOnNodePress}
                shouldShowLabel={false}
            />
        );

        fireEvent.press(getByTestId('node-node-1'));
        expect(mockOnNodePress).toHaveBeenCalledWith(mockNode);
    });

    it('shows label when shouldShowLabel is true', () => {
        const { getByText } = render(
            <ExplorationNode
                node={mockNode}
                onNodePress={mockOnNodePress}
                shouldShowLabel={true}
            />
        );

        expect(getByText('Test Node')).toBeDefined();
        expect(getByText('ENCOUNTER')).toBeDefined();
    });

    it('does not show label when shouldShowLabel is false', () => {
        const { queryByText } = render(
            <ExplorationNode
                node={mockNode}
                onNodePress={mockOnNodePress}
                shouldShowLabel={false}
            />
        );

        expect(queryByText('Test Node')).toBeNull();
        expect(queryByText('ENCOUNTER')).toBeNull();
    });
});