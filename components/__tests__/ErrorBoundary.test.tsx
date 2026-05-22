/**
 * Hermetic tests — `<ErrorBoundary>` + `ErrorScreen` debug fallback.
 *
 * The boundary catches subtree render errors so the app shows
 * a debug screen instead of breaking. Tests verify:
 * - Happy path passes children through unchanged
 * - Catches a thrown render error and shows the fallback
 * - Fallback surfaces error message + state snapshot fields
 * - TRY AGAIN resets the boundary
 *
 * React's testing renderer surfaces caught errors as warnings;
 * we silence the expected ones to keep test output clean.
 */

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { withAllProviders } from '@/test-utils/withAllProviders';

// Silence React's "The above error occurred in..." console.error +
// our own ErrorBoundary's `[ErrorBoundary] caught` log during the
// tests that intentionally throw.
const consoleSpy = {
    error: undefined as ReturnType<typeof jest.spyOn> | undefined,
};

beforeEach(() => {
    consoleSpy.error = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    consoleSpy.error?.mockRestore();
    consoleSpy.error = undefined;
});

function Boom({ message = 'kaboom' }: { message?: string }): React.ReactElement {
    throw new Error(message);
}

describe('ErrorBoundary: happy path', () => {
    it('renders children unchanged when no error throws', () => {
        const { tree } = withAllProviders(
            <ErrorBoundary>
                <Text testID="happy-child">all is well</Text>
            </ErrorBoundary>,
        );
        const rendered = render(tree);
        expect(rendered.queryByTestId('happy-child')).not.toBeNull();
        expect(rendered.queryByTestId('error-boundary-screen')).toBeNull();
    });
});

describe('ErrorBoundary: error capture', () => {
    it('catches a thrown render error and mounts the fallback ErrorScreen', () => {
        const { tree } = withAllProviders(
            <ErrorBoundary>
                <Boom message="state-snapshot test crash" />
            </ErrorBoundary>,
        );
        const rendered = render(tree);
        expect(rendered.queryByTestId('error-boundary-screen')).not.toBeNull();
        // Eyebrow + ritual title both render
        expect(rendered.queryByText('✠ SOMETHING TORE')).not.toBeNull();
        expect(rendered.queryByText('The page split.')).not.toBeNull();
    });

    it('renders the error message verbatim inside the ERROR section', () => {
        const { tree } = withAllProviders(
            <ErrorBoundary>
                <Boom message="explicit-debug-line-42" />
            </ErrorBoundary>,
        );
        const rendered = render(tree);
        // The message appears at least twice (codeMessage Text +
        // stack-trace block); both are intentional. Use
        // queryAllByText so we don't trip the "found multiple"
        // exception.
        const matches = rendered.queryAllByText(/explicit-debug-line-42/);
        expect(matches.length).toBeGreaterThanOrEqual(1);
    });

    it('renders the STATE SNAPSHOT section header so the player state is surfaced for debug', () => {
        const { tree } = withAllProviders(
            <ErrorBoundary>
                <Boom />
            </ErrorBoundary>,
        );
        const rendered = render(tree);
        expect(rendered.queryByText('STATE SNAPSHOT')).not.toBeNull();
    });

    it('renders the BUILD CONTEXT section so the user knows the env when crash hit', () => {
        const { tree } = withAllProviders(
            <ErrorBoundary>
                <Boom />
            </ErrorBoundary>,
        );
        const rendered = render(tree);
        expect(rendered.queryByText('BUILD CONTEXT')).not.toBeNull();
    });
});

describe('ErrorBoundary: reset affordance', () => {
    it('TRY AGAIN button resets the boundary state', () => {
        // Use a parent that controls whether to throw so a second
        // render-after-reset doesn't crash again.
        let shouldThrow = true;
        function Switchable() {
            if (shouldThrow) throw new Error('first time');
            return <Text testID="recovered">recovered</Text>;
        }
        const { tree } = withAllProviders(
            <ErrorBoundary>
                <Switchable />
            </ErrorBoundary>,
        );
        const rendered = render(tree);
        expect(rendered.queryByTestId('error-boundary-screen')).not.toBeNull();

        // Flip the switch so the next render of Switchable doesn't
        // throw, then tap TRY AGAIN to reset boundary state.
        shouldThrow = false;
        const tryAgain = rendered.getByLabelText('Try again');
        fireEvent.press(tryAgain);

        expect(rendered.queryByTestId('error-boundary-screen')).toBeNull();
        expect(rendered.queryByTestId('recovered')).not.toBeNull();
    });
});
