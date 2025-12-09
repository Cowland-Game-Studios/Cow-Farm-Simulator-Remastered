/**
 * Centralized Game State and Reducer
 * Designed for Supabase persistence
 * 
 * Reducer is split into sub-reducers for maintainability:
 * - cowReducer: cow actions (milk, feed, breed, position, etc.)
 * - toolReducer: tool state (milking, feeding)
 * - resourceReducer: coins and inventory
 * - craftingReducer: crafting queue and board crafting
 * - uiReducer: UI state (crafting menu, pause)
 * - gameLoopReducer: tick updates
 * - saveReducer: save/load
 */

import { v4 as uuidv4 } from 'uuid';
import { ActionTypes, GameState, Cow, Position, GameAction } from './types';
import { GAME_CONFIG } from '../config/gameConfig';

// Import composed reducer and helpers from reducers/
import { 
    gameReducer,
    createColor,
    colorToString,
    averageColors,
    randomColor,
    createCow,
} from './reducers';

// Re-export for backwards compatibility
export { gameReducer, createColor, colorToString, averageColors, randomColor, createCow };

// ============================================
// INITIAL STATE
// ============================================

/**
 * Default state - structured for Supabase serialization
 * All nested objects use simple types (no functions, no circular refs)
 */
export const createInitialState = (): GameState => ({
    // Auth/Save metadata
    userId: null,
    saveId: null,
    lastSavedAt: 0,
    playTime: 0,

    // Core game data
    cows: [
        {
            id: uuidv4(),
            color: randomColor(),
            state: 'full',
            fullness: 1,
            position: GAME_CONFIG.INITIAL_STATE.COW_POSITIONS[0],
            facingRight: false,
            lastFedAt: null,
            lastBredAt: 0,
            createdAt: Date.now(),
        },
        {
            id: uuidv4(),
            color: randomColor(),
            state: 'full',
            fullness: 1,
            position: GAME_CONFIG.INITIAL_STATE.COW_POSITIONS[1],
            facingRight: true,
            lastFedAt: null,
            lastBredAt: 0,
            createdAt: Date.now(),
        },
    ],

    resources: {
        coins: GAME_CONFIG.INITIAL_STATE.COINS,
        stars: GAME_CONFIG.INITIAL_STATE.STARS,
    },

    // Inventory system - tracks all items
    inventory: {
        // Raw resources
        milk: 0,
        grass: GAME_CONFIG.INITIAL_STATE.GRASS,
        
        // Crafted products
        cream: 0,
        butter: 0,
        cheese: 0,
        yogurt: 0,
        iceCream: 0,
        cheesecake: 0,
    },

    // Active crafting queue (for timed recipes)
    craftingQueue: [],

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
        draggingCraftingItem: false,
    },

    // Chaos mode impulses: { cowId: { x, y } }
    chaosImpulses: {},
    
    // Active board crafting (timed recipes in progress on the crafting table)
    activeBoardCraft: null,
});

// ============================================
// ACTION CREATORS
// ============================================

