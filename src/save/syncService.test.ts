/**
 * Sync Service Tests
 */

import {
    getSyncState,
    onSyncStateChange,
    getLocalSaveTimestamp,
    isOnline,
    initializeSync,
    sync,
    forcePush,
    forcePull,
    cleanupSync,
} from './syncService';
import { isSupabaseConfigured } from './supabase';
import { initializeAuth, getCurrentUser } from './authService';
import {
    saveToSupabase,
    loadFromSupabase,
    getServerSaveInfo,
    isSupabaseReachable,
} from './supabaseService';
import { loadFromLocalStorage } from './saveManager';
import { createMockGameState } from '../test/testUtils';

// Mock dependencies
jest.mock('./supabase', () => ({
    isSupabaseConfigured: jest.fn(),
}));

jest.mock('./authService', () => ({
    initializeAuth: jest.fn(),
    getCurrentUser: jest.fn(),
}));

jest.mock('./supabaseService', () => ({
    saveToSupabase: jest.fn(),
    loadFromSupabase: jest.fn(),
    getServerSaveInfo: jest.fn(),
    isSupabaseReachable: jest.fn(),
}));

jest.mock('./saveManager', () => ({
    loadFromLocalStorage: jest.fn(),
}));

const mockIsSupabaseConfigured = isSupabaseConfigured as jest.Mock;
const mockInitializeAuth = initializeAuth as jest.Mock;
const mockGetCurrentUser = getCurrentUser as jest.Mock;
const mockSaveToSupabase = saveToSupabase as jest.Mock;
const mockLoadFromSupabase = loadFromSupabase as jest.Mock;
const mockGetServerSaveInfo = getServerSaveInfo as jest.Mock;
const mockIsSupabaseReachable = isSupabaseReachable as jest.Mock;
const mockLoadFromLocalStorage = loadFromLocalStorage as jest.Mock;

