import {
    lootRarityItem,
    lootUncommonItemAction,
    lootRareItemAction,
    countAffixes,
} from '../loot-rarity';
import { createAppStore } from '@/state/store';
import type { Equipment } from 'axiomancer-mechanics';

describe('loot-rarity dev helper', () => {
    let store: ReturnType<typeof createAppStore>;

    beforeEach(() => {
        store = createAppStore();
    });

    it('countAffixes prefers rolledMods, falling back to prefix/suffix fields', () => {
        const base = {
            id: 'x',
            name: 'X',
            description: '',
            category: 'equipment',
            slot: 'weapon',
            rarity: 'uncommon',
            requiredLevel: 1,
        } as Equipment;
        expect(countAffixes(base)).toBe(0);
        // rolledMods is the engine-truth affix record (0.22.x).
        expect(countAffixes({ ...base, rolledMods: [{ modId: 'a', value: 1 }] })).toBe(1);
        expect(
            countAffixes({
                ...base,
                rolledMods: [
                    { modId: 'a', value: 1 },
                    { modId: 'b', value: 2 },
                ],
            }),
        ).toBe(2);
        // Fallback path when rolledMods is absent.
        expect(countAffixes({ ...base, prefixName: 'Keen' })).toBe(1);
        expect(countAffixes({ ...base, prefixId: 'a', suffixId: 'b' })).toBe(2);
    });

    it('loots a real uncommon drop with at least one affix', () => {
        const before = store.getState().player.inventory?.length ?? 0;
        const result = lootUncommonItemAction(store);

        expect(result.added).toBe(true);
        expect(result.rarity).toBe('uncommon');
        expect(result.name).toBeTruthy();
        expect(result.affixCount).toBeGreaterThanOrEqual(1);
        expect(store.getState().player.inventory?.length ?? 0).toBe(before + 1);
    });

    it('loots a real rare drop with at least two affixes', () => {
        const before = store.getState().player.inventory?.length ?? 0;
        const result = lootRareItemAction(store);

        expect(result.added).toBe(true);
        expect(result.rarity).toBe('rare');
        expect(result.name).toBeTruthy();
        expect(result.affixCount).toBeGreaterThanOrEqual(2);
        expect(store.getState().player.inventory?.length ?? 0).toBe(before + 1);
    });

    it('adds the generated item at the requested engine rarity', () => {
        lootRarityItem(store, 'rare');
        const inv = store.getState().player.inventory ?? [];
        const last = inv[inv.length - 1] as Equipment;
        expect(last.rarity).toBe('rare');
    });

    it('returns a graceful failure when no base template is level-eligible', () => {
        store.setState({
            player: { ...store.getState().player, level: 0 },
        });
        const before = store.getState().player.inventory?.length ?? 0;
        const result = lootRarityItem(store, 'uncommon');

        expect(result.added).toBe(false);
        expect(result.name).toBeNull();
        expect(result.affixCount).toBeNull();
        expect(result.reason).toBeTruthy();
        expect(store.getState().player.inventory?.length ?? 0).toBe(before);
    });
});
