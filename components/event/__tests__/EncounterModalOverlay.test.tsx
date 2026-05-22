/**
 * Hermetic component tests — EncounterModalOverlay surface.
 *
 * Pins the contracts the screen depends on for the
 * encounter-modal-over-map seam (Phase 32 sub-tick D port,
 * `components/event/EncounterModalOverlay.tsx`, commit `7dab20c`).
 * The presenter-layer pin lives in
 * `state/e2e/exploration.engine.test.ts: encounter-modal seam`;
 * this file covers the component-level branches the screen
 * relies on:
 *
 *   1. Returns null on non-combat-prelude VMs (so a paced /
 *      narrative-choice event never accidentally mounts the
 *      overlay).
 *   2. FLEE is disabled when the event VM's flee choice is
 *      `enabled: false` (boss encounters per chat1's
 *      "no retreat from a boss" intent).
 *   3. Backdrop has no `onPress` handler — non-dismissibility
 *      is the diegetic SEALED · NO RETREAT contract (chat1:
 *      "user cannot exit these modals").
 *
 * Hermetic = self-contained + deterministic + isolated.
 * See docs/testing.md.
 */

import { afterEach, describe, it, expect, jest } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';

import { EncounterModalOverlay } from '../EncounterModalOverlay';
import { AestheticModeProvider, type AestheticMode } from '@/state/aesthetic-mode';
import { CombatModeProvider } from '@/state/combat-mode';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { createAppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';
import type { EventViewModel } from '@/state/presenters/event.engine';

// Phase 64 follow-up: overlay now reads `useGameState((s) => s.combat?.phase)`
// for the auto-scroll-on-phase-change effect, so it requires
// GameStoreProvider even for prelude-mode mount tests.
// Phase 70 Tick A follow-up: overlay also reads `useCombatMode()` to
// watch `lastOutcome` / `aftermathData` for the in-modal aftermath
// swap. Tests now mount inside <CombatModeProvider> too.
function withAesthetic(child: React.ReactNode, mode: AestheticMode = 'canonical') {
    const store = createAppStore({ adapter: createMemoryAdapter() });
    return (
        <AestheticModeProvider initialMode={mode} skipHydration>
            <GameStoreProvider store={store}>
                <CombatModeProvider>{child}</CombatModeProvider>
            </GameStoreProvider>
        </AestheticModeProvider>
    );
}

afterEach(() => {
    jest.restoreAllMocks();
});

function makeCombatPreludeVm(overrides: Partial<EventViewModel> = {}): EventViewModel {
    return {
        kind: 'combat-prelude',
        variant: 'encounter',
        artSlug: 'encounter',
        badge: 'ENCOUNTER',
        badgeAccentKey: 'blood',
        title: 'CAIRN-ROT',
        subtitle: 'something stirs',
        body: 'level 1 · 10 hp.',
        choices: [
            {
                id: 'fight',
                label: 'FIGHT',
                description: 'Combat · turns',
                consequences: [],
                iconKey: 'sword',
                accentKey: 'blood',
                enabled: true,
                subtitle: null,
            },
            {
                id: 'flee',
                label: 'FLEE',
                description: 'Luck Save',
                consequences: [],
                iconKey: 'flee',
                accentKey: 'bone',
                enabled: true,
                subtitle: null,
            },
        ],
        lore: null,
        canSkip: false,
        preludeChrome: {
            eyebrow: 'ENCOUNTER',
            sashLabel: 'STRIFE STIRS',
            sealLabel: 'SEALED · NO RETREAT',
            fleeDisabledHint: 'no retreat from this one.',
        },
        chrome: {
            reckoningEyebrow: '✠ A RECKONING',
            skipLabel: 'SKIP ›',
            emptyBackLabel: 'BACK',
            emptyBackSub: 'RETURN',
        },
        ...overrides,
    };
}

function makeNarrativeChoiceVm(): EventViewModel {
    return makeCombatPreludeVm({
        kind: 'narrative-choice',
        variant: 'rest',
        artSlug: 'rest',
        preludeChrome: null,
    });
}

describe('EncounterModalOverlay: mount conditions', () => {
    it('returns null when the VM is narrative-choice (paced event, not combat-prelude)', () => {
        const tree = render(
            withAesthetic(<EncounterModalOverlay vm={makeNarrativeChoiceVm()} onFight={() => {}} onFlee={() => {}} />),
        );
        // A null return from a component renders no children; the
        // root tree is `null` when the component renders nothing.
        expect(tree.toJSON()).toBeNull();
    });

    it('returns null when preludeChrome is null (defensive — should not happen post-withPreludeChrome)', () => {
        const vm = makeCombatPreludeVm({ preludeChrome: null });
        const tree = render(
            withAesthetic(<EncounterModalOverlay vm={vm} onFight={() => {}} onFlee={() => {}} />),
        );
        expect(tree.toJSON()).toBeNull();
    });

    it('mounts the overlay on a combat-prelude VM with populated preludeChrome', () => {
        const tree = render(
            withAesthetic(<EncounterModalOverlay vm={makeCombatPreludeVm()} onFight={() => {}} onFlee={() => {}} />),
        );
        // Two chain bars (top + bottom) carry the SEALED · NO RETREAT
        // signal — both should be present.
        const chains = tree.queryAllByTestId('encounter-modal-chain');
        expect(chains).toHaveLength(2);
        // Sash + overlay container also present.
        expect(tree.queryByTestId('encounter-modal-sash')).not.toBeNull();
        expect(tree.queryByTestId('encounter-modal-overlay')).not.toBeNull();
    });

    it('mounts the codex header when aesthetic mode is codex (Phase 50 tick C)', () => {
        const tree = render(
            withAesthetic(
                <EncounterModalOverlay vm={makeCombatPreludeVm()} onFight={() => {}} onFlee={() => {}} />,
                'codex',
            ),
        );
        // Tokens come from selectEventCodexHeader — variant=encounter,
        // kind=combat-prelude → EVENT/ENCOUNTER, KIND/COMBAT.PRELUDE.
        expect(tree.queryByText('EVENT/ENCOUNTER')).not.toBeNull();
        expect(tree.queryByText('KIND/COMBAT.PRELUDE')).not.toBeNull();
    });

    it('omits the codex header in canonical mode', () => {
        const tree = render(
            withAesthetic(
                <EncounterModalOverlay vm={makeCombatPreludeVm()} onFight={() => {}} onFlee={() => {}} />,
                'canonical',
            ),
        );
        expect(tree.queryByText('EVENT/ENCOUNTER')).toBeNull();
        expect(tree.queryByText('KIND/COMBAT.PRELUDE')).toBeNull();
    });
});

describe('EncounterModalOverlay: FLEE-disabled-for-boss branch', () => {
    it('FIGHT is enabled regardless of variant', () => {
        const tree = render(
            withAesthetic(<EncounterModalOverlay vm={makeCombatPreludeVm()} onFight={() => {}} onFlee={() => {}} />),
        );
        const fight = tree.getByTestId('encounter-modal-fight');
        expect(fight.props.accessibilityState?.disabled).not.toBe(true);
    });

    it('FLEE is enabled on a regular encounter (variant === "encounter")', () => {
        const tree = render(
            withAesthetic(<EncounterModalOverlay vm={makeCombatPreludeVm()} onFight={() => {}} onFlee={() => {}} />),
        );
        const flee = tree.getByTestId('encounter-modal-flee');
        expect(flee.props.accessibilityState?.disabled).not.toBe(true);
    });

    it('FLEE is disabled when the VM flee choice has enabled: false', () => {
        const vm = makeCombatPreludeVm({
            variant: 'boss',
            choices: [
                {
                    id: 'fight',
                    label: 'FIGHT',
                    description: 'Combat · BOSS',
                    consequences: [],
                    iconKey: 'sword',
                    accentKey: 'blood',
                    enabled: true,
                    subtitle: null,
                },
                {
                    id: 'flee',
                    label: 'FLEE',
                    description: 'Luck Save',
                    consequences: [],
                    iconKey: 'flee',
                    accentKey: 'bone',
                    enabled: false,
                    subtitle: null,
                },
            ],
        });
        const tree = render(
            withAesthetic(<EncounterModalOverlay vm={vm} onFight={() => {}} onFlee={() => {}} />),
        );
        const flee = tree.getByTestId('encounter-modal-flee');
        expect(flee.props.accessibilityState?.disabled).toBe(true);
    });

    it('FLEE shows the disabled-hint caption from vm.preludeChrome when disabled', () => {
        const vm = makeCombatPreludeVm({
            variant: 'boss',
            choices: [
                ...makeCombatPreludeVm().choices.slice(0, 1),
                {
                    id: 'flee',
                    label: 'FLEE',
                    description: 'Luck Save',
                    consequences: [],
                    iconKey: 'flee',
                    accentKey: 'bone',
                    enabled: false,
                    subtitle: null,
                },
            ],
        });
        const tree = render(
            withAesthetic(<EncounterModalOverlay vm={vm} onFight={() => {}} onFlee={() => {}} />),
        );
        // The hint text from vm.preludeChrome.fleeDisabledHint
        // renders beneath the FLEE label when disabled.
        expect(tree.queryByText('no retreat from this one.')).not.toBeNull();
    });
});

describe('EncounterModalOverlay: non-dismissible backdrop (chat1 invariant)', () => {
    it('the overlay container has no onPress handler (backdrop swallows taps)', () => {
        const tree = render(
            withAesthetic(<EncounterModalOverlay vm={makeCombatPreludeVm()} onFight={() => {}} onFlee={() => {}} />),
        );
        const overlay = tree.getByTestId('encounter-modal-overlay');
        // The pin: a future refactor that adds onPress to the overlay
        // root would silently break the "user cannot exit" invariant.
        expect(overlay.props.onPress).toBeUndefined();
    });
});

// ---------------------------------------------------------------------------
// Phase 63b — mode state machine (prelude → combat in-place)
// ---------------------------------------------------------------------------

describe('EncounterModalOverlay: prelude → combat mode transition', () => {
    function withAllProviders(child: React.ReactNode) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { GameStoreProvider } = require('@/state/GameStoreProvider');
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { createAppStore } = require('@/state/store');
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { createMemoryAdapter } = require('@/test-utils/memoryAdapter');
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { CombatModeProvider } = require('@/state/combat-mode');
        const store = createAppStore({ adapter: createMemoryAdapter() });
        return (
            <AestheticModeProvider initialMode="canonical" skipHydration>
                <CombatModeProvider>
                    <GameStoreProvider store={store}>
                        {child}
                    </GameStoreProvider>
                </CombatModeProvider>
            </AestheticModeProvider>
        );
    }

    it('mounts the prelude content by default (FIGHT button visible)', () => {
        const tree = render(
            withAllProviders(
                <EncounterModalOverlay vm={makeCombatPreludeVm()} onFight={() => {}} onFlee={() => {}} />,
            ),
        );
        expect(tree.queryByTestId('encounter-modal-fight')).not.toBeNull();
        expect(tree.queryByTestId('encounter-modal-combat-mode')).toBeNull();
    });

    it('transitions to combat mode after FIGHT is pressed', () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { fireEvent } = require('@testing-library/react-native');
        const tree = render(
            withAllProviders(
                <EncounterModalOverlay vm={makeCombatPreludeVm()} onFight={() => {}} onFlee={() => {}} />,
            ),
        );
        fireEvent.press(tree.getByTestId('encounter-modal-fight'));

        // Prelude content is gone; combat mode scroll wrap is mounted.
        expect(tree.queryByTestId('encounter-modal-fight')).toBeNull();
        expect(tree.queryByTestId('encounter-modal-combat-mode')).not.toBeNull();
    });

    it('still calls the onFight callback when FIGHT is pressed', () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { fireEvent } = require('@testing-library/react-native');
        const onFight = jest.fn();
        const tree = render(
            withAllProviders(
                <EncounterModalOverlay vm={makeCombatPreludeVm()} onFight={onFight} onFlee={() => {}} />,
            ),
        );
        fireEvent.press(tree.getByTestId('encounter-modal-fight'));
        expect(onFight).toHaveBeenCalledTimes(1);
    });
});

