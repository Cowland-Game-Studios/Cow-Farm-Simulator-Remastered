/**
 * Save/Load reducer actions
 * Handles: LOAD_SAVE, MARK_SAVED, SET_USER
 */

import { ActionTypes, GameState, GameAction } from '../types';

export function saveReducer(state: GameState, action: GameAction): GameState | null {
    switch (action.type) {
        case ActionTypes.LOAD_SAVE: {
            const { saveData } = action.payload as { saveData: Partial<GameState> };
            return {
                ...state,
                ...saveData,
                // Reset runtime state
                tools: { milking: false, feeding: false, toolPosition: null },
                ui: { ...state.ui, crafting: false, paused: false, saving: false },
            };
        }

        case ActionTypes.MARK_SAVED: {
            const { saveId, timestamp } = action.payload as { saveId: string; timestamp: number };
            return {
                ...state,
                saveId,
                lastSavedAt: timestamp,
                ui: { ...state.ui, saving: false },
            };
        }

        case ActionTypes.SET_USER: {
            const { userId } = action.payload as { userId: string };
            return { ...state, userId };
        }

        default:
            return null; // Not handled by this reducer
    }
}

