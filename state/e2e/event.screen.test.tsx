/**
 * Hermetic component render test — event screen (`app/event/index.tsx`).
 *
 * Pins that the screen renders the right VM-driven content for each
 * event kind, dispatches the right action on pick, and gates the
 * skip button on `canSkip`. Drives state via the action layer.
 */

import { afterEach, describe, it, expect, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

jest.mock('expo-router', () => ({
    useRouter: () => ({
        replace: jest.fn(),
        push: jest.fn(),
        back: jest.fn(),
        canGoBack: () => true,
    }),
}));

import {
    GameStoreProvider,
    useGameActions,
} from '@/state/GameStoreProvider';
import { createAppStore, EMPTY_EVENT_SLICE, type AppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';
import type { ProcessNodeResult } from 'axiomancer-mechanics';

import EventScreen from '@/app/event/index';

afterEach(() => {
    jest.restoreAllMocks();
});

function makeStore(): AppStore {
    return createAppStore({ adapter: createMemoryAdapter() });
}

function withProvider(store: AppStore, child: React.ReactNode) {
    return <GameStoreProvider store={store}>{child}</GameStoreProvider>;
}

function setPending(store: AppStore, result: ProcessNodeResult) {
    store.setState({
        event: { ...EMPTY_EVENT_SLICE, pending: result },
    });
}

function encounter(isBoss = false): ProcessNodeResult {
    const enemy = {
        id: 'cairn-rot',
        name: 'Cairn-rot',
        level: 3,
        health: 24,
    } as never;
    return {
        gameState: undefined as never,
        event: { kind: 'encounter', encounter: { enemy }, isBoss },
        objectivesProgressed: [],
        questsCompleted: [],
        message: 'A figure stirs.',
    };
}

function rest(message: string, healed = 6): ProcessNodeResult {
    return {
        gameState: undefined as never,
        event: { kind: 'rest', healed },
        objectivesProgressed: [],
        questsCompleted: [],
        message,
    };
}

describe('EventScreen render', () => {
    it('renders combat-prelude with FIGHT and FLEE choices for a non-boss encounter', () => {
        const store = makeStore();
        setPending(store, encounter(false));

        const { getByTestId, getByText } = render(
            withProvider(store, <EventScreen />),
        );

        expect(getByTestId('event-choice-fight')).toBeTruthy();
        expect(getByTestId('event-choice-flee')).toBeTruthy();
        expect(getByText('FIGHT')).toBeTruthy();
        expect(getByText('FLEE')).toBeTruthy();
    });

    it('renders boss combat-prelude with FLEE disabled', () => {
        const store = makeStore();
        setPending(store, encounter(true));

        const { getByTestId } = render(
            withProvider(store, <EventScreen />),
        );

        const flee = getByTestId('event-choice-flee');
        expect(flee.props.accessibilityState?.disabled).toBe(true);
    });

    it('shows consequence chips on a rest event (+heal HP)', () => {
        const store = makeStore();
        setPending(store, rest('A quiet place.', 7));

        const { getByTestId } = render(
            withProvider(store, <EventScreen />),
        );

        const chips = getByTestId('event-consequence-chips');
        expect(chips).toBeTruthy();
    });

    it('shows the SKIP button when canSkip is true (rest with long body)', () => {
        const store = makeStore();
        const long = 'You rest. '.repeat(40);
        setPending(store, rest(long, 1));

        const { getByTestId } = render(
            withProvider(store, <EventScreen />),
        );

        expect(getByTestId('event-skip')).toBeTruthy();
    });

    it('omits the SKIP button when canSkip is false (rest with short body)', () => {
        const store = makeStore();
        setPending(store, rest('Brief rest.', 1));

        const { queryByTestId } = render(
            withProvider(store, <EventScreen />),
        );

        expect(queryByTestId('event-skip')).toBeNull();
    });

    it('renders the empty state when no event is active', () => {
        const store = makeStore();
        // pending stays null
        const { getByTestId, getByText } = render(
            withProvider(store, <EventScreen />),
        );

        expect(getByTestId('event-empty')).toBeTruthy();
        expect(getByText('NO EVENT IN PROGRESS')).toBeTruthy();
    });
});

describe('EventScreen choice dispatch', () => {
    function PickSpy({
        choiceId,
        onSpy,
    }: {
        choiceId: string;
        onSpy: (spy: jest.Mock) => void;
    }) {
        const actions = useGameActions();
        const spy = jest.fn(actions.pickEventChoice);
        // Replace via mutation so the screen's hook reads the spy.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (actions as any).pickEventChoice = spy;
        React.useEffect(() => onSpy(spy as unknown as jest.Mock), [spy, onSpy]);
        return null;
    }

    it('tapping FIGHT dispatches pickEventChoice("fight")', () => {
        const store = makeStore();
        setPending(store, encounter(false));

        let spy: jest.Mock | null = null;
        const { getByTestId } = render(
            withProvider(
                store,
                <>
                    <PickSpy choiceId="fight" onSpy={(s) => (spy = s)} />
                    <EventScreen />
                </>,
            ),
        );

        fireEvent.press(getByTestId('event-choice-fight'));
        expect(spy).toBeTruthy();
        expect(spy as unknown as jest.Mock).toHaveBeenCalledWith('fight');
    });
});
