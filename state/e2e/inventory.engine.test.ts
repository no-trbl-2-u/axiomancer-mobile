/**
 * Hermetic E2E Tests — Inventory screen presenter (Spec 06)
 *
 * Drives `selectInventoryViewModel` and the inventory action layer
 * (useItem / equipItem / dropItem) end-to-end through the engine
 * store. Hermetic = self-contained + deterministic + isolated.
 * See docs/testing.md for the full standard.
 */

import { afterEach, describe, it, expect, jest } from '@jest/globals';
import {
    createCharacter,
    createGameStore,
    type Consumable,
    type Equipment,
    type Item,
    type Material,
    type QuestItem,
} from 'axiomancer-mechanics';

import { createMemoryAdapter } from '@/test-utils/memoryAdapter';
import { createAppActions, parseHealAmount } from '@/state/actions';
import { createAppStore } from '@/state/store';
import {
    selectInventoryViewModel,
    type InventoryViewModel,
} from '@/state/presenters/inventory.engine';

afterEach(() => {
    jest.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function potion(id = 'potion-of-heart', heal = 6, qty = 1): Consumable {
    return {
        id,
        name: 'Potion of Heart',
        description: 'A small phial of ruby liquor.',
        category: 'consumable',
        healAmount: heal,
        quantity: qty,
    };
}

function sword(id = 'long-blade'): Equipment {
    return {
        id,
        name: 'Long Blade',
        description: 'Iron, notched. Drinks blood.',
        category: 'equipment',
        slot: 'weapon',
        rarity: 'common',
        requiredLevel: 1,
    };
}

function dagger(id = 'bone-dagger'): Equipment {
    return {
        id,
        name: 'Bone Dagger',
        description: 'Whittled from a saint\'s rib.',
        category: 'equipment',
        slot: 'weapon',
        rarity: 'common',
        requiredLevel: 1,
    };
}

function ash(id = 'ash', qty = 1): Material {
    return {
        id,
        name: 'Ash',
        description: 'For warding lines.',
        category: 'material',
        quantity: qty,
    };
}

function tooth(): QuestItem {
    return {
        id: 'hierophants-tooth',
        name: "Hierophant's Tooth",
        description: 'Reek of incense.',
        category: 'quest-item',
        questId: 'quest-priest',
    };
}

function makeStore(items: readonly Item[]) {
    const store = createGameStore(createMemoryAdapter());
    const state = store.getState();
    const player = { ...state.player, inventory: [...items] };
    store.setState({ player });
    return store;
}

// ---------------------------------------------------------------------------
// Shape contract — preserved from the stub
// ---------------------------------------------------------------------------

describe('selectInventoryViewModel: shape contract', () => {
    it('returns a totally-shaped InventoryViewModel for a fresh game', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm: InventoryViewModel = selectInventoryViewModel(store.getState());

        expect(Array.isArray(vm.tabs)).toBe(true);
        expect(Array.isArray(vm.items)).toBe(true);
        expect(typeof vm.shilling).toBe('number');
        expect(typeof vm.burden).toBe('number');
        expect(typeof vm.burdenMax).toBe('number');
        expect(typeof vm.isEmpty).toBe('boolean');
        expect(typeof vm.emptyMessage).toBe('string');
        expect(['all', 'equipment', 'consumable', 'material', 'quest']).toContain(vm.activeTab);
    });

    it('exposes the five canonical tab keys in display order', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm = selectInventoryViewModel(store.getState());

        expect(vm.tabs.map((t) => t.key)).toEqual([
            'all',
            'equipment',
            'consumable',
            'material',
            'quest',
        ]);
        for (const tab of vm.tabs) {
            expect(typeof tab.label).toBe('string');
            expect(typeof tab.count).toBe('number');
        }
    });
});

// ---------------------------------------------------------------------------
// localUi argument — drives activeTab + expansion
// ---------------------------------------------------------------------------

