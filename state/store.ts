import {
    createEventEmitter,
    createGameStore,
    nullAdapter,
    type DialogueTree,
    type GameEvent,
    type GameEventEmitter,
    type GameState,
    type GameStore,
    type PersistenceAdapter,
    type ResolveMapEventResult,
    type StoreApi,
    type TypedGameEvent,
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

/**
 * Mobile-only notifications slice (Phase 29). Tracks:
 *
 * - `levelUpAcknowledged` — has the player acknowledged the most
 *   recent level-up? Levelup tab badge clears when `true`. Engine
 *   `character:levelup` flips to `false`; character-screen mount
 *   flips back to `true`. (Tick A.)
 * - `toast` — transient feedback string (e.g. inventory action
 *   confirmation). The `<ToastHost>` in `app/_layout.tsx` clears
 *   the field ~3 seconds after `id` changes. `id` increments per
 *   new toast so listeners can detect fresh dispatches even if
 *   `text` is identical. (Tick B.)
 */
export interface MobileNotificationsSlice {
    levelUpAcknowledged: boolean;
    toast: {
        text: string | null;
        id: number;
    };
}

export type AppStoreState = GameStore & {
    event: MobileEventSlice;
    notifications: MobileNotificationsSlice;
    /**
     * Mobile-private ring buffer of recent engine events. Populated by
     * the emitter wired in `createAppStore`. Capacity 20, newest-first.
     * Leading underscore signals "mobile-only, not engine state". Not
     * persisted (see `wrapDeflectingAdapter`).
     */
    _recentEvents: ReadonlyArray<TypedGameEvent>;
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
 * Default notifications slice. `levelUpAcknowledged: true` because a
 * fresh store has no pending level-up; the engine `character:levelup`
 * event flips it to `false`.
 */
export const DEFAULT_NOTIFICATIONS_SLICE: MobileNotificationsSlice = Object.freeze({
    levelUpAcknowledged: true,
    toast: Object.freeze({ text: null, id: 0 }),
});

/** Ring-buffer capacity for `_recentEvents`. Small enough not to bloat memory or save payloads. */
export const RECENT_EVENTS_CAPACITY = 20;

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

/**
 * Per-store emitter registry. The emitter instance is held outside the
 * store's serialized state (zustand setState would treat it as state
 * and serialize on every dispatch). Consumers that need the emitter
 * directly (e.g. the `useGameEvents` hook, Phase 25 Tick B) look it
 * up here.
 */
const EMITTER_BY_STORE = new WeakMap<AppStore, GameEventEmitter>();

/** Test-and-dev escape hatch: return the emitter attached to this store, or `null` if none was wired. */
export function getEmitterForStore(store: AppStore): GameEventEmitter | null {
    return EMITTER_BY_STORE.get(store) ?? null;
}

export function createAppStore(options: CreateAppStoreOptions = {}): AppStore {
    const { adapter: real = nullAdapter, overrides } = options;
    const { adapter, withPassthrough } = wrapDeflectingAdapter(real);
    const emitter = createEventEmitter();
    const engineStore = createGameStore(adapter, overrides, emitter);
    const store = engineStore as unknown as AppStore;

    // Engine's `save()` writes through `adapter.save(...)`. Gate the
    // wrapped adapter so only this explicit path reaches the real one.
    const engineSave = engineStore.getState().save;
    store.setState({
        save: () => withPassthrough(engineSave),
        event: EMPTY_EVENT_SLICE,
        notifications: DEFAULT_NOTIFICATIONS_SLICE,
        _recentEvents: [],
    });

    // Subscribe AFTER initial setState so the empty buffer is the
    // starting state. Future engine dispatches push onto the buffer.
    emitter.onAny((event: GameEvent) => {
        const typed = event as TypedGameEvent;
        const prev = store.getState()._recentEvents;
        const next = [typed, ...prev].slice(0, RECENT_EVENTS_CAPACITY);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        store.setState({ _recentEvents: next } as any);
    });

    // Phase 29 Tick A: flip `levelUpAcknowledged` to false when the
    // engine fires `character:levelup`. The badge re-arms; visiting
    // the character screen flips it back to true. See
    // `state/presenters/navigation.engine.ts` for the predicate.
    emitter.on('character:levelup', () => {
        const prev = store.getState().notifications ?? DEFAULT_NOTIFICATIONS_SLICE;
        store.setState({
            notifications: { ...prev, levelUpAcknowledged: false },
        });
    });

    EMITTER_BY_STORE.set(store, emitter);

    return store;
}
