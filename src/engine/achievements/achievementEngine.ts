/**
 * Achievement Engine
 * Core logic for checking, unlocking, and tracking achievements
 */

import { GameStats, AchievementState } from '../types';
import { 
    Achievement, 
    AchievementProgress, 
    AchievementCheckResult 
} from './achievementTypes';
import { 
    ACHIEVEMENT_CATEGORIES, 
    getThreshold, 
    getXpForTier,
    toRomanNumeral 
} from './achievementConfig';

/**
 * Generate achievement ID for a category and tier
 */
export function getAchievementId(categoryId: string, tier: number): string {
    return `${categoryId}:${tier}`;
}

/**
 * Generate an Achievement object for a category and tier
 */
export function generateAchievement(categoryId: string, tier: number): Achievement | null {
    const category = ACHIEVEMENT_CATEGORIES.find(c => c.id === categoryId);
    if (!category) return null;
    
    const thresholds = category.thresholds === 'standard' || category.thresholds === 'coins'
        ? category.thresholds
        : category.thresholds;
    
    return {
        id: getAchievementId(categoryId, tier),
        categoryId,
        name: `${category.baseName} ${toRomanNumeral(tier).toLowerCase()}`,
        tier,
        threshold: getThreshold(tier, thresholds),
        xpReward: getXpForTier(tier, category.baseXp),
        statKey: category.statKey,
        actionText: category.actionText,
    };
}

/**
 * Get the current tier for a category based on stat value
 */
export function getCurrentTier(categoryId: string, statValue: number): number {
    const category = ACHIEVEMENT_CATEGORIES.find(c => c.id === categoryId);
    if (!category) return 0;
    
    const thresholds = category.thresholds === 'standard' || category.thresholds === 'coins'
        ? category.thresholds
        : category.thresholds;
    
    let tier = 0;
    while (statValue >= getThreshold(tier + 1, thresholds)) {
        tier++;
    }
    return tier;
}

/**
 * Get the next achievement to unlock for a category
 */
export function getNextAchievement(categoryId: string, stats: GameStats): Achievement | null {
    const category = ACHIEVEMENT_CATEGORIES.find(c => c.id === categoryId);
    if (!category) return null;
    
    const currentValue = stats[category.statKey] || 0;
    const currentTier = getCurrentTier(categoryId, currentValue);
    
    return generateAchievement(categoryId, currentTier + 1);
}

/**
 * Get progress towards the next achievement in a category
 */
export function getAchievementProgress(
    categoryId: string, 
    stats: GameStats, 
    unlocked: Record<string, number>
): AchievementProgress | null {
    const nextAchievement = getNextAchievement(categoryId, stats);
    if (!nextAchievement) return null;
    
    const category = ACHIEVEMENT_CATEGORIES.find(c => c.id === categoryId);
    if (!category) return null;
    
    const currentValue = stats[category.statKey] || 0;
    const thresholdType = category.thresholds === 'standard' || category.thresholds === 'coins' 
        ? category.thresholds 
        : category.thresholds;
    const previousThreshold = nextAchievement.tier > 1 
        ? getThreshold(nextAchievement.tier - 1, thresholdType)
        : 0;
    
    const tierMax = nextAchievement.threshold - previousThreshold;
    const tierCurrent = Math.max(0, currentValue - previousThreshold);
    const progress = Math.min(1, Math.max(0, tierCurrent / tierMax));
    
    const isUnlocked = unlocked[nextAchievement.id] !== undefined;
    
    return {
        achievement: nextAchievement,
        currentValue,
        tierCurrent,
        tierMax,
        progress,
        isUnlocked,
        unlockedAt: unlocked[nextAchievement.id],
    };
}

/**
 * Get all achievement progress for display
 */
export function getAllAchievementProgress(
    stats: GameStats, 
    unlocked: Record<string, number>
): AchievementProgress[] {
    const progressList: AchievementProgress[] = [];
    
    for (const category of ACHIEVEMENT_CATEGORIES) {
        const progress = getAchievementProgress(category.id, stats, unlocked);
        if (progress) {
            progressList.push(progress);
        }
    }
    
    return progressList;
}

/**
 * Get the N closest-to-completion achievements
 */
export function getClosestAchievements(
    stats: GameStats, 
    unlocked: Record<string, number>,
    count: number = 2
): AchievementProgress[] {
    const allProgress = getAllAchievementProgress(stats, unlocked);
    
    // Filter out already unlocked and sort by progress (highest first)
    return allProgress
        .filter(p => !p.isUnlocked && p.progress < 1)
        .sort((a, b) => b.progress - a.progress)
        .slice(0, count);
}

/**
 * Check all achievements and return newly unlocked ones
 */
export function checkAchievements(
    stats: GameStats, 
    currentUnlocked: Record<string, number>
): AchievementCheckResult {
    const newlyUnlocked: Achievement[] = [];
    let totalXpAwarded = 0;
    
    for (const category of ACHIEVEMENT_CATEGORIES) {
        const currentValue = stats[category.statKey] || 0;
        const achievedTier = getCurrentTier(category.id, currentValue);
        
        // Check all tiers up to the achieved tier
        for (let tier = 1; tier <= achievedTier; tier++) {
            const achievementId = getAchievementId(category.id, tier);
            
            // If not already unlocked, add to newly unlocked
            if (currentUnlocked[achievementId] === undefined) {
                const achievement = generateAchievement(category.id, tier);
                if (achievement) {
                    newlyUnlocked.push(achievement);
                    totalXpAwarded += achievement.xpReward;
                }
            }
        }
    }
    
    return {
        newlyUnlocked,
        totalXpAwarded,
    };
}

/**
 * Apply achievement check results to state
 */
export function applyAchievementResults(
    currentState: AchievementState,
    currentXp: number,
    results: AchievementCheckResult
): { achievements: AchievementState; xp: number } {
    if (results.newlyUnlocked.length === 0) {
        return { achievements: currentState, xp: currentXp };
    }
    
    const now = Date.now();
    const newUnlocked = { ...currentState.unlocked };
    
    for (const achievement of results.newlyUnlocked) {
        newUnlocked[achievement.id] = now;
    }
    
    return {
        achievements: {
            ...currentState,
            unlocked: newUnlocked,
        },
        xp: currentXp + results.totalXpAwarded,
    };
}

/**
 * Get total unlocked achievement count
 */
export function getUnlockedCount(unlocked: Record<string, number>): number {
    return Object.keys(unlocked).length;
}

/**
 * Format a threshold value for display
 */
export function formatThreshold(value: number): string {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
}

