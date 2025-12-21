/**
 * Authentication Service
 * 
 * Handles user authentication with Supabase:
 * - Anonymous sign-in (auto on first load)
 * - Email/password linking (optional upgrade)
 * - Session persistence for offline access
 */

import { User, Session, AuthError } from '@supabase/supabase-js';
import { getSupabase, isSupabaseConfigured } from './supabase';

// ============================================
// TYPES
// ============================================

export interface AuthState {
    user: User | null;
    session: Session | null;
    isAnonymous: boolean;
    isLoading: boolean;
    error: AuthError | null;
}

export interface AuthResult {
    success: boolean;
    user?: User;
    error?: AuthError | string;
}

// ============================================
// LOCAL STORAGE KEYS
// ============================================

const AUTH_USER_ID_KEY = 'pasture-user-id';

// ============================================
// AUTH FUNCTIONS
// ============================================

/**
 * Get current user from Supabase session
 */
export async function getCurrentUser(): Promise<User | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    } catch {
        return null;
    }
}

/**
 * Get current session
 */
export async function getSession(): Promise<Session | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
        const { data: { session } } = await supabase.auth.getSession();
        return session;
    } catch {
        return null;
    }
}

/**
 * Check if current user is anonymous
 */
export async function isAnonymousUser(): Promise<boolean> {
    const user = await getCurrentUser();
    if (!user) return false;
    return user.is_anonymous === true;
}

/**
 * Get stored user ID from localStorage (for offline access)
 */
export function getStoredUserId(): string | null {
    try {
        return localStorage.getItem(AUTH_USER_ID_KEY);
    } catch {
        return null;
    }
}

/**
 * Store user ID in localStorage
 */
function storeUserId(userId: string): void {
    try {
        localStorage.setItem(AUTH_USER_ID_KEY, userId);
    } catch {
        // localStorage might not be available
    }
}

/**
 * Clear stored user ID
 */
function clearStoredUserId(): void {
    try {
        localStorage.removeItem(AUTH_USER_ID_KEY);
    } catch {
        // localStorage might not be available
    }
}

/**
 * Sign in anonymously
 * Called automatically on first load if no session exists
 */
export async function signInAnonymously(): Promise<AuthResult> {
    const supabase = getSupabase();
    if (!supabase) {
        return { success: false, error: 'Supabase not configured' };
    }

    try {
        // Check if already signed in
        const existingUser = await getCurrentUser();
        if (existingUser) {
            storeUserId(existingUser.id);
            return { success: true, user: existingUser };
        }

        // Sign in anonymously
        const { data, error } = await supabase.auth.signInAnonymously();

        if (error) {
            return { success: false, error };
        }

        if (data.user) {
            storeUserId(data.user.id);
            return { success: true, user: data.user };
        }

        return { success: false, error: 'No user returned' };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
}

/**
 * Link anonymous account to email/password
 * Allows user to access their save from other devices
 */
export async function linkWithEmail(email: string, password: string): Promise<AuthResult> {
    const supabase = getSupabase();
    if (!supabase) {
        return { success: false, error: 'Supabase not configured' };
    }

    try {
        const { data, error } = await supabase.auth.updateUser({
            email,
            password,
        });

        if (error) {
            return { success: false, error };
        }

        if (data.user) {
            return { success: true, user: data.user };
        }

        return { success: false, error: 'No user returned' };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
}

/**
 * Sign in with email/password
 */
export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
    const supabase = getSupabase();
    if (!supabase) {
        return { success: false, error: 'Supabase not configured' };
    }

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return { success: false, error };
        }

        if (data.user) {
            storeUserId(data.user.id);
            return { success: true, user: data.user };
        }

        return { success: false, error: 'No user returned' };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
}

/**
 * Sign up with email/password (new account, not linking)
 */
export async function signUpWithEmail(email: string, password: string): Promise<AuthResult> {
    const supabase = getSupabase();
    if (!supabase) {
        return { success: false, error: 'Supabase not configured' };
    }

    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            return { success: false, error };
        }

        if (data.user) {
            storeUserId(data.user.id);
            return { success: true, user: data.user };
        }

        return { success: false, error: 'No user returned' };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<AuthResult> {
    const supabase = getSupabase();
    if (!supabase) {
        return { success: false, error: 'Supabase not configured' };
    }

    try {
        const { error } = await supabase.auth.signOut();

        if (error) {
            return { success: false, error };
        }

        clearStoredUserId();
        return { success: true };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
}

/**
 * Initialize auth on app load
 * - Restores session if available
 * - Signs in anonymously if no session
 */
export async function initializeAuth(): Promise<AuthResult> {
    if (!isSupabaseConfigured()) {
        return { success: false, error: 'Supabase not configured' };
    }

    // Try to get existing session
    const session = await getSession();
    if (session?.user) {
        storeUserId(session.user.id);
        return { success: true, user: session.user };
    }

    // No session, sign in anonymously
    return signInAnonymously();
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(
    callback: (user: User | null) => void
): (() => void) | null {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
            const user = session?.user ?? null;
            if (user) {
                storeUserId(user.id);
            }
            callback(user);
        }
    );

    return () => subscription.unsubscribe();
}

