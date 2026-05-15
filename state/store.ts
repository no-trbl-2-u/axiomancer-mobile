import {
    createGameStore,
    nullAdapter,
    type DialogueTree,
    type GameState,
    type GameStore,
    type PersistenceAdapter,
    type ResolveMapEventResult,
    type StoreApi,
} from 'axiomancer-mechanics';

/**
 * Mobile-only state slice for the event modal. The engine returns
 * `ResolveMapEventResult` synchronously from `resolveMapEvent(state)`;
 * the store caches it so the screen can survive re-mounts and present
 * a skip affordance over long bodies. `dialogueCursor` advances as the
 * player walks an NPC `DialogueTree` via `applyDialogue`.
 */
export interface MobileEventSlice {
    pending: ResolveMapEventResult | null;
    dialogueCursor: { tree: DialogueTree; nodeId: string } | null;
    history: ReadonlyArray<{ nodeId: string; choiceId: string }>;
}

export type AppStoreState = GameStore & {
    event: MobileEventSlice;
};

export type AppStore = StoreApi<AppStoreState>;

export interface CreateAppStoreOptions {
    adapter?: PersistenceAdapter;
    overrides?: Partial<GameState>;
}

export const EMPTY_EVENT_SLICE: MobileEventSlice = Object.freeze({
    pending: null,
    dialogueCursor: null,
    history: Object.freeze([]),
});

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
    const engineStore = createGameStore(adapter, overrides);
    const store = engineStore as unknown as AppStore;

    // Engine's `save()` writes through `adapter.save(...)`. Gate the
    // wrapped adapter so only this explicit path reaches the real one.
    const engineSave = engineStore.getState().save;
    store.setState({
        save: () => withPassthrough(engineSave),
        event: EMPTY_EVENT_SLICE,
    });

    return store;
}