// ---------------------------------------------------------------------------
// Phase 63c follow-up — modal stays mounted after engine clears the event
// slice (the regression user surfaced 2026-05-21).
// ---------------------------------------------------------------------------

describe('EncounterModalOverlay: combat mode survives vm.kind change', () => {
    function withAllProviders(child: React.ReactNode) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { GameStoreProvider } = require('@/state/GameStoreProvider');
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { createAppStore } = require('@/state/store');
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { createMemoryAdapter } = require('@/test-utils/memoryAdapter');
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { CombatModeProvider } = require('@/state/combat-mode');
        const store = createAppStore({ adapter: createMemoryAdapter() });
        return (
            <AestheticModeProvider initialMode="canonical" skipHydration>
                <CombatModeProvider>
                    <GameStoreProvider store={store}>
                        {child}
                    </GameStoreProvider>
                </CombatModeProvider>
            </AestheticModeProvider>
        );
    }

    it('combat mode stays mounted even when vm.kind flips to "none" mid-encounter', () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { fireEvent, render: localRender } = require('@testing-library/react-native');
        // Initial vm is combat-prelude; user taps FIGHT; on the next
        // render the parent (exploration) passes a non-prelude vm
        // because pickEventChoice('fight') clears the event slice.
        // The overlay must NOT return null in this state — the user-
        // facing regression "combat modal disappears when I tap FIGHT".
        const initialVm = makeCombatPreludeVm();
        const { rerender, queryByTestId } = localRender(
            withAllProviders(
                <EncounterModalOverlay vm={initialVm} onFight={() => {}} onFlee={() => {}} />,
            ),
        );
        fireEvent.press(queryByTestId('encounter-modal-fight'));
        expect(queryByTestId('encounter-modal-combat-mode')).not.toBeNull();

        // Now simulate the parent re-rendering with a cleared event slice
        // (vm.kind flips to a non-prelude shape — what selectEventViewModel
        // returns when state.event.pending is null).
        const clearedVm: EventViewModel = {
            ...initialVm,
            kind: 'narrative-choice',
            preludeChrome: null,
        };
        rerender(
            withAllProviders(
                <EncounterModalOverlay vm={clearedVm} onFight={() => {}} onFlee={() => {}} />,
            ),
        );

        // Pre-fix this would unmount (vm.kind !== 'combat-prelude' →
        // early-return null). Post-fix: combat mode stays mounted.
        expect(queryByTestId('encounter-modal-overlay')).not.toBeNull();
        expect(queryByTestId('encounter-modal-combat-mode')).not.toBeNull();
    });
});

