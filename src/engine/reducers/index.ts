/**
 * Reducer composition - combines all sub-reducers into the main game reducer
 */

import { GameState, GameAction } from '../types';
import { cowReducer, createColor, colorToString, averageColors, randomColor, createCow } from './cowReducer';
import { toolReducer } from './toolReducer';
import { resourceReducer } from './resourceReducer';
import { craftingReducer } from './craftingReducer';
import { uiReducer } from './uiReducer';
import { gameLoopReducer } from './gameLoopReducer';
import { saveReducer } from './saveReducer';

// Re-export helper functions
export { createColor, colorToString, averageColors, randomColor, createCow };

// All sub-reducers in order of priority
const subReducers = [
    cowReducer,
    toolReducer,
    resourceReducer,
    craftingReducer,
    uiReducer,
    gameLoopReducer,
    saveReducer,
];

/**
 * Composed game reducer - delegates to sub-reducers
 * Each sub-reducer returns null if it doesn't handle the action
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
    // Try each sub-reducer in order
    for (const reducer of subReducers) {
        const result = reducer(state, action);
        if (result !== null) {
            return result;
        }
    }
    
    // No reducer handled this action
    console.warn(`Unknown action type: ${action.type}`);
    return state;
}

export default gameReducer;

