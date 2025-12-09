/**
 * Save Manager
 * 
 * Central orchestration for save/load operations.
 * Handles localStorage persistence with future Supabase preparation.
 */

import { GameState } from '../engine/types';
import { GAME_CONFIG, GameConfigType } from '../config/gameConfig';
import {
    SaveData,
    SaveResult,
    LoadResult,
    SavedGameState,
    ConfigOverrides,
    SaveMigration,
    SAVE_CONFIG,
} from './saveTypes';
import {
    getConfigOverrides,
    applyConfigOverrides,
    validateOverrides,
} from './configDiff';

// ============================================
// MIGRATIONS
// ============================================

/**
 * Save data migrations for version upgrades
 * Add migrations here when save format changes in the future
 */
const migrations: SaveMigration[] = [
    // Example migration (not used currently):
    // {
    //     fromVersion: 1,
    //     toVersion: 2,
    //     migrate: (data: unknown) => { ... },
    // },
];

/**
 * Run migrations on save data
 */
function runMigrations(data: SaveData): SaveData {
    let currentData = data;
    let currentVersion = data.version || 1;
    
    while (currentVersion < SAVE_CONFIG.CURRENT_VERSION) {
        const versionToMigrate = currentVersion;
        const migration = migrations.find(m => m.fromVersion === versionToMigrate);
        if (!migration) {
            console.warn(`No migration found for version ${versionToMigrate}`);
            break;
        }
        
        console.log(`Migrating save from v${migration.fromVersion} to v${migration.toVersion}`);
        currentData = migration.migrate(currentData) as SaveData;
        currentVersion = migration.toVersion;
    }
    
    currentData.version = SAVE_CONFIG.CURRENT_VERSION;
    return currentData;
}

// ============================================
// STATE EXTRACTION
// ============================================

/**
 * Extract saveable game state from full GameState
 * Excludes runtime-only state (tools, ui, dragging, etc.)
 */
export function extractSaveableState(state: GameState): SavedGameState {
    return {
        cows: state.cows,
        resources: state.resources,
        inventory: state.inventory,
        craftingQueue: state.craftingQueue,
        activeBoardCraft: state.activeBoardCraft,
        playTime: state.playTime,
    };
}

// ============================================
// LOCAL STORAGE OPERATIONS
// ============================================

/**
 * Save game to localStorage
 */
export function saveToLocalStorage(
    state: GameState,
    configOverrides: ConfigOverrides = {}
): SaveResult {
    try {
        const saveData: SaveData = {
            version: SAVE_CONFIG.CURRENT_VERSION,
            savedAt: Date.now(),
            gameState: extractSaveableState(state),
            configOverrides,
        };
        
        localStorage.setItem(
            SAVE_CONFIG.LOCAL_STORAGE_KEY,
            JSON.stringify(saveData)
        );
        
        return { success: true, saveId: 'local', source: 'local' };
    } catch (error) {
        console.error('Failed to save to localStorage:', error);
        return { success: false, error, source: 'local' };
    }
}

/**
 * Load game from localStorage
 */
export function loadFromLocalStorage(): LoadResult {
    try {
        const saved = localStorage.getItem(SAVE_CONFIG.LOCAL_STORAGE_KEY);
        if (!saved) {
            return { success: false, error: 'No save found', source: 'local' };
        }
        
        let data: SaveData = JSON.parse(saved);
        
        // Run migrations if needed
        if (data.version < SAVE_CONFIG.CURRENT_VERSION) {
            data = runMigrations(data);
            // Re-save migrated data
            localStorage.setItem(
                SAVE_CONFIG.LOCAL_STORAGE_KEY,
                JSON.stringify(data)
            );
        }
        
        // Warn if save is from future version
        if (data.version > SAVE_CONFIG.CURRENT_VERSION) {
            console.warn(
                `Save data is from a newer version (${data.version} > ${SAVE_CONFIG.CURRENT_VERSION}). ` +
                'Some features may not work correctly.'
            );
        }
        
        // Validate config overrides
        const invalidPaths = validateOverrides(data.configOverrides || {});
        if (invalidPaths.length > 0) {
            console.warn('Removing invalid config overrides:', invalidPaths);
            for (const path of invalidPaths) {
                delete data.configOverrides[path];
            }
        }
        
        return { success: true, data, source: 'local' };
    } catch (error) {
        console.error('Failed to load from localStorage:', error);
        return { success: false, error, source: 'local' };
    }
}

/**
 * Check if save data exists
 */
export function hasSaveData(): boolean {
    return localStorage.getItem(SAVE_CONFIG.LOCAL_STORAGE_KEY) !== null;
}

/**
 * Delete save data
 */
export function deleteSave(): SaveResult {
    try {
        localStorage.removeItem(SAVE_CONFIG.LOCAL_STORAGE_KEY);
        return { success: true, source: 'local' };
    } catch (error) {
        console.error('Failed to delete save:', error);
        return { success: false, error, source: 'local' };
    }
}

// ============================================
// EFFECTIVE CONFIG
// ============================================

// Current effective config (with overrides applied)
let effectiveConfig: GameConfigType = GAME_CONFIG;
let currentOverrides: ConfigOverrides = {};

/**
 * Get the current effective config (defaults + overrides)
 */
export function getEffectiveConfig(): GameConfigType {
    return effectiveConfig;
}

/**
 * Get current config overrides
 */
export function getCurrentOverrides(): ConfigOverrides {
    return { ...currentOverrides };
}

/**
 * Set config overrides and update effective config
 */
export function setConfigOverrides(overrides: ConfigOverrides): void {
    currentOverrides = { ...overrides };
    effectiveConfig = applyConfigOverrides(overrides);
}

/**
 * Update a single config value
 * Returns true if the value was changed
 */
export function setConfigValue(path: string, value: number): boolean {
    const currentValue = getConfigOverrides(effectiveConfig)[path];
    if (currentValue === value) {
        return false;
    }
    
    currentOverrides[path] = value;
    effectiveConfig = applyConfigOverrides(currentOverrides);
    return true;
}

/**
 * Reset a config value to default
 */
export function resetConfigValue(path: string): void {
    delete currentOverrides[path];
    effectiveConfig = applyConfigOverrides(currentOverrides);
}

/**
 * Reset all config overrides to defaults
 */
export function resetAllConfigOverrides(): void {
    currentOverrides = {};
    effectiveConfig = GAME_CONFIG;
}

// ============================================
// HIGH-LEVEL SAVE/LOAD
// ============================================

/**
 * Save game state and config overrides
 */
export function saveGame(state: GameState): SaveResult {
    return saveToLocalStorage(state, currentOverrides);
}

/**
 * Load game and apply config overrides
 * Returns the saved game state or null if no save exists
 */
export function loadGame(): SavedGameState | null {
    const result = loadFromLocalStorage();
    
    if (!result.success || !result.data) {
        return null;
    }
    
    // Apply config overrides
    setConfigOverrides(result.data.configOverrides || {});
    
    return result.data.gameState;
}

/**
 * Get save metadata without loading full state
 */
export function getSaveInfo(): { exists: boolean; savedAt?: number; playTime?: number } {
    try {
        const saved = localStorage.getItem(SAVE_CONFIG.LOCAL_STORAGE_KEY);
        if (!saved) {
            return { exists: false };
        }
        
        const data: SaveData = JSON.parse(saved);
        return {
            exists: true,
            savedAt: data.savedAt,
            playTime: data.gameState?.playTime,
        };
    } catch {
        return { exists: false };
    }
}

