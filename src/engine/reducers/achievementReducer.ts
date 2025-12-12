/**
 * Achievement reducer
 * Handles: CHECK_ACHIEVEMENTS
 */

import { ActionTypes, GameState, GameAction } from '../types';
import { checkAchievements } from '../achievements';

export function achievementReducer(state: GameState, action: GameAction): GameState | null {
    switch (action.type) {
        case ActionTypes.CHECK_ACHIEVEMENTS: {
            // Check for newly unlocked achievements
            const results = checkAchievements(state.stats, state.achievements.unlocked);
            
            // If nothing new, return unchanged state
            if (results.newlyUnlocked.length === 0) {
                return state;
            }
            
            // Record newly unlocked achievements and add XP to stats
            const now = Date.now();
            const newUnlocked = { ...state.achievements.unlocked };
            for (const achievement of results.newlyUnlocked) {
                const key = `${achievement.categoryId}:${achievement.tier}`;
                newUnlocked[key] = now;
            }
            
            return {
                ...state,
                achievements: {
                    ...state.achievements,
                    unlocked: newUnlocked,
                },
                stats: {
                    ...state.stats,
                    totalXpEarned: state.stats.totalXpEarned + results.totalXpAwarded,
                },
            };
        }

        default:
            return null; // Not handled by this reducer
    }
}

