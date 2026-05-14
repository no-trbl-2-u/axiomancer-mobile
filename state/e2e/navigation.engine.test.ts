/**
 * Hermetic e2e tests for navigation.engine.ts presenters.
 *
 * Covers selectActiveTab, selectTabBadges, and selectNavigationViewModel
 * against various game states.
 */

import { createGameStore, createEnemy } from 'axiomancer-mechanics';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';
import { 
    selectActiveTab, 
    selectTabBadges, 
    selectNavigationViewModel,
    type NavigationViewModel 
} from '../presenters/navigation.engine';

function makeEnemy() {
    return createEnemy({
        id: 'test-enemy',
        name: 'Test Foe',
        description: 'A test enemy for navigation tests.',
        level: 1,
        baseStats: { heart: 5, body: 5, mind: 5 },
        mapName: 'test-map' as never,
        logic: 'random' as never,
    });
}

describe('navigation.engine', () => {
    describe('selectActiveTab', () => {
        it('returns combat when in combat', () => {
            const store = createGameStore(createMemoryAdapter());
            
            // Start combat to set combat state
            store.getState().startCombat(makeEnemy());
            
            const result = selectActiveTab(store.getState());
            expect(result).toBe('combat');
        });

        it('returns exploration when not in combat and no active event', () => {
            const store = createGameStore(createMemoryAdapter());
            
            const result = selectActiveTab(store.getState());
            expect(result).toBe('exploration');
        });

        it('returns exploration when combat ends', () => {
            const store = createGameStore(createMemoryAdapter());
            
            // Start then end combat
            store.getState().startCombat(makeEnemy());
            store.getState().endCombat();
            
            const result = selectActiveTab(store.getState());
            expect(result).toBe('exploration');
        });
    });

    describe('selectTabBadges', () => {
        it('returns empty badges for fresh game state', () => {
            const store = createGameStore(createMemoryAdapter());
            
            const result = selectTabBadges(store.getState());
            
            expect(result).toEqual({
                exploration: null,
                combat: null,
                character: null,
                inventory: null,
                event: null,
            });
        });

        it('maintains stable badge object shape', () => {
            const store = createGameStore(createMemoryAdapter());
            
            const result1 = selectTabBadges(store.getState());
            const result2 = selectTabBadges(store.getState());
            
            expect(Object.keys(result1)).toEqual(Object.keys(result2));
            expect(result1).toEqual(result2);
        });
    });

    describe('selectNavigationViewModel', () => {
        it('combines active tab and badges correctly', () => {
            const store = createGameStore(createMemoryAdapter());
            
            const result = selectNavigationViewModel(store.getState());
            
            expect(result).toMatchObject({
                activeTab: 'exploration',
                badges: expect.objectContaining({
                    exploration: null,
                    combat: null,
                    character: null,
                    inventory: null,
                    event: null,
                }),
            });
        });

        it('reflects combat state in active tab', () => {
            const store = createGameStore(createMemoryAdapter());
            
            // Start combat
            store.getState().startCombat(makeEnemy());
            
            const result = selectNavigationViewModel(store.getState());
            expect(result.activeTab).toBe('combat');
        });

        it('is frozen in development', () => {
            const store = createGameStore(createMemoryAdapter());
            
            const result = selectNavigationViewModel(store.getState());
            
            expect(Object.isFrozen(result)).toBe(true);
            expect(Object.isFrozen(result.badges)).toBe(true);
        });

        it('maintains referential stability for same input', () => {
            const store = createGameStore(createMemoryAdapter());
            const state = store.getState();
            
            const result1 = selectNavigationViewModel(state);
            const result2 = selectNavigationViewModel(state);
            
            expect(result1.activeTab).toBe(result2.activeTab);
            expect(result1.badges).toEqual(result2.badges);
        });
    });
});