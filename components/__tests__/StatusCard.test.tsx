/**
 * Hermetic component tests — StatusCard.
 *
 * StatusCard is the SELF-tab summary header: name + level
 * badge + HP bar. Pure prop-driven render. The contract worth
 * pinning is **prop wiring** (each input flows to the right
 * child) and **default values** so the component doesn't
 * crash when mounted without props during early presenter-
 * bootstrap states.
 *
 * Phase-62 bug-sweep 2026-05-21 (user-direct): the mana bar
 * was dropped — mana isn't a player-visible mechanic outside
 * combat (engine uses per-resource pools; Token Crucible
 * surfaces them in combat). Tests for the MP bar were removed.
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

    it('multiple props compose without crashing (name + level + hp)', () => {
        const tree = render(
            <StatusCard name="STILLED WALKER" level={1} hp={1} hpMax={1} />,
        );
        expect(tree.queryByText('STILLED WALKER')).not.toBeNull();
        expect(tree.queryByText(/LVL 1/)).not.toBeNull();
        expect(tree.queryByText('1/1')).not.toBeNull();
    });
});

describe('StatusCard: structural landmarks', () => {
    it('renders the HP bar label and no MP/MANA bar (Phase-62 bug-sweep)', () => {
        const tree = render(<StatusCard />);
        expect(tree.queryByText('HP')).not.toBeNull();
        expect(tree.queryByText('MP')).toBeNull();
        expect(tree.queryByText('MANA')).toBeNull();
    });

    it('renders the LEVEL section label', () => {
        const tree = render(<StatusCard />);
        // Match the SectionLabel's text content; the LEVEL chip
        // composes the formatted level number into a "LEVEL · LVL N PILGRIM"
        // string.
        expect(tree.queryByText(/^LEVEL · LVL/)).not.toBeNull();
    });
});
