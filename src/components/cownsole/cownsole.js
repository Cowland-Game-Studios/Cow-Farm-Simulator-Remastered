/**
 * Moo.sh - Developer Console Component
 * 
 * A CLI-style developer console for inspecting and modifying game state.
 * Activated by pressing "/" key.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import styles from './cownsole.module.css';
import { executeCommand } from './commands';
import { useGame } from '../../engine';

// ============================================
// Moo.sh COMPONENT
// ============================================

export default function Cownsole({ onClose }) {
    const { state, dispatch } = useGame();
    
    // Console state
    const [input, setInput] = useState('');
    const [output, setOutput] = useState([]);
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [isClosing, setIsClosing] = useState(false);
    
    // Refs
    const inputRef = useRef(null);
    const outputRef = useRef(null);
    
    // Auto-focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);
    
    // Auto-scroll to bottom when output changes
    useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [output]);
    
    // Handle close with animation
    const handleClose = useCallback(() => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
        }, 150); // Match animation duration
    }, [onClose]);
    
    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Escape to close
            if (e.key === 'Escape') {
                e.preventDefault();
                handleClose();
            }
            // "/" to close (toggle)
            if (e.key === '/' && e.target !== inputRef.current) {
                e.preventDefault();
                handleClose();
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleClose]);
    
    // Handle command submission
    const handleSubmit = (e) => {
        e.preventDefault();
        
        const trimmedInput = input.trim();
        if (!trimmedInput) return;
        
        // Execute command
        const result = executeCommand(trimmedInput, state, dispatch);
        
        // Handle clear command
        if (result.clear) {
            setOutput([]);
        } else {
            // Add to output
            setOutput(prev => [...prev, {
                command: trimmedInput,
                result: result.output,
                success: result.success,
            }]);
        }
        
        // Handle close console flag (for commands like udder chaos)
        if (result.closeConsole) {
            setTimeout(() => handleClose(), 300);
        }
        
        // Add to history (avoid duplicates)
        if (history[history.length - 1] !== trimmedInput) {
            setHistory(prev => [...prev, trimmedInput]);
        }
        
        // Reset
        setInput('');
        setHistoryIndex(-1);
    };
    
    // Handle history navigation
    const handleKeyDown = (e) => {
        // Arrow up - previous command
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (history.length === 0) return;
            
            const newIndex = historyIndex === -1 
                ? history.length - 1 
                : Math.max(0, historyIndex - 1);
            
            setHistoryIndex(newIndex);
            setInput(history[newIndex] || '');
        }
        
        // Arrow down - next command
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
        
        // Tab - auto-complete (basic)
        if (e.key === 'Tab') {
            e.preventDefault();
            const commands = ['ls', 'dir', 'get', 'set', 'add', 'clear', 'help', 'cowsay'];
            const match = commands.find(cmd => cmd.startsWith(input.toLowerCase()));
            if (match) {
                setInput(match + ' ');
            }
        }
    };
    
    // Handle click on background to close
    const handleBackgroundClick = (e) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };
    
    return (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div 
            className={`${styles.cownsoleBackground} ${isClosing ? styles.closing : ''}`}
            onClick={handleBackgroundClick}
        >
            <div className={`${styles.terminal} ${isClosing ? styles.closing : ''}`}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerTitle}>
                        <span className={styles.headerIcon}>🐄</span>
                        <span>Moo.sh</span>
                    </div>
                    <button 
                        type="button"
                        className={styles.closeButton}
                        onClick={handleClose}
                    >
                        ESC
                    </button>
                </div>
                
                {/* Output area */}
                <div className={styles.outputArea} ref={outputRef}>
                    {/* Welcome message */}
                    <div className={styles.welcomeMessage}>
                        Welcome to Moo.sh v1.0 🐄<br />
                        Type <span style={{ color: '#2d5a27' }}>help</span> for available commands.
                    </div>
                    
                    {/* Command output */}
                    {output.map((entry, index) => (
                        <div key={index} className={styles.outputEntry}>
                            <div className={styles.commandLine}>
                                <span className={styles.prompt}>Moo.sh /&gt;</span>
                                <span>{entry.command}</span>
                            </div>
                            {entry.result && (
                                <pre className={`${styles.outputResult} ${entry.success ? styles.success : styles.error}`}>
                                    {entry.result}
                                </pre>
                            )}
                        </div>
                    ))}
                </div>
                
                {/* Input area */}
                <form className={styles.inputArea} onSubmit={handleSubmit}>
                    <span className={styles.prompt}>Moo.sh /&gt;</span>
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
        </div>
    );
}

Cownsole.propTypes = {
    /** Callback when console is closed */
    onClose: PropTypes.func.isRequired,
};
