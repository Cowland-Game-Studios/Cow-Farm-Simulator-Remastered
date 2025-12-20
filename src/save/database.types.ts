/**
 * Supabase Database Types
 * 
 * Generated from database schema for type-safe queries.
 * Update this file when the schema changes.
 */

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export interface Database {
    public: {
        Tables: {
            game_saves: {
                Row: {
                    id: string;
                    user_id: string;
                    saved_at: number;
                    version: number;
                    game_state: Json;
                    config_overrides: Json;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    saved_at: number;
                    version: number;
                    game_state: Json;
                    config_overrides?: Json;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    saved_at?: number;
                    version?: number;
                    game_state?: Json;
                    config_overrides?: Json;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "game_saves_user_id_fkey";
                        columns: ["user_id"];
                        referencedRelation: "users";
                        referencedColumns: ["id"];
                    }
                ];
            };
        };
        Views: Record<string, never>;
        Functions: Record<string, never>;
        Enums: Record<string, never>;
        CompositeTypes: Record<string, never>;
    };
}

// Convenience type aliases
export type GameSaveRow = Database['public']['Tables']['game_saves']['Row'];
export type GameSaveInsert = Database['public']['Tables']['game_saves']['Insert'];
export type GameSaveUpdate = Database['public']['Tables']['game_saves']['Update'];

