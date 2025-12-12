import React, { useState, useCallback, useEffect, useRef } from 'react';
import styles from "./statsDisplay.module.css";
import { GAME_CONFIG } from "../../config/gameConfig";
import { getLevelFromXp } from "../../engine/achievements";
import { useRewardTarget } from "../../engine/flyingRewards";
import { RollingNumber } from "../rollingNumber";

const { STATS } = GAME_CONFIG;

// Display modes for XP: 0 = progress, 1 = remaining, 2 = bar
type XpDisplayMode = 0 | 1 | 2;

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
    
    // Cycle through 3 display modes: progress, remaining, bar (start with bar)
    const [displayMode, setDisplayMode] = useState<XpDisplayMode>(2);
    const prevDisplayModeRef = useRef<XpDisplayMode>(2);
    
    // Track the displayed number value - starts at 0 when coming from bar mode
    const [animatedValue, setAnimatedValue] = useState(0);
    
    // Track if rolling animation is active
    const [isRolling, setIsRolling] = useState(false);
    
    // Calculate the target value based on mode
    const xpRemaining = levelInfo.xpForNextLevel - levelInfo.xpIntoLevel;
    const targetValue = displayMode === 0 ? levelInfo.xpIntoLevel : xpRemaining;
    
    // When display mode changes, update animated value
    useEffect(() => {
        const prevMode = prevDisplayModeRef.current;
        
        if (displayMode === 2) {
            // Switching to bar mode - reset animated value to 0 for next time
            setAnimatedValue(0);
        } else if (prevMode === 2) {
            // Coming FROM bar mode - animate from 0 to target
            setAnimatedValue(0);
            // Small delay to ensure RollingNumber picks up the change
            setTimeout(() => {
                setAnimatedValue(targetValue);
            }, 50);
        } else {
            // Switching between number modes - animate between values
            setAnimatedValue(targetValue);
        }
        
        prevDisplayModeRef.current = displayMode;
    }, [displayMode, targetValue]);
    
    // Also update when XP changes (while in a number mode)
    useEffect(() => {
        if (displayMode !== 2) {
            setAnimatedValue(targetValue);
        }
    }, [xp, displayMode, targetValue]);
    
    const cycleDisplayMode = useCallback(() => {
        setDisplayMode(prev => ((prev + 1) % 3) as XpDisplayMode);
    }, []);
    
    const handleRollingChange = useCallback((animating: boolean) => {
        setIsRolling(animating);
    }, []);
    
    const shouldPulse = xpPulsing || isRolling;

    // Render XP display based on mode
    const renderXpDisplay = () => {
        switch (displayMode) {
            case 0:
                return (
                    <>
                        <RollingNumber 
                            value={animatedValue} 
                            formatFn={formatNumber}
                            onAnimating={handleRollingChange}
                        />
                        /{formatNumber(levelInfo.xpForNextLevel)} xp
                    </>
                );
            case 1:
                return (
                    <>
                        <RollingNumber 
                            value={animatedValue} 
                            formatFn={formatNumber}
                            onAnimating={handleRollingChange}
                        />
                        xp left
                    </>
                );
            case 2:
                return progressBar;
        }
    };

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
                    <p 
                        ref={xpRef}
                        className={`${styles.xpText} ${shouldPulse ? styles.pulse : ''}`}
                        onClick={cycleDisplayMode}
                    >
                        {renderXpDisplay()}
                    </p>
                </div>
            </div>
        </div>
    );
}
