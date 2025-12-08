/**
 * Supabase Service Layer
 * 
 * Handles all database operations for the game.
 * Currently operates in offline mode - ready for Supabase connection.
 * 
 * To connect to Supabase:
 * 1. npm install @supabase/supabase-js
 * 2. Create a Supabase project
 * 3. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in .env
 * 4. Create the 'game_saves' table with the schema below
 */

import { actions } from '../engine/gameState';
import { GAME_CONFIG } from '../config/gameConfig';

// ============================================
// SUPABASE CLIENT (Uncomment when ready)
// ============================================

// import { createClient } from '@supabase/supabase-js';
// 
// const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
// const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
// 
// export const supabase = supabaseUrl && supabaseAnonKey 
//     ? createClient(supabaseUrl, supabaseAnonKey)
//     : null;

// Placeholder until Supabase is connected
export const supabase = null;

// ============================================
// DATABASE SCHEMA (for Supabase setup)
// ============================================

/*
-- Create the game_saves table
CREATE TABLE game_saves (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Core game data (stored as JSONB for flexibility)
    cows JSONB NOT NULL DEFAULT '[]',
    resources JSONB NOT NULL DEFAULT '{"coins": 10000, "milk": 0, "stars": 0}',
    
    -- Metadata
    play_time FLOAT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Version for migrations
    save_version INTEGER DEFAULT 1
);

-- Enable RLS
ALTER TABLE game_saves ENABLE ROW LEVEL SECURITY;

-- Users can only access their own saves
CREATE POLICY "Users can view own saves" ON game_saves
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saves" ON game_saves
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saves" ON game_saves
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saves" ON game_saves
    FOR DELETE USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_game_saves_user_id ON game_saves(user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_game_saves_updated_at
    BEFORE UPDATE ON game_saves
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
*/

// ============================================
// LOCAL STORAGE FALLBACK
// ============================================

const { LOCAL_STORAGE_KEY, SAVE_VERSION } = GAME_CONFIG.SAVE;

/**
 * Save to localStorage (fallback when no Supabase)
 * @returns {{ success: boolean, saveId?: string, error?: Error }}
 */
function saveToLocalStorage(state) {
    try {
        const saveData = {
            cows: state.cows,
            resources: state.resources,
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
 * @returns {Object|null} Save data or null if not found
 */
function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!saved) return null;
        
        const data = JSON.parse(saved);
        return {
            cows: data.cows || [],
            resources: data.resources || { coins: 10000, milk: 0, stars: 0 },
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
export async function saveGame(state, dispatch) {
    // If no Supabase connection, use localStorage
    if (!supabase) {
        const result = saveToLocalStorage(state);
        if (result.success) {
            dispatch(actions.markSaved(result.saveId, Date.now()));
        }
        return result;
    }

    // Supabase save logic (for when connected)
    try {
        const { data: { user } } = await supabase.auth.getUser();
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
            result = await supabase
                .from('game_saves')
                .update(saveData)
                .eq('id', state.saveId)
                .select()
                .single();
        } else {
            // Create new save
            result = await supabase
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
export async function loadGame(dispatch) {
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
        const { data: { user } } = await supabase.auth.getUser();
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
        const { data, error } = await supabase
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

        const saveData = {
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
 * @returns {Promise<Object>|undefined} Save result or undefined if skipped
 */
export async function autoSave(state, dispatch) {
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
export async function deleteSave(saveId) {
    if (!supabase) {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        return { success: true };
    }

    try {
        const { error } = await supabase
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

/**
 * Sign up with email/password
 */
export async function signUp(email, password) {
    if (!supabase) return { success: false, error: 'Supabase not connected' };

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) return { success: false, error };
    return { success: true, user: data.user };
}

/**
 * Sign in with email/password
 */
export async function signIn(email, password) {
    if (!supabase) return { success: false, error: 'Supabase not connected' };

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) return { success: false, error };
    return { success: true, user: data.user };
}

/**
 * Sign out
 */
export async function signOut() {
    if (!supabase) return { success: true };

    const { error } = await supabase.auth.signOut();
    if (error) return { success: false, error };
    return { success: true };
}

/**
 * Get current user
 */
export async function getCurrentUser() {
    if (!supabase) return null;

    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

export default {
    saveGame,
    loadGame,
    autoSave,
    deleteSave,
    signUp,
    signIn,
    signOut,
    getCurrentUser,
};

