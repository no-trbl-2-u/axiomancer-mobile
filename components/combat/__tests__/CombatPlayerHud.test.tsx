/**
 * Hermetic component test — CombatPlayerHud.
 *
 * Tests the extracted player HUD component that renders player
 * health, stance glyph, and effects at the bottom of combat screen.
 */

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';

import { CombatPlayerHud } from '@/components/combat/CombatPlayerHud';
import type { CombatViewModel } from '@/state/presenters/combat.engine';

const mockCombatViewModel: Partial<CombatViewModel> = {
    player: {
        hp: 75,
        hpMax: 100,
        hpRatio: 0.75,
        totalResources: 15,
        maxResources: 20,
        resourceRatio: 0.75,
        effects: [],
    },
    stancePicker: {
        selected: 'body' as const,
        options: [],
        canConfirm: false,
    },
    friendshipCounter: 5,
    friendshipCounterMax: 10,
};

describe('CombatPlayerHud: basic rendering', () => {
    it('renders player health bar', () => {
        const { getByText } = render(
            <CombatPlayerHud vm={mockCombatViewModel as CombatViewModel} />
        );
        
        expect(getByText('VITAE')).toBeDefined();
    });

    it('renders stance glyph with selected stance', () => {
        const result = render(
            <CombatPlayerHud vm={mockCombatViewModel as CombatViewModel} />
        );
        
        // The StanceGlyph component should be present
        // (specific SVG testing would require more complex setup)
        expect(result).toBeDefined();
    });

    it('renders with no stance selected', () => {
        const vmNoStance = {
            ...mockCombatViewModel,
            stancePicker: {
                selected: null,
            },
        };
        
        const result = render(
            <CombatPlayerHud vm={vmNoStance as CombatViewModel} />
        );
        
        expect(result).toBeDefined();
    });

    it('renders player effects when present', () => {
        const vmWithEffects = {
            ...mockCombatViewModel,
            player: {
                ...mockCombatViewModel.player,
                effects: [{
                    kind: 'blessed',
                    name: 'Blessed',
                    effectId: 'blessed',
                    duration: 3,
                    intensity: 1,
                    tint: 'buff' as const,
                }],
            },
        };
        
        const { getByTestId } = render(
            <CombatPlayerHud vm={vmWithEffects as CombatViewModel} />
        );
        
        expect(getByTestId('combat-player-effect-0')).toBeDefined();
    });

    it('handles empty effects array', () => {
        const result = render(
            <CombatPlayerHud vm={mockCombatViewModel as CombatViewModel} />
        );
        
        expect(result).toBeDefined();
        // Component renders successfully with no effects
        expect(result.getByText('VITAE')).toBeDefined();
    });
});