export const actions = {
    // Cow
    milkCow: (cowId: string): GameAction => ({ type: ActionTypes.MILK_COW, payload: { cowId } }),
    feedCow: (cowId: string): GameAction => ({ type: ActionTypes.FEED_COW, payload: { cowId } }),
    breedCows: (cowId1: string, cowId2: string, spawnPosition: Position): GameAction => ({ 
        type: ActionTypes.BREED_COWS, 
        payload: { cowId1, cowId2, spawnPosition } 
    }),
    updateCowFullness: (cowId: string, fullness: number): GameAction => ({ 
        type: ActionTypes.UPDATE_COW_FULLNESS, 
        payload: { cowId, fullness } 
    }),
    updateCowPosition: (cowId: string, position: Position): GameAction => ({ 
        type: ActionTypes.UPDATE_COW_POSITION, 
        payload: { cowId, position } 
    }),
    updateCowFacing: (cowId: string, facingRight: boolean): GameAction => ({ 
        type: ActionTypes.UPDATE_COW_FACING, 
        payload: { cowId, facingRight } 
    }),
    addCow: (cow: Cow): GameAction => ({ type: ActionTypes.ADD_COW, payload: { cow } }),
    removeCow: (cowId: string): GameAction => ({ type: ActionTypes.REMOVE_COW, payload: { cowId } }),

    // Tools
    startMilking: (): GameAction => ({ type: ActionTypes.START_MILKING }),
    stopMilking: (): GameAction => ({ type: ActionTypes.STOP_MILKING }),
    startFeeding: (): GameAction => ({ type: ActionTypes.START_FEEDING }),
    stopFeeding: (): GameAction => ({ type: ActionTypes.STOP_FEEDING }),
    updateToolPosition: (position: Position): GameAction => ({ 
        type: ActionTypes.UPDATE_TOOL_POSITION, 
        payload: { position } 
    }),

    // Cow dragging (for breeding hover)
    setDraggingCow: (cowId: string, position: Position): GameAction => ({
        type: ActionTypes.SET_DRAGGING_COW,
        payload: { cowId, position },
    }),
    clearDraggingCow: (): GameAction => ({ type: ActionTypes.CLEAR_DRAGGING_COW }),

    // Resources
    addCoins: (amount: number): GameAction => ({ type: ActionTypes.ADD_COINS, payload: { amount } }),
    spendCoins: (amount: number): GameAction => ({ type: ActionTypes.SPEND_COINS, payload: { amount } }),

    // Inventory
    addItem: (itemType: string, amount: number = 1): GameAction => ({ 
        type: ActionTypes.ADD_ITEM, 
        payload: { itemType, amount } 
    }),
    removeItem: (itemType: string, amount: number = 1): GameAction => ({ 
        type: ActionTypes.REMOVE_ITEM, 
        payload: { itemType, amount } 
    }),
    setItem: (itemType: string, amount: number): GameAction => ({ 
        type: ActionTypes.SET_ITEM, 
        payload: { itemType, amount } 
    }),

    // Crafting
    craftInstant: (recipeId: string): GameAction => ({ 
        type: ActionTypes.CRAFT_INSTANT, 
        payload: { recipeId } 
    }),
    startCrafting: (recipeId: string): GameAction => ({ 
        type: ActionTypes.START_CRAFTING, 
        payload: { recipeId } 
    }),
    completeCrafting: (craftingId: string): GameAction => ({ 
        type: ActionTypes.COMPLETE_CRAFTING, 
        payload: { craftingId } 
    }),
    cancelCrafting: (craftingId: string): GameAction => ({ 
        type: ActionTypes.CANCEL_CRAFTING, 
        payload: { craftingId } 
    }),
    
    // Board crafting (timed crafting on table)
    setBoardCraft: (craftData: GameState['activeBoardCraft']): GameAction => ({
        type: ActionTypes.SET_BOARD_CRAFT,
        payload: craftData,
    }),
    clearBoardCraft: (): GameAction => ({
        type: ActionTypes.CLEAR_BOARD_CRAFT,
    }),

    // UI
    openCrafting: (): GameAction => ({ type: ActionTypes.OPEN_CRAFTING }),
    closeCrafting: (): GameAction => ({ type: ActionTypes.CLOSE_CRAFTING }),
    pauseGame: (): GameAction => ({ type: ActionTypes.PAUSE_GAME }),
    resumeGame: (): GameAction => ({ type: ActionTypes.RESUME_GAME }),
    setCraftingDrag: (isDragging: boolean): GameAction => ({ type: ActionTypes.SET_CRAFTING_DRAG, payload: { isDragging } }),

    // Game loop
    tick: (delta: number): GameAction => ({ type: ActionTypes.TICK, payload: { delta } }),

    // Save/Load
    loadSave: (saveData: Partial<GameState>): GameAction => ({ type: ActionTypes.LOAD_SAVE, payload: { saveData } }),
    markSaved: (saveId: string, timestamp: number): GameAction => ({ 
        type: ActionTypes.MARK_SAVED, 
        payload: { saveId, timestamp } 
    }),
    setUser: (userId: string): GameAction => ({ type: ActionTypes.SET_USER, payload: { userId } }),

    // Chaos mode
    triggerChaos: (impulses: { [cowId: string]: Position }): GameAction => ({ type: ActionTypes.TRIGGER_CHAOS, payload: { impulses } }),
    clearCowImpulse: (cowId: string): GameAction => ({ type: ActionTypes.CLEAR_COW_IMPULSE, payload: { cowId } }),
};

export default gameReducer;
