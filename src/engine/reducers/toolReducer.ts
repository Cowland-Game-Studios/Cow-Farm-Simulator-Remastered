/**
 * Tool-related reducer actions
 * Handles: START_MILKING, STOP_MILKING, START_FEEDING, STOP_FEEDING, UPDATE_TOOL_POSITION
 */

import { ActionTypes, GameState, Position, GameAction } from '../types';

export function toolReducer(state: GameState, action: GameAction): GameState | null {
    switch (action.type) {
        case ActionTypes.START_MILKING:
            return {
                ...state,
                tools: { ...state.tools, milking: true, feeding: false },
            };

        case ActionTypes.STOP_MILKING:
            return {
                ...state,
                tools: { ...state.tools, milking: false, toolPosition: null },
            };

        case ActionTypes.START_FEEDING:
            return {
                ...state,
                tools: { ...state.tools, feeding: true, milking: false },
            };

        case ActionTypes.STOP_FEEDING:
            return {
                ...state,
                tools: { ...state.tools, feeding: false, toolPosition: null },
            };

        case ActionTypes.UPDATE_TOOL_POSITION: {
            const { position } = action.payload as { position: Position };
            return {
                ...state,
                tools: { ...state.tools, toolPosition: position },
            };
        }

        default:
            return null; // Not handled by this reducer
    }
}

