/**
 * Moo.sh Command Parser & Handlers
 * 
 * Handles parsing and executing console commands for the developer console.
 */

import { actions } from '../../engine/gameState';
import { GAME_CONFIG } from '../../config/gameConfig';
import { GameState, GameAction, Position } from '../../engine/types';
import { deleteSave } from '../../save';

// Runtime config overrides (allows changing magic numbers without restart)
export const configOverrides: Record<string, unknown> = {};

// ============================================
// PATH UTILITIES
// ============================================

/**
 * Get a value from an object by dot-notation path with array indexing support
 */
export const getByPath = (obj: unknown, path: string): unknown => {
    if (!path) return obj;
    
    // Parse path to handle both dot notation and bracket notation
    // e.g., "cows[0].color.r" -> ["cows", "0", "color", "r"]
    const keys = path
        .replace(/\[(\d+)\]/g, '.$1')  // Convert [0] to .0
        .split('.')
        .filter(key => key !== '');
    
    return keys.reduce((acc: unknown, key: string) => {
        if (acc && typeof acc === 'object') {
            return (acc as Record<string, unknown>)[key];
        }
        return undefined;
    }, obj);
};

/**
 * Set a value in an object by dot-notation path with array indexing support (immutably)
 */
export const setByPath = <T>(obj: T, path: string, value: unknown): T => {
    // Parse path to handle both dot notation and bracket notation
    const keys = path
        .replace(/\[(\d+)\]/g, '.$1')
        .split('.')
        .filter(key => key !== '');
    
    const lastKey = keys.pop();
    if (!lastKey) return obj;
    
    const newObj: unknown = Array.isArray(obj) ? [...obj] : { ...obj };
    let current: Record<string, unknown> = newObj as Record<string, unknown>;
    
    for (const key of keys) {
        // Check if next level is array or object
        const isArrayIndex = !isNaN(parseInt(key, 10));
        if (isArrayIndex) {
            current[key] = Array.isArray(current[key]) ? [...(current[key] as unknown[])] : { ...(current[key] as object) };
        } else {
            current[key] = Array.isArray(current[key]) ? [...(current[key] as unknown[])] : { ...(current[key] as object) };
        }
        current = current[key] as Record<string, unknown>;
    }
    
    current[lastKey] = value;
    return newObj as T;
};

/**
 * Get a config value, checking for runtime overrides first
 */
export const getConfig = (path: string): unknown => {
    if (configOverrides[path] !== undefined) {
        return configOverrides[path];
    }
    return getByPath(GAME_CONFIG, path);
};

// ============================================
// TYPE-SAFE PATH DEFINITIONS
// ============================================

interface PathConstraint {
    type: 'number' | 'enum' | 'boolean';
    min?: number;
    max?: number;
    values?: string[];
}

/**
 * Defines which paths are safe to modify and what type they should be.
 */
const SAFE_PATHS: Record<string, PathConstraint> = {
    // Resources - numeric values
    'resources.coins': { type: 'number', min: 0 },
    
    // Inventory - all items are numeric
    'inventory.milk': { type: 'number', min: 0 },
    'inventory.grass': { type: 'number', min: 0 },
    'inventory.cream': { type: 'number', min: 0 },
    'inventory.butter': { type: 'number', min: 0 },
    'inventory.cheese': { type: 'number', min: 0 },
    'inventory.yogurt': { type: 'number', min: 0 },
    'inventory.iceCream': { type: 'number', min: 0 },
    'inventory.cheesecake': { type: 'number', min: 0 },
    
    // Cow properties (with array index wildcard)
    'cows[*].fullness': { type: 'number', min: 0, max: 1 },
    'cows[*].state': { type: 'enum', values: ['hungry', 'producing', 'full'] },
    'cows[*].color.r': { type: 'number', min: 0, max: 255 },
    'cows[*].color.g': { type: 'number', min: 0, max: 255 },
    'cows[*].color.b': { type: 'number', min: 0, max: 255 },
    'cows[*].color.a': { type: 'number', min: 0, max: 1 },
    'cows[*].position.x': { type: 'number' },
    'cows[*].position.y': { type: 'number' },
};

/**
 * Match a path against safe path patterns
 */
