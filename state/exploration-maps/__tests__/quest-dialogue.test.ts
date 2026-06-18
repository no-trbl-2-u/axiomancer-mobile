/**
 * Unit tests for the quest-node NPC dialogue fallback resolver.
 *
 * `questNpcDialogueFor` is the mobile-boundary lookup that supplies a
 * fallback `DialogueTree` for quest-node NPC interactions the engine
 * ships without an authored tree (currently the Northern Forest
 * `forgotten-pilgrim` at nf-6). The happy path flows through the
 * action layer in `state/e2e/map-encounter-minigames.engine.test.ts`;
 * these cases isolate the resolver's own contract — the exact-keyed
 * lookup and the `null` fallback for an unmapped name — and guard the
 * registry's structural shape. Registry truth is read at runtime so
 * the suite survives content churn.
 */

import { describe, it, expect } from '@jest/globals';
import { QUEST_NPC_DIALOGUE, questNpcDialogueFor } from '../quest-dialogue';

describe('questNpcDialogueFor: keyed lookup', () => {
    it('returns the mapped tree by reference for a known npcName', () => {
        for (const [npcName, tree] of Object.entries(QUEST_NPC_DIALOGUE)) {
            expect(questNpcDialogueFor(npcName)).toBe(tree);
        }
    });

    it('resolves the forgotten-pilgrim tree with a multi-reply root', () => {
        const tree = questNpcDialogueFor('forgotten-pilgrim');
        expect(tree).not.toBeNull();
        expect(tree!.id).toBe('forgotten-pilgrim');
        const root = tree!.nodes[tree!.rootId];
        expect(root).toBeDefined();
        expect(root.choices ?? []).toHaveLength(3);
    });
});

describe('questNpcDialogueFor: fallback', () => {
    it('returns null for an unmapped npcName', () => {
        expect(questNpcDialogueFor('no-such-npc')).toBeNull();
    });

    it('returns null for the empty string', () => {
        expect(questNpcDialogueFor('')).toBeNull();
    });
});

describe('QUEST_NPC_DIALOGUE: registry shape', () => {
    it('every entry is a structurally valid DialogueTree', () => {
        const entries = Object.entries(QUEST_NPC_DIALOGUE);
        expect(entries.length).toBeGreaterThan(0);
        for (const [, tree] of entries) {
            expect(typeof tree.id).toBe('string');
            expect(typeof tree.rootId).toBe('string');
            expect(tree.nodes[tree.rootId]).toBeDefined();
        }
    });

    it('every choice nextNodeId resolves to a node in the same tree', () => {
        for (const [, tree] of Object.entries(QUEST_NPC_DIALOGUE)) {
            for (const node of Object.values(tree.nodes)) {
                for (const choice of node.choices ?? []) {
                    if (choice.nextNodeId === undefined) continue;
                    expect(tree.nodes[choice.nextNodeId]).toBeDefined();
                }
            }
        }
    });
});
