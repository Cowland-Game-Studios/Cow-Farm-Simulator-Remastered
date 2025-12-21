/**
 * Sync Service
 * 
 * Handles offline-first synchronization between localStorage and Supabase.
 * Uses timestamp-based conflict resolution (latest wins).
 * Includes retry logic with exponential backoff for failed syncs.
 */

import { useState, useEffect } from 'react';
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

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error' | 'retrying';
export type SyncDirection = 'push' | 'pull' | 'none';

export interface SyncResult {
    success: boolean;
    direction?: SyncDirection;
    data?: SavedGameState;
    error?: string;
    retriesUsed?: number;
}

export interface SyncState {
    status: SyncStatus;
    lastSyncedAt: number | null;
    error: string | null;
    retryCount: number;
}

// ============================================
// RETRY CONFIGURATION
// ============================================

const RETRY_CONFIG = {
    MAX_RETRIES: 3,
    BASE_DELAY_MS: 1000,
    MAX_DELAY_MS: 10000,
};

// ============================================
// STATE
// ============================================

let syncState: SyncState = {
    status: 'idle',
    lastSyncedAt: null,
    error: null,
    retryCount: 0,
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
// RETRY UTILITIES
// ============================================

/**
 * Calculate delay for exponential backoff
 * Formula: min(baseDelay * 2^attempt, maxDelay)
 */
function getRetryDelay(attempt: number): number {
    const delay = RETRY_CONFIG.BASE_DELAY_MS * Math.pow(2, attempt);
    return Math.min(delay, RETRY_CONFIG.MAX_DELAY_MS);
}

/**
 * Wait for specified milliseconds
 */
function wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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
 * Internal sync operation (single attempt)
 */
async function syncOnce(localState: GameState): Promise<SyncResult> {
    // Check if Supabase is reachable
    const reachable = await isSupabaseReachable();
    if (!reachable) {
        return { success: false, error: 'Server unreachable' };
    }

    // Get server save info
    const serverInfoResult = await getServerSaveInfo();
    if (!serverInfoResult.success) {
        return { success: false, error: serverInfoResult.error };
    }

    // Get local save timestamp
    const localSavedAt = getLocalSaveTimestamp() || 0;
    const serverSavedAt = serverInfoResult.info?.savedAt || 0;

    // No server save exists - push local
    if (!serverInfoResult.info) {
        const pushResult = await saveToSupabase(localState);
        if (pushResult.success) {
            return { success: true, direction: 'push' };
        }
        return { success: false, error: pushResult.error };
    }

    // Compare timestamps
    if (localSavedAt > serverSavedAt) {
        // Local is newer - push to server
        const pushResult = await saveToSupabase(localState);
        if (pushResult.success) {
            return { success: true, direction: 'push' };
        }
        return { success: false, error: pushResult.error };
    } else if (serverSavedAt > localSavedAt) {
        // Server is newer - pull from server
        const loadResult = await loadFromSupabase();
        if (loadResult.success && loadResult.data) {
            const serverState = loadResult.data.gameState;
            return { success: true, direction: 'pull', data: serverState };
        }
        return { success: false, error: loadResult.error };
    }

    // Timestamps are equal - already synced
    return { success: true, direction: 'none' };
}

/**
 * Sync local state with server
 * Main sync function - compares timestamps and syncs accordingly
 * Includes retry logic with exponential backoff
 */
export async function sync(localState: GameState): Promise<SyncResult> {
    if (!isSupabaseConfigured()) {
        return { success: false, error: 'Supabase not configured' };
    }

    if (!navigator.onLine) {
        updateSyncState({ status: 'offline', retryCount: 0 });
        return { success: false, error: 'Offline' };
    }

    const user = await getCurrentUser();
    if (!user) {
        updateSyncState({ status: 'error', error: 'Not authenticated', retryCount: 0 });
        return { success: false, error: 'Not authenticated' };
    }

    updateSyncState({ status: 'syncing', error: null, retryCount: 0 });

    let lastError: string | undefined;
    
    for (let attempt = 0; attempt <= RETRY_CONFIG.MAX_RETRIES; attempt++) {
        try {
            // Update state to show retry progress
            if (attempt > 0) {
                updateSyncState({ status: 'retrying', retryCount: attempt });
                if (process.env.NODE_ENV === 'development') {
                    console.log(`Sync retry attempt ${attempt}/${RETRY_CONFIG.MAX_RETRIES}`);
                }
            }

            const result = await syncOnce(localState);
            
            if (result.success) {
                updateSyncState({ 
                    status: 'synced', 
                    lastSyncedAt: Date.now(), 
                    error: null,
                    retryCount: 0 
                });
                return { ...result, retriesUsed: attempt };
            }

            // Check if we should retry
            lastError = result.error;
            
            // Don't retry for certain errors
            if (result.error === 'Server unreachable' && !navigator.onLine) {
                updateSyncState({ status: 'offline', retryCount: 0 });
                return { success: false, error: 'Offline' };
            }

            // Wait before retry (if not the last attempt)
            if (attempt < RETRY_CONFIG.MAX_RETRIES) {
                const delay = getRetryDelay(attempt);
                await wait(delay);
                
                // Check if we went offline during the wait
                if (!navigator.onLine) {
                    updateSyncState({ status: 'offline', retryCount: 0 });
                    return { success: false, error: 'Offline' };
                }
            }
        } catch (err) {
            lastError = err instanceof Error ? err.message : 'Unknown error';
            
            // Wait before retry (if not the last attempt)
            if (attempt < RETRY_CONFIG.MAX_RETRIES) {
                const delay = getRetryDelay(attempt);
                await wait(delay);
            }
        }
    }

    // All retries exhausted
    const errorMessage = lastError || 'Max retries exceeded';
    updateSyncState({ 
        status: 'error', 
        error: errorMessage,
        retryCount: RETRY_CONFIG.MAX_RETRIES 
    });
    return { 
        success: false, 
        error: errorMessage,
        retriesUsed: RETRY_CONFIG.MAX_RETRIES 
    };
}

/**
 * Force push local state to server (overwrites server)
 * Includes retry logic with exponential backoff
 */
export async function forcePush(localState: GameState): Promise<SyncResult> {
    if (!isSupabaseConfigured()) {
        return { success: false, error: 'Supabase not configured' };
    }

    if (!navigator.onLine) {
        updateSyncState({ status: 'offline', retryCount: 0 });
        return { success: false, error: 'Offline' };
    }

    updateSyncState({ status: 'syncing', error: null, retryCount: 0 });

    let lastError: string | undefined;
    
    for (let attempt = 0; attempt <= RETRY_CONFIG.MAX_RETRIES; attempt++) {
        if (attempt > 0) {
            updateSyncState({ status: 'retrying', retryCount: attempt });
        }

        const result = await saveToSupabase(localState);
        if (result.success) {
            updateSyncState({ status: 'synced', lastSyncedAt: Date.now(), retryCount: 0 });
            return { success: true, direction: 'push', retriesUsed: attempt };
        }

        lastError = result.error;

        if (attempt < RETRY_CONFIG.MAX_RETRIES) {
            await wait(getRetryDelay(attempt));
            if (!navigator.onLine) {
                updateSyncState({ status: 'offline', retryCount: 0 });
                return { success: false, error: 'Offline' };
            }
        }
    }

    updateSyncState({ status: 'error', error: lastError, retryCount: RETRY_CONFIG.MAX_RETRIES });
    return { success: false, error: lastError, retriesUsed: RETRY_CONFIG.MAX_RETRIES };
}

/**
 * Force pull from server (overwrites local)
 * Includes retry logic with exponential backoff
 */
export async function forcePull(): Promise<SyncResult> {
    if (!isSupabaseConfigured()) {
        return { success: false, error: 'Supabase not configured' };
    }

    if (!navigator.onLine) {
        updateSyncState({ status: 'offline', retryCount: 0 });
        return { success: false, error: 'Offline' };
    }

    updateSyncState({ status: 'syncing', error: null, retryCount: 0 });

    let lastError: string | undefined;
    
    for (let attempt = 0; attempt <= RETRY_CONFIG.MAX_RETRIES; attempt++) {
        if (attempt > 0) {
            updateSyncState({ status: 'retrying', retryCount: attempt });
        }

        const result = await loadFromSupabase();
        if (result.success && result.data) {
            updateSyncState({ status: 'synced', lastSyncedAt: Date.now(), retryCount: 0 });
            return { success: true, direction: 'pull', data: result.data.gameState, retriesUsed: attempt };
        }

        lastError = result.error;

        if (attempt < RETRY_CONFIG.MAX_RETRIES) {
            await wait(getRetryDelay(attempt));
            if (!navigator.onLine) {
                updateSyncState({ status: 'offline', retryCount: 0 });
                return { success: false, error: 'Offline' };
            }
        }
    }

    updateSyncState({ status: 'error', error: lastError, retryCount: RETRY_CONFIG.MAX_RETRIES });
    return { success: false, error: lastError, retriesUsed: RETRY_CONFIG.MAX_RETRIES };
}

// ============================================
// EVENT HANDLERS
// ============================================

function handleOnline(): void {
    updateSyncState({ status: 'idle', error: null, retryCount: 0 });
    // Sync will be triggered by the game's autosave or manual trigger
}

function handleOffline(): void {
    updateSyncState({ status: 'offline', error: null, retryCount: 0 });
}

// ============================================
// CLEANUP
// ============================================

/**
 * Cleanup sync service (remove listeners)
 * Properly clears all state to prevent memory leaks
 */
export function cleanupSync(): void {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    
    // Clear all listeners to prevent memory leaks
    listeners.clear();
    
    // Reset state
    syncState = {
        status: 'idle',
        lastSyncedAt: null,
        error: null,
        retryCount: 0,
    };
}

// ============================================
// REACT HOOKS
// ============================================

/**
 * React hook to subscribe to sync status changes
 * Automatically cleans up subscription on unmount
 * 
 * @returns Current sync state with status, error, and retry info
 * 
 * @example
 * function SyncIndicator() {
 *     const syncState = useSyncStatus();
 *     
 *     if (syncState.status === 'syncing') return <Spinner />;
 *     if (syncState.status === 'error') return <Error message={syncState.error} />;
 *     if (syncState.status === 'synced') return <CheckMark />;
 *     return null;
 * }
 */
export function useSyncStatus(): SyncState {
    const [status, setStatus] = useState<SyncState>(getSyncState());

    useEffect(() => {
        // Subscribe to sync state changes
        const unsubscribe = onSyncStateChange(setStatus);
        
        // Cleanup subscription on unmount
        return () => {
            unsubscribe();
        };
    }, []);

    return status;
}

/**
 * Get a human-readable message for the current sync status
 */
export function getSyncStatusMessage(state: SyncState): string {
    switch (state.status) {
        case 'idle':
            return 'Ready to sync';
        case 'syncing':
            return 'Syncing...';
        case 'retrying':
            return `Retrying (${state.retryCount}/${RETRY_CONFIG.MAX_RETRIES})...`;
        case 'synced':
            return state.lastSyncedAt 
                ? `Synced ${formatTimeAgo(state.lastSyncedAt)}`
                : 'Synced';
        case 'offline':
            return 'Offline - changes saved locally';
        case 'error':
            return state.error || 'Sync failed';
        default:
            return '';
    }
}

/**
 * Format timestamp as relative time (e.g., "2 minutes ago")
 */
function formatTimeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

