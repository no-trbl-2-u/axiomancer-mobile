/**
 * Hermetic E2E Tests — Token Crucible presenter (Phase 28).
 *
 * Pins the VM shape, skill-library partition, canAfford matrix,
 * and deep-freeze invariant. The presenter is pure; tests pass
 * fixture pools and assert against the returned VM.
 */

import { describe, it, expect } from '@jest/globals';

import { skillLibrary } from 'axiomancer-mechanics';

import {
    selectTokenCrucibleViewModel,
    type TokenCrucibleViewModel,
} from '@/state/presenters/token-crucible.engine';
import {
    TOKEN_KEYS,
    type TokenCounts,
    type TokenKey,
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
    it('totalSkillCount tracks the engine skillLibrary and partitions add up', () => {
        const vm = selectTokenCrucibleViewModel(DEFAULT_POOL);
        const sum =
            vm.skillsByStance.heart.length +
            vm.skillsByStance.body.length +
            vm.skillsByStance.mind.length;
        expect(sum).toBe(vm.totalSkillCount);
        // Every skill the engine library exposes for one of the three
        // stances (philosophicalAspect) is surfaced — no hand-authored list.
        const engineStanceSkills = skillLibrary.filter((s) =>
            ['heart', 'body', 'mind'].includes(s.philosophicalAspect),
        ).length;
        expect(vm.totalSkillCount).toBe(engineStanceSkills);
        expect(vm.totalSkillCount).toBeGreaterThan(0);
    });

    it('skill rows carry engine ids, costs, and tiers (not a local copy)', () => {
        const vm = selectTokenCrucibleViewModel(DEFAULT_POOL);
        const ad = [...vm.skillsByStance.body, ...vm.skillsByStance.heart, ...vm.skillsByStance.mind].find(
            (r) => r.id === 'ad-hominem-strike',
        );
        const engine = skillLibrary.find((s) => s.id === 'ad-hominem-strike')!;
        expect(ad).toBeDefined();
        expect(ad!.tier).toBe(engine.tier);
        expect(ad!.cat).toBe(engine.category);
        // cost entries reflect the engine resourceCost exactly
        const reconstructed: Record<string, number> = {};
        for (const e of ad!.costEntries) reconstructed[e.kind] = e.amount;
        expect(reconstructed).toEqual(engine.resourceCost);
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

    it('a pool exactly matching a skill cost makes it castable; one short does not', () => {
        // Drive entirely off engine data so the test never re-hardcodes costs.
        const engine = skillLibrary.find((s) => s.id === 'appeal-to-pity')!;
        const cost = engine.resourceCost as Partial<TokenCounts>;
        const exactPool: TokenCounts = { body: 0, mind: 0, heart: 0, fallacy: 0, paradox: 0 };
        for (const k of TOKEN_KEYS) exactPool[k] = cost[k] ?? 0;

        const vmExact = selectTokenCrucibleViewModel(exactPool);
        const targetExact = vmExact.skillsByStance.heart.find((r) => r.id === 'appeal-to-pity');
        expect(targetExact?.castableNow).toBe(true);

        // Knock one token off the first cost kind → no longer affordable.
        const firstKind = (Object.keys(cost) as TokenKey[])[0]!;
        const shortPool: TokenCounts = { ...exactPool, [firstKind]: (exactPool[firstKind] ?? 0) - 1 };
        const vmShort = selectTokenCrucibleViewModel(shortPool);
        const targetShort = vmShort.skillsByStance.heart.find((r) => r.id === 'appeal-to-pity');
        expect(targetShort?.castableNow).toBe(false);
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