const getPathConstraint = (path: string): PathConstraint | null => {
    // Direct match
    if (SAFE_PATHS[path]) {
        return SAFE_PATHS[path];
    }
    
    // Check wildcard patterns (replace [number] with [*])
    const wildcardPath = path.replace(/\[\d+\]/g, '[*]');
    if (SAFE_PATHS[wildcardPath]) {
        return SAFE_PATHS[wildcardPath];
    }
    
    return null;
};

/**
 * Validate a value against type constraints
 */
const validateValue = (value: unknown, constraint: PathConstraint): { valid: boolean; error?: string } => {
    switch (constraint.type) {
        case 'number':
            if (typeof value !== 'number' || isNaN(value)) {
                return { valid: false, error: 'Value must be a number' };
            }
            if (constraint.min !== undefined && value < constraint.min) {
                return { valid: false, error: `Value must be >= ${constraint.min}` };
            }
            if (constraint.max !== undefined && value > constraint.max) {
                return { valid: false, error: `Value must be <= ${constraint.max}` };
            }
            return { valid: true };
            
        case 'enum':
            if (!constraint.values?.includes(value as string)) {
                return { valid: false, error: `Value must be one of: ${constraint.values?.join(', ')}` };
            }
            return { valid: true };
            
        case 'boolean':
            if (typeof value !== 'boolean') {
                return { valid: false, error: 'Value must be true or false' };
            }
            return { valid: true };
            
        default:
            return { valid: false, error: 'Unknown type constraint' };
    }
};

/**
 * Format a value for display in the console
 */
const formatValue = (value: unknown, indent: number = 0): string => {
    const spaces = '  '.repeat(indent);
    
    if (value === null) return `${spaces}null`;
    if (value === undefined) return `${spaces}undefined`;
    
    if (Array.isArray(value)) {
        if (value.length === 0) return `${spaces}[]`;
        if (value.length > 5) return `${spaces}[Array(${value.length})]`;
        return `${spaces}[${value.length} items]`;
    }
    
    if (typeof value === 'object') {
        const keys = Object.keys(value);
        if (keys.length === 0) return `${spaces}{}`;
        return `${spaces}{${keys.join(', ')}}`;
    }
    
    if (typeof value === 'string') return `${spaces}"${value}"`;
    
    return `${spaces}${value}`;
};

// ============================================
// COMMAND RESULT INTERFACE
// ============================================

interface CommandResult {
    success: boolean;
    output: string | null;
    clear?: boolean;
    closeConsole?: boolean;
    warning?: boolean;
}

type CommandHandler = (args: string[], state: GameState, dispatch: React.Dispatch<GameAction>) => CommandResult;

// ============================================
// COMMAND HANDLERS
// ============================================

