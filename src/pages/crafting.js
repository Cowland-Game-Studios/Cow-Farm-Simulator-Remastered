import { useState, useRef } from "react";
import PropTypes from 'prop-types';
import Button from "../components/button/button";
import styles from "./crafting.module.css";
import DraggableSwinging from "../components/draggableSwinging/draggableSwinging";
import ParticleRenderer from "../components/particles/ParticleRenderer";
import { particleSystem } from "../engine/particleSystem";
import { GAME_CONFIG } from "../config/gameConfig";

// Product definitions
const PRODUCTS = [
    { name: "milk", image: "./images/crafting/products/milk.svg" },
    { name: "cream", image: "./images/crafting/products/cream.svg" },
    { name: "butter", image: "./images/crafting/products/butter.svg" },
    { name: "cheesecake", image: "./images/crafting/products/cheesecake.svg" },
    { name: "yogurt", image: "./images/crafting/products/yogurt.svg" },
    { name: "ice cream", image: "./images/crafting/products/ice cream.svg" },
];

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

function CraftingItem({ recipe, enabled = false }) {
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

CraftingItem.defaultProps = {
    recipe: null,
    enabled: false,
};

export default function Crafting({ onClose = () => {} }) {
    const [selectedIngredient, setSelectedIngredient] = useState(null);
    const [ingredientsPlaced, setIngredientsPlaced] = useState([]);
    const [isClosing, setIsClosing] = useState(false);
    const clickTimeoutRef = useRef(null);
    const DOUBLE_CLICK_DELAY = 250; // ms to wait for potential double-click

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
        }, GAME_CONFIG.UI.ANIMATION_DURATION_MS);
    };

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

    const handlePlacedIngredientClick = (ingredient) => {
        // Clear any pending single-click action
        if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
            clickTimeoutRef.current = null;
        }
        
        // Delay single-click action to allow double-click detection
        clickTimeoutRef.current = setTimeout(() => {
            // Remove this ingredient from placed list and make it selected (drag it)
            setIngredientsPlaced(prev => 
                prev.filter(ing => ing.x !== ingredient.x || ing.y !== ingredient.y)
            );
            setSelectedIngredient({ name: ingredient.name, image: ingredient.image });
            clickTimeoutRef.current = null;
        }, DOUBLE_CLICK_DELAY);
    };

    const handlePlacedIngredientDoubleClick = (ingredient) => {
        // Cancel the pending single-click action
        if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
            clickTimeoutRef.current = null;
        }
        
        // Remove this ingredient from the table entirely (return to inventory)
        setIngredientsPlaced(prev =>
            prev.filter(ing => ing.x !== ingredient.x || ing.y !== ingredient.y)
        );
    };

    // Stop propagation to prevent closing when interacting with UI elements
    const stopPropagation = (e) => e.stopPropagation();

    return (
        <div 
            className={`${styles.craftingBlurBackground} ${isClosing ? styles.closing : ''}`}
            onClick={handleClose}
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
                        WebkitUserSelect: "none"
                    }}
                    onClick={stopPropagation}
                    onMouseDown={(e) => {
                        stopPropagation(e);
                        handlePlacedIngredientClick(ingredient);
                    }}
                    onDoubleClick={(e) => {
                        stopPropagation(e);
                        handlePlacedIngredientDoubleClick(ingredient);
                    }}
                >
                    <img draggable={false} src={ingredient.image} alt={ingredient.name} />
                </button>
            ))}

            {/* Particle system renderer for "-1" indicators */}
            <ParticleRenderer />

            {/* Crafting bench - full center area */}
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            <div 
                className={`${styles.benchTop} ${isClosing ? styles.closing : ''}`} 
                id="craftingBench"
                onClick={stopPropagation}
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
                click anywhere to close
            </p>
        </div>
    );
}

Crafting.propTypes = {
    /** Callback when crafting menu is closed */
    onClose: PropTypes.func,
};

Crafting.defaultProps = {
    onClose: () => {},
};
