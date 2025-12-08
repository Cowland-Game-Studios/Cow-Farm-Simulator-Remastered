/**
 * Game Engine Type Definitions
 * These serve as documentation and can be used with JSDoc for type hints
 */

/**
 * @typedef {'hungry' | 'producing' | 'full'} CowState
 */

/**
 * @typedef {Object} Position
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef {Object} Color
 * @property {number} r - 0-255
 * @property {number} g - 0-255
 * @property {number} b - 0-255
 * @property {number} a - 0-1
 */

/**
 * @typedef {Object} Cow
 * @property {string} id - UUID
 * @property {Color} color
 * @property {CowState} state
 * @property {number} fullness - 0-1
 * @property {Position} position
 * @property {number} lastBredAt - timestamp
 * @property {number} createdAt - timestamp
 */

/**
 * @typedef {Object} GameResources
 * @property {number} coins
 * @property {number} milk
 * @property {number} stars
 */

/**
 * @typedef {Object} ToolState
 * @property {boolean} milking
 * @property {boolean} feeding
 * @property {Position|null} toolPosition - Current position of active tool
 */

/**
 * @typedef {Object} UIState
 * @property {boolean} crafting
 * @property {boolean} paused
 * @property {boolean} saving
 */

/**
 * @typedef {Object} GameState
 * @property {string|null} userId - Supabase user ID
 * @property {string|null} saveId - Supabase save record ID
 * @property {Cow[]} cows
 * @property {GameResources} resources
 * @property {ToolState} tools
 * @property {UIState} ui
 * @property {number} lastSavedAt - timestamp
 * @property {number} playTime - total seconds played
 */

/**
 * @typedef {Object} CollisionEntity
 * @property {string} id
 * @property {Position} position
 * @property {number} radius
 * @property {string} type - 'cow' | 'tool' | 'other'
 */

// Action type constants
export const ActionTypes = {
    // Cow actions
    MILK_COW: 'MILK_COW',
    FEED_COW: 'FEED_COW',
    BREED_COWS: 'BREED_COWS',
    UPDATE_COW_FULLNESS: 'UPDATE_COW_FULLNESS',
    UPDATE_COW_POSITION: 'UPDATE_COW_POSITION',
    ADD_COW: 'ADD_COW',
    REMOVE_COW: 'REMOVE_COW',

    // Tool actions
    START_MILKING: 'START_MILKING',
    STOP_MILKING: 'STOP_MILKING',
    START_FEEDING: 'START_FEEDING',
    STOP_FEEDING: 'STOP_FEEDING',
    UPDATE_TOOL_POSITION: 'UPDATE_TOOL_POSITION',

    // Cow dragging (for breeding hover)
    SET_DRAGGING_COW: 'SET_DRAGGING_COW',
    CLEAR_DRAGGING_COW: 'CLEAR_DRAGGING_COW',

    // Resource actions
    ADD_COINS: 'ADD_COINS',
    ADD_MILK: 'ADD_MILK',
    SPEND_COINS: 'SPEND_COINS',

    // UI actions
    OPEN_CRAFTING: 'OPEN_CRAFTING',
    CLOSE_CRAFTING: 'CLOSE_CRAFTING',
    PAUSE_GAME: 'PAUSE_GAME',
    RESUME_GAME: 'RESUME_GAME',

    // Game loop
    TICK: 'TICK',

    // Save/Load
    LOAD_SAVE: 'LOAD_SAVE',
    MARK_SAVED: 'MARK_SAVED',
    SET_USER: 'SET_USER',
};

export default ActionTypes;

