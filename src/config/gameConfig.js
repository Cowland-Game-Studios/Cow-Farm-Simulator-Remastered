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
        // Pulse animation timing
        PULSE_DURATION_MS: 600,              // Duration of pulse animation
        PULSE_MIN_INTERVAL_MS: 3000,         // Min time between pulses
        PULSE_MAX_INTERVAL_MS: 6000,         // Max time between pulses
        PULSE_INITIAL_DELAY_MIN_MS: 1000,    // Min delay before first pulse
        PULSE_INITIAL_DELAY_MAX_MS: 3000,    // Max delay before first pulse
        DRAG_THRESHOLD: 10,                  // Distance to consider a drag vs click
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
        DEFAULT_BOTTOM_SAFE_AREA: 200,       // Safe area at bottom (fence)
        DEFAULT_ROPE_LENGTH: 80,             // Default rope length for draggables
        DEFAULT_GRAVITY: 0.5,                // Default gravity for draggables
        DEFAULT_DAMPING: 0.98,               // Default damping for draggables
        // Flying/throwing physics
        VELOCITY_THRESHOLD: 3,               // Speed threshold to stop flying
        FLIGHT_FRICTION: 0.985,              // Air friction during flight (lower = more friction)
        BOUNCE_FACTOR: 0.85,                 // Energy retained on bounce (0-1)
        FLIGHT_GRAVITY_MULTIPLIER: 0.3,      // Gravity reduction during flight
        SPIN_DECAY: 0.98,                    // How fast spin slows down
        SPIN_ON_BOUNCE_MULTIPLIER: 0.5,      // Spin added on wall bounce
        THROW_VELOCITY_MULTIPLIER: 2.5,      // Amplify throw velocity
        CURSOR_DRAG_MULTIPLIER: 0.3,         // How much cursor movement affects swing
        THROW_TRACKING_SMOOTHING: 0.7,       // Smoothing for throw velocity tracking
        THROW_TRACKING_SENSITIVITY: 0.8,     // Sensitivity for throw velocity tracking
        RADIAL_VEL_CORRECTION: 0.5,          // Radial velocity correction factor
        // Flying scale settings
        FLYING_BASE_SCALE: 1.2,              // Base scale when flying
        FLYING_MAX_SCALE_BONUS: 0.3,         // Max additional scale from speed
        FLYING_SCALE_SPEED_DIVISOR: 30,      // Speed divisor for scale calculation
        DRAGGING_SCALE: 1.15,                // Scale when dragging
    },

    // UI settings
    UI: {
        ANIMATION_DURATION_MS: 300,          // Standard animation duration
        FADE_OUT_DURATION_MS: 400,           // Fade out animation duration
        AUTO_SAVE_INTERVAL_MS: 30000,        // Auto-save interval (30 seconds)
        MIN_SAVE_INTERVAL_MS: 10000,         // Minimum time between saves
        HIDE_TIMEOUT_MS: 400,                // Timeout for hiding elements after fade
        TRANSITION_FAST_MS: 100,             // Fast transition duration
        TRANSITION_NORMAL_MS: 300,           // Normal transition duration
        TRANSITION_SLOW_MS: 400,             // Slow transition duration
        DRAGGING_Z_INDEX: 1000,              // Z-index for dragging elements
        DOUBLE_TAP_DELAY_MS: 300,            // Time window for double-tap detection
        DOUBLE_CLICK_DELAY_MS: 250,          // Delay to wait for potential double-click
    },

    // Save/Load settings
    SAVE: {
        LOCAL_STORAGE_KEY: 'cow_farm_save',  // localStorage key for saves
        SAVE_VERSION: 1,                      // Current save format version
    },

    // Particle system settings
    PARTICLES: {
        // Default spawn settings
        DEFAULT_VY: -3,                      // Default upward velocity
        DEFAULT_GRAVITY: 0.15,               // Default gravity
        DEFAULT_FONT_SIZE: 24,               // Default font size
        DEFAULT_LIFETIME_MS: 1500,           // Default particle lifetime
        DEFAULT_FADE_DELAY_MS: 500,          // Default delay before fading
        HORIZONTAL_DAMPING: 0.98,            // Horizontal velocity damping
        FRAME_TIME_MS: 16.67,                // Target frame time (~60fps)
        // Milk particle
        MILK_VY: -4,
        MILK_GRAVITY: 0.12,
        MILK_LIFETIME_MS: 1800,
        MILK_FADE_DELAY_MS: 600,
        MILK_VX_RANGE: 2,                    // Random range for vx
        // Feed particle
        FEED_VY: -5,
        FEED_GRAVITY: 0.18,
        FEED_LIFETIME_MS: 2000,
        FEED_FADE_DELAY_MS: 800,
        // Breed particle
        BREED_VY: -4,
        BREED_GRAVITY: 0.12,
        BREED_LIFETIME_MS: 2000,
        BREED_FADE_DELAY_MS: 700,
        // Crafting particle
        CRAFTING_VY: -3,
        CRAFTING_GRAVITY: 0.08,
        CRAFTING_FONT_SIZE: 16,
        CRAFTING_LIFETIME_MS: 1200,
        CRAFTING_FADE_DELAY_MS: 400,
        CRAFTING_VX_RANGE: 1.5,
        // Burst/explosion defaults
        BURST_DEFAULT_COUNT: 8,
        BURST_DEFAULT_SPEED: 5,
        BURST_DEFAULT_GRAVITY: 0.1,
        BURST_DEFAULT_LIFETIME_MS: 1000,
        BURST_DEFAULT_FADE_DELAY_MS: 300,
        BURST_SPEED_VARIANCE: 0.4,           // ±40% speed variation
        BURST_ANGLE_VARIANCE: 0.3,           // Random angle offset
        // Explosion defaults
        EXPLOSION_DEFAULT_COUNT: 12,
        EXPLOSION_DEFAULT_SPEED: 6,
        EXPLOSION_DEFAULT_GRAVITY: 0.15,
        EXPLOSION_DEFAULT_LIFETIME_MS: 1200,
        EXPLOSION_DEFAULT_FADE_DELAY_MS: 400,
        // Spray defaults
        SPRAY_DEFAULT_COUNT: 5,
        SPRAY_DEFAULT_SPREAD: Math.PI / 3,   // 60 degree cone
        SPRAY_DEFAULT_SPEED: 5,
        SPRAY_DEFAULT_GRAVITY: 0.2,
        SPRAY_DEFAULT_LIFETIME_MS: 1000,
        SPRAY_DEFAULT_FADE_DELAY_MS: 300,
    },

    // Stats display settings
    STATS: {
        XP_PER_LEVEL: 10000,                 // XP required per level
        PROGRESS_BAR_LENGTH: 10,             // Number of characters in progress bar
    },
};

// Note: Color utilities are in gameState.js using structured color objects
// Use createColor, colorToString, and averageColors from '../engine/gameState'

