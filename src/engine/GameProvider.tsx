/**
 * GameProvider - Central game context
 * 
 * Provides:
 * - Game state via useReducer
 * - Game loop integration
 * - Collision engine integration
 * - Mouse/Touch position tracking
 * - Save/Load functionality with auto-save
 */

import React, { createContext, useContext, useReducer, useEffect, useState, useCallback, useRef, useMemo, ReactNode } from 'react';
import { gameReducer, createInitialState, actions, colorToString } from './gameState';
import { useGameLoop } from './gameLoop';
import { 
    saveGame as saveGameToStorage, 
    loadGame as loadGameFromStorage,
    deleteSave,
    SAVE_CONFIG,
} from '../save';
import { GameState, GameAction, Position, Cow, GameResources, Inventory, CraftingQueueItem, ToolState, UIState, DraggingCow, ChaosImpulses, ActiveBoardCraft, Color, Recipe } from './types';

// ============================================
// CONTEXT TYPES
// ============================================

interface SaveLoadState {
    saving: boolean;
    loading: boolean;
    lastSavedAt: number;
    error: string | null;
}

interface GameContextValue {
    // State
    state: GameState;
    dispatch: React.Dispatch<GameAction>;
    
    // Convenience getters
    cows: Cow[];
    resources: GameResources;
    inventory: Inventory;
    craftingQueue: CraftingQueueItem[];
    tools: ToolState;
    ui: UIState;
    draggingCow: DraggingCow;
    chaosImpulses: ChaosImpulses;
    activeBoardCraft: ActiveBoardCraft | null;
    
    // Actions (pre-bound for convenience)
    startMilking: () => void;
    stopMilking: () => void;
    startFeeding: () => void;
    stopFeeding: () => void;
    updateToolPosition: (pos: Position) => void;
    openCrafting: () => void;
    closeCrafting: () => void;
    milkCow: (id: string) => void;
    feedCow: (id: string) => void;
    breedCows: (id1: string, id2: string, pos: Position) => void;
    updateCowPosition: (id: string, pos: Position) => void;
    setDraggingCow: (id: string, pos: Position) => void;
    clearDraggingCow: () => void;
    addItem: (itemType: string, amount?: number) => void;
    removeItem: (itemType: string, amount?: number) => void;
    setItem: (itemType: string, amount: number) => void;
    craftInstant: (recipeId: string) => void;
    startCrafting: (recipeId: string) => void;
    completeCrafting: (craftingId: string) => void;
    cancelCrafting: (craftingId: string) => void;
    setBoardCraft: (craftData: ActiveBoardCraft | null) => void;
    clearBoardCraft: () => void;
    addCoins: (amount: number) => void;
    spendCoins: (amount: number) => void;
    triggerChaos: (impulses: ChaosImpulses) => void;
    clearCowImpulse: (cowId: string) => void;
    setCraftingDrag: (isDragging: boolean) => void;
    
    // Game control
    pause: () => void;
    resume: () => void;
    isPaused: boolean;
    
    // Save/Load with loading states
    saveGame: () => { success: boolean; error?: unknown };
    resetGame: () => void;
    isSaving: boolean;
    isLoading: boolean;
    lastSavedAt: number;
    saveLoadError: string | null;
    
    // Utilities
    colorToString: (color: Color) => string;
    mousePosition: Position;
}

// ============================================
// CONTEXT
// ============================================

const GameContext = createContext<GameContextValue | null>(null);
const MouseContext = createContext<Position>({ x: 0, y: 0 });

// ============================================
// INITIAL STATE WITH LOAD
// ============================================

/**
 * Create initial state, loading from save if available
 */
function createInitialStateWithLoad(): GameState {
    // Try to load saved game
    const savedState = loadGameFromStorage();
    
    if (savedState) {
        console.log('Loaded save data, play time:', Math.round(savedState.playTime), 'seconds');
        
        // Merge saved state with fresh initial state (to get any new fields)
        const freshState = createInitialState();
        return {
            ...freshState,
            cows: savedState.cows,
            resources: savedState.resources,
            inventory: savedState.inventory,
            craftingQueue: savedState.craftingQueue,
            activeBoardCraft: savedState.activeBoardCraft,
            playTime: savedState.playTime,
        };
    }
    
    return createInitialState();
}

// ============================================
// GAME PROVIDER COMPONENT
// ============================================

interface GameProviderProps {
    children: ReactNode;
}

