/**
 * Hermetic E2E Tests — Phase 137 encounter screens rendering &
 * dispatch. Mounts the real /quest, /rest, and /cache screens against
 * rigged stores and walks their visible phases. Seeded; no timers,
 * no network.
 */

import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { afterEach, describe, expect, it, jest } from '@jest/globals';

import CacheScreen from '@/app/cache/index';
import QuestScreen from '@/app/quest/index';
import RestScreen from '@/app/rest/index';
import { createAppActions, type AppActions } from '@/state/actions';
import type { AppStore } from '@/state/store';
import { BUILD_THE_BOAT_BOARD, createLootCacheSession } from 'axiomancer-mechanics';
import type { QuestBoardSession } from 'axiomancer-mechanics';
import { withAllProviders } from '@/test-utils/withAllProviders';

jest.mock('expo-router', () => ({
    useRouter: () => ({
        back: jest.fn(),
        push: jest.fn(),
        canGoBack: () => false,
    }),
}));

afterEach(() => {
    jest.clearAllMocks();
});

function mount(element: React.ReactElement): { store: AppStore; actions: AppActions } {
    const { tree, store } = withAllProviders(element);
    render(tree);
    return { store, actions: createAppActions(store) };
}

function rigQuest(store: AppStore, over: Partial<QuestBoardSession>): void {
    const s = store.getState().quest.session;
    if (!s) throw new Error('no quest session');
    store.setState({ quest: { session: { ...s, ...over } } });
}

describe('quest screen', () => {
    it('shows the board reveal, then the track, resources, and charms', () => {
        const { store, actions } = mount(<QuestScreen />);
        act(() => {
            actions.beginQuestBoard({ seed: 7, boardId: 'build-the-boat' });
        });
        expect(screen.getByTestId('quest-intro')).toBeTruthy();
        expect(screen.getAllByText(BUILD_THE_BOAT_BOARD.title).length).toBeGreaterThan(0);

        fireEvent.press(screen.getByTestId('quest-begin'));
        expect(screen.queryByTestId('quest-intro')).toBeNull();
        expect(store.getState().quest.session?.phase).toBe('idle');
        expect(screen.getByTestId('quest-board-track')).toBeTruthy();
        expect(screen.getByTestId('quest-piece')).toBeTruthy();
        expect(screen.getByTestId('quest-resources')).toBeTruthy();
        expect(screen.getByTestId('quest-roll')).toBeTruthy();
        // Both dealt charms render.
        const session = store.getState().quest.session!;
        for (const charm of session.charms) {
            expect(screen.getByTestId(`quest-charm-${charm.id}`)).toBeTruthy();
        }
    });

    it('casting the bone opens a space card; continue returns to the die', () => {
        const { store, actions } = mount(<QuestScreen />);
        act(() => {
            actions.beginQuestBoard({ seed: 7 });
            actions.startQuestBoardPlay();
        });
        fireEvent.press(screen.getByTestId('quest-roll'));
        const s = store.getState().quest.session!;
        expect(s.phase).toBe('space');
        expect(screen.getByTestId('quest-space')).toBeTruthy();
        // Resolve: pick the first enabled option if any, then continue.
        if (s.pending!.result === null) {
            const enabled = s.pending!.options.filter(o => !o.disabledReason);
            const pick = s.pending!.kind === 'market'
                ? enabled.find(o => o.id === 'leave')!
                : enabled[0];
            fireEvent.press(screen.getByTestId(`quest-option-${pick.id}`));
        }
        fireEvent.press(screen.getByTestId('quest-continue'));
        expect(['idle', 'dusk']).toContain(store.getState().quest.session!.phase);
    });

    it('the outcome ledger claims and clears the table', () => {
        const { store, actions } = mount(<QuestScreen />);
        act(() => {
            actions.beginQuestBoard({ seed: 7 });
            actions.startQuestBoardPlay();
        });
        act(() => {
            rigQuest(store, {
                pos: BUILD_THE_BOAT_BOARD.spaces.length - 1,
                parts: { ...BUILD_THE_BOAT_BOARD.partsRequired },
            });
        });
        fireEvent.press(screen.getByTestId('quest-roll'));
        expect(store.getState().quest.session!.phase).toBe('outcome');
        expect(screen.getByTestId('quest-outcome')).toBeTruthy();
        fireEvent.press(screen.getByTestId('quest-claim'));
        expect(store.getState().quest.session).toBeNull();
    });
});

