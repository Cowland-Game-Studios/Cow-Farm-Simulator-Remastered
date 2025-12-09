/**
 * Supabase Service Layer
 * 
 * Handles all database operations for the game.
 * Currently operates in offline mode - ready for Supabase connection.
 */

import { actions } from '../engine/gameState';
import { GAME_CONFIG } from '../config/gameConfig';
import { GameState, GameAction } from '../engine/types';

// ============================================
// SUPABASE CLIENT (Uncomment when ready)
// ============================================

// import { createClient, SupabaseClient } from '@supabase/supabase-js';
// 
// const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
// const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
// 
// export const supabase: SupabaseClient | null = supabaseUrl && supabaseAnonKey 
//     ? createClient(supabaseUrl, supabaseAnonKey)
//     : null;

// Placeholder until Supabase is connected
export const supabase: null = null;

// ============================================
// LOCAL STORAGE TYPES
// ============================================

interface SaveData {
    cows: GameState['cows'];
    resources: GameState['resources'];
    inventory: GameState['inventory'];
    craftingQueue: GameState['craftingQueue'];
    playTime: number;
    savedAt?: number;
    version?: number;
}

interface SaveResult {
    success: boolean;
    saveId?: string;
    error?: unknown;
    source?: string;
}

// ============================================
// LOCAL STORAGE FALLBACK
// ============================================

const { LOCAL_STORAGE_KEY, SAVE_VERSION } = GAME_CONFIG.SAVE;

/**
 * Save to localStorage (fallback when no Supabase)
 */
function saveToLocalStorage(state: GameState): SaveResult {
    try {
        const saveData: SaveData = {
            cows: state.cows,
            resources: state.resources,
            inventory: state.inventory,
            craftingQueue: state.craftingQueue,
            playTime: state.playTime,
            savedAt: Date.now(),
            version: SAVE_VERSION,
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(saveData));
        return { success: true, saveId: 'local' };
    } catch (error) {
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
            console.error('Failed to save to localStorage:', error);
        }
        return { success: false, error };
    }
}

/**
 * Load from localStorage (fallback when no Supabase)
 */
function loadFromLocalStorage(): SaveData | null {
    try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!saved) return null;
        
        const data = JSON.parse(saved);
        return {
            cows: data.cows || [],
            resources: data.resources || { 
                coins: GAME_CONFIG.INITIAL_STATE.COINS, 
                stars: GAME_CONFIG.INITIAL_STATE.STARS 
            },
            inventory: data.inventory || {
                milk: 0,
                grass: GAME_CONFIG.INITIAL_STATE.GRASS,
                cream: 0,
                butter: 0,
                cheese: 0,
                yogurt: 0,
                iceCream: 0,
                cheesecake: 0,
            },
            craftingQueue: data.craftingQueue || [],
            playTime: data.playTime || 0,
        };
    } catch (error) {
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
            console.error('Failed to load from localStorage:', error);
        }
        return null;
    }
}

// ============================================
// SUPABASE OPERATIONS
// ============================================

/**
 * Save game to Supabase (or localStorage fallback)
 */
export async function saveGame(state: GameState, dispatch: React.Dispatch<GameAction>): Promise<SaveResult> {
    // If no Supabase connection, use localStorage
    if (!supabase) {
        const result = saveToLocalStorage(state);
        if (result.success && result.saveId) {
            dispatch(actions.markSaved(result.saveId, Date.now()));
        }
        return result;
    }

    // Supabase save logic (for when connected)
    try {
        const { data: { user } } = await (supabase as any).auth.getUser();
        if (!user) {
            // Not logged in - fall back to localStorage
            return saveToLocalStorage(state);
        }

        const saveData = {
            user_id: user.id,
            cows: state.cows,
            resources: state.resources,
            play_time: state.playTime,
        };

        let result;
        
        if (state.saveId && state.saveId !== 'local') {
            // Update existing save
            result = await (supabase as any)
                .from('game_saves')
                .update(saveData)
                .eq('id', state.saveId)
                .select()
                .single();
        } else {
            // Create new save
            result = await (supabase as any)
                .from('game_saves')
                .insert(saveData)
                .select()
                .single();
        }

        if (result.error) throw result.error;

        dispatch(actions.markSaved(result.data.id, Date.now()));
        return { success: true, saveId: result.data.id };

    } catch (error) {
        console.error('Failed to save to Supabase:', error);
        // Fall back to localStorage
        return saveToLocalStorage(state);
    }
}

