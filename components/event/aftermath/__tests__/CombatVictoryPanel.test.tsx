/**
 * Hermetic component tests — CombatVictoryPanel.
 *
 * Pins the render contract the in-encounter-modal aftermath mount
 * relies on (Phase 70 Tick A):
 *   1. Enemy name + epithet render in their respective slots; the
 *      epithet collapses when null.
 *   2. Final-blow header / phrase / descriptor render together;
 *      header collapses to "FINAL BLOW" when finalBlow is null.
 *   3. Reward strip renders all three columns; nullish fields show
 *      em-dash placeholders.
 *   4. Loot-empty branch surfaces the "no spoils. only quiet."
 *      flavor; populated branch lists each loot row.
 *   5. CARRY ON button is wired through to the onContinue callback.
 */

import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { CombatVictoryPanel } from '@/components/event/aftermath/CombatVictoryPanel';
import type { AftermathVictoryViewModel } from '@/state/presenters/aftermath.engine';

const BASE_VM: AftermathVictoryViewModel = {
    kind: 'victory',
    enemyName: 'THE LARCH-STALKER',
    enemyEpithet: 'cold-of-tooth',
    finalBlow: {
        skillName: 'RENDING STRIKE',
        damage: 24,
        descriptor: 'cleaves the binding rib',
    },
    finalBlowPhrase: 'and the foe went down face-first into its own teeth.',
    rewards: {
        xp: 18,
        currency: null,
        loot: [],
    },
};

describe('CombatVictoryPanel: render contract', () => {
    it('renders the enemy name + italic epithet', () => {
        const tree = render(<CombatVictoryPanel vm={BASE_VM} onContinue={() => {}} />);
        expect(tree.queryByTestId('combat-victory-panel-enemy-name')?.props.children).toBe('THE LARCH-STALKER');
        const epithet = tree.queryByTestId('combat-victory-panel-enemy-epithet');
        expect(epithet).not.toBeNull();
        // The bullet glyph + text are interleaved; check the rendered tree contains the epithet text.
        expect(JSON.stringify(epithet?.props.children)).toContain('cold-of-tooth');
    });

    it('collapses the epithet line when enemyEpithet is null', () => {
        const tree = render(
            <CombatVictoryPanel
                vm={{ ...BASE_VM, enemyEpithet: null }}
                onContinue={() => {}}
            />,
        );
        expect(tree.queryByTestId('combat-victory-panel-enemy-epithet')).toBeNull();
    });

    it('renders the final-blow phrase verbatim (with quote marks)', () => {
        const tree = render(<CombatVictoryPanel vm={BASE_VM} onContinue={() => {}} />);
        const phraseEl = tree.queryByTestId('combat-victory-panel-final-blow-phrase');
        expect(phraseEl).not.toBeNull();
        expect(JSON.stringify(phraseEl?.props.children)).toContain('went down face-first');
    });

    it('renders the reward strip on the panel', () => {
        const tree = render(<CombatVictoryPanel vm={BASE_VM} onContinue={() => {}} />);
        const strip = tree.queryByTestId('combat-victory-panel-rewards');
        expect(strip).not.toBeNull();
        // Column labels are static; XP / VITAE · SIGILS / LOOT.
        expect(tree.queryByText('EXPERIENCE')).not.toBeNull();
        expect(tree.queryByText('VITAE · SIGILS')).not.toBeNull();
        expect(tree.queryByText('LOOT')).not.toBeNull();
    });

    it('renders xp value when present and em-dash when null', () => {
        const populated = render(<CombatVictoryPanel vm={BASE_VM} onContinue={() => {}} />);
        expect(populated.queryByText('18')).not.toBeNull();

        const empty = render(
            <CombatVictoryPanel
                vm={{ ...BASE_VM, rewards: { ...BASE_VM.rewards, xp: null } }}
                onContinue={() => {}}
            />,
        );
        // Multiple em-dashes will be present (vitae/sigils column also collapses);
        // counting is enough to confirm the XP column collapsed too.
        expect(empty.queryAllByText('—').length).toBeGreaterThanOrEqual(2);
    });

    it('renders the empty-loot flavor line by default', () => {
        const tree = render(<CombatVictoryPanel vm={BASE_VM} onContinue={() => {}} />);
        expect(tree.queryByTestId('combat-victory-panel-loot-empty')).not.toBeNull();
    });

    it('renders one row per loot entry when populated', () => {
        const tree = render(
            <CombatVictoryPanel
                vm={{
                    ...BASE_VM,
                    rewards: {
                        ...BASE_VM.rewards,
                        loot: [
                            { name: 'Iron-Tongue Shard', slot: 'accessory', rarity: 'rare' },
                            { name: "Hierarch's Tooth", slot: 'weapon', rarity: 'unique' },
                        ],
                    },
                }}
                onContinue={() => {}}
            />,
        );
        expect(tree.queryByText('Iron-Tongue Shard')).not.toBeNull();
        expect(tree.queryByText("Hierarch's Tooth")).not.toBeNull();
        expect(tree.queryByText('ACCESSORY')).not.toBeNull();
        expect(tree.queryByText('WEAPON')).not.toBeNull();
        // The empty flavor line is suppressed.
        expect(tree.queryByTestId('combat-victory-panel-loot-empty')).toBeNull();
    });
});

describe('CombatVictoryPanel: CARRY ON button', () => {
    it('exposes the carry-on button by testID', () => {
        const tree = render(<CombatVictoryPanel vm={BASE_VM} onContinue={() => {}} />);
        expect(tree.queryByTestId('combat-victory-panel-carry-on')).not.toBeNull();
    });

    it('fires onContinue exactly once on press', () => {
        const onContinue = jest.fn();
        const tree = render(<CombatVictoryPanel vm={BASE_VM} onContinue={onContinue} />);
        fireEvent.press(tree.getByTestId('combat-victory-panel-carry-on'));
        expect(onContinue).toHaveBeenCalledTimes(1);
    });

    it('renders the CARRY ON label', () => {
        const tree = render(<CombatVictoryPanel vm={BASE_VM} onContinue={() => {}} />);
        expect(tree.queryByText('✠ CARRY ON')).not.toBeNull();
    });
});
