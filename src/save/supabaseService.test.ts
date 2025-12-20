/**
 * Supabase Save Service Tests
 */

import {
    saveToSupabase,
    loadFromSupabase,
    getServerSaveInfo,
    deleteFromSupabase,
    isSupabaseReachable,
} from './supabaseService';
import { getSupabase, isSupabaseConfigured } from './supabase';
import { getCurrentUser } from './authService';
import { createMockGameState } from '../test/testUtils';

// Mock dependencies
jest.mock('./supabase', () => ({
    getSupabase: jest.fn(),
    isSupabaseConfigured: jest.fn(),
}));

jest.mock('./authService', () => ({
    getCurrentUser: jest.fn(),
}));

// Mock saveManager with proper implementations
jest.mock('./saveManager', () => ({
    extractSaveableState: jest.fn((state) => ({
        cows: state.cows,
        resources: state.resources,
        inventory: state.inventory,
        craftingQueue: state.craftingQueue,
        activeBoardCraft: state.activeBoardCraft,
        stats: state.stats,
        achievements: state.achievements,
        playTime: state.playTime,
    })),
    getCurrentOverrides: jest.fn(() => ({ testOverride: 123 })),
}));

const mockGetSupabase = getSupabase as jest.Mock;
const mockIsSupabaseConfigured = isSupabaseConfigured as jest.Mock;
const mockGetCurrentUser = getCurrentUser as jest.Mock;

