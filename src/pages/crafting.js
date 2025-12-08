import { useState, useRef, useCallback, useEffect, useMemo } from "react";
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

// Helper to count ingredients on the board
function countIngredientsOnBoard(ingredientsPlaced) {
    const counts = {};
    for (const ing of ingredientsPlaced) {
        counts[ing.name] = (counts[ing.name] || 0) + 1;
    }
    return counts;
}

// Check if recipe can be crafted with ingredients on board
function canCraftWithBoard(recipe, boardCounts) {
    return recipe.inputs.every(input => 
        (boardCounts[input.item] || 0) >= input.qty
    );
}

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

function CraftingItem({ recipe = null, canCraft = false, onCraft = () => {}, highlight = false }) {
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
                background: highlight ? 'rgba(0, 0, 0, 0.05)' : 'none',
                border: 'none',
                borderRadius: '12px',
                padding: '5px',
                transition: 'all 0.3s ease',
            }}
            aria-disabled={!canCraft}
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
    highlight: PropTypes.bool,
};


export default function Crafting({ onClose = () => {} }) {
    // Get inventory and crafting functions from game context
    const { inventory, craftingQueue, canCraft } = useCrafting();
    const { setCraftingDrag, addItem, removeItem } = useGame();

    const [selectedIngredient, setSelectedIngredient] = useState(null);
    
    // Track dragging state for blob cursor
    useEffect(() => {
        setCraftingDrag(selectedIngredient !== null);
        // Clear on unmount
        return () => setCraftingDrag(false);
    }, [selectedIngredient, setCraftingDrag]);
    const [ingredientsPlaced, setIngredientsPlaced] = useState([]);
    
    // Crafting animation state
    // Phases: 'idle' -> 'converging' -> 'spinning' -> 'output' -> 'flyout' -> 'idle'
    const [craftingPhase, setCraftingPhase] = useState('idle');
    const [craftingRecipe, setCraftingRecipe] = useState(null);
    const [craftingIngredientIds, setCraftingIngredientIds] = useState([]); // IDs of ingredients being crafted
    const [outputPosition, setOutputPosition] = useState({ x: 0, y: 0 });
    const [outputTargetPosition, setOutputTargetPosition] = useState(null);
    
    // Refs to track current state for cleanup
    const selectedIngredientRef = useRef(null);
    const ingredientsPlacedRef = useRef([]);
    
    // Keep refs in sync
    useEffect(() => {
        selectedIngredientRef.current = selectedIngredient;
    }, [selectedIngredient]);
    
    useEffect(() => {
        ingredientsPlacedRef.current = ingredientsPlaced;
    }, [ingredientsPlaced]);
    
    // Return all board items to inventory when menu closes
    useEffect(() => {
        return () => {
            // Return held ingredient
            if (selectedIngredientRef.current) {
                addItem(selectedIngredientRef.current.name, 1);
            }
            // Return all placed ingredients
            for (const ing of ingredientsPlacedRef.current) {
                addItem(ing.name, 1);
            }
        };
    }, [addItem]);
    
    // Count ingredients on the crafting board
    const boardIngredientCounts = useMemo(() => 
        countIngredientsOnBoard(ingredientsPlaced),
        [ingredientsPlaced]
    );
    
    // Track which recipes were previously craftable from board (for animation)
    const prevBoardCraftableRef = useRef(new Set());
    
    // Sort recipes: enabled ones first (board > inventory), then by time (faster first)
    const sortedRecipes = useMemo(() => {
        return [...RECIPES].sort((a, b) => {
            const aCanBoard = canCraftWithBoard(a, boardIngredientCounts);
            const bCanBoard = canCraftWithBoard(b, boardIngredientCounts);
            const aCanInv = canCraft(a);
            const bCanInv = canCraft(b);
            
            // Priority: board craftable > inventory craftable > disabled
            const aPriority = aCanBoard ? 2 : (aCanInv ? 1 : 0);
            const bPriority = bCanBoard ? 2 : (bCanInv ? 1 : 0);
            
            if (aPriority !== bPriority) {
                return bPriority - aPriority; // Higher priority first
            }
            
            // Same priority, sort by time (faster first)
            return a.time - b.time;
        });
    }, [boardIngredientCounts, canCraft]);
    
    // Track newly enabled recipes for pulse animation
    const [pulsingRecipes, setPulsingRecipes] = useState(new Set());
    
    useEffect(() => {
        const currentBoardCraftable = new Set(
            RECIPES.filter(r => canCraftWithBoard(r, boardIngredientCounts)).map(r => r.id)
        );
        
        // Find newly enabled recipes
        const newlyEnabled = new Set();
        currentBoardCraftable.forEach(id => {
            if (!prevBoardCraftableRef.current.has(id)) {
                newlyEnabled.add(id);
            }
        });
        
        if (newlyEnabled.size > 0) {
            setPulsingRecipes(newlyEnabled);
            // Remove pulse class after animation
            const timeout = setTimeout(() => {
                setPulsingRecipes(new Set());
            }, 400);
            return () => clearTimeout(timeout);
        }
        
        prevBoardCraftableRef.current = currentBoardCraftable;
    }, [boardIngredientCounts]);
    const [isClosing, setIsClosing] = useState(false);
    const clickTimeoutRef = useRef(null);
    const lastTapTimeRef = useRef({}); // Track last tap time per ingredient for double-tap detection

    // Swipe-to-close state
    const [swipeOffset, setSwipeOffset] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const [animationComplete, setAnimationComplete] = useState(false);
    const swipeStartRef = useRef(null);

    // Get random position within crafting bench bounds
    const getRandomBenchPosition = useCallback(() => {
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
    }, []);

    // Spawn ingredients from inventory onto the crafting board
    const spawnIngredientsOnBoard = useCallback((recipe) => {
        const newIngredients = [];
        
        for (const input of recipe.inputs) {
            for (let i = 0; i < input.qty; i++) {
                // Check if we have enough in inventory
                if ((inventory[input.item] || 0) <= 0) continue;
                
                const pos = getRandomBenchPosition();
                const image = getProductImage(input.item);
                
                // Deduct from inventory
                removeItem(input.item, 1);
                
                // Add to board
                newIngredients.push({
                    name: input.item,
                    image,
                    x: pos.x,
                    y: pos.y,
                });
                
                // Spawn particle
                particleSystem.spawnCraftingPlaceParticle(pos.x, pos.y, `-1 ${ITEMS[input.item]?.name || input.item}`);
            }
        }
        
        setIngredientsPlaced(prev => [...prev, ...newIngredients]);
    }, [inventory, removeItem, getRandomBenchPosition]);

    // Handle crafting a recipe
    const handleCraft = useCallback((recipe) => {
        // Don't allow crafting during animation
        if (craftingPhase !== 'idle') return;
        
        const canCraftFromBoard = canCraftWithBoard(recipe, boardIngredientCounts);
        const canCraftFromInventory = canCraft(recipe);
        
        if (!canCraftFromBoard && !canCraftFromInventory) return;
        
        // If ingredients are on the board, start crafting animation
        if (canCraftFromBoard) {
            // Identify which ingredients will be used
            const usedIngredientIndices = [];
            const tempCounts = {};
            
            ingredientsPlaced.forEach((ing, idx) => {
                const needed = recipe.inputs.find(input => input.item === ing.name);
                if (needed) {
                    const usedSoFar = tempCounts[ing.name] || 0;
                    if (usedSoFar < needed.qty) {
                        usedIngredientIndices.push(idx);
                        tempCounts[ing.name] = usedSoFar + 1;
                    }
                }
            });
            
            // Store the recipe and which ingredients are being crafted
            setCraftingRecipe(recipe);
            setCraftingIngredientIds(usedIngredientIndices);
            setOutputPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
            
            // Find target position (left sidebar item position)
            const outputItem = recipe.outputs[0].item;
            const targetElement = document.querySelector(`[data-item-id="${outputItem}"]`);
            if (targetElement) {
                const rect = targetElement.getBoundingClientRect();
                setOutputTargetPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
            } else {
                setOutputTargetPosition({ x: 100, y: window.innerHeight / 2 });
            }
            
            // Start the animation sequence
            setCraftingPhase('converging');
            
            // Phase 2: Spinning (after converge)
            setTimeout(() => {
                setCraftingPhase('spinning');
            }, 400);
            
            // Phase 3: Output appears (after spinning)
            setTimeout(() => {
                setCraftingPhase('output');
            }, 1200);
            
            // Phase 4: Flyout to sidebar
            setTimeout(() => {
                setCraftingPhase('flyout');
            }, 1600);
            
            // Phase 5: Complete - add to inventory and cleanup
            setTimeout(() => {
                // Remove used ingredients from board
                const remainingIngredients = ingredientsPlaced.filter((_, idx) => 
                    !usedIngredientIndices.includes(idx)
                );
                setIngredientsPlaced(remainingIngredients);
                
                // Add output to inventory
                for (const output of recipe.outputs) {
                    addItem(output.item, output.qty);
                }
                
                // Reset animation state
                setCraftingPhase('idle');
                setCraftingRecipe(null);
                setCraftingIngredientIds([]);
            }, 2200);
            
        } else {
            // Ingredients not on board - spawn them on the board instead of crafting directly
            spawnIngredientsOnBoard(recipe);
        }
    }, [canCraft, boardIngredientCounts, ingredientsPlaced, addItem, spawnIngredientsOnBoard, craftingPhase]);

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

    // Swipe handlers for closing the crafting menu
    const handleSwipeStart = useCallback((e) => {
        // Don't start swipe if dragging an ingredient
        if (selectedIngredient) return;
        
        // Only allow swipe on backdrop/bench, not on sidebar items
        const target = e.target;
        if (target.closest('button') && !target.closest('#craftingBench')) return;
        if (target.closest(`.${styles.leftSidebar}`)) return;
        if (target.closest(`.${styles.rightSidebar}`)) return;
        
        // Get the Y position from touch or mouse
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        swipeStartRef.current = clientY;
        setIsSwiping(true);
    }, [selectedIngredient]);

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
        
        // If swiped UP past threshold, close the menu (pushing it back up)
        if (swipeOffset <= -SWIPE_THRESHOLD) {
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
            // Don't close if dragging an ingredient
            if (selectedIngredient) return;
            
            // deltaY > 0 means scrolling down
            if (e.deltaY > 0) {
                handleClose();
            }
        };

        window.addEventListener('wheel', handleWheel, { passive: true });
        return () => window.removeEventListener('wheel', handleWheel);
    }, [isClosing, selectedIngredient]);

    const handleIngredientDrop = ({ x, y }) => {
        const ingredientName = selectedIngredient.name;
        
        // Deduct from inventory when placing on board
        removeItem(ingredientName, 1);
        
        // Spawn "-1" particle using the particle system
        particleSystem.spawnCraftingPlaceParticle(x, y, `-1 ${ITEMS[ingredientName]?.name || ingredientName}`);
        
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
        // Return item to inventory
        addItem(ingredient.name, 1);
        
        setIngredientsPlaced(prev =>
            prev.filter(ing => ing.x !== ingredient.x || ing.y !== ingredient.y)
        );
    }, [addItem]);

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
            onMouseDown={animationComplete && !selectedIngredient ? handleSwipeStart : undefined}
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
            {ingredientsPlaced.map((ingredient, index) => {
                const isBeingCrafted = craftingIngredientIds.includes(index);
                const centerX = window.innerWidth / 2;
                const centerY = window.innerHeight / 2;
                
                // Calculate position based on crafting phase
                let displayX = ingredient.x;
                let displayY = ingredient.y;
                let scale = 1;
                let opacity = 1;
                let rotation = 0;
                
                if (isBeingCrafted) {
                    if (craftingPhase === 'converging' || craftingPhase === 'spinning' || craftingPhase === 'output' || craftingPhase === 'flyout') {
                        displayX = centerX;
                        displayY = centerY;
                    }
                    if (craftingPhase === 'spinning') {
                        rotation = 360 * 2; // Two full rotations
                        scale = 0.8;
                    }
                    if (craftingPhase === 'output' || craftingPhase === 'flyout') {
                        opacity = 0;
                        scale = 0;
                    }
                }
                
                return (
                    <button
                        key={`${ingredient.name}-${index}`}
                        type="button"
                        className={isClosing ? styles.placedIngredientClosing : ''}
                        style={{
                            position: "absolute",
                            left: displayX,
                            top: displayY,
                            transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
                            zIndex: isBeingCrafted ? 10 : 2,
                            background: "none",
                            border: "none",
                            padding: 0,
                            cursor: isBeingCrafted ? "default" : "grab",
                            userSelect: "none",
                            WebkitUserSelect: "none",
                            touchAction: "none",
                            opacity,
                            transition: craftingPhase !== 'idle' && isBeingCrafted
                                ? 'left 0.4s ease-in-out, top 0.4s ease-in-out, transform 0.8s ease-in-out, opacity 0.3s ease-out'
                                : 'none',
                            pointerEvents: isBeingCrafted ? 'none' : 'auto',
                        }}
                        onClick={stopPropagation}
                        onMouseDown={(e) => !isBeingCrafted && handlePlacedIngredientPointerDown(e, ingredient)}
                        onTouchStart={(e) => !isBeingCrafted && handlePlacedIngredientPointerDown(e, ingredient)}
                    >
                        <img draggable={false} src={ingredient.image} alt={ingredient.name} />
                    </button>
                );
            })}
            
            {/* Crafting output animation */}
            {craftingRecipe && (craftingPhase === 'output' || craftingPhase === 'flyout') && (
                <div
                    style={{
                        position: 'absolute',
                        left: craftingPhase === 'flyout' && outputTargetPosition ? outputTargetPosition.x : window.innerWidth / 2,
                        top: craftingPhase === 'flyout' && outputTargetPosition ? outputTargetPosition.y : window.innerHeight / 2,
                        transform: 'translate(-50%, -50%)',
                        zIndex: 20,
                        opacity: craftingPhase === 'flyout' ? 0 : 1,
                        transition: 'left 0.5s ease-in-out, top 0.5s ease-in-out, opacity 0.5s ease-out, transform 0.3s ease-out',
                        pointerEvents: 'none',
                    }}
                >
                    <div className={craftingPhase === 'output' ? styles.craftOutputPop : ''}>
                        <img 
                            draggable={false} 
                            src={getProductImage(craftingRecipe.outputs[0].item)} 
                            alt={craftingRecipe.outputs[0].item}
                            style={{ width: 50, height: 50 }}
                        />
                        <p style={{ 
                            textAlign: 'center', 
                            margin: 0, 
                            fontWeight: 'bold',
                            color: '#2a5d2a',
                            textShadow: '0 0 10px white'
                        }}>
                            +{craftingRecipe.outputs[0].qty}
                        </p>
                    </div>
                </div>
            )}

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
                                className={`${styles.ingredientItem} ${!hasItem ? styles.ingredientDisabled : ''}`}
                                data-cursor-target="true"
                                data-item-id={product.id}
                                style={{
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
                    {sortedRecipes.map((recipe) => {
                        const canCraftFromBoard = canCraftWithBoard(recipe, boardIngredientCounts);
                        const canCraftFromInventory = canCraft(recipe);
                        const isEnabled = canCraftFromBoard || canCraftFromInventory;
                        const isPulsing = pulsingRecipes.has(recipe.id);
                        
                        return (
                            <div 
                                key={recipe.id}
                                className={`${styles.recipeItem} ${styles.recipeItemAnimated} ${isPulsing ? styles.recipeEnabled : ''} ${isClosing ? styles.recipeItemClosing : ''}`}
                            >
                                <CraftingItem
                                    recipe={recipe}
                                    canCraft={isEnabled}
                                    onCraft={handleCraft}
                                    highlight={canCraftFromBoard}
                                />
                            </div>
                        );
                    })}
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
