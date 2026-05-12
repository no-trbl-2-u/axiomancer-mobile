import React, { createContext, useContext, useMemo, useRef } from 'react';
import { useStore } from 'zustand/react';
import type { GameStore, PersistenceAdapter } from 'axiomancer-mechanics';
import { createAppStore, type AppStore } from './store';
import { createAppActions, type AppActions } from './actions';

interface GameStoreContextValue {
    store: AppStore;
    actions: AppActions;
}

const GameStoreContext = createContext<GameStoreContextValue | null>(null);

export interface GameStoreProviderProps {
    children: React.ReactNode;
    /**
     * Optional injected store — tests pass one built with a memory adapter.
     * When omitted, the provider lazily creates a singleton-per-mount store
     * backed by the engine's nullAdapter.
     */
    store?: AppStore;
    /**
     * Optional persistence adapter used when no `store` is supplied. Ignored
     * when `store` is provided. Spec 09 will plug in the AsyncStorage adapter.
     */
    adapter?: PersistenceAdapter;
}

export function GameStoreProvider({ children, store, adapter }: GameStoreProviderProps) {
    const storeRef = useRef<AppStore | null>(store ?? null);
    if (storeRef.current === null) {
        storeRef.current = createAppStore({ adapter });
    }

    const value = useMemo<GameStoreContextValue>(() => {
        const s = storeRef.current!;
        return { store: s, actions: createAppActions(s) };
    }, []);

    return <GameStoreContext.Provider value={value}>{children}</GameStoreContext.Provider>;
}

function useGameStoreContext(): GameStoreContextValue {
    const ctx = useContext(GameStoreContext);
    if (ctx === null) {
        throw new Error('useGameState/useGameActions must be used inside <GameStoreProvider>');
    }
    return ctx;
}

/**
 * Subscribe to a slice of game state. Components re-render only when the
 * selected value changes by reference identity. Prefer per-field selectors
 * (e.g. `useGameState(s => s.player.hp)`) to keep re-renders narrow.
 */
export function useGameState<U>(selector: (state: GameStore) => U): U {
    const { store } = useGameStoreContext();
    return useStore(store, selector);
}

/**
 * Returns the typed action creators. The reference is stable for the
 * lifetime of the provider, so it can safely sit in effect dependency lists.
 */
export function useGameActions(): AppActions {
    return useGameStoreContext().actions;
}

/**
 * Escape hatch — returns the raw vanilla store. Use sparingly (subscribe
 * outside React, imperative reads). Components should prefer `useGameState`.
 */
export function useGameStore(): AppStore {
    return useGameStoreContext().store;
}
