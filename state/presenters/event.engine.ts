/**
 * Screen-level presenter for `app/event` (full-screen modal).
 *
 * Composes `EventViewModel` from the mobile event slice
 * (`state.event.pending` + `state.event.dialogueCursor`) which is
 * populated by `eventActions.processCurrentNode()` after a successful
 * `processNode()` call on the engine. Two VM kinds drive screen
 * behaviour: `'combat-prelude'` (foe intro -> startCombat) and
 * `'narrative-choice'` (prose + choices -> applyDialogue or
 * auto-resolve).
 *
 * Spec 08 product Qs locked in `plan/phases/phase_6_event_screen_wiring.md`:
 *   Q1 = A (two kinds), Q2 = C (both description + machine-readable
 *   consequences), Q3 = B (mobile-local slug -> asset, see
 *   event-assets.ts), Q4 = Future spec (mid-combat events deferred),
 *   Q5 = Yes (skip affordance over long bodies).
 */

import type {
    DialogueChoice,
    DialogueNode,
    DialogueTree,
    Encounter,
    Item,
    ProcessedEvent,
    ProcessNodeResult,
} from 'axiomancer-mechanics';
import { getDialogueNode, visibleChoices } from 'axiomancer-mechanics';

import type { AppStoreState } from '../store';
import { selectEventArtSlug, type EventArtSlug } from './event-assets';
import { freezeViewModel } from './freeze';

export type EventKind = 'combat-prelude' | 'narrative-choice';
export type EventVariant = 'encounter' | 'boss' | 'quest' | 'rest' | 'gather' | 'npc';
export type ChoiceAccentKey = 'blood' | 'sulfur' | 'parchment' | 'bone' | 'rust';

export type ConsequenceKind =
    | 'damage'
    | 'heal'
    | 'currency'
    | 'item'
    | 'flag'
    | 'moral'
    | 'quest-start'
    | 'quest-progress'
    | 'skill-learn';

export interface EventConsequence {
    kind: ConsequenceKind;
    amount?: number;
    label?: string;
}

export interface EventChoice {
    /** Stable choice id. For combat-prelude: `'fight'` | `'flee'`. For dialogue: `DialogueChoice.id`. */
    id: string;
    label: string;
    description: string;
    consequences: ReadonlyArray<EventConsequence>;
    iconKey: string;
    accentKey: ChoiceAccentKey;
    enabled: boolean;
}

export interface EventViewModel {
    kind: EventKind;
    variant: EventVariant;
    artSlug: EventArtSlug;
    badge: string;
    badgeAccentKey: ChoiceAccentKey;
    title: string;
    subtitle: string;
    body: string;
    choices: ReadonlyArray<EventChoice>;
    lore: string | null;
    /** True iff the screen should show a skip affordance over long prose. */
    canSkip: boolean;
}

const EMPTY_VM: EventViewModel = {
    kind: 'narrative-choice',
    variant: 'quest',
    artSlug: 'npc-generic',
    badge: 'NO EVENT',
    badgeAccentKey: 'bone',
    title: 'NO EVENT IN PROGRESS',
    subtitle: '',
    body: 'Walk on. The world has not yet stirred.',
    choices: [],
    lore: null,
    canSkip: false,
};

/**
 * True when an event is currently pending and the modal should be
 * shown. Returns `false` when the slice is empty or the pending event
 * kind is `'none'` (engine signal that the node had no event).
 */
export function selectHasActiveEvent(state: AppStoreState): boolean {
    const slice = state.event;
    if (!slice || slice.pending === null) return false;
    if (slice.pending.event.kind === 'none') return false;
    // Q4 = Future spec: mid-combat events are out of scope.
    if (state.combat !== null) return false;
    return true;
}

/**
 * Returns the event view-model. When no event is active, returns the
 * empty-state VM (the screen shows "no event in progress").
 */