const commands: Record<string, CommandHandler> = {
    /**
     * List state keys, object contents, game config, or full state
     */
    ls: (args, state) => {
        const flag = args[0];
        
        const WARNING_BANNER = '\n\n⚠️  WARNING: Modifying game state and config can have\n    unforeseen consequences and may corrupt your save.';
        
        // ls --config: Show game config magic numbers
        if (flag === '--config') {
            const path = args[1];
            const target = path ? getByPath(GAME_CONFIG, path) : GAME_CONFIG;
            
            if (target === undefined) {
                return { success: false, output: `Error: Config path "${path}" not found` };
            }
            
            if (typeof target !== 'object' || target === null) {
                const override = path ? configOverrides[path] : undefined;
                const display = override !== undefined ? `${target} → ${override} (modified)` : target;
                return { success: true, output: `${path || 'GAME_CONFIG'}: ${display}${WARNING_BANNER}`, warning: true };
            }
            
            const lines = [`📊 GAME_CONFIG${path ? '.' + path : ''}`];
            lines.push('━'.repeat(GAME_CONFIG.COWNSOLE.SEPARATOR_LENGTH));
            
            const flattenConfig = (obj: Record<string, unknown>, prefix: string = '') => {
                for (const [key, value] of Object.entries(obj)) {
                    const fullPath = prefix ? `${prefix}.${key}` : key;
                    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                        flattenConfig(value as Record<string, unknown>, fullPath);
                    } else {
                        const override = configOverrides[fullPath];
                        const modified = override !== undefined ? ' ✏️' : '';
                        const displayVal = override !== undefined ? override : value;
                        lines.push(`  ${fullPath}: ${JSON.stringify(displayVal)}${modified}`);
                    }
                }
            };
            
            flattenConfig(target as Record<string, unknown>, path || '');
            lines.push('');
            lines.push('Use: set --config <path> <value>');
            lines.push(WARNING_BANNER);
            
            return { success: true, output: lines.join('\n'), warning: true };
        }
        
        // ls --state: Full state dump
        if (flag === '--state') {
            const path = args[1];
            const target = path ? getByPath(state, path) : state;
            
            if (target === undefined) {
                return { success: false, output: `Error: State path "${path}" not found` };
            }
            
            const lines = [`🎮 Game State${path ? ': ' + path : ''}`];
            lines.push('━'.repeat(GAME_CONFIG.COWNSOLE.SEPARATOR_LENGTH));
            
            try {
                const json = JSON.stringify(target, (key, value) => {
                    // Truncate long arrays
                    if (Array.isArray(value) && value.length > 10) {
                        return `[Array(${value.length})]`;
                    }
                    return value;
                }, 2);
                lines.push(json);
            } catch {
                lines.push('(Unable to serialize state)');
            }
            
            lines.push(WARNING_BANNER);
            
            return { success: true, output: lines.join('\n'), warning: true };
        }
        
        // Default ls behavior
        const path = args[0];
        const target = path ? getByPath(state, path) : state;
        
        if (target === undefined) {
            return { success: false, output: `Error: Path "${path}" not found` };
        }
        
        if (typeof target !== 'object' || target === null) {
            return { success: true, output: `${path || 'state'}: ${formatValue(target)}` };
        }
        
        const lines: string[] = [];
        const prefix = path ? `${path}.` : '';
        
        for (const [key, value] of Object.entries(target)) {
            // Skip functions and internal React stuff
            if (typeof value === 'function') continue;
            
            const displayValue = formatValue(value);
            lines.push(`  ${prefix}${key}: ${displayValue}`);
        }
        
        if (lines.length === 0) {
            return { success: true, output: `${path || 'state'}: (empty)` };
        }
        
        return { success: true, output: lines.join('\n') };
    },

    /**
     * Alias for ls
     */
    dir: (args, state) => commands.ls(args, state, (() => {}) as React.Dispatch<GameAction>),

    /**
     * Get a specific value
     */
    get: (args, state) => {
        const path = args[0];
        
        if (!path) {
            return { success: false, output: 'Usage: get <path>\nExample: get inventory.milk' };
        }
        
        const value = getByPath(state, path);
        
        if (value === undefined) {
            return { success: false, output: `Error: Path "${path}" not found` };
        }
        
        // For objects/arrays, show more detail
        if (typeof value === 'object' && value !== null) {
            if (Array.isArray(value)) {
                const preview = value.slice(0, 3).map((item, i) => 
                    `  [${i}]: ${typeof item === 'object' ? JSON.stringify(item).slice(0, 50) + '...' : item}`
                ).join('\n');
                return { 
                    success: true, 
                    output: `${path}: Array(${value.length})\n${preview}${value.length > 3 ? '\n  ...' : ''}` 
                };
            }
            return { success: true, output: `${path}:\n${JSON.stringify(value, null, 2)}` };
        }
        
        return { success: true, output: `${path}: ${value}` };
    },

    /**
     * Set a value - TYPE-SAFE with primitive type checking
     * Use --force to bypass type checks and set any value
     */
    set: (args, state, dispatch) => {
        const WARNING_BANNER = '\n\n⚠️  WARNING: Modifying game state and config can have\n    unforeseen consequences and may corrupt your save.';
        
        // Handle --config flag for config overrides
        if (args[0] === '--config') {
            const [, configPath, ...valueParts] = args;
            const valueStr = valueParts.join(' ');
            
            if (!configPath || valueStr === '') {
                return { success: false, output: 'Usage: set --config <path> <value>\nExample: set --config COW.MILK_PRODUCTION_TIME_MS 10000' };
            }
            
            // Verify the config path exists
            const currentValue = getByPath(GAME_CONFIG, configPath);
            if (currentValue === undefined) {
                return { success: false, output: `Error: Config path "${configPath}" not found` };
            }
            
            // Only allow setting primitive values
            if (typeof currentValue === 'object' && currentValue !== null) {
                return { success: false, output: `Error: Cannot set object values. Set individual properties.` };
            }
            
            // Parse the value
            let value: unknown;
            if (valueStr === 'true') value = true;
            else if (valueStr === 'false') value = false;
            else if (valueStr === 'reset') {
                // Remove override to reset to default
                delete configOverrides[configPath];
                return { success: true, output: `✓ ${configPath} reset to default: ${currentValue}${WARNING_BANNER}`, warning: true };
            }
            else if (!isNaN(Number(valueStr)) && valueStr !== '') value = Number(valueStr);
            else value = valueStr;
            
            // Store the override
            configOverrides[configPath] = value;
            
            return { success: true, output: `✓ ${configPath}: ${currentValue} → ${value}\n⚠️ Changes apply at runtime but don't persist${WARNING_BANNER}`, warning: true };
        }
        
        // Check for --force flag
        const forceIndex = args.indexOf('--force');
        const isForced = forceIndex !== -1;
        const filteredArgs = isForced ? args.filter((_, i) => i !== forceIndex) : args;
        
        const [path, ...valueParts] = filteredArgs;
        const valueStr = valueParts.join(' ');
        
        if (!path || valueStr === '') {
            return { success: false, output: 'Usage: set <path> <value> [--force]\nExample: set inventory.milk 99\nExample: set stats.cowsBred 100\n\n--force bypasses type checking' };
        }
        
        // Verify the path exists
        const currentValue = getByPath(state, path);
        if (currentValue === undefined) {
            return { success: false, output: `Error: Path "${path}" not found in state` };
        }
        
        // Parse the value (attempt JSON parse for --force, otherwise primitives only)
        let value: unknown;
        if (isForced) {
            // With --force, try to parse as JSON first for complex values
            try {
                value = JSON.parse(valueStr);
            } catch {
                // If not valid JSON, treat as string or primitive
                if (valueStr === 'true') value = true;
                else if (valueStr === 'false') value = false;
                else if (valueStr === 'null') value = null;
                else if (!isNaN(Number(valueStr)) && valueStr !== '') value = Number(valueStr);
                else value = valueStr;
            }
        } else {
            // Normal parsing - primitives only
            if (valueStr === 'true') value = true;
            else if (valueStr === 'false') value = false;
            else if (valueStr === 'null') value = null;
            else if (!isNaN(Number(valueStr)) && valueStr !== '') value = Number(valueStr);
            else value = valueStr;
        }
        
        // Type-safe checks (unless --force is used)
        if (!isForced) {
            // Check that we're not trying to set an object
            if (typeof currentValue === 'object' && currentValue !== null) {
                return { success: false, output: `Error: Cannot set object values. Set individual properties.\nUse --force to override.` };
            }
            
            // Check that the new value is a primitive
            if (typeof value === 'object' && value !== null) {
                return { success: false, output: `Error: Cannot set to object values. Only primitives (string, number, boolean) allowed.\nUse --force to override.` };
            }
            
            // Check that types match (with some flexibility)
            const currentType = typeof currentValue;
            const newType = typeof value;
            
            // Allow null to be set to any type
            if (value !== null && currentValue !== null) {
                // Special case: both are numbers or currentValue is number and value is number
                const isNumericMatch = currentType === 'number' && newType === 'number';
                const isStringMatch = currentType === 'string' && newType === 'string';
                const isBooleanMatch = currentType === 'boolean' && newType === 'boolean';
                
                if (!isNumericMatch && !isStringMatch && !isBooleanMatch) {
                    return { 
                        success: false, 
                        output: `Error: Type mismatch. Expected ${currentType}, got ${newType}.\nCurrent value: ${JSON.stringify(currentValue)}\nUse --force to override.` 
                    };
                }
            }
            
            // Validate against SAFE_PATHS constraints if they exist
            const constraint = getPathConstraint(path);
            if (constraint) {
                const validation = validateValue(value, constraint);
                if (!validation.valid) {
                    return { success: false, output: `Error: ${validation.error}` };
                }
            }
        }
        
        // Handle known paths with proper actions
        const pathParts = path.replace(/\[(\d+)\]/g, '.$1').split('.');
        
        // Inventory items - use setItem action
        if (pathParts[0] === 'inventory' && pathParts.length === 2) {
            const itemType = pathParts[1];
            dispatch(actions.setItem(itemType, value as number));
            return { success: true, output: `✓ ${path} set to ${value}` };
        }
        
        // Resources - use coin actions
        if (path === 'resources.coins') {
            const diff = (value as number) - state.resources.coins;
            if (diff > 0) {
                dispatch(actions.addCoins(diff));
            } else if (diff < 0) {
                dispatch(actions.spendCoins(-diff));
            }
            return { success: true, output: `✓ ${path} set to ${value}` };
        }
        
        // For all other paths, use LOAD_SAVE
        const newState = setByPath(state, path, value);
        dispatch({ type: 'LOAD_SAVE', payload: { saveData: newState } });
        
        const forceNote = isForced ? ' (forced)' : '';
        return { success: true, output: `✓ ${path} set to ${value}${forceNote}` };
    },

    /**
     * Clear the console
     */
    clear: () => {
        return { success: true, output: null, clear: true };
    },

    /**
     * cow halp - Show help
     */
    cow: (args) => {
        const subcommand = args[0];
        
        if (subcommand?.toLowerCase() === 'halp') {
            const helpText = `
🐄 Moo.sh Commands
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ls [path]              List state keys
  ls --state [p]         Full state dump
  ls --config [p]        Show game config
  get <path>             Get value at path
  set <path> <val>       Set value (type-safe)
  set <p> <v> --force    Set value (bypass checks)
  set --config <p> <v>   Override config
  clear                  Clear console output
  cow halp               Show this help
  cowsay [msg]           🐄
  cowable                Reset all cows
  udder chaos            ???

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Examples:
  ls inventory
  ls --config COW
  set --config COW.MILK_PRODUCTION_TIME_MS 5000
  cowsay Hello World!
            `.trim();
            
            return { success: true, output: helpText };
        }
        
        return { success: true, output: '🐄 Moo?' };
    },

    /**
     * Udder Chaos - sends all cows flying! 🐄💨
     */
    udder: (args, state, dispatch) => {
        const subcommand = args[0];
        
        if (subcommand?.toLowerCase() === 'chaos') {
            // Generate random impulses for each cow
            const impulses: Record<string, Position> = {};
            const { IMPULSE_STRENGTH, UPWARD_BIAS } = GAME_CONFIG.CHAOS;
            
            state.cows.forEach(cow => {
                // Random direction
                const angle = Math.random() * Math.PI * 2;
                const speed = IMPULSE_STRENGTH + Math.random() * IMPULSE_STRENGTH;
                
                impulses[cow.id] = {
                    x: Math.cos(angle) * speed,
                    y: Math.sin(angle) * speed - UPWARD_BIAS,
                };
            });
            
            // Dispatch chaos!
            dispatch({
                type: 'TRIGGER_CHAOS',
                payload: { impulses }
            });
            
            // Play moo sound for extra chaos
            const mooSound = new Audio('./sounds/cow/moo.wav');
            mooSound.volume = 0.7;
            mooSound.play().catch(() => {});
            
            return { 
                success: true, 
                output: '🐄💨 UDDER CHAOS UNLEASHED! 🐄💨',
                closeConsole: true
            };
        }
        
        return { success: false, output: 'Unknown udder command. Did you mean: udder chaos?' };
    },

    /**
     * Cowsay - classic Unix easter egg 🐄
     */
    cowsay: (args) => {
        const message = args.length > 0 ? args.join(' ') : 'Moo!';
        const maxLen = Math.min(40, Math.max(message.length, 3));
        const padding = message.length < maxLen ? ' '.repeat(maxLen - message.length) : '';
        const border = '-'.repeat(maxLen + 2);
        
        // Play moo sound if message contains "moo", "mooo", "moooo", etc.
        if (/moo+/i.test(message)) {
            const mooSound = new Audio('./sounds/cow/moo.wav');
            mooSound.volume = 0.5;
            mooSound.play().catch(() => {}); // Ignore autoplay errors
        }
        
        const cow = `
 ${border}
< ${message}${padding} >
 ${border}
        \\   ^__^
         \\  (oo)\\_______
            (__)\\       )\\/\\
                ||----w |
                ||     ||
        `.trim();
        
        return { success: true, output: cow };
    },

    /**
     * cowable - Reset all cows to be ready for milking and breeding
     */
    cowable: (args, state, dispatch) => {
        if (state.cows.length === 0) {
            return { success: false, output: 'No cows to reset!' };
        }
        
        // Reset all cows' timestamps
        const resetCows = state.cows.map(cow => ({
            ...cow,
            lastFedAt: null,
            lastBredAt: 0,
            state: 'full' as const,  // Make them ready to milk
            fullness: 1,
        }));
        
        // Use LOAD_SAVE to update state
        const newState = { ...state, cows: resetCows };
        dispatch({ type: 'LOAD_SAVE', payload: { saveData: newState } });
        
        return { 
            success: true, 
            output: `🐄 Reset ${state.cows.length} cow(s)!\n\n  ✓ All cows ready to milk\n  ✓ All breeding cooldowns cleared`,
        };
    },

    /**
     * cheats - Set everything to 1 billion 💰
     * Hidden command, not shown in help
     */
    cheats: (args, state, dispatch) => {
        const BILLION = 1e9;
        
        // Set all resources
        dispatch(actions.addCoins(BILLION - state.resources.coins));
        
        // Set all inventory items
        dispatch(actions.setItem('milk', BILLION));
        dispatch(actions.setItem('grass', BILLION));
        dispatch(actions.setItem('cream', BILLION));
        dispatch(actions.setItem('butter', BILLION));
        dispatch(actions.setItem('cheese', BILLION));
        dispatch(actions.setItem('yogurt', BILLION));
        dispatch(actions.setItem('iceCream', BILLION));
        dispatch(actions.setItem('cheesecake', BILLION));
        
        return { 
            success: true, 
            output: `💰 CHEATS ACTIVATED 💰\n\n  coins: 1,000,000,000\n  All items: 1,000,000,000\n\n🐄 Moo-ney printer go brrr!`,
            closeConsole: true
        };
    },

    /**
     * mooclear - Nuke your save entirely with confirmation
     * Hidden command, not shown in help
     */
    mooclear: (args) => {
        const hasConfirm = args.includes('--confirm');
        
        if (!hasConfirm) {
            const warning = `
☠️  MOOCLEAR - NUCLEAR OPTION ☠️
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This will PERMANENTLY DELETE your save:
  • All cows will be lost
  • All resources will be reset
  • All stats will be erased
  • All achievements will be gone
  • All progress will be obliterated
  • Console history will be cleared

        🐄💀 There is no undo! 💀🐄

To confirm, type:
  mooclear --confirm

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            `.trim();
            
            return { success: true, output: warning, warning: true };
        }
        
        // User confirmed - nuke it!
        try {
            // Delete main game save
            deleteSave();
            
            // Clear all game-related localStorage keys
            localStorage.removeItem('moosh_history');
            localStorage.removeItem('moosh_output');
            
            // Clear runtime config overrides
            Object.keys(configOverrides).forEach(key => delete configOverrides[key]);
            
            // Play a sad moo before reloading
            const mooSound = new Audio('./sounds/cow/moo.wav');
            mooSound.volume = 0.3;
            mooSound.playbackRate = 0.7; // Sad slow moo
            mooSound.play().catch(() => {});
            
            // Slight delay to let the moo play
            setTimeout(() => {
                window.location.reload();
            }, 500);
            
            return { 
                success: true, 
                output: '💀 Save deleted. Goodbye, cows... 💀\n\nReloading...',
                closeConsole: true
            };
        } catch (error) {
            return { 
                success: false, 
                output: `Error deleting save: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    },
};

// ============================================
// COMMAND EXECUTOR
// ============================================

/**
 * Execute a console command
 */
export function executeCommand(input: string, state: GameState, dispatch: React.Dispatch<GameAction>): CommandResult {
    const trimmed = input.trim();
    
    if (!trimmed) {
        return { success: true, output: '' };
    }
    
    const parts = trimmed.split(/\s+/);
    const commandInput = parts[0];
    const commandLower = commandInput.toLowerCase();
    const args = parts.slice(1);
    
    const handler = commands[commandLower];
    
    if (!handler) {
        return { 
            success: false, 
            output: `Unknown command: "${commandInput}"\nType "cow halp" for available commands.` 
        };
    }
    
    try {
        return handler(args, state, dispatch);
    } catch (error) {
        return { 
            success: false, 
            output: `Error executing "${commandInput}": ${error instanceof Error ? error.message : 'Unknown error'}` 
        };
    }
}

export default executeCommand;

