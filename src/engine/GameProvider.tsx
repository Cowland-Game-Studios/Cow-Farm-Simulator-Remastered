/**
 * GameProvider - Central game context
 * 
 * Split into multiple contexts to prevent unnecessary re-renders:
 * - StateContext: Game state (changes frequently)
 * - DispatchContext: Dispatch function (stable)
 * - ActionsContext: Pre-bound action creators (stable)
 * - MouseContext: Mouse position (changes frequently, separate)
 * - SaveContext: Save state (changes rarely)
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
import { GameState, GameAction, Position, Cow, GameResources, Inventory, CraftingQueueItem, ToolState, UIState, DraggingCow, ChaosImpulses, ActiveBoardCraft, Color, Recipe, GameStats, AchievementState } from './types';

// ============================================
// CONTEXT TYPES
// ============================================

interface SaveLoadState {
    saving: boolean;
    loading: boolean;
    lastSavedAt: number;
    error: string | null;
}

interface GameLoopControls {
    pause: () => void;
    resume: () => void;
    isPaused: boolean;
}

interface ActionsContextValue {
    // Actions (pre-bound, stable references)
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
    checkAchievements: () => void;
}

interface SaveContextValue {
    saveGame: () => { success: boolean; error?: unknown };
    resetGame: () => void;
    isSaving: boolean;
    isLoading: boolean;
    lastSavedAt: number;
    saveLoadError: string | null;
}

// Legacy combined interface for backwards compatibility
interface GameContextValue extends ActionsContextValue, SaveContextValue {
    state: GameState;
    dispatch: React.Dispatch<GameAction>;
    cows: Cow[];
    resources: GameResources;
    inventory: Inventory;
    craftingQueue: CraftingQueueItem[];
    stats: GameStats;
    achievements: AchievementState;
    xp: number;
    tools: ToolState;
    ui: UIState;
    draggingCow: DraggingCow;
    chaosImpulses: ChaosImpulses;
    activeBoardCraft: ActiveBoardCraft | null;
    pause: () => void;
    resume: () => void;
    isPaused: boolean;
    colorToString: (color: Color) => string;
    mousePosition: Position;
}

// ============================================
// CONTEXTS (Split for performance)
// ============================================

const StateContext = createContext<GameState | null>(null);
const DispatchContext = createContext<React.Dispatch<GameAction> | null>(null);
const ActionsContext = createContext<ActionsContextValue | null>(null);
const MouseContext = createContext<Position>({ x: 0, y: 0 });
const SaveContext = createContext<SaveContextValue | null>(null);
const GameLoopContext = createContext<GameLoopControls | null>(null);

// Legacy combined context (for backwards compatibility with useGame)
const GameContext = createContext<GameContextValue | null>(null);

// ============================================
// INITIAL STATE WITH LOAD
// ============================================

function createInitialStateWithLoad(): GameState {
    const savedState = loadGameFromStorage();
    
    if (savedState) {
        if (process.env.NODE_ENV === 'development') {
            console.log('Loaded save data, play time:', Math.round(savedState.playTime), 'seconds');
        }
        
        const freshState = createInitialState();
        
        // Merge saved stats with default stats (handles migration for saves without stats)
        const mergedStats: GameStats = {
            ...freshState.stats,
            ...(savedState.stats || {}),
        };
        
        // Merge achievements (handles migration for saves without achievements)
        const mergedAchievements: AchievementState = {
            ...freshState.achievements,
            ...(savedState.achievements || {}),
            unlocked: {
                ...freshState.achievements.unlocked,
                ...(savedState.achievements?.unlocked || {}),
            },
        };
        
        return {
            ...freshState,
            cows: savedState.cows,
            resources: savedState.resources,
            inventory: savedState.inventory,
            craftingQueue: savedState.craftingQueue,
            activeBoardCraft: savedState.activeBoardCraft,
            stats: mergedStats,
            achievements: mergedAchievements,
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

    // Keep stateRef updated
    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    // ---- Perform Save ----
    const performSave = useCallback(() => {
        const now = Date.now();
        
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

    // ---- Tool Release Handler ----
    useEffect(() => {
        const handleRelease = () => {
            if (stateRef.current.tools.milking) {
                dispatch(actions.stopMilking());
            }
            if (stateRef.current.tools.feeding) {
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
    }, []); // Empty deps - uses stateRef to avoid re-registering

    // ---- Auto-Save Interval ----
    useEffect(() => {
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
        window.location.reload();
    }, []);

    // ---- Memoized Action Creators (STABLE - never changes) ----
    const actionCreators = useMemo((): ActionsContextValue => ({
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
        addItem: (itemType: string, amount?: number) => dispatch(actions.addItem(itemType, amount)),
        removeItem: (itemType: string, amount?: number) => dispatch(actions.removeItem(itemType, amount)),
        setItem: (itemType: string, amount: number) => dispatch(actions.setItem(itemType, amount)),
        craftInstant: (recipeId: string) => dispatch(actions.craftInstant(recipeId)),
        startCrafting: (recipeId: string) => dispatch(actions.startCrafting(recipeId)),
        completeCrafting: (craftingId: string) => dispatch(actions.completeCrafting(craftingId)),
        cancelCrafting: (craftingId: string) => dispatch(actions.cancelCrafting(craftingId)),
        setBoardCraft: (craftData: ActiveBoardCraft | null) => dispatch(actions.setBoardCraft(craftData)),
        clearBoardCraft: () => dispatch(actions.clearBoardCraft()),
        addCoins: (amount: number) => dispatch(actions.addCoins(amount)),
        spendCoins: (amount: number) => dispatch(actions.spendCoins(amount)),
        triggerChaos: (impulses: ChaosImpulses) => dispatch(actions.triggerChaos(impulses)),
        clearCowImpulse: (cowId: string) => dispatch(actions.clearCowImpulse(cowId)),
        setCraftingDrag: (isDragging: boolean) => dispatch(actions.setCraftingDrag(isDragging)),
        checkAchievements: () => dispatch(actions.checkAchievements()),
    }), []);

    // ---- Memoized Save Context (changes rarely) ----
    const saveContextValue = useMemo((): SaveContextValue => ({
        saveGame: performSave,
        resetGame,
        isSaving: saveLoadState.saving,
        isLoading: saveLoadState.loading,
        lastSavedAt: saveLoadState.lastSavedAt,
        saveLoadError: saveLoadState.error,
    }), [performSave, resetGame, saveLoadState]);

    // ---- Memoized Game Loop Controls (stable) ----
    const gameLoopControls = useMemo((): GameLoopControls => ({
        pause: gameLoop.pause,
        resume: gameLoop.resume,
        isPaused: gameLoop.isPaused,
    }), [gameLoop.pause, gameLoop.resume, gameLoop.isPaused]);

    // ---- Legacy Combined Context (for backwards compatibility) ----
    const legacyContextValue = useMemo((): GameContextValue => ({
        state,
        dispatch,
        cows: state.cows,
        resources: state.resources,
        inventory: state.inventory,
        craftingQueue: state.craftingQueue,
        stats: state.stats,
        achievements: state.achievements,
        xp: state.stats.totalXpEarned,
        tools: state.tools,
        ui: state.ui,
        draggingCow: state.draggingCow,
        chaosImpulses: state.chaosImpulses,
        activeBoardCraft: state.activeBoardCraft,
        ...actionCreators,
        ...saveContextValue,
        pause: gameLoopControls.pause,
        resume: gameLoopControls.resume,
        isPaused: gameLoopControls.isPaused,
        colorToString,
        mousePosition,
    }), [state, actionCreators, saveContextValue, gameLoopControls, mousePosition]);

    return (
        <StateContext.Provider value={state}>
            <DispatchContext.Provider value={dispatch}>
                <ActionsContext.Provider value={actionCreators}>
                    <SaveContext.Provider value={saveContextValue}>
                        <GameLoopContext.Provider value={gameLoopControls}>
                            <MouseContext.Provider value={mousePosition}>
                                <GameContext.Provider value={legacyContextValue}>
                                    {children}
                                </GameContext.Provider>
                            </MouseContext.Provider>
                        </GameLoopContext.Provider>
                    </SaveContext.Provider>
                </ActionsContext.Provider>
            </DispatchContext.Provider>
        </StateContext.Provider>
    );
}

// ============================================
// OPTIMIZED HOOKS (Use these for better performance)
// ============================================

/**
 * Access just the game state
 * NOTE: Component will re-render on ANY state change
 */
