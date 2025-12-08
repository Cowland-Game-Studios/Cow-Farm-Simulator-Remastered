import { useState, useRef, useCallback, useEffect } from "react";
import PropTypes from 'prop-types';
import Button from "../components/button/button";
import styles from "./crafting.module.css";
import DraggableSwinging from "../components/draggableSwinging/draggableSwinging";
import ParticleRenderer from "../components/particles/ParticleRenderer";
import { particleSystem } from "../engine/particleSystem";
import { GAME_CONFIG } from "../config/gameConfig";

// Swipe-to-close configuration
const SWIPE_THRESHOLD = 100; // pixels to swipe up before closing
const SWIPE_RESISTANCE = 0.5; // resistance when swiping down (opposite direction)

// Product definitions
const PRODUCTS = [
    { name: "milk", image: "./images/crafting/products/milk.svg" },
    { name: "cream", image: "./images/crafting/products/cream.svg" },
    { name: "butter", image: "./images/crafting/products/butter.svg" },
    { name: "cheesecake", image: "./images/crafting/products/cheesecake.svg" },
    { name: "yogurt", image: "./images/crafting/products/yogurt.svg" },
    { name: "ice cream", image: "./images/crafting/products/ice cream.svg" },
];

// Use config for timing constants
const { UI } = GAME_CONFIG;

// Crafting recipes - time is in seconds
const CRAFTING_RECIPES = [
    {
        id: "milk-to-cream",
        time: 60,
        inputs: [{ name: "milk", amount: 2 }],
        outputs: [{ name: "cream", amount: 1 }]
    },
    {
        id: "milk-to-butter",
        time: 60,
        inputs: [{ name: "milk", amount: 2 }],
        outputs: [{ name: "butter", amount: 1 }]
    },
    {
        id: "milk-to-yogurt",
        time: 60,
        inputs: [{ name: "milk", amount: 2 }],
        outputs: [{ name: "yogurt", amount: 1 }]
    },
];

// Helper to get product image by name
const getProductImage = (name) => {
    const product = PRODUCTS.find(p => p.name === name);
    return product?.image || "";
};

function CraftingItem({ recipe = null, enabled = false }) {
    // Use recipe data if provided, otherwise show placeholder
    const displayRecipe = recipe || CRAFTING_RECIPES[0];
    const input = displayRecipe.inputs[0];
    const output = displayRecipe.outputs[0];
    const timeMinutes = Math.floor(displayRecipe.time / 60);

    return (
        <div style={{ textAlign: "center", opacity: enabled ? 1 : 0.25 }}>
            <div style={{ display: "flex", flexDirection: "row", gap: 7, justifyContent: "center", alignItems: "center" }}>
                <img style={{ width: 10 }} src="./images/crafting/time.svg" alt="Time icon" />
                <p style={{ color: "black", marginTop: 5 }}>{timeMinutes || 1} min</p>
            </div>
            <div style={{ display: "flex", flexDirection: "row", gap: 7, justifyContent: "center", alignItems: "center" }}>
                <div>
                    <img src={getProductImage(input.name)} alt={input.name} />
                    <p style={{ color: "black", marginTop: 0 }}>{input.amount}x</p>
                </div>
                <p style={{ color: "black", fontSize: 20, marginTop: -20 }}>=</p>
                <div>
                    <img src={getProductImage(output.name)} alt={output.name} />
                    <p style={{ color: "black", marginTop: 0 }}>{output.amount}x</p>
                </div>
            </div>
        </div>
    );
}

CraftingItem.propTypes = {
    recipe: PropTypes.shape({
        id: PropTypes.string,
        time: PropTypes.number,
        inputs: PropTypes.arrayOf(PropTypes.shape({
            name: PropTypes.string,
            amount: PropTypes.number,
        })),
        outputs: PropTypes.arrayOf(PropTypes.shape({
            name: PropTypes.string,
            amount: PropTypes.number,
        })),
    }),
    enabled: PropTypes.bool,
};


export default function Crafting({ onClose = () => {} }) {
    const [selectedIngredient, setSelectedIngredient] = useState(null);
    const [ingredientsPlaced, setIngredientsPlaced] = useState([]);
    const [isClosing, setIsClosing] = useState(false);
    const clickTimeoutRef = useRef(null);
    const lastTapTimeRef = useRef({}); // Track last tap time per ingredient for double-tap detection

    // Swipe-to-close state
    const [swipeOffset, setSwipeOffset] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const [animationComplete, setAnimationComplete] = useState(false);
    const swipeStartRef = useRef(null);

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

            {/* Product selection panel - left side */}
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            <div 
                className={`${styles.standardedizedList} ${styles.leftSidebar} ${isClosing ? styles.closing : ''}`}
                onClick={stopPropagation}
            >
                <div className={styles.list}>
                    {PRODUCTS.map(product => (
                        <Button
                            key={product.name}
                            text="x100"
                            image={product.image}
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                setSelectedIngredient({ name: product.name, image: product.image });
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Recipe list - right side */}
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            <div 
                className={`${styles.standardedizedList} ${styles.rightSidebar} ${isClosing ? styles.closing : ''}`}
                onClick={stopPropagation}
            >
                <div className={styles.list}>
                    {CRAFTING_RECIPES.map((recipe, index) => (
                        <div 
                            key={recipe.id}
                            className={`${styles.recipeItem} ${styles[`recipeItem${index + 1}`] || ''} ${isClosing ? `${styles.recipeItemClosing} ${styles[`recipeItemClosing${index + 1}`] || ''}` : ''}`}
                        >
                            <CraftingItem
                                recipe={recipe}
                                enabled={index === 0}
                            />
                        </div>
                    ))}
                </div>
            </div>

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
