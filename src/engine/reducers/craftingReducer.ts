/**
 * Crafting-related reducer actions
 * Handles: CRAFT_INSTANT, START_CRAFTING, COMPLETE_CRAFTING, CANCEL_CRAFTING, BOARD_CRAFT
 */

import { ActionTypes, GameState, GameAction } from '../types';
import { GAME_CONFIG } from '../../config/gameConfig';

export function craftingReducer(state: GameState, action: GameAction): GameState | null {
    switch (action.type) {
        case ActionTypes.CRAFT_INSTANT: {
            const { recipeId } = action.payload as { recipeId: string };
            const recipe = GAME_CONFIG.RECIPES?.find(r => r.id === recipeId);
            
            if (!recipe) {
                console.warn(`Unknown recipe: ${recipeId}`);
                return state;
            }

            // Check if we have enough inputs
            for (const input of recipe.inputs) {
                if (state.inventory[input.item] < input.qty) {
                    console.warn(`Not enough ${input.item} for recipe ${recipeId}`);
                    return state;
                }
            }

            // Consume inputs and produce outputs
            const newInventory = { ...state.inventory };
            
            for (const input of recipe.inputs) {
                newInventory[input.item] -= input.qty;
            }
            
            for (const output of recipe.outputs) {
                newInventory[output.item] += output.qty;
            }

            return {
                ...state,
                inventory: newInventory,
            };
        }

        case ActionTypes.START_CRAFTING: {
            const { recipeId } = action.payload as { recipeId: string };
            const recipe = GAME_CONFIG.RECIPES?.find(r => r.id === recipeId);
            
            if (!recipe) {
                console.warn(`Unknown recipe: ${recipeId}`);
                return state;
            }

            // Check if we have enough inputs
            for (const input of recipe.inputs) {
                if (state.inventory[input.item] < input.qty) {
                    console.warn(`Not enough ${input.item} for recipe ${recipeId}`);
                    return state;
                }
            }

            // Consume inputs immediately
            const newInventory = { ...state.inventory };
            for (const input of recipe.inputs) {
                newInventory[input.item] -= input.qty;
            }

            // Add to crafting queue
            const now = Date.now();
            const craftingEntry = {
                id: `craft_${now}_${Math.random().toString(36).substr(2, 9)}`,
                recipeId,
                startedAt: now,
                completesAt: now + (recipe.time * 1000),
            };

            return {
                ...state,
                inventory: newInventory,
                craftingQueue: [...state.craftingQueue, craftingEntry],
            };
        }

        case ActionTypes.COMPLETE_CRAFTING: {
            const { craftingId } = action.payload as { craftingId: string };
            const craftingEntry = state.craftingQueue.find(c => c.id === craftingId);
            
            if (!craftingEntry) {
                return state;
            }

            const recipe = GAME_CONFIG.RECIPES?.find(r => r.id === craftingEntry.recipeId);
            if (!recipe) {
                return {
                    ...state,
                    craftingQueue: state.craftingQueue.filter(c => c.id !== craftingId),
                };
            }

            // Produce outputs
            const newInventory = { ...state.inventory };
            for (const output of recipe.outputs) {
                newInventory[output.item] += output.qty;
            }

            return {
                ...state,
                inventory: newInventory,
                craftingQueue: state.craftingQueue.filter(c => c.id !== craftingId),
            };
        }

        case ActionTypes.CANCEL_CRAFTING: {
            const { craftingId } = action.payload as { craftingId: string };
            const craftingEntry = state.craftingQueue.find(c => c.id === craftingId);
            
            if (!craftingEntry) {
                return state;
            }

            // Refund inputs
            const recipe = GAME_CONFIG.RECIPES?.find(r => r.id === craftingEntry.recipeId);
            if (!recipe) {
                return {
                    ...state,
                    craftingQueue: state.craftingQueue.filter(c => c.id !== craftingId),
                };
            }

            const newInventory = { ...state.inventory };
            for (const input of recipe.inputs) {
                newInventory[input.item] += input.qty;
            }

            return {
                ...state,
                inventory: newInventory,
                craftingQueue: state.craftingQueue.filter(c => c.id !== craftingId),
            };
        }

        case ActionTypes.SET_BOARD_CRAFT: {
            return {
                ...state,
                activeBoardCraft: action.payload as GameState['activeBoardCraft'],
            };
        }
        
        case ActionTypes.CLEAR_BOARD_CRAFT: {
            return {
                ...state,
                activeBoardCraft: null,
            };
        }

        default:
            return null; // Not handled by this reducer
    }
}