export function selectEventViewModel(state: AppStoreState): EventViewModel {
    if (!selectHasActiveEvent(state)) {
        return freezeViewModel(EMPTY_VM);
    }
    const slice = state.event;
    const result = slice.pending as ProcessNodeResult;
    const processed = result.event;

    if (processed.kind === 'encounter') {
        return freezeViewModel(composeCombatPrelude(processed.encounter, processed.isBoss));
    }

    // Dialogue cursor takes precedence when walking an NPC tree.
    if (slice.dialogueCursor !== null) {
        return freezeViewModel(
            composeNpcDialogue(slice.dialogueCursor.tree, slice.dialogueCursor.nodeId, state),
        );
    }

    // npc / rest / gather / treasure / quest / shop -> narrative-choice
    return freezeViewModel(composeNarrative(processed, result.message));
}

// -- composition helpers -----------------------------------------------------

function composeCombatPrelude(encounter: Encounter, isBoss: boolean): EventViewModel {
    const enemy = encounter.enemy;
    const badge = isBoss ? 'OMEN OF DOOM' : 'ENCOUNTER';
    const choices: EventChoice[] = [
        {
            id: 'fight',
            label: 'FIGHT',
            description: isBoss ? 'Combat · BOSS' : 'Combat · turns',
            consequences: [],
            iconKey: 'sword',
            accentKey: 'blood',
            enabled: true,
        },
        {
            id: 'flee',
            label: 'FLEE',
            description: 'Luck Save',
            consequences: [],
            iconKey: 'flee',
            accentKey: 'bone',
            enabled: !isBoss,
        },
    ];
    return {
        kind: 'combat-prelude',
        variant: isBoss ? 'boss' : 'encounter',
        artSlug: isBoss ? 'boss' : 'encounter',
        badge,
        badgeAccentKey: 'blood',
        title: enemy.name.toUpperCase(),
        subtitle: isBoss ? 'fourth seal · third sigh' : 'something stirs',
        body: `Level ${enemy.level}. ${enemy.health} HP.`,
        choices,
        lore: null,
        canSkip: false,
    };
}

function composeNpcDialogue(
    tree: DialogueTree,
    nodeId: string,
    state: AppStoreState,
): EventViewModel {
    const node: DialogueNode = getDialogueNode(tree, nodeId);
    const activeNames: string[] = state.quests.active.map((q: { name: string }) => q.name);
    const ctx = {
        activeQuests: new Set<string>(activeNames),
        completedQuests: new Set<string>(state.quests.completed as string[]),
        flags: new Set<string>(state.flags as string[]),
    };
    const visible = visibleChoices(node, ctx);
    const choices: EventChoice[] = visible.map((choice) => ({
        id: choice.id,
        label: (choice.label ?? choice.id).toUpperCase(),
        description: choice.label ?? '',
        consequences: extractDialogueConsequences(choice),
        iconKey: 'scroll',
        accentKey: 'parchment',
        enabled: true,
    }));
    const text = (node.text ?? '') as string;
    return {
        kind: 'narrative-choice',
        variant: 'npc',
        artSlug: 'npc-generic',
        badge: 'A VOICE',
        badgeAccentKey: 'parchment',
        title: ((node.speaker ?? 'A FIGURE') as string).toUpperCase(),
        subtitle: '',
        body: text,
        choices,
        lore: null,
        canSkip: choices.length <= 1 && text.length > 240,
    };
}

