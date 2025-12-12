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
 */
export const ACHIEVEMENT_CATEGORIES: AchievementCategory[] = [
    {
        id: 'breeda',
        name: 'breeda',
        statKey: 'cowsBred',
        baseName: 'breeda',
        actionText: 'bred',
        thresholds: 'standard',
        baseXp: 15,
    },
    {
        id: 'milkman',
        name: 'milkman',
        statKey: 'milkCollected',
        baseName: 'milkman',
        actionText: 'collected',
        thresholds: 'standard',
        baseXp: 10,
    },
    {
        id: 'buttah-is-bettah',
        name: 'buttah is bettah',
        statKey: 'butterCrafted',
        baseName: 'buttah is bettah',
        actionText: 'butter',
        thresholds: 'standard',
        baseXp: 12,
    },
    {
        id: 'lets-get-cheesy',
        name: "let's get cheesy",
        statKey: 'cheeseCrafted',
        baseName: "let's get cheesy",
        actionText: 'cheese',
        thresholds: 'standard',
        baseXp: 15,
    },
    {
        id: 'creamy',
        name: 'creamy ;)',
        statKey: 'creamCrafted',
        baseName: 'creamy ;)',
        actionText: 'cream',
        thresholds: 'standard',
        baseXp: 12,
    },
    {
        id: 'my-gurt',
        name: 'my-gurt',
        statKey: 'yogurtCrafted',
        baseName: 'my-gurt',
        actionText: 'yogurt',
        thresholds: 'standard',
        baseXp: 12,
    },
    {
        id: 'cheesequake',
        name: 'cheesequake factory',
        statKey: 'cheesecakeCrafted',
        baseName: 'cheesequake',
        actionText: 'cheesecake',
        thresholds: 'standard',
        baseXp: 20,
    },
    {
        id: 'ice-ice-baby',
        name: 'ice ice baby',
        statKey: 'iceCreamCrafted',
        baseName: 'ice ice baby',
        actionText: 'ice cream',
        thresholds: 'standard',
        baseXp: 18,
    },
    {
        id: 'cha-ching',
        name: 'cha-ching',
        statKey: 'coinsEarned',
        baseName: 'cha-ching',
        actionText: 'earned',
        thresholds: 'coins',
        baseXp: 25,
    },
    {
        id: 'stacks-from-8-sides',
        name: 'stacks from 8 sides',
        statKey: 'itemsSold',
        baseName: 'stacks from 8 sides',
        actionText: 'sold',
        thresholds: 'standard',
        baseXp: 15,
    },
    {
        id: 'stuffer',
        name: 'stuffer',
        statKey: 'cowsFed',
        baseName: 'stuffer',
        actionText: 'fed',
        thresholds: 'standard',
        baseXp: 10,
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

