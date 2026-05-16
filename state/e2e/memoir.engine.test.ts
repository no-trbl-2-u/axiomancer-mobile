/**
 * Hermetic E2E Tests — MEMOIR presenter (Phase 33).
 *
 * Tick A pins the VM shape end-to-end. Ticks B-D will extend with
 * quest / alignment / chronicle cases. The shape contract here is
 * stable across those extensions — only the section *contents* fill
 * in.
 *
 * Hermetic = self-contained + deterministic + isolated.
 * See docs/testing.md for the full standard.
 */

import { afterEach, describe, it, expect, jest } from '@jest/globals';
import { createGameStore } from 'axiomancer-mechanics';

import { createMemoryAdapter } from '@/test-utils/memoryAdapter';
import {
    selectMemoirViewModel,
    type MemoirViewModel,
} from '@/state/presenters/memoir.engine';

afterEach(() => {
    jest.restoreAllMocks();
});

describe('selectMemoirViewModel: shape contract', () => {
    it('returns a fully-shaped MemoirViewModel for a fresh game', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm: MemoirViewModel = selectMemoirViewModel(store.getState());

        // Headers + section eyebrows — all sourced from the VM so the
        // screen carries no inline literals (Hard Rule #8).
        expect(typeof vm.headerEyebrow).toBe('string');
        expect(vm.headerEyebrow.length).toBeGreaterThan(0);
        expect(typeof vm.headerSubline).toBe('string');
        expect(vm.headerSubline.length).toBeGreaterThan(0);
        expect(vm.chronicleEyebrow).toBe('✠ A CHRONICLE');
        expect(vm.questsEyebrow).toBe('✠ ERRANDS');
        expect(vm.questsActiveEyebrow).toBe('✠ AT HAND');
        expect(vm.questsCompletedEyebrow).toBe('✠ COMPLETED');
        expect(vm.questsForgottenEyebrow).toBe('✠ FORGOTTEN');
        expect(vm.measureEyebrow).toBe('✠ MEASURE');

        // Sections — Tick A ships empty placeholders.
        expect(Array.isArray(vm.chronicle)).toBe(true);
        expect(vm.chronicle.length).toBe(0);
        expect(Array.isArray(vm.quests.active)).toBe(true);
        expect(Array.isArray(vm.quests.completed)).toBe(true);
        expect(Array.isArray(vm.quests.forgotten)).toBe(true);

        // Alignment defaults — Tick C will populate from state.moralMeter
        // and the highest-base-stat heuristic.
        expect(vm.moralAlignment.value).toBe(0);
        expect(vm.moralAlignment.chip.label).toBe('UNDECLARED');
        expect(vm.moralAlignment.chip.tintKey).toBe('bone');
        expect(vm.philosophicalAlignment.label).toBe('untested.');
        expect(vm.philosophicalAlignment.provisional).toBe(true);

        // Quote slot — null until a follow-up phase wires alignments.
        expect(vm.philosopherQuote).toBeNull();

        // Empty-state copy locked per the brief.
        expect(vm.emptyChronicle).toBe('the page is bare.');
        expect(vm.emptyQuests).toBe('no errands written here.');
        expect(vm.emptyMoral).toBe('the scales are level.');
        expect(vm.emptyPhilosophical).toBe('untested.');
    });

    it('substitutes the player name into the header sub-line when available', () => {
        const store = createGameStore(createMemoryAdapter());
        // Fresh-game player is created with a default name. Confirm the
        // sub-line picks that name up rather than falling back.
        const playerName = store.getState().player?.name ?? '';
        const vm = selectMemoirViewModel(store.getState());

        if (playerName.length > 0) {
            expect(vm.headerSubline).toContain(playerName);
            expect(vm.headerSubline.endsWith('pilgrim.')).toBe(true);
        }
    });

    it('returns a deep-frozen view model so callers cannot mutate it', () => {
        const store = createGameStore(createMemoryAdapter());
        const vm = selectMemoirViewModel(store.getState());

        expect(Object.isFrozen(vm)).toBe(true);
        expect(Object.isFrozen(vm.quests)).toBe(true);
        expect(Object.isFrozen(vm.moralAlignment)).toBe(true);
        expect(Object.isFrozen(vm.philosophicalAlignment)).toBe(true);
    });
});
