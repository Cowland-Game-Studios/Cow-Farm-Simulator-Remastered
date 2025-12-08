/**
 * Moo.sh Command Parser & Handlers
 * 
 * Handles parsing and executing console commands for the developer console.
 */

import { actions } from '../../engine/gameState';

// ============================================
// PATH UTILITIES
// ============================================

/**
 * Get a value from an object by dot-notation path with array indexing support
 * @param {Object} obj - The object to traverse
 * @param {string} path - Path with dot notation and/or bracket notation (e.g., "inventory.milk", "cows[0].color")
 * @returns {*} The value at the path, or undefined
 */
export const getByPath = (obj, path) => {
    if (!path) return obj;
    
    // Parse path to handle both dot notation and bracket notation
    // e.g., "cows[0].color.r" -> ["cows", "0", "color", "r"]
    const keys = path
        .replace(/\[(\d+)\]/g, '.$1')  // Convert [0] to .0
        .split('.')
        .filter(key => key !== '');
    
    return keys.reduce((acc, key) => acc?.[key], obj);
};

/**
 * Set a value in an object by dot-notation path with array indexing support (immutably)
 * @param {Object} obj - The object to update
 * @param {string} path - Path with dot notation and/or bracket notation
 * @param {*} value - The value to set
 * @returns {Object} New object with the updated value
 */
export const setByPath = (obj, path, value) => {
    // Parse path to handle both dot notation and bracket notation
    const keys = path
        .replace(/\[(\d+)\]/g, '.$1')
        .split('.')
        .filter(key => key !== '');
    
    const lastKey = keys.pop();
    
    const newObj = Array.isArray(obj) ? [...obj] : { ...obj };
    let current = newObj;
    
    for (const key of keys) {
        // Check if next level is array or object
        const isArrayIndex = !isNaN(parseInt(key, 10));
        if (isArrayIndex) {
            current[key] = Array.isArray(current[key]) ? [...current[key]] : { ...current[key] };
        } else {
            current[key] = Array.isArray(current[key]) ? [...current[key]] : { ...current[key] };
        }
        current = current[key];
    }
    
    current[lastKey] = value;
    return newObj;
};

/**
 * Format a value for display in the console
 */
