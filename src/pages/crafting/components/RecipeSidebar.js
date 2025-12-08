/**
 * RecipeSidebar - Right sidebar showing available recipes
 * Allows clicking to craft recipes
 */

import PropTypes from 'prop-types';
import styles from '../crafting.module.css';
import CraftingItem from './CraftingItem';
import { canCraftWithBoard } from '../craftingUtils';

export default function RecipeSidebar({
    sortedRecipes,
    boardIngredientCounts,
    canCraftFromInventory,
    pulsingRecipes,
    isClosing,
    onCraft,
    onStopPropagation,
}) {
    return (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div 
            className={`${styles.standardedizedList} ${styles.rightSidebar} ${isClosing ? styles.closing : ''}`}
            onClick={onStopPropagation}
        >
            <div className={styles.list}>
                {sortedRecipes.map((recipe) => {
                    const canCraftFromBoard = canCraftWithBoard(recipe, boardIngredientCounts);
                    const canCraftInv = canCraftFromInventory(recipe);
                    const isEnabled = canCraftFromBoard || canCraftInv;
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

RecipeSidebar.propTypes = {
    sortedRecipes: PropTypes.array.isRequired,
    boardIngredientCounts: PropTypes.object.isRequired,
    canCraftFromInventory: PropTypes.func.isRequired,
    pulsingRecipes: PropTypes.instanceOf(Set).isRequired,
    isClosing: PropTypes.bool.isRequired,
    onCraft: PropTypes.func.isRequired,
    onStopPropagation: PropTypes.func.isRequired,
};
