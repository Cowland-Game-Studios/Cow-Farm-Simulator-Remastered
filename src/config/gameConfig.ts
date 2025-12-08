// Centralized game configuration
// All game constants should be defined here for easy tuning and consistency

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
    time: number; // 0 = instant, > 0 = timed in seconds
    inputs: RecipeInput[];
    outputs: RecipeOutput[];
}

export interface ItemDefinition {
    name: string;
    icon: string;
    category: 'resource' | 'product';
    description: string;
    buyPrice?: number;
    sellPrice?: number;
}

export interface ItemsConfig {
    [key: string]: ItemDefinition;
}

export interface GameConfigType {
    COW: {
        MILK_PRODUCTION_TIME_MS: number;
        FULLNESS_POLL_INTERVAL_MS: number;
        TOUCH_CHECK_INTERVAL_MS: number;
        TOUCH_DISTANCE_THRESHOLD: number;
        MOVE_MAX_DISTANCE: number;
        MOVE_DISTANCE_FULL_MULTIPLIER: number;
        MOVE_INTERVAL_MAX_MS: number;
        INITIAL_FULLNESS_HUNGRY: number;
        INITIAL_FULLNESS_PRODUCING: number;
        SCALE_FULL: number;
        SCALE_HUNGRY: number;
        SCALE_NORMAL: number;
        BREEDING_COOLDOWN_MS: number;
        PULSE_DURATION_MS: number;
        PULSE_MIN_INTERVAL_MS: number;
        PULSE_MAX_INTERVAL_MS: number;
        PULSE_INITIAL_DELAY_MIN_MS: number;
        PULSE_INITIAL_DELAY_MAX_MS: number;
        DRAG_THRESHOLD: number;
    };
    VISUAL: {
        COW_COLOR_OPACITY: number;
    };
    PHYSICS: {
        COW_ROPE_LENGTH: number;
        COW_GRAVITY: number;
        COW_DAMPING: number;
        BUCKET_ROPE_LENGTH: number;
        BUCKET_GRAVITY: number;
        BUCKET_DAMPING: number;
        FEED_ROPE_LENGTH: number;
        FEED_GRAVITY: number;
        FEED_DAMPING: number;
        DEFAULT_COLLISION_THRESHOLD: number;
        DEFAULT_SAFE_AREA: number;
        DEFAULT_BOTTOM_SAFE_AREA: number;
        DEFAULT_ROPE_LENGTH: number;
        DEFAULT_GRAVITY: number;
        DEFAULT_DAMPING: number;
        VELOCITY_THRESHOLD: number;
        FLIGHT_FRICTION: number;
        BOUNCE_FACTOR: number;
        FLIGHT_GRAVITY_MULTIPLIER: number;
        SPIN_DECAY: number;
        SPIN_ON_BOUNCE_MULTIPLIER: number;
        THROW_VELOCITY_MULTIPLIER: number;
        CURSOR_DRAG_MULTIPLIER: number;
        THROW_TRACKING_SMOOTHING: number;
        THROW_TRACKING_SENSITIVITY: number;
        RADIAL_VEL_CORRECTION: number;
        FLYING_BASE_SCALE: number;
        FLYING_MAX_SCALE_BONUS: number;
        FLYING_SCALE_SPEED_DIVISOR: number;
        DRAGGING_SCALE: number;
    };
    UI: {
        ANIMATION_DURATION_MS: number;
        FADE_OUT_DURATION_MS: number;
        AUTO_SAVE_INTERVAL_MS: number;
        MIN_SAVE_INTERVAL_MS: number;
        HIDE_TIMEOUT_MS: number;
        TRANSITION_FAST_MS: number;
        TRANSITION_NORMAL_MS: number;
        TRANSITION_SLOW_MS: number;
        DRAGGING_Z_INDEX: number;
        DOUBLE_TAP_DELAY_MS: number;
        DOUBLE_CLICK_DELAY_MS: number;
    };
    SAVE: {
        LOCAL_STORAGE_KEY: string;
        SAVE_VERSION: number;
    };
    PARTICLES: {
        DEFAULT_VY: number;
        DEFAULT_GRAVITY: number;
        DEFAULT_FONT_SIZE: number;
        DEFAULT_LIFETIME_MS: number;
        DEFAULT_FADE_DELAY_MS: number;
        HORIZONTAL_DAMPING: number;
        FRAME_TIME_MS: number;
        MILK_VY: number;
        MILK_GRAVITY: number;
        MILK_LIFETIME_MS: number;
        MILK_FADE_DELAY_MS: number;
        MILK_VX_RANGE: number;
        FEED_VY: number;
        FEED_GRAVITY: number;
        FEED_LIFETIME_MS: number;
        FEED_FADE_DELAY_MS: number;
        BREED_VY: number;
        BREED_GRAVITY: number;
        BREED_LIFETIME_MS: number;
        BREED_FADE_DELAY_MS: number;
        CRAFTING_VY: number;
        CRAFTING_GRAVITY: number;
        CRAFTING_FONT_SIZE: number;
        CRAFTING_LIFETIME_MS: number;
        CRAFTING_FADE_DELAY_MS: number;
        CRAFTING_VX_RANGE: number;
        BURST_DEFAULT_COUNT: number;
        BURST_DEFAULT_SPEED: number;
        BURST_DEFAULT_GRAVITY: number;
        BURST_DEFAULT_LIFETIME_MS: number;
        BURST_DEFAULT_FADE_DELAY_MS: number;
        BURST_SPEED_VARIANCE: number;
        BURST_ANGLE_VARIANCE: number;
        EXPLOSION_DEFAULT_COUNT: number;
        EXPLOSION_DEFAULT_SPEED: number;
        EXPLOSION_DEFAULT_GRAVITY: number;
        EXPLOSION_DEFAULT_LIFETIME_MS: number;
        EXPLOSION_DEFAULT_FADE_DELAY_MS: number;
        SPRAY_DEFAULT_COUNT: number;
        SPRAY_DEFAULT_SPREAD: number;
        SPRAY_DEFAULT_SPEED: number;
        SPRAY_DEFAULT_GRAVITY: number;
        SPRAY_DEFAULT_LIFETIME_MS: number;
        SPRAY_DEFAULT_FADE_DELAY_MS: number;
    };
    STATS: {
        XP_PER_LEVEL: number;
        PROGRESS_BAR_LENGTH: number;
    };
    ITEMS: ItemsConfig;
    RECIPES: Recipe[];
    SHOP: {
        GRASS_BUNDLE_SIZE: number;
        GRASS_BUNDLE_PRICE: number;
    };
}

