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
    },
};

// Helper to create RGBA color string
export const createCowColor = (r, g, b) => {
    return `rgba(${r}, ${g}, ${b}, ${GAME_CONFIG.VISUAL.COW_COLOR_OPACITY})`;
};

// Helper to average two RGBA colors
export const averageColors = (rgba1, rgba2) => {
    const parse = (rgba) => {
        const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (!match) return { r: 0, g: 0, b: 0 };
        return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
    };

    const c1 = parse(rgba1);
    const c2 = parse(rgba2);

    return createCowColor(
        Math.round((c1.r + c2.r) / 2),
        Math.round((c1.g + c2.g) / 2),
        Math.round((c1.b + c2.b) / 2)
    );
};

