/**
 * Moo.sh - Developer Console Component
 * 
 * A macOS-style terminal window for inspecting and modifying game state.
 * Features: traffic light buttons, draggable, resizable, minimizable.
 */

import React, { useState, useRef, useEffect, useCallback, FormEvent, KeyboardEvent } from 'react';
import styles from './cownsole.module.css';
import { executeCommand } from './commands';
import { useGame } from '../../engine';

interface OutputEntry {
    command: string;
    result: string | null;
    success: boolean;
    warning?: boolean;
}

interface CownsoleProps {
    /** Callback when console is closed */
    onClose: () => void;
    /** Callback when console is minimized */
    onMinimize?: () => void;
}

// ============================================
// CONSTANTS
// ============================================

const HISTORY_STORAGE_KEY = 'moosh_history';
const OUTPUT_STORAGE_KEY = 'moosh_output';
const MAX_HISTORY_LENGTH = 100;
const MAX_OUTPUT_LENGTH = 50;

// Load history from localStorage
const loadHistory = (): string[] => {
    try {
        const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
                return parsed.slice(-MAX_HISTORY_LENGTH);
            }
        }
    } catch {
        // Ignore errors
    }
    return [];
};

// Save history to localStorage
const saveHistory = (history: string[]) => {
    try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history.slice(-MAX_HISTORY_LENGTH)));
    } catch {
        // Ignore errors (e.g., localStorage full)
    }
};

// Load output from localStorage
const loadOutput = (): OutputEntry[] => {
    try {
        const saved = localStorage.getItem(OUTPUT_STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
                return parsed.slice(-MAX_OUTPUT_LENGTH);
            }
        }
    } catch {
        // Ignore errors
    }
    return [];
};

// Save output to localStorage
const saveOutput = (output: OutputEntry[]) => {
    try {
        localStorage.setItem(OUTPUT_STORAGE_KEY, JSON.stringify(output.slice(-MAX_OUTPUT_LENGTH)));
    } catch {
        // Ignore errors (e.g., localStorage full)
    }
};

// Clear saved output from localStorage
const clearSavedOutput = () => {
    try {
        localStorage.removeItem(OUTPUT_STORAGE_KEY);
    } catch {
        // Ignore errors
    }
};

// ============================================
// Traffic Light Icons
// ============================================

const CloseIcon = () => (
    <svg viewBox="0 0 12 12">
        <line x1="2.5" y1="2.5" x2="9.5" y2="9.5" />
        <line x1="9.5" y1="2.5" x2="2.5" y2="9.5" />
    </svg>
);

const MinimizeIcon = () => (
    <svg viewBox="0 0 12 12">
        <line x1="2" y1="6" x2="10" y2="6" />
    </svg>
);

const MaximizeIcon = () => (
    <svg viewBox="0 0 12 12">
        <polyline points="2,5 6,2 10,5" fill="none" />
        <polyline points="2,7 6,10 10,7" fill="none" />
    </svg>
);

// ============================================
// Moo.sh COMPONENT
// ============================================

