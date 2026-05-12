import {
    setPhase as combatSetPhase,
    setPlayerStance as combatSetPlayerStance,
    type CombatPhase,
    type Enemy,
    type Item,
    type Stance,
} from 'axiomancer-mechanics';
import type { AppStore } from './store';

export interface AppActions {
    startCombat: (enemy: Enemy) => void;
    endCombat: () => void;
    setCombatPhase: (phase: CombatPhase) => void;
    setPlayerStance: (stance: Stance) => void;
    addItem: (item: Item) => void;
    removeItem: (itemId: string) => void;
    useConsumable: (itemId: string) => void;
    save: () => void;
}

export function createAppActions(store: AppStore): AppActions {
    return {
        startCombat: (enemy) => store.getState().startCombat(enemy),
        endCombat: () => store.getState().endCombat(),
        setCombatPhase: (phase) => {
            const { combat, updateCombat } = store.getState();
            if (!combat) return;
            updateCombat(combatSetPhase(combat, phase));
        },
        setPlayerStance: (stance) => {
            const { combat, updateCombat } = store.getState();
            if (!combat) return;
            updateCombat(combatSetPlayerStance(combat, stance));
        },
        addItem: (item) => store.getState().addItem(item),
        removeItem: (itemId) => store.getState().removeItem(itemId),
        useConsumable: (itemId) => store.getState().useConsumable(itemId),
        save: () => store.getState().save(),
    };
}
