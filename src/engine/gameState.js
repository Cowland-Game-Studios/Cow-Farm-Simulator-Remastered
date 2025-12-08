/**
 * Centralized Game State and Reducer
 * Designed for Supabase persistence
 */

import { v4 as uuidv4 } from 'uuid';
import { ActionTypes } from './types';
import { GAME_CONFIG } from '../config/gameConfig';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Create a color object from RGB values
 */
export const createColor = (r, g, b, a = GAME_CONFIG.VISUAL.COW_COLOR_OPACITY) => ({
    r, g, b, a
});

/**
 * Convert color object to CSS rgba string
 */
export const colorToString = (color) => {
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
};

/**
 * Average two colors for breeding
 */
export const averageColors = (c1, c2) => ({
    r: Math.round((c1.r + c2.r) / 2),
    g: Math.round((c1.g + c2.g) / 2),
    b: Math.round((c1.b + c2.b) / 2),
    a: GAME_CONFIG.VISUAL.COW_COLOR_OPACITY,
});

/**
 * Create a new cow object
 */
export const createCow = (color, position = null) => ({
    id: uuidv4(),
    color,
    state: 'hungry',
    fullness: GAME_CONFIG.COW.INITIAL_FULLNESS_HUNGRY,
    position: position || { x: 0, y: 0 },
    lastBredAt: 0,
    createdAt: Date.now(),
});

// ============================================
// INITIAL STATE
// ============================================

/**
 * Default state - structured for Supabase serialization
 * All nested objects use simple types (no functions, no circular refs)
 */
export const createInitialState = () => ({
    // Auth/Save metadata
    userId: null,
    saveId: null,
    lastSavedAt: 0,
    playTime: 0,

    // Core game data
    cows: [
        {
            id: uuidv4(),
            color: createColor(255, 0, 0),
            state: 'full',
            fullness: 1,
            position: { x: 200, y: 300 },
            lastBredAt: 0,
            createdAt: Date.now(),
        },
        {
            id: uuidv4(),
            color: createColor(255, 230, 0),
            state: 'full',
            fullness: 1,
            position: { x: 400, y: 300 },
            lastBredAt: 0,
            createdAt: Date.now(),
        },
        {
            id: uuidv4(),
            color: createColor(0, 0, 255),
            state: 'full',
            fullness: 1,
            position: { x: 600, y: 300 },
            lastBredAt: 0,
            createdAt: Date.now(),
        },
    ],

    resources: {
        coins: 10000,
        milk: 0,
        stars: 5.2,
    },

    // Runtime state (not saved to DB)
    tools: {
        milking: false,
        feeding: false,
        toolPosition: null,
    },

    // Dragging state (for breeding hover indicator)
    draggingCow: {
        cowId: null,
        position: null,
    },

    ui: {
        crafting: false,
        paused: false,
        saving: false,
    },
});

// ============================================
// REDUCER
// ============================================

/**
 * Main game reducer - handles all state mutations
 */
