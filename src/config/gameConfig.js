// Centralized game configuration
// All game constants should be defined here for easy tuning and consistency

export const GAME_CONFIG = {
    // Cow settings
    COW: {
        MILK_PRODUCTION_TIME_MS: 30000,      // Time to fully produce milk
        FULLNESS_POLL_INTERVAL_MS: 1000,     // How often to update fullness
        TOUCH_CHECK_INTERVAL_MS: 100,        // How often to check for bucket touch
        TOUCH_DISTANCE_THRESHOLD: 50,        // Pixels for collision detection
        MOVE_MAX_DISTANCE: 100,              // Max random movement distance
        MOVE_DISTANCE_FULL_MULTIPLIER: 0.25, // Movement reduction when full
        MOVE_INTERVAL_MAX_MS: 10000,         // Max time between random moves
        INITIAL_FULLNESS_HUNGRY: 0.1,        // Fullness when hungry
        INITIAL_FULLNESS_PRODUCING: 0.25,    // Fullness when starting production
        SCALE_FULL: 1.1,                     // Scale when cow is full
        SCALE_HUNGRY: 0.8,                   // Scale when cow is hungry
        SCALE_NORMAL: 1,                     // Normal scale
        BREEDING_COOLDOWN_MS: 5000,          // Cooldown between breeding attempts
    },

    // Visual settings
    VISUAL: {
        COW_COLOR_OPACITY: 0.5,              // Opacity for cow colors
    },

    // Physics settings
    PHYSICS: {
        COW_ROPE_LENGTH: 35,
        COW_GRAVITY: 0.6,
        COW_DAMPING: 0.97,
        BUCKET_ROPE_LENGTH: 30,
        BUCKET_GRAVITY: 0.4,
        BUCKET_DAMPING: 0.96,
        FEED_ROPE_LENGTH: 25,
        FEED_GRAVITY: 0.3,
        FEED_DAMPING: 0.95,
        DEFAULT_COLLISION_THRESHOLD: 100,    // Default collision distance for tools
        DEFAULT_SAFE_AREA: 25,               // Safe area margin from screen edges
        DEFAULT_ROPE_LENGTH: 80,             // Default rope length for draggables
        DEFAULT_GRAVITY: 0.5,                // Default gravity for draggables
        DEFAULT_DAMPING: 0.98,               // Default damping for draggables
    },

    // UI settings
    UI: {
        ANIMATION_DURATION_MS: 300,          // Standard animation duration
        FADE_OUT_DURATION_MS: 400,           // Fade out animation duration
        AUTO_SAVE_INTERVAL_MS: 30000,        // Auto-save interval (30 seconds)
        MIN_SAVE_INTERVAL_MS: 10000,         // Minimum time between saves
    },

    // Save/Load settings
    SAVE: {
        LOCAL_STORAGE_KEY: 'cow_farm_save',  // localStorage key for saves
        SAVE_VERSION: 1,                      // Current save format version
    },
};

// Note: Color utilities are in gameState.js using structured color objects
// Use createColor, colorToString, and averageColors from '../engine/gameState'

