import { useState } from "react";
import PropTypes from 'prop-types';
import Button from "../components/button/button";
import styles from "./crafting.module.css";
import Draggable from "../components/draggable/draggable";
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

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
        }, GAME_CONFIG.UI.ANIMATION_DURATION_MS);
    };

    const handleIngredientDrop = ({ x, y }) => {
        setSelectedIngredient(null);
        setIngredientsPlaced([
            ...ingredientsPlaced,
            { name: selectedIngredient.name, image: selectedIngredient.image, x, y }
        ]);
    };

    const handlePlacedIngredientClick = (ingredient) => {
        // Remove this ingredient from placed list and make it selected
        setIngredientsPlaced(
            ingredientsPlaced.filter(ing => ing.x !== ingredient.x || ing.y !== ingredient.y)
        );
        setSelectedIngredient({ name: ingredient.name, image: ingredient.image });
    };

    return (
        <div className={`${styles.craftingBlurBackground} ${isClosing ? styles.closing : ''}`}>
            {/* Currently dragged ingredient */}
            {selectedIngredient && (
                <Draggable
                    id="ingredient"
                    initialDragging
                    onDrop={handleIngredientDrop}
                    trackRotationSettings={{ rotates: false }}
                >
                    <img draggable={false} src={selectedIngredient.image} alt={selectedIngredient.name} />
                </Draggable>
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
                        cursor: "grab"
                    }}
                    onMouseDown={() => handlePlacedIngredientClick(ingredient)}
                >
                    <img draggable={false} src={ingredient.image} alt={ingredient.name} />
                </button>
            ))}

            <div className={styles.spreadEvenlyContainer}>
                {/* Product selection panel */}
                <div className={`${styles.standardedizedList} ${styles.leftSidebar} ${isClosing ? styles.closing : ''}`}>
                    <div style={{ marginLeft: "50%" }}>
                        <div className={styles.list}>
                            {PRODUCTS.map(product => (
                                <Button
                                    key={product.name}
                                    text="x100"
                                    image={product.image}
                                    onMouseDown={() => {
                                        setSelectedIngredient({ name: product.name, image: product.image });
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Crafting bench */}
                <div className={`${styles.benchTop} ${isClosing ? styles.closing : ''}`} id="craftingBench">
                    <img
                        draggable={false}
                        className={styles.craftingInstructions}
                        src="./images/crafting/instruction.svg"
                        alt="Crafting instructions"
                    />
                </div>

                {/* Recipe list */}
                <div className={`${styles.standardedizedList} ${styles.rightSidebar} ${isClosing ? styles.closing : ''}`}>
                    <div className={styles.list}>
                        {CRAFTING_RECIPES.map((recipe, index) => (
                            <CraftingItem
                                key={recipe.id}
                                recipe={recipe}
                                enabled={index === 0}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Action buttons */}
            <div className={`${styles.buttonContainers} ${isClosing ? styles.closing : ''}`}>
                <div
                    className={styles.casualButton}
                    onClick={() => setIngredientsPlaced([])}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setIngredientsPlaced([])}
                >
                    <p className={styles.casualButtonText}>clear</p>
                </div>
                <div
                    className={styles.casualButton}
                    onClick={handleClose}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleClose()}
                >
                    <p className={styles.casualButtonText} style={{ color: "red" }}>cancel & close</p>
                </div>
            </div>
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
