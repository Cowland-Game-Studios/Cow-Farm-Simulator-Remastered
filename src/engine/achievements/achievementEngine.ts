/**
 * Achievement Engine
 * Core logic for checking, unlocking, and tracking achievements
 */

import { GameStats } from '../types';
import { 
    Achievement, 
    AchievementProgress, 
    AchievementCheckResult,
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
    
    // For one-time achievements, only tier 1 exists
    if (category.type === 'one-time' && tier !== 1) {
        return null;
    }
    
    // Generate name based on type
    const name = category.type === 'progressive'
        ? `[${toRomanNumeral(tier).toLowerCase()}] ${category.baseName}`
        : category.baseName;
    
    return {
        id: getAchievementId(categoryId, tier),
        categoryId,
        name,
        tier,
        threshold: getThreshold(tier, thresholds),
        xpReward: category.type === 'progressive' 
            ? getXpForTier(tier, category.baseXp) 
            : category.baseXp,
        statKey: category.statKey,
        actionText: category.actionText,
        type: category.type,
        hidden: category.hidden ?? false,
        description: category.description,
    };
}

/**
 * Get the current tier for a category based on stat value
 */
export function getCurrentTier(categoryId: string, statValue: number): number {
    const category = ACHIEVEMENT_CATEGORIES.find(c => c.id === categoryId);
    if (!category) return 0;
    
    // For one-time achievements, return 1 if threshold met, 0 otherwise
    if (category.type === 'one-time') {
        const threshold = Array.isArray(category.thresholds) 
            ? category.thresholds[0] 
            : getThreshold(1, category.thresholds);
        return statValue >= threshold ? 1 : 0;
    }
    
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
    
    // For one-time achievements, return the achievement if not yet unlocked
    if (category.type === 'one-time') {
        if (currentTier === 0) {
            return generateAchievement(categoryId, 1);
        }
        return null; // Already unlocked
    }
    
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
    const category = ACHIEVEMENT_CATEGORIES.find(c => c.id === categoryId);
    if (!category) return null;
    
    const nextAchievement = getNextAchievement(categoryId, stats);
    if (!nextAchievement) return null;
    
    const currentValue = stats[category.statKey] || 0;
    const thresholdType = category.thresholds === 'standard' || category.thresholds === 'coins' 
        ? category.thresholds 
        : category.thresholds;
    
    // For one-time achievements, progress is simply current/threshold
    if (category.type === 'one-time') {
        const threshold = nextAchievement.threshold;
        const progress = Math.min(1, Math.max(0, currentValue / threshold));
        const isUnlocked = unlocked[nextAchievement.id] !== undefined;
        
        return {
            achievement: nextAchievement,
            currentValue,
            tierCurrent: currentValue,
            tierMax: threshold,
            progress,
            isUnlocked,
            unlockedAt: unlocked[nextAchievement.id],
        };
    }
    
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
 * @param includeHidden - Whether to include hidden achievements that haven't been unlocked
 */
export function getAllAchievementProgress(
    stats: GameStats, 
    unlocked: Record<string, number>,
    includeHidden: boolean = false
): AchievementProgress[] {
    const progressList: AchievementProgress[] = [];
    
    for (const category of ACHIEVEMENT_CATEGORIES) {
        const progress = getAchievementProgress(category.id, stats, unlocked);
        if (progress) {
            // Skip hidden achievements that aren't unlocked unless includeHidden is true
            if (category.hidden && !progress.isUnlocked && !includeHidden) {
                continue;
            }
            progressList.push(progress);
        }
    }
    
    return progressList;
}

/**
 * Get the N closest-to-completion achievements
 * @param includeHidden - Whether to include hidden achievements in the list
 */
export function getClosestAchievements(
    stats: GameStats, 
    unlocked: Record<string, number>,
    count: number = 2,
    includeHidden: boolean = false
): AchievementProgress[] {
    const allProgress = getAllAchievementProgress(stats, unlocked, includeHidden);
    
    // Filter out already unlocked and sort by progress (highest first)
    return allProgress
        .filter(p => !p.isUnlocked && p.progress < 1)
        .sort((a, b) => b.progress - a.progress)
        .slice(0, count);
}

/**
 * Get all unlocked achievements (including hidden ones that were unlocked)
 */
export function getUnlockedAchievements(
    unlocked: Record<string, number>
): Achievement[] {
    const achievements: Achievement[] = [];
    
    for (const achievementId of Object.keys(unlocked)) {
        const [categoryId, tierStr] = achievementId.split(':');
        const tier = parseInt(tierStr, 10);
        const achievement = generateAchievement(categoryId, tier);
        if (achievement) {
            achievements.push(achievement);
        }
    }
    
    return achievements;
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
        
        // For one-time achievements, only check tier 1
        if (category.type === 'one-time') {
            if (achievedTier >= 1) {
                const achievementId = getAchievementId(category.id, 1);
                if (currentUnlocked[achievementId] === undefined) {
                    const achievement = generateAchievement(category.id, 1);
                    if (achievement) {
                        newlyUnlocked.push(achievement);
                        totalXpAwarded += achievement.xpReward;
                    }
                }
            }
            continue;
        }
        
        // For progressive achievements, check all tiers up to the achieved tier
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
 * Get total unlocked achievement count
 */
export function getUnlockedCount(unlocked: Record<string, number>): number {
    return Object.keys(unlocked).length;
}

/**
 * Get counts by achievement type
 */
export function getAchievementCounts(unlocked: Record<string, number>): {
    progressive: number;
    oneTime: number;
    hidden: number;
    total: number;
} {
    let progressive = 0;
    let oneTime = 0;
    let hidden = 0;
    
    for (const achievementId of Object.keys(unlocked)) {
        const [categoryId] = achievementId.split(':');
        const category = ACHIEVEMENT_CATEGORIES.find(c => c.id === categoryId);
        if (category) {
            if (category.hidden) hidden++;
            if (category.type === 'progressive') progressive++;
            else if (category.type === 'one-time') oneTime++;
        }
    }
    
    return {
        progressive,
        oneTime,
        hidden,
        total: Object.keys(unlocked).length,
    };
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
