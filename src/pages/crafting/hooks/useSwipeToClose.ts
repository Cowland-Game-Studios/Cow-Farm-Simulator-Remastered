/**
 * useSwipeToClose - Hook for swipe and scroll close gestures
 * Handles both touch swipe and mouse wheel to close the crafting menu
 */

import { useState, useRef, useCallback, useEffect, TouchEvent, MouseEvent } from 'react';
import { SWIPE_THRESHOLD, SWIPE_RESISTANCE } from '../craftingUtils';
import { GAME_CONFIG } from '../../../config/gameConfig';

interface UseSwipeToCloseOptions {
    /** Callback when close is triggered */
    onClose: () => void;
    /** Whether the menu is already closing */
    isClosing: boolean;
    /** Whether gestures should be disabled (e.g., when dragging) */
    disabled?: boolean;
    /** CSS selectors to exclude from swipe start */
    excludeSelectors?: {
        leftSidebar?: string;
        rightSidebar?: string;
    };
}

interface UseSwipeToCloseReturn {
    swipeOffset: number;
    isSwiping: boolean;
    animationComplete: boolean;
    handleSwipeStart: (e: TouchEvent | MouseEvent) => void;
}

export default function useSwipeToClose({ 
    onClose, 
    isClosing, 
    disabled = false,
    excludeSelectors = {}
}: UseSwipeToCloseOptions): UseSwipeToCloseReturn {
    const [swipeOffset, setSwipeOffset] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const [animationComplete, setAnimationComplete] = useState(false);
    const swipeStartRef = useRef<number | null>(null);

    // Mark animation as complete after entrance animation finishes
    useEffect(() => {
        const timer = setTimeout(() => {
            setAnimationComplete(true);
        }, GAME_CONFIG.UI.BENCH_SLIDE_IN_DURATION_MS);
        return () => clearTimeout(timer);
    }, []);

    // Swipe start handler
    const handleSwipeStart = useCallback((e: TouchEvent | MouseEvent) => {
        if (disabled) return;
        
        // Only allow swipe on backdrop/bench, not on sidebar items
        const target = e.target as HTMLElement;
        if (target.closest('button') && !target.closest('#craftingBench')) return;
        if (excludeSelectors.leftSidebar && target.closest(excludeSelectors.leftSidebar)) return;
        if (excludeSelectors.rightSidebar && target.closest(excludeSelectors.rightSidebar)) return;
        
        // Get the Y position from touch or mouse
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        swipeStartRef.current = clientY;
        setIsSwiping(true);
    }, [disabled, excludeSelectors]);

    // Swipe move handler
    const handleSwipeMove = useCallback((e: globalThis.TouchEvent | globalThis.MouseEvent) => {
        if (!isSwiping || swipeStartRef.current === null) return;
        
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        let delta = clientY - swipeStartRef.current; // Positive when swiping DOWN
        
        // Apply resistance when swiping up (negative delta - opposite direction)
        if (delta < 0) {
            delta *= SWIPE_RESISTANCE;
        }
        
        setSwipeOffset(delta);
    }, [isSwiping]);

    // Swipe end handler
    const handleSwipeEnd = useCallback(() => {
        if (!isSwiping) return;
        
        setIsSwiping(false);
        swipeStartRef.current = null;
        
        // If swiped UP past threshold, close the menu (pushing it back up)
        if (swipeOffset <= -SWIPE_THRESHOLD) {
            onClose();
        }
        
        // Reset offset (will animate back via CSS transition)
        setSwipeOffset(0);
    }, [isSwiping, swipeOffset, onClose]);

    // Add global mouse/touch move and end listeners when swiping
    useEffect(() => {
        if (isSwiping) {
            const handleGlobalMove = (e: globalThis.TouchEvent | globalThis.MouseEvent) => handleSwipeMove(e);
            const handleGlobalEnd = () => handleSwipeEnd();

            window.addEventListener('mousemove', handleGlobalMove);
            window.addEventListener('mouseup', handleGlobalEnd);
            window.addEventListener('touchmove', handleGlobalMove);
            window.addEventListener('touchend', handleGlobalEnd);

            return () => {
                window.removeEventListener('mousemove', handleGlobalMove);
                window.removeEventListener('mouseup', handleGlobalEnd);
                window.removeEventListener('touchmove', handleGlobalMove);
                window.removeEventListener('touchend', handleGlobalEnd);
            };
        }
    }, [isSwiping, handleSwipeMove, handleSwipeEnd]);

    // Scroll down to close
    useEffect(() => {
        if (isClosing) return; // Don't handle scroll if already closing
        
        const handleWheel = (e: WheelEvent) => {
            if (disabled) return;
            
            // deltaY > 0 means scrolling down
            if (e.deltaY > 0) {
                onClose();
            }
        };

        window.addEventListener('wheel', handleWheel, { passive: true });
        return () => window.removeEventListener('wheel', handleWheel);
    }, [isClosing, disabled, onClose]);

    return {
        swipeOffset,
        isSwiping,
        animationComplete,
        handleSwipeStart,
    };
}

