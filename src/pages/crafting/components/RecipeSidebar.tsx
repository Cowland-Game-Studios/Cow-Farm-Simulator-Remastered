/**
 * RecipeSidebar - Right sidebar showing available recipes
 * Allows clicking to craft recipes
 */

import React, { MouseEvent } from 'react';
import styles from '../crafting.module.css';
import CraftingItem from './CraftingItem';
import { canCraftWithBoard, canCraftCombined, IngredientCounts } from '../craftingUtils';
import { Recipe, Inventory } from '../../../engine/types';

interface RecipeSidebarProps {
    sortedRecipes: Recipe[];
    boardIngredientCounts: IngredientCounts;
    inventory: Inventory;
    pulsingRecipes: Set<string>;
    isClosing: boolean;
    onCraft: (recipe: Recipe) => void;
    onStopPropagation: (e: MouseEvent) => void;
}

export default function RecipeSidebar({
    sortedRecipes,
    boardIngredientCounts,
    inventory,
    pulsingRecipes,
    isClosing,
    onCraft,
    onStopPropagation,
}: RecipeSidebarProps): React.ReactElement {
    return (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div 
            className={`${styles.standardedizedList} ${styles.rightSidebar} ${isClosing ? styles.closing : ''}`}
            onClick={onStopPropagation}
        >
            <div className={styles.list}>
                {sortedRecipes.map((recipe) => {
                    const canCraftFromBoard = canCraftWithBoard(recipe, boardIngredientCounts);
                    // Check if craftable with board + inventory combined
                    const isEnabled = canCraftCombined(recipe, boardIngredientCounts, inventory);
                    const isPulsing = pulsingRecipes.has(recipe.id);
                    
                    return (
                        <div 
                            key={recipe.id}
                            className={`${styles.recipeItem} ${styles.recipeItemAnimated} ${isPulsing ? styles.recipeEnabled : ''} ${isClosing ? styles.recipeItemClosing : ''}`}
                        >
                            <CraftingItem
                                recipe={recipe}
                                canCraft={isEnabled}
                                onCraft={onCraft}
                                highlight={canCraftFromBoard}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

