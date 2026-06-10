/**
 * Dev-only "Trigger encounter" panel.
 *
 * One button per encounter kind the game can surface. Tapping a
 * button jumps to the WILDS (exploration) tab and fires that
 * encounter immediately — no walking onto the right node required:
 *
 *   - COMBAT   → combat-prelude over the map (`<EncounterModalOverlay>`),
 *               seeded with the LOWEST-level standard foe on the
 *               current map so the fight is the gentlest available.
 *   - BOSS     → combat-prelude with the lowest-level boss foe on
 *               the current map (KNEEL / STRIKE chrome, no flee).
 *   - HAZARD   → the hazard minigame (`actions.beginHazard()` →
 *               `<HazardGate>` routes to `/hazard`).
 *   - REST / GATHER / TREASURE / QUEST → the paced narrative card
 *               on the `/event` route (`<EventGate>` routes there).
 *
 * Mechanism: the engine's `ResolvedEvent` shapes are constructed
 * directly and dropped onto the event slice (mirrors
 * `<DebugDialogueJump>`), so each button is deterministic and
 * repeatable regardless of where the player is standing. Combat and
 * hazard run their full real flow; the four narrative kinds render
 * their event card for UI testing (engine-side rewards/healing apply
 * through normal play, not through this dev shortcut).
 *
 * Navigation happens first so paced events (`<EventGate>` pushes
 * `/event`) and the hazard route stack on top of the WILDS tab
 * rather than the other way round.
 *
 * Renders null outside dev builds. Mounts inside the DevMenu.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
    EnemiesByMap,
    consumableLibrary,
    type Enemy,
    type Item,
    type Material,
} from 'axiomancer-mechanics';

import { isDevToolsEnabled } from '@/lib/buildProfile';
import { useGameActions, useGameStore } from '@/state/GameStoreProvider';
import { EMPTY_EVENT_SLICE } from '@/state/store';
import type { NodeType } from '@/state/presenters/exploration.engine';
import { AXM, FONTS } from '@/theme/axm';

type MapKey = keyof typeof EnemiesByMap;
const DEFAULT_MAP: MapKey = 'fishing-village';

/** All encounters exposed as trigger buttons. `kind` doubles as the
 * `sourceNodeType` stamped on the event slice. */
const ENCOUNTERS: readonly { kind: NodeType; label: string }[] = [
    { kind: 'encounter', label: 'COMBAT' },
    { kind: 'boss', label: 'BOSS' },
    { kind: 'hazard', label: 'HAZARD' },
    { kind: 'rest', label: 'REST' },
    { kind: 'gather', label: 'GATHER' },
    { kind: 'treasure', label: 'TREASURE' },
    { kind: 'quest', label: 'QUEST' },
];

/** A synthetic gather material — engine 0.16 doesn't ship a Material
 * library, so we construct one inline (same shape as the gather pools). */
const SAMPLE_MATERIAL: Material = {
    id: 'dev-tide-glass',
    name: 'Tide-Glass Shard',
    description: 'A nub of sea-worn glass, pulled from the shallows for testing.',
    category: 'material',
    quantity: 1,
};

