/**
 * Save System Type Definitions
 */

import { Cow, GameResources, Inventory, CraftingQueueItem, ActiveBoardCraft, GameStats, AchievementState } from '../engine/types';
import { GAME_CONFIG } from '../config/gameConfig';

// ============================================
// SAVE DATA STRUCTURE
// ============================================

/**
 * Game state data that is always saved
 */
export interface SavedGameState {
    cows: Cow[];
    resources: GameResources;
    inventory: Inventory;
    craftingQueue: CraftingQueueItem[];
    activeBoardCraft: ActiveBoardCraft | null;
    stats: GameStats;
    achievements: AchievementState;
    level: number;
    xp: number;
    playTime: number;
}

/**
 * Config overrides - only stores values that differ from defaults
 * Keys are dot-notation paths like "COW.MILK_PRODUCTION_TIME_MS"
 */
export type ConfigOverrides = Record<string, number>;

/**
 * Complete save data stored in localStorage
 */
export interface SaveData {
    version: number;
    savedAt: number;
    gameState: SavedGameState;
    configOverrides: ConfigOverrides;
}

// ============================================
// SAVE RESULTS
// ============================================

export interface SaveResult {
    success: boolean;
    saveId?: string;
    error?: unknown;
    source?: 'local' | 'supabase';
}

export interface LoadResult {
    success: boolean;
    data?: SaveData;
    error?: unknown;
    source?: 'local' | 'supabase';
}

// ============================================
// SAVE MIGRATION
// ============================================

export interface SaveMigration {
    fromVersion: number;
    toVersion: number;
    migrate: (data: unknown) => unknown;
}

// ============================================
// CONSTANTS
// ============================================

export const SAVE_CONFIG = {
    LOCAL_STORAGE_KEY: GAME_CONFIG.SAVE.LOCAL_STORAGE_KEY,
    CURRENT_VERSION: GAME_CONFIG.SAVE.SAVE_VERSION,
    AUTO_SAVE_INTERVAL_MS: GAME_CONFIG.UI.AUTO_SAVE_INTERVAL_MS,
    MIN_SAVE_INTERVAL_MS: GAME_CONFIG.UI.MIN_SAVE_INTERVAL_MS,
};

