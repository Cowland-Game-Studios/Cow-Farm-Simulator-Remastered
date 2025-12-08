/**
 * useSwipeToClose - Hook for swipe and scroll close gestures
 * Handles both touch swipe and mouse wheel to close the crafting menu
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { SWIPE_THRESHOLD, SWIPE_RESISTANCE } from '../craftingUtils';

/**
 * @param {Object} options
 * @param {Function} options.onClose - Callback when close is triggered
 * @param {boolean} options.isClosing - Whether the menu is already closing
 * @param {boolean} options.disabled - Whether gestures should be disabled (e.g., when dragging)
 * @param {Object} options.excludeSelectors - CSS selectors to exclude from swipe start
 */
export default function useSwipeToClose({ 
    onClose, 
    isClosing, 
    disabled = false,
    excludeSelectors = {}
}) {
    const [swipeOffset, setSwipeOffset] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const [animationComplete, setAnimationComplete] = useState(false);
    const swipeStartRef = useRef(null);

    // Mark animation as complete after entrance animation finishes
    useEffect(() => {
        const timer = setTimeout(() => {
            setAnimationComplete(true);
        }, 600); // Match benchSlideIn animation duration
        return () => clearTimeout(timer);
    }, []);

    // Swipe start handler
    const handleSwipeStart = useCallback((e) => {
        if (disabled) return;
        
        // Only allow swipe on backdrop/bench, not on sidebar items
        const target = e.target;
        if (target.closest('button') && !target.closest('#craftingBench')) return;
        if (excludeSelectors.leftSidebar && target.closest(excludeSelectors.leftSidebar)) return;
        if (excludeSelectors.rightSidebar && target.closest(excludeSelectors.rightSidebar)) return;
        
        // Get the Y position from touch or mouse
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        swipeStartRef.current = clientY;
        setIsSwiping(true);
    }, [disabled, excludeSelectors]);

    // Swipe move handler
    const handleSwipeMove = useCallback((e) => {
        if (!isSwiping || swipeStartRef.current === null) return;
        
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
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
            const handleGlobalMove = (e) => handleSwipeMove(e);
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
        
        const handleWheel = (e) => {
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
