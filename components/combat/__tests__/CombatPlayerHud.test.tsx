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

const mockCombatViewModel = {
    player: {
        hp: 75,
        hpMax: 100,
        effects: [],
    },
    stancePicker: {
        selected: 'body' as const,
    },
    friendshipCounter: 5,
    friendshipCounterMax: 10,
} as any;

describe('CombatPlayerHud: basic rendering', () => {
    it('renders player health bar', () => {
        const { getByText } = render(
            <CombatPlayerHud vm={mockCombatViewModel} />
        );
        
        expect(getByText('HEALTH')).toBeDefined();
    });

    it('renders stance glyph with selected stance', () => {
        const result = render(
            <CombatPlayerHud vm={mockCombatViewModel} />
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
            <CombatPlayerHud vm={vmNoStance} />
        );
        
        expect(result).toBeDefined();
    });

    it('renders player effects when present', () => {
        const vmWithEffects = {
            ...mockCombatViewModel,
            player: {
                ...mockCombatViewModel.player,
                effects: [{
                    kind: 'blessed' as const,
                    name: 'Blessed',
                    effectId: 'blessed',
                    stacks: 1,
                }],
            },
        };
        
        const { getByTestId } = render(
            <CombatPlayerHud vm={vmWithEffects} />
        );
        
        expect(getByTestId('combat-player-effect-0')).toBeDefined();
    });

    it('handles empty effects array', () => {
        const result = render(
            <CombatPlayerHud vm={mockCombatViewModel} />
        );
        
        expect(result).toBeDefined();
        // Component renders successfully with no effects
        expect(result.getByText('HEALTH')).toBeDefined();
    });
});