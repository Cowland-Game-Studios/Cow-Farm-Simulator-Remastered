/**
 * Crafting Utility Functions and Constants
 * Pure functions with no side effects or hooks
 */

import { GAME_CONFIG } from '../../config/gameConfig';

const { ITEMS, RECIPES } = GAME_CONFIG;

// ============================================
// CONSTANTS
// ============================================

export const SWIPE_THRESHOLD = 100; // pixels to swipe up before closing
export const SWIPE_RESISTANCE = 0.5; // resistance when swiping down (opposite direction)

// Build product list from config items (filter to show useful items in crafting)
export const PRODUCTS = Object.entries(ITEMS)
    .filter(([key]) => ['milk', 'cream', 'butter', 'cheese', 'yogurt', 'iceCream', 'cheesecake'].includes(key))
    .map(([key, item]) => ({
        id: key,
        name: item.name,
        image: item.icon,
    }));

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Count ingredients on the crafting board
 * @param {Array} ingredientsPlaced - Array of placed ingredients
 * @returns {Object} Counts by ingredient name
 */
export function countIngredientsOnBoard(ingredientsPlaced) {
    const counts = {};
    for (const ing of ingredientsPlaced) {
        counts[ing.name] = (counts[ing.name] || 0) + 1;
    }
    return counts;
}

/**
 * Check if recipe can be crafted with ingredients on board
 * @param {Object} recipe - Recipe to check
 * @param {Object} boardCounts - Ingredient counts from countIngredientsOnBoard
 * @returns {boolean}
 */
export function canCraftWithBoard(recipe, boardCounts) {
    return recipe.inputs.every(input => 
        (boardCounts[input.item] || 0) >= input.qty
    );
}

/**
 * Get product image by item key
 * @param {string} itemKey - Item identifier
 * @returns {string} Image path
 */
export function getProductImage(itemKey) {
    const item = ITEMS[itemKey];
    return item?.icon || "";
}

/**
 * Format milliseconds to display string
 * @param {number} ms - Milliseconds
 * @returns {string} Formatted time string
 */
export function formatTime(ms) {
    const totalSeconds = Math.ceil(ms / 1000);
    if (totalSeconds >= 60) {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
    }
    return `${totalSeconds}s`;
}

/**
 * Get random position within crafting bench bounds
 * @returns {{ x: number, y: number }}
 */
export function getRandomBenchPosition() {
    // Bench is centered at 50%, 50% with size min(70vh, 50vw)
    const benchSize = Math.min(window.innerHeight * 0.7, window.innerWidth * 0.5);
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const padding = 60; // Stay away from edges
    const halfSize = (benchSize / 2) - padding;
    
    return {
        x: centerX + (Math.random() - 0.5) * 2 * halfSize,
        y: centerY + (Math.random() - 0.5) * 2 * halfSize,
    };
}

/**
 * Find sidebar element position by item id
 * @param {string} itemId - Item identifier
 * @returns {{ x: number, y: number }}
 */
export function getSidebarItemPosition(itemId) {
    const element = document.querySelector(`[data-item-id="${itemId}"]`);
    if (element) {
        const rect = element.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }
    return { x: 100, y: window.innerHeight / 2 }; // Fallback
}

/**
 * Sort recipes by craftability and time
 * @param {Array} recipes - Array of recipes
 * @param {Object} boardCounts - Board ingredient counts
 * @param {Function} canCraftFromInventory - Function to check inventory craftability
 * @returns {Array} Sorted recipes
 */
export function sortRecipes(recipes, boardCounts, canCraftFromInventory) {
    return [...recipes].sort((a, b) => {
        const aCanBoard = canCraftWithBoard(a, boardCounts);
        const bCanBoard = canCraftWithBoard(b, boardCounts);
        const aCanInv = canCraftFromInventory(a);
        const bCanInv = canCraftFromInventory(b);
        
        // Priority: board craftable > inventory craftable > disabled
        const aPriority = aCanBoard ? 2 : (aCanInv ? 1 : 0);
        const bPriority = bCanBoard ? 2 : (bCanInv ? 1 : 0);
        
        if (aPriority !== bPriority) {
            return bPriority - aPriority; // Higher priority first
        }
        
        // Same priority, sort by time (faster first)
        return a.time - b.time;
    });
}

// Re-export for convenience
export { ITEMS, RECIPES };
