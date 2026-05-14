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

/**
 * The engine auto-persists on every dispatch as of
 * `axiomancer-mechanics@0.5.0`. On mobile we don't want every action to
 * touch AsyncStorage — saves are explicit (Spec 09).
 *
 * `wrapDeflectingAdapter` proxies `load()` straight through but swallows
 * `save()` unless the wrapper is in "passthrough" mode, which we only
 * engage for the duration of an explicit `store.save()` call below.
 */
function wrapDeflectingAdapter(real: PersistenceAdapter) {
    let passthrough = false;
    const adapter: PersistenceAdapter = {
        load: () => real.load(),
        save: (state) => {
            if (passthrough) real.save(state);
        },
    };
    function withPassthrough<T>(fn: () => T): T {
        passthrough = true;
        try {
            return fn();
        } finally {
            passthrough = false;
        }
    }
    return { adapter, withPassthrough };
}

export function createAppStore(options: CreateAppStoreOptions = {}): AppStore {
    const { adapter: real = nullAdapter, overrides } = options;
    const { adapter, withPassthrough } = wrapDeflectingAdapter(real);
    const store = createGameStore(adapter, overrides);

    // Engine's `save()` writes through `adapter.save(...)`. Gate the
    // wrapped adapter so only this explicit path reaches the real one.
    const engineSave = store.getState().save;
    store.setState({
        save: () => withPassthrough(engineSave),
    });

    return store;
}