export default function Cownsole({ onClose, onMinimize }: CownsoleProps): React.ReactElement {
    const { state, dispatch } = useGame();
    
    // Console state
    const [input, setInput] = useState('');
    const [output, setOutput] = useState<OutputEntry[]>(loadOutput);
    const [history, setHistory] = useState<string[]>(loadHistory);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [isClosing, setIsClosing] = useState(false);
    const [isMinimizing, setIsMinimizing] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    
    // Drag state
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
    
    // Resize state
    const [isResizing, setIsResizing] = useState(false);
    const [resizeDirection, setResizeDirection] = useState<string | null>(null);
    const [size, setSize] = useState({ width: 420, height: 320 });
    const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0, posX: 0, posY: 0 });
    
    // Refs
    const inputRef = useRef<HTMLInputElement>(null);
    const outputRef = useRef<HTMLDivElement>(null);
    const terminalRef = useRef<HTMLDivElement>(null);
    
    // Auto-focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);
    
    // Save history to localStorage when it changes
    useEffect(() => {
        saveHistory(history);
    }, [history]);
    
    // Auto-scroll to bottom when output changes
    useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [output]);
    
    // Handle close with animation (clears saved output)
    const handleClose = useCallback(() => {
        clearSavedOutput();
        setIsClosing(true);
        setTimeout(() => {
            onClose();
        }, 150);
    }, [onClose]);
    
    // Handle minimize with animation (preserves output for next boot)
    const handleMinimize = useCallback(() => {
        saveOutput(output);
        setIsMinimizing(true);
        setTimeout(() => {
            onMinimize?.();
            onClose();
        }, 300);
    }, [onMinimize, onClose, output]);
    
    // Handle maximize toggle
    const handleMaximize = useCallback(() => {
        setIsMaximized(prev => !prev);
        if (!isMaximized) {
            setPosition(null); // Reset position when maximizing
        }
    }, [isMaximized]);
    
    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: globalThis.KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                // If maximized, restore to original size first
                if (isMaximized) {
                    setIsMaximized(false);
                } else {
                    handleClose();
                }
            }
            if (e.key === '/' && e.target !== inputRef.current) {
                e.preventDefault();
                handleClose();
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleClose, isMaximized]);
    
    // Drag handling
    const handleDragStart = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (isMaximized) return;
        const target = e.target as HTMLElement;
        if (target.closest('button')) return;
        
        setIsDragging(true);
        const rect = terminalRef.current?.getBoundingClientRect();
        if (rect) {
            setDragOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            });
        }
    }, [isMaximized]);
    
    useEffect(() => {
        if (!isDragging) return;
        
        const handleMouseMove = (e: MouseEvent) => {
            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;
            setPosition({ x: newX, y: newY });
        };
        
        const handleMouseUp = () => {
            setIsDragging(false);
        };
        
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset]);
    
    // Resize handling
    const handleResizeStart = useCallback((e: React.MouseEvent, direction: string) => {
        if (isMaximized) return;
        e.preventDefault();
        e.stopPropagation();
        
        setIsResizing(true);
        setResizeDirection(direction);
        
        const rect = terminalRef.current?.getBoundingClientRect();
        if (rect) {
            resizeStartRef.current = {
                x: e.clientX,
                y: e.clientY,
                width: rect.width,
                height: rect.height,
                posX: position?.x ?? rect.left,
                posY: position?.y ?? rect.top
            };
        }
    }, [isMaximized, position]);
    
    useEffect(() => {
        if (!isResizing || !resizeDirection) return;
        
        const handleMouseMove = (e: MouseEvent) => {
            const deltaX = e.clientX - resizeStartRef.current.x;
            const deltaY = e.clientY - resizeStartRef.current.y;
            const start = resizeStartRef.current;
            
            let newWidth = start.width;
            let newHeight = start.height;
            let newX = start.posX;
            let newY = start.posY;
            
            if (resizeDirection.includes('e')) {
                newWidth = Math.max(320, start.width + deltaX);
            }
            if (resizeDirection.includes('w')) {
                const widthDelta = Math.min(deltaX, start.width - 320);
                newWidth = start.width - widthDelta;
                newX = start.posX + widthDelta;
            }
            if (resizeDirection.includes('s')) {
                newHeight = Math.max(200, start.height + deltaY);
            }
            if (resizeDirection.includes('n')) {
                const heightDelta = Math.min(deltaY, start.height - 200);
                newHeight = start.height - heightDelta;
                newY = start.posY + heightDelta;
            }
            
            setSize({ width: newWidth, height: newHeight });
            if (resizeDirection.includes('w') || resizeDirection.includes('n')) {
                setPosition({ x: newX, y: newY });
            }
        };
        
        const handleMouseUp = () => {
            setIsResizing(false);
            setResizeDirection(null);
        };
        
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, resizeDirection]);
    
    // Handle command submission
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        
        const trimmedInput = input.trim();
        if (!trimmedInput) return;
        
        const result = executeCommand(trimmedInput, state, dispatch);
        
        if (result.clear) {
            setOutput([]);
        } else {
            setOutput(prev => [...prev, {
                command: trimmedInput,
                result: result.output,
                success: result.success,
                warning: result.warning,
            }]);
        }
        
        if (result.closeConsole) {
            setTimeout(() => handleClose(), 300);
        }
        
        if (history[history.length - 1] !== trimmedInput) {
            setHistory(prev => [...prev, trimmedInput]);
        }
        
        setInput('');
        setHistoryIndex(-1);
    };
    
    // Handle history navigation
    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (history.length === 0) return;
            
            const newIndex = historyIndex === -1 
                ? history.length - 1 
                : Math.max(0, historyIndex - 1);
            
            setHistoryIndex(newIndex);
            setInput(history[newIndex] || '');
        }
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex === -1) return;
            
            const newIndex = historyIndex + 1;
            
            if (newIndex >= history.length) {
                setHistoryIndex(-1);
                setInput('');
            } else {
                setHistoryIndex(newIndex);
                setInput(history[newIndex] || '');
            }
        }
        
        if (e.key === 'Tab') {
            e.preventDefault();
            const commands = ['ls', 'dir', 'get', 'set', 'clear', 'cow', 'cowsay', 'udder'];
            const match = commands.find(cmd => cmd.startsWith(input.toLowerCase()));
            if (match) {
                setInput(match + ' ');
            }
        }
    };
    
    // Calculate terminal style
    const terminalStyle: React.CSSProperties = position ? {
        left: position.x,
        top: position.y,
        right: 'auto',
        bottom: 'auto',
        width: isMaximized ? undefined : size.width,
        height: isMaximized ? undefined : size.height,
    } : {
        width: isMaximized ? undefined : size.width,
        height: isMaximized ? undefined : size.height,
    };
    
    const terminalClasses = [
        styles.terminal,
        isClosing && styles.closing,
        isMinimizing && styles.minimizing,
        isMaximized && styles.maximized,
        isDragging && styles.dragging,
        isResizing && styles.resizing,
    ].filter(Boolean).join(' ');
    
    return (
        <div 
            ref={terminalRef}
            className={terminalClasses}
            style={terminalStyle}
        >
            {/* Resize handles */}
            {!isMaximized && (
                <>
                    <div className={`${styles.resizeHandle} ${styles.resizeN}`} onMouseDown={(e) => handleResizeStart(e, 'n')} />
                    <div className={`${styles.resizeHandle} ${styles.resizeS}`} onMouseDown={(e) => handleResizeStart(e, 's')} />
                    <div className={`${styles.resizeHandle} ${styles.resizeE}`} onMouseDown={(e) => handleResizeStart(e, 'e')} />
                    <div className={`${styles.resizeHandle} ${styles.resizeW}`} onMouseDown={(e) => handleResizeStart(e, 'w')} />
                    <div className={`${styles.resizeHandle} ${styles.resizeNE}`} onMouseDown={(e) => handleResizeStart(e, 'ne')} />
                    <div className={`${styles.resizeHandle} ${styles.resizeNW}`} onMouseDown={(e) => handleResizeStart(e, 'nw')} />
                    <div className={`${styles.resizeHandle} ${styles.resizeSE}`} onMouseDown={(e) => handleResizeStart(e, 'se')} />
                    <div className={`${styles.resizeHandle} ${styles.resizeSW}`} onMouseDown={(e) => handleResizeStart(e, 'sw')} />
                </>
            )}
            
            {/* Header with traffic lights */}
            <div 
                className={styles.header}
                onMouseDown={handleDragStart}
            >
                <div className={styles.trafficLights}>
                    <button 
                        type="button"
                        className={`${styles.trafficButton} ${styles.closeBtn}`}
                        onClick={handleClose}
                        title="Close"
                    >
                        <CloseIcon />
                    </button>
                    <button 
                        type="button"
                        className={`${styles.trafficButton} ${styles.minimizeBtn}`}
                        onClick={handleMinimize}
                        title="Minimize"
                    >
                        <MinimizeIcon />
                    </button>
                    <button 
                        type="button"
                        className={`${styles.trafficButton} ${styles.maximizeBtn}`}
                        onClick={handleMaximize}
                        title={isMaximized ? "Restore" : "Maximize"}
                    >
                        <MaximizeIcon />
                    </button>
                </div>
                <div className={styles.headerTitle}>
                    <span className={styles.headerIcon}>🐄</span>
                    <span>Moo.sh</span>
                </div>
            </div>
            
            {/* Output area */}
            <div className={styles.outputArea} ref={outputRef}>
                <div className={styles.welcomeMessage}>
                    Welcome to Moo.sh v1.0.1 🐄<br />
                    Type <span style={{ color: '#1a1a1a', fontWeight: 600 }}>cow halp</span> for available commands.
                </div>
                
                {output.map((entry, index) => (
                    <div key={index} className={styles.outputEntry}>
                        <div className={styles.commandLine}>
                            <span className={styles.prompt}>moo.sh $</span>
                            <span>{entry.command}</span>
                        </div>
                        {entry.result && (
                            <pre className={`${styles.outputResult} ${entry.warning ? styles.warning : entry.success ? styles.success : styles.error}`}>
                                {entry.result}
                            </pre>
                        )}
                    </div>
                ))}
            </div>
            
            {/* Input area */}
            <form className={styles.inputArea} onSubmit={handleSubmit}>
                <span className={styles.prompt}>moo.sh $</span>
                <input
                    ref={inputRef}
                    type="text"
                    className={styles.inputField}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a command..."
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                />
            </form>
            
            {/* Hint */}
            <div className={styles.hint}>
                <kbd>↑</kbd> <kbd>↓</kbd> history • <kbd>Tab</kbd> autocomplete • <kbd>Esc</kbd> close
            </div>
        </div>
    );
}
