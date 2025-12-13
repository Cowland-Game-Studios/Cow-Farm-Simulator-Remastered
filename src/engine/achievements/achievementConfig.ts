/**
 * Achievement Configuration
 * Defines all achievement categories and their progression
 */

import { AchievementCategory } from './achievementTypes';

// Standard Fibonacci-like thresholds for most achievements
export const STANDARD_THRESHOLDS = [
    1, 2, 5, 10, 25, 50, 100, 250, 500, 1000, 
    2500, 5000, 10000, 25000, 50000, 100000,
    250000, 500000, 1000000
];

// Special thresholds for coin-based achievements (larger values)
export const COIN_THRESHOLDS = [
    1000, 10000, 100000, 1000000, 10000000, 
    100000000, 1000000000
];

// XP thresholds for meta-achievement
export const XP_THRESHOLDS = [
    100, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000
];

/**
 * Get threshold for a given tier
 */
export function getThreshold(tier: number, thresholdType: 'standard' | 'coins' | number[]): number {
    const thresholds = thresholdType === 'standard' 
        ? STANDARD_THRESHOLDS 
        : thresholdType === 'coins' 
            ? COIN_THRESHOLDS 
            : thresholdType;
    
    if (tier <= thresholds.length) {
        return thresholds[tier - 1];
    }
    
    // For infinite progression beyond defined thresholds, extrapolate
    const lastThreshold = thresholds[thresholds.length - 1];
    const multiplier = thresholdType === 'coins' ? 10 : 2.5;
    return Math.floor(lastThreshold * Math.pow(multiplier, tier - thresholds.length));
}

/**
 * Get XP reward for a tier
 * Scales exponentially: baseXP * 1.5^(tier-1)
 */
export function getXpForTier(tier: number, baseXp: number = 10): number {
    return Math.floor(baseXp * Math.pow(1.5, tier - 1));
}

/**
 * Get XP required for a level
 * Scales exponentially: 100 * 1.15^(level-1)
 */
export function getXpForLevel(level: number): number {
    return Math.floor(100 * Math.pow(1.15, level - 1));
}

/**
 * Calculate level from total XP
 */
export function getLevelFromXp(totalXp: number): { level: number; xpIntoLevel: number; xpForNextLevel: number } {
    let level = 1;
    let xpRemaining = totalXp;
    
    while (xpRemaining >= getXpForLevel(level)) {
        xpRemaining -= getXpForLevel(level);
        level++;
    }
    
    return {
        level,
        xpIntoLevel: xpRemaining,
        xpForNextLevel: getXpForLevel(level),
    };
}

/**
 * All achievement categories
 * 
 * Types:
 * - 'progressive': Tiered achievements (I, II, III, etc.) with increasing thresholds
 * - 'one-time': Single unlock achievements (threshold is just the first value)
 * 
 * Hidden achievements are not shown until unlocked
 */
