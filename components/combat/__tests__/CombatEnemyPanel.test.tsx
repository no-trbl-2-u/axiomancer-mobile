/**
 * Hermetic component test — CombatEnemyPanel.
 *
 * Tests the extracted enemy display component that renders enemy
 * portrait, health, stance, and effects. Verifies basic rendering
 * and proper view model consumption.
 */

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';

import { CombatEnemyPanel } from '@/components/combat/CombatEnemyPanel';
import type { CombatViewModel } from '@/state/presenters/combat.engine';

const mockCombatViewModel: Partial<CombatViewModel> = {
    enemy: {
        name: 'Test Enemy',
        artKey: 'enemy-test',
        flavor: 'A fearsome foe',
        hp: 50,
        hpMax: 100,
        hpRatio: 0.5,
        tier: 'normal' as const,
        lastStance: 'mind' as const,
        mindMarks: 2,
        effects: [],
    },
    roundToken: 'I',
    friendshipCounter: 3,
    friendshipCounterMax: 10,
};

describe('CombatEnemyPanel: basic rendering', () => {
    it('renders enemy name and health', () => {
        const { getByText } = render(
            <CombatEnemyPanel vm={mockCombatViewModel as CombatViewModel} />
        );
        
        expect(getByText('Test Enemy')).toBeDefined();
        expect(getByText('"…A fearsome foe"')).toBeDefined();
        expect(getByText('WHAT WAITS')).toBeDefined();
        expect(getByText('I')).toBeDefined();
    });

    it('renders stance indicator', () => {
        const { getByText } = render(
            <CombatEnemyPanel vm={mockCombatViewModel as CombatViewModel} />
        );
        
        expect(getByText('STANDS')).toBeDefined();
    });

    it('renders when flavor text is empty', () => {
        const vmWithoutFlavor = {
            ...mockCombatViewModel,
            enemy: {
                ...mockCombatViewModel.enemy,
                flavor: '',
            },
        };
        
        const { getByText, queryByText } = render(
            <CombatEnemyPanel vm={vmWithoutFlavor as CombatViewModel} />
        );
        
        expect(getByText('Test Enemy')).toBeDefined();
        expect(queryByText('"…"')).toBeNull();
    });

    it('renders effects when present', () => {
        const vmWithEffects = {
            ...mockCombatViewModel,
            enemy: {
                ...mockCombatViewModel.enemy,
                effects: [{
                    kind: 'poison',
                    name: 'Poison',
                    effectId: 'poison',
                    duration: 2,
                    intensity: 1,
                    tint: 'debuff' as const,
                }],
            },
        };
        
        const { getByTestId } = render(
            <CombatEnemyPanel vm={vmWithEffects as CombatViewModel} />
        );
        
        expect(getByTestId('combat-enemy-effect-0')).toBeDefined();
    });
});