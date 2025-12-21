/**
 * Supabase Client Tests
 */

import { getSupabase, isSupabaseConfigured } from './supabase';

describe('Supabase Client', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    describe('isSupabaseConfigured', () => {
        it('should return false when environment variables are not set', () => {
            // The module was already loaded without env vars
            expect(isSupabaseConfigured()).toBe(false);
        });
    });

    describe('getSupabase', () => {
        it('should return null when not configured', () => {
            expect(getSupabase()).toBeNull();
        });
    });
});

