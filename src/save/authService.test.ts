/**
 * Auth Service Tests
 */

import {
    getStoredUserId,
    getCurrentUser,
    getSession,
    isAnonymousUser,
    signInAnonymously,
    signInWithEmail,
    signOut,
    initializeAuth,
} from './authService';
import { getSupabase, isSupabaseConfigured } from './supabase';

// Mock the supabase module
jest.mock('./supabase', () => ({
    getSupabase: jest.fn(),
    isSupabaseConfigured: jest.fn(),
}));

const mockGetSupabase = getSupabase as jest.Mock;
const mockIsSupabaseConfigured = isSupabaseConfigured as jest.Mock;

describe('Auth Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
    });

    describe('getStoredUserId', () => {
        it('should return null when no user ID is stored', () => {
            // The mock localStorage returns null for missing keys
            const result = getStoredUserId();
            expect(result).toBeFalsy();
        });

        it('should return stored user ID', () => {
            // The mock localStorage.getItem is a jest.fn(), so we need to mock its return value
            (localStorage.getItem as jest.Mock).mockReturnValueOnce('test-user-123');
            expect(getStoredUserId()).toBe('test-user-123');
        });
    });

    describe('getCurrentUser', () => {
        it('should return null when Supabase is not configured', async () => {
            mockGetSupabase.mockReturnValue(null);
            
            const user = await getCurrentUser();
            expect(user).toBeNull();
        });

        it('should return user from Supabase session', async () => {
            const mockUser = { id: 'user-123', email: 'test@example.com' };
            mockGetSupabase.mockReturnValue({
                auth: {
                    getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }),
                },
            });

            const user = await getCurrentUser();
            expect(user).toEqual(mockUser);
        });

        it('should return null on error', async () => {
            mockGetSupabase.mockReturnValue({
                auth: {
                    getUser: jest.fn().mockRejectedValue(new Error('Network error')),
                },
            });

            const user = await getCurrentUser();
            expect(user).toBeNull();
        });
    });

    describe('getSession', () => {
        it('should return null when Supabase is not configured', async () => {
            mockGetSupabase.mockReturnValue(null);
            
            const session = await getSession();
            expect(session).toBeNull();
        });

        it('should return session from Supabase', async () => {
            const mockSession = { 
                access_token: 'token-123',
                user: { id: 'user-123' },
            };
            mockGetSupabase.mockReturnValue({
                auth: {
                    getSession: jest.fn().mockResolvedValue({ data: { session: mockSession } }),
                },
            });

            const session = await getSession();
            expect(session).toEqual(mockSession);
        });
    });

    describe('isAnonymousUser', () => {
        it('should return false when no user', async () => {
            mockGetSupabase.mockReturnValue({
                auth: {
                    getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
                },
            });

            const isAnon = await isAnonymousUser();
            expect(isAnon).toBe(false);
        });

        it('should return true for anonymous user', async () => {
            mockGetSupabase.mockReturnValue({
                auth: {
                    getUser: jest.fn().mockResolvedValue({ 
                        data: { user: { id: 'anon-123', is_anonymous: true } } 
                    }),
                },
            });

            const isAnon = await isAnonymousUser();
            expect(isAnon).toBe(true);
        });

        it('should return false for non-anonymous user', async () => {
            mockGetSupabase.mockReturnValue({
                auth: {
                    getUser: jest.fn().mockResolvedValue({ 
                        data: { user: { id: 'user-123', is_anonymous: false } } 
                    }),
                },
            });

            const isAnon = await isAnonymousUser();
            expect(isAnon).toBe(false);
        });
    });

    describe('signInAnonymously', () => {
        it('should return error when Supabase is not configured', async () => {
            mockGetSupabase.mockReturnValue(null);

            const result = await signInAnonymously();
            expect(result.success).toBe(false);
            expect(result.error).toBe('Supabase not configured');
        });

        it('should return existing user if already signed in', async () => {
            const mockUser = { id: 'existing-user-123' };
            mockGetSupabase.mockReturnValue({
                auth: {
                    getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }),
                },
            });

            const result = await signInAnonymously();
            expect(result.success).toBe(true);
            expect(result.user).toEqual(mockUser);
            // User ID should be stored
            expect(localStorage.setItem).toHaveBeenCalledWith('pasture-user-id', 'existing-user-123');
        });

        it('should sign in anonymously when no existing user', async () => {
            const mockNewUser = { id: 'new-anon-user-123' };
            mockGetSupabase.mockReturnValue({
                auth: {
                    getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
                    signInAnonymously: jest.fn().mockResolvedValue({ 
                        data: { user: mockNewUser },
                        error: null,
                    }),
                },
            });

            const result = await signInAnonymously();
            expect(result.success).toBe(true);
            expect(result.user).toEqual(mockNewUser);
            expect(localStorage.setItem).toHaveBeenCalledWith('pasture-user-id', 'new-anon-user-123');
        });

        it('should return error on sign in failure', async () => {
            const mockError = { message: 'Auth failed' };
            mockGetSupabase.mockReturnValue({
                auth: {
                    getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
                    signInAnonymously: jest.fn().mockResolvedValue({ 
                        data: { user: null },
                        error: mockError,
                    }),
                },
            });

            const result = await signInAnonymously();
            expect(result.success).toBe(false);
            expect(result.error).toEqual(mockError);
        });
    });

    describe('signInWithEmail', () => {
        it('should return error when Supabase is not configured', async () => {
            mockGetSupabase.mockReturnValue(null);

            const result = await signInWithEmail('test@example.com', 'password123');
            expect(result.success).toBe(false);
            expect(result.error).toBe('Supabase not configured');
        });

        it('should sign in with email and password', async () => {
            const mockUser = { id: 'user-123', email: 'test@example.com' };
            mockGetSupabase.mockReturnValue({
                auth: {
                    signInWithPassword: jest.fn().mockResolvedValue({ 
                        data: { user: mockUser },
                        error: null,
                    }),
                },
            });

            const result = await signInWithEmail('test@example.com', 'password123');
            expect(result.success).toBe(true);
            expect(result.user).toEqual(mockUser);
            expect(localStorage.setItem).toHaveBeenCalledWith('pasture-user-id', 'user-123');
        });
    });

    describe('signOut', () => {
        it('should return error when Supabase is not configured', async () => {
            mockGetSupabase.mockReturnValue(null);

            const result = await signOut();
            expect(result.success).toBe(false);
            expect(result.error).toBe('Supabase not configured');
        });

        it('should sign out and clear stored user ID', async () => {
            localStorage.setItem('pasture-user-id', 'user-123');
            mockGetSupabase.mockReturnValue({
                auth: {
                    signOut: jest.fn().mockResolvedValue({ error: null }),
                },
            });

            const result = await signOut();
            expect(result.success).toBe(true);
            expect(localStorage.removeItem).toHaveBeenCalledWith('pasture-user-id');
        });
    });

    describe('initializeAuth', () => {
        it('should return error when Supabase is not configured', async () => {
            mockIsSupabaseConfigured.mockReturnValue(false);

            const result = await initializeAuth();
            expect(result.success).toBe(false);
            expect(result.error).toBe('Supabase not configured');
        });

        it('should return existing session user', async () => {
            const mockUser = { id: 'session-user-123' };
            const mockSession = { user: mockUser };
            
            mockIsSupabaseConfigured.mockReturnValue(true);
            mockGetSupabase.mockReturnValue({
                auth: {
                    getSession: jest.fn().mockResolvedValue({ data: { session: mockSession } }),
                },
            });

            const result = await initializeAuth();
            expect(result.success).toBe(true);
            expect(result.user).toEqual(mockUser);
            expect(localStorage.setItem).toHaveBeenCalledWith('pasture-user-id', 'session-user-123');
        });

        it('should sign in anonymously when no session', async () => {
            const mockNewUser = { id: 'new-anon-123' };
            
            mockIsSupabaseConfigured.mockReturnValue(true);
            mockGetSupabase.mockReturnValue({
                auth: {
                    getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
                    getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
                    signInAnonymously: jest.fn().mockResolvedValue({ 
                        data: { user: mockNewUser },
                        error: null,
                    }),
                },
            });

            const result = await initializeAuth();
            expect(result.success).toBe(true);
            expect(result.user).toEqual(mockNewUser);
        });
    });
});