export function gameReducer(state, action) {
    switch (action.type) {
        // ---- COW ACTIONS ----
        
        case ActionTypes.MILK_COW: {
            const { cowId } = action.payload;
            return {
                ...state,
                cows: state.cows.map(cow =>
                    cow.id === cowId && cow.state === 'full'
                        ? { 
                            ...cow, 
                            state: 'hungry', 
                            fullness: GAME_CONFIG.COW.INITIAL_FULLNESS_HUNGRY 
                          }
                        : cow
                ),
                resources: {
                    ...state.resources,
                    milk: state.resources.milk + 1,
                },
            };
        }

        case ActionTypes.FEED_COW: {
            const { cowId } = action.payload;
            return {
                ...state,
                cows: state.cows.map(cow =>
                    cow.id === cowId && cow.state === 'hungry'
                        ? { 
                            ...cow, 
                            state: 'producing', 
                            fullness: GAME_CONFIG.COW.INITIAL_FULLNESS_PRODUCING 
                          }
                        : cow
                ),
            };
        }

        case ActionTypes.BREED_COWS: {
            const { cowId1, cowId2, spawnPosition } = action.payload;
            const cow1 = state.cows.find(c => c.id === cowId1);
            const cow2 = state.cows.find(c => c.id === cowId2);

            if (!cow1 || !cow2) return state;

            const now = Date.now();
            const cooldown = GAME_CONFIG.COW.BREEDING_COOLDOWN_MS;

            // Check cooldowns
            if (now - cow1.lastBredAt < cooldown || now - cow2.lastBredAt < cooldown) {
                return state;
            }

            const newCow = {
                ...createCow(averageColors(cow1.color, cow2.color), spawnPosition),
            };

            return {
                ...state,
                cows: [
                    ...state.cows.map(cow => {
                        if (cow.id === cowId1 || cow.id === cowId2) {
                            return {
                                ...cow,
                                state: 'hungry',
                                fullness: GAME_CONFIG.COW.INITIAL_FULLNESS_HUNGRY,
                                lastBredAt: now,
                            };
                        }
                        return cow;
                    }),
                    newCow,
                ],
            };
        }

        case ActionTypes.UPDATE_COW_FULLNESS: {
            const { cowId, fullness } = action.payload;
            return {
                ...state,
                cows: state.cows.map(cow => {
                    if (cow.id !== cowId) return cow;
                    
                    const newFullness = Math.min(1, fullness);
                    const newState = newFullness >= 1 ? 'full' : cow.state;
                    
                    return { ...cow, fullness: newFullness, state: newState };
                }),
            };
        }

        case ActionTypes.UPDATE_COW_POSITION: {
            const { cowId, position } = action.payload;
            return {
                ...state,
                cows: state.cows.map(cow =>
                    cow.id === cowId ? { ...cow, position } : cow
                ),
            };
        }

        case ActionTypes.ADD_COW: {
            const { cow } = action.payload;
            return {
                ...state,
                cows: [...state.cows, cow],
            };
        }

        case ActionTypes.REMOVE_COW: {
            const { cowId } = action.payload;
            return {
                ...state,
                cows: state.cows.filter(cow => cow.id !== cowId),
            };
        }

        // ---- TOOL ACTIONS ----

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
            const { position } = action.payload;
            return {
                ...state,
                tools: { ...state.tools, toolPosition: position },
            };
        }

        // ---- COW DRAGGING (for breeding hover) ----

        case ActionTypes.SET_DRAGGING_COW: {
            const { cowId, position } = action.payload;
            return {
                ...state,
                draggingCow: { cowId, position },
            };
        }

        case ActionTypes.CLEAR_DRAGGING_COW: {
            return {
                ...state,
                draggingCow: { cowId: null, position: null },
            };
        }

        // ---- RESOURCE ACTIONS ----

        case ActionTypes.ADD_COINS: {
            const { amount } = action.payload;
            return {
                ...state,
                resources: { ...state.resources, coins: state.resources.coins + amount },
            };
        }

        case ActionTypes.ADD_MILK: {
            const { amount } = action.payload;
            return {
                ...state,
                resources: { ...state.resources, milk: state.resources.milk + amount },
            };
        }

        case ActionTypes.SPEND_COINS: {
            const { amount } = action.payload;
            if (state.resources.coins < amount) return state;
            return {
                ...state,
                resources: { ...state.resources, coins: state.resources.coins - amount },
            };
        }

        // ---- UI ACTIONS ----

        case ActionTypes.OPEN_CRAFTING:
            return { ...state, ui: { ...state.ui, crafting: true } };

        case ActionTypes.CLOSE_CRAFTING:
            return { ...state, ui: { ...state.ui, crafting: false } };

        case ActionTypes.PAUSE_GAME:
            return { ...state, ui: { ...state.ui, paused: true } };

        case ActionTypes.RESUME_GAME:
            return { ...state, ui: { ...state.ui, paused: false } };

        // ---- GAME LOOP ----

        case ActionTypes.TICK: {
            const { delta } = action.payload; // delta in ms
            
            if (state.ui.paused) return state;

            // Update play time
            const newPlayTime = state.playTime + delta / 1000;

            // Update milk production for all producing cows
            const fullnessIncrement = delta / GAME_CONFIG.COW.MILK_PRODUCTION_TIME_MS;
            
            const updatedCows = state.cows.map(cow => {
                if (cow.state !== 'producing') return cow;
                
                const newFullness = Math.min(1, cow.fullness + fullnessIncrement);
                const newState = newFullness >= 1 ? 'full' : 'producing';
                
                return { ...cow, fullness: newFullness, state: newState };
            });

            return {
                ...state,
                playTime: newPlayTime,
                cows: updatedCows,
            };
        }

        // ---- SAVE/LOAD ----

        case ActionTypes.LOAD_SAVE: {
            const { saveData } = action.payload;
            return {
                ...state,
                ...saveData,
                // Reset runtime state
                tools: { milking: false, feeding: false, toolPosition: null },
                ui: { ...state.ui, crafting: false, paused: false, saving: false },
            };
        }

        case ActionTypes.MARK_SAVED: {
            const { saveId, timestamp } = action.payload;
            return {
                ...state,
                saveId,
                lastSavedAt: timestamp,
                ui: { ...state.ui, saving: false },
            };
        }

        case ActionTypes.SET_USER: {
            const { userId } = action.payload;
            return { ...state, userId };
        }

        default:
            console.warn(`Unknown action type: ${action.type}`);
            return state;
    }
}

