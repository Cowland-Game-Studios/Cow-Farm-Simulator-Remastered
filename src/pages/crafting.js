import { useState, useRef, useCallback, useEffect } from "react";
import PropTypes from 'prop-types';
import Button from "../components/button/button";
import styles from "./crafting.module.css";
import DraggableSwinging from "../components/draggableSwinging/draggableSwinging";
import ParticleRenderer from "../components/particles/ParticleRenderer";
import { particleSystem } from "../engine/particleSystem";
import { useCrafting, useGame } from "../engine";
import { GAME_CONFIG } from "../config/gameConfig";

// Swipe-to-close configuration
const SWIPE_THRESHOLD = 100; // pixels to swipe up before closing
const SWIPE_RESISTANCE = 0.5; // resistance when swiping down (opposite direction)

// Use config for timing constants, items, and recipes
const { UI, ITEMS, RECIPES } = GAME_CONFIG;

// Build product list from config items (filter to show useful items in crafting)
const PRODUCTS = Object.entries(ITEMS)
    .filter(([key]) => ['milk', 'cream', 'butter', 'cheese', 'yogurt', 'iceCream', 'cheesecake'].includes(key))
    .map(([key, item]) => ({
        id: key,
        name: item.name,
        image: item.icon,
    }));

// Helper to get product image by item key
const getProductImage = (itemKey) => {
    const item = ITEMS[itemKey];
    return item?.icon || "";
};

function CraftingItem({ recipe = null, canCraft = false, onCraft = () => {} }) {
    // Use recipe data if provided, otherwise show placeholder
    const displayRecipe = recipe || RECIPES[0];
    const input = displayRecipe.inputs[0];
    const output = displayRecipe.outputs[0];
    const timeSeconds = displayRecipe.time;
    const isInstant = timeSeconds === 0;
    const timeDisplay = isInstant ? 'Instant' : timeSeconds < 60 ? `${timeSeconds}s` : `${Math.floor(timeSeconds / 60)} min`;

    return (
        <button 
            type="button"
            onClick={() => canCraft && onCraft(recipe)}
            style={{ 
                textAlign: "center", 
                opacity: canCraft ? 1 : 0.35,
                cursor: canCraft ? 'pointer' : 'not-allowed',
                background: 'none',
                border: 'none',
                padding: '5px',
                transition: 'transform 0.1s ease',
            }}
            disabled={!canCraft}
        >
            <div style={{ display: "flex", flexDirection: "row", gap: 7, justifyContent: "center", alignItems: "center" }}>
                <img style={{ width: 10 }} src="./images/crafting/time.svg" alt="Time icon" />
                <p style={{ color: "black", marginTop: 5, fontSize: 12 }}>{timeDisplay}</p>
            </div>
            <div style={{ display: "flex", flexDirection: "row", gap: 7, justifyContent: "center", alignItems: "center" }}>
                <div>
                    <img src={getProductImage(input.item)} alt={input.item} style={{ width: 40, height: 40 }} />
                    <p style={{ color: "black", marginTop: 0 }}>{input.qty}x</p>
                </div>
                <p style={{ color: "black", fontSize: 20, marginTop: -20 }}>=</p>
                <div>
                    <img src={getProductImage(output.item)} alt={output.item} style={{ width: 40, height: 40 }} />
                    <p style={{ color: "black", marginTop: 0 }}>{output.qty}x</p>
                </div>
            </div>
        </button>
    );
}

CraftingItem.propTypes = {
    recipe: PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        time: PropTypes.number,
        inputs: PropTypes.arrayOf(PropTypes.shape({
            item: PropTypes.string,
            qty: PropTypes.number,
        })),
        outputs: PropTypes.arrayOf(PropTypes.shape({
            item: PropTypes.string,
            qty: PropTypes.number,
        })),
    }),
    canCraft: PropTypes.bool,
    onCraft: PropTypes.func,
};


