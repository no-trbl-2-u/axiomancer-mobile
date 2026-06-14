/**
 * Mobile-authored fallback dialogue for quest-node NPC interactions.
 *
 * Some quest nodes resolve to an engine `interaction` event whose
 * `npcName` has no matching NPC (with a `dialogueTree`) in the
 * engine's map definition — so the engine returns the interaction
 * with `dialogue: undefined`. With no tree, the `/dialogue` screen
 * falls back to the bare `'A figure waits.'` body and a single
 * "SO BE IT" reply, which reads as an empty card.
 *
 * Until the engine ships authored NPCs for these nodes, the mobile
 * boundary supplies the conversation here (same pattern as the
 * pool/override adaptation in `event-pools.ts`). `resolveCurrentMapEventAction`
 * looks an interaction's `npcName` up in `QUEST_NPC_DIALOGUE` and, when
 * the engine gave no tree, seeds the event slice's `dialogueCursor`
 * with the mobile tree so `composeNpcDialogue` renders real replies.
 *
 * Keys are engine `npcName`s (see `QUEST_NPCS` in `event-pools.ts`).
 */

import type { DialogueTree } from 'axiomancer-mechanics';

/**
 * The Forgotten Pilgrim at Northern Forest's Pilgrim's Cairn (nf-6).
 * Northern-forest has no authored quest BOARD (only `build-the-boat`
 * exists), so its single quest node is an NPC interaction. The tree is
 * a short, self-contained exchange — no quest/flag effects, since there
 * is no board to start — written in the game's ritual register.
 */
const FORGOTTEN_PILGRIM: DialogueTree = {
    id: 'forgotten-pilgrim',
    rootId: 'root',
    nodes: {
        root: {
            id: 'root',
            text:
                'A cairn of grey stones, and a figure knelt beside it whose name the ' +
                'wind has worn flat. They do not look up. "Another one walks the ' +
                'ridge," they say. "The road takes everyone the same way. It only ' +
                'lies about the speed."',
            choices: [
                { text: 'Who lies beneath the stones?', nextNodeId: 'grave' },
                { text: 'What road do you mean?', nextNodeId: 'road' },
                { text: 'Leave them to their vigil.', nextNodeId: 'leave' },
            ],
        },
        grave: {
            id: 'grave',
            text:
                '"No one, now. A pilgrim, like you. Like me. We raise the stones so ' +
                'the next walker knows someone came this far." They set one more ' +
                'pebble on the pile. "Add yours, if you like. It costs nothing but ' +
                'the stooping."',
            choices: [
                { text: 'Add a stone, and walk on.', nextNodeId: 'leave' },
                { text: 'Ask about the road.', nextNodeId: 'road' },
            ],
        },
        road: {
            id: 'road',
            text:
                '"The only one there is. Down from the peak, out past the trees, ' +
                'to the water — and a boat, if you are lucky, and a longer road ' +
                'after that." They almost smile. "Mind the forest. It argues."',
            choices: [
                { text: 'Thank them, and walk on.', nextNodeId: 'leave' },
            ],
        },
        leave: {
            id: 'leave',
            text:
                'The pilgrim returns to their stones. "Walk well, then. Or walk ' +
                'badly — the cairn will hold either way."',
            choices: [],
        },
    },
};

/** engine `npcName` → mobile fallback dialogue tree. */
export const QUEST_NPC_DIALOGUE: Record<string, DialogueTree> = {
    'forgotten-pilgrim': FORGOTTEN_PILGRIM,
};

/** Returns the mobile fallback tree for an npc, or null if none. */
export function questNpcDialogueFor(npcName: string): DialogueTree | null {
    return QUEST_NPC_DIALOGUE[npcName] ?? null;
}
