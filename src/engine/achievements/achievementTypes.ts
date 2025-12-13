/**
 * Achievement System Type Definitions
 */

import { GameStats } from '../types';

/**
 * Achievement type - determines progression behavior
 */
export type AchievementType = 'progressive' | 'one-time';

/**
 * Achievement category - groups related achievements
 */
export interface AchievementCategory {
    id: string;
    name: string;
    statKey: keyof GameStats;
    baseName: string;
    actionText: string;  // e.g., "cows bred", "milk collected"
    thresholds: number[] | 'standard' | 'coins';
    baseXp: number;
    type: AchievementType;  // progressive = tiered, one-time = single unlock
    hidden?: boolean;       // Hidden until unlocked
    description?: string;   // Description for one-time achievements
}

/**
 * A specific achievement tier (for progressive) or single achievement (for one-time)
 */
export interface Achievement {
    id: string;           // e.g., "moo:1", "moo:2" or "first-cow"
    categoryId: string;   // e.g., "moo"
    name: string;         // e.g., "Moo I", "Moo II"
    tier: number;         // 1, 2, 3, ... (always 1 for one-time)
    threshold: number;    // Value needed to unlock
    xpReward: number;     // XP awarded when unlocked
    statKey: keyof GameStats;
    actionText: string;   // e.g., "cows bred", "milk collected"
    type: AchievementType;
    hidden: boolean;
    description?: string;
}

/**
 * Progress towards an achievement
 */
export interface AchievementProgress {
    achievement: Achievement;
    currentValue: number;   // Total stat value
    tierCurrent: number;    // Progress within current tier (currentValue - previousThreshold)
    tierMax: number;        // Range of current tier (threshold - previousThreshold)
    progress: number;       // 0-1 percentage
    isUnlocked: boolean;
    unlockedAt?: number;    // timestamp
}

/**
 * Result from checking achievements
 */
export interface AchievementCheckResult {
    newlyUnlocked: Achievement[];
    totalXpAwarded: number;
}
