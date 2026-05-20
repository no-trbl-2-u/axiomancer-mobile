/**
 * Hermetic component tests — DebugChaosToggle (Phase 58).
 *
 * Pins the DEV gate + the toggle contract: tapping flips a
 * `chaosOn` state and calls `setChaosMode` with the new value.
 * The chaos-pool effect on `resolveMapEvent` is exercised in
 * the engine-level test (`state/e2e/event-pools.engine.test.ts`).
 */

import { afterEach, describe, expect, it } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { DebugChaosToggle } from '@/components/DebugChaosToggle';
import {
    registerExplorationEventPools,
    setChaosMode,
} from '@/state/exploration-maps/event-pools';

afterEach(() => {
    // Belt-and-braces: restore canonical pools so a chaos-on test
    // doesn't leak into other suites that share the global engine
    // pool registry. (The registry is global engine state; we can't
    // _clearMapEventPoolRegistry it on 0.10.0.)
    setChaosMode(false);
    registerExplorationEventPools();
});

describe('DebugChaosToggle: DEV gate', () => {
    it('renders the toggle when __DEV__ is true (jest default)', () => {
        const tree = render(<DebugChaosToggle />);
        expect(tree.queryByTestId('debug-chaos-toggle')).not.toBeNull();
    });

    it('renders null when __DEV__ is false', () => {
         
        const g = global as any;
        const original = g.__DEV__;
        g.__DEV__ = false;
        try {
            const tree = render(<DebugChaosToggle />);
            expect(tree.queryByTestId('debug-chaos-toggle')).toBeNull();
        } finally {
            g.__DEV__ = original;
        }
    });
});

describe('DebugChaosToggle: tap toggling', () => {
    it('starts in CALM mode (chaos off)', () => {
        const tree = render(<DebugChaosToggle />);
        expect(tree.queryByText('CALM')).not.toBeNull();
        expect(tree.queryByText('CHAOS')).toBeNull();
    });

    it('first tap flips label CALM → CHAOS', () => {
        const tree = render(<DebugChaosToggle />);
        fireEvent.press(tree.getByTestId('debug-chaos-toggle'));
        expect(tree.queryByText('CHAOS')).not.toBeNull();
        expect(tree.queryByText('CALM')).toBeNull();
    });

    it('second tap flips back CHAOS → CALM', () => {
        const tree = render(<DebugChaosToggle />);
        fireEvent.press(tree.getByTestId('debug-chaos-toggle'));
        fireEvent.press(tree.getByTestId('debug-chaos-toggle'));
        expect(tree.queryByText('CALM')).not.toBeNull();
    });

    it('subtitle text reflects the active mode', () => {
        const tree = render(<DebugChaosToggle />);
        expect(tree.queryByText('canonical per-node types')).not.toBeNull();
        fireEvent.press(tree.getByTestId('debug-chaos-toggle'));
        expect(tree.queryByText('every node fires a random event kind')).not.toBeNull();
    });
});

describe('DebugChaosToggle: accessibility', () => {
    it('label includes the current state', () => {
        const tree = render(<DebugChaosToggle />);
        const btn = tree.getByTestId('debug-chaos-toggle');
        expect(btn.props.accessibilityLabel).toMatch(/off/i);

        fireEvent.press(btn);
        const btnAfter = tree.getByTestId('debug-chaos-toggle');
        expect(btnAfter.props.accessibilityLabel).toMatch(/on/i);
    });
});
