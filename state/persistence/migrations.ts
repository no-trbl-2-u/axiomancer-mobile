import type { GameState } from 'axiomancer-mechanics';
import { deriveStats, deriveNonCombatStats } from 'axiomancer-mechanics';

/**
 * Bump when the on-disk save shape changes. Add a migration entry
 * keyed by the *source* version below.
 */
export const CURRENT_SCHEMA_VERSION = 2;

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

/**
 * Migration from schema v1 to v2: backfill missing derivedStats and
 * nonCombatStats fields in player data using engine derivation helpers.
 */
function migrateV1ToV2(state: unknown): unknown {
    if (!state || typeof state !== 'object') {
        throw new Error('Migration v1→v2: invalid state object');
    }

    const gameState = state as any;
    
    // Check that we have a valid player with baseStats
    if (!gameState.player || !gameState.player.baseStats) {
        throw new Error('Migration v1→v2: missing player.baseStats');
    }

    const player = gameState.player;
    const baseStats = player.baseStats;

    // Check if baseStats has required fields
    if (typeof baseStats.heart !== 'number' || 
        typeof baseStats.body !== 'number' || 
        typeof baseStats.mind !== 'number') {
        throw new Error('Migration v1→v2: invalid baseStats structure');
    }

    // Only add missing fields, preserve existing ones
    if (!player.derivedStats) {
        player.derivedStats = deriveStats(baseStats);
    }
    
    if (!player.nonCombatStats) {
        player.nonCombatStats = deriveNonCombatStats(baseStats);
    }

    return gameState;
}

/**
 * Default migration map with v1→v2 migration.
 */
export const DEFAULT_MIGRATIONS: MigrationMap = {
    1: migrateV1ToV2,
};

export function wrap(state: GameState): StoredEnvelope {
    return { schemaVersion: CURRENT_SCHEMA_VERSION, state };
}

/**
 * Apply migrations forward to `CURRENT_SCHEMA_VERSION`.
 * Throws on malformed envelopes and on saves from a future version.
 */
export function unwrap(
    envelope: StoredEnvelope,
    migrations: MigrationMap = DEFAULT_MIGRATIONS,
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
