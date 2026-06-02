/**
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { MercyChoiceModal } from '../MercyChoiceModal';
import type { MercyChoiceSlice } from '@/state/presenters/combat.engine';

describe('MercyChoiceModal', () => {
    const mockOnSpare = jest.fn();
    const mockOnExploit = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    const inactiveMercyChoice: MercyChoiceSlice = {
        isActive: false,
        enemyName: 'TEST ENEMY',
        spareLabel: 'SPARE',
        spareHint: 'preserve test enemy · path of mercy',
        exploitLabel: 'EXPLOIT',
        exploitHint: 'seize the opening · guaranteed critical',
        a11y: {
            spare: 'Spare TEST ENEMY, choosing mercy and consequence',
            exploit: 'Exploit the opening for a guaranteed critical attack against TEST ENEMY',
        },
    };

    const activeMercyChoice: MercyChoiceSlice = {
        ...inactiveMercyChoice,
        isActive: true,
    };

    it('renders nothing when isActive is false', () => {
        render(
            <MercyChoiceModal
                mercyChoice={inactiveMercyChoice}
                onSpare={mockOnSpare}
                onExploit={mockOnExploit}
            />
        );

        expect(screen.queryByTestId('mercy-choice-modal')).toBeNull();
        expect(screen.queryByText('MERCY OPENS')).toBeNull();
    });

    it('renders modal when isActive is true', () => {
        render(
            <MercyChoiceModal
                mercyChoice={activeMercyChoice}
                onSpare={mockOnSpare}
                onExploit={mockOnExploit}
            />
        );

        expect(screen.getByTestId('mercy-choice-modal')).toBeTruthy();
        expect(screen.getByText('MERCY OPENS')).toBeTruthy();
        expect(screen.getByText('TEST ENEMY')).toBeTruthy();
        expect(screen.getByText('The heart\'s work is done. Now choose the consequence.')).toBeTruthy();
    });

    it('renders both choice buttons with correct labels', () => {
        render(
            <MercyChoiceModal
                mercyChoice={activeMercyChoice}
                onSpare={mockOnSpare}
                onExploit={mockOnExploit}
            />
        );

        const spareButton = screen.getByTestId('mercy-choice-spare');
        const exploitButton = screen.getByTestId('mercy-choice-exploit');

        expect(spareButton).toBeTruthy();
        expect(exploitButton).toBeTruthy();
        expect(screen.getByText('SPARE')).toBeTruthy();
        expect(screen.getByText('EXPLOIT')).toBeTruthy();
        expect(screen.getByText('preserve test enemy · path of mercy')).toBeTruthy();
        expect(screen.getByText('seize the opening · guaranteed critical')).toBeTruthy();
    });

    it('calls onSpare when spare button is pressed', () => {
        render(
            <MercyChoiceModal
                mercyChoice={activeMercyChoice}
                onSpare={mockOnSpare}
                onExploit={mockOnExploit}
            />
        );

        const spareButton = screen.getByTestId('mercy-choice-spare');
        fireEvent.press(spareButton);

        expect(mockOnSpare).toHaveBeenCalledTimes(1);
        expect(mockOnExploit).not.toHaveBeenCalled();
    });

    it('calls onExploit when exploit button is pressed', () => {
        render(
            <MercyChoiceModal
                mercyChoice={activeMercyChoice}
                onSpare={mockOnSpare}
                onExploit={mockOnExploit}
            />
        );

        const exploitButton = screen.getByTestId('mercy-choice-exploit');
        fireEvent.press(exploitButton);

        expect(mockOnExploit).toHaveBeenCalledTimes(1);
        expect(mockOnSpare).not.toHaveBeenCalled();
    });

    it('has proper accessibility labels', () => {
        render(
            <MercyChoiceModal
                mercyChoice={activeMercyChoice}
                onSpare={mockOnSpare}
                onExploit={mockOnExploit}
            />
        );

        const spareButton = screen.getByTestId('mercy-choice-spare');
        const exploitButton = screen.getByTestId('mercy-choice-exploit');

        expect(spareButton.props.accessibilityLabel).toBe('Spare TEST ENEMY, choosing mercy and consequence');
        expect(exploitButton.props.accessibilityLabel).toBe('Exploit the opening for a guaranteed critical attack against TEST ENEMY');
    });

    it('prevents modal dismissal by hardware back button', () => {
        render(
            <MercyChoiceModal
                mercyChoice={activeMercyChoice}
                onSpare={mockOnSpare}
                onExploit={mockOnExploit}
            />
        );

        const modal = screen.getByTestId('mercy-choice-modal');
        expect(modal.props.onRequestClose).toBeDefined();
        
        // Calling onRequestClose should be a no-op (returns undefined)
        expect(modal.props.onRequestClose()).toBeUndefined();
    });
});