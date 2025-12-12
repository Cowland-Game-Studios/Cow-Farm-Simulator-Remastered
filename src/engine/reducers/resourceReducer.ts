/**
 * Resource and inventory reducer actions
 * Handles: ADD_COINS, SPEND_COINS, ADD_ITEM, REMOVE_ITEM, SET_ITEM
 */

import { ActionTypes, GameState, GameAction } from '../types';

export function resourceReducer(state: GameState, action: GameAction): GameState | null {
    switch (action.type) {
        case ActionTypes.ADD_COINS: {
            const { amount } = action.payload as { amount: number };
            return {
                ...state,
                resources: { ...state.resources, coins: state.resources.coins + amount },
                stats: {
                    ...state.stats,
                    coinsEarned: state.stats.coinsEarned + amount,
                },
            };
        }

        case ActionTypes.SPEND_COINS: {
            const { amount } = action.payload as { amount: number };
            if (state.resources.coins < amount) return state;
            return {
                ...state,
                resources: { ...state.resources, coins: state.resources.coins - amount },
                stats: {
                    ...state.stats,
                    coinsSpent: state.stats.coinsSpent + amount,
                },
            };
        }

        case ActionTypes.ADD_ITEM: {
            const { itemType, amount = 1 } = action.payload as { itemType: string; amount?: number };
            if (!(itemType in state.inventory)) return state;
            return {
                ...state,
                inventory: {
                    ...state.inventory,
                    [itemType]: state.inventory[itemType] + amount,
                },
            };
        }

        case ActionTypes.REMOVE_ITEM: {
            const { itemType, amount = 1 } = action.payload as { itemType: string; amount?: number };
            if (!(itemType in state.inventory)) return state;
            if (state.inventory[itemType] < amount) return state;
            return {
                ...state,
                inventory: {
                    ...state.inventory,
                    [itemType]: state.inventory[itemType] - amount,
                },
            };
        }

        case ActionTypes.SET_ITEM: {
            const { itemType, amount } = action.payload as { itemType: string; amount: number };
            if (!(itemType in state.inventory)) return state;
            return {
                ...state,
                inventory: {
                    ...state.inventory,
                    [itemType]: Math.max(0, amount),
                },
            };
        }

        default:
            return null; // Not handled by this reducer
    }
}

