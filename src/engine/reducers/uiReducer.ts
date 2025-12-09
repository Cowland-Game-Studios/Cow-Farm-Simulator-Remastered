/**
 * UI-related reducer actions
 * Handles: OPEN_CRAFTING, CLOSE_CRAFTING, PAUSE_GAME, RESUME_GAME, SET_CRAFTING_DRAG
 */

import { ActionTypes, GameState, GameAction } from '../types';

export function uiReducer(state: GameState, action: GameAction): GameState | null {
    switch (action.type) {
        case ActionTypes.OPEN_CRAFTING:
            return { ...state, ui: { ...state.ui, crafting: true } };

        case ActionTypes.CLOSE_CRAFTING:
            return { ...state, ui: { ...state.ui, crafting: false } };

        case ActionTypes.PAUSE_GAME:
            return { ...state, ui: { ...state.ui, paused: true } };

        case ActionTypes.RESUME_GAME:
            return { ...state, ui: { ...state.ui, paused: false } };

        case ActionTypes.SET_CRAFTING_DRAG:
            return { 
                ...state, 
                ui: { 
                    ...state.ui, 
                    draggingCraftingItem: (action.payload as { isDragging: boolean }).isDragging 
                } 
            };

        default:
            return null; // Not handled by this reducer
    }
}