export function GameProvider({ children }: GameProviderProps): React.ReactElement {
    const [state, dispatch] = useReducer(gameReducer, null, createInitialStateWithLoad);
    const [mousePosition, setMousePosition] = useState<Position>({ x: 0, y: 0 });
    const [saveLoadState, setSaveLoadState] = useState<SaveLoadState>({ 
        saving: false, 
        loading: false, 
        lastSavedAt: 0,
        error: null 
    });
    const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const stateRef = useRef<GameState>(state);
    const lastSaveTimeRef = useRef<number>(0);

    // Keep stateRef updated to avoid stale closures in auto-save
    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    // ---- Perform Save ----
    const performSave = useCallback(() => {
        const now = Date.now();
        
        // Debounce saves
        if (now - lastSaveTimeRef.current < SAVE_CONFIG.MIN_SAVE_INTERVAL_MS) {
            return { success: true };
        }
        
        setSaveLoadState(prev => ({ ...prev, saving: true, error: null }));
        
        const result = saveGameToStorage(stateRef.current);
        
        if (result.success) {
            lastSaveTimeRef.current = now;
            setSaveLoadState(prev => ({ 
                ...prev, 
                saving: false, 
                lastSavedAt: now 
            }));
        } else {
            setSaveLoadState(prev => ({ 
                ...prev, 
                saving: false, 
                error: result.error instanceof Error ? result.error.message : 'Save failed'
            }));
        }
        
        return result;
    }, []);

    // ---- Mouse and Touch Position Tracking ----
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches && e.touches[0]) {
                setMousePosition({ 
                    x: e.touches[0].clientX, 
                    y: e.touches[0].clientY 
                });
            }
        };

        const handleTouchStart = (e: TouchEvent) => {
            if (e.touches && e.touches[0]) {
                setMousePosition({ 
                    x: e.touches[0].clientX, 
                    y: e.touches[0].clientY 
                });
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchmove', handleTouchMove, { passive: true });
        window.addEventListener('touchstart', handleTouchStart, { passive: true });
        
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchstart', handleTouchStart);
        };
    }, []);

    // ---- Game Loop ----
    const gameLoop = useGameLoop(state, dispatch);

    // ---- Tool Release Handler (mouse and touch) ----
    useEffect(() => {
        const handleRelease = () => {
            if (state.tools.milking) {
                dispatch(actions.stopMilking());
            }
            if (state.tools.feeding) {
                dispatch(actions.stopFeeding());
            }
        };

        window.addEventListener('mouseup', handleRelease);
        window.addEventListener('touchend', handleRelease);
        window.addEventListener('touchcancel', handleRelease);
        
        return () => {
            window.removeEventListener('mouseup', handleRelease);
            window.removeEventListener('touchend', handleRelease);
            window.removeEventListener('touchcancel', handleRelease);
        };
    }, [state.tools.milking, state.tools.feeding]);

    // ---- Auto-Save Interval ----
    useEffect(() => {
        // Auto-save every 30 seconds
        autoSaveIntervalRef.current = setInterval(() => {
            performSave();
        }, SAVE_CONFIG.AUTO_SAVE_INTERVAL_MS);

        return () => {
            if (autoSaveIntervalRef.current) {
                clearInterval(autoSaveIntervalRef.current);
            }
        };
    }, [performSave]);

    // ---- Save on Page Unload ----
    useEffect(() => {
        const handleBeforeUnload = () => {
            // Synchronous save on page close
            saveGameToStorage(stateRef.current);
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    // ---- Reset Game ----
    const resetGame = useCallback(() => {
        deleteSave();
        // Reload the page to reset everything
        window.location.reload();
    }, []);

    // ---- Memoized Action Creators ----
    const actionCreators = useMemo(() => ({
        startMilking: () => dispatch(actions.startMilking()),
        stopMilking: () => dispatch(actions.stopMilking()),
        startFeeding: () => dispatch(actions.startFeeding()),
        stopFeeding: () => dispatch(actions.stopFeeding()),
        updateToolPosition: (pos: Position) => dispatch(actions.updateToolPosition(pos)),
        openCrafting: () => dispatch(actions.openCrafting()),
        closeCrafting: () => dispatch(actions.closeCrafting()),
        milkCow: (id: string) => dispatch(actions.milkCow(id)),
        feedCow: (id: string) => dispatch(actions.feedCow(id)),
        breedCows: (id1: string, id2: string, pos: Position) => dispatch(actions.breedCows(id1, id2, pos)),
        updateCowPosition: (id: string, pos: Position) => dispatch(actions.updateCowPosition(id, pos)),
        setDraggingCow: (id: string, pos: Position) => dispatch(actions.setDraggingCow(id, pos)),
        clearDraggingCow: () => dispatch(actions.clearDraggingCow()),
        // Inventory actions
        addItem: (itemType: string, amount?: number) => dispatch(actions.addItem(itemType, amount)),
        removeItem: (itemType: string, amount?: number) => dispatch(actions.removeItem(itemType, amount)),
        setItem: (itemType: string, amount: number) => dispatch(actions.setItem(itemType, amount)),
        // Crafting actions
        craftInstant: (recipeId: string) => dispatch(actions.craftInstant(recipeId)),
        startCrafting: (recipeId: string) => dispatch(actions.startCrafting(recipeId)),
        completeCrafting: (craftingId: string) => dispatch(actions.completeCrafting(craftingId)),
        cancelCrafting: (craftingId: string) => dispatch(actions.cancelCrafting(craftingId)),
        // Board crafting (timed crafting on table)
        setBoardCraft: (craftData: ActiveBoardCraft | null) => dispatch(actions.setBoardCraft(craftData)),
        clearBoardCraft: () => dispatch(actions.clearBoardCraft()),
        // Resource actions
        addCoins: (amount: number) => dispatch(actions.addCoins(amount)),
        spendCoins: (amount: number) => dispatch(actions.spendCoins(amount)),
        // Chaos mode
        triggerChaos: (impulses: ChaosImpulses) => dispatch(actions.triggerChaos(impulses)),
        clearCowImpulse: (cowId: string) => dispatch(actions.clearCowImpulse(cowId)),
        // Crafting drag
        setCraftingDrag: (isDragging: boolean) => dispatch(actions.setCraftingDrag(isDragging)),
    }), []);

    // ---- Context Value ----
    const contextValue = useMemo((): GameContextValue => ({
        // State
        state,
        dispatch,
        
        // Convenience getters
        cows: state.cows,
        resources: state.resources,
        inventory: state.inventory,
        craftingQueue: state.craftingQueue,
        tools: state.tools,
        ui: state.ui,
        draggingCow: state.draggingCow,
        chaosImpulses: state.chaosImpulses,
        activeBoardCraft: state.activeBoardCraft,
        
        // Actions (pre-bound for convenience)
        ...actionCreators,
        
        // Game control
        pause: gameLoop.pause,
        resume: gameLoop.resume,
        isPaused: gameLoop.isPaused,
        
        // Save/Load with loading states
        saveGame: performSave,
        resetGame,
        isSaving: saveLoadState.saving,
        isLoading: saveLoadState.loading,
        lastSavedAt: saveLoadState.lastSavedAt,
        saveLoadError: saveLoadState.error,
        
        // Utilities
        colorToString,
        mousePosition,
    }), [state, actionCreators, gameLoop.pause, gameLoop.resume, gameLoop.isPaused, performSave, resetGame, saveLoadState, mousePosition]);

    return (
        <GameContext.Provider value={contextValue}>
            <MouseContext.Provider value={mousePosition}>
                {children}
            </MouseContext.Provider>
        </GameContext.Provider>
    );
}

// ============================================
// HOOKS
// ============================================

/**
 * Access the full game context
 */
export function useGame(): GameContextValue {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
}

/**
 * Access just the game state (optimized for frequent reads)
 */
export function useGameState(): GameState {
    const { state } = useGame();
    return state;
}

/**
 * Access just the dispatch function
 */
export function useGameDispatch(): React.Dispatch<GameAction> {
    const { dispatch } = useGame();
    return dispatch;
}

/**
 * Access mouse position
 */
export function useMousePosition(): Position {
    return useContext(MouseContext);
}

/**
 * Access cows list
 */
export function useCows(): Cow[] {
    const { cows } = useGame();
    return cows;
}

/**
 * Access a single cow by ID
 */
export function useCow(cowId: string): Cow | undefined {
    const { cows } = useGame();
    return cows.find(c => c.id === cowId);
}

/**
 * Access tools state
 */
export function useTools() {
    const { tools, startMilking, stopMilking, startFeeding, stopFeeding, updateToolPosition } = useGame();
    return { ...tools, startMilking, stopMilking, startFeeding, stopFeeding, updateToolPosition };
}

/**
 * Access resources
 */
export function useResources(): GameResources {
    const { resources } = useGame();
    return resources;
}

/**
 * Access inventory state and actions
 */
export function useInventory() {
    const { 
        inventory, 
        addItem, 
        removeItem, 
        setItem,
    } = useGame();
    return { 
        inventory, 
        addItem, 
        removeItem, 
        setItem,
        // Helper to check if player has enough of an item
        hasItem: (itemType: string, amount: number = 1) => (inventory[itemType] || 0) >= amount,
        // Helper to get item count
        getItemCount: (itemType: string) => inventory[itemType] || 0,
    };
}

/**
 * Access crafting queue state and actions
 */
export function useCrafting() {
    const { 
        inventory,
        craftingQueue, 
        craftInstant, 
        startCrafting, 
        completeCrafting, 
        cancelCrafting,
    } = useGame();
    return { 
        inventory,
        craftingQueue, 
        craftInstant, 
        startCrafting, 
        completeCrafting, 
        cancelCrafting,
        // Helper to check if a recipe can be crafted
        canCraft: (recipe: Recipe | null | undefined): boolean => {
            if (!recipe) return false;
            return recipe.inputs.every(input => 
                (inventory[input.item] || 0) >= input.qty
            );
        },
    };
}

/**
 * Access save state
 */
export function useSaveState() {
    const { isSaving, isLoading, lastSavedAt, saveLoadError, saveGame, resetGame } = useGame();
    return { isSaving, isLoading, lastSavedAt, saveLoadError, saveGame, resetGame };
}

export default GameProvider;
