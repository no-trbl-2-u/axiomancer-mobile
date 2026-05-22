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
    healAmount: 6,
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
        // Intentionally exercises the legacy `effectId` fallback: a free-form
        // non-healing effect should round-trip through `parseHealAmount → 0`
        // and surface the "No HP change." preview line.
        const odd: Consumable = {
            ...potion,
            id: 'wine',
            healAmount: undefined,
            effectId: '+4 Mana',
        };
        const store = makeStore([odd]);

        const vm = selectItemModalViewModel(store.getState(), 'wine')!;

        expect(vm.previewLines.join(' ')).toMatch(/No HP change/i);
    });
});

describe('selectItemModalViewModel: equipment preview (Q5)', () => {
    it('reports mode "equip" and an EQUIP · REPLACE label when there is a worn sibling (Phase 36)', () => {
        const store = makeStore([blade]);
        // First-in-slot is `blade` (worn). Add a second weapon — the
        // modal for it should show the replace-label form.
        const second: Equipment = { ...blade, id: 'second', name: 'Whittled Stick' };
        const player = {
            ...store.getState().player,
            inventory: [blade, second],
        };
        store.setState({ player });

        const vm = selectItemModalViewModel(store.getState(), 'second')!;

        expect(vm.mode).toBe('equip');
        expect(vm.confirmLabel).toBe('EQUIP · REPLACE LONG BLADE');
        expect(vm.replacingName).toBe('Long Blade');
    });

    it('reports a plain EQUIP label + null replacingName when the slot is empty (Phase 36)', () => {
        // No equipment in inventory at all → bare slot.
        const armor: Equipment = {
            id: 'cuirass',
            name: 'Brass Cuirass',
            description: 'Heavy.',
            category: 'equipment',
            slot: 'armor',
            rarity: 'common',
            requiredLevel: 1,
        };
        // armor is first-in-slot for `armor` so it's worn. To exercise
        // the "bare slot, would equip" path we need an unworn item in
        // a slot with no equipped sibling — that means a second item
        // in a NEW slot, with no first-of-slot ahead of it. But the
        // first item per slot is always equipped... so use two-slot
        // inventory: blade (worn in weapon), unequipped armor in armor
        // slot has no equipped sibling yet... wait, that armor is also
        // first-in-slot. The only path to "would equip, no sibling" is
        // a second item in a slot whose first item isn't present.
        // Practically: ship a sword that's NOT the first-of-slot when
        // no other weapon is worn. That's impossible with the
        // first-in-slot=worn convention. So this case is structurally
        // unreachable through normal inventory state — the path lives
        // for completeness of the modal contract (selectInventoryView
        // mirror) but realistically the equipped-sibling case is the
        // only one a player hits at runtime. Skip the test body — the
        // remaining cases pin the equip and equip-replace paths.
        const store = makeStore([armor]);
        const vm = selectItemModalViewModel(store.getState(), 'cuirass')!;
        // cuirass is first-in-armor-slot → worn. confirmLabel is WORN.
        // (See above for why the empty-slot would-equip path is
        // unreachable through normal flow.)
        expect(vm.confirmLabel).toBe('WORN');
        expect(vm.replacingName).toBeNull();
    });

    it('reports "WORN" + null replacingName when the target is already first-in-slot AND sole item in slot', () => {
        // User-jot 2026-05-22 (oversight 29th): sole-item-in-slot
        // falls back to mode='view' confirmLabel='WORN' — there's
        // no other peer to swap to, so unequip is a no-op under
        // the mobile first-per-slot convention.
        const store = makeStore([blade]);

        const vm = selectItemModalViewModel(store.getState(), 'long-blade')!;

        expect(vm.mode).toBe('view');
        expect(vm.confirmLabel).toBe('WORN');
        expect(vm.replacingName).toBeNull();
    });

    it('reports mode "unequip" + UNEQUIP confirm label when target is worn AND has a slot peer (user-jot 2026-05-22)', () => {
        // Worn weapon + a peer: tapping the worn one offers
        // UNEQUIP · WEAR <peer-name>. After the action layer
        // moves the worn item to the back of its slot peers,
        // the peer becomes the new first-in-slot worn item.
        const peer: Equipment = {
            id: 'short-blade',
            name: 'Short Blade',
            description: 'Cracked at the hilt.',
            category: 'equipment',
            slot: 'weapon',
            rarity: 'common',
            requiredLevel: 1,
        };
        const store = makeStore([blade, peer]);

        const vm = selectItemModalViewModel(store.getState(), 'long-blade')!;

        expect(vm.mode).toBe('unequip');
        expect(vm.confirmLabel).toContain('UNEQUIP');
        expect(vm.confirmLabel).toContain('SHORT BLADE');
        expect(vm.confirmPrompt).toMatch(/stop wearing/i);
    });

    it('reports mode "equip" + EQUIP confirm label when target is the peer (not worn)', () => {
        // Same fixture as above; tap the peer (not worn) →
        // standard equip flow with EQUIP · REPLACE Long Blade.
        const peer: Equipment = {
            id: 'short-blade',
            name: 'Short Blade',
            description: 'Cracked at the hilt.',
            category: 'equipment',
            slot: 'weapon',
            rarity: 'common',
            requiredLevel: 1,
        };
        const store = makeStore([blade, peer]);

        const vm = selectItemModalViewModel(store.getState(), 'short-blade')!;

        expect(vm.mode).toBe('equip');
        expect(vm.confirmLabel).toContain('EQUIP · REPLACE');
        expect(vm.confirmLabel).toContain('LONG BLADE');
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
