import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { useStats, useAchievements } from '../../engine/GameProvider';
import { getClosestAchievements, AchievementProgress } from '../../engine/achievements';
import { RollingNumber } from '../rollingNumber';
import styles from "./AchievementMenu.module.css";

interface AchievementMenuProps {
    [key: string]: unknown;
}

interface AchievementItemProps {
    progress: AchievementProgress;
    showRemaining: boolean;
    onToggle: () => void;
}

function AchievementItem({ progress, showRemaining, onToggle }: AchievementItemProps): React.ReactElement {
    const [isRolling, setIsRolling] = useState(false);
    
    const remaining = progress.tierMax - progress.tierCurrent;
    
    // Use a single value that changes based on mode
    const displayValue = showRemaining ? remaining : progress.tierCurrent;
    
    const handleRollingChange = useCallback((animating: boolean) => {
        setIsRolling(animating);
    }, []);
    
    // Generate the suffix text based on mode
    const suffixText = showRemaining 
        ? ` to be ${progress.achievement.actionText}`
        : `/${progress.tierMax} ${progress.achievement.actionText}`;
    
    // Determine CSS classes based on achievement type
    const itemClasses = [styles.achievementItem];
    if (progress.achievement.type === 'one-time') {
        itemClasses.push(styles.oneTime);
    }
    if (progress.achievement.hidden) {
        itemClasses.push(styles.hidden);
    }
    
    return (
        <div className={itemClasses.join(' ')}>
            <h3>
                {progress.achievement.name}
                <span className={styles.xp}> {progress.achievement.xpReward}xp</span>
            </h3>
            <p 
                className={`${styles.progressText} ${isRolling ? styles.pulse : ''}`} 
                onClick={onToggle}
            >
                <RollingNumber 
                    value={displayValue} 
                    onAnimating={handleRollingChange}
                />{suffixText}
            </p>
        </div>
    );
}

export default function AchievementMenu({ ...props }: AchievementMenuProps): React.ReactElement {
    const stats = useStats();
    const { achievements, checkAchievements } = useAchievements();
    
    // Toggle between showing progress (0/1) and remaining (1 to be)
    const [showRemaining, setShowRemaining] = useState(false);
    
    const toggleDisplay = useCallback(() => {
        setShowRemaining(prev => !prev);
    }, []);
    
    // Check achievements periodically
    useEffect(() => {
        checkAchievements();
    }, [stats, checkAchievements]);
    
    // Get all achievements sorted by closest to completion
    // Don't include hidden achievements (they'll show after unlock)
    const allAchievements = useMemo(() => {
        return getClosestAchievements(stats, achievements.unlocked, 100, false);
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
                    <AchievementItem 
                        key={progress.achievement.id}
                        progress={progress}
                        showRemaining={showRemaining}
                        onToggle={toggleDisplay}
                    />
                ))}
            </div>
            <div className={styles.fadeBottom} />
        </div>
    );
}