function composeNarrative(processed: ProcessedEvent, message: string): EventViewModel {
    const artSlug = selectEventArtSlug(processed);
    switch (processed.kind) {
        case 'rest': {
            return {
                kind: 'narrative-choice',
                variant: 'rest',
                artSlug,
                badge: 'A QUIET PLACE',
                badgeAccentKey: 'parchment',
                title: 'YOU REST',
                subtitle: '',
                body: message,
                choices: [
                    {
                        id: 'continue',
                        label: 'WALK ON',
                        description: 'Continue',
                        consequences: [
                            { kind: 'heal', amount: processed.healed },
                        ],
                        iconKey: 'eye',
                        accentKey: 'parchment',
                        enabled: true,
                    },
                ],
                lore: null,
                canSkip: message.length > 240,
            };
        }
        case 'gather':
            return composeItemBag('A GATHERING', 'YOU GATHER', message, processed.items, artSlug, 'gather');
        case 'treasure':
            return composeItemBag('A FIND', 'YOU TAKE', message, processed.items, artSlug, 'quest', processed.currency);
        case 'quest':
            return {
                kind: 'narrative-choice',
                variant: 'quest',
                artSlug,
                badge: processed.startedNew ? 'A QUEST BEGINS' : 'A QUEST FURTHERS',
                badgeAccentKey: 'sulfur',
                title: processed.questName.toUpperCase(),
                subtitle: '',
                body: message,
                choices: [
                    {
                        id: 'acknowledge',
                        label: 'SO BE IT',
                        description: 'Continue',
                        consequences: processed.startedNew
                            ? [{ kind: 'quest-start', label: processed.questName }]
                            : [{ kind: 'quest-progress', label: processed.questName }],
                        iconKey: 'scroll',
                        accentKey: 'sulfur',
                        enabled: true,
                    },
                ],
                lore: null,
                canSkip: message.length > 240,
            };
        case 'shop':
            return {
                kind: 'narrative-choice',
                variant: 'quest',
                artSlug,
                badge: 'A TRADER',
                badgeAccentKey: 'parchment',
                title: processed.npcName.toUpperCase(),
                subtitle: '',
                body: message,
                choices: [
                    {
                        id: 'leave',
                        label: 'LEAVE',
                        description: 'Walk on (shop UI pending)',
                        consequences: [],
                        iconKey: 'flee',
                        accentKey: 'bone',
                        enabled: true,
                    },
                ],
                lore: null,
                canSkip: false,
            };
        case 'npc':
            return {
                kind: 'narrative-choice',
                variant: 'npc',
                artSlug,
                badge: 'A VOICE',
                badgeAccentKey: 'parchment',
                title: processed.npcName.toUpperCase(),
                subtitle: '',
                body: message,
                choices: [
                    {
                        id: 'acknowledge',
                        label: 'SO BE IT',
                        description: 'Continue',
                        consequences: [],
                        iconKey: 'scroll',
                        accentKey: 'parchment',
                        enabled: true,
                    },
                ],
                lore: null,
                canSkip: message.length > 240,
            };
        case 'encounter':
        case 'none':
            return EMPTY_VM;
    }
}

function composeItemBag(
    badge: string,
    title: string,
    body: string,
    items: ReadonlyArray<Item>,
    artSlug: EventArtSlug,
    variant: EventVariant,
    currency?: number,
): EventViewModel {
    const consequences: EventConsequence[] = items.map((item) => ({
        kind: 'item',
        label: item.name,
    }));
    if (typeof currency === 'number' && currency > 0) {
        consequences.push({ kind: 'currency', amount: currency });
    }
    return {
        kind: 'narrative-choice',
        variant,
        artSlug,
        badge,
        badgeAccentKey: 'sulfur',
        title,
        subtitle: '',
        body,
        choices: [
            {
                id: 'acknowledge',
                label: 'TAKE IT',
                description: 'Continue',
                consequences,
                iconKey: 'scroll',
                accentKey: 'sulfur',
                enabled: true,
            },
        ],
        lore: null,
        canSkip: body.length > 240,
    };
}

function extractDialogueConsequences(choice: DialogueChoice): ReadonlyArray<EventConsequence> {
    const out: EventConsequence[] = [];
    const e = choice.effect;
    if (!e) return out;
    if (e.grantCurrency) out.push({ kind: 'currency', amount: e.grantCurrency });
    if (typeof e.moralDelta === 'number' && e.moralDelta !== 0) {
        out.push({ kind: 'moral', amount: e.moralDelta });
    }
    if (e.startQuest) out.push({ kind: 'quest-start', label: e.startQuest });
    if (e.completeQuest) out.push({ kind: 'quest-progress', label: e.completeQuest });
    if (e.progressQuest) {
        out.push({
            kind: 'quest-progress',
            label: e.progressQuest.name,
            amount: e.progressQuest.amount ?? 1,
        });
    }
    if (e.teachSkill) out.push({ kind: 'skill-learn', label: e.teachSkill });
    if (e.setFlag) out.push({ kind: 'flag', label: e.setFlag });
    return out;
}
