/**
 * Supabase Save Service
 * 
 * Handles CRUD operations for game saves in Supabase.
 */

import { getSupabase, isSupabaseConfigured } from './supabase';
import { getCurrentUser } from './authService';
import { SaveData, SavedGameState, ConfigOverrides, SAVE_CONFIG } from './saveTypes';
import { extractSaveableState, getCurrentOverrides } from './saveManager';
import { GameState } from '../engine/types';
import { Json } from './database.types';

// ============================================
// TYPES
// ============================================

export interface SupabaseSaveResult {
    success: boolean;
    error?: string;
}

export interface SupabaseLoadResult {
    success: boolean;
    data?: SaveData;
    error?: string;
}

export interface ServerSaveInfo {
    savedAt: number;
    version: number;
}

export interface ServerSaveInfoResult {
    success: boolean;
    info?: ServerSaveInfo;
    error?: string;
}

// ============================================
// DATABASE OPERATIONS
// ============================================

/**
 * Save game state to Supabase
 * Uses upsert to handle both new and existing saves
 */
export async function saveToSupabase(state: GameState): Promise<SupabaseSaveResult> {
    if (!isSupabaseConfigured()) {
        return { success: false, error: 'Supabase not configured' };
    }

    const supabase = getSupabase();
    if (!supabase) {
        return { success: false, error: 'Supabase client not available' };
    }

    const user = await getCurrentUser();
    if (!user) {
        return { success: false, error: 'Not authenticated' };
    }

    try {
        const savedAt = Date.now();
        const gameState = extractSaveableState(state);
        const configOverrides = getCurrentOverrides();

        const { error } = await supabase
            .from('game_saves')
            .upsert({
                user_id: user.id,
                saved_at: savedAt,
                version: SAVE_CONFIG.CURRENT_VERSION,
                game_state: gameState as unknown as Json,
                config_overrides: configOverrides as unknown as Json,
            }, {
                onConflict: 'user_id',
            });

        if (error) {
            console.error('Supabase save error:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('Supabase save exception:', err);
        return { success: false, error: message };
    }
}

/**
 * Load game state from Supabase
 */
export async function loadFromSupabase(): Promise<SupabaseLoadResult> {
    if (!isSupabaseConfigured()) {
        return { success: false, error: 'Supabase not configured' };
    }

    const supabase = getSupabase();
    if (!supabase) {
        return { success: false, error: 'Supabase client not available' };
    }

    const user = await getCurrentUser();
    if (!user) {
        return { success: false, error: 'Not authenticated' };
    }

    try {
        const { data, error } = await supabase
            .from('game_saves')
            .select('saved_at, version, game_state, config_overrides')
            .eq('user_id', user.id)
            .single();

        if (error) {
            // No save found is not an error condition
            if (error.code === 'PGRST116') {
                return { success: false, error: 'No save found' };
            }
            console.error('Supabase load error:', error);
            return { success: false, error: error.message };
        }

        if (!data) {
            return { success: false, error: 'No save found' };
        }

        const saveData: SaveData = {
            version: data.version,
            savedAt: data.saved_at,
            gameState: data.game_state as unknown as SavedGameState,
            configOverrides: (data.config_overrides as unknown as ConfigOverrides) || {},
        };

        return { success: true, data: saveData };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('Supabase load exception:', err);
        return { success: false, error: message };
    }
}

/**
 * Get server save info (timestamp only) for sync comparison
 * This is a lightweight query that doesn't fetch the full game state
 */
export async function getServerSaveInfo(): Promise<ServerSaveInfoResult> {
    if (!isSupabaseConfigured()) {
        return { success: false, error: 'Supabase not configured' };
    }

    const supabase = getSupabase();
    if (!supabase) {
        return { success: false, error: 'Supabase client not available' };
    }

    const user = await getCurrentUser();
    if (!user) {
        return { success: false, error: 'Not authenticated' };
    }

    try {
        const { data, error } = await supabase
            .from('game_saves')
            .select('saved_at, version')
            .eq('user_id', user.id)
            .single();

        if (error) {
            // No save found - return success with no info
            if (error.code === 'PGRST116') {
                return { success: true, info: undefined };
            }
            return { success: false, error: error.message };
        }

        if (!data) {
            return { success: true, info: undefined };
        }

        return {
            success: true,
            info: {
                savedAt: data.saved_at,
                version: data.version,
            },
        };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return { success: false, error: message };
    }
}

/**
 * Delete save from Supabase
 */
export async function deleteFromSupabase(): Promise<SupabaseSaveResult> {
    if (!isSupabaseConfigured()) {
        return { success: false, error: 'Supabase not configured' };
    }

    const supabase = getSupabase();
    if (!supabase) {
        return { success: false, error: 'Supabase client not available' };
    }

    const user = await getCurrentUser();
    if (!user) {
        return { success: false, error: 'Not authenticated' };
    }

    try {
        const { error } = await supabase
            .from('game_saves')
            .delete()
            .eq('user_id', user.id);

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return { success: false, error: message };
    }
}

/**
 * Check if Supabase is online and reachable
 */
export async function isSupabaseReachable(): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    if (!navigator.onLine) return false;

    const supabase = getSupabase();
    if (!supabase) return false;

    try {
        // Simple health check - just try to get auth session
        await supabase.auth.getSession();
        return true;
    } catch {
        return false;
    }
}