export function DebugTriggerEncounter() {
    const store = useGameStore();
    const actions = useGameActions();
    const router = useRouter();

    if (!isDevToolsEnabled()) return null;

    const currentMapKey = (): MapKey => {
        const world = store.getState().world as
            | { currentMap?: { name?: string } }
            | undefined;
        const name = world?.currentMap?.name;
        return name && name in EnemiesByMap ? (name as MapKey) : DEFAULT_MAP;
    };

    /** Lowest-level foe on the map matching `predicate`, ties broken by
     * lowest health. Returns null if nothing matches. */
    const lowestFoe = (predicate: (e: Enemy) => boolean): Enemy | null => {
        const roster = EnemiesByMap[currentMapKey()].filter(predicate);
        if (roster.length === 0) return null;
        return [...roster].sort(
            (a, b) => a.level - b.level || a.health - b.health,
        )[0];
    };

    const setPending = (event: unknown, sourceNodeType: NodeType) => {
        store.setState({
            event: {
                ...EMPTY_EVENT_SLICE,
                pending: { state: store.getState(), event } as never,
                sourceNodeType,
            },
        });
    };

    const fire = (kind: NodeType) => {
        switch (kind) {
            case 'encounter': {
                // Lowest-level standard foe — bosses + uniques excluded.
                const enemy = lowestFoe(
                    (e) => e.difficulty !== 'boss' && e.difficulty !== 'unique',
                );
                if (!enemy) return;
                setPending(
                    {
                        kind: 'encounter',
                        encounter: { enemies: [enemy], origin: 'dev:trigger-encounter' },
                        isBoss: false,
                    },
                    'encounter',
                );
                return;
            }
            case 'boss': {
                // Lowest-level boss foe; fall back to the gentlest foe if
                // the map somehow has no boss-tier entry.
                const enemy =
                    lowestFoe((e) => e.difficulty === 'boss') ?? lowestFoe(() => true);
                if (!enemy) return;
                setPending(
                    {
                        kind: 'encounter',
                        encounter: { enemies: [enemy], origin: 'dev:trigger-boss' },
                        isBoss: true,
                    },
                    'boss',
                );
                return;
            }
            case 'hazard':
                // The real minigame. <HazardGate> observes the slice and
                // pushes /hazard.
                actions.beginHazard();
                return;
            case 'rest':
                setPending({ kind: 'rest', healed: 10 }, 'rest');
                return;
            case 'gather':
                setPending({ kind: 'gathering', items: [SAMPLE_MATERIAL] }, 'gather');
                return;
            case 'treasure': {
                const loot: Item[] = consumableLibrary[0] ? [consumableLibrary[0]] : [];
                setPending({ kind: 'loot-cache', items: loot, currency: 25 }, 'treasure');
                return;
            }
            case 'quest':
                setPending(
                    { kind: 'interaction', npcName: 'wandering-pilgrim' },
                    'quest',
                );
                return;
            default:
                return;
        }
    };

    const onPress = (kind: NodeType) => {
        // Jump to WILDS first so paced-event (/event) and hazard
        // (/hazard) routes stack on top of the world tab.
        router.push('/(tabs)/exploration');
        fire(kind);
    };

    return (
        <View style={styles.root}>
            <View style={styles.labelRow}>
                <Text style={styles.label}>DEBUG · TRIGGER ENCOUNTER</Text>
                <Text style={styles.sub}>jump to WILDS + fire it</Text>
            </View>
            <View style={styles.buttonGroup}>
                {ENCOUNTERS.map((entry) => (
                    <Pressable
                        key={entry.kind}
                        style={styles.button}
                        onPress={() => onPress(entry.kind)}
                        accessibilityRole="button"
                        accessibilityLabel={`Trigger ${entry.label.toLowerCase()} encounter on the world tab`}
                        testID={`debug-trigger-encounter-${entry.kind}`}
                    >
                        <Text style={styles.buttonLabel}>{entry.label}</Text>
                    </Pressable>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        marginTop: 8,
        marginHorizontal: 12,
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: AXM.ash,
        borderStyle: 'dashed',
        backgroundColor: AXM.panelBg,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 6,
    },
    label: {
        fontFamily: FONTS.mono,
        fontSize: 9,
        letterSpacing: 1.5,
        color: AXM.bone,
    },
    sub: {
        fontFamily: FONTS.mono,
        fontSize: 10,
        color: AXM.parchment,
    },
    buttonGroup: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    button: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: AXM.rust,
        backgroundColor: AXM.bg,
    },
    buttonLabel: {
        fontFamily: FONTS.gothic,
        fontSize: 11,
        color: AXM.rust,
        letterSpacing: 1,
    },
});
