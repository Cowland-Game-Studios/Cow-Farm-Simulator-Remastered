/**
 * Game Engine - Main Export
 * 
 * Centralized game architecture with:
 * - Unified state management (reducer pattern)
 * - Particle system for visual effects
 * - Single game loop
 * - Supabase-ready persistence
 */

// State management
export { 
    gameReducer, 
    createInitialState, 
    actions,
    createColor,
    colorToString,
    averageColors,
    createCow,
} from './gameState';

// Types
export { ActionTypes } from './types';

// Particle system
export {
    particleSystem,
    useParticles,
} from './particleSystem';

// Game loop hooks
export {
    useGameLoop,
} from './gameLoop';

// Context and hooks
export {
    GameProvider,
    useGame,
    useGameState,
    useGameDispatch,
    useMousePosition,
    useCows,
    useCow,
    useTools,
    useResources,
} from './GameProvider';

// Default export is the provider
export { default } from './GameProvider';
