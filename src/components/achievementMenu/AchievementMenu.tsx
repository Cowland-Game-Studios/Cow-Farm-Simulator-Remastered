import React, { useEffect, useMemo, useCallback } from 'react';
import { useStats, useAchievements } from '../../engine/GameProvider';
import { getClosestAchievements } from '../../engine/achievements';
import styles from "./AchievementMenu.module.css";

interface AchievementMenuProps {
    [key: string]: unknown;
}

export default function AchievementMenu({ ...props }: AchievementMenuProps): React.ReactElement {
    const stats = useStats();
    const { achievements, checkAchievements } = useAchievements();
    
    // Check achievements periodically
    useEffect(() => {
        checkAchievements();
    }, [stats, checkAchievements]);
    
    // Get all achievements sorted by closest to completion
    const allAchievements = useMemo(() => {
        return getClosestAchievements(stats, achievements.unlocked, 100);
    }, [stats, achievements.unlocked]);
    
    // Stop wheel/scroll events from bubbling to parent
    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.stopPropagation();
    }, []);
    
    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        e.stopPropagation();
    }, []);
    
    return (
        <div 
            className={styles.achievementMenu} 
            onWheel={handleWheel}
            onTouchMove={handleTouchMove}
            {...props}
        >
            <div className={styles.fadeTop} />
            <div className={styles.scrollContainer}>
                {allAchievements.map(progress => (
                    <div key={progress.achievement.id} className={styles.achievementItem}>
                        <h3>{progress.achievement.name} <span className={styles.xp}>{progress.achievement.xpReward}xp</span></h3>
                        <p>- {progress.tierCurrent}/{progress.tierMax} {progress.achievement.actionText}</p>
                    </div>
                ))}
            </div>
            <div className={styles.fadeBottom} />
        </div>
    );
}
