/**
 * Sync Service
 * 
 * Handles offline-first synchronization between localStorage and Supabase.
 * Uses timestamp-based conflict resolution (latest wins).
 */

import { GameState } from '../engine/types';
import { SavedGameState } from './saveTypes';
import { isSupabaseConfigured } from './supabase';
import { initializeAuth, getCurrentUser } from './authService';
import {
    saveToSupabase,
    loadFromSupabase,
    getServerSaveInfo,
    isSupabaseReachable,
} from './supabaseService';
import { loadFromLocalStorage } from './saveManager';

// ============================================
// TYPES
// ============================================

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';
export type SyncDirection = 'push' | 'pull' | 'none';

export interface SyncResult {
    success: boolean;
    direction?: SyncDirection;
    data?: SavedGameState;
    error?: string;
}

export interface SyncState {
    status: SyncStatus;
    lastSyncedAt: number | null;
    error: string | null;
}

// ============================================
// STATE
// ============================================

let syncState: SyncState = {
    status: 'idle',
    lastSyncedAt: null,
    error: null,
};

// Listeners for sync state changes
type SyncListener = (state: SyncState) => void;
const listeners: Set<SyncListener> = new Set();

function notifyListeners(): void {
    listeners.forEach(listener => listener({ ...syncState }));
}

function updateSyncState(updates: Partial<SyncState>): void {
    syncState = { ...syncState, ...updates };
    notifyListeners();
}

// ============================================
// PUBLIC API
// ============================================

/**
 * Get current sync state
 */
export function getSyncState(): SyncState {
    return { ...syncState };
}

/**
 * Subscribe to sync state changes
 */
export function onSyncStateChange(callback: SyncListener): () => void {
    listeners.add(callback);
    return () => listeners.delete(callback);
}

/**
 * Get local save timestamp
 */
export function getLocalSaveTimestamp(): number | null {
    const result = loadFromLocalStorage();
    if (!result.success || !result.data) return null;
    return result.data.savedAt;
}

/**
 * Check if we're online
 */
export function isOnline(): boolean {
    return navigator.onLine;
}

/**
 * Initialize sync service
 * - Sets up auth
 * - Registers online/offline listeners
 * - Performs initial sync if online
 */
export async function initializeSync(): Promise<void> {
    if (!isSupabaseConfigured()) {
        updateSyncState({ status: 'offline', error: 'Supabase not configured' });
        return;
    }

    // Initialize auth
    const authResult = await initializeAuth();
    if (!authResult.success) {
        updateSyncState({ status: 'error', error: 'Auth failed' });
        return;
    }

    // Set up online/offline listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set initial status
    if (!navigator.onLine) {
        updateSyncState({ status: 'offline' });
    }
}

/**
 * Sync local state with server
 * Main sync function - compares timestamps and syncs accordingly
 */
export async function sync(localState: GameState): Promise<SyncResult> {
    if (!isSupabaseConfigured()) {
        return { success: false, error: 'Supabase not configured' };
    }

    if (!navigator.onLine) {
        updateSyncState({ status: 'offline' });
        return { success: false, error: 'Offline' };
    }

    const user = await getCurrentUser();
    if (!user) {
        updateSyncState({ status: 'error', error: 'Not authenticated' });
        return { success: false, error: 'Not authenticated' };
    }

    updateSyncState({ status: 'syncing', error: null });

    try {
        // Check if Supabase is reachable
        const reachable = await isSupabaseReachable();
        if (!reachable) {
            updateSyncState({ status: 'offline' });
            return { success: false, error: 'Server unreachable' };
        }

        // Get server save info
        const serverInfoResult = await getServerSaveInfo();
        if (!serverInfoResult.success) {
            updateSyncState({ status: 'error', error: serverInfoResult.error });
            return { success: false, error: serverInfoResult.error };
        }

        // Get local save timestamp
        const localSavedAt = getLocalSaveTimestamp() || 0;
        const serverSavedAt = serverInfoResult.info?.savedAt || 0;

        // No server save exists - push local
        if (!serverInfoResult.info) {
            const pushResult = await saveToSupabase(localState);
            if (pushResult.success) {
                updateSyncState({ status: 'synced', lastSyncedAt: Date.now() });
                return { success: true, direction: 'push' };
            }
            updateSyncState({ status: 'error', error: pushResult.error });
            return { success: false, error: pushResult.error };
        }

        // Compare timestamps
        if (localSavedAt > serverSavedAt) {
            // Local is newer - push to server
            const pushResult = await saveToSupabase(localState);
            if (pushResult.success) {
                updateSyncState({ status: 'synced', lastSyncedAt: Date.now() });
                return { success: true, direction: 'push' };
            }
            updateSyncState({ status: 'error', error: pushResult.error });
            return { success: false, error: pushResult.error };
        } else if (serverSavedAt > localSavedAt) {
            // Server is newer - pull from server
            const loadResult = await loadFromSupabase();
            if (loadResult.success && loadResult.data) {
                // Save server data to localStorage
                const serverState = loadResult.data.gameState;
                updateSyncState({ status: 'synced', lastSyncedAt: Date.now() });
                return { success: true, direction: 'pull', data: serverState };
            }
            updateSyncState({ status: 'error', error: loadResult.error });
            return { success: false, error: loadResult.error };
        }

        // Timestamps are equal - already synced
        updateSyncState({ status: 'synced', lastSyncedAt: Date.now() });
        return { success: true, direction: 'none' };
    } catch (err) {
        const error = err instanceof Error ? err.message : 'Unknown error';
        updateSyncState({ status: 'error', error });
        return { success: false, error };
    }
}

/**
 * Force push local state to server (overwrites server)
 */
export async function forcePush(localState: GameState): Promise<SyncResult> {
    if (!isSupabaseConfigured()) {
        return { success: false, error: 'Supabase not configured' };
    }

    if (!navigator.onLine) {
        return { success: false, error: 'Offline' };
    }

    updateSyncState({ status: 'syncing', error: null });

    const result = await saveToSupabase(localState);
    if (result.success) {
        updateSyncState({ status: 'synced', lastSyncedAt: Date.now() });
        return { success: true, direction: 'push' };
    }

    updateSyncState({ status: 'error', error: result.error });
    return { success: false, error: result.error };
}

/**
 * Force pull from server (overwrites local)
 */
export async function forcePull(): Promise<SyncResult> {
    if (!isSupabaseConfigured()) {
        return { success: false, error: 'Supabase not configured' };
    }

    if (!navigator.onLine) {
        return { success: false, error: 'Offline' };
    }

    updateSyncState({ status: 'syncing', error: null });

    const result = await loadFromSupabase();
    if (result.success && result.data) {
        updateSyncState({ status: 'synced', lastSyncedAt: Date.now() });
        return { success: true, direction: 'pull', data: result.data.gameState };
    }

    updateSyncState({ status: 'error', error: result.error });
    return { success: false, error: result.error };
}

// ============================================
// EVENT HANDLERS
// ============================================

function handleOnline(): void {
    updateSyncState({ status: 'idle', error: null });
    // Sync will be triggered by the game's autosave or manual trigger
}

function handleOffline(): void {
    updateSyncState({ status: 'offline', error: null });
}

// ============================================
// CLEANUP
// ============================================

/**
 * Cleanup sync service (remove listeners)
 */
export function cleanupSync(): void {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    listeners.clear();
}