/**
 * Load game from Supabase (or localStorage fallback)
 */
export async function loadGame(dispatch: React.Dispatch<GameAction>): Promise<SaveResult> {
    // If no Supabase connection, use localStorage
    if (!supabase) {
        const data = loadFromLocalStorage();
        if (data) {
            dispatch(actions.loadSave(data));
            return { success: true, source: 'local' };
        }
        return { success: false, error: 'No save found' };
    }

    // Supabase load logic (for when connected)
    try {
        const { data: { user } } = await (supabase as any).auth.getUser();
        if (!user) {
            // Not logged in - try localStorage
            const localData = loadFromLocalStorage();
            if (localData) {
                dispatch(actions.loadSave(localData));
                return { success: true, source: 'local' };
            }
            return { success: false, error: 'Not logged in and no local save' };
        }

        // Get latest save for user
        const { data, error } = await (supabase as any)
            .from('game_saves')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // No save found - start fresh
                return { success: false, error: 'No save found' };
            }
            throw error;
        }

        const saveData: Partial<GameState> = {
            saveId: data.id,
            userId: data.user_id,
            cows: data.cows,
            resources: data.resources,
            playTime: data.play_time,
            lastSavedAt: new Date(data.updated_at).getTime(),
        };

        dispatch(actions.loadSave(saveData));
        dispatch(actions.setUser(user.id));
        
        return { success: true, source: 'supabase' };

    } catch (error) {
        console.error('Failed to load from Supabase:', error);
        // Fall back to localStorage
        const localData = loadFromLocalStorage();
        if (localData) {
            dispatch(actions.loadSave(localData));
            return { success: true, source: 'local' };
        }
        return { success: false, error };
    }
}

/**
 * Auto-save (called periodically)
 */
export async function autoSave(state: GameState, dispatch: React.Dispatch<GameAction>): Promise<SaveResult | undefined> {
    // Only auto-save if there's been activity since last save
    const timeSinceLastSave = Date.now() - state.lastSavedAt;
    if (timeSinceLastSave < GAME_CONFIG.UI.MIN_SAVE_INTERVAL_MS) return;

    // Only log in development
    if (process.env.NODE_ENV === 'development') {
        console.log('Auto-saving...');
    }
    return saveGame(state, dispatch);
}

/**
 * Delete a save
 */
export async function deleteSave(saveId: string): Promise<SaveResult> {
    if (!supabase) {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        return { success: true };
    }

    try {
        const { error } = await (supabase as any)
            .from('game_saves')
            .delete()
            .eq('id', saveId);

        if (error) throw error;
        return { success: true };

    } catch (error) {
        console.error('Failed to delete save:', error);
        return { success: false, error };
    }
}

// ============================================
// AUTH HELPERS (for future use)
// ============================================

interface AuthResult {
    success: boolean;
    user?: unknown;
    error?: unknown;
}

/**
 * Sign up with email/password
 */
export async function signUp(email: string, password: string): Promise<AuthResult> {
    if (!supabase) return { success: false, error: 'Supabase not connected' };

    const { data, error } = await (supabase as any).auth.signUp({
        email,
        password,
    });

    if (error) return { success: false, error };
    return { success: true, user: data.user };
}

/**
 * Sign in with email/password
 */
export async function signIn(email: string, password: string): Promise<AuthResult> {
    if (!supabase) return { success: false, error: 'Supabase not connected' };

    const { data, error } = await (supabase as any).auth.signInWithPassword({
        email,
        password,
    });

    if (error) return { success: false, error };
    return { success: true, user: data.user };
}

/**
 * Sign out
 */
export async function signOut(): Promise<SaveResult> {
    if (!supabase) return { success: true };

    const { error } = await (supabase as any).auth.signOut();
    if (error) return { success: false, error };
    return { success: true };
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<unknown | null> {
    if (!supabase) return null;

    const { data: { user } } = await (supabase as any).auth.getUser();
    return user;
}

const supabaseService = {
    saveGame,
    loadGame,
    autoSave,
    deleteSave,
    signUp,
    signIn,
    signOut,
    getCurrentUser,
};

export default supabaseService;

