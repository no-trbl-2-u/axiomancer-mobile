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
import type { EventViewModel } from '@/state/presenters/event.engine';

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
            },
            {
                id: 'flee',
                label: 'FLEE',
                description: 'Luck Save',
                consequences: [],
                iconKey: 'flee',
                accentKey: 'bone',
                enabled: true,
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
            <EncounterModalOverlay vm={makeNarrativeChoiceVm()} onFight={() => {}} onFlee={() => {}} />,
        );
        // A null return from a component renders no children; the
        // root tree is `null` when the component renders nothing.
        expect(tree.toJSON()).toBeNull();
    });

    it('returns null when preludeChrome is null (defensive — should not happen post-withPreludeChrome)', () => {
        const vm = makeCombatPreludeVm({ preludeChrome: null });
        const tree = render(
            <EncounterModalOverlay vm={vm} onFight={() => {}} onFlee={() => {}} />,
        );
        expect(tree.toJSON()).toBeNull();
    });

    it('mounts the overlay on a combat-prelude VM with populated preludeChrome', () => {
        const tree = render(
            <EncounterModalOverlay vm={makeCombatPreludeVm()} onFight={() => {}} onFlee={() => {}} />,
        );
        // Two chain bars (top + bottom) carry the SEALED · NO RETREAT
        // signal — both should be present.
        const chains = tree.queryAllByTestId('encounter-modal-chain');
        expect(chains).toHaveLength(2);
        // Sash + overlay container also present.
        expect(tree.queryByTestId('encounter-modal-sash')).not.toBeNull();
        expect(tree.queryByTestId('encounter-modal-overlay')).not.toBeNull();
    });
});

describe('EncounterModalOverlay: FLEE-disabled-for-boss branch', () => {
    it('FIGHT is enabled regardless of variant', () => {
        const tree = render(
            <EncounterModalOverlay vm={makeCombatPreludeVm()} onFight={() => {}} onFlee={() => {}} />,
        );
        const fight = tree.getByTestId('encounter-modal-fight');
        expect(fight.props.accessibilityState?.disabled).not.toBe(true);
    });

    it('FLEE is enabled on a regular encounter (variant === "encounter")', () => {
        const tree = render(
            <EncounterModalOverlay vm={makeCombatPreludeVm()} onFight={() => {}} onFlee={() => {}} />,
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
                },
                {
                    id: 'flee',
                    label: 'FLEE',
                    description: 'Luck Save',
                    consequences: [],
                    iconKey: 'flee',
                    accentKey: 'bone',
                    enabled: false,
                },
            ],
        });
        const tree = render(
            <EncounterModalOverlay vm={vm} onFight={() => {}} onFlee={() => {}} />,
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
                },
            ],
        });
        const tree = render(
            <EncounterModalOverlay vm={vm} onFight={() => {}} onFlee={() => {}} />,
        );
        // The hint text from vm.preludeChrome.fleeDisabledHint
        // renders beneath the FLEE label when disabled.
        expect(tree.queryByText('no retreat from this one.')).not.toBeNull();
    });
});

describe('EncounterModalOverlay: non-dismissible backdrop (chat1 invariant)', () => {
    it('the overlay container has no onPress handler (backdrop swallows taps)', () => {
        const tree = render(
            <EncounterModalOverlay vm={makeCombatPreludeVm()} onFight={() => {}} onFlee={() => {}} />,
        );
        const overlay = tree.getByTestId('encounter-modal-overlay');
        // The pin: a future refactor that adds onPress to the overlay
        // root would silently break the "user cannot exit" invariant.
        expect(overlay.props.onPress).toBeUndefined();
    });
});
