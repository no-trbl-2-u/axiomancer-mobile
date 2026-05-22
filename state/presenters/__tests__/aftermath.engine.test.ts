/**
 * Phase 70 Tick A — aftermath presenter pins.
 *
 * Hermetic; presenter is a pure function on `AftermathData`, so no
 * store / provider scaffolding is needed.
 */

import { describe, expect, it } from '@jest/globals';

import { selectAftermathViewModel } from '@/state/presenters/aftermath.engine';
import type { AftermathData } from '@/state/combat-mode';

const VICTORY_SNAPSHOT: Extract<AftermathData, { variant: 'victory' }> = {
    variant: 'victory',
    enemy: {
        name: 'Larch-Stalker',
        description: 'A figure long since gnawed by the road.',
        level: 4,
    },
    finalBlow: { skillName: 'RENDING STRIKE', damage: 24, descriptor: 'cleaves the binding rib' },
    xpReward: 18,
};

describe('selectAftermathViewModel', () => {
    it('returns null when data is null', () => {
        expect(selectAftermathViewModel(null)).toBeNull();
    });

    // Defeat branch now ships in Tick C — see the dedicated describe
    // block at the bottom of this file. The Tick A "returns null on
    // defeat" pin was retired with the Tick C swap.

    it('uppercases the enemy name for the gothic title slot', () => {
        const vm = selectAftermathViewModel(VICTORY_SNAPSHOT);
        expect(vm?.kind).toBe('victory');
        expect(vm?.kind === 'victory' && vm.enemyName).toBe('LARCH-STALKER');
    });

    it('derives the epithet by stripping the leading article + period', () => {
        const vm = selectAftermathViewModel(VICTORY_SNAPSHOT);
        expect(vm?.kind === 'victory' && vm.enemyEpithet).toBe('figure long since gnawed by the road');
    });

    it('returns null epithet when description is empty', () => {
        const vm = selectAftermathViewModel({
            ...VICTORY_SNAPSHOT,
            enemy: { ...VICTORY_SNAPSHOT.enemy, description: '' },
        });
        expect(vm?.kind === 'victory' && vm.enemyEpithet).toBeNull();
    });

    it('truncates long descriptions at a word boundary <= 40 chars', () => {
        const longDesc =
            'A figure long since gnawed by the road past any hope of recognition.';
        const vm = selectAftermathViewModel({
            ...VICTORY_SNAPSHOT,
            enemy: { ...VICTORY_SNAPSHOT.enemy, description: longDesc },
        });
        const epithet = vm?.kind === 'victory' ? vm.enemyEpithet : '';
        expect(epithet?.length).toBeLessThanOrEqual(40);
        // Must end on a word boundary, not mid-word.
        expect(epithet?.endsWith(' ')).toBe(false);
    });

    it('passes through final-blow data with fallbacks', () => {
        const vm = selectAftermathViewModel(VICTORY_SNAPSHOT);
        expect(vm?.kind === 'victory' && vm.finalBlow).toEqual({
            skillName: 'RENDING STRIKE',
            damage: 24,
            descriptor: 'cleaves the binding rib',
        });
    });

    it('uses STRIKE / felled-the-foe fallbacks when finalBlow fields are nullish', () => {
        const vm = selectAftermathViewModel({
            ...VICTORY_SNAPSHOT,
            finalBlow: { skillName: null, damage: 7, descriptor: null },
        });
        expect(vm?.kind === 'victory' && vm.finalBlow).toEqual({
            skillName: 'STRIKE',
            damage: 7,
            descriptor: 'felled the foe',
        });
    });

    it('returns null finalBlow when snapshot has no final blow', () => {
        const vm = selectAftermathViewModel({
            ...VICTORY_SNAPSHOT,
            finalBlow: null,
        });
        expect(vm?.kind === 'victory' && vm.finalBlow).toBeNull();
    });

    it('picks the brutal phrase for damage >= 20', () => {
        const vm = selectAftermathViewModel(VICTORY_SNAPSHOT);
        expect(vm?.kind === 'victory' && vm.finalBlowPhrase).toContain('went down face-first');
    });

    it('picks the quiet phrase for damage in [10, 20)', () => {
        const vm = selectAftermathViewModel({
            ...VICTORY_SNAPSHOT,
            finalBlow: { skillName: 'STRIKE', damage: 12, descriptor: 'd' },
        });
        expect(vm?.kind === 'victory' && vm.finalBlowPhrase).toContain('wet rag folds');
    });

    it('picks the ironic phrase for damage < 10', () => {
        const vm = selectAftermathViewModel({
            ...VICTORY_SNAPSHOT,
            finalBlow: { skillName: 'STRIKE', damage: 5, descriptor: 'd' },
        });
        expect(vm?.kind === 'victory' && vm.finalBlowPhrase).toContain('bell did not ring');
    });

    it('threads xpReward through; loot empty by default until Tick B+', () => {
        const vm = selectAftermathViewModel(VICTORY_SNAPSHOT);
        expect(vm?.kind === 'victory' && vm.rewards.xp).toBe(18);
        expect(vm?.kind === 'victory' && vm.rewards.loot).toEqual([]);
        expect(vm?.kind === 'victory' && vm.rewards.currency).toBeNull();
    });

    it('nulls xpReward when the enemy has none', () => {
        const vm = selectAftermathViewModel({ ...VICTORY_SNAPSHOT, xpReward: null });
        expect(vm?.kind === 'victory' && vm.rewards.xp).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// Phase 70 Tick B — parley branch
// ---------------------------------------------------------------------------

const PARLEY_SNAPSHOT_MID: Extract<AftermathData, { variant: 'parley' }> = {
    variant: 'parley',
    enemy: {
        name: 'Larch-Stalker',
        description: 'A figure long since gnawed by the road.',
        level: 4,
    },
    xpReward: 12,
    journalEntry: null,
};

describe('selectAftermathViewModel: parley branch', () => {
    it('returns a parley VM with uppercased enemy name', () => {
        const vm = selectAftermathViewModel(PARLEY_SNAPSHOT_MID);
        expect(vm?.kind).toBe('parley');
        expect(vm?.kind === 'parley' && vm.enemyName).toBe('LARCH-STALKER');
    });

    it('derives the epithet the same way as the victory branch', () => {
        const vm = selectAftermathViewModel(PARLEY_SNAPSHOT_MID);
        expect(vm?.kind === 'parley' && vm.enemyEpithet).toBe(
            'figure long since gnawed by the road',
        );
    });

    it('picks the quiet-yield pact phrase for low-level enemies (<=2)', () => {
        const vm = selectAftermathViewModel({
            ...PARLEY_SNAPSHOT_MID,
            enemy: { ...PARLEY_SNAPSHOT_MID.enemy, level: 1 },
        });
        expect(vm?.kind === 'parley' && vm.pactPhrase).toContain('stopped');
    });

    it('picks the bell pact phrase for mid-level enemies (3-5)', () => {
        const vm = selectAftermathViewModel(PARLEY_SNAPSHOT_MID);
        expect(vm?.kind === 'parley' && vm.pactPhrase).toContain('set down the bell');
    });

    it('picks the heavy-yield pact phrase for higher-level enemies (>5)', () => {
        const vm = selectAftermathViewModel({
            ...PARLEY_SNAPSHOT_MID,
            enemy: { ...PARLEY_SNAPSHOT_MID.enemy, level: 8 },
        });
        expect(vm?.kind === 'parley' && vm.pactPhrase).toContain('held out the bell');
    });

    it('threads xpReward + collapses currency / loot to nullish defaults', () => {
        const vm = selectAftermathViewModel(PARLEY_SNAPSHOT_MID);
        expect(vm?.kind === 'parley' && vm.rewards.xp).toBe(12);
        expect(vm?.kind === 'parley' && vm.rewards.currency).toBeNull();
        expect(vm?.kind === 'parley' && vm.rewards.loot).toEqual([]);
    });

    it('passes journalEntry through verbatim when populated', () => {
        const vm = selectAftermathViewModel({
            ...PARLEY_SNAPSHOT_MID,
            journalEntry: {
                bookName: 'CODEX',
                entryTitle: 'Of the Larch-Stalker',
                preview: 'a bell that does not ring',
            },
        });
        expect(vm?.kind === 'parley' && vm.journalEntry).toEqual({
            bookName: 'CODEX',
            entryTitle: 'Of the Larch-Stalker',
            preview: 'a bell that does not ring',
        });
    });

    it('leaves journalEntry null when the snapshot has none', () => {
        const vm = selectAftermathViewModel(PARLEY_SNAPSHOT_MID);
        expect(vm?.kind === 'parley' && vm.journalEntry).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// Phase 70 Tick C — defeat branch
// ---------------------------------------------------------------------------

const DEFEAT_SNAPSHOT: Extract<AftermathData, { variant: 'defeat' }> = {
    variant: 'defeat',
    enemy: {
        name: 'Hierophant',
        description: 'A figure long since gnawed by iron tongues.',
        level: 7,
    },
    characterName: 'Worm-Eaten Pilgrim',
    finalBlow: {
        skillName: 'AXE-FALL',
        damage: 28,
        descriptor: 'cleaves the binding rib',
    },
    runSummary: {
        roundsEndured: 4,
        encountersFaced: 12,
        deepestNodeId: 'iii.b',
    },
};

describe('selectAftermathViewModel: defeat branch', () => {
    it('returns a defeat VM with uppercased character name', () => {
        const vm = selectAftermathViewModel(DEFEAT_SNAPSHOT);
        expect(vm?.kind).toBe('defeat');
        expect(vm?.kind === 'defeat' && vm.characterName).toBe('WORM-EATEN PILGRIM');
    });

    it('populates the killer block (uppercased name + epithet + final skill + damage)', () => {
        const vm = selectAftermathViewModel(DEFEAT_SNAPSHOT);
        expect(vm?.kind === 'defeat' && vm.killer).toEqual({
            name: 'HIEROPHANT',
            epithet: 'figure long since gnawed by iron tongues',
            finalSkill: 'AXE-FALL',
            damage: 28,
        });
    });

    it('falls back to STRIKE + 0 damage when finalBlow is null', () => {
        const vm = selectAftermathViewModel({ ...DEFEAT_SNAPSHOT, finalBlow: null });
        expect(vm?.kind === 'defeat' && vm.killer).toEqual({
            name: 'HIEROPHANT',
            epithet: 'figure long since gnawed by iron tongues',
            finalSkill: 'STRIKE',
            damage: 0,
        });
    });

    it('picks the brutal cause phrase for damage >= 20', () => {
        const vm = selectAftermathViewModel(DEFEAT_SNAPSHOT);
        expect(vm?.kind === 'defeat' && vm.causePhrase).toContain('laid down where it stood');
    });

    it('picks the broken-down cause phrase for damage in [10, 20)', () => {
        const vm = selectAftermathViewModel({
            ...DEFEAT_SNAPSHOT,
            finalBlow: { skillName: 'STRIKE', damage: 12, descriptor: null },
        });
        expect(vm?.kind === 'defeat' && vm.causePhrase).toContain('came in pieces');
    });

    it('picks the quiet cause phrase for damage < 10', () => {
        const vm = selectAftermathViewModel({
            ...DEFEAT_SNAPSHOT,
            finalBlow: { skillName: 'STRIKE', damage: 4, descriptor: null },
        });
        expect(vm?.kind === 'defeat' && vm.causePhrase).toContain('steady one');
    });

    it('threads the run-summary trio through verbatim', () => {
        const vm = selectAftermathViewModel(DEFEAT_SNAPSHOT);
        expect(vm?.kind === 'defeat' && vm.runSummary).toEqual({
            rounds: 4,
            encountersFaced: 12,
            deepestNodeId: 'iii.b',
        });
    });

    it('preserves a null deepestNodeId for the "died on first node" branch', () => {
        const vm = selectAftermathViewModel({
            ...DEFEAT_SNAPSHOT,
            runSummary: { roundsEndured: 1, encountersFaced: 1, deepestNodeId: null },
        });
        expect(vm?.kind === 'defeat' && vm.runSummary.deepestNodeId).toBeNull();
    });
});
