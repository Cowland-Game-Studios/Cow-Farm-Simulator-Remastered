/**
 * Achievement reducer
 * Handles: CHECK_ACHIEVEMENTS
 */

import { ActionTypes, GameState, GameAction } from '../types';
import { 
    checkAchievements, 
    applyAchievementResults,
    getLevelFromXp 
} from '../achievements';

export function achievementReducer(state: GameState, action: GameAction): GameState | null {
    switch (action.type) {
        case ActionTypes.CHECK_ACHIEVEMENTS: {
            // Check for newly unlocked achievements
            const results = checkAchievements(state.stats, state.achievements.unlocked);
            
            // If nothing new, return unchanged state
            if (results.newlyUnlocked.length === 0) {
                return state;
            }
            
            // Apply the results
            const { achievements, xp } = applyAchievementResults(
                state.achievements,
                state.xp,
                results
            );
            
            // Calculate new level from total XP
            const levelInfo = getLevelFromXp(xp);
            
            return {
                ...state,
                achievements,
                xp,
                level: levelInfo.level,
            };
        }

        default:
            return null; // Not handled by this reducer
    }
}

