/**
 * Hermetic component tests — DebugComponentsLazy
 * 
 * Tests the lazy loading container for debug components including
 * DEV gate behavior. Focuses on the isDevToolsEnabled gate rather
 * than dynamic import testing which requires complex Jest setup.
 */

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';

import { DebugComponentsLazy } from '@/components/DebugComponentsLazy';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { createAppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';
import { isDevToolsEnabled } from '@/lib/buildProfile';

// Mock the buildProfile module to control isDevToolsEnabled
jest.mock('@/lib/buildProfile', () => ({
    isDevToolsEnabled: jest.fn(),
    getBuildProfile: jest.fn(() => null),
}));

const mockIsDevToolsEnabled = isDevToolsEnabled as jest.MockedFunction<typeof isDevToolsEnabled>;

function withProviders(child: React.ReactNode) {
    const store = createAppStore({ adapter: createMemoryAdapter() });
    return <GameStoreProvider store={store}>{child}</GameStoreProvider>;
}

describe('DebugComponentsLazy: DEV gate', () => {
    it('renders null when dev tools are disabled', () => {
        mockIsDevToolsEnabled.mockReturnValue(false);

        const tree = render(withProviders(<DebugComponentsLazy />));
        
        // Should return null when dev tools are disabled
        expect(tree.toJSON()).toBeNull();
    });

    it('renders loading fallback when dev tools are enabled', () => {
        mockIsDevToolsEnabled.mockReturnValue(true);

        const tree = render(withProviders(<DebugComponentsLazy />));
        
        // Should render loading fallback when enabled (lazy components may not load in test)
        expect(tree.queryByText('Loading debug tools...')).toBeTruthy();
    });
});

describe('DebugComponentsLazy: structure', () => {
    it('exports function properly', () => {
        // Simple smoke test that the component exports correctly
        expect(typeof DebugComponentsLazy).toBe('function');
        expect(DebugComponentsLazy.name).toBe('DebugComponentsLazy');
    });
});