// ============================================
// ACTION CREATORS
// ============================================

export const actions = {
    // Cow
    milkCow: (cowId) => ({ type: ActionTypes.MILK_COW, payload: { cowId } }),
    feedCow: (cowId) => ({ type: ActionTypes.FEED_COW, payload: { cowId } }),
    breedCows: (cowId1, cowId2, spawnPosition) => ({ 
        type: ActionTypes.BREED_COWS, 
        payload: { cowId1, cowId2, spawnPosition } 
    }),
    updateCowFullness: (cowId, fullness) => ({ 
        type: ActionTypes.UPDATE_COW_FULLNESS, 
        payload: { cowId, fullness } 
    }),
    updateCowPosition: (cowId, position) => ({ 
        type: ActionTypes.UPDATE_COW_POSITION, 
        payload: { cowId, position } 
    }),
    addCow: (cow) => ({ type: ActionTypes.ADD_COW, payload: { cow } }),
    removeCow: (cowId) => ({ type: ActionTypes.REMOVE_COW, payload: { cowId } }),

    // Tools
    startMilking: () => ({ type: ActionTypes.START_MILKING }),
    stopMilking: () => ({ type: ActionTypes.STOP_MILKING }),
    startFeeding: () => ({ type: ActionTypes.START_FEEDING }),
    stopFeeding: () => ({ type: ActionTypes.STOP_FEEDING }),
    updateToolPosition: (position) => ({ 
        type: ActionTypes.UPDATE_TOOL_POSITION, 
        payload: { position } 
    }),

    // Cow dragging (for breeding hover)
    setDraggingCow: (cowId, position) => ({
        type: ActionTypes.SET_DRAGGING_COW,
        payload: { cowId, position },
    }),
    clearDraggingCow: () => ({ type: ActionTypes.CLEAR_DRAGGING_COW }),

    // Resources
    addCoins: (amount) => ({ type: ActionTypes.ADD_COINS, payload: { amount } }),
    addMilk: (amount) => ({ type: ActionTypes.ADD_MILK, payload: { amount } }),
    spendCoins: (amount) => ({ type: ActionTypes.SPEND_COINS, payload: { amount } }),

    // UI
    openCrafting: () => ({ type: ActionTypes.OPEN_CRAFTING }),
    closeCrafting: () => ({ type: ActionTypes.CLOSE_CRAFTING }),
    pauseGame: () => ({ type: ActionTypes.PAUSE_GAME }),
    resumeGame: () => ({ type: ActionTypes.RESUME_GAME }),

    // Game loop
    tick: (delta) => ({ type: ActionTypes.TICK, payload: { delta } }),

    // Save/Load
    loadSave: (saveData) => ({ type: ActionTypes.LOAD_SAVE, payload: { saveData } }),
    markSaved: (saveId, timestamp) => ({ 
        type: ActionTypes.MARK_SAVED, 
        payload: { saveId, timestamp } 
    }),
    setUser: (userId) => ({ type: ActionTypes.SET_USER, payload: { userId } }),
};

export default gameReducer;

