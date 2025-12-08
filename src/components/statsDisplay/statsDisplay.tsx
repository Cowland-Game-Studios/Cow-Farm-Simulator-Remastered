import React from 'react';
import styles from "./statsDisplay.module.css";
import { GAME_CONFIG } from "../../config/gameConfig";

const { STATS } = GAME_CONFIG;

interface StatsDisplayProps {
    /** Current coin amount */
    coins?: number;
    /** Current XP (stars converted to XP) */
    xp?: number;
    [key: string]: unknown;
}

/**
 * Calculate level from total XP
 */
function calculateLevel(totalXp: number): number {
    return Math.floor(totalXp / STATS.XP_PER_LEVEL) + 1;
}

/**
 * Calculate XP progress within current level
 */
function calculateLevelProgress(totalXp: number): number {
    return totalXp % STATS.XP_PER_LEVEL;
}

/**
 * Generate text-based progress bar like ████░░░░ 5,200/10,000
 */
function generateProgressBar(current: number, max: number): string {
    const filledCount = Math.floor((current / max) * STATS.PROGRESS_BAR_LENGTH);
    const emptyCount = STATS.PROGRESS_BAR_LENGTH - filledCount;
    return `${'█'.repeat(filledCount)}${'░'.repeat(emptyCount)} ${current.toLocaleString()}/${max.toLocaleString()}`;
}

export default function StatsDisplay({ coins = 0, xp = 0, ...props }: StatsDisplayProps): React.ReactElement {
    const level = calculateLevel(xp);
    const currentLevelXp = calculateLevelProgress(xp);
    const progressBar = generateProgressBar(currentLevelXp, STATS.XP_PER_LEVEL);

    return (
        <div className={styles.statsDisplay} {...props}>
            <div className={styles.statsContainer}>
                {/* Money */}
                <h3 className={styles.statTitle}>money</h3>
                <p className={styles.statValue}>@{coins.toLocaleString()}</p>

                {/* Level */}
                <div className={styles.levelContainer}>
                    <h3 className={styles.statTitle}>lvl {level}</h3>
                    <p className={styles.progressBar}>
                        {progressBar}
                    </p>
                </div>
            </div>
        </div>
    );
}

