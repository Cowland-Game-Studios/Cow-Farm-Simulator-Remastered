/**
 * RollingNumber Component
 * 
 * Animates a number change with a counting effect.
 * Uses setInterval for reliable animation.
 */

import React, { useEffect, useState, useRef } from 'react';

interface RollingNumberProps {
    value: number;
    duration?: number; // Animation duration in ms
    formatFn?: (value: number) => string;
    className?: string;
    onAnimating?: (isAnimating: boolean) => void;
}

export default function RollingNumber({ 
    value, 
    duration = 300,
    formatFn = (v) => v.toString(),
    className,
    onAnimating,
}: RollingNumberProps): React.ReactElement {
    const [displayValue, setDisplayValue] = useState(value);
    const targetRef = useRef(value);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    
    useEffect(() => {
        // Clear any existing interval
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        
        // If value hasn't changed, do nothing
        if (value === targetRef.current && value === displayValue) {
            return;
        }
        
        targetRef.current = value;
        const startValue = displayValue;
        const diff = value - startValue;
        
        // If no difference, just set directly
        if (diff === 0) {
            setDisplayValue(value);
            return;
        }
        
        // Calculate number of steps (aim for ~16ms per step for 60fps feel)
        const steps = Math.max(10, Math.ceil(duration / 16));
        let currentStep = 0;
        
        // Notify animation started
        onAnimating?.(true);
        
        intervalRef.current = setInterval(() => {
            currentStep++;
            
            if (currentStep >= steps) {
                // Final step - set to exact target
                setDisplayValue(value);
                onAnimating?.(false);
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
            } else {
                // Intermediate step
                const progress = currentStep / steps;
                // Ease-out cubic
                const eased = 1 - Math.pow(1 - progress, 3);
                const newValue = Math.round(startValue + diff * eased);
                setDisplayValue(newValue);
            }
        }, duration / steps);
        
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    // Deps intentionally exclude: displayValue (would cause infinite loop),
    // onAnimating and formatFn (stable callbacks from parent)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, duration]);

    return (
        <span className={className}>
            {formatFn(displayValue)}
        </span>
    );
}
