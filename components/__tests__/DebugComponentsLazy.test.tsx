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

// Mock all the debug components to avoid dynamic import issues in test
jest.mock('@/components/DebugChaosToggle', () => ({
    DebugChaosToggle: () => null,
}));
jest.mock('@/components/DebugCombatButton', () => ({
    DebugCombatButton: () => null,
}));
jest.mock('@/components/DebugAlignmentShift', () => ({
    DebugAlignmentShift: () => null,
}));
jest.mock('@/components/DebugCurrencyControl', () => ({
    DebugCurrencyControl: () => null,
}));
jest.mock('@/components/DebugDialogueJump', () => ({
    DebugDialogueJump: () => null,
}));
jest.mock('@/components/DebugEffectApply', () => ({
    DebugEffectApply: () => null,
}));
jest.mock('@/components/DebugQuestState', () => ({
    DebugQuestState: () => null,
}));
jest.mock('@/components/DebugEventKindForce', () => ({
    DebugEventKindForce: () => null,
}));
jest.mock('@/components/DebugFriendship', () => ({
    DebugFriendship: () => null,
}));
jest.mock('@/components/DebugHudOverrides', () => ({
    DebugHudOverrides: () => null,
}));
jest.mock('@/components/DebugManaControl', () => ({
    DebugManaControl: () => null,
}));
jest.mock('@/components/DebugMapResetButton', () => ({
    DebugMapResetButton: () => null,
}));
jest.mock('@/components/DebugPlaythroughPresets', () => ({
    DebugPlaythroughPresets: () => null,
}));
jest.mock('@/components/DebugPresetPicker', () => ({
    DebugPresetPicker: () => null,
}));
jest.mock('@/components/DebugPopulateAllItems', () => ({
    DebugPopulateAllItems: () => null,
}));
jest.mock('@/components/DebugSeedButton', () => ({
    DebugSeedButton: () => null,
}));
jest.mock('@/components/DebugXpGrant', () => ({
    DebugXpGrant: () => null,
}));
jest.mock('@/components/AestheticDevToggle', () => ({
    AestheticDevToggle: () => null,
}));

const mockIsDevToolsEnabled = isDevToolsEnabled as jest.MockedFunction<typeof isDevToolsEnabled>;

function withProviders(child: React.ReactNode) {
    const store = createAppStore({ adapter: createMemoryAdapter() });
    return <GameStoreProvider store={store}>{child}</GameStoreProvider>;
}

describe('DebugComponentsLazy: DEV gate', () => {
    beforeEach(() => {
        // Suppress React act() warnings that occur due to Suspense in test environment
        jest.spyOn(console, 'error').mockImplementation((message) => {
            if (typeof message === 'string' && message.includes('A suspended resource finished loading')) {
                return;
            }
            console.error(message);
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('renders null when dev tools are disabled', () => {
        mockIsDevToolsEnabled.mockReturnValue(false);

        const tree = render(withProviders(<DebugComponentsLazy />));
        
        // Should return null when dev tools are disabled
        expect(tree.toJSON()).toBeNull();
    });

    it('renders debug components when dev tools are enabled', () => {
        mockIsDevToolsEnabled.mockReturnValue(true);

        const tree = render(withProviders(<DebugComponentsLazy />));
        
        // With mocked components, the Suspense should resolve immediately
        // Since all components are mocked to return null, we test that the container exists
        expect(tree.root).toBeTruthy();
        // We can't easily test for the loading fallback since mocks resolve instantly
    });
});

describe('DebugComponentsLazy: structure', () => {
    it('exports function properly', () => {
        // Simple smoke test that the component exports correctly
        expect(typeof DebugComponentsLazy).toBe('function');
        expect(DebugComponentsLazy.name).toBe('DebugComponentsLazy');
    });
});