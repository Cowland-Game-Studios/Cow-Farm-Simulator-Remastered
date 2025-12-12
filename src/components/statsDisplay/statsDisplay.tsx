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
 * Custom hook for animated progress bar
 */
function useAnimatedBar(targetFill: number, shouldAnimate: boolean) {
    const [displayedFill, setDisplayedFill] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const targetRef = useRef(targetFill);
    
    // Keep target ref updated
    targetRef.current = targetFill;
    
    // Cleanup function
    const cleanup = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);
    
    // Start animation from 0 to target
    const startAnimation = useCallback(() => {
        cleanup();
        setDisplayedFill(0);
        setIsAnimating(true);
        
        let currentFill = 0;
        const stepDuration = 50;
        
        intervalRef.current = setInterval(() => {
            currentFill++;
            const target = targetRef.current;
            
            if (currentFill >= target) {
                setDisplayedFill(target);
                setIsAnimating(false);
                cleanup();
            } else {
                setDisplayedFill(currentFill);
            }
        }, stepDuration);
    }, [cleanup]);
    
    // When shouldAnimate becomes true, start animation
    useEffect(() => {
        if (shouldAnimate) {
            startAnimation();
        }
        return cleanup;
    }, [shouldAnimate, startAnimation, cleanup]);
    
    // When target changes and we're not animating, update immediately
    useEffect(() => {
        if (!isAnimating && !shouldAnimate) {
            setDisplayedFill(targetFill);
        }
    }, [targetFill, isAnimating, shouldAnimate]);
    
    return { displayedFill, isAnimating, startAnimation };
}

export default function StatsDisplay({ coins = 0, xp = 0, ...props }: StatsDisplayProps): React.ReactElement {
    const levelInfo = getLevelFromXp(xp);
    
    const { ref: xpRef, isPulsing: xpPulsing } = useRewardTarget('xp');
    const { ref: coinsRef, isPulsing: coinsPulsing } = useRewardTarget('coins');
    
    // Cycle through 3 display modes: progress, remaining, bar (start with bar)
    const [displayMode, setDisplayMode] = useState<XpDisplayMode>(2);
    
    // Track the displayed number value for RollingNumber
    const [animatedValue, setAnimatedValue] = useState(0);
    
    // Track if rolling animation is active
    const [isRolling, setIsRolling] = useState(false);
    
    // Track click-triggered pulse
    const [clickPulse, setClickPulse] = useState(false);
    
    // Track if we should trigger bar animation (increments to trigger)
    const [barAnimationTrigger, setBarAnimationTrigger] = useState(1); // Start with 1 to animate on mount
    
    // Calculate values
    const xpRemaining = levelInfo.xpForNextLevel - levelInfo.xpIntoLevel;
    const targetValue = displayMode === 0 ? levelInfo.xpIntoLevel : xpRemaining;
    const progress = levelInfo.xpForNextLevel > 0 ? levelInfo.xpIntoLevel / levelInfo.xpForNextLevel : 0;
    const targetBarFill = Math.floor(progress * STATS.PROGRESS_BAR_LENGTH);
    
    // Use animated bar hook - animate when trigger changes and we're in bar mode
    const shouldAnimateBar = displayMode === 2 && barAnimationTrigger > 0;
    const { displayedFill, isAnimating: isBarAnimating } = useAnimatedBar(targetBarFill, shouldAnimateBar);
    
    // Generate progress bar string
    const progressBar = `${'█'.repeat(displayedFill)}${'░'.repeat(STATS.PROGRESS_BAR_LENGTH - displayedFill)}`;
    
    // Previous display mode for detecting changes
    const prevModeRef = useRef<XpDisplayMode>(2);
    
    // Handle display mode changes
    useEffect(() => {
        const prevMode = prevModeRef.current;
        
        if (displayMode === prevMode) {
            return;
        }
        
        // Trigger pulse on any mode change
        setClickPulse(true);
        setTimeout(() => setClickPulse(false), 300);
        
        if (displayMode === 2) {
            // Entering bar mode - trigger animation
            setBarAnimationTrigger(prev => prev + 1);
        } else if (prevMode === 2) {
            // Leaving bar mode - animate number from 0
            setAnimatedValue(0);
            setTimeout(() => setAnimatedValue(targetValue), 50);
        } else {
            // Switching between number modes
            setAnimatedValue(targetValue);
        }
        
        prevModeRef.current = displayMode;
    }, [displayMode, targetValue]);
    
    // Update animated value when XP changes (while in number mode)
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
    
    const shouldPulse = xpPulsing || isRolling || clickPulse || isBarAnimating;

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
