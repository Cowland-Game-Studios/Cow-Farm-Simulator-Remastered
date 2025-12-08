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
 * @property {number} stars
 */

/**
 * @typedef {Object} Inventory
 * @property {number} milk
 * @property {number} grass
 * @property {number} cream
 * @property {number} butter
 * @property {number} cheese
 * @property {number} yogurt
 * @property {number} iceCream
 * @property {number} cheesecake
 */

/**
 * @typedef {Object} CraftingQueueItem
 * @property {string} id - UUID for this queue entry
 * @property {string} recipeId - Recipe identifier
 * @property {number} startedAt - Timestamp when crafting started
 * @property {number} completesAt - Timestamp when crafting completes
 */

/**
 * @typedef {'milk' | 'grass' | 'cream' | 'butter' | 'cheese' | 'yogurt' | 'iceCream' | 'cheesecake'} ItemType
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
 * @property {Inventory} inventory - All game items
 * @property {CraftingQueueItem[]} craftingQueue - Active crafting jobs
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
    SPEND_COINS: 'SPEND_COINS',

    // Inventory actions
    ADD_ITEM: 'ADD_ITEM',
    REMOVE_ITEM: 'REMOVE_ITEM',
    SET_ITEM: 'SET_ITEM',

    // Crafting actions
    CRAFT_INSTANT: 'CRAFT_INSTANT',
    START_CRAFTING: 'START_CRAFTING',
    COMPLETE_CRAFTING: 'COMPLETE_CRAFTING',
    CANCEL_CRAFTING: 'CANCEL_CRAFTING',

    // UI actions
    OPEN_CRAFTING: 'OPEN_CRAFTING',
    CLOSE_CRAFTING: 'CLOSE_CRAFTING',
    PAUSE_GAME: 'PAUSE_GAME',
    RESUME_GAME: 'RESUME_GAME',
    SET_CRAFTING_DRAG: 'SET_CRAFTING_DRAG',

    // Game loop
    TICK: 'TICK',

    // Save/Load
    LOAD_SAVE: 'LOAD_SAVE',
    MARK_SAVED: 'MARK_SAVED',
    SET_USER: 'SET_USER',

    // Chaos mode
    TRIGGER_CHAOS: 'TRIGGER_CHAOS',
    CLEAR_COW_IMPULSE: 'CLEAR_COW_IMPULSE',
};

export default ActionTypes;

