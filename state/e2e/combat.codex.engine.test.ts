/**
 * Hermetic E2E Tests — Combat codex presenter (Phase 50 tick B).
 *
 * Pins `selectCodexStatusLine` + `selectCodexEnemySlug` against the
 * shape returned by the existing `selectCombatViewModel`. Pure
 * helpers — no engine touch in this file; tests construct minimal
 * synthetic VMs that mirror the real shape.
 *
 * Hermetic = self-contained + deterministic + isolated.
 */

import { describe, expect, it } from '@jest/globals';

import {
    selectCodexEnemySlug,
    selectCodexStatusLine,
} from '@/state/presenters/combat.codex.engine';
import type { CombatViewModel } from '@/state/presenters/combat.engine';

/** Build a minimally-shaped VM with the fields the codex helper
 * reads (enemy.name, isInCombat, round, phase). Other VM fields are
 * stubbed with the shape's defaults so the type checker is happy. */
function makeVm(overrides: Partial<CombatViewModel>): CombatViewModel {
    return {
        isInCombat: false,
        phase: 'choosing_stance',
        round: 1,
        hud: { hpPercent: 1, manaPercent: 1, effects: [] },
        enemy: {
            name: 'larch-stalker',
            tier: 'common',
            hp: 24,
            hpMax: 24,
            hpRatio: 1,
            lastStance: null,
            mindMarks: 0,
            effects: [],
            flavor: '',
        },
        player: {
            hp: 80,
            hpMax: 80,
            hpRatio: 1,
            mana: 50,
            manaMax: 50,
            manaRatio: 1,
            effects: [],
        },
        friendshipCounter: 0,
        friendshipCounterMax: 5,
        stancePicker: {
            options: [],
            selected: 'heart',
            canConfirm: false,
        } as unknown as CombatViewModel['stancePicker'],
        actionPicker: { options: [] } as unknown as CombatViewModel['actionPicker'],
        skillPicker: {} as unknown as CombatViewModel['skillPicker'],
        resolve: {} as unknown as CombatViewModel['resolve'],
        log: [],
        logEmptyMessage: '',
        phaseHeader: '',
        phaseIndex: 0,
        phaseOrder: [],
        ...overrides,
    } as CombatViewModel;
}

describe('selectCodexEnemySlug', () => {
    it('lowercases and replaces hyphens with dots', () => {
        expect(selectCodexEnemySlug('Larch-Stalker')).toBe('larch.stalker');
    });

    it('collapses whitespace and underscores to single dots', () => {
        expect(selectCodexEnemySlug('Larch  Stalker')).toBe('larch.stalker');
        expect(selectCodexEnemySlug('larch_stalker')).toBe('larch.stalker');
    });

    it('strips characters outside [a-z0-9.]', () => {
        expect(selectCodexEnemySlug("the Verge's Wretch!")).toBe('the.verges.wretch');
    });

    it('collapses runs of dots and trims edge dots', () => {
        expect(selectCodexEnemySlug('--larch--stalker--')).toBe('larch.stalker');
        expect(selectCodexEnemySlug('.larch.')).toBe('larch');
    });

    it('returns empty string for a name with no slug-able characters', () => {
        expect(selectCodexEnemySlug('!!!')).toBe('');
    });
});

describe('selectCodexStatusLine', () => {
    it('returns the design-source format when combat is active', () => {
        const vm = makeVm({
            isInCombat: true,
            round: 4,
            phase: 'choosing_action',
            enemy: { ...makeVm({}).enemy, name: 'larch-stalker' },
        });
        expect(selectCodexStatusLine(vm)).toBe(
            'ENC=larch.stalker · ROUND=iv · STATE=choosing_action',
        );
    });

    it('uses ENC=none when combat is not active', () => {
        const vm = makeVm({ isInCombat: false, round: 1, phase: 'choosing_stance' });
        expect(selectCodexStatusLine(vm)).toBe(
            'ENC=none · ROUND=i · STATE=choosing_stance',
        );
    });

    it('renders rounds 1..10 as roman lowercase', () => {
        const cases: Array<[number, string]> = [
            [1, 'i'], [2, 'ii'], [3, 'iii'], [4, 'iv'], [5, 'v'],
            [6, 'vi'], [7, 'vii'], [8, 'viii'], [9, 'ix'], [10, 'x'],
        ];
        for (const [n, roman] of cases) {
            const vm = makeVm({ isInCombat: true, round: n });
            expect(selectCodexStatusLine(vm)).toContain(`ROUND=${roman}`);
        }
    });

    it('extends to proper lowercase Roman past x (post 2026-05-22 consolidation onto `toRomanLower`)', () => {
        const vm = makeVm({ isInCombat: true, round: 11 });
        // Pre-consolidation the array-lookup helper bailed out
        // at `n >= 11` with `String(n)` (rendering `ROUND=11`);
        // the consolidated `toRomanLower` produces proper Roman
        // for any positive integer. Behavior change documented
        // in `state/presenters/roman.ts`.
        expect(selectCodexStatusLine(vm)).toContain('ROUND=xi');
    });

    it('threads the engine phase through verbatim (no display literal in the screen)', () => {
        const phases = [
            'choosing_stance',
            'choosing_action',
            'choosing_skill',
            'resolving',
            'ended',
        ] as const;
        for (const p of phases) {
            const vm = makeVm({ isInCombat: true, phase: p });
            expect(selectCodexStatusLine(vm)).toContain(`STATE=${p}`);
        }
    });
});