export const ACHIEVEMENT_CATEGORIES: AchievementCategory[] = [
    // ============================================
    // ONE-TIME ACHIEVEMENTS - Core Gameplay
    // ============================================
    {
        id: 'breeda',
        name: 'breeda',
        statKey: 'cowsBred',
        baseName: 'breeda',
        actionText: 'cow bred',
        thresholds: [1],
        baseXp: 15,
        type: 'one-time',
        description: 'Breed your first cow',
    },
    {
        id: 'milkman',
        name: 'milkman',
        statKey: 'milkCollected',
        baseName: 'milkman',
        actionText: 'milk collected',
        thresholds: [1],
        baseXp: 10,
        type: 'one-time',
        description: 'Collect your first milk',
    },
    {
        id: 'hands-on',
        name: 'hands on',
        statKey: 'cowsMilked',
        baseName: 'hands on',
        actionText: 'cow milked',
        thresholds: [1],
        baseXp: 10,
        type: 'one-time',
        description: 'Milk your first cow',
    },
    {
        id: 'stuffer',
        name: 'stuffer',
        statKey: 'cowsFed',
        baseName: 'stuffer',
        actionText: 'cow fed',
        thresholds: [1],
        baseXp: 10,
        type: 'one-time',
        description: 'Feed your first cow',
    },

    // ============================================
    // ONE-TIME ACHIEVEMENTS - Crafting
    // ============================================
    {
        id: 'buttah-is-bettah',
        name: 'buttah is bettah',
        statKey: 'butterCrafted',
        baseName: 'buttah is bettah',
        actionText: 'butter made',
        thresholds: [1],
        baseXp: 12,
        type: 'one-time',
        description: 'Craft your first butter',
    },
    {
        id: 'lets-get-cheesy',
        name: "let's get cheesy",
        statKey: 'cheeseCrafted',
        baseName: "let's get cheesy",
        actionText: 'cheese made',
        thresholds: [1],
        baseXp: 15,
        type: 'one-time',
        description: 'Craft your first cheese',
    },
    {
        id: 'creamy',
        name: 'creamy ;)',
        statKey: 'creamCrafted',
        baseName: 'creamy ;)',
        actionText: 'cream made',
        thresholds: [1],
        baseXp: 12,
        type: 'one-time',
        description: 'Craft your first cream',
    },
    {
        id: 'my-gurt',
        name: 'my-gurt',
        statKey: 'yogurtCrafted',
        baseName: 'my-gurt',
        actionText: 'yogurt made',
        thresholds: [1],
        baseXp: 12,
        type: 'one-time',
        description: 'Craft your first yogurt',
    },
    {
        id: 'cheesequake',
        name: 'cheesequake factory',
        statKey: 'cheesecakeCrafted',
        baseName: 'cheesequake factory',
        actionText: 'cheesecake made',
        thresholds: [1],
        baseXp: 20,
        type: 'one-time',
        description: 'Craft your first cheesecake',
    },
    {
        id: 'ice-ice-baby',
        name: 'ice ice baby',
        statKey: 'iceCreamCrafted',
        baseName: 'ice ice baby',
        actionText: 'ice cream made',
        thresholds: [1],
        baseXp: 18,
        type: 'one-time',
        description: 'Craft your first ice cream',
    },

    // ============================================
    // ONE-TIME ACHIEVEMENTS - Economy
    // ============================================
    {
        id: 'cha-ching',
        name: 'cha-ching',
        statKey: 'coinsEarned',
        baseName: 'cha-ching',
        actionText: '@ earned',
        thresholds: [1],
        baseXp: 10,
        type: 'one-time',
        description: 'Earn your first coins',
    },
    {
        id: 'big-spender',
        name: 'big spender',
        statKey: 'coinsSpent',
        baseName: 'big spender',
        actionText: '@ spent',
        thresholds: [1],
        baseXp: 10,
        type: 'one-time',
        description: 'Spend your first coins',
    },
    {
        id: 'stacks-from-8-sides',
        name: 'stacks from 8 sides',
        statKey: 'itemsSold',
        baseName: 'stacks from 8 sides',
        actionText: 'item sold',
        thresholds: [1],
        baseXp: 15,
        type: 'one-time',
        description: 'Sell your first item',
    },
    {
        id: 'big-money',
        name: 'big money',
        statKey: 'coinsEarned',
        baseName: 'big money',
        actionText: '@ earned',
        thresholds: [1000],
        baseXp: 50,
        type: 'one-time',
        description: 'Earn 1,000 coins',
    },

    // ============================================
    // HIDDEN ACHIEVEMENTS
    // ============================================
    {
        id: 'moo-natic',
        name: 'moo-natic',
        statKey: 'cowsBred',
        baseName: 'moo-natic',
        actionText: 'cows bred',
        thresholds: [69],
        baseXp: 69,
        type: 'one-time',
        hidden: true,
        description: 'Nice.',
    },
    {
        id: 'udder-chaos',
        name: 'udder chaos',
        statKey: 'chaosTriggered',
        baseName: 'udder chaos',
        actionText: 'chaos triggered',
        thresholds: [1],
        baseXp: 25,
        type: 'one-time',
        hidden: true,
        description: 'Trigger chaos from the cownsole',
    },
    {
        id: 'moolionaire',
        name: 'moolionaire',
        statKey: 'coinsEarned',
        baseName: 'moolionaire',
        actionText: '@ earned',
        thresholds: [1000000],
        baseXp: 500,
        type: 'one-time',
        hidden: true,
        description: 'Earn 1,000,000 coins',
    },
];

/**
 * Roman numeral conversion for tier display
 */
export function toRomanNumeral(num: number): string {
    if (num <= 0 || num > 3999) return num.toString();
    
    const romanNumerals: [number, string][] = [
        [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
        [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
        [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
    ];
    
    let result = '';
    let remaining = num;
    
    for (const [value, numeral] of romanNumerals) {
        while (remaining >= value) {
            result += numeral;
            remaining -= value;
        }
    }
    
    return result;
}
