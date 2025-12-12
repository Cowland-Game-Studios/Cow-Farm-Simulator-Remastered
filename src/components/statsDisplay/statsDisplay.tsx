import React, { useState, useCallback } from 'react';
import styles from "./statsDisplay.module.css";
import { GAME_CONFIG } from "../../config/gameConfig";
import { getLevelFromXp } from "../../engine/achievements";
import { useRewardTarget } from "../../engine/flyingRewards";

const { STATS } = GAME_CONFIG;

interface StatsDisplayProps {
    /** Current coin amount */
    coins?: number;
    /** Current XP from achievement system */
    xp?: number;
    [key: string]: unknown;
}

/**
 * Format number with truncation (1.2k, 4.5M, etc.)
 */
function formatNumber(value: number): string {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}m`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
    return value.toString();
}

/**
 * Generate text-based progress bar like ████░░░░
 */
function generateProgressBar(current: number, max: number): string {
    const progress = max > 0 ? current / max : 0;
    const filledCount = Math.floor(progress * STATS.PROGRESS_BAR_LENGTH);
    const emptyCount = STATS.PROGRESS_BAR_LENGTH - filledCount;
    return `${'█'.repeat(filledCount)}${'░'.repeat(emptyCount)}`;
}

export default function StatsDisplay({ coins = 0, xp = 0, ...props }: StatsDisplayProps): React.ReactElement {
    const levelInfo = getLevelFromXp(xp);
    const progressBar = generateProgressBar(levelInfo.xpIntoLevel, levelInfo.xpForNextLevel);
    
    const { ref: xpRef, isPulsing: xpPulsing } = useRewardTarget('xp');
    const { ref: coinsRef, isPulsing: coinsPulsing } = useRewardTarget('coins');
    
    // Toggle between showing progress (12/25) and remaining (13xp left)
    const [showRemaining, setShowRemaining] = useState(false);
    
    const toggleXpDisplay = useCallback(() => {
        setShowRemaining(prev => !prev);
    }, []);
    
    const xpRemaining = levelInfo.xpForNextLevel - levelInfo.xpIntoLevel;
    const xpDisplayText = showRemaining 
        ? `(${formatNumber(xpRemaining)}xp left)`
        : `(${formatNumber(levelInfo.xpIntoLevel)}/${formatNumber(levelInfo.xpForNextLevel)})`;

    return (
        <div className={styles.statsDisplay} {...props}>
            <div className={styles.statsContainer}>
                {/* Money */}
                <h3 className={styles.statTitle}>money</h3>
                <p 
                    ref={coinsRef}
                    className={`${styles.statValue} ${coinsPulsing ? styles.pulse : ''}`}
                >
                    @{coins.toLocaleString()}
                </p>

                {/* Level */}
                <div className={styles.levelContainer}>
                    <h3 className={styles.statTitle}>lvl {levelInfo.level}</h3>
                    <div className={styles.progressRow}>
                        <p 
                            ref={xpRef}
                            className={`${styles.progressBar} ${xpPulsing ? styles.pulse : ''}`}
                        >
                            {progressBar}
                        </p>
                        <span 
                            className={styles.xpText}
                            onClick={toggleXpDisplay}
                        >
                            {xpDisplayText}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
