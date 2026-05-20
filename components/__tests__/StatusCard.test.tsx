/**
 * Hermetic component tests — StatusCard.
 *
 * StatusCard is the SELF-tab summary header: name + level
 * badge + HP/MP bars. Pure prop-driven render. The contract
 * worth pinning is **prop wiring** (each input flows to the
 * right child) and **default values** so the component
 * doesn't crash when mounted without props during early
 * presenter-bootstrap states.
 */

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';

import { StatusCard } from '@/components/StatusCard';

describe('StatusCard: default props', () => {
    it('renders without crashing when no props are given', () => {
        const tree = render(<StatusCard />);
        expect(tree.toJSON()).not.toBeNull();
    });

    it('uses the canonical placeholder name when no name prop is given', () => {
        const tree = render(<StatusCard />);
        expect(tree.queryByText('WORM-EATEN PILGRIM')).not.toBeNull();
    });

    it('uses the canonical placeholder level (7) when no level is given', () => {
        const tree = render(<StatusCard />);
        // Level appears in the level box AND in the "LEVEL · LVL 7 PILGRIM" label.
        // Both are valid signals that the default routed through.
        expect(tree.queryByText('7')).not.toBeNull();
        expect(tree.queryByText(/LVL 7/)).not.toBeNull();
    });

    it('shows the default HP fraction (22/38) in the HP bar', () => {
        const tree = render(<StatusCard />);
        expect(tree.queryByText('HP')).not.toBeNull();
        expect(tree.queryByText('22/38')).not.toBeNull();
    });

    it('shows the default MP fraction (9/14) in the MP bar', () => {
        const tree = render(<StatusCard />);
        expect(tree.queryByText('MP')).not.toBeNull();
        expect(tree.queryByText('9/14')).not.toBeNull();
    });
});

describe('StatusCard: prop wiring', () => {
    it('passes the name prop through to the header line', () => {
        const tree = render(<StatusCard name="ASHEN WAYFARER" />);
        expect(tree.queryByText('ASHEN WAYFARER')).not.toBeNull();
        expect(tree.queryByText('WORM-EATEN PILGRIM')).toBeNull();
    });

    it('passes the level prop through to both the badge and the secondary label', () => {
        const tree = render(<StatusCard level={42} />);
        expect(tree.queryByText('42')).not.toBeNull();
        expect(tree.queryByText(/LVL 42/)).not.toBeNull();
    });

    it('passes hp/hpMax through to the HP bar counter', () => {
        const tree = render(<StatusCard hp={5} hpMax={50} />);
        expect(tree.queryByText('5/50')).not.toBeNull();
    });

    it('passes mana/manaMax through to the MP bar counter', () => {
        const tree = render(<StatusCard mana={3} manaMax={12} />);
        expect(tree.queryByText('3/12')).not.toBeNull();
    });

    it('multiple props compose without crashing (name + level + bars)', () => {
        const tree = render(
            <StatusCard name="STILLED WALKER" level={1} hp={1} hpMax={1} mana={0} manaMax={1} />,
        );
        expect(tree.queryByText('STILLED WALKER')).not.toBeNull();
        expect(tree.queryByText(/LVL 1/)).not.toBeNull();
        expect(tree.queryByText('1/1')).not.toBeNull();
        expect(tree.queryByText('0/1')).not.toBeNull();
    });
});

describe('StatusCard: structural landmarks', () => {
    it('renders both bar labels (HP and MP)', () => {
        const tree = render(<StatusCard />);
        expect(tree.queryByText('HP')).not.toBeNull();
        expect(tree.queryByText('MP')).not.toBeNull();
    });

    it('renders the LEVEL section label', () => {
        const tree = render(<StatusCard />);
        // Match the SectionLabel's text content; the LEVEL chip
        // composes the formatted level number into a "LEVEL · LVL N PILGRIM"
        // string.
        expect(tree.queryByText(/^LEVEL · LVL/)).not.toBeNull();
    });
});
