/**
 * Hermetic E2E Tests — Inventory modal presenter (Spec 06 Q2 / Q5).
 *
 * The modal previews the result of using or equipping an item before
 * the player confirms. These tests drive `selectItemModalViewModel`
 * end-to-end through the engine store with no mocks.
 *
 * Hermetic = self-contained + deterministic + isolated.
 * See docs/testing.md.
 */

import { afterEach, describe, it, expect, jest } from '@jest/globals';
import {
    createCharacter,
    createGameStore,
    type Consumable,
    type Equipment,
} from 'axiomancer-mechanics';

import { createMemoryAdapter } from '@/test-utils/memoryAdapter';
import { selectItemModalViewModel } from '@/state/presenters/inventory.modal.engine';

afterEach(() => {
    jest.restoreAllMocks();
});

function makeStore(inventory: readonly (Consumable | Equipment)[]) {
    const base = createCharacter({
        name: 'Pilgrim',
        level: 1,
        baseStats: { heart: 4, body: 4, mind: 4 },
    });
    const player = { ...base, health: 5, inventory: [...inventory] };
    return createGameStore(createMemoryAdapter(), { player });
}

const potion: Consumable = {
    id: 'phial',
    name: 'Potion of Heart',
    description: 'A small phial of ruby liquor.',
    category: 'consumable',
    effectId: 'Heal 6 HP',
    quantity: 1,
};

const blade: Equipment = {
    id: 'long-blade',
    name: 'Long Blade',
    description: 'Iron, notched.',
    category: 'equipment',
    slot: 'weapon',
    rarity: 'common',
    requiredLevel: 1,
};

// ---------------------------------------------------------------------------

describe('selectItemModalViewModel: missing item', () => {
    it('returns null when the item id is unknown', () => {
        const store = makeStore([potion]);
        expect(selectItemModalViewModel(store.getState(), 'missing')).toBeNull();
    });
});

describe('selectItemModalViewModel: consumable preview (Q2)', () => {
    it('reports mode "use" and a DRINK confirm label', () => {
        const store = makeStore([potion]);

        const vm = selectItemModalViewModel(store.getState(), 'phial')!;

        expect(vm.mode).toBe('use');
        expect(vm.confirmLabel).toBe('DRINK');
        expect(vm.confirmPrompt).toMatch(/potion/i);
    });

    it('shows the HP delta in the preview lines', () => {
        const store = makeStore([potion]);

        const vm = selectItemModalViewModel(store.getState(), 'phial')!;

        expect(vm.previewLines.some((l) => /\+6/.test(l))).toBe(true);
        expect(vm.previewLines.some((l) => /HP/.test(l))).toBe(true);
    });

    it('reports "No HP change." when the effect is non-healing', () => {
        const odd: Consumable = { ...potion, id: 'wine', effectId: '+4 Mana' };
        const store = makeStore([odd]);

        const vm = selectItemModalViewModel(store.getState(), 'wine')!;

        expect(vm.previewLines.join(' ')).toMatch(/No HP change/i);
    });
});

describe('selectItemModalViewModel: equipment preview (Q5)', () => {
    it('reports mode "equip" and an EQUIP label when not already worn', () => {
        const store = makeStore([blade]);
        // Reset first-in-slot by adding an extra item before it.
        const second: Equipment = { ...blade, id: 'second', name: 'Whittled Stick' };
        const player = {
            ...store.getState().player,
            inventory: [blade, second],
        };
        store.setState({ player });

        const vm = selectItemModalViewModel(store.getState(), 'second')!;

        expect(vm.mode).toBe('equip');
        expect(vm.confirmLabel).toBe('EQUIP');
    });

    it('reports "WORN" when the target is already first-in-slot', () => {
        const store = makeStore([blade]);

        const vm = selectItemModalViewModel(store.getState(), 'long-blade')!;

        expect(vm.confirmLabel).toBe('WORN');
    });

    it('exposes a stat delta table for the modal to render', () => {
        const store = makeStore([blade]);

        const vm = selectItemModalViewModel(store.getState(), 'long-blade')!;

        expect(vm.statDeltas.length).toBeGreaterThan(0);
        for (const delta of vm.statDeltas) {
            expect(typeof delta.before).toBe('number');
            expect(typeof delta.after).toBe('number');
            expect(typeof delta.delta).toBe('number');
        }
    });
});

describe('selectItemModalViewModel: invariants', () => {
    it('the modal VM is deep-frozen', () => {
        const store = makeStore([potion]);

        const vm = selectItemModalViewModel(store.getState(), 'phial')!;

        expect(Object.isFrozen(vm)).toBe(true);
        expect(Object.isFrozen(vm.previewLines)).toBe(true);
        expect(Object.isFrozen(vm.statDeltas)).toBe(true);
    });
});