describe('Supabase Save Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('saveToSupabase', () => {
        it('should return error when Supabase is not configured', async () => {
            mockIsSupabaseConfigured.mockReturnValue(false);

            const result = await saveToSupabase(createMockGameState());
            expect(result.success).toBe(false);
            expect(result.error).toBe('Supabase not configured');
        });

        it('should return error when client is not available', async () => {
            mockIsSupabaseConfigured.mockReturnValue(true);
            mockGetSupabase.mockReturnValue(null);

            const result = await saveToSupabase(createMockGameState());
            expect(result.success).toBe(false);
            expect(result.error).toBe('Supabase client not available');
        });

        it('should return error when not authenticated', async () => {
            mockIsSupabaseConfigured.mockReturnValue(true);
            mockGetSupabase.mockReturnValue({});
            mockGetCurrentUser.mockResolvedValue(null);

            const result = await saveToSupabase(createMockGameState());
            expect(result.success).toBe(false);
            expect(result.error).toBe('Not authenticated');
        });

        it('should successfully save game state', async () => {
            const mockUser = { id: 'user-123' };
            const mockUpsert = jest.fn().mockResolvedValue({ error: null });

            mockIsSupabaseConfigured.mockReturnValue(true);
            mockGetSupabase.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    upsert: mockUpsert,
                }),
            });
            mockGetCurrentUser.mockResolvedValue(mockUser);

            const result = await saveToSupabase(createMockGameState());
            expect(result.success).toBe(true);
            expect(mockUpsert).toHaveBeenCalled();
            
            // Check the call was made with correct structure
            const upsertCall = mockUpsert.mock.calls[0];
            expect(upsertCall[0]).toMatchObject({
                user_id: 'user-123',
            });
            expect(upsertCall[1]).toEqual({ onConflict: 'user_id' });
        });

        it('should return error on save failure', async () => {
            const mockUser = { id: 'user-123' };
            const mockError = { message: 'Database error' };

            mockIsSupabaseConfigured.mockReturnValue(true);
            mockGetSupabase.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    upsert: jest.fn().mockResolvedValue({ error: mockError }),
                }),
            });
            mockGetCurrentUser.mockResolvedValue(mockUser);

            // Suppress console.error for this test
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            
            const result = await saveToSupabase(createMockGameState());
            expect(result.success).toBe(false);
            expect(result.error).toBe('Database error');
            
            consoleSpy.mockRestore();
        });
    });

    describe('loadFromSupabase', () => {
        it('should return error when Supabase is not configured', async () => {
            mockIsSupabaseConfigured.mockReturnValue(false);

            const result = await loadFromSupabase();
            expect(result.success).toBe(false);
            expect(result.error).toBe('Supabase not configured');
        });

        it('should return error when not authenticated', async () => {
            mockIsSupabaseConfigured.mockReturnValue(true);
            mockGetSupabase.mockReturnValue({});
            mockGetCurrentUser.mockResolvedValue(null);

            const result = await loadFromSupabase();
            expect(result.success).toBe(false);
            expect(result.error).toBe('Not authenticated');
        });

        it('should return "No save found" when no save exists', async () => {
            const mockUser = { id: 'user-123' };
            
            mockIsSupabaseConfigured.mockReturnValue(true);
            mockGetSupabase.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({ 
                                data: null, 
                                error: { code: 'PGRST116' } 
                            }),
                        }),
                    }),
                }),
            });
            mockGetCurrentUser.mockResolvedValue(mockUser);

            const result = await loadFromSupabase();
            expect(result.success).toBe(false);
            expect(result.error).toBe('No save found');
        });

        it('should successfully load game state', async () => {
            const mockUser = { id: 'user-123' };
            const mockSaveData = {
                saved_at: Date.now(),
                version: 1,
                game_state: { cows: [], resources: { coins: 100 } },
                config_overrides: {},
            };

            mockIsSupabaseConfigured.mockReturnValue(true);
            mockGetSupabase.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({ 
                                data: mockSaveData, 
                                error: null 
                            }),
                        }),
                    }),
                }),
            });
            mockGetCurrentUser.mockResolvedValue(mockUser);

            const result = await loadFromSupabase();
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data?.gameState).toEqual(mockSaveData.game_state);
        });
    });

    describe('getServerSaveInfo', () => {
        it('should return error when Supabase is not configured', async () => {
            mockIsSupabaseConfigured.mockReturnValue(false);

            const result = await getServerSaveInfo();
            expect(result.success).toBe(false);
            expect(result.error).toBe('Supabase not configured');
        });

        it('should return undefined info when no save exists', async () => {
            const mockUser = { id: 'user-123' };
            
            mockIsSupabaseConfigured.mockReturnValue(true);
            mockGetSupabase.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({ 
                                data: null, 
                                error: { code: 'PGRST116' } 
                            }),
                        }),
                    }),
                }),
            });
            mockGetCurrentUser.mockResolvedValue(mockUser);

            const result = await getServerSaveInfo();
            expect(result.success).toBe(true);
            expect(result.info).toBeUndefined();
        });

        it('should return save info', async () => {
            const mockUser = { id: 'user-123' };
            const mockSaveInfo = {
                saved_at: 1703001600000,
                version: 1,
            };

            mockIsSupabaseConfigured.mockReturnValue(true);
            mockGetSupabase.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({ 
                                data: mockSaveInfo, 
                                error: null 
                            }),
                        }),
                    }),
                }),
            });
            mockGetCurrentUser.mockResolvedValue(mockUser);

            const result = await getServerSaveInfo();
            expect(result.success).toBe(true);
            expect(result.info).toEqual({
                savedAt: 1703001600000,
                version: 1,
            });
        });
    });

    describe('deleteFromSupabase', () => {
        it('should return error when Supabase is not configured', async () => {
            mockIsSupabaseConfigured.mockReturnValue(false);

            const result = await deleteFromSupabase();
            expect(result.success).toBe(false);
            expect(result.error).toBe('Supabase not configured');
        });

        it('should successfully delete save', async () => {
            const mockUser = { id: 'user-123' };

            mockIsSupabaseConfigured.mockReturnValue(true);
            mockGetSupabase.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    delete: jest.fn().mockReturnValue({
                        eq: jest.fn().mockResolvedValue({ error: null }),
                    }),
                }),
            });
            mockGetCurrentUser.mockResolvedValue(mockUser);

            const result = await deleteFromSupabase();
            expect(result.success).toBe(true);
        });
    });

    describe('isSupabaseReachable', () => {
        it('should return false when not configured', async () => {
            mockIsSupabaseConfigured.mockReturnValue(false);

            const result = await isSupabaseReachable();
            expect(result).toBe(false);
        });

        it('should return false when offline', async () => {
            mockIsSupabaseConfigured.mockReturnValue(true);
            
            // Mock navigator.onLine
            Object.defineProperty(navigator, 'onLine', {
                value: false,
                writable: true,
                configurable: true,
            });

            const result = await isSupabaseReachable();
            expect(result).toBe(false);

            // Reset
            Object.defineProperty(navigator, 'onLine', {
                value: true,
                writable: true,
                configurable: true,
            });
        });

        it('should return true when reachable', async () => {
            mockIsSupabaseConfigured.mockReturnValue(true);
            mockGetSupabase.mockReturnValue({
                auth: {
                    getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
                },
            });

            Object.defineProperty(navigator, 'onLine', {
                value: true,
                writable: true,
                configurable: true,
            });

            const result = await isSupabaseReachable();
            expect(result).toBe(true);
        });
    });
});
