/**
 * GameProvider - Central game context
 * 
 * Provides:
 * - Game state via useReducer
 * - Game loop integration
 * - Collision engine integration
 * - Mouse/Touch position tracking
 * - Save/Load functionality with loading states
 */

import React, { createContext, useContext, useReducer, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { gameReducer, createInitialState, actions, colorToString } from './gameState';
import { useGameLoop } from './gameLoop';
import { saveGame, loadGame, autoSave } from '../services/supabaseService';
import { GAME_CONFIG } from '../config/gameConfig';

// ============================================
// CONTEXT
// ============================================

const GameContext = createContext(null);
const MouseContext = createContext({ x: 0, y: 0 });

// ============================================
// GAME PROVIDER COMPONENT
// ============================================

export function GameProvider({ children }) {
    const [state, dispatch] = useReducer(gameReducer, null, createInitialState);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [saveLoadState, setSaveLoadState] = useState({ saving: false, loading: false, error: null });
    const autoSaveIntervalRef = useRef(null);
    const stateRef = useRef(state);

    // Keep stateRef updated to avoid stale closures in auto-save
    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    // ---- Mouse and Touch Position Tracking ----
    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };

        const handleTouchMove = (e) => {
            if (e.touches && e.touches[0]) {
                setMousePosition({ 
                    x: e.touches[0].clientX, 
                    y: e.touches[0].clientY 
                });
            }
        };

        const handleTouchStart = (e) => {
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

    // ---- Auto-Save (when Supabase is connected) ----
    useEffect(() => {
        // Auto-save every 30 seconds if user is logged in
        if (state.userId) {
            autoSaveIntervalRef.current = setInterval(() => {
                // Use stateRef to avoid stale closure
                autoSave(stateRef.current, dispatch);
            }, GAME_CONFIG.UI.AUTO_SAVE_INTERVAL_MS);
        }

        return () => {
            if (autoSaveIntervalRef.current) {
                clearInterval(autoSaveIntervalRef.current);
            }
        };
    }, [state.userId]);

    // ---- Save/Load with Loading States ----
    const handleSaveGame = useCallback(async () => {
        setSaveLoadState(prev => ({ ...prev, saving: true, error: null }));
        try {
            const result = await saveGame(stateRef.current, dispatch);
            setSaveLoadState(prev => ({ ...prev, saving: false }));
            return result;
        } catch (error) {
            setSaveLoadState(prev => ({ ...prev, saving: false, error: error.message }));
            return { success: false, error };
        }
    }, []);

    const handleLoadGame = useCallback(async () => {
        setSaveLoadState(prev => ({ ...prev, loading: true, error: null }));
        try {
            const result = await loadGame(dispatch);
            setSaveLoadState(prev => ({ ...prev, loading: false }));
            return result;
        } catch (error) {
            setSaveLoadState(prev => ({ ...prev, loading: false, error: error.message }));
            return { success: false, error };
        }
    }, []);

    // ---- Memoized Action Creators ----
    const actionCreators = useMemo(() => ({
        startMilking: () => dispatch(actions.startMilking()),
        stopMilking: () => dispatch(actions.stopMilking()),
        startFeeding: () => dispatch(actions.startFeeding()),
        stopFeeding: () => dispatch(actions.stopFeeding()),
        updateToolPosition: (pos) => dispatch(actions.updateToolPosition(pos)),
        openCrafting: () => dispatch(actions.openCrafting()),
        closeCrafting: () => dispatch(actions.closeCrafting()),
        milkCow: (id) => dispatch(actions.milkCow(id)),
        feedCow: (id) => dispatch(actions.feedCow(id)),
        breedCows: (id1, id2, pos) => dispatch(actions.breedCows(id1, id2, pos)),
        updateCowPosition: (id, pos) => dispatch(actions.updateCowPosition(id, pos)),
        setDraggingCow: (id, pos) => dispatch(actions.setDraggingCow(id, pos)),
        clearDraggingCow: () => dispatch(actions.clearDraggingCow()),
        // Inventory actions
        addItem: (itemType, amount) => dispatch(actions.addItem(itemType, amount)),
        removeItem: (itemType, amount) => dispatch(actions.removeItem(itemType, amount)),
        setItem: (itemType, amount) => dispatch(actions.setItem(itemType, amount)),
        // Crafting actions
        craftInstant: (recipeId) => dispatch(actions.craftInstant(recipeId)),
        startCrafting: (recipeId) => dispatch(actions.startCrafting(recipeId)),
        completeCrafting: (craftingId) => dispatch(actions.completeCrafting(craftingId)),
        cancelCrafting: (craftingId) => dispatch(actions.cancelCrafting(craftingId)),
        // Resource actions
        addCoins: (amount) => dispatch(actions.addCoins(amount)),
        spendCoins: (amount) => dispatch(actions.spendCoins(amount)),
    }), []);

    // ---- Context Value ----
    const contextValue = useMemo(() => ({
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
        
        // Actions (pre-bound for convenience)
        ...actionCreators,
        
        // Game control
        pause: gameLoop.pause,
        resume: gameLoop.resume,
        isPaused: gameLoop.isPaused,
        
        // Save/Load with loading states
        saveGame: handleSaveGame,
        loadGame: handleLoadGame,
        isSaving: saveLoadState.saving,
        isLoading: saveLoadState.loading,
        saveLoadError: saveLoadState.error,
        
        // Utilities
        colorToString,
        mousePosition,
    }), [state, actionCreators, gameLoop.pause, gameLoop.resume, gameLoop.isPaused, handleSaveGame, handleLoadGame, saveLoadState, mousePosition]);

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
export function useGame() {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
}

/**
 * Access just the game state (optimized for frequent reads)
 */
export function useGameState() {
    const { state } = useGame();
    return state;
}

/**
 * Access just the dispatch function
 */
export function useGameDispatch() {
    const { dispatch } = useGame();
    return dispatch;
}

/**
 * Access mouse position
 */
export function useMousePosition() {
    return useContext(MouseContext);
}

/**
 * Access cows list
 */
export function useCows() {
    const { cows } = useGame();
    return cows;
}

/**
 * Access a single cow by ID
 */
export function useCow(cowId) {
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
export function useResources() {
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
        hasItem: (itemType, amount = 1) => (inventory[itemType] || 0) >= amount,
        // Helper to get item count
        getItemCount: (itemType) => inventory[itemType] || 0,
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
        canCraft: (recipe) => {
            if (!recipe) return false;
            return recipe.inputs.every(input => 
                (inventory[input.item] || 0) >= input.qty
            );
        },
    };
}

// ============================================
// PROP TYPES
// ============================================

GameProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export default GameProvider;