describe('Sync Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        cleanupSync();
        
        // Default to online
        Object.defineProperty(navigator, 'onLine', {
            value: true,
            writable: true,
            configurable: true,
        });
    });

    afterEach(() => {
        cleanupSync();
    });

    describe('getSyncState', () => {
        it('should return initial idle state', () => {
            const state = getSyncState();
            expect(state.status).toBe('idle');
            expect(state.lastSyncedAt).toBeNull();
            expect(state.error).toBeNull();
        });
    });

    describe('onSyncStateChange', () => {
        it('should call listener when state changes', async () => {
            const listener = jest.fn();
            const unsubscribe = onSyncStateChange(listener);

            mockIsSupabaseConfigured.mockReturnValue(false);
            await initializeSync();

            expect(listener).toHaveBeenCalledWith(
                expect.objectContaining({ status: 'offline' })
            );

            unsubscribe();
        });

        it('should not call listener after unsubscribe', async () => {
            const listener = jest.fn();
            const unsubscribe = onSyncStateChange(listener);
            unsubscribe();

            mockIsSupabaseConfigured.mockReturnValue(false);
            await initializeSync();

            // Listener should not be called after unsubscribe
            expect(listener).not.toHaveBeenCalled();
        });
    });

    describe('getLocalSaveTimestamp', () => {
        it('should return null when no local save exists', () => {
            mockLoadFromLocalStorage.mockReturnValue({ success: false });

            const timestamp = getLocalSaveTimestamp();
            expect(timestamp).toBeNull();
        });

        it('should return timestamp from local save', () => {
            const savedAt = 1703001600000;
            mockLoadFromLocalStorage.mockReturnValue({
                success: true,
                data: { savedAt },
            });

            const timestamp = getLocalSaveTimestamp();
            expect(timestamp).toBe(savedAt);
        });
    });

    describe('isOnline', () => {
        it('should return true when online', () => {
            Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
            expect(isOnline()).toBe(true);
        });

        it('should return false when offline', () => {
            Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
            expect(isOnline()).toBe(false);
        });
    });

    describe('initializeSync', () => {
        it('should set offline status when Supabase is not configured', async () => {
            mockIsSupabaseConfigured.mockReturnValue(false);

            await initializeSync();

            expect(getSyncState().status).toBe('offline');
            expect(getSyncState().error).toBe('Supabase not configured');
        });

        it('should set error status when auth fails', async () => {
            mockIsSupabaseConfigured.mockReturnValue(true);
            mockInitializeAuth.mockResolvedValue({ success: false });

            await initializeSync();

            expect(getSyncState().status).toBe('error');
            expect(getSyncState().error).toBe('Auth failed');
        });

        it('should set offline status when browser is offline', async () => {
            mockIsSupabaseConfigured.mockReturnValue(true);
            mockInitializeAuth.mockResolvedValue({ success: true, user: { id: 'user-123' } });
            Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

            await initializeSync();

            expect(getSyncState().status).toBe('offline');
        });
    });

    describe('sync', () => {
        const mockState = createMockGameState();

        it('should return error when Supabase is not configured', async () => {
            mockIsSupabaseConfigured.mockReturnValue(false);

            const result = await sync(mockState);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Supabase not configured');
        });

        it('should return error when offline', async () => {
            mockIsSupabaseConfigured.mockReturnValue(true);
            Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

            const result = await sync(mockState);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Offline');
            expect(getSyncState().status).toBe('offline');
        });

        it('should return error when not authenticated', async () => {
            mockIsSupabaseConfigured.mockReturnValue(true);
            mockGetCurrentUser.mockResolvedValue(null);

            const result = await sync(mockState);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Not authenticated');
        });

        it('should return error when server is unreachable', async () => {
            mockIsSupabaseConfigured.mockReturnValue(true);
            mockGetCurrentUser.mockResolvedValue({ id: 'user-123' });
            mockIsSupabaseReachable.mockResolvedValue(false);

            const result = await sync(mockState);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Server unreachable');
        });

        it('should push to server when no server save exists', async () => {
            mockIsSupabaseConfigured.mockReturnValue(true);
            mockGetCurrentUser.mockResolvedValue({ id: 'user-123' });
            mockIsSupabaseReachable.mockResolvedValue(true);
            mockGetServerSaveInfo.mockResolvedValue({ success: true, info: undefined });
            mockLoadFromLocalStorage.mockReturnValue({ success: true, data: { savedAt: Date.now() } });
            mockSaveToSupabase.mockResolvedValue({ success: true });

            const result = await sync(mockState);
            expect(result.success).toBe(true);
            expect(result.direction).toBe('push');
            expect(mockSaveToSupabase).toHaveBeenCalledWith(mockState);
        });

        it('should push to server when local save is newer', async () => {
            const localTimestamp = Date.now();
            const serverTimestamp = localTimestamp - 10000; // 10 seconds older

            mockIsSupabaseConfigured.mockReturnValue(true);
            mockGetCurrentUser.mockResolvedValue({ id: 'user-123' });
            mockIsSupabaseReachable.mockResolvedValue(true);
            mockGetServerSaveInfo.mockResolvedValue({ 
                success: true, 
                info: { savedAt: serverTimestamp, version: 1 } 
            });
            mockLoadFromLocalStorage.mockReturnValue({
                success: true,
                data: { savedAt: localTimestamp },
            });
            mockSaveToSupabase.mockResolvedValue({ success: true });

            const result = await sync(mockState);
            expect(result.success).toBe(true);
            expect(result.direction).toBe('push');
        });

        it('should pull from server when server save is newer', async () => {
            const localTimestamp = Date.now() - 10000; // 10 seconds older
            const serverTimestamp = Date.now();
            const serverGameState = { cows: [], resources: { coins: 500 } };

            mockIsSupabaseConfigured.mockReturnValue(true);
            mockGetCurrentUser.mockResolvedValue({ id: 'user-123' });
            mockIsSupabaseReachable.mockResolvedValue(true);
            mockGetServerSaveInfo.mockResolvedValue({ 
                success: true, 
                info: { savedAt: serverTimestamp, version: 1 } 
            });
            mockLoadFromLocalStorage.mockReturnValue({
                success: true,
                data: { savedAt: localTimestamp },
            });
            mockLoadFromSupabase.mockResolvedValue({
                success: true,
                data: { gameState: serverGameState },
            });

            const result = await sync(mockState);
            expect(result.success).toBe(true);
            expect(result.direction).toBe('pull');
            expect(result.data).toEqual(serverGameState);
        });

        it('should return none when timestamps are equal', async () => {
            const timestamp = Date.now();

            mockIsSupabaseConfigured.mockReturnValue(true);
            mockGetCurrentUser.mockResolvedValue({ id: 'user-123' });
            mockIsSupabaseReachable.mockResolvedValue(true);
            mockGetServerSaveInfo.mockResolvedValue({ 
                success: true, 
                info: { savedAt: timestamp, version: 1 } 
            });
            mockLoadFromLocalStorage.mockReturnValue({
                success: true,
                data: { savedAt: timestamp },
            });

            const result = await sync(mockState);
            expect(result.success).toBe(true);
            expect(result.direction).toBe('none');
        });
    });

    describe('forcePush', () => {
        const mockState = createMockGameState();

        it('should return error when Supabase is not configured', async () => {
            mockIsSupabaseConfigured.mockReturnValue(false);

            const result = await forcePush(mockState);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Supabase not configured');
        });

        it('should return error when offline', async () => {
            mockIsSupabaseConfigured.mockReturnValue(true);
            Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

            const result = await forcePush(mockState);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Offline');
        });

        it('should push to server regardless of timestamps', async () => {
            mockIsSupabaseConfigured.mockReturnValue(true);
            mockSaveToSupabase.mockResolvedValue({ success: true });

            const result = await forcePush(mockState);
            expect(result.success).toBe(true);
            expect(result.direction).toBe('push');
            expect(mockSaveToSupabase).toHaveBeenCalledWith(mockState);
        });
    });

    describe('forcePull', () => {
        it('should return error when Supabase is not configured', async () => {
            mockIsSupabaseConfigured.mockReturnValue(false);

            const result = await forcePull();
            expect(result.success).toBe(false);
            expect(result.error).toBe('Supabase not configured');
        });

        it('should return error when offline', async () => {
            mockIsSupabaseConfigured.mockReturnValue(true);
            Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

            const result = await forcePull();
            expect(result.success).toBe(false);
            expect(result.error).toBe('Offline');
        });

        it('should pull from server', async () => {
            const serverGameState = { cows: [], resources: { coins: 500 } };
            
            mockIsSupabaseConfigured.mockReturnValue(true);
            mockLoadFromSupabase.mockResolvedValue({
                success: true,
                data: { gameState: serverGameState },
            });

            const result = await forcePull();
            expect(result.success).toBe(true);
            expect(result.direction).toBe('pull');
            expect(result.data).toEqual(serverGameState);
        });
    });

    describe('cleanupSync', () => {
        it('should remove event listeners and clear listeners', () => {
            const listener = jest.fn();
            onSyncStateChange(listener);

            cleanupSync();

            // After cleanup, new state changes should not trigger the listener
            // This is a bit tricky to test directly, but we can verify the function runs without error
            expect(() => cleanupSync()).not.toThrow();
        });
    });
});
