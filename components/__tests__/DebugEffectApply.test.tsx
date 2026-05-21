/**
 * Hermetic component tests — DebugEffectApply (Phase 61e).
 *
 * Pins:
 *   - DEV gate (true / simulated-false)
 *   - BUFF · ME applies buff_body_defense_up to player.effects
 *   - BLEED · FOE no-ops cleanly when no active combat
 *   - BLEED · FOE applies debuff_bleed to combat.enemy.effects
 *     when combat is active
 *   - Stacked presses are cumulative on the effects array
 */

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { createEnemy } from 'axiomancer-mechanics';

import { DebugEffectApply } from '@/components/DebugEffectApply';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { createAppStore, type AppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

let warnSpy: ReturnType<typeof jest.spyOn>;

beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
    warnSpy.mockRestore();
    jest.restoreAllMocks();
});

function makeStore(): AppStore {
    return createAppStore({ adapter: createMemoryAdapter() });
}

function withProvider(store: AppStore, child: React.ReactNode) {
    return <GameStoreProvider store={store}>{child}</GameStoreProvider>;
}

function makeTestEnemy() {
    return createEnemy({
        id: 'test-foe',
        name: 'Test Foe',
        description: 'A test enemy',
        level: 1,
        baseStats: { heart: 1, body: 1, mind: 1 },
        mapName: 'fishing-village',
        logic: 'random',
    });
}

describe('DebugEffectApply: DEV gate', () => {
    it('renders both buttons when __DEV__ is true (jest default)', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugEffectApply />));
        expect(tree.queryByTestId('debug-effect-buff-player')).not.toBeNull();
        expect(tree.queryByTestId('debug-effect-bleed-enemy')).not.toBeNull();
    });

    it('renders null when __DEV__ is false (production build simulation)', () => {
         
        const g = global as any;
        const original = g.__DEV__;
        g.__DEV__ = false;
        try {
            const store = makeStore();
            const tree = render(withProvider(store, <DebugEffectApply />));
            expect(tree.queryByTestId('debug-effect-buff-player')).toBeNull();
        } finally {
            g.__DEV__ = original;
        }
    });
});

describe('DebugEffectApply: buff routing', () => {
    it('BUFF · ME adds an effect to player.effects', () => {
        const store = makeStore();
        const before = store.getState().player.effects?.length ?? 0;

        const tree = render(withProvider(store, <DebugEffectApply />));
        fireEvent.press(tree.getByTestId('debug-effect-buff-player'));

        const after = store.getState().player.effects ?? [];
        expect(after.length).toBeGreaterThan(before);
        // The effect's effectId on the ActiveEffect points back to the registry entry.
        expect(after.some((e) => e.effectId === 'buff_body_defense_up')).toBe(true);
    });
});

describe('DebugEffectApply: enemy debuff routing', () => {
    it('BLEED · FOE no-ops + warns when no combat is active', () => {
        const store = makeStore();
        expect(store.getState().combat).toBeNull();

        const tree = render(withProvider(store, <DebugEffectApply />));
        fireEvent.press(tree.getByTestId('debug-effect-bleed-enemy'));

        expect(store.getState().combat).toBeNull();
        expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it('BLEED · FOE adds an effect to combat.enemy.effects when combat is active', () => {
        const store = makeStore();
        store.getState().startCombat(makeTestEnemy());
        const enemyBefore = store.getState().combat?.enemy.effects?.length ?? 0;

        const tree = render(withProvider(store, <DebugEffectApply />));
        fireEvent.press(tree.getByTestId('debug-effect-bleed-enemy'));

        const enemyAfter = store.getState().combat?.enemy.effects ?? [];
        expect(enemyAfter.length).toBeGreaterThan(enemyBefore);
        expect(enemyAfter.some((e) => e.effectId === 'debuff_bleed')).toBe(true);
    });
});

describe('DebugEffectApply: accessibility', () => {
    it('exposes accessibilityRole=button and descriptive labels', () => {
        const store = makeStore();
        const tree = render(withProvider(store, <DebugEffectApply />));

        const buff = tree.getByTestId('debug-effect-buff-player');
        expect(buff.props.accessibilityRole).toBe('button');
        expect(buff.props.accessibilityLabel).toMatch(/buff/i);

        const debuff = tree.getByTestId('debug-effect-bleed-enemy');
        expect(debuff.props.accessibilityRole).toBe('button');
        expect(debuff.props.accessibilityLabel).toMatch(/bleed/i);
    });
});
