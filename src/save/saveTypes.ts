/**
 * Save System Type Definitions
 */

import { Cow, GameResources, Inventory, CraftingQueueItem, ActiveBoardCraft } from '../engine/types';

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
    LOCAL_STORAGE_KEY: 'cow_farm_save',
    CURRENT_VERSION: 1,
    AUTO_SAVE_INTERVAL_MS: 30000,
    MIN_SAVE_INTERVAL_MS: 5000,
} as const;