describe('rest screen', () => {
    it('walks posture → watch card → dawn ledger → claim', () => {
        const { store, actions } = mount(<RestScreen />);
        act(() => {
            actions.beginRest({ seed: 7 });
        });
        expect(screen.getByTestId('rest-postures')).toBeTruthy();
        fireEvent.press(screen.getByTestId('rest-posture-doze'));
        expect(store.getState().rest.session!.phase).toBe('watch');
        expect(screen.getByTestId('rest-card')).toBeTruthy();

        // Drive the night through the UI: tap options/continue as offered.
        for (let i = 0; i < 12 && store.getState().rest.session!.phase === 'watch'; i++) {
            const s = store.getState().rest.session!;
            if (s.pending!.result === null) {
                const enabled = s.pending!.options.filter(o => !o.disabledReason);
                fireEvent.press(screen.getByTestId(`rest-option-${enabled[0].id}`));
            } else {
                fireEvent.press(screen.getByTestId('rest-continue'));
            }
        }
        expect(store.getState().rest.session!.phase).toBe('outcome');
        expect(screen.getByTestId('rest-outcome')).toBeTruthy();
        fireEvent.press(screen.getByTestId('rest-claim'));
        expect(store.getState().rest.session).toBeNull();
    });
});

describe('cache screen', () => {
    function dudSeed(): number {
        for (let seed = 1; seed < 3000; seed++) {
            if (createLootCacheSession(seed, [], 10).layers.every(l => !l.trapped)) return seed;
        }
        throw new Error('no all-dud seed');
    }

    it('walks intro → layers → delve cards → ledger → claim', () => {
        const { store, actions } = mount(<CacheScreen />);
        act(() => {
            actions.beginLootCache({ currency: 10, seed: dudSeed() });
        });
        expect(screen.getByTestId('cache-intro')).toBeTruthy();
        fireEvent.press(screen.getByTestId('cache-begin'));
        expect(screen.getByTestId('cache-layers')).toBeTruthy();
        expect(screen.getByTestId('cache-decisions')).toBeTruthy();

        for (let i = 0; i < 3; i++) {
            fireEvent.press(screen.getByTestId('cache-delve'));
            expect(screen.getByTestId('cache-card')).toBeTruthy();
            fireEvent.press(screen.getByTestId('cache-continue'));
        }
        expect(store.getState().cache.session!.phase).toBe('outcome');
        expect(screen.getByTestId('cache-outcome')).toBeTruthy();
        fireEvent.press(screen.getByTestId('cache-claim'));
        expect(store.getState().cache.session).toBeNull();
    });

    it('hides sealed trap fates until probed', () => {
        const { store, actions } = mount(<CacheScreen />);
        act(() => {
            actions.beginLootCache({ currency: 10, seed: 7 });
        });
        fireEvent.press(screen.getByTestId('cache-begin'));
        // All unopened layers read SEALED — no fate leaks.
        const session = store.getState().cache.session!;
        for (const layer of session.layers.slice(1)) {
            if (layer.opened || layer.revealed) continue;
            expect(screen.getByTestId(`cache-layer-${layer.index}`)).toBeTruthy();
        }
        expect(screen.queryByText('TRAP — LIVE')).toBeNull();
        expect(screen.queryByText('TRAP — DEAD')).toBeNull();
    });
});
