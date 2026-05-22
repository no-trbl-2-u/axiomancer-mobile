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

    it('returns null on non-victory variants (Tick A only ships victory)', () => {
        const parley: AftermathData = {
            variant: 'parley',
            enemy: { name: 'Hierophant', description: 'iron-tongued.', level: 7 },
        };
        expect(selectAftermathViewModel(parley)).toBeNull();
        const defeat: AftermathData = {
            variant: 'defeat',
            enemy: { name: 'Hierophant', description: 'iron-tongued.', level: 7 },
        };
        expect(selectAftermathViewModel(defeat)).toBeNull();
    });

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