// ---------------------------------------------------------------------------
// Phase 70 Tick A — combat → aftermath transition inside the modal
// ---------------------------------------------------------------------------

describe('EncounterModalOverlay: combat → aftermath swap', () => {
    function withAllProvidersAndOutcome(child: React.ReactNode) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { GameStoreProvider } = require('@/state/GameStoreProvider');
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { createAppStore } = require('@/state/store');
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { createMemoryAdapter } = require('@/test-utils/memoryAdapter');
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const {
            CombatModeProvider,
            useCombatMode,
        } = require('@/state/combat-mode') as typeof import('@/state/combat-mode');
        const store = createAppStore({ adapter: createMemoryAdapter() });
        // Helper component that fires the victory outcome after mount,
        // so the modal advances from combat → aftermath inside one
        // render cycle.
        function VictoryTrigger() {
            const { exitCombatWith } = useCombatMode();
            React.useEffect(() => {
                exitCombatWith('victory', {
                    variant: 'victory',
                    enemy: {
                        name: 'Larch-Stalker',
                        description: 'A figure long since gnawed.',
                        level: 3,
                    },
                    finalBlow: { skillName: 'STRIKE', damage: 24, descriptor: 'cleaves the rib' },
                    xpReward: 18,
                });
            }, [exitCombatWith]);
            return null;
        }
        return (
            <AestheticModeProvider initialMode="canonical" skipHydration>
                <CombatModeProvider>
                    <GameStoreProvider store={store}>
                        {child}
                        <VictoryTrigger />
                    </GameStoreProvider>
                </CombatModeProvider>
            </AestheticModeProvider>
        );
    }

    it('swaps to <CombatVictoryPanel> when lastOutcome flips to victory mid-combat', () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { fireEvent } = require('@testing-library/react-native');
        const tree = render(
            withAllProvidersAndOutcome(
                <EncounterModalOverlay
                    vm={makeCombatPreludeVm()}
                    onFight={() => {}}
                    onFlee={() => {}}
                />,
            ),
        );
        // Tap FIGHT to enter combat mode first; the VictoryTrigger
        // effect then fires exitCombatWith('victory', snapshot),
        // which the overlay watches via useEffect.
        fireEvent.press(tree.getByTestId('encounter-modal-fight'));

        // Aftermath panel mounted; combat ScrollView gone.
        expect(tree.queryByTestId('combat-victory-panel')).not.toBeNull();
        expect(tree.queryByTestId('encounter-modal-combat-mode')).toBeNull();

        // The enemy name was sourced from the snapshot, not the (now-null) combat slice.
        expect(tree.queryByTestId('combat-victory-panel-enemy-name')?.props.children).toBe(
            'LARCH-STALKER',
        );
    });

    it('CARRY ON dismisses the aftermath and unmounts the panel', () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { fireEvent } = require('@testing-library/react-native');
        const tree = render(
            withAllProvidersAndOutcome(
                <EncounterModalOverlay
                    vm={makeCombatPreludeVm()}
                    onFight={() => {}}
                    onFlee={() => {}}
                />,
            ),
        );
        fireEvent.press(tree.getByTestId('encounter-modal-fight'));
        expect(tree.queryByTestId('combat-victory-panel')).not.toBeNull();

        // Press CARRY ON; dismissAftermath fires, lastOutcome clears,
        // aftermathData clears, modal-mode collapses back to combat
        // (the aftermath useEffect won't re-flip without aftermathData).
        fireEvent.press(tree.getByTestId('combat-victory-panel-carry-on'));
        expect(tree.queryByTestId('combat-victory-panel')).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// Phase 70 Tick B — parley swap
// ---------------------------------------------------------------------------

describe('EncounterModalOverlay: combat → aftermath swap (parley)', () => {
    function withParleyOutcome(child: React.ReactNode) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { GameStoreProvider } = require('@/state/GameStoreProvider');
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { createAppStore } = require('@/state/store');
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { createMemoryAdapter } = require('@/test-utils/memoryAdapter');
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const {
            CombatModeProvider,
            useCombatMode,
        } = require('@/state/combat-mode') as typeof import('@/state/combat-mode');
        const store = createAppStore({ adapter: createMemoryAdapter() });
        function ParleyTrigger() {
            const { exitCombatWith } = useCombatMode();
            React.useEffect(() => {
                exitCombatWith('parley', {
                    variant: 'parley',
                    enemy: {
                        name: 'Larch-Stalker',
                        description: 'A figure long since gnawed.',
                        level: 4,
                    },
                    xpReward: 12,
                    journalEntry: null,
                });
            }, [exitCombatWith]);
            return null;
        }
        return (
            <AestheticModeProvider initialMode="canonical" skipHydration>
                <CombatModeProvider>
                    <GameStoreProvider store={store}>
                        {child}
                        <ParleyTrigger />
                    </GameStoreProvider>
                </CombatModeProvider>
            </AestheticModeProvider>
        );
    }

    it('swaps to <CombatFriendshipPanel> when lastOutcome flips to parley', () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { fireEvent } = require('@testing-library/react-native');
        const tree = render(
            withParleyOutcome(
                <EncounterModalOverlay
                    vm={makeCombatPreludeVm()}
                    onFight={() => {}}
                    onFlee={() => {}}
                />,
            ),
        );
        fireEvent.press(tree.getByTestId('encounter-modal-fight'));

        expect(tree.queryByTestId('combat-friendship-panel')).not.toBeNull();
        // Victory panel must NOT mount for the parley path.
        expect(tree.queryByTestId('combat-victory-panel')).toBeNull();
        // The pixel emblem (the lone carve-out) is present.
        expect(tree.queryByTestId('pixel-emblem')).not.toBeNull();
    });

    it('PART AS FRIENDS dismisses the aftermath', () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { fireEvent } = require('@testing-library/react-native');
        const tree = render(
            withParleyOutcome(
                <EncounterModalOverlay
                    vm={makeCombatPreludeVm()}
                    onFight={() => {}}
                    onFlee={() => {}}
                />,
            ),
        );
        fireEvent.press(tree.getByTestId('encounter-modal-fight'));
        expect(tree.queryByTestId('combat-friendship-panel')).not.toBeNull();

        fireEvent.press(tree.getByTestId('combat-friendship-panel-part-as-friends'));
        expect(tree.queryByTestId('combat-friendship-panel')).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// Phase 70 Tick C — defeat swap
// ---------------------------------------------------------------------------

describe('EncounterModalOverlay: combat → aftermath swap (defeat)', () => {
    function withDefeatOutcome(child: React.ReactNode) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { GameStoreProvider } = require('@/state/GameStoreProvider');
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { createAppStore } = require('@/state/store');
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { createMemoryAdapter } = require('@/test-utils/memoryAdapter');
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const {
            CombatModeProvider,
            useCombatMode,
        } = require('@/state/combat-mode') as typeof import('@/state/combat-mode');
        const store = createAppStore({ adapter: createMemoryAdapter() });
        function DefeatTrigger() {
            const { exitCombatWith } = useCombatMode();
            React.useEffect(() => {
                exitCombatWith('defeat', {
                    variant: 'defeat',
                    enemy: {
                        name: 'Hierophant',
                        description: 'A figure long since gnawed.',
                        level: 7,
                    },
                    characterName: 'Worm-Eaten Pilgrim',
                    finalBlow: { skillName: 'AXE-FALL', damage: 28, descriptor: 'cleaves the rib' },
                    runSummary: { roundsEndured: 4, encountersFaced: 12, deepestNodeId: 'iii.b' },
                });
            }, [exitCombatWith]);
            return null;
        }
        return (
            <AestheticModeProvider initialMode="canonical" skipHydration>
                <CombatModeProvider>
                    <GameStoreProvider store={store}>
                        {child}
                        <DefeatTrigger />
                    </GameStoreProvider>
                </CombatModeProvider>
            </AestheticModeProvider>
        );
    }

    it('swaps to <CombatDefeatPanel> when lastOutcome flips to defeat', () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { fireEvent } = require('@testing-library/react-native');
        const tree = render(
            withDefeatOutcome(
                <EncounterModalOverlay
                    vm={makeCombatPreludeVm()}
                    onFight={() => {}}
                    onFlee={() => {}}
                />,
            ),
        );
        fireEvent.press(tree.getByTestId('encounter-modal-fight'));

        expect(tree.queryByTestId('combat-defeat-panel')).not.toBeNull();
        expect(tree.queryByTestId('combat-victory-panel')).toBeNull();
        expect(tree.queryByTestId('combat-friendship-panel')).toBeNull();
    });

    it('let-the-page-close dismisses the panel', () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { fireEvent } = require('@testing-library/react-native');
        const tree = render(
            withDefeatOutcome(
                <EncounterModalOverlay
                    vm={makeCombatPreludeVm()}
                    onFight={() => {}}
                    onFlee={() => {}}
                />,
            ),
        );
        fireEvent.press(tree.getByTestId('encounter-modal-fight'));
        expect(tree.queryByTestId('combat-defeat-panel')).not.toBeNull();

        fireEvent.press(tree.getByTestId('combat-defeat-panel-let-close'));
        expect(tree.queryByTestId('combat-defeat-panel')).toBeNull();
    });

    it('BEGIN AGAIN dismisses the panel', () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { fireEvent } = require('@testing-library/react-native');
        const tree = render(
            withDefeatOutcome(
                <EncounterModalOverlay
                    vm={makeCombatPreludeVm()}
                    onFight={() => {}}
                    onFlee={() => {}}
                />,
            ),
        );
        fireEvent.press(tree.getByTestId('encounter-modal-fight'));
        expect(tree.queryByTestId('combat-defeat-panel')).not.toBeNull();

        fireEvent.press(tree.getByTestId('combat-defeat-panel-begin-again'));
        expect(tree.queryByTestId('combat-defeat-panel')).toBeNull();
    });
});
