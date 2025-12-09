/**
 * IconDock - Bottom Right Navigation Icons
 * 
 * Contains:
 * - Cow icon (link to jasonxu.me)
 * - GitHub icon (link to repo)
 * - Terminal icon (triggers Moo.sh)
 */

import React from 'react';
import styles from './iconDock.module.css';

// ============================================
// Icons
// ============================================

const WebIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
);

const GitHubIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
);

const TerminalIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="4 17 10 11 4 5" />
        <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
);

// ============================================
// IconDock Component
// ============================================

interface IconDockProps {
    /** Callback when terminal icon is clicked */
    onTerminalClick: () => void;
    /** Whether the terminal is currently open */
    terminalOpen?: boolean;
}

export default function IconDock({ onTerminalClick, terminalOpen = false }: IconDockProps): React.ReactElement {
    return (
        <div className={styles.iconDock}>
            <div className={styles.iconRow}>
                {/* Web icon - Link to jasonxu.me */}
                <a 
                    href="https://jasonxu.me" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={styles.iconLink}
                    title="jasonxu.me"
                >
                    <button type="button" className={styles.iconButton}>
                        <WebIcon />
                    </button>
                </a>
                
                {/* GitHub icon - Link to repo */}
                <a 
                    href="https://github.com/Cowland-Game-Studios/Cow-Farm-Simulator-Remastered" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={styles.iconLink}
                    title="GitHub"
                >
                    <button type="button" className={styles.iconButton}>
                        <GitHubIcon />
                    </button>
                </a>
                
                {/* Terminal icon - Triggers Moo.sh */}
                <button 
                    type="button" 
                    className={`${styles.iconButton} ${terminalOpen ? styles.active : ''}`}
                    onClick={onTerminalClick}
                    title="Moo.sh Terminal"
                >
                    <TerminalIcon />
                </button>
            </div>
        </div>
    );
}


