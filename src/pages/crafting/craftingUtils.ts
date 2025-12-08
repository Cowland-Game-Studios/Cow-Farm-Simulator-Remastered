/**
 * Crafting Utility Functions and Constants
 * Pure functions with no side effects or hooks
 */

import { GAME_CONFIG } from '../../config/gameConfig';
import { Recipe } from '../../engine/types';

const { ITEMS, RECIPES } = GAME_CONFIG;

// ============================================
// TYPES
// ============================================

export interface Product {
    id: string;
    name: string;
    image: string;
}

export interface IngredientCounts {
    [key: string]: number;
}

// ============================================
// CONSTANTS
// ============================================

export const SWIPE_THRESHOLD = 100; // pixels to swipe up before closing
export const SWIPE_RESISTANCE = 0.5; // resistance when swiping down (opposite direction)

// Build product list from config items (filter to show useful items in crafting)
export const PRODUCTS: Product[] = Object.entries(ITEMS)
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
 */
export function countIngredientsOnBoard(ingredientsPlaced: Array<{ name: string }>): IngredientCounts {
    const counts: IngredientCounts = {};
    for (const ing of ingredientsPlaced) {
        counts[ing.name] = (counts[ing.name] || 0) + 1;
    }
    return counts;
}

/**
 * Check if recipe can be crafted with ingredients on board ONLY
 */
export function canCraftWithBoard(recipe: Recipe, boardCounts: IngredientCounts): boolean {
    return recipe.inputs.every(input => 
        (boardCounts[input.item] || 0) >= input.qty
    );
}

/**
 * Check if recipe can be crafted with board + inventory combined
 */
export function canCraftCombined(
    recipe: Recipe, 
    boardCounts: IngredientCounts, 
    inventory: IngredientCounts
): boolean {
    return recipe.inputs.every(input => {
        const onBoard = boardCounts[input.item] || 0;
        const inInventory = inventory[input.item] || 0;
        return (onBoard + inInventory) >= input.qty;
    });
}

/**
 * Get product image by item key
 */
export function getProductImage(itemKey: string): string {
    const item = ITEMS[itemKey];
    return item?.icon || "";
}

/**
 * Format milliseconds to display string
 */
export function formatTime(ms: number): string {
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
 */
export function getRandomBenchPosition(): { x: number; y: number } {
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
 */
export function getSidebarItemPosition(itemId: string): { x: number; y: number } {
    const element = document.querySelector(`[data-item-id="${itemId}"]`);
    if (element) {
        const rect = element.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }
    return { x: 100, y: window.innerHeight / 2 }; // Fallback
}

/**
 * Sort recipes by craftability and time
 */
export function sortRecipes(
    recipes: Recipe[], 
    boardCounts: IngredientCounts, 
    inventory: IngredientCounts
): Recipe[] {
    return [...recipes].sort((a, b) => {
        const aCanBoard = canCraftWithBoard(a, boardCounts);
        const bCanBoard = canCraftWithBoard(b, boardCounts);
        const aCanCombined = canCraftCombined(a, boardCounts, inventory);
        const bCanCombined = canCraftCombined(b, boardCounts, inventory);
        
        // Priority: board craftable > combined craftable > disabled
        const aPriority = aCanBoard ? 2 : (aCanCombined ? 1 : 0);
        const bPriority = bCanBoard ? 2 : (bCanCombined ? 1 : 0);
        
        if (aPriority !== bPriority) {
            return bPriority - aPriority; // Higher priority first
        }
        
        // Same priority, sort by time (faster first)
        return a.time - b.time;
    });
}

// Re-export for convenience
export { ITEMS, RECIPES };