export function useGameState(): GameState {
    const state = useContext(StateContext);
    if (!state) {
        throw new Error('useGameState must be used within a GameProvider');
    }
    return state;
}

/**
 * Access just the dispatch function (stable, never causes re-render)
 */
export function useGameDispatch(): React.Dispatch<GameAction> {
    const dispatch = useContext(DispatchContext);
    if (!dispatch) {
        throw new Error('useGameDispatch must be used within a GameProvider');
    }
    return dispatch;
}

/**
 * Access pre-bound actions (stable, never causes re-render)
 */
export function useGameActions(): ActionsContextValue {
    const actions = useContext(ActionsContext);
    if (!actions) {
        throw new Error('useGameActions must be used within a GameProvider');
    }
    return actions;
}

/**
 * Access mouse position
 */
export function useMousePosition(): Position {
    return useContext(MouseContext);
}

/**
 * Access save state and functions
 */
export function useSaveState(): SaveContextValue {
    const save = useContext(SaveContext);
    if (!save) {
        throw new Error('useSaveState must be used within a GameProvider');
    }
    return save;
}

/**
 * Access game loop controls
 */
export function useGameLoopControls(): GameLoopControls {
    const controls = useContext(GameLoopContext);
    if (!controls) {
        throw new Error('useGameLoopControls must be used within a GameProvider');
    }
    return controls;
}

