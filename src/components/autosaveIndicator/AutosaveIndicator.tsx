/**
 * AutosaveIndicator Component
 * 
 * Shows a minimal save status in the top-right corner.
 */

import React, { useEffect, useState } from 'react';
import styles from './AutosaveIndicator.module.css';
import { 
    onCloudSyncStateChange, 
    getCloudSyncState, 
    isCloudSyncAvailable,
    SyncStatus 
} from '../../save';

interface AutosaveIndicatorProps {
    isSaving: boolean;
    lastSavedAt: number;
}

export function AutosaveIndicator({ isSaving, lastSavedAt }: AutosaveIndicatorProps): React.ReactElement | null {
    const [visible, setVisible] = useState(false);
    const [showCheckmark, setShowCheckmark] = useState(false);
    const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
    const [showSyncStatus, setShowSyncStatus] = useState(false);
    
    // Subscribe to sync state changes
    useEffect(() => {
        if (!isCloudSyncAvailable()) return;
        
        setSyncStatus(getCloudSyncState().status);
        
        const unsubscribe = onCloudSyncStateChange((state) => {
            setSyncStatus(state.status);
            
            if (state.status === 'syncing' || state.status === 'synced' || state.status === 'offline') {
                setShowSyncStatus(true);
                
                if (state.status !== 'syncing') {
                    const timer = setTimeout(() => {
                        setShowSyncStatus(false);
                    }, 2000);
                    return () => clearTimeout(timer);
                }
            }
        });
        
        return unsubscribe;
    }, []);
    
    useEffect(() => {
        if (isSaving) {
            setVisible(true);
            setShowCheckmark(false);
        } else if (lastSavedAt > 0) {
            setShowCheckmark(true);
            
            const hideTimer = setTimeout(() => {
                setVisible(false);
                setShowCheckmark(false);
            }, 1500);
            
            return () => clearTimeout(hideTimer);
        }
    }, [isSaving, lastSavedAt]);
    
    const showLocalSave = visible || isSaving;
    const showCloud = showSyncStatus && isCloudSyncAvailable();
    
    if (!showLocalSave && !showCloud) {
        return null;
    }
    
    // Determine icon and text
    const getContent = () => {
        if (syncStatus === 'syncing') {
            return { icon: '↻', text: 'syncing', spinning: true };
        }
        if (isSaving && !showCheckmark) {
            return { icon: '↻', text: 'saving', spinning: true };
        }
        if (syncStatus === 'offline' && showCloud) {
            return { icon: '✕', text: 'offline', spinning: false };
        }
        if (showCheckmark || (syncStatus === 'synced' && showCloud)) {
            return { icon: '✓', text: 'saved', spinning: false };
        }
        return { icon: '✓', text: 'saved', spinning: false };
    };
    
    const { icon, text, spinning } = getContent();
    const isOffline = syncStatus === 'offline' && showCloud;
    
    return (
        <p className={`${styles.indicator} ${isOffline ? styles.offline : ''}`}>
            <span className={spinning ? styles.spinning : ''}>{icon}</span> {text}
        </p>
    );
}

export default AutosaveIndicator;
