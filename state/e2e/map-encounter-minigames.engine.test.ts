/**
 * Hermetic E2E — map encounter → minigame routing.
 *
 * The gameplay contract the player feels: walking onto a treasure /
 * quest / rest / gather node opens the matching minigame, NOT the
 * "/event" card. `resolveCurrentMapEventAction` intercepts those four
 * kinds (plus hazard) and starts a minigame session instead of
 * dropping a `ResolvedEvent` on the event slice.
 *
 * This pins that contract end-to-end through the store action layer
 * (the same path `app/(tabs)/exploration` drives on a node tap):
 *   - treasure node → loot-cache session, no paced /event route
 *   - quest board node (fv-15) → quest-board session (build-the-boat)
 *   - rest node → rest session
 *   - gather node → gathering session
 * plus the design invariants:
 *   - exactly ONE quest node per map (the map's single story beat)
 *   - the lone northern-forest quest interaction shows real mobile
 *     dialogue (forgotten-pilgrim), never the empty "A figure waits."
 *
 * The previous gap (2026-06-14): the only coverage of these kinds was
 * `DebugTriggerEncounter.test.tsx`, which asserted the BROKEN
 * slice-seeding behavior. Nothing pinned the actual minigame launch,
 * so the debug panel silently dead-ended at "NO EVENT".
 */

import { describe, expect, it } from '@jest/globals';
import {
    createMapState,
    getMapDefinition,
    type GameState,
} from 'axiomancer-mechanics';

import { createAppActions } from '@/state/actions';
import { createAppStore, type AppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';
import { selectPacedEventRoute, selectHasActiveEvent } from '@/state/presenters/event.engine';
import { selectHasActiveCache } from '@/state/presenters/cache.engine';
import { selectHasActiveRest } from '@/state/presenters/rest.engine';
import { selectHasActiveGathering } from '@/state/presenters/gathering.engine';
import { selectHasActiveQuestBoard } from '@/state/presenters/quest.engine';
import { fishingVillageLayout } from '@/state/exploration-maps/fishing-village.layout';
import { northernForestLayout } from '@/state/exploration-maps/northern-forest.layout';
// Side-effect: register the pools so `resolveMapEvent` resolves real kinds.
import '@/state/exploration-maps/event-pools';

function makeStoreAndActions() {
    const store = createAppStore({ adapter: createMemoryAdapter() });
    return { store, actions: createAppActions(store) };
}

type CoastalMap = 'fishing-village' | 'northern-forest';

/** Seat the player on `nodeId` of `mapName`, mirroring a reachable tap. */
function seatAt(store: AppStore, mapName: CoastalMap, nodeId: string) {
    const base = store.getState() as unknown as GameState;
    const map = createMapState(getMapDefinition('coastal-continent', mapName));
    store.setState({
        world: { ...base.world, currentMap: { ...map, currentNode: nodeId } },
    } as never);
}

/** First node of a given type in a layout (post one-quest-per-map retype). */
function firstNodeOfType(
    layout: typeof fishingVillageLayout,
    type: string,
): string {
    const node = layout.nodes.find((n) => n.type === type);
    if (!node) throw new Error(`no ${type} node in ${layout.mapId}`);
    return node.id;
}

describe('map encounter → minigame routing (fishing-village)', () => {
    it('treasure node opens the loot-cache, not a paced /event', () => {
        const { store, actions } = makeStoreAndActions();
        seatAt(store, 'fishing-village', firstNodeOfType(fishingVillageLayout, 'treasure'));

        expect(actions.resolveCurrentMapEvent('treasure')).toBe(true);

        expect(selectHasActiveCache(store.getState())).toBe(true);
        expect(selectHasActiveEvent(store.getState())).toBe(false);
        expect(selectPacedEventRoute(store.getState())).toBeNull();
    });

    it('rest node opens "The Night Watch", not a paced /event', () => {
        const { store, actions } = makeStoreAndActions();
        seatAt(store, 'fishing-village', firstNodeOfType(fishingVillageLayout, 'rest'));

        expect(actions.resolveCurrentMapEvent('rest')).toBe(true);

        expect(selectHasActiveRest(store.getState())).toBe(true);
        expect(selectPacedEventRoute(store.getState())).toBeNull();
    });

    it('gather node opens "The Gleaning", not a paced /event', () => {
        const { store, actions } = makeStoreAndActions();
        seatAt(store, 'fishing-village', firstNodeOfType(fishingVillageLayout, 'gather'));

        expect(actions.resolveCurrentMapEvent('gather')).toBe(true);

        expect(selectHasActiveGathering(store.getState())).toBe(true);
        expect(selectPacedEventRoute(store.getState())).toBeNull();
    });

    it('the lone quest node opens the build-the-boat board', () => {
        const { store, actions } = makeStoreAndActions();
        // fv-15 "Sea Cave" — the village's single story beat.
        seatAt(store, 'fishing-village', 'fv-15');

        expect(actions.resolveCurrentMapEvent('quest')).toBe(true);

        expect(selectHasActiveQuestBoard(store.getState())).toBe(true);
        expect(store.getState().quest.session?.boardId).toBe('build-the-boat');
        expect(selectPacedEventRoute(store.getState())).toBeNull();
    });
});

describe('one-quest-per-map design invariant', () => {
    it.each([
        ['fishing-village', fishingVillageLayout],
        ['northern-forest', northernForestLayout],
    ])('%s has exactly one quest node', (_name, layout) => {
        const questNodes = layout.nodes.filter((n) => n.type === 'quest');
        expect(questNodes).toHaveLength(1);
    });
});

describe('northern-forest quest interaction (nf-6 forgotten-pilgrim)', () => {
    it('shows real mobile dialogue instead of the empty "A figure waits." card', () => {
        const { store, actions } = makeStoreAndActions();
        seatAt(store, 'northern-forest', 'nf-6');

        expect(actions.resolveCurrentMapEvent('quest')).toBe(true);

        // Engine returns an interaction with no tree (no NPC in the map
        // def); the mobile fallback seeds a real dialogue cursor.
        const slice = store.getState().event;
        expect(slice.pending?.event.kind).toBe('interaction');
        expect(slice.dialogueCursor).not.toBeNull();
        const tree = slice.dialogueCursor!.tree;
        expect(tree.id).toBe('forgotten-pilgrim');
        // A real conversation: the root node offers more than one reply.
        const root = tree.nodes[tree.rootId];
        expect(root.choices && root.choices.length).toBeGreaterThan(1);
    });
});