export const GAME_CONFIG: GameConfigType = {
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

    // Item definitions
    ITEMS: {
        milk: { 
            name: 'Milk', 
            icon: './images/crafting/products/milk.svg',
            category: 'resource',
            description: 'Fresh milk from your cows',
        },
        grass: { 
            name: 'Grass', 
            icon: './images/pasture/grass.svg',
            category: 'resource',
            description: 'Feed for hungry cows',
            buyPrice: 10, // Can buy grass with coins
        },
        cream: { 
            name: 'Cream', 
            icon: './images/crafting/products/cream.svg',
            category: 'product',
            description: 'Rich cream made from milk',
            sellPrice: 25,
        },
        butter: { 
            name: 'Butter', 
            icon: './images/crafting/products/butter.svg',
            category: 'product',
            description: 'Smooth butter churned from milk',
            sellPrice: 30,
        },
        cheese: { 
            name: 'Cheese', 
            icon: './images/crafting/products/cheese.svg',
            category: 'product',
            description: 'Aged cheese with rich flavor',
            sellPrice: 50,
        },
        yogurt: { 
            name: 'Yogurt', 
            icon: './images/crafting/products/yogurt.svg',
            category: 'product',
            description: 'Creamy cultured yogurt',
            sellPrice: 35,
        },
        iceCream: { 
            name: 'Ice Cream', 
            icon: './images/crafting/products/ice cream.svg',
            category: 'product',
            description: 'Delicious frozen treat',
            sellPrice: 75,
        },
        cheesecake: { 
            name: 'Cheesecake', 
            icon: './images/crafting/products/cheesecake.svg',
            category: 'product',
            description: 'Decadent cheesecake dessert',
            sellPrice: 100,
        },
    },

    // Crafting recipes
    // time: 0 = instant, time > 0 = timed in seconds
    RECIPES: [
        {
            id: 'milk-to-cream',
            name: 'Make Cream',
            time: 0, // instant
            inputs: [{ item: 'milk', qty: 2 }],
            outputs: [{ item: 'cream', qty: 1 }],
        },
        {
            id: 'milk-to-butter',
            name: 'Make Butter',
            time: 0, // instant
            inputs: [{ item: 'milk', qty: 2 }],
            outputs: [{ item: 'butter', qty: 1 }],
        },
        {
            id: 'milk-to-yogurt',
            name: 'Make Yogurt',
            time: 0, // instant
            inputs: [{ item: 'milk', qty: 2 }],
            outputs: [{ item: 'yogurt', qty: 1 }],
        },
        {
            id: 'milk-to-cheese',
            name: 'Age Cheese',
            time: 60, // 60 seconds (timed)
            inputs: [{ item: 'milk', qty: 3 }],
            outputs: [{ item: 'cheese', qty: 1 }],
        },
        {
            id: 'cream-to-icecream',
            name: 'Make Ice Cream',
            time: 30, // 30 seconds (timed)
            inputs: [{ item: 'cream', qty: 2 }, { item: 'milk', qty: 1 }],
            outputs: [{ item: 'iceCream', qty: 1 }],
        },
        {
            id: 'cheese-to-cheesecake',
            name: 'Bake Cheesecake',
            time: 120, // 120 seconds (timed)
            inputs: [{ item: 'cheese', qty: 2 }, { item: 'cream', qty: 1 }],
            outputs: [{ item: 'cheesecake', qty: 1 }],
        },
    ],

    // Shop settings
    SHOP: {
        GRASS_BUNDLE_SIZE: 5,                // How much grass per purchase
        GRASS_BUNDLE_PRICE: 50,              // Price for grass bundle
    },
};

// Note: Color utilities are in gameState.ts using structured color objects
// Use createColor, colorToString, and averageColors from '../engine/gameState'

