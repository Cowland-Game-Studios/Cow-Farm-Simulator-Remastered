/**
 * Game loop reducer (TICK action)
 * Handles time-based updates: cow fullness, crafting completion, playtime
 */

import { ActionTypes, GameState, GameAction, CowState, GameStats } from '../types';
import { GAME_CONFIG } from '../../config/gameConfig';

export function gameLoopReducer(state: GameState, action: GameAction): GameState | null {
    switch (action.type) {
        case ActionTypes.TICK: {
            const { delta } = action.payload as { delta: number }; // delta in ms
            
            if (state.ui.paused) return state;

            // Update play time
            const newPlayTime = state.playTime + delta / 1000;

            // Update milk production for all producing cows using timestamp-based calculation
            const now = Date.now();
            
            const updatedCows = state.cows.map(cow => {
                if (cow.state !== 'producing' || cow.lastFedAt === null) return cow;
                
                // Calculate fullness based on elapsed time since feeding
                const elapsedMs = now - cow.lastFedAt;
                const newFullness = Math.min(1, elapsedMs / GAME_CONFIG.COW.MILK_PRODUCTION_TIME_MS);
                const newState: CowState = newFullness >= 1 ? 'full' : 'producing';
                
                return { ...cow, fullness: newFullness, state: newState };
            });

            // Process crafting queue - auto-complete finished crafts
            const completedCrafts = state.craftingQueue.filter(craft => now >= craft.completesAt);
            const remainingCrafts = state.craftingQueue.filter(craft => now < craft.completesAt);

            // If there are completed crafts, produce their outputs and update stats
            let newInventory = state.inventory;
            let newStats: GameStats = state.stats;
            if (completedCrafts.length > 0) {
                newInventory = { ...state.inventory };
                newStats = { ...state.stats, itemsCrafted: state.stats.itemsCrafted + completedCrafts.length };
                for (const craft of completedCrafts) {
                    const recipe = GAME_CONFIG.RECIPES?.find(r => r.id === craft.recipeId);
                    if (recipe) {
                        for (const output of recipe.outputs) {
                            newInventory[output.item] = (newInventory[output.item] || 0) + output.qty;
                            // Update per-item crafting stats
                            const statKey = `${output.item}Crafted`;
                            if (statKey in newStats) {
                                newStats[statKey] = (newStats[statKey] || 0) + output.qty;
                            }
                        }
                    }
                }
            }

            return {
                ...state,
                playTime: newPlayTime,
                cows: updatedCows,
                inventory: newInventory,
                craftingQueue: remainingCrafts,
                stats: newStats,
            };
        }

        default:
            return null; // Not handled by this reducer
    }
}

