/**
 * Hermetic component tests — AftermathBanner (Phase 41
 * post-combat overlay).
 *
 * Pins three contract slices:
 *   - Render shape (eyebrow / title / subtitle always present;
 *     rewards conditional on non-null + non-empty)
 *   - Accessibility (testID, accessibilityLiveRegion='polite',
 *     accessibilityLabel = `${eyebrow}. ${title}`,
 *     AccessibilityInfo.announceForAccessibility one-shot)
 *   - Auto-dismiss timer (onDismiss called after displayMs;
 *     cleanup clears pending timeout)
 */

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { AccessibilityInfo } from 'react-native';
import { render } from '@testing-library/react-native';
import React from 'react';

import { AftermathBanner } from '@/components/AftermathBanner';

const DEFAULT_PROPS = {
    eyebrow: 'IT IS WON',
    title: 'The foe yielded.',
    subtitle: 'a quieter air settles.',
    onDismiss: () => undefined,
};

let announceSpy: ReturnType<typeof jest.spyOn>;

beforeEach(() => {
    jest.useFakeTimers();
    announceSpy = jest
        .spyOn(AccessibilityInfo, 'announceForAccessibility')
        .mockImplementation(() => undefined);
});

afterEach(() => {
    jest.useRealTimers();
    announceSpy.mockRestore();
    jest.restoreAllMocks();
});

describe('AftermathBanner: render contract', () => {
    it('renders eyebrow, title, and subtitle', () => {
        const tree = render(<AftermathBanner {...DEFAULT_PROPS} />);
        expect(tree.queryByText('IT IS WON')).not.toBeNull();
        expect(tree.queryByText('The foe yielded.')).not.toBeNull();
        expect(tree.queryByText('a quieter air settles.')).not.toBeNull();
    });

    it('renders rewards line when rewards is a non-empty string', () => {
        const tree = render(
            <AftermathBanner {...DEFAULT_PROPS} rewards="+12 XP · 1 sigil" />,
        );
        expect(tree.queryByText('+12 XP · 1 sigil')).not.toBeNull();
    });

    it('omits rewards line when rewards is null (default)', () => {
        const tree = render(<AftermathBanner {...DEFAULT_PROPS} />);
        // No mono-text reward row should mount.
        expect(tree.queryByText(/XP/)).toBeNull();
    });

    it('omits rewards line when rewards is an empty string', () => {
        const tree = render(<AftermathBanner {...DEFAULT_PROPS} rewards="" />);
        // Empty string short-circuits the conditional render.
        expect(tree.queryByText(/XP/)).toBeNull();
    });

    it('exposes testID="aftermath-banner" for callers + smoke harnesses', () => {
        const tree = render(<AftermathBanner {...DEFAULT_PROPS} />);
        expect(tree.queryByTestId('aftermath-banner')).not.toBeNull();
    });
});

describe('AftermathBanner: accessibility', () => {
    it('marks the banner as a polite live region with a combined label', () => {
        const tree = render(<AftermathBanner {...DEFAULT_PROPS} />);
        const root = tree.getByTestId('aftermath-banner');
        expect(root.props.accessibilityLiveRegion).toBe('polite');
        expect(root.props.accessibilityLabel).toBe('IT IS WON. The foe yielded.');
    });

    it('fires AccessibilityInfo.announceForAccessibility once on mount', () => {
        render(<AftermathBanner {...DEFAULT_PROPS} />);
        expect(announceSpy).toHaveBeenCalledTimes(1);
        expect(announceSpy).toHaveBeenCalledWith('IT IS WON. The foe yielded.');
    });
});

describe('AftermathBanner: auto-dismiss timer', () => {
    it('calls onDismiss after the default 2500ms display window', () => {
        const onDismiss = jest.fn();
        render(<AftermathBanner {...DEFAULT_PROPS} onDismiss={onDismiss} />);

        expect(onDismiss).not.toHaveBeenCalled();
        jest.advanceTimersByTime(2499);
        expect(onDismiss).not.toHaveBeenCalled();
        jest.advanceTimersByTime(1);
        expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('honors a custom displayMs prop', () => {
        const onDismiss = jest.fn();
        render(
            <AftermathBanner
                {...DEFAULT_PROPS}
                displayMs={400}
                onDismiss={onDismiss}
            />,
        );

        jest.advanceTimersByTime(399);
        expect(onDismiss).not.toHaveBeenCalled();
        jest.advanceTimersByTime(1);
        expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('clears the pending timeout on unmount (no late onDismiss)', () => {
        const onDismiss = jest.fn();
        const tree = render(
            <AftermathBanner {...DEFAULT_PROPS} onDismiss={onDismiss} />,
        );
        tree.unmount();

        jest.advanceTimersByTime(5000);
        expect(onDismiss).not.toHaveBeenCalled();
    });
});
