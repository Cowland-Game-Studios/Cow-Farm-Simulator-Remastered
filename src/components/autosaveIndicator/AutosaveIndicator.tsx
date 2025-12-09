/**
 * AutosaveIndicator Component
 * 
 * Shows a subtle save icon in the top-right corner when autosaving.
 * Fades in/out smoothly with a spinning animation during save.
 */

import React, { useEffect, useState } from 'react';
import styles from './AutosaveIndicator.module.css';

interface AutosaveIndicatorProps {
    isSaving: boolean;
    lastSavedAt: number;
}

export function AutosaveIndicator({ isSaving, lastSavedAt }: AutosaveIndicatorProps): React.ReactElement | null {
    const [visible, setVisible] = useState(false);
    const [showCheckmark, setShowCheckmark] = useState(false);
    
    useEffect(() => {
        if (isSaving) {
            // Show immediately when saving starts
            setVisible(true);
            setShowCheckmark(false);
        } else if (lastSavedAt > 0) {
            // Show checkmark briefly after save completes
            setShowCheckmark(true);
            
            // Hide after delay
            const hideTimer = setTimeout(() => {
                setVisible(false);
                setShowCheckmark(false);
            }, 1500);
            
            return () => clearTimeout(hideTimer);
        }
    }, [isSaving, lastSavedAt]);
    
    if (!visible && !isSaving) {
        return null;
    }
    
    return (
        <div className={`${styles.container} ${visible ? styles.visible : ''}`}>
            <div className={`${styles.icon} ${isSaving ? styles.spinning : ''}`}>
                {showCheckmark ? (
                    // Checkmark icon
                    <svg 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2.5"
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        className={styles.checkmark}
                    >
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                ) : (
                    // Save/floppy disk icon
                    <svg 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2"
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                    >
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                        <polyline points="17 21 17 13 7 13 7 21" />
                        <polyline points="7 3 7 8 15 8" />
                    </svg>
                )}
            </div>
            <span className={styles.text}>
                {isSaving ? 'Saving...' : 'Saved'}
            </span>
        </div>
    );
}

export default AutosaveIndicator;

