import PropTypes from 'prop-types';
import styles from "./statsDisplay.module.css";

// XP required per level (can be moved to gameConfig)
const XP_PER_LEVEL = 10000;
const PROGRESS_BAR_LENGTH = 10; // Number of characters in the progress bar

/**
 * Calculate level from total XP
 */
function calculateLevel(totalXp) {
    return Math.floor(totalXp / XP_PER_LEVEL) + 1;
}

/**
 * Calculate XP progress within current level
 */
function calculateLevelProgress(totalXp) {
    return totalXp % XP_PER_LEVEL;
}

/**
 * Generate text-based progress bar like ████░░░░ 5,200/10,000
 */
function generateProgressBar(current, max) {
    const filledCount = Math.floor((current / max) * PROGRESS_BAR_LENGTH);
    const emptyCount = PROGRESS_BAR_LENGTH - filledCount;
    return `${'█'.repeat(filledCount)}${'░'.repeat(emptyCount)} ${current.toLocaleString()}/${max.toLocaleString()}`;
}

export default function StatsDisplay({ coins = 0, xp = 0, ...props }) {
    const level = calculateLevel(xp);
    const currentLevelXp = calculateLevelProgress(xp);
    const progressBar = generateProgressBar(currentLevelXp, XP_PER_LEVEL);

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

StatsDisplay.propTypes = {
    /** Current coin amount */
    coins: PropTypes.number,
    /** Current XP (stars converted to XP) */
    xp: PropTypes.number,
};

StatsDisplay.defaultProps = {
    coins: 0,
    xp: 0,
};