export default function Crafting({ onClose = () => {} }) {
    // Get inventory and crafting functions from game context
    const { inventory, craftingQueue, craftInstant, startCrafting, canCraft } = useCrafting();
    const { setCraftingDrag } = useGame();

    const [selectedIngredient, setSelectedIngredient] = useState(null);
    
    // Track dragging state for blob cursor
    useEffect(() => {
        setCraftingDrag(selectedIngredient !== null);
        // Clear on unmount
        return () => setCraftingDrag(false);
    }, [selectedIngredient, setCraftingDrag]);
    const [ingredientsPlaced, setIngredientsPlaced] = useState([]);
    const [isClosing, setIsClosing] = useState(false);
    const clickTimeoutRef = useRef(null);
    const lastTapTimeRef = useRef({}); // Track last tap time per ingredient for double-tap detection

    // Swipe-to-close state
    const [swipeOffset, setSwipeOffset] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const [animationComplete, setAnimationComplete] = useState(false);
    const swipeStartRef = useRef(null);

    // Handle crafting a recipe
    const handleCraft = useCallback((recipe) => {
        if (!canCraft(recipe)) return;
        
        if (recipe.time === 0) {
            // Instant crafting
            craftInstant(recipe.id);
            // Spawn success particle
            particleSystem.spawnCraftingPlaceParticle(
                window.innerWidth / 2, 
                window.innerHeight / 2, 
                `+1 ${ITEMS[recipe.outputs[0].item]?.name || recipe.outputs[0].item}`
            );
        } else {
            // Timed crafting
            startCrafting(recipe.id);
            // Spawn queue particle
            particleSystem.spawnCraftingPlaceParticle(
                window.innerWidth / 2, 
                window.innerHeight / 2, 
                `Crafting ${recipe.name || recipe.id}...`
            );
        }
    }, [canCraft, craftInstant, startCrafting]);

    // Mark animation as complete after entrance animation finishes
    useEffect(() => {
        const timer = setTimeout(() => {
            setAnimationComplete(true);
        }, 600); // Match benchSlideIn animation duration
        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
        }, GAME_CONFIG.UI.ANIMATION_DURATION_MS);
    };

    // Swipe handlers for the bench
    const handleSwipeStart = useCallback((e) => {
        // Get the Y position from touch or mouse
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        swipeStartRef.current = clientY;
        setIsSwiping(true);
    }, []);

    const handleSwipeMove = useCallback((e) => {
        if (!isSwiping || swipeStartRef.current === null) return;
        
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        let delta = clientY - swipeStartRef.current; // Positive when swiping DOWN
        
        // Apply resistance when swiping up (negative delta - opposite direction)
        if (delta < 0) {
            delta *= SWIPE_RESISTANCE;
        }
        
        setSwipeOffset(delta);
    }, [isSwiping]);

    const handleSwipeEnd = useCallback(() => {
        if (!isSwiping) return;
        
        setIsSwiping(false);
        swipeStartRef.current = null;
        
        // If swiped DOWN past threshold, close the menu
        if (swipeOffset >= SWIPE_THRESHOLD) {
            handleClose();
        }
        
        // Reset offset (will animate back via CSS transition)
        setSwipeOffset(0);
    }, [isSwiping, swipeOffset]);

    // Add global mouse/touch move and end listeners when swiping
    useEffect(() => {
        if (isSwiping) {
            const handleGlobalMove = (e) => handleSwipeMove(e);
            const handleGlobalEnd = () => handleSwipeEnd();

            window.addEventListener('mousemove', handleGlobalMove);
            window.addEventListener('mouseup', handleGlobalEnd);
            window.addEventListener('touchmove', handleGlobalMove);
            window.addEventListener('touchend', handleGlobalEnd);

            return () => {
                window.removeEventListener('mousemove', handleGlobalMove);
                window.removeEventListener('mouseup', handleGlobalEnd);
                window.removeEventListener('touchmove', handleGlobalMove);
                window.removeEventListener('touchend', handleGlobalEnd);
            };
        }
    }, [isSwiping, handleSwipeMove, handleSwipeEnd]);

    // Scroll down to close
    useEffect(() => {
        if (isClosing) return; // Don't handle scroll if already closing
        
        const handleWheel = (e) => {
            // deltaY > 0 means scrolling down
            if (e.deltaY > 0) {
                handleClose();
            }
        };

        window.addEventListener('wheel', handleWheel, { passive: true });
        return () => window.removeEventListener('wheel', handleWheel);
    }, [isClosing]);

    const handleIngredientDrop = ({ x, y }) => {
        const ingredientName = selectedIngredient.name;
        
        // Spawn "-1" particle using the particle system
        particleSystem.spawnCraftingPlaceParticle(x, y, ingredientName);
        
        setSelectedIngredient(null);
        setIngredientsPlaced([
            ...ingredientsPlaced,
            { name: ingredientName, image: selectedIngredient.image, x, y }
        ]);
    };

    // Unified handler for picking up a placed ingredient (single tap/click)
    const pickupPlacedIngredient = useCallback((ingredient) => {
        setIngredientsPlaced(prev => 
            prev.filter(ing => ing.x !== ingredient.x || ing.y !== ingredient.y)
        );
        setSelectedIngredient({ name: ingredient.name, image: ingredient.image });
    }, []);

    // Unified handler for removing a placed ingredient (double tap/click)
    const removePlacedIngredient = useCallback((ingredient) => {
        setIngredientsPlaced(prev =>
            prev.filter(ing => ing.x !== ingredient.x || ing.y !== ingredient.y)
        );
    }, []);

    // Handle pointer down (mouse or touch) on placed ingredient
    const handlePlacedIngredientPointerDown = useCallback((e, ingredient) => {
        e.stopPropagation();
        
        const ingredientKey = `${ingredient.x}-${ingredient.y}`;
        const now = Date.now();
        const lastTap = lastTapTimeRef.current[ingredientKey] || 0;
        
        // Check for double-tap/double-click
        if (now - lastTap < UI.DOUBLE_TAP_DELAY_MS) {
            // Double tap detected - clear pending single tap action and remove ingredient
            if (clickTimeoutRef.current) {
                clearTimeout(clickTimeoutRef.current);
                clickTimeoutRef.current = null;
            }
            lastTapTimeRef.current[ingredientKey] = 0; // Reset
            removePlacedIngredient(ingredient);
            return;
        }
        
        // Record this tap time
        lastTapTimeRef.current[ingredientKey] = now;
        
        // Clear any pending action
        if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
        }
        
        // Delay single-tap action to allow double-tap detection
        clickTimeoutRef.current = setTimeout(() => {
            pickupPlacedIngredient(ingredient);
            clickTimeoutRef.current = null;
        }, UI.DOUBLE_CLICK_DELAY_MS);
    }, [pickupPlacedIngredient, removePlacedIngredient]);

    // Stop propagation to prevent closing when interacting with UI elements
    const stopPropagation = (e) => e.stopPropagation();

    return (
        <div 
            className={`${styles.craftingBlurBackground} ${isClosing ? styles.closing : ''}`}
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
                <button
                    key={`${ingredient.name}-${index}`}
                    type="button"
                    style={{
                        position: "absolute",
                        left: ingredient.x,
                        top: ingredient.y,
                        transform: "translate(-50%, -50%)",
                        zIndex: 2,
                        background: "none",
                        border: "none",
                        padding: 0,
                        cursor: "grab",
                        userSelect: "none",
                        WebkitUserSelect: "none",
                        touchAction: "none" // Prevent browser touch handling
                    }}
                    onClick={stopPropagation}
                    onMouseDown={(e) => handlePlacedIngredientPointerDown(e, ingredient)}
                    onTouchStart={(e) => handlePlacedIngredientPointerDown(e, ingredient)}
                >
                    <img draggable={false} src={ingredient.image} alt={ingredient.name} />
                </button>
            ))}

            {/* Particle system renderer for "-1" indicators */}
            <ParticleRenderer />

            {/* Crafting bench - full center area */}
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            <div 
                className={`${styles.benchTop} ${isClosing ? styles.closing : ''} ${animationComplete ? styles.animationDone : ''}`} 
                id="craftingBench"
                onClick={stopPropagation}
                onMouseDown={animationComplete ? handleSwipeStart : undefined}
                onTouchStart={animationComplete ? handleSwipeStart : undefined}
                style={animationComplete ? {
                    transform: `translate(-50%, -50%) translateY(${swipeOffset}px)`,
                    transition: isSwiping ? 'none' : 'transform 0.3s ease-out',
                    cursor: isSwiping ? 'grabbing' : 'grab'
                } : undefined}
            >
                <img
                    draggable={false}
                    className={styles.craftingInstructions}
                    src="./images/crafting/instruction.svg"
                    alt="Crafting instructions"
                />
            </div>

            {/* Product/Inventory panel - left side */}
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            <div 
                className={`${styles.standardedizedList} ${styles.leftSidebar} ${isClosing ? styles.closing : ''}`}
                onClick={stopPropagation}
            >
                <div className={styles.list}>
                    {PRODUCTS.map(product => {
                        const itemCount = inventory[product.id] || 0;
                        const hasItem = itemCount > 0;
                        return (
                            <div 
                                key={product.id}
                                className={styles.ingredientItem}
                                data-cursor-target="true"
                                style={{
                                    opacity: hasItem ? 1 : 0.35,
                                    transition: 'opacity 0.2s ease',
                                    cursor: hasItem ? 'pointer' : 'not-allowed',
                                }}
                            >
                                <Button
                                    text={`x${itemCount}`}
                                    image={product.image}
                                    disabled={!hasItem}
                                    onMouseDown={(e) => {
                                        e.stopPropagation();
                                        if (hasItem) {
                                            setSelectedIngredient({ name: product.id, image: product.image });
                                        }
                                    }}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Recipe list - right side */}
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            <div 
                className={`${styles.standardedizedList} ${styles.rightSidebar} ${isClosing ? styles.closing : ''}`}
                onClick={stopPropagation}
            >
                <div className={styles.list}>
                    {RECIPES.map((recipe, index) => (
                        <div 
                            key={recipe.id}
                            className={`${styles.recipeItem} ${styles[`recipeItem${index + 1}`] || ''} ${isClosing ? `${styles.recipeItemClosing} ${styles[`recipeItemClosing${index + 1}`] || ''}` : ''}`}
                        >
                            <CraftingItem
                                recipe={recipe}
                                canCraft={canCraft(recipe)}
                                onCraft={handleCraft}
                            />
                        </div>
                    ))}
                </div>
            </div>

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
    /** Callback when crafting menu is closed */
    onClose: PropTypes.func,
};
