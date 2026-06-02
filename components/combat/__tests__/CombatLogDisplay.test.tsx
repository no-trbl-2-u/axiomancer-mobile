/**
 * Hermetic component test — CombatLogDisplay.
 *
 * Tests the extracted battle log component that renders combat
 * log entries with color coding by severity and scroll support.
 */

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';

import { CombatLogDisplay } from '@/components/combat/CombatLogDisplay';

const mockLogEntries = [
    {
        text: 'Combat begins!',
        severity: 'info' as const,
    },
    {
        text: 'You deal 15 damage',
        severity: 'damage' as const,
    },
    {
        text: 'Critical hit!',
        severity: 'crit' as const,
    },
];

describe('CombatLogDisplay: basic rendering', () => {
    it('renders log header with round number', () => {
        const { getByText } = render(
            <CombatLogDisplay
                log={mockLogEntries}
                round={3}
                emptyMessage="No combat actions"
            />
        );
        
        expect(getByText('⚜ BATTLE LOG · ROUND 3')).toBeDefined();
        expect(getByText('SCROLL ↑')).toBeDefined();
    });

    it('renders log entries when present', () => {
        const { getByText } = render(
            <CombatLogDisplay
                log={mockLogEntries}
                round={1}
                emptyMessage="No combat actions"
            />
        );
        
        expect(getByText('Combat begins!')).toBeDefined();
        expect(getByText('You deal 15 damage')).toBeDefined();
        expect(getByText('Critical hit!')).toBeDefined();
    });

    it('renders empty message when no log entries', () => {
        const { getByText } = render(
            <CombatLogDisplay
                log={[]}
                round={1}
                emptyMessage="Combat hasn't started yet"
            />
        );
        
        expect(getByText("Combat hasn't started yet")).toBeDefined();
    });

    it('renders color legend', () => {
        const { getByText } = render(
            <CombatLogDisplay
                log={mockLogEntries}
                round={1}
                emptyMessage="No combat actions"
            />
        );
        
        expect(getByText('LEGEND ·')).toBeDefined();
        expect(getByText('■ HARM')).toBeDefined();
        expect(getByText('■ CRIT')).toBeDefined();
        expect(getByText('■ HEAL')).toBeDefined();
        expect(getByText('■ EFFECT')).toBeDefined();
        expect(getByText('■ INFO')).toBeDefined();
    });

    it('has accessible battle log ScrollView', () => {
        const { getByLabelText } = render(
            <CombatLogDisplay
                log={mockLogEntries}
                round={1}
                emptyMessage="No combat actions"
            />
        );
        
        expect(getByLabelText('Battle log')).toBeDefined();
    });
});