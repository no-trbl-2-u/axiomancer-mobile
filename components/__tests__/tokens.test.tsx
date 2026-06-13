/**
 * Hermetic component tests — tokens.tsx (the five-token resource
 * primitives: TokenIcon, TokenChip, TokenRack, TokenCost). The
 * file exports four UI components used across the combat HUD,
 * Token Crucible, and skill-cost displays. Each one carries
 * conditional render branches worth pinning hermetically.
 */

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';
import { View } from 'react-native';
import Svg from 'react-native-svg';

import {
    TokenChip,
    TokenCost,
    TokenIcon,
    TokenRack,
} from '@/components/tokens';
import { AXM } from '@/theme/axm';
import { TOKEN, TOKEN_KEYS, type TokenKey } from '@/state/mocks/tokens.fixture';

function flattenStyle(node: { props: { style?: unknown } }): Record<string, unknown> {
    const raw = node.props.style;
    const arr = Array.isArray(raw) ? raw : [raw];
    return arr.reduce<Record<string, unknown>>((acc, entry) => {
        if (entry && typeof entry === 'object') Object.assign(acc, entry);
        return acc;
    }, {});
}

describe('TokenIcon: kind switch', () => {
    it.each<TokenKey>(['body', 'mind', 'heart', 'fallacy', 'paradox'])(
        'renders an Svg for kind=%s',
        (kind) => {
            const tree = render(<TokenIcon kind={kind} />);
            expect(tree.UNSAFE_getAllByType(Svg)).toHaveLength(1);
        },
    );

    it('respects custom size on the underlying Svg', () => {
        const tree = render(<TokenIcon kind="body" size={32} />);
        const svg = tree.UNSAFE_getAllByType(Svg)[0];
        expect(svg.props.width).toBe(32);
        expect(svg.props.height).toBe(32);
    });
});

describe('TokenChip: count-driven palette', () => {
    it('renders the token short label and count when count > 0', () => {
        const tree = render(<TokenChip kind="heart" count={3} />);
        expect(tree.queryByText('3')).not.toBeNull();
        expect(tree.queryByText(TOKEN.heart.short)).not.toBeNull();
    });

    it('uses the token color + bg when count > 0 (has path)', () => {
        const tree = render(<TokenChip kind="heart" count={2} />);
        const wrapper = tree.UNSAFE_getAllByType(View)[0];
        const style = flattenStyle(wrapper);
        expect(style.backgroundColor).toBe(TOKEN.heart.bg);
        expect(style.borderColor).toBe(TOKEN.heart.color);
    });

    it('uses the empty palette when count is 0 (dark bg + ash border)', () => {
        const tree = render(<TokenChip kind="heart" count={0} />);
        const wrapper = tree.UNSAFE_getAllByType(View)[0];
        const style = flattenStyle(wrapper);
        expect(style.backgroundColor).toBe(AXM.bg);
        expect(style.borderColor).toBe(AXM.ash);
    });

    it('drops opacity to 0.4 when dim=true', () => {
        const tree = render(<TokenChip kind="body" count={1} dim />);
        const wrapper = tree.UNSAFE_getAllByType(View)[0];
        expect(flattenStyle(wrapper).opacity).toBe(0.4);
    });

    it('keeps opacity at 1 when dim is false (default)', () => {
        const tree = render(<TokenChip kind="body" count={1} />);
        const wrapper = tree.UNSAFE_getAllByType(View)[0];
        expect(flattenStyle(wrapper).opacity).toBe(1);
    });

    it('applies the token-colored shadow when glow=true + has tokens', () => {
        const tree = render(<TokenChip kind="mind" count={1} glow />);
        const wrapper = tree.UNSAFE_getAllByType(View)[0];
        const style = flattenStyle(wrapper);
        expect(style.shadowColor).toBe(TOKEN.mind.color);
        expect(style.shadowOpacity).toBe(0.9);
    });

    it('does NOT apply glow shadow when count is 0 even if glow=true (gated on has)', () => {
        const tree = render(<TokenChip kind="mind" count={0} glow />);
        const wrapper = tree.UNSAFE_getAllByType(View)[0];
        expect(flattenStyle(wrapper).shadowColor).toBeUndefined();
    });

    it('shrinks the chip and inner sizes when compact=true', () => {
        const tree = render(<TokenChip kind="paradox" count={1} compact />);
        const wrapper = tree.UNSAFE_getAllByType(View)[0];
        const style = flattenStyle(wrapper);
        expect(style.minWidth).toBe(36);
        expect(style.paddingVertical).toBe(2);
    });
});

describe('TokenRack: chip layout', () => {
    it('renders one TokenChip per TOKEN_KEYS entry (5 chips)', () => {
        const tree = render(<TokenRack tokens={{ body: 1, mind: 1, heart: 1, fallacy: 1, paradox: 1 }} />);
        // 5 Svgs because each TokenChip embeds a TokenIcon Svg.
        expect(tree.UNSAFE_getAllByType(Svg)).toHaveLength(TOKEN_KEYS.length);
    });

    it('mounts the POOL label column in non-compact mode', () => {
        const tree = render(<TokenRack />);
        expect(tree.queryByText('POOL')).not.toBeNull();
    });

    it('omits the POOL label column in compact mode', () => {
        const tree = render(<TokenRack compact />);
        expect(tree.queryByText('POOL')).toBeNull();
    });

    it('defaults missing token counts to 0 (no crash on partial tokens object)', () => {
        const tree = render(<TokenRack tokens={{ heart: 2 }} />);
        // 2 for heart, 0 for the other four — render shouldn't throw.
        expect(tree.queryByText('2')).not.toBeNull();
        // All five "0" / "2" count Texts exist.
        const zeros = tree.queryAllByText('0');
        expect(zeros.length).toBe(4);
    });
});

describe('TokenCost: cost rendering', () => {
    it('renders the literal "FREE" placeholder when cost is empty', () => {
        const tree = render(<TokenCost cost={{}} tokens={{}} />);
        expect(tree.queryByText('FREE')).not.toBeNull();
    });

    it('renders one pip per token-unit in cost', () => {
        // 2 body + 1 mind = 3 pips
        const tree = render(<TokenCost cost={{ body: 2, mind: 1 }} tokens={{ body: 5, mind: 5 }} />);
        // 3 pip Svgs (each pip wraps a TokenIcon Svg).
        expect(tree.UNSAFE_getAllByType(Svg)).toHaveLength(3);
    });

    it('does not render FREE when there are any cost pips', () => {
        const tree = render(<TokenCost cost={{ heart: 1 }} tokens={{}} />);
        expect(tree.queryByText('FREE')).toBeNull();
    });

    it('owed accounting marks the second body pip as missing when only 1 body token available', () => {
        // Cost: 2 body. Tokens: 1 body. The first pip is satisfied
        // (owed=1, tokens[body]=1, NOT missing). The second pip
        // becomes missing (owed=2, tokens[body]=1, missing).
        const tree = render(<TokenCost cost={{ body: 2 }} tokens={{ body: 1 }} />);
        const pips = tree.UNSAFE_getAllByType(View);
        // First pip wrapper is the outer row; pips themselves are
        // the next Views with borderStyle dashed/solid.
        const pipStyles = pips.map(flattenStyle).filter((s) => s.borderStyle === 'solid' || s.borderStyle === 'dashed');
        expect(pipStyles).toHaveLength(2);
        expect(pipStyles[0].borderStyle).toBe('solid');
        expect(pipStyles[1].borderStyle).toBe('dashed');
    });
});