describe('selectInventoryViewModel: localUi argument', () => {
    it('defaults activeTab to "all" when no localUi is provided', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm = selectInventoryViewModel(store.getState());

        expect(vm.activeTab).toBe('all');
        expect(vm.expandedItemId).toBeNull();
    });

    it('respects an injected activeTab', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm = selectInventoryViewModel(store.getState(), {
            activeTab: 'consumable',
        });

        expect(vm.activeTab).toBe('consumable');
    });

    it('respects an injected expandedItemId', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm = selectInventoryViewModel(store.getState(), {
            expandedItemId: 'long-blade',
        });

        expect(vm.expandedItemId).toBe('long-blade');
    });
});

// ---------------------------------------------------------------------------
// Empty state (Q4=A)
// ---------------------------------------------------------------------------

describe('selectInventoryViewModel: empty state', () => {
    it('reports isEmpty=true and an empty-state message for a fresh character', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm = selectInventoryViewModel(store.getState());

        expect(vm.isEmpty).toBe(true);
        expect(vm.items).toHaveLength(0);
        expect(vm.emptyMessage).toMatch(/nothing|empty/i);
    });

    it('every tab count is 0 when inventory is empty', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm = selectInventoryViewModel(store.getState());

        for (const tab of vm.tabs) expect(tab.count).toBe(0);
    });
});

// ---------------------------------------------------------------------------
// Happy path — engine inventory reflected in VM
// ---------------------------------------------------------------------------

