import type { GameState } from 'axiomancer-mechanics';

/**
 * Bump when the on-disk save shape changes. Add a migration entry
 * keyed by the *source* version below.
 */
export const CURRENT_SCHEMA_VERSION = 1;

export interface StoredEnvelope {
    schemaVersion: number;
    state: unknown;
}

/** Migration from version `N` to `N + 1`. */
export type Migration = (state: unknown) => unknown;

/**
 * `migrations[N]` migrates a save from version `N` to `N + 1`.
 * Empty by default — bump `CURRENT_SCHEMA_VERSION` and add an entry
 * here when the shape changes.
 */
export type MigrationMap = Record<number, Migration>;

export function wrap(state: GameState): StoredEnvelope {
    return { schemaVersion: CURRENT_SCHEMA_VERSION, state };
}

/**
 * Apply migrations forward to `CURRENT_SCHEMA_VERSION`.
 * Throws on malformed envelopes and on saves from a future version.
 */
export function unwrap(
    envelope: StoredEnvelope,
    migrations: MigrationMap = {},
): GameState {
    if (
        envelope === null ||
        typeof envelope !== 'object' ||
        typeof (envelope as StoredEnvelope).schemaVersion !== 'number'
    ) {
        throw new Error('asyncStorageAdapter: corrupt save (missing schemaVersion)');
    }
    let v = envelope.schemaVersion;
    let state: unknown = envelope.state;
    if (v > CURRENT_SCHEMA_VERSION) {
        throw new Error(
            `asyncStorageAdapter: save schema v${v} is from a future version (current v${CURRENT_SCHEMA_VERSION})`,
        );
    }
    while (v < CURRENT_SCHEMA_VERSION) {
        const m = migrations[v];
        if (!m) {
            throw new Error(`asyncStorageAdapter: no migration from v${v}`);
        }
        state = m(state);
        v++;
    }
    return state as GameState;
}
