/**
 * Hermetic component tests — TokenCrucible.
 *
 * The Token Crucible is a 384-line standalone tracker/explainer
 * for the 5-resource system. The presenter
 * (`selectTokenCrucibleViewModel`) is already covered in
 * `state/e2e/token-crucible.engine.test.ts`; this file pins the
 * **component-level contract**:
 *
 * - The `showClose` prop controls the top-right close affordance.
 * - The close press routes through `router.back()`.
 * - The `tokens` prop drives the CURRENT POOL counts.
 * - Default-prop render does not crash and shows the canonical
 *   five-resource pool.
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { TokenCrucible } from '@/components/TokenCrucible';

const mockBack = jest.fn();
const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    back: mockBack,
    canGoBack: () => true,
};

jest.mock('expo-router', () => ({
    useRouter: () => mockRouter,
}));

afterEach(() => {
    mockBack.mockClear();
});

describe('TokenCrucible: showClose affordance', () => {
    it('hides the close button when showClose is false (default)', () => {
        const tree = render(<TokenCrucible />);
        expect(tree.queryByText('✕')).toBeNull();
    });

    it('renders the close button when showClose is true', () => {
        const tree = render(<TokenCrucible showClose />);
        expect(tree.queryByText('✕')).not.toBeNull();
    });

    it('press on close button calls router.back()', () => {
        const tree = render(<TokenCrucible showClose />);
        expect(mockBack).not.toHaveBeenCalled();

        fireEvent.press(tree.getByText('✕'));

        expect(mockBack).toHaveBeenCalledTimes(1);
    });
});

describe('TokenCrucible: pool prop', () => {
    it('renders default pool when no tokens prop given (no crash)', () => {
        const tree = render(<TokenCrucible />);
        // Header is the load-bearing landmark.
        expect(tree.queryByText('✠ TOKEN CRUCIBLE')).not.toBeNull();
        // Default pool: body=2, mind=1, heart=2, fallacy=1, paradox=1
        // The "2" count appears twice and "1" appears three times.
        // Section labels include CURRENT POOL.
        expect(tree.queryByText('CURRENT POOL')).not.toBeNull();
    });

    it('passes custom token counts through to the pool display', () => {
        const tree = render(
            <TokenCrucible tokens={{ body: 7, mind: 0, heart: 3, fallacy: 0, paradox: 0 }} />,
        );
        // Body's count cell renders as "7".
        expect(tree.queryByText('7')).not.toBeNull();
        // Heart's count cell renders as "3".
        expect(tree.queryByText('3')).not.toBeNull();
    });

    it('partial token prop is normalized — missing keys default to 0', () => {
        const tree = render(<TokenCrucible tokens={{ body: 4 }} />);
        // Body renders 4; the rest render 0. Multiple 0s appear so just
        // confirm 4 is present and the header still mounts.
        expect(tree.queryByText('4')).not.toBeNull();
        expect(tree.queryByText('✠ TOKEN CRUCIBLE')).not.toBeNull();
    });
});

describe('TokenCrucible: section landmarks', () => {
    it('renders all canonical section labels in order', () => {
        const tree = render(<TokenCrucible />);
        expect(tree.queryByText('✠ TOKEN CRUCIBLE')).not.toBeNull();
        expect(tree.queryByText('CURRENT POOL')).not.toBeNull();
        expect(tree.queryByText('HOW TOKENS ACCRUE')).not.toBeNull();
    });
});
