/**
 * Hermetic component test — CombatResourceTracker.
 *
 * The persistent crucible "skill fuel" pool that replaced the
 * action-phase-only CrucibleStrip legend. Renders glyph + 3-letter
 * label + exact count + fill bar per resource token.
 */

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';

import { CombatResourceTracker } from '@/components/combat/CombatResourceTracker';
import type { CrucibleToken } from '@/state/presenters/combat.engine';
import { AXM } from '@/theme/axm';

const tokens: CrucibleToken[] = [
    { key: 'body', glyph: '◐', short: 'BOD', count: 2, color: AXM.blood },
    { key: 'heart', glyph: '◑', short: 'HRT', count: 1, color: AXM.sulfur },
    { key: 'mind', glyph: '◒', short: 'MND', count: 0, color: AXM.rust },
    { key: 'fallacy', glyph: '◓', short: 'FAL', count: 1, color: AXM.bone },
    { key: 'paradox', glyph: '◉', short: 'PRX', count: 7, color: AXM.parchment },
];

describe('CombatResourceTracker', () => {
    it('renders a column for every token', () => {
        const { getByTestId } = render(<CombatResourceTracker tokens={tokens} />);
        expect(getByTestId('combat-resource-tracker')).toBeTruthy();
        for (const t of tokens) {
            expect(getByTestId(`combat-resource-token-${t.key}`)).toBeTruthy();
        }
    });

    it('shows the visual glyph and 3-letter label for each token', () => {
        const { getByText } = render(<CombatResourceTracker tokens={tokens} />);
        // Glyph (visual symbol) and short label are distinct — the
        // regression being guarded against was both rendering as "BOD".
        expect(getByText('◐')).toBeTruthy();
        expect(getByText('BOD')).toBeTruthy();
        expect(getByText('PRX')).toBeTruthy();
    });

    it('renders the exact count, including values above the fill cap', () => {
        const { getByText } = render(<CombatResourceTracker tokens={tokens} />);
        // count 7 exceeds the FILL_CAP of 5 — the bar clamps but the
        // number must stay truthful.
        expect(getByText('7')).toBeTruthy();
        expect(getByText('0')).toBeTruthy();
    });
});
