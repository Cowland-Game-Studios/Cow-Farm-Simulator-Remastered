/**
 * Supabase Client Configuration
 * 
 * Initializes the Supabase client for cloud save functionality.
 * Uses environment variables for configuration.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// Environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Validate configuration
const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isConfigured && process.env.NODE_ENV === 'development') {
    console.warn(
        'Supabase not configured. Cloud saves disabled.\n' +
        'To enable, create .env.local with:\n' +
        '  REACT_APP_SUPABASE_URL=your-project-url\n' +
        '  REACT_APP_SUPABASE_ANON_KEY=your-anon-key'
    );
}

// Typed Supabase client
export type TypedSupabaseClient = SupabaseClient<Database>;

// Create client (or null if not configured)
let supabase: TypedSupabaseClient | null = null;

if (isConfigured) {
    supabase = createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            // Store session in localStorage for offline access
            storage: typeof window !== 'undefined' ? window.localStorage : undefined,
            storageKey: 'pasture-auth',
        },
    });
}

/**
 * Get the Supabase client instance
 * Returns null if Supabase is not configured
 */
export function getSupabase(): TypedSupabaseClient | null {
    return supabase;
}

/**
 * Check if Supabase is configured and available
 */
export function isSupabaseConfigured(): boolean {
    return isConfigured;
}

export default supabase;

