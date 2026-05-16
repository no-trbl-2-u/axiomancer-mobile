/**
 * Hermetic E2E Tests — Token Crucible presenter (Phase 28).
 *
 * Pins the VM shape, skill-library partition, canAfford matrix,
 * and deep-freeze invariant. The presenter is pure; tests pass
 * fixture pools and assert against the returned VM.
 */

import { describe, it, expect } from '@jest/globals';

import {
    selectTokenCrucibleViewModel,
    type TokenCrucibleViewModel,
} from '@/state/presenters/token-crucible.engine';
import {
    TOKEN_KEYS,
    type TokenCounts,
} from '@/state/mocks/tokens.fixture';

const FULL_POOL: TokenCounts = { body: 9, mind: 9, heart: 9, fallacy: 9, paradox: 9 };
const EMPTY_POOL: TokenCounts = { body: 0, mind: 0, heart: 0, fallacy: 0, paradox: 0 };
const DEFAULT_POOL: TokenCounts = { body: 2, mind: 1, heart: 2, fallacy: 1, paradox: 1 };

describe('selectTokenCrucibleViewModel: shape contract', () => {
    it('returns a totally-shaped VM for a default pool', () => {
        const vm: TokenCrucibleViewModel = selectTokenCrucibleViewModel(DEFAULT_POOL);
        expect(vm.pool).toEqual(DEFAULT_POOL);
        expect(typeof vm.tokenMeta).toBe('object');
        expect(vm.tokenKeys).toEqual(TOKEN_KEYS);
        expect(typeof vm.skillsByStance).toBe('object');
        expect(typeof vm.totalSkillCount).toBe('number');
        expect(typeof vm.castableSkillCount).toBe('number');
        expect(Array.isArray(vm.rules)).toBe(true);
        expect(Array.isArray(vm.legend)).toBe(true);
    });

    it('legend has one entry per token kind, in TOKEN_KEYS order', () => {
        const vm = selectTokenCrucibleViewModel(DEFAULT_POOL);
        expect(vm.legend).toHaveLength(TOKEN_KEYS.length);
        expect(vm.legend.map((e) => e.kind)).toEqual([...TOKEN_KEYS]);
        for (const entry of vm.legend) {
            expect(typeof entry.meta.label).toBe('string');
            expect(typeof entry.meta.color).toBe('string');
        }
    });

    it('rules array is non-empty and every row carries inline meta', () => {
        const vm = selectTokenCrucibleViewModel(DEFAULT_POOL);
        expect(vm.rules.length).toBeGreaterThan(0);
        for (const r of vm.rules) {
            expect(TOKEN_KEYS).toContain(r.kind);
            expect(typeof r.when).toBe('string');
            expect(typeof r.amount).toBe('string');
            expect(typeof r.meta.label).toBe('string');
        }
    });
});

describe('selectTokenCrucibleViewModel: skill partition', () => {
    it('totalSkillCount equals 12 and skillsByStance partitions add up', () => {
        const vm = selectTokenCrucibleViewModel(DEFAULT_POOL);
        const sum =
            vm.skillsByStance.heart.length +
            vm.skillsByStance.body.length +
            vm.skillsByStance.mind.length;
        expect(sum).toBe(vm.totalSkillCount);
        expect(vm.totalSkillCount).toBe(12);
    });

    it('every skill row has stable id / name / tier / costEntries / castableNow', () => {
        const vm = selectTokenCrucibleViewModel(DEFAULT_POOL);
        const allRows = [
            ...vm.skillsByStance.heart,
            ...vm.skillsByStance.body,
            ...vm.skillsByStance.mind,
        ];
        for (const row of allRows) {
            expect(typeof row.id).toBe('string');
            expect(typeof row.name).toBe('string');
            expect([1, 2, 3]).toContain(row.tier);
            expect(Array.isArray(row.costEntries)).toBe(true);
            expect(typeof row.castableNow).toBe('boolean');
        }
    });

    it('cost entries are stable order (TOKEN_KEYS) + only positive amounts', () => {
        const vm = selectTokenCrucibleViewModel(DEFAULT_POOL);
        for (const row of vm.skillsByStance.heart) {
            for (const entry of row.costEntries) {
                expect(TOKEN_KEYS).toContain(entry.kind);
                expect(entry.amount).toBeGreaterThan(0);
            }
            // Order is a subsequence of TOKEN_KEYS.
            const indexes = row.costEntries.map((e) => TOKEN_KEYS.indexOf(e.kind));
            for (let i = 1; i < indexes.length; i++) {
                expect(indexes[i]).toBeGreaterThan(indexes[i - 1]!);
            }
        }
    });
});

describe('selectTokenCrucibleViewModel: canAfford matrix', () => {
    it('a full pool makes every skill castable', () => {
        const vm = selectTokenCrucibleViewModel(FULL_POOL);
        expect(vm.castableSkillCount).toBe(vm.totalSkillCount);
        const allRows = [
            ...vm.skillsByStance.heart,
            ...vm.skillsByStance.body,
            ...vm.skillsByStance.mind,
        ];
        for (const row of allRows) {
            expect(row.castableNow).toBe(true);
        }
    });

    it('an empty pool makes no skill castable', () => {
        const vm = selectTokenCrucibleViewModel(EMPTY_POOL);
        expect(vm.castableSkillCount).toBe(0);
        const allRows = [
            ...vm.skillsByStance.heart,
            ...vm.skillsByStance.body,
            ...vm.skillsByStance.mind,
        ];
        for (const row of allRows) {
            expect(row.castableNow).toBe(false);
        }
    });

    it('an exact-cost pool makes only that one skill castable', () => {
        // 'appeal-to-pity' costs { heart: 1 } only.
        const exactPool: TokenCounts = { body: 0, mind: 0, heart: 1, fallacy: 0, paradox: 0 };
        const vm = selectTokenCrucibleViewModel(exactPool);
        const target = vm.skillsByStance.heart.find((r) => r.id === 'appeal-to-pity');
        expect(target?.castableNow).toBe(true);
        // Every other heart skill (which needs fallacy / paradox alongside) is uncastable.
        const others = vm.skillsByStance.heart.filter((r) => r.id !== 'appeal-to-pity');
        for (const r of others) {
            expect(r.castableNow).toBe(false);
        }
        expect(vm.castableSkillCount).toBe(1);
    });
});

describe('selectTokenCrucibleViewModel: invariants', () => {
    it('the returned VM is deep-frozen', () => {
        const vm = selectTokenCrucibleViewModel(DEFAULT_POOL);
        expect(Object.isFrozen(vm)).toBe(true);
        expect(Object.isFrozen(vm.skillsByStance)).toBe(true);
        expect(Object.isFrozen(vm.skillsByStance.heart)).toBe(true);
    });
});
