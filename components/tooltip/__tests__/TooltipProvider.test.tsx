/**
 * Phase 74 Tick A — TooltipProvider integration pins.
 *
 * Exercises show → measure → position → render → dismiss
 * through the public `useTooltip()` API. Anchor `measureInWindow`
 * is stubbed per-test so positioning math runs deterministically
 * without a real layout pass.
 *
 * Provider reads `useGameState`, so each suite mounts via
 * `withAllProviders`.
 */

import { act, fireEvent, render } from '@testing-library/react-native';
import React, { useRef } from 'react';
import { Pressable, Text } from 'react-native';

import { useTooltip } from '@/hooks/useTooltip';
import { withAllProviders } from '@/test-utils/withAllProviders';

interface AnchorChildProps {
    measureMock: jest.Mock;
    kind?: 'stat' | 'effect';
    id?: string;
}

function AnchorChild({ measureMock, kind = 'stat', id = 'HEART' }: AnchorChildProps) {
    const tooltip = useTooltip();
    const anchorRef = useRef<{ measureInWindow: jest.Mock }>({ measureInWindow: measureMock });
    return (
        <Pressable
            testID="anchor"
            onPress={() => tooltip.show({ kind, id, anchorRef: anchorRef as never })}
        >
            <Text>anchor</Text>
        </Pressable>
    );
}

describe('<TooltipProvider>', () => {
    afterEach(() => {
        jest.useRealTimers();
    });

    it('mounts the tooltip with content matching the kind+id on show', () => {
        const measureMock = jest.fn((cb: (x: number, y: number, w: number, h: number) => void) => {
            cb(40, 200, 80, 24);
        });
        const { tree } = withAllProviders(<AnchorChild measureMock={measureMock} />);
        const screen = render(tree);

        // No tooltip until show fires.
        expect(screen.queryByTestId('tap-tooltip')).toBeNull();

        fireEvent.press(screen.getByTestId('anchor'));

        expect(measureMock).toHaveBeenCalledTimes(1);
        expect(screen.queryByTestId('tap-tooltip')).not.toBeNull();
        expect(screen.queryByTestId('tap-tooltip-title')?.children?.[0]).toBe('HEART');
        expect(screen.queryByTestId('tap-tooltip-body')?.children?.[0]).toContain(
            "will to stay",
        );
    });

    it('dismisses when the backdrop is pressed', () => {
        const measureMock = jest.fn((cb: (x: number, y: number, w: number, h: number) => void) => {
            cb(40, 200, 80, 24);
        });
        const { tree } = withAllProviders(<AnchorChild measureMock={measureMock} />);
        const screen = render(tree);

        fireEvent.press(screen.getByTestId('anchor'));
        expect(screen.queryByTestId('tap-tooltip')).not.toBeNull();

        fireEvent.press(screen.getByTestId('tap-tooltip-backdrop'));
        expect(screen.queryByTestId('tap-tooltip')).toBeNull();
    });

    it('auto-dismisses after the 6s timeout', () => {
        jest.useFakeTimers();
        const measureMock = jest.fn((cb: (x: number, y: number, w: number, h: number) => void) => {
            cb(40, 200, 80, 24);
        });
        const { tree } = withAllProviders(<AnchorChild measureMock={measureMock} />);
        const screen = render(tree);

        fireEvent.press(screen.getByTestId('anchor'));
        expect(screen.queryByTestId('tap-tooltip')).not.toBeNull();

        act(() => {
            jest.advanceTimersByTime(5999);
        });
        expect(screen.queryByTestId('tap-tooltip')).not.toBeNull();

        act(() => {
            jest.advanceTimersByTime(1);
        });
        expect(screen.queryByTestId('tap-tooltip')).toBeNull();
    });

    it('toggles off when the same anchor is tapped twice', () => {
        const measureMock = jest.fn((cb: (x: number, y: number, w: number, h: number) => void) => {
            cb(40, 200, 80, 24);
        });
        const { tree } = withAllProviders(<AnchorChild measureMock={measureMock} />);
        const screen = render(tree);

        fireEvent.press(screen.getByTestId('anchor'));
        expect(screen.queryByTestId('tap-tooltip')).not.toBeNull();

        fireEvent.press(screen.getByTestId('anchor'));
        expect(screen.queryByTestId('tap-tooltip')).toBeNull();
    });

    it('does not mount when content is null (unwired kind)', () => {
        const measureMock = jest.fn((cb: (x: number, y: number, w: number, h: number) => void) => {
            cb(40, 200, 80, 24);
        });
        const { tree } = withAllProviders(
            <AnchorChild measureMock={measureMock} kind="effect" id="unknown-effect" />,
        );
        const screen = render(tree);

        fireEvent.press(screen.getByTestId('anchor'));
        // Content is null → measure should not even be consulted.
        expect(measureMock).not.toHaveBeenCalled();
        expect(screen.queryByTestId('tap-tooltip')).toBeNull();
    });

    it('exposes a no-op show outside the provider (NOOP_CONTEXT)', () => {
        function BareChild() {
            const tooltip = useTooltip();
            const anchorRef = useRef<{ measureInWindow: jest.Mock }>({
                measureInWindow: jest.fn(),
            });
            // Should not throw — NOOP context.
            tooltip.show({ kind: 'stat', id: 'HEART', anchorRef: anchorRef as never });
            return <Text testID="bare">ok</Text>;
        }
        const screen = render(<BareChild />);
        expect(screen.getByTestId('bare')).toBeTruthy();
    });
});
