/**
 * Hermetic component tests — DevMenu (Phase 61a).
 *
 * Pins three contracts:
 *   - DEV gate (production renders null)
 *   - Collapsed default (children not in tree initially)
 *   - Expanded after press (children rendered after header tap)
 *
 * The container's own logic is the focus; child-component
 * behaviour is exercised in their own test suites.
 */

import { describe, expect, it } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import { DevMenu } from '@/components/DevMenu';

describe('DevMenu: DEV gate', () => {
    it('renders the menu when __DEV__ is true (jest default)', () => {
        const tree = render(
            <DevMenu>
                <Text testID="child">child</Text>
            </DevMenu>,
        );
        expect(tree.queryByTestId('dev-menu')).not.toBeNull();
    });

    it('renders null when __DEV__ is false (production build simulation)', () => {
         
        const g = global as any;
        const original = g.__DEV__;
        g.__DEV__ = false;
        try {
            const tree = render(
                <DevMenu>
                    <Text testID="child">child</Text>
                </DevMenu>,
            );
            expect(tree.queryByTestId('dev-menu')).toBeNull();
            expect(tree.queryByTestId('child')).toBeNull();
        } finally {
            g.__DEV__ = original;
        }
    });
});

describe('DevMenu: collapse/expand', () => {
    it('renders the header but hides children when collapsed (default)', () => {
        const tree = render(
            <DevMenu>
                <Text testID="child-one">child one</Text>
                <Text testID="child-two">child two</Text>
            </DevMenu>,
        );

        expect(tree.queryByTestId('dev-menu-header')).not.toBeNull();
        expect(tree.queryByTestId('dev-menu-body')).toBeNull();
        expect(tree.queryByTestId('child-one')).toBeNull();
        expect(tree.queryByTestId('child-two')).toBeNull();
    });

    it('reveals children after the header is pressed', () => {
        const tree = render(
            <DevMenu>
                <Text testID="child-one">child one</Text>
                <Text testID="child-two">child two</Text>
            </DevMenu>,
        );

        fireEvent.press(tree.getByTestId('dev-menu-header'));

        expect(tree.queryByTestId('dev-menu-body')).not.toBeNull();
        expect(tree.queryByTestId('child-one')).not.toBeNull();
        expect(tree.queryByTestId('child-two')).not.toBeNull();
    });

    it('hides children again after a second press (toggle round-trip)', () => {
        const tree = render(
            <DevMenu>
                <Text testID="child">child</Text>
            </DevMenu>,
        );

        const header = tree.getByTestId('dev-menu-header');
        fireEvent.press(header); // expand
        expect(tree.queryByTestId('child')).not.toBeNull();
        fireEvent.press(header); // collapse
        expect(tree.queryByTestId('child')).toBeNull();
    });

    it('renders children immediately when initiallyExpanded is true', () => {
        const tree = render(
            <DevMenu initiallyExpanded>
                <Text testID="child">child</Text>
            </DevMenu>,
        );

        expect(tree.queryByTestId('dev-menu-body')).not.toBeNull();
        expect(tree.queryByTestId('child')).not.toBeNull();
    });
});