const formatValue = (value, indent = 0) => {
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
// COMMAND HANDLERS
// ============================================

const commands = {
    /**
     * List state keys or object contents
     */
    ls: (args, state) => {
        const path = args[0];
        const target = path ? getByPath(state, path) : state;
        
        if (target === undefined) {
            return { success: false, output: `Error: Path "${path}" not found` };
        }
        
        if (typeof target !== 'object' || target === null) {
            return { success: true, output: `${path || 'state'}: ${formatValue(target)}` };
        }
        
        const lines = [];
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
    dir: (args, state) => commands.ls(args, state),

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
     * Set a value - uses game actions when possible
     */
    set: (args, state, dispatch) => {
        const [path, ...valueParts] = args;
        const valueStr = valueParts.join(' ');
        
        if (!path || valueStr === '') {
            return { success: false, output: 'Usage: set <path> <value>\nExample: set inventory.milk 99' };
        }
        
        // Parse the value
        let value;
        if (valueStr === 'true') value = true;
        else if (valueStr === 'false') value = false;
        else if (valueStr === 'null') value = null;
        else if (!isNaN(valueStr) && valueStr !== '') value = Number(valueStr);
        else value = valueStr;
        
        // Handle known paths with proper actions
        const pathParts = path.split('.');
        
        // Inventory items
        if (pathParts[0] === 'inventory' && pathParts.length === 2) {
            const itemType = pathParts[1];
            if (typeof value !== 'number') {
                return { success: false, output: `Error: Inventory values must be numbers` };
            }
            dispatch(actions.setItem(itemType, value));
            return { success: true, output: `✓ ${path} set to ${value}` };
        }
        
        // Resources
        if (path === 'resources.coins') {
            if (typeof value !== 'number') {
                return { success: false, output: `Error: Coins must be a number` };
            }
            const diff = value - state.resources.coins;
            if (diff > 0) {
                dispatch(actions.addCoins(diff));
            } else if (diff < 0) {
                dispatch(actions.spendCoins(-diff));
            }
            return { success: true, output: `✓ ${path} set to ${value}` };
        }
        
        // For other paths, use the generic LOAD_SAVE (acts as a state override)
        // This is a bit hacky but works for dev console purposes
        const newState = setByPath(state, path, value);
        dispatch({ type: 'LOAD_SAVE', payload: { saveData: newState } });
        
        return { success: true, output: `✓ ${path} set to ${value}` };
    },

    /**
     * Add to a numeric value
     */
    add: (args, state, dispatch) => {
        const [path, amountStr] = args;
        const amount = Number(amountStr);
        
        if (!path || isNaN(amount)) {
            return { success: false, output: 'Usage: add <path> <amount>\nExample: add resources.coins 1000' };
        }
        
        const currentValue = getByPath(state, path);
        
        if (typeof currentValue !== 'number') {
            return { success: false, output: `Error: ${path} is not a number (${typeof currentValue})` };
        }
        
        // Use set command to handle the actual update
        return commands.set([path, String(currentValue + amount)], state, dispatch);
    },

    /**
     * Clear the console
     */
    clear: () => {
        return { success: true, output: null, clear: true };
    },

    /**
     * Show help
     */
    help: () => {
        const helpText = `
🐄 Moo.sh Commands
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ls [path]         List state keys or object contents
  get <path>        Get value at path
  set <path> <val>  Set value at path
  add <path> <num>  Add to numeric value
  clear             Clear console output
  help              Show this help
  cowsay [msg]      🐄
  udder chaos       ???

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Examples:
  ls inventory
  get resources.coins
  set inventory.milk 99
  add resources.coins 5000
  cowsay Hello World!
        `.trim();
        
        return { success: true, output: helpText };
    },

    /**
     * Secret "cow" command - handles subcommands like "cow halp"
     */
    cow: (args) => {
        const subcommand = args[0]?.toLowerCase();
        
        if (subcommand === 'halp') {
            return commands.help();
        }
        
        // Default: just moo
        return { success: true, output: '🐄 Moo?' };
    },

    /**
     * Udder Chaos - sends all cows flying! 🐄💨
     */
    udder: (args, state, dispatch) => {
        const subcommand = args[0]?.toLowerCase();
        
        if (subcommand === 'chaos') {
            // Generate random impulses for each cow
            const impulses = {};
            const chaosStrength = 30; // Velocity magnitude
            
            state.cows.forEach(cow => {
                // Random direction
                const angle = Math.random() * Math.PI * 2;
                const speed = chaosStrength + Math.random() * chaosStrength;
                
                impulses[cow.id] = {
                    x: Math.cos(angle) * speed,
                    y: Math.sin(angle) * speed - 15, // Slight upward bias
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
                closeConsole: true  // Signal to close the console
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
};

// ============================================
// COMMAND EXECUTOR
// ============================================

/**
 * Execute a console command
 * @param {string} input - The raw command input
 * @param {Object} state - Current game state
 * @param {Function} dispatch - Redux-style dispatch function
 * @returns {{ success: boolean, output: string, clear?: boolean }}
 */
export function executeCommand(input, state, dispatch) {
    const trimmed = input.trim();
    
    if (!trimmed) {
        return { success: true, output: '' };
    }
    
    const parts = trimmed.split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);
    
    const handler = commands[command];
    
    if (!handler) {
        return { 
            success: false, 
            output: `Unknown command: "${command}"\nType "help" for available commands.` 
        };
    }
    
    try {
        return handler(args, state, dispatch);
    } catch (error) {
        return { 
            success: false, 
            output: `Error executing "${command}": ${error.message}` 
        };
    }
}

export default executeCommand;
