import {
    createGameStore,
    nullAdapter,
    type GameState,
    type GameStore,
    type PersistenceAdapter,
    type StoreApi,
} from 'axiomancer-mechanics';

export type AppStore = StoreApi<GameStore>;

export interface CreateAppStoreOptions {
    adapter?: PersistenceAdapter;
    overrides?: Partial<GameState>;
}

export function createAppStore(options: CreateAppStoreOptions = {}): AppStore {
    const { adapter = nullAdapter, overrides } = options;
    return createGameStore(adapter, overrides);
}
