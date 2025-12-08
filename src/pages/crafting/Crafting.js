/**
 * Crafting - Main crafting menu component
 * 
 * Orchestrates the crafting interface with:
 * - Inventory sidebar (left)
 * - Crafting board (center)
 * - Recipe sidebar (right)
 * - Animations for placing, crafting, and removing ingredients
 */

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import PropTypes from 'prop-types';
import styles from "./crafting.module.css";
import DraggableSwinging from "../../components/draggableSwinging/draggableSwinging";
import ParticleRenderer from "../../components/particles/ParticleRenderer";
import { particleSystem } from "../../engine/particleSystem";
import { useCrafting, useGame } from "../../engine";
import { GAME_CONFIG } from "../../config/gameConfig";

// Import utilities
import {
    countIngredientsOnBoard,
    canCraftWithBoard,
    getProductImage,
    formatTime,
    getRandomBenchPosition,
    getSidebarItemPosition,
    sortRecipes,
    ITEMS,
    RECIPES,
} from './craftingUtils';

// Import components
import {
    PlacedIngredient,
    CraftingOutput,
    RemovingIngredient,
    InventorySidebar,
    RecipeSidebar,
} from './components';

// Import hooks
import { useSwipeToClose } from './hooks';

export default function Crafting({ onClose = () => {} }) {
    // ============================================
    // CONTEXT & STATE
    // ============================================
    
    const { inventory, craftingQueue, canCraft } = useCrafting();
    const { setCraftingDrag, addItem, removeItem, activeBoardCraft, setBoardCraft, clearBoardCraft } = useGame();

    // Selected ingredient being dragged
    const [selectedIngredient, setSelectedIngredient] = useState(null);
    
    // Ingredients placed on the crafting board
    const [ingredientsPlaced, setIngredientsPlaced] = useState([]);
    
    // Crafting animation state
    // Phases: 'idle' -> 'converging' -> 'spinning' -> 'output' -> 'flyout' -> 'idle'
    const [craftingPhase, setCraftingPhase] = useState('idle');
    const [craftingRecipe, setCraftingRecipe] = useState(null);
    const [craftingIngredientIds, setCraftingIngredientIds] = useState([]);
    // eslint-disable-next-line no-unused-vars
    const [outputPosition, setOutputPosition] = useState({ x: 0, y: 0 });
    const [outputTargetPosition, setOutputTargetPosition] = useState(null);
    
    // Timed crafting state
    const [timedCrafting, setTimedCrafting] = useState(null);
    const [timedCraftingRemaining, setTimedCraftingRemaining] = useState(0);
    
    // Removing ingredient animations
    const [removingIngredients, setRemovingIngredients] = useState([]);
    
    // Recipe pulse animation tracking
    const [pulsingRecipes, setPulsingRecipes] = useState(new Set());
    const prevBoardCraftableRef = useRef(new Set());
    
    // Close state
    const [isClosing, setIsClosing] = useState(false);

    // ============================================
    // REFS FOR CLEANUP
    // ============================================
    
    const selectedIngredientRef = useRef(null);
    const ingredientsPlacedRef = useRef([]);
    const craftingIngredientIdsRef = useRef([]);
    const componentMountedRef = useRef(true);
    const timedCraftingCompletedRef = useRef(false);

    // Keep refs in sync with state
    useEffect(() => {
        selectedIngredientRef.current = selectedIngredient;
    }, [selectedIngredient]);
    
    useEffect(() => {
        ingredientsPlacedRef.current = ingredientsPlaced;
    }, [ingredientsPlaced]);
    
    useEffect(() => {
        craftingIngredientIdsRef.current = craftingIngredientIds;
    }, [craftingIngredientIds]);
    
    useEffect(() => {
        componentMountedRef.current = true;
        return () => {
            componentMountedRef.current = false;
        };
    }, []);

    // ============================================
    // SWIPE TO CLOSE HOOK
    // ============================================
    
    const handleClose = useCallback(() => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
        }, GAME_CONFIG.UI.ANIMATION_DURATION_MS);
    }, [onClose]);

    const {
        swipeOffset,
        isSwiping,
        animationComplete,
        handleSwipeStart,
    } = useSwipeToClose({
        onClose: handleClose,
        isClosing,
        disabled: selectedIngredient !== null,
        excludeSelectors: {
            leftSidebar: `.${styles.leftSidebar}`,
            rightSidebar: `.${styles.rightSidebar}`,
        },
    });

    // ============================================
    // CURSOR DRAG STATE SYNC
    // ============================================
    
    useEffect(() => {
        setCraftingDrag(selectedIngredient !== null);
        return () => setCraftingDrag(false);
    }, [selectedIngredient, setCraftingDrag]);

    // ============================================
    // CLEANUP ON UNMOUNT
    // ============================================
    
    useEffect(() => {
        return () => {
            // Return held ingredient
            if (selectedIngredientRef.current) {
                addItem(selectedIngredientRef.current.name, 1);
            }
            
            // Return placed ingredients except those being crafted
            const craftingIds = craftingIngredientIdsRef.current;
            ingredientsPlacedRef.current.forEach((ing, idx) => {
                if (!craftingIds.includes(idx)) {
                    addItem(ing.name, 1);
                }
            });
        };
    }, [addItem]);

    // ============================================
    // RESTORE TIMED CRAFTING STATE
    // ============================================
    
    useEffect(() => {
        if (activeBoardCraft && !timedCrafting) {
            const recipe = RECIPES.find(r => r.id === activeBoardCraft.recipeId);
            if (recipe) {
                setIngredientsPlaced(activeBoardCraft.ingredients || []);
                setTimedCrafting({
                    startedAt: activeBoardCraft.startedAt,
                    duration: activeBoardCraft.duration,
                    recipe,
                    ingredientIds: activeBoardCraft.ingredientIds,
                });
                setCraftingRecipe(recipe);
                setCraftingIngredientIds(activeBoardCraft.ingredientIds);
                setCraftingPhase('spinning');
                
                requestAnimationFrame(() => {
                    const pos = getSidebarItemPosition(recipe.outputs[0].item);
                    setOutputTargetPosition(pos);
                });
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ============================================
    // TIMED CRAFTING TIMER
    // ============================================
    
    useEffect(() => {
        if (!timedCrafting) {
            timedCraftingCompletedRef.current = false;
            return;
        }
        
        const updateTimer = () => {
            const elapsed = Date.now() - timedCrafting.startedAt;
            const remaining = Math.max(0, timedCrafting.duration - elapsed);
            setTimedCraftingRemaining(remaining);
            
            if (remaining <= 0 && !timedCraftingCompletedRef.current) {
                timedCraftingCompletedRef.current = true;
                
                // Commit inventory changes immediately
                setIngredientsPlaced(prev => 
                    prev.filter((_, idx) => !timedCrafting.ingredientIds.includes(idx))
                );
                
                for (const out of timedCrafting.recipe.outputs) {
                    addItem(out.item, out.qty);
                }
                
                clearBoardCraft();
                setTimedCrafting(null);
                setCraftingPhase('output');
                
                // Cosmetic animations
                setTimeout(() => {
                    if (!componentMountedRef.current) return;
                    setCraftingPhase('flyout');
                }, 400);
                
                const recipeForParticle = timedCrafting.recipe;
                setTimeout(() => {
                    if (!componentMountedRef.current) return;
                    const output = recipeForParticle.outputs[0];
                    const pos = getSidebarItemPosition(output.item);
                    particleSystem.spawnCraftingPlaceParticle(
                        pos.x,
                        pos.y - 20,
                        `+${output.qty} ${ITEMS[output.item]?.name || output.item}`
                    );
                    setCraftingPhase('idle');
                    setCraftingRecipe(null);
                    setCraftingIngredientIds([]);
                }, 1000);
            }
        };
        
        updateTimer();
        const interval = setInterval(updateTimer, 100);
        return () => clearInterval(interval);
    }, [timedCrafting, addItem, clearBoardCraft]);

    // ============================================
    // BOARD COUNTS & RECIPE SORTING
    // ============================================
    
    const boardIngredientCounts = useMemo(() => {
        const available = ingredientsPlaced.filter((_, idx) => 
            !craftingIngredientIds.includes(idx)
        );
        return countIngredientsOnBoard(available);
    }, [ingredientsPlaced, craftingIngredientIds]);

    const sortedRecipes = useMemo(() => {
        return sortRecipes(RECIPES, boardIngredientCounts, canCraft);
    }, [boardIngredientCounts, canCraft]);

    // ============================================
    // RECIPE PULSE ANIMATION
    // ============================================
    
    useEffect(() => {
        const currentBoardCraftable = new Set(
            RECIPES.filter(r => canCraftWithBoard(r, boardIngredientCounts)).map(r => r.id)
        );
        
        const newlyEnabled = new Set();
        currentBoardCraftable.forEach(id => {
            if (!prevBoardCraftableRef.current.has(id)) {
                newlyEnabled.add(id);
            }
        });
        
        if (newlyEnabled.size > 0) {
            setPulsingRecipes(newlyEnabled);
            const timeout = setTimeout(() => setPulsingRecipes(new Set()), 400);
            return () => clearTimeout(timeout);
        }
        
        prevBoardCraftableRef.current = currentBoardCraftable;
    }, [boardIngredientCounts]);

    // ============================================
    // SPAWN INGREDIENTS ON BOARD
    // ============================================
    
    const spawnIngredientsOnBoard = useCallback((recipe) => {
        const newIngredients = [];
        
        for (const input of recipe.inputs) {
            for (let i = 0; i < input.qty; i++) {
                if ((inventory[input.item] || 0) <= 0) continue;
                
                const targetPos = getRandomBenchPosition();
                const image = getProductImage(input.item);
                const sourcePos = getSidebarItemPosition(input.item);
                
                removeItem(input.item, 1);
                
                newIngredients.push({
                    name: input.item,
                    image,
                    x: targetPos.x,
                    y: targetPos.y,
                    currentX: sourcePos.x,
                    currentY: sourcePos.y,
                    spawnPhase: 'starting',
                    spawnId: Date.now() + Math.random(),
                });
            }
        }
        
        setIngredientsPlaced(prev => [...prev, ...newIngredients]);
        
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setIngredientsPlaced(prev => 
                    prev.map(ing => {
                        if (ing.spawnPhase === 'starting') {
                            return { ...ing, currentX: ing.x, currentY: ing.y, spawnPhase: 'animating' };
                        }
                        return ing;
                    })
                );
            });
        });
        
        setTimeout(() => {
            setIngredientsPlaced(prev => 
                prev.map(ing => {
                    if (ing.spawnPhase === 'animating') {
                        particleSystem.spawnCraftingPlaceParticle(ing.x, ing.y, `-1 ${ITEMS[ing.name]?.name || ing.name}`);
                        return { ...ing, spawnPhase: 'done', currentX: undefined, currentY: undefined };
                    }
                    return ing;
                })
            );
        }, 500);
    }, [inventory, removeItem]);

    // ============================================
    // HANDLE CRAFT
    // ============================================
    
    const handleCraft = useCallback((recipe) => {
        if (craftingPhase !== 'idle' || timedCrafting) return;
        
        const canCraftFromBoard = canCraftWithBoard(recipe, boardIngredientCounts);
        const canCraftFromInventory = canCraft(recipe);
        
        if (!canCraftFromBoard && !canCraftFromInventory) return;
        
        if (canCraftFromBoard) {
            // Identify ingredients to use
            const usedIndices = [];
            const tempCounts = {};
            
            ingredientsPlaced.forEach((ing, idx) => {
                const needed = recipe.inputs.find(input => input.item === ing.name);
                if (needed) {
                    const usedSoFar = tempCounts[ing.name] || 0;
                    if (usedSoFar < needed.qty) {
                        usedIndices.push(idx);
                        tempCounts[ing.name] = usedSoFar + 1;
                    }
                }
            });
            
            setCraftingRecipe(recipe);
            setCraftingIngredientIds(usedIndices);
            setOutputPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
            setOutputTargetPosition(getSidebarItemPosition(recipe.outputs[0].item));
            setCraftingPhase('converging');
            
            const isTimedRecipe = recipe.time > 0;
            
            // Phase 2: Spinning
            setTimeout(() => {
                setCraftingPhase('spinning');
                
                if (isTimedRecipe) {
                    const craftData = {
                        startedAt: Date.now(),
                        duration: recipe.time * 1000,
                        recipe,
                        ingredientIds: usedIndices,
                    };
                    setTimedCrafting(craftData);
                    setTimedCraftingRemaining(recipe.time * 1000);
                    
                    const craftingIngredients = ingredientsPlaced.filter((_, idx) => 
                        usedIndices.includes(idx)
                    ).map(ing => ({
                        name: ing.name,
                        image: ing.image,
                        x: window.innerWidth / 2,
                        y: window.innerHeight / 2,
                    }));
                    
                    setBoardCraft({
                        startedAt: craftData.startedAt,
                        duration: craftData.duration,
                        recipeId: recipe.id,
                        ingredientIds: usedIndices,
                        ingredients: craftingIngredients,
                    });
                }
            }, 400);
            
            // Instant recipe animation
            if (!isTimedRecipe) {
                for (const output of recipe.outputs) {
                    addItem(output.item, output.qty);
                }
                
                setTimeout(() => {
                    if (!componentMountedRef.current) return;
                    setCraftingPhase('output');
                }, 1200);
                
                setTimeout(() => {
                    if (!componentMountedRef.current) return;
                    setCraftingPhase('flyout');
                }, 1600);
                
                setTimeout(() => {
                    if (!componentMountedRef.current) return;
                    const output = recipe.outputs[0];
                    const pos = getSidebarItemPosition(output.item);
                    particleSystem.spawnCraftingPlaceParticle(
                        pos.x,
                        pos.y - 20,
                        `+${output.qty} ${ITEMS[output.item]?.name || output.item}`
                    );
                    setIngredientsPlaced(prev => prev.filter((_, idx) => !usedIndices.includes(idx)));
                    setCraftingPhase('idle');
                    setCraftingRecipe(null);
                    setCraftingIngredientIds([]);
                }, 2200);
            }
        } else {
            spawnIngredientsOnBoard(recipe);
        }
    }, [canCraft, boardIngredientCounts, ingredientsPlaced, addItem, spawnIngredientsOnBoard, craftingPhase, timedCrafting, setBoardCraft]);

    // ============================================
    // INGREDIENT DROP HANDLER
    // ============================================
    
    const handleIngredientDrop = useCallback(({ x, y }) => {
        const ingredientName = selectedIngredient.name;
        
        removeItem(ingredientName, 1);
        particleSystem.spawnCraftingPlaceParticle(x, y, `-1 ${ITEMS[ingredientName]?.name || ingredientName}`);
        
        setSelectedIngredient(null);
        setIngredientsPlaced(prev => [
            ...prev,
            { name: ingredientName, image: selectedIngredient.image, x, y }
        ]);
    }, [selectedIngredient, removeItem]);

    // ============================================
    // REMOVE PLACED INGREDIENT
    // ============================================
    
    const removePlacedIngredient = useCallback((ingredient) => {
        addItem(ingredient.name, 1);
        
        setIngredientsPlaced(prev =>
            prev.filter(ing => ing.x !== ingredient.x || ing.y !== ingredient.y)
        );
        
        const targetPos = getSidebarItemPosition(ingredient.name);
        const removeId = `remove_${Date.now()}_${Math.random()}`;
        
        setRemovingIngredients(prev => [...prev, {
            id: removeId,
            ingredient,
            startX: ingredient.x,
            startY: ingredient.y,
            targetX: targetPos.x,
            targetY: targetPos.y,
            phase: 'starting',
        }]);
        
        requestAnimationFrame(() => {
            if (!componentMountedRef.current) return;
            setRemovingIngredients(prev => prev.map(r => 
                r.id === removeId ? { ...r, phase: 'flyout' } : r
            ));
        });
        
        setTimeout(() => {
            if (!componentMountedRef.current) return;
            particleSystem.spawnCraftingPlaceParticle(
                targetPos.x,
                targetPos.y - 20,
                `+1 ${ITEMS[ingredient.name]?.name || ingredient.name}`
            );
            setRemovingIngredients(prev => prev.filter(r => r.id !== removeId));
        }, 450);
    }, [addItem]);

    const handlePlacedIngredientClick = useCallback((e, ingredient) => {
        e.stopPropagation();
        removePlacedIngredient(ingredient);
    }, [removePlacedIngredient]);

    const stopPropagation = (e) => e.stopPropagation();

    // ============================================
    // RENDER
    // ============================================
    
    return (
        <div 
            className={`${styles.craftingBlurBackground} ${isClosing ? styles.closing : ''}`}
            onTouchStart={animationComplete && !selectedIngredient ? handleSwipeStart : undefined}
        >
            {/* Currently dragged ingredient */}
            {selectedIngredient && (
                <DraggableSwinging
                    id="ingredient"
                    initialDragging
                    onDrop={handleIngredientDrop}
                    ropeLength={10}
                    throwable={false}
                    canGoOffScreen={true}
                >
                    <img draggable={false} src={selectedIngredient.image} alt={selectedIngredient.name} />
                </DraggableSwinging>
            )}

            {/* Placed ingredients on the crafting area */}
            {ingredientsPlaced.map((ingredient, index) => (
                <PlacedIngredient
                    key={ingredient.spawnId || `${ingredient.name}-${index}`}
                    ingredient={ingredient}
                    isBeingCrafted={craftingIngredientIds.includes(index)}
                    craftingPhase={craftingPhase}
                    timedCrafting={timedCrafting}
                    isClosing={isClosing}
                    onClick={handlePlacedIngredientClick}
                />
            ))}
            
            {/* Timed crafting timer display */}
            {timedCrafting && craftingPhase === 'spinning' && (
                <p className={styles.craftingTimer}>
                    {formatTime(timedCraftingRemaining)}
                </p>
            )}
            
            {/* Crafting output animation */}
            <CraftingOutput
                recipe={craftingRecipe}
                craftingPhase={craftingPhase}
                outputTargetPosition={outputTargetPosition}
            />
            
            {/* Removing ingredient flyout animations */}
            {removingIngredients.map(removing => (
                <RemovingIngredient key={removing.id} removing={removing} />
            ))}

            {/* Particle system renderer */}
            <ParticleRenderer />

            {/* Crafting bench */}
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            <div 
                className={`${styles.benchTop} ${isClosing ? styles.closing : ''} ${animationComplete ? styles.animationDone : ''}`} 
                id="craftingBench"
                onClick={stopPropagation}
                onTouchStart={animationComplete ? handleSwipeStart : undefined}
                style={animationComplete ? {
                    transform: `translate(-50%, -50%) translateY(${swipeOffset}px)`,
                    transition: isSwiping ? 'none' : 'transform 0.3s ease-out',
                } : undefined}
            >
                <img
                    draggable={false}
                    className={styles.craftingInstructions}
                    src="./images/crafting/instruction.svg"
                    alt="Crafting instructions"
                />
            </div>

            {/* Inventory sidebar (left) */}
            <InventorySidebar
                inventory={inventory}
                isClosing={isClosing}
                onSelectIngredient={setSelectedIngredient}
                onStopPropagation={stopPropagation}
            />

            {/* Recipe sidebar (right) */}
            <RecipeSidebar
                sortedRecipes={sortedRecipes}
                boardIngredientCounts={boardIngredientCounts}
                canCraftFromInventory={canCraft}
                pulsingRecipes={pulsingRecipes}
                isClosing={isClosing}
                onCraft={handleCraft}
                onStopPropagation={stopPropagation}
            />

            {/* Crafting queue display */}
            {craftingQueue.length > 0 && (
                <div className={`${styles.craftingQueue} ${isClosing ? styles.closing : ''}`}>
                    <p style={{ color: 'black', margin: '5px 0', fontWeight: 'bold' }}>Crafting:</p>
                    {craftingQueue.map(craft => {
                        const recipe = RECIPES.find(r => r.id === craft.recipeId);
                        const remainingTime = Math.max(0, Math.ceil((craft.completesAt - Date.now()) / 1000));
                        return (
                            <div key={craft.id} style={{ color: 'black', fontSize: 12 }}>
                                {recipe?.name || craft.recipeId}: {remainingTime}s
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Close hint */}
            <p className={`${styles.closeHint} ${isClosing ? styles.closing : ''}`}>
                scroll or swipe down to close
            </p>
        </div>
    );
}

Crafting.propTypes = {
    onClose: PropTypes.func,
};
