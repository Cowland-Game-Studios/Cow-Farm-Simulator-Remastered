/**
 * Centralized Game Loop
 * 
 * Features:
 * - Single RAF loop for entire game
 * - Delta time for consistent physics
 * - Pausable
 */

import { useEffect, useRef, useCallback } from 'react';
import { actions } from './gameState';
import { GameState, GameAction } from './types';
import { GAME_CONFIG } from '../config/gameConfig';

// ============================================
// GAME LOOP HOOK
// ============================================

interface GameLoopReturn {
    pause: () => void;
    resume: () => void;
    isPaused: boolean;
}

/**
 * Custom hook that runs the game loop
 */
export function useGameLoop(state: GameState, dispatch: React.Dispatch<GameAction>): GameLoopReturn {
    const animationRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number>(performance.now());
    const pausedRef = useRef<boolean>(state.ui.paused);

    // Keep pausedRef in sync with state
    useEffect(() => {
        pausedRef.current = state.ui.paused;
    }, [state.ui.paused]);

    const gameLoop = useCallback((currentTime: number) => {
        // Calculate delta time
        let delta = currentTime - lastTimeRef.current;
        lastTimeRef.current = currentTime;

        // Cap delta to prevent large jumps (e.g., tab was inactive)
        delta = Math.min(delta, GAME_CONFIG.GAME_LOOP.MAX_DELTA_MS);

        // Don't update if paused - use ref to avoid stale closure
        if (!pausedRef.current) {
            // Dispatch tick for milk production, etc.
            dispatch(actions.tick(delta));
        }

        // Schedule next frame
        animationRef.current = requestAnimationFrame(gameLoop);
    }, [dispatch]);

    useEffect(() => {
        // Start the loop
        lastTimeRef.current = performance.now();
        animationRef.current = requestAnimationFrame(gameLoop);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [gameLoop]);

    return {
        pause: () => dispatch(actions.pauseGame()),
        resume: () => dispatch(actions.resumeGame()),
        isPaused: state.ui.paused,
    };
}

export default useGameLoop;

