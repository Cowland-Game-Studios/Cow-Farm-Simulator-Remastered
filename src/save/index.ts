/**
 * Save System Public API
 */

// Types
export type {
    SaveData,
    SaveResult,
    LoadResult,
    SavedGameState,
    ConfigOverrides,
    SaveMigration,
} from './saveTypes';

export { SAVE_CONFIG } from './saveTypes';

// Config diff utilities
export {
    FROZEN_DEFAULTS,
    extractNumericPaths,
    getByPath,
    setByPath,
    getConfigOverrides,
    applyConfigOverrides,
    validateOverrides,
    getDefaultValue,
} from './configDiff';

// Save manager
export {
    saveGame,
    loadGame,
    hasSaveData,
    deleteSave,
    getSaveInfo,
    extractSaveableState,
    saveToLocalStorage,
    loadFromLocalStorage,
    getEffectiveConfig,
    getCurrentOverrides,
    setConfigOverrides,
    setConfigValue,
    resetConfigValue,
    resetAllConfigOverrides,
} from './saveManager';

