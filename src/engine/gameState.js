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
 * Generate a random vibrant color
 */
export const randomColor = () => {
    // Generate vibrant colors by using high saturation
    const hue = Math.random() * 360;
    const saturation = 70 + Math.random() * 30; // 70-100%
    const lightness = 45 + Math.random() * 20;  // 45-65%
    
    // Convert HSL to RGB
    const c = (1 - Math.abs(2 * lightness / 100 - 1)) * saturation / 100;
    const x = c * (1 - Math.abs((hue / 60) % 2 - 1));
    const m = lightness / 100 - c / 2;
    
    let r, g, b;
    if (hue < 60) { r = c; g = x; b = 0; }
    else if (hue < 120) { r = x; g = c; b = 0; }
    else if (hue < 180) { r = 0; g = c; b = x; }
    else if (hue < 240) { r = 0; g = x; b = c; }
    else if (hue < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    
    return createColor(
        Math.round((r + m) * 255),
        Math.round((g + m) * 255),
        Math.round((b + m) * 255)
    );
};

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
            color: randomColor(),
            state: 'full',
            fullness: 1,
            position: { x: 300, y: 300 },
            lastBredAt: 0,
            createdAt: Date.now(),
        },
        {
            id: uuidv4(),
            color: randomColor(),
            state: 'full',
            fullness: 1,
            position: { x: 500, y: 300 },
            lastBredAt: 0,
            createdAt: Date.now(),
        },
    ],

    resources: {
        coins: 10000,
        stars: 5.2,
    },

    // Inventory system - tracks all items
    inventory: {
        // Raw resources
        milk: 0,
        grass: 10, // Starting grass for feeding cows
        
        // Crafted products
        cream: 0,
        butter: 0,
        cheese: 0,
        yogurt: 0,
        iceCream: 0,
        cheesecake: 0,
    },

    // Active crafting queue (for timed recipes)
    // Each entry: { id, recipeId, startedAt, completesAt }
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
            
            // Check if the cow exists and is full
            const cow = state.cows.find(c => c.id === cowId);
            if (!cow || cow.state !== 'full') {
                return state;
            }
            
            return {
                ...state,
                cows: state.cows.map(c =>
                    c.id === cowId
                        ? { 
                            ...c, 
                            state: 'hungry', 
                            fullness: GAME_CONFIG.COW.INITIAL_FULLNESS_HUNGRY 
                          }
                        : c
                ),
                inventory: {
                    ...state.inventory,
                    milk: state.inventory.milk + 1,
                },
            };
        }

        case ActionTypes.FEED_COW: {
            const { cowId } = action.payload;
            
            // Check if we have grass to feed
            if (state.inventory.grass < 1) {
                console.warn('Not enough grass to feed cow');
                return state;
            }
            
            // Check if the cow exists and is hungry
            const cow = state.cows.find(c => c.id === cowId);
            if (!cow || cow.state !== 'hungry') {
                return state;
            }
            
            return {
                ...state,
                cows: state.cows.map(c =>
                    c.id === cowId
                        ? { 
                            ...c, 
                            state: 'producing', 
                            fullness: GAME_CONFIG.COW.INITIAL_FULLNESS_PRODUCING 
                          }
                        : c
                ),
                inventory: {
                    ...state.inventory,
                    grass: state.inventory.grass - 1,
                },
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

        case ActionTypes.SPEND_COINS: {
            const { amount } = action.payload;
            if (state.resources.coins < amount) return state;
            return {
                ...state,
                resources: { ...state.resources, coins: state.resources.coins - amount },
            };
        }

        // ---- INVENTORY ACTIONS ----

        case ActionTypes.ADD_ITEM: {
            const { itemType, amount = 1 } = action.payload;
            if (!(itemType in state.inventory)) {
                console.warn(`Unknown item type: ${itemType}`);
                return state;
            }
            return {
                ...state,
                inventory: {
                    ...state.inventory,
                    [itemType]: state.inventory[itemType] + amount,
                },
            };
        }

        case ActionTypes.REMOVE_ITEM: {
            const { itemType, amount = 1 } = action.payload;
            if (!(itemType in state.inventory)) {
                console.warn(`Unknown item type: ${itemType}`);
                return state;
            }
            // Don't allow negative inventory
            if (state.inventory[itemType] < amount) {
                return state;
            }
            return {
                ...state,
                inventory: {
                    ...state.inventory,
                    [itemType]: state.inventory[itemType] - amount,
                },
            };
        }

        case ActionTypes.SET_ITEM: {
            const { itemType, amount } = action.payload;
            if (!(itemType in state.inventory)) {
                console.warn(`Unknown item type: ${itemType}`);
                return state;
            }
            return {
                ...state,
                inventory: {
                    ...state.inventory,
                    [itemType]: Math.max(0, amount),
                },
            };
        }

        // ---- CRAFTING ACTIONS ----

        case ActionTypes.CRAFT_INSTANT: {
            const { recipeId } = action.payload;
            const recipe = GAME_CONFIG.RECIPES?.find(r => r.id === recipeId);
            
            if (!recipe) {
                console.warn(`Unknown recipe: ${recipeId}`);
                return state;
            }

            // Check if we have enough inputs
            for (const input of recipe.inputs) {
                if (state.inventory[input.item] < input.qty) {
                    console.warn(`Not enough ${input.item} for recipe ${recipeId}`);
                    return state;
                }
            }

            // Consume inputs and produce outputs
            const newInventory = { ...state.inventory };
            
            for (const input of recipe.inputs) {
                newInventory[input.item] -= input.qty;
            }
            
            for (const output of recipe.outputs) {
                newInventory[output.item] += output.qty;
            }

            return {
                ...state,
                inventory: newInventory,
            };
        }

        case ActionTypes.START_CRAFTING: {
            const { recipeId } = action.payload;
            const recipe = GAME_CONFIG.RECIPES?.find(r => r.id === recipeId);
            
            if (!recipe) {
                console.warn(`Unknown recipe: ${recipeId}`);
                return state;
            }

            // Check if we have enough inputs
            for (const input of recipe.inputs) {
                if (state.inventory[input.item] < input.qty) {
                    console.warn(`Not enough ${input.item} for recipe ${recipeId}`);
                    return state;
                }
            }

            // Consume inputs immediately
            const newInventory = { ...state.inventory };
            for (const input of recipe.inputs) {
                newInventory[input.item] -= input.qty;
            }

            // Add to crafting queue
            const now = Date.now();
            const craftingEntry = {
                id: `craft_${now}_${Math.random().toString(36).substr(2, 9)}`,
                recipeId,
                startedAt: now,
                completesAt: now + (recipe.time * 1000), // time is in seconds
            };

            return {
                ...state,
                inventory: newInventory,
                craftingQueue: [...state.craftingQueue, craftingEntry],
            };
        }

        case ActionTypes.COMPLETE_CRAFTING: {
            const { craftingId } = action.payload;
            const craftingEntry = state.craftingQueue.find(c => c.id === craftingId);
            
            if (!craftingEntry) {
                return state;
            }

            const recipe = GAME_CONFIG.RECIPES?.find(r => r.id === craftingEntry.recipeId);
            if (!recipe) {
                // Remove invalid entry
                return {
                    ...state,
                    craftingQueue: state.craftingQueue.filter(c => c.id !== craftingId),
                };
            }

            // Produce outputs
            const newInventory = { ...state.inventory };
            for (const output of recipe.outputs) {
                newInventory[output.item] += output.qty;
            }

            return {
                ...state,
                inventory: newInventory,
                craftingQueue: state.craftingQueue.filter(c => c.id !== craftingId),
            };
        }

        case ActionTypes.CANCEL_CRAFTING: {
            const { craftingId } = action.payload;
            const craftingEntry = state.craftingQueue.find(c => c.id === craftingId);
            
            if (!craftingEntry) {
                return state;
            }

            // Refund inputs
            const recipe = GAME_CONFIG.RECIPES?.find(r => r.id === craftingEntry.recipeId);
            if (!recipe) {
                return {
                    ...state,
                    craftingQueue: state.craftingQueue.filter(c => c.id !== craftingId),
                };
            }

            const newInventory = { ...state.inventory };
            for (const input of recipe.inputs) {
                newInventory[input.item] += input.qty;
            }

            return {
                ...state,
                inventory: newInventory,
                craftingQueue: state.craftingQueue.filter(c => c.id !== craftingId),
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

        case ActionTypes.SET_CRAFTING_DRAG:
            return { ...state, ui: { ...state.ui, draggingCraftingItem: action.payload.isDragging } };

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

            // Process crafting queue - auto-complete finished crafts
            const now = Date.now();
            const completedCrafts = state.craftingQueue.filter(craft => now >= craft.completesAt);
            const remainingCrafts = state.craftingQueue.filter(craft => now < craft.completesAt);

            // If there are completed crafts, produce their outputs
            let newInventory = state.inventory;
            if (completedCrafts.length > 0) {
                newInventory = { ...state.inventory };
                for (const craft of completedCrafts) {
                    const recipe = GAME_CONFIG.RECIPES?.find(r => r.id === craft.recipeId);
                    if (recipe) {
                        for (const output of recipe.outputs) {
                            newInventory[output.item] = (newInventory[output.item] || 0) + output.qty;
                        }
                    }
                }
            }

            return {
                ...state,
                playTime: newPlayTime,
                cows: updatedCows,
                inventory: newInventory,
                craftingQueue: remainingCrafts,
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

        // ---- CHAOS MODE ----

        case ActionTypes.TRIGGER_CHAOS: {
            const { impulses } = action.payload; // { cowId: { x, y }, ... }
            return {
                ...state,
                chaosImpulses: impulses,
            };
        }

        case ActionTypes.CLEAR_COW_IMPULSE: {
            const { cowId } = action.payload;
            const newImpulses = { ...state.chaosImpulses };
            delete newImpulses[cowId];
            return {
                ...state,
                chaosImpulses: newImpulses,
            };
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
    spendCoins: (amount) => ({ type: ActionTypes.SPEND_COINS, payload: { amount } }),

    // Inventory
    addItem: (itemType, amount = 1) => ({ 
        type: ActionTypes.ADD_ITEM, 
        payload: { itemType, amount } 
    }),
    removeItem: (itemType, amount = 1) => ({ 
        type: ActionTypes.REMOVE_ITEM, 
        payload: { itemType, amount } 
    }),
    setItem: (itemType, amount) => ({ 
        type: ActionTypes.SET_ITEM, 
        payload: { itemType, amount } 
    }),

    // Crafting
    craftInstant: (recipeId) => ({ 
        type: ActionTypes.CRAFT_INSTANT, 
        payload: { recipeId } 
    }),
    startCrafting: (recipeId) => ({ 
        type: ActionTypes.START_CRAFTING, 
        payload: { recipeId } 
    }),
    completeCrafting: (craftingId) => ({ 
        type: ActionTypes.COMPLETE_CRAFTING, 
        payload: { craftingId } 
    }),
    cancelCrafting: (craftingId) => ({ 
        type: ActionTypes.CANCEL_CRAFTING, 
        payload: { craftingId } 
    }),

    // UI
    openCrafting: () => ({ type: ActionTypes.OPEN_CRAFTING }),
    closeCrafting: () => ({ type: ActionTypes.CLOSE_CRAFTING }),
    pauseGame: () => ({ type: ActionTypes.PAUSE_GAME }),
    resumeGame: () => ({ type: ActionTypes.RESUME_GAME }),
    setCraftingDrag: (isDragging) => ({ type: ActionTypes.SET_CRAFTING_DRAG, payload: { isDragging } }),

    // Game loop
    tick: (delta) => ({ type: ActionTypes.TICK, payload: { delta } }),

    // Save/Load
    loadSave: (saveData) => ({ type: ActionTypes.LOAD_SAVE, payload: { saveData } }),
    markSaved: (saveId, timestamp) => ({ 
        type: ActionTypes.MARK_SAVED, 
        payload: { saveId, timestamp } 
    }),
    setUser: (userId) => ({ type: ActionTypes.SET_USER, payload: { userId } }),

    // Chaos mode
    triggerChaos: (impulses) => ({ type: ActionTypes.TRIGGER_CHAOS, payload: { impulses } }),
    clearCowImpulse: (cowId) => ({ type: ActionTypes.CLEAR_COW_IMPULSE, payload: { cowId } }),
};

export default gameReducer;

