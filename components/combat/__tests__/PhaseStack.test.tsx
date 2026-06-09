import React from 'react';
import { render } from '@testing-library/react-native';

import { PhaseStack } from '../PhaseStack';
import type { CombatViewModel } from '@/state/presenters/combat.engine';

const mockVm: Partial<CombatViewModel> = {
    phase: 'choosing_stance',
    phaseIndex: 0,
    phaseHeader: 'CHOOSE STANCE',
    phaseOrder: ['choosing_stance', 'choosing_action', 'choosing_skill', 'resolving'] as const,
    phaseStack: [
        {
            key: 'choosing_stance',
            label: 'STANCE',
            state: 'current',
            visible: true,
            summary: '',
        }
    ],
    stancePicker: { options: [], selected: null, canConfirm: false },
    actionPicker: { options: [], fleeAvailable: false, fleeHint: '', fleeMessage: '', itemMessage: '' },
    skillPicker: { skills: [], availableCount: 0, totalCount: 0 },
    resolve: {} as any,
    a11y: { stanceHeart: 'Heart', stanceBody: 'Body', stanceMind: 'Mind', actionAttack: 'Attack', actionDefend: 'Defend', actionSkill: 'Skill', actionItem: 'Item', playerHp: 'HP', playerMana: 'Mana', enemyHp: 'Enemy HP', phaseHeader: 'Phase', roundInfo: 'Round' },
};

const mockCallbacks = {
    onPickStance: jest.fn(),
    onPickAction: jest.fn(),
    onPickSkill: jest.fn(),
    onGoBackToPhase: jest.fn(),
    onFlee: jest.fn(),
    onContinue: jest.fn(),
    onLeave: jest.fn(),
};

describe('PhaseStack', () => {
    it('renders phase stack with testID', () => {
        const { getByTestId } = render(
            <PhaseStack vm={mockVm as CombatViewModel} {...mockCallbacks} />
        );
        
        expect(getByTestId('combat-phase-stack')).toBeTruthy();
    });

    it('renders visible phase entries', () => {
        const { getByTestId } = render(
            <PhaseStack vm={mockVm as CombatViewModel} {...mockCallbacks} />
        );
        
        expect(getByTestId('phase-stack-row-choosing_stance')).toBeTruthy();
    });
});