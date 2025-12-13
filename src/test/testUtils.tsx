/**
 * Test Utilities and Mocks
 * 
 * Provides mock contexts and utilities for testing components
 */

import React, { ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { GameState, Position, Cow, GameStats, AchievementState } from '../engine/types';

// ============================================
// MOCK GAME STATE
// ============================================

export const createMockCow = (overrides: Partial<Cow> = {}): Cow => ({
    id: 'cow-1',
    color: { r: 255, g: 100, b: 100, a: 0.5 },
    state: 'full',
    fullness: 1,
    position: { x: 300, y: 300 },
    facingRight: false,
    lastFedAt: null,
    lastBredAt: 0,
    createdAt: Date.now(),
    ...overrides,
});

export const createMockGameStats = (overrides: Partial<GameStats> = {}): GameStats => ({
    cowsBred: 0,
    cowsFed: 0,
    cowsMilked: 0,
    milkCollected: 0,
    itemsCrafted: 0,
    creamCrafted: 0,
    butterCrafted: 0,
    cheeseCrafted: 0,
    yogurtCrafted: 0,
    iceCreamCrafted: 0,
    cheesecakeCrafted: 0,
    coinsSpent: 0,
    coinsEarned: 0,
    grassPurchased: 0,
    itemsSold: 0,
    creamSold: 0,
    butterSold: 0,
    cheeseSold: 0,
    yogurtSold: 0,
    iceCreamSold: 0,
    cheesecakeSold: 0,
    totalXpEarned: 0,
    chaosTriggered: 0,
    ...overrides,
});

export const createMockAchievementState = (overrides: Partial<AchievementState> = {}): AchievementState => ({
    unlocked: {},
    ...overrides,
});

export const createMockGameState = (overrides: Partial<GameState> = {}): GameState => ({
    userId: null,
    saveId: null,
    lastSavedAt: 0,
    playTime: 0,
    cows: [createMockCow()],
    resources: { coins: 10000 },
    inventory: {
        milk: 5,
        grass: 10,
        cream: 0,
        butter: 0,
        cheese: 0,
        yogurt: 0,
        iceCream: 0,
        cheesecake: 0,
    },
    craftingQueue: [],
    tools: {
        milking: false,
        feeding: false,
        toolPosition: null,
    },
    draggingCow: {
        cowId: null,
        position: null,
    },
    ui: {
        crafting: false,
        paused: false,
        saving: false,
        draggingCraftingItem: false,
    },
    chaosImpulses: {},
    activeBoardCraft: null,
    stats: createMockGameStats(),
    achievements: createMockAchievementState(),
    ...overrides,
});

// ============================================
// MOCK FUNCTIONS
// ============================================

export const createMockGameContext = () => ({
    state: createMockGameState(),
    dispatch: jest.fn(),
    cows: [createMockCow()],
    resources: { coins: 10000 },
    inventory: {
        milk: 5,
        grass: 10,
        cream: 0,
        butter: 0,
        cheese: 0,
        yogurt: 0,
        iceCream: 0,
        cheesecake: 0,
    },
    craftingQueue: [],
    stats: createMockGameStats(),
    achievements: createMockAchievementState(),
    xp: 0,
    tools: {
        milking: false,
        feeding: false,
        toolPosition: null,
    },
    ui: {
        crafting: false,
        paused: false,
        saving: false,
        draggingCraftingItem: false,
    },
    draggingCow: {
        cowId: null,
        position: null,
    },
    chaosImpulses: {},
    activeBoardCraft: null,
    startMilking: jest.fn(),
    stopMilking: jest.fn(),
    startFeeding: jest.fn(),
    stopFeeding: jest.fn(),
    updateToolPosition: jest.fn(),
    openCrafting: jest.fn(),
    closeCrafting: jest.fn(),
    milkCow: jest.fn(),
    feedCow: jest.fn(),
    breedCows: jest.fn(),
    updateCowPosition: jest.fn(),
    setDraggingCow: jest.fn(),
    clearDraggingCow: jest.fn(),
    addItem: jest.fn(),
    removeItem: jest.fn(),
    setItem: jest.fn(),
    craftInstant: jest.fn(),
    startCrafting: jest.fn(),
    completeCrafting: jest.fn(),
    cancelCrafting: jest.fn(),
    setBoardCraft: jest.fn(),
    clearBoardCraft: jest.fn(),
    addCoins: jest.fn(),
    spendCoins: jest.fn(),
    triggerChaos: jest.fn(),
    clearCowImpulse: jest.fn(),
    setCraftingDrag: jest.fn(),
    checkAchievements: jest.fn(),
    saveGame: jest.fn().mockReturnValue({ success: true }),
    resetGame: jest.fn(),
    isSaving: false,
    isLoading: false,
    lastSavedAt: 0,
    saveLoadError: null,
    pause: jest.fn(),
    resume: jest.fn(),
    isPaused: false,
    colorToString: (color: { r: number; g: number; b: number; a: number }) => 
        `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`,
    mousePosition: { x: 0, y: 0 },
});

// ============================================
// MOCK PROVIDERS
// ============================================

// Mock ResizeObserver (not in setupTests.ts)
class MockResizeObserver {
    observe = jest.fn();
    unobserve = jest.fn();
    disconnect = jest.fn();
}

// Setup additional mocks not covered by setupTests.ts
beforeAll(() => {
    global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
});

// ============================================
// CUSTOM RENDER
// ============================================

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
    mousePosition?: Position;
}

const AllProviders: React.FC<{ children: ReactNode }> = ({ children }) => {
    return <>{children}</>;
};

export const customRender = (
    ui: React.ReactElement,
    options?: CustomRenderOptions
) => render(ui, { wrapper: AllProviders, ...options });

// Re-export testing library utilities
export * from '@testing-library/react';
export { customRender as render };

// ============================================
// HELPER UTILITIES
// ============================================

export const waitForAnimationFrame = () => 
    new Promise(resolve => requestAnimationFrame(resolve));

export const flushPromises = () => 
    new Promise(resolve => setTimeout(resolve, 0));

export const advanceTimers = (ms: number) => {
    jest.advanceTimersByTime(ms);
};

