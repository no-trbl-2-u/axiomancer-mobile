import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { StanceCard } from '../StanceCard';
import type { StanceOption } from '@/state/presenters/combat.engine';

// Mock the useTooltip hook
jest.mock('@/hooks/useTooltip', () => ({
    useTooltip: () => ({
        show: jest.fn(),
    }),
}));

const mockStanceOption: StanceOption = {
    key: 'heart',
    label: 'HEART',
    gloss: 'Passionate and bold',
    advantage: 'neutral',
    counters: 'MIND',
    weakTo: 'BODY',
    derived: {
        attack: 10,
        skill: 8,
        defense: 6,
    },
};

describe('StanceCard', () => {
    const mockOnPick = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders stance card with proper accessibility', () => {
        const { getByRole } = render(
            <StanceCard
                opt={mockStanceOption}
                isSel={false}
                onPick={mockOnPick}
                a11yLabel="Heart stance"
            />
        );
        
        expect(getByRole('button')).toBeTruthy();
    });

    it('calls onPick when pressed', () => {
        const { getByRole } = render(
            <StanceCard
                opt={mockStanceOption}
                isSel={false}
                onPick={mockOnPick}
                a11yLabel="Heart stance"
            />
        );
        
        fireEvent.press(getByRole('button'));
        expect(mockOnPick).toHaveBeenCalledWith('heart');
    });

    it('shows advantage badge when advantage is present', () => {
        const advOption = { ...mockStanceOption, advantage: 'adv' as const };
        const { getByTestId } = render(
            <StanceCard
                opt={advOption}
                isSel={false}
                onPick={mockOnPick}
                a11yLabel="Heart stance"
            />
        );
        
        expect(getByTestId('combat-stance-heart-advdis')).toBeTruthy();
    });
});