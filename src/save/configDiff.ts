/**
 * Config Diff Utilities
 * 
 * Handles detecting and applying config overrides.
 * Only saves values that differ from defaults.
 */

import { GAME_CONFIG, GameConfigType } from '../config/gameConfig';
import { ConfigOverrides } from './saveTypes';

// ============================================
// FROZEN DEFAULTS
// ============================================

/**
 * Deep freeze an object recursively
 */
function deepFreeze<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    
    Object.keys(obj as object).forEach(key => {
        const value = (obj as Record<string, unknown>)[key];
        if (typeof value === 'object' && value !== null) {
            deepFreeze(value);
        }
    });
    
    return Object.freeze(obj);
}

/**
 * Deep clone an object using structuredClone (faster, preserves more types)
 */
function deepClone<T>(obj: T): T {
    return structuredClone(obj);
}

/**
 * Frozen copy of the original GAME_CONFIG defaults
 * Used for comparison to detect user changes
 */
export const FROZEN_DEFAULTS: Readonly<GameConfigType> = deepFreeze(deepClone(GAME_CONFIG));

// ============================================
// PATH UTILITIES
// ============================================

/**
 * Extract all numeric values from a config object with dot-notation paths
 * e.g., { COW: { MILK_TIME: 30000 } } => { "COW.MILK_TIME": 30000 }
 */
export function extractNumericPaths(
    obj: unknown,
    prefix: string = ''
): Record<string, number> {
    const result: Record<string, number> = {};
    
    if (obj === null || typeof obj !== 'object') {
        return result;
    }
    
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
        const path = prefix ? `${prefix}.${key}` : key;
        
        if (typeof value === 'number') {
            result[path] = value;
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            // Recurse into nested objects (but not arrays)
            Object.assign(result, extractNumericPaths(value, path));
        }
    }
    
    return result;
}

/**
 * Get a value from a nested object using dot-notation path
 */
export function getByPath(obj: unknown, path: string): unknown {
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
        if (current === null || typeof current !== 'object') {
            return undefined;
        }
        current = (current as Record<string, unknown>)[part];
    }
    
    return current;
}

/**
 * Set a value in a nested object using dot-notation path
 * Creates intermediate objects if needed
 */
export function setByPath(obj: Record<string, unknown>, path: string, value: unknown): void {
    const parts = path.split('.');
    let current = obj;
    
    for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!(part in current) || typeof current[part] !== 'object') {
            current[part] = {};
        }
        current = current[part] as Record<string, unknown>;
    }
    
    current[parts[parts.length - 1]] = value;
}

// ============================================
// DIFF OPERATIONS
// ============================================

/**
 * Compare current config against defaults and return only changed numeric values
 */
export function getConfigOverrides(currentConfig: GameConfigType): ConfigOverrides {
    const currentValues = extractNumericPaths(currentConfig);
    const defaultValues = extractNumericPaths(FROZEN_DEFAULTS);
    const overrides: ConfigOverrides = {};
    
    for (const [path, currentValue] of Object.entries(currentValues)) {
        const defaultValue = defaultValues[path];
        
        // Only save if different from default
        if (defaultValue !== undefined && currentValue !== defaultValue) {
            overrides[path] = currentValue;
        }
    }
    
    return overrides;
}

/**
 * Apply saved overrides onto current defaults
 * Returns a new config object with overrides applied
 */
export function applyConfigOverrides(overrides: ConfigOverrides): GameConfigType {
    // Start with a fresh clone of the current defaults
    const result = deepClone(GAME_CONFIG);
    
    // Apply each override
    for (const [path, value] of Object.entries(overrides)) {
        setByPath(result as unknown as Record<string, unknown>, path, value);
    }
    
    return result;
}

/**
 * Validate that overrides contain only valid paths
 * Returns array of invalid paths (empty if all valid)
 */
export function validateOverrides(overrides: ConfigOverrides): string[] {
    const validPaths = extractNumericPaths(FROZEN_DEFAULTS);
    const invalidPaths: string[] = [];
    
    for (const path of Object.keys(overrides)) {
        if (!(path in validPaths)) {
            invalidPaths.push(path);
        }
    }
    
    return invalidPaths;
}

/**
 * Get the default value for a config path
 */
export function getDefaultValue(path: string): number | undefined {
    const value = getByPath(FROZEN_DEFAULTS, path);
    return typeof value === 'number' ? value : undefined;
}