describe('selectInventoryViewModel: engine read', () => {
    it('renders one row per unique item id with name + description', () => {
        const store = makeStore([sword(), potion()]);

        const vm = selectInventoryViewModel(store.getState());

        expect(vm.items).toHaveLength(2);
        const byId = Object.fromEntries(vm.items.map((i) => [i.id, i]));
        expect(byId['long-blade'].name).toBe('Long Blade');
        expect(byId['potion-of-heart'].description).toMatch(/phial/);
        expect(vm.isEmpty).toBe(false);
    });

    it('maps engine category "quest-item" to presenter "quest"', () => {
        const store = makeStore([tooth()]);

        const vm = selectInventoryViewModel(store.getState());

        expect(vm.items[0].category).toBe('quest');
    });

    it('exposes equipment slot label as the `sub` field', () => {
        const store = makeStore([sword()]);

        const vm = selectInventoryViewModel(store.getState());

        expect(vm.items[0].sub).toBe('Weapon');
    });

    it('marks consumables as canUse and canDiscard', () => {
        const store = makeStore([potion()]);

        const vm = selectInventoryViewModel(store.getState());

        expect(vm.items[0].canUse).toBe(true);
        expect(vm.items[0].canDiscard).toBe(true);
    });

    it('marks quest items as !canDiscard', () => {
        const store = makeStore([tooth()]);

        const vm = selectInventoryViewModel(store.getState());

        expect(vm.items[0].canDiscard).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// Stacking (Q3=A — single row with count)
// ---------------------------------------------------------------------------

describe('selectInventoryViewModel: stacking', () => {
    it('three potions of the same id collapse into a single row with quantity=3', () => {
        const store = makeStore([potion('phial', 4, 3)]);

        const vm = selectInventoryViewModel(store.getState());

        expect(vm.items).toHaveLength(1);
        expect(vm.items[0].id).toBe('phial');
        expect(vm.items[0].quantity).toBe(3);
    });

    it('combines duplicate ids that arrive as separate inventory entries', () => {
        const store = makeStore([potion('phial', 4, 2), potion('phial', 4, 1)]);

        const vm = selectInventoryViewModel(store.getState());

        expect(vm.items).toHaveLength(1);
        expect(vm.items[0].quantity).toBe(3);
    });
});

// ---------------------------------------------------------------------------
// Categories (Q1=A — group by category in the VM via tab counts)
// ---------------------------------------------------------------------------

describe('selectInventoryViewModel: categories', () => {
    it('tab counts reflect items per category', () => {
        const store = makeStore([sword(), potion('phial-a', 4, 2), ash('ash', 3), tooth()]);

        const vm = selectInventoryViewModel(store.getState());

        const counts = Object.fromEntries(vm.tabs.map((t) => [t.key, t.count]));
        expect(counts.equipment).toBe(1);
        expect(counts.consumable).toBe(2);
        expect(counts.material).toBe(3);
        expect(counts.quest).toBe(1);
        expect(counts.all).toBe(1 + 2 + 3 + 1);
    });

    it('filters items to the active tab', () => {
        const store = makeStore([sword(), potion()]);

        const vm = selectInventoryViewModel(store.getState(), { activeTab: 'consumable' });

        expect(vm.items.map((i) => i.id)).toEqual(['potion-of-heart']);
    });
});

// ---------------------------------------------------------------------------
// Equipped flag — first item per slot
// ---------------------------------------------------------------------------

describe('selectInventoryViewModel: equipped flag', () => {
    it('marks the first equipment item per slot as equipped', () => {
        const store = makeStore([sword('a'), dagger('b')]);

        const vm = selectInventoryViewModel(store.getState());

        const a = vm.items.find((i) => i.id === 'a')!;
        const b = vm.items.find((i) => i.id === 'b')!;
        expect(a.equipped).toBe(true);
        expect(b.equipped).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// Invariants + lifecycle
// ---------------------------------------------------------------------------

describe('selectInventoryViewModel: invariants', () => {
    it('burden is in [0, burdenMax]', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm = selectInventoryViewModel(store.getState());

        expect(vm.burden).toBeGreaterThanOrEqual(0);
        expect(vm.burden).toBeLessThanOrEqual(vm.burdenMax);
    });

    it('the returned VM is deep-frozen', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm = selectInventoryViewModel(store.getState());

        expect(Object.isFrozen(vm)).toBe(true);
        expect(Object.isFrozen(vm.tabs)).toBe(true);
    });
});

describe('selectInventoryViewModel: store lifecycle', () => {
    it('selecting the VM does not call adapter.save', () => {
        const adapter = createMemoryAdapter();
        const store = createGameStore(adapter);
        const saveSpy = jest.spyOn(adapter, 'save');

        selectInventoryViewModel(store.getState());

        expect(saveSpy).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// Action layer — useItem, equipItem, dropItem
// ---------------------------------------------------------------------------

describe('parseHealAmount', () => {
    it.each([
        ['Heal 6 HP', 6],
        ['Restore 4 HP', 4],
        ['+10 HP', 10],
        ['8 HP', 8],
        ['heal 12 hp', 12],
        ['', 0],
        ['+4 Mana', 0],
        ['Inflict BURN 3 to foe.', 0],
    ])('parses "%s" to %i', (input, expected) => {
        expect(parseHealAmount(input)).toBe(expected);
    });
});

describe('useItem action: HP delta + stack decrement', () => {
    it('heals the player by the parsed amount and decrements the stack', () => {
        const damagedPlayer = {
            ...createCharacter({
                name: 'Pilgrim',
                level: 1,
                baseStats: { heart: 4, body: 4, mind: 4 },
            }),
            health: 5,
            inventory: [potion('phial', 6, 3)],
        };
        const store = createGameStore(createMemoryAdapter(), { player: damagedPlayer });
        const actions = createAppActions(store);

        const result = actions.useItem('phial');

        expect(result.applied).toBe(true);
        expect(result.healed).toBe(6);
        const after = store.getState().player;
        expect(after.health).toBe(11);
        const stack = (after.inventory as readonly Item[]).find((i: Item) => i.id === 'phial') as Consumable;
        expect(stack.quantity).toBe(2);
    });

    it('caps healing at the player\'s maxHealth', () => {
        const player = {
            ...createCharacter({
                name: 'Pilgrim',
                level: 1,
                baseStats: { heart: 4, body: 4, mind: 4 },
            }),
            inventory: [potion('phial', 100, 1)],
        };
        const fullHealth = player.maxHealth;
        const store = createGameStore(createMemoryAdapter(), { player });
        const actions = createAppActions(store);

        actions.useItem('phial');

        expect(store.getState().player.health).toBe(fullHealth);
    });

    it('removes the item entirely when the last in the stack is used', () => {
        const player = {
            ...createCharacter({
                name: 'Pilgrim',
                level: 1,
                baseStats: { heart: 4, body: 4, mind: 4 },
            }),
            health: 4,
            inventory: [potion('phial', 3, 1)],
        };
        const store = createGameStore(createMemoryAdapter(), { player });
        const actions = createAppActions(store);

        actions.useItem('phial');

        const finalInv = store.getState().player.inventory as readonly Item[];
        expect(finalInv.find((i: Item) => i.id === 'phial')).toBeUndefined();
    });

    it('no-ops when the item is missing or non-consumable', () => {
        const store = makeStore([sword()]);
        const actions = createAppActions(store);

        const a = actions.useItem('missing');
        const b = actions.useItem('long-blade');

        expect(a.applied).toBe(false);
        expect(b.applied).toBe(false);
    });
});

describe('equipItem action: reorders inventory by slot', () => {
    it('promotes the target weapon to be first in the weapon slot', () => {
        const store = makeStore([sword('first'), dagger('second')]);
        const actions = createAppActions(store);

        actions.equipItem('second');

        const inv = store.getState().player.inventory as readonly Item[];
        const weapons = inv.filter((i: Item) => i.category === 'equipment') as Equipment[];
        expect(weapons[0].id).toBe('second');
        expect(weapons[1].id).toBe('first');
    });

    it('reports `equipped` on the new first-in-slot via the VM', () => {
        const store = makeStore([sword('first'), dagger('second')]);
        const actions = createAppActions(store);

        actions.equipItem('second');

        const vm = selectInventoryViewModel(store.getState());
        const a = vm.items.find((i) => i.id === 'first')!;
        const b = vm.items.find((i) => i.id === 'second')!;
        expect(b.equipped).toBe(true);
        expect(a.equipped).toBe(false);
    });

    it('no-ops when the item is missing or not equipment', () => {
        const store = makeStore([potion('phial')]);
        const before = store.getState().player.inventory;
        const actions = createAppActions(store);

        actions.equipItem('missing');
        actions.equipItem('phial');

        expect(store.getState().player.inventory).toEqual(before);
    });
});

describe('dropItem action: removes the item, except quest items', () => {
    it('removes a discardable item from inventory', () => {
        const store = makeStore([sword()]);
        const actions = createAppActions(store);

        actions.dropItem('long-blade');

        expect(store.getState().player.inventory).toHaveLength(0);
    });

    it('refuses to drop a quest item', () => {
        const store = makeStore([tooth()]);
        const actions = createAppActions(store);

        actions.dropItem('hierophants-tooth');

        expect(store.getState().player.inventory).toHaveLength(1);
    });
});

// ---------------------------------------------------------------------------
// Lifecycle: createGameStore → addItem → useConsumable → save (Spec 09 hook)
// ---------------------------------------------------------------------------

describe('inventory lifecycle: persistence hook', () => {
    it('an addItem → useItem sequence does not call save until explicit', () => {
        const adapter = createMemoryAdapter();
        // Mobile boundary: `createAppStore` wraps the adapter so the
        // engine's per-dispatch autosave (mechanics 0.5.0+) is gated,
        // and only `actions.save()` reaches AsyncStorage.
        const store = createAppStore({
            adapter,
            overrides: {
                player: {
                    ...createCharacter({
                        name: 'Pilgrim',
                        level: 1,
                        baseStats: { heart: 4, body: 4, mind: 4 },
                    }),
                    health: 4,
                },
            },
        });
        const actions = createAppActions(store);
        const saveSpy = jest.spyOn(adapter, 'save');

        actions.addItem(potion('phial', 4, 1));
        actions.useItem('phial');

        expect(saveSpy).not.toHaveBeenCalled();

        actions.save();
        expect(saveSpy).toHaveBeenCalledTimes(1);
    });
});
