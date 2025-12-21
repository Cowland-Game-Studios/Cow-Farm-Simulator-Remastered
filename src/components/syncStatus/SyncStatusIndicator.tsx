/**
 * SyncStatusIndicator Component
 * 
 * Displays the current cloud sync status with visual feedback.
 * Shows different states: syncing, synced, offline, error, retrying.
 */

import React from 'react';
import { useSyncStatus, getSyncStatusMessage, isSupabaseConfigured } from '../../save';
import styles from './SyncStatusIndicator.module.css';

interface SyncStatusIndicatorProps {
    /** Show full text description (default: false, shows icon only) */
    showText?: boolean;
    /** Additional CSS class */
    className?: string;
}

export function SyncStatusIndicator({ 
    showText = false, 
    className = '' 
}: SyncStatusIndicatorProps): React.ReactElement | null {
    const syncState = useSyncStatus();
    
    // Don't render if Supabase isn't configured
    if (!isSupabaseConfigured()) {
        return null;
    }

    const statusMessage = getSyncStatusMessage(syncState);
    const statusClass = styles[syncState.status] || '';

    return (
        <div 
            className={`${styles.container} ${statusClass} ${className}`}
            title={statusMessage}
            role="status"
            aria-live="polite"
        >
            <span className={styles.icon}>
                {getStatusIcon(syncState.status)}
            </span>
            {showText && (
                <span className={styles.text}>{statusMessage}</span>
            )}
        </div>
    );
}

function getStatusIcon(status: string): string {
    switch (status) {
        case 'syncing':
        case 'retrying':
            return '↻'; // Rotating arrows
        case 'synced':
            return '☁️'; // Cloud
        case 'offline':
            return '📴'; // Offline
        case 'error':
            return '⚠️'; // Warning
        case 'idle':
        default:
            return '○'; // Empty circle
    }
}

export default SyncStatusIndicator;

