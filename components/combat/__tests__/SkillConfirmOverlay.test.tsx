/**
 * @jest-environment jsdom
 */

/**
 * Hermetic behaviour test — SkillConfirmOverlay (Phase 127).
 *
 * Pins the confirm-before-commit contract: the overlay shows the
 * deterministic skill detail, COMMIT fires onConfirm, CANCEL fires
 * onCancel, and an unaffordable skill gates the COMMIT path while
 * still rendering its detail.
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { SkillConfirmOverlay } from '../SkillConfirmOverlay';
import type { SkillOption } from '@/state/presenters/combat.engine';

const affordableSkill: SkillOption = {
    id: 'ad-baculum',
    name: 'AD BACULUM',
    description: 'A blow argued with force.',
    category: 'fallacy',
    stance: 'body',
    manaCost: 2,
    effectText: '12 DMG · BLEED 2 (3R)',
    costText: '2 BOD',
    enabled: true,
    disabledReason: null,
};

const unaffordableSkill: SkillOption = {
    ...affordableSkill,
    enabled: false,
    disabledReason: 'insufficient-resources',
};

describe('SkillConfirmOverlay', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders nothing when skill is null', () => {
        render(<SkillConfirmOverlay skill={null} onConfirm={onConfirm} onCancel={onCancel} />);
        expect(screen.queryByTestId('skill-confirm-overlay')).toBeNull();
    });

    it('renders the skill detail with deterministic result and cost', () => {
        render(<SkillConfirmOverlay skill={affordableSkill} onConfirm={onConfirm} onCancel={onCancel} />);
        expect(screen.getByTestId('skill-confirm-overlay')).toBeTruthy();
        expect(screen.getByText('AD BACULUM')).toBeTruthy();
        expect(screen.getByTestId('skill-confirm-effect').props.children).toBe('12 DMG · BLEED 2 (3R)');
        expect(screen.getByTestId('skill-confirm-cost').props.children).toBe('2 BOD');
        // No dice imagery — the result is doctrine, not a roll.
        expect(screen.queryByText(/ATTACK ROLL/)).toBeNull();
    });

    it('fires onConfirm when COMMIT is pressed for an affordable skill', () => {
        render(<SkillConfirmOverlay skill={affordableSkill} onConfirm={onConfirm} onCancel={onCancel} />);
        fireEvent.press(screen.getByTestId('skill-confirm-confirm'));
        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onCancel).not.toHaveBeenCalled();
    });

    it('fires onCancel when CANCEL is pressed', () => {
        render(<SkillConfirmOverlay skill={affordableSkill} onConfirm={onConfirm} onCancel={onCancel} />);
        fireEvent.press(screen.getByTestId('skill-confirm-cancel'));
        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(onConfirm).not.toHaveBeenCalled();
    });

    it('gates COMMIT and surfaces an unaffordable note for an unaffordable skill', () => {
        render(<SkillConfirmOverlay skill={unaffordableSkill} onConfirm={onConfirm} onCancel={onCancel} />);
        expect(screen.getByTestId('skill-confirm-unaffordable')).toBeTruthy();
        fireEvent.press(screen.getByTestId('skill-confirm-confirm'));
        expect(onConfirm).not.toHaveBeenCalled();
        // Cancel still works so the player can back out.
        fireEvent.press(screen.getByTestId('skill-confirm-cancel'));
        expect(onCancel).toHaveBeenCalledTimes(1);
    });
});
