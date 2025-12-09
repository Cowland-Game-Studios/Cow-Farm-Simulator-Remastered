/**
 * Game Engine Type Definitions
 */

// ============================================
// CORE TYPES
// ============================================

export type CowState = 'hungry' | 'producing' | 'full';

export interface Position {
    x: number;
    y: number;
}

export interface Color {
    r: number; // 0-255
    g: number; // 0-255
    b: number; // 0-255
    a: number; // 0-1
}

export interface Cow {
    id: string;
    color: Color;
    state: CowState;
    fullness: number; // 0-1 (computed from lastFedAt for 'producing' cows)
    position: Position;
    lastFedAt: number | null; // timestamp when cow started producing (null if hungry/full)
    lastBredAt: number; // timestamp
    createdAt: number; // timestamp
}

export interface GameResources {
    coins: number;
    stars: number;
}

export interface Inventory {
    milk: number;
    grass: number;
    cream: number;
    butter: number;
    cheese: number;
    yogurt: number;
    iceCream: number;
    cheesecake: number;
    [key: string]: number; // Allow dynamic access
}

export interface CraftingQueueItem {
    id: string;
    recipeId: string;
    startedAt: number;
    completesAt: number;
}

export type ItemType = 'milk' | 'grass' | 'cream' | 'butter' | 'cheese' | 'yogurt' | 'iceCream' | 'cheesecake';

export interface ToolState {
    milking: boolean;
    feeding: boolean;
    toolPosition: Position | null;
}

export interface UIState {
    crafting: boolean;
    paused: boolean;
    saving: boolean;
    draggingCraftingItem: boolean;
}

export interface DraggingCow {
    cowId: string | null;
    position: Position | null;
}

export interface ChaosImpulses {
    [cowId: string]: Position;
}

export interface ActiveBoardCraft {
    startedAt: number;
    duration: number;
    recipeId: string;
    ingredientIds: number[];
    ingredients: Array<{
        name: string;
        image: string;
        x: number;
        y: number;
    }>;
}

export interface GameState {
    userId: string | null;
    saveId: string | null;
    cows: Cow[];
    resources: GameResources;
    inventory: Inventory;
    craftingQueue: CraftingQueueItem[];
    tools: ToolState;
    ui: UIState;
    draggingCow: DraggingCow;
    chaosImpulses: ChaosImpulses;
    activeBoardCraft: ActiveBoardCraft | null;
    lastSavedAt: number;
    playTime: number;
}

export interface CollisionEntity {
    id: string;
    position: Position;
    radius: number;
    type: 'cow' | 'tool' | 'other';
}

// ============================================
// RECIPE TYPES
// ============================================

export interface RecipeInput {
    item: string;
    qty: number;
}

export interface RecipeOutput {
    item: string;
    qty: number;
}

export interface Recipe {
    id: string;
    name: string;
    inputs: RecipeInput[];
    outputs: RecipeOutput[];
    time: number; // in seconds (0 = instant)
}

// ============================================
// ACTION TYPES
// ============================================

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
    
    // Board crafting (timed crafting on table)
    SET_BOARD_CRAFT: 'SET_BOARD_CRAFT',
    CLEAR_BOARD_CRAFT: 'CLEAR_BOARD_CRAFT',

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
} as const;

export type ActionType = typeof ActionTypes[keyof typeof ActionTypes];

// ============================================
// ACTION INTERFACES
// ============================================

export interface GameAction {
    type: string;
    payload?: unknown;
}

export interface MilkCowAction {
    type: typeof ActionTypes.MILK_COW;
    payload: { cowId: string };
}

export interface FeedCowAction {
    type: typeof ActionTypes.FEED_COW;
    payload: { cowId: string };
}

export interface BreedCowsAction {
    type: typeof ActionTypes.BREED_COWS;
    payload: { cowId1: string; cowId2: string; spawnPosition: Position };
}

export interface UpdateCowFullnessAction {
    type: typeof ActionTypes.UPDATE_COW_FULLNESS;
    payload: { cowId: string; fullness: number };
}

export interface UpdateCowPositionAction {
    type: typeof ActionTypes.UPDATE_COW_POSITION;
    payload: { cowId: string; position: Position };
}

export interface AddCowAction {
    type: typeof ActionTypes.ADD_COW;
    payload: { cow: Cow };
}

export interface RemoveCowAction {
    type: typeof ActionTypes.REMOVE_COW;
    payload: { cowId: string };
}

export interface TickAction {
    type: typeof ActionTypes.TICK;
    payload: { delta: number };
}

export interface LoadSaveAction {
    type: typeof ActionTypes.LOAD_SAVE;
    payload: { saveData: Partial<GameState> };
}

export interface MarkSavedAction {
    type: typeof ActionTypes.MARK_SAVED;
    payload: { saveId: string; timestamp: number };
}

export interface SetUserAction {
    type: typeof ActionTypes.SET_USER;
    payload: { userId: string };
}

export interface AddCoinsAction {
    type: typeof ActionTypes.ADD_COINS;
    payload: { amount: number };
}

export interface SpendCoinsAction {
    type: typeof ActionTypes.SPEND_COINS;
    payload: { amount: number };
}

export interface AddItemAction {
    type: typeof ActionTypes.ADD_ITEM;
    payload: { itemType: string; amount: number };
}

export interface RemoveItemAction {
    type: typeof ActionTypes.REMOVE_ITEM;
    payload: { itemType: string; amount: number };
}

export interface SetItemAction {
    type: typeof ActionTypes.SET_ITEM;
    payload: { itemType: string; amount: number };
}

export interface TriggerChaosAction {
    type: typeof ActionTypes.TRIGGER_CHAOS;
    payload: { impulses: ChaosImpulses };
}

export interface ClearCowImpulseAction {
    type: typeof ActionTypes.CLEAR_COW_IMPULSE;
    payload: { cowId: string };
}

export interface SetDraggingCowAction {
    type: typeof ActionTypes.SET_DRAGGING_COW;
    payload: { cowId: string; position: Position };
}

export interface UpdateToolPositionAction {
    type: typeof ActionTypes.UPDATE_TOOL_POSITION;
    payload: { position: Position };
}

export interface SetCraftingDragAction {
    type: typeof ActionTypes.SET_CRAFTING_DRAG;
    payload: { isDragging: boolean };
}

export interface SetBoardCraftAction {
    type: typeof ActionTypes.SET_BOARD_CRAFT;
    payload: ActiveBoardCraft;
}

export interface CraftInstantAction {
    type: typeof ActionTypes.CRAFT_INSTANT;
    payload: { recipeId: string };
}

export interface StartCraftingAction {
    type: typeof ActionTypes.START_CRAFTING;
    payload: { recipeId: string };
}

export interface CompleteCraftingAction {
    type: typeof ActionTypes.COMPLETE_CRAFTING;
    payload: { craftingId: string };
}

export interface CancelCraftingAction {
    type: typeof ActionTypes.CANCEL_CRAFTING;
    payload: { craftingId: string };
}

export default ActionTypes;

