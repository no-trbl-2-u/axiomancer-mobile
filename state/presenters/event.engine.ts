/**
 * Screen-level presenter for `app/event` (full-screen modal).
 *
 * Composes `EventViewModel` from the mobile event slice
 * (`state.event.pending` + `state.event.dialogueCursor`) populated by
 * `eventActions.processCurrentNode()` after `resolveMapEvent(state)`.
 * Two VM kinds drive screen behaviour: `'combat-prelude'` (foe intro
 * -> startCombat) and `'narrative-choice'` (prose + choices ->
 * applyDialogue or auto-resolve).
 *
 * Spec 08 product Qs locked (still binding after the 0.7.0 migration):
 *   Q1 = A (two kinds), Q2 = C (both description + machine-readable
 *   consequences), Q3 = B (mobile-local slug -> asset, see
 *   event-assets.ts), Q4 = Future spec (mid-combat events deferred),
 *   Q5 = Yes (skip affordance over long bodies).
 *
 * Engine-side surface (`axiomancer-mechanics@0.7.0`): pure
 * `resolveMapEvent(state)` returns `{ state, event }` where `event`
 * is a `ResolvedEvent` union over 8 kinds + 'none' (see
 * `node_modules/axiomancer-mechanics/dist/World/MapEvents/types.d.ts`).
 */

import type {
    DialogueChoice,
    DialogueNode,
    DialogueTree,
    Encounter,
    Item,
    NPC,
    ResolveMapEventResult,
    ResolvedEvent,
} from 'axiomancer-mechanics';
import { getDialogueNode, visibleChoices } from 'axiomancer-mechanics';

import type { AppStoreState } from '../store';
import {
    defaultBodyForEvent,
    selectEventArtSlug,
    type EventArtSlug,
} from './event-assets';
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
    artSlug: 'interaction-generic',
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
    const result = slice.pending as ResolveMapEventResult;
    const resolved = result.event;

    if (resolved.kind === 'encounter') {
        return freezeViewModel(composeCombatPrelude(resolved.encounter, resolved.isBoss));
    }

    // Dialogue cursor takes precedence when walking an NPC tree.
    if (slice.dialogueCursor !== null) {
        return freezeViewModel(
            composeNpcDialogue(slice.dialogueCursor.tree, slice.dialogueCursor.nodeId, state),
        );
    }

    return freezeViewModel(composeNarrative(resolved));
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
        artSlug: 'interaction-generic',
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

function bodyFromPayload(event: ResolvedEvent): string {
    // Each MapEventPayload has an optional description; the
    // `ResolvedEvent` payload doesn't directly expose it on every
    // discriminant (kind: 'encounter' has no description; kind:
    // 'cutscene' has `lines`; others may or may not). The pure
    // mapper here returns a kind-appropriate string.
    if (event.kind === 'cutscene') {
        return event.lines.join('\n\n');
    }
    return defaultBodyForEvent(event);
}

function composeNarrative(resolved: ResolvedEvent): EventViewModel {
    const artSlug = selectEventArtSlug(resolved);
    const body = bodyFromPayload(resolved);
    switch (resolved.kind) {
        case 'rest':
            return {
                kind: 'narrative-choice',
                variant: 'rest',
                artSlug,
                badge: 'A QUIET PLACE',
                badgeAccentKey: 'parchment',
                title: 'YOU REST',
                subtitle: '',
                body,
                choices: [
                    {
                        id: 'continue',
                        label: 'WALK ON',
                        description: 'Continue',
                        consequences: [{ kind: 'heal', amount: resolved.healed }],
                        iconKey: 'eye',
                        accentKey: 'parchment',
                        enabled: true,
                    },
                ],
                lore: null,
                canSkip: body.length > 240,
            };
        case 'gathering':
            return composeItemBag('A GATHERING', 'YOU GATHER', body, resolved.items, artSlug, 'gather');
        case 'loot-cache':
            return composeItemBag(
                'A FIND',
                'YOU TAKE',
                body,
                resolved.items,
                artSlug,
                'quest',
                resolved.currency,
            );
        case 'interaction':
            return composeInteraction(resolved.npcName, body, artSlug);
        case 'village':
            return composeVillage(resolved.villageName, resolved.merchants, body, artSlug);
        case 'cutscene':
            return composeCutscene(body, artSlug);
        case 'hazard':
            return composeHazard(resolved.damage, resolved.effects, body, artSlug);
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

function composeInteraction(npcName: string, body: string, artSlug: EventArtSlug): EventViewModel {
    return {
        kind: 'narrative-choice',
        variant: 'npc',
        artSlug,
        badge: 'A VOICE',
        badgeAccentKey: 'parchment',
        title: npcName.toUpperCase(),
        subtitle: '',
        body,
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
        canSkip: body.length > 240,
    };
}

function composeVillage(
    villageName: string,
    _merchants: ReadonlyArray<NPC>,
    body: string,
    artSlug: EventArtSlug,
): EventViewModel {
    // Shop UI is still out of scope (was already deferred under Spec
    // 08's 'shop' kind). Render the village name + a single LEAVE
    // choice; merchants list is ignored for now and lands when a shop
    // surface ships.
    return {
        kind: 'narrative-choice',
        variant: 'quest',
        artSlug,
        badge: 'A VILLAGE',
        badgeAccentKey: 'parchment',
        title: villageName.toUpperCase(),
        subtitle: '',
        body,
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
        canSkip: body.length > 240,
    };
}

function composeCutscene(body: string, artSlug: EventArtSlug): EventViewModel {
    return {
        kind: 'narrative-choice',
        variant: 'quest',
        artSlug,
        badge: 'A VISION',
        badgeAccentKey: 'sulfur',
        title: '',
        subtitle: '',
        body,
        choices: [
            {
                id: 'acknowledge',
                label: 'ON',
                description: 'Continue',
                consequences: [],
                iconKey: 'eye',
                accentKey: 'sulfur',
                enabled: true,
            },
        ],
        lore: null,
        // Cutscenes are often long; skip is always available.
        canSkip: true,
    };
}

function composeHazard(
    damage: number,
    effects: ReadonlyArray<{ id?: string; name?: string }>,
    body: string,
    artSlug: EventArtSlug,
): EventViewModel {
    const consequences: EventConsequence[] = [];
    if (damage > 0) {
        consequences.push({ kind: 'damage', amount: damage });
    }
    for (const effect of effects) {
        consequences.push({
            kind: 'flag',
            label: effect.name ?? effect.id ?? 'effect',
        });
    }
    return {
        kind: 'narrative-choice',
        variant: 'quest',
        artSlug,
        badge: 'A HAZARD',
        badgeAccentKey: 'blood',
        title: 'THE AIR TURNS',
        subtitle: '',
        body,
        choices: [
            {
                id: 'acknowledge',
                label: 'ENDURE',
                description: 'Continue',
                consequences,
                iconKey: 'eye',
                accentKey: 'blood',
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