// ============================================
// LEGACY HOOKS (Backwards compatibility)
// ============================================

/**
 * Access the full game context (LEGACY - causes re-render on any change)
 * Prefer using specific hooks like useGameState, useGameActions, etc.
 */
export function useGame(): GameContextValue {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
}

/**
 * Access cows list
 */
export function useCows(): Cow[] {
    const state = useGameState();
    return state.cows;
}

/**
 * Access cows as a Map for O(1) lookups
 */
export function useCowsById(): Map<string, Cow> {
    const state = useGameState();
    return useMemo(() => {
        const map = new Map<string, Cow>();
        for (const cow of state.cows) {
            map.set(cow.id, cow);
        }
        return map;
    }, [state.cows]);
}

/**
 * Access a single cow by ID (O(1) lookup)
 */
export function useCow(cowId: string): Cow | undefined {
    const cowsById = useCowsById();
    return cowsById.get(cowId);
}

/**
 * Access tools state with actions
 */
export function useTools() {
    const state = useGameState();
    const actions = useGameActions();
    return { 
        ...state.tools, 
        startMilking: actions.startMilking, 
        stopMilking: actions.stopMilking, 
        startFeeding: actions.startFeeding, 
        stopFeeding: actions.stopFeeding, 
        updateToolPosition: actions.updateToolPosition 
    };
}

/**
 * Access resources
 */
export function useResources(): GameResources {
    const state = useGameState();
    return state.resources;
}

/**
 * Access inventory state and actions
 */
export function useInventory() {
    const state = useGameState();
    const actions = useGameActions();
    return { 
        inventory: state.inventory, 
        addItem: actions.addItem, 
        removeItem: actions.removeItem, 
        setItem: actions.setItem,
        hasItem: (itemType: string, amount: number = 1) => (state.inventory[itemType] || 0) >= amount,
        getItemCount: (itemType: string) => state.inventory[itemType] || 0,
    };
}

/**
 * Access crafting queue state and actions
 */
export function useCrafting() {
    const state = useGameState();
    const actions = useGameActions();
    return { 
        inventory: state.inventory,
        craftingQueue: state.craftingQueue, 
        craftInstant: actions.craftInstant, 
        startCrafting: actions.startCrafting, 
        completeCrafting: actions.completeCrafting, 
        cancelCrafting: actions.cancelCrafting,
        canCraft: (recipe: Recipe | null | undefined): boolean => {
            if (!recipe) return false;
            return recipe.inputs.every(input => 
                (state.inventory[input.item] || 0) >= input.qty
            );
        },
    };
}

/**
 * Access game statistics for achievements
 */
export function useStats(): GameStats {
    const state = useGameState();
    return state.stats;
}

/**
 * Access achievement state and actions
 */
export function useAchievements() {
    const state = useGameState();
    const actions = useGameActions();
    return {
        achievements: state.achievements,
        xp: state.stats.totalXpEarned,
        checkAchievements: actions.checkAchievements,
    };
}

export default GameProvider;
