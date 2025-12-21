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
    // Cloud sync
    initializeCloudSync,
    cleanupCloudSync,
    saveGameWithSync,
    syncNow,
    loadGameWithSync,
    getCloudSyncState,
    onCloudSyncStateChange,
    isCloudSyncAvailable,
} from './saveManager';

export type { LoadWithSyncResult } from './saveManager';

// Sync types and hooks
export type { SyncStatus, SyncState, SyncResult } from './syncService';
export { useSyncStatus, getSyncStatusMessage } from './syncService';

// Database types
export type { Database, GameSaveRow, GameSaveInsert, GameSaveUpdate } from './database.types';

// Auth service
export {
    getCurrentUser,
    getSession,
    isAnonymousUser,
    getStoredUserId,
    signInAnonymously,
    linkWithEmail,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    initializeAuth,
    onAuthStateChange,
} from './authService';

export type { AuthState, AuthResult } from './authService';

// Supabase utilities
export { isSupabaseConfigured } from './supabase';

