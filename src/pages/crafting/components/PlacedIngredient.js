/**
 * PlacedIngredient - Single ingredient on the crafting board
 * Handles display with spawn, crafting, and removing animations
 */

import PropTypes from 'prop-types';
import styles from '../crafting.module.css';

export default function PlacedIngredient({
    ingredient,
    isBeingCrafted,
    craftingPhase,
    timedCrafting,
    isClosing,
    onClick,
}) {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const isSpawning = ingredient.spawnPhase === 'starting' || ingredient.spawnPhase === 'animating';
    
    // Calculate position based on crafting phase and spawn state
    let displayX = ingredient.currentX !== undefined ? ingredient.currentX : ingredient.x;
    let displayY = ingredient.currentY !== undefined ? ingredient.currentY : ingredient.y;
    let scale = 1;
    let opacity = 1;
    let rotation = 0;
    let shouldTransition = ingredient.spawnPhase === 'animating';
    
    // Spawn animation: fly in from sidebar
    if (ingredient.spawnPhase === 'starting') {
        scale = 1;
        opacity = 0.8;
    }
    if (ingredient.spawnPhase === 'animating') {
        scale = 1;
        opacity = 1;
    }
    
    // Check if this is timed spinning (continuous) vs instant spinning (quick)
    const isTimedSpinning = isBeingCrafted && craftingPhase === 'spinning' && timedCrafting;
    
    if (isBeingCrafted) {
        shouldTransition = true;
        if (craftingPhase === 'converging' || craftingPhase === 'spinning' || craftingPhase === 'output' || craftingPhase === 'flyout') {
            displayX = centerX;
            displayY = centerY;
        }
        if (craftingPhase === 'spinning' && !timedCrafting) {
            // Instant recipe: quick spin animation
            rotation = 360 * 2; // Two full rotations
            scale = 0.8;
        }
        if (craftingPhase === 'spinning' && timedCrafting) {
            // Timed recipe: continuous spin via CSS animation
            scale = 0.9;
        }
        if (craftingPhase === 'output' || craftingPhase === 'flyout') {
            opacity = 0;
            scale = 0;
        }
    }
    
    const handleClick = (e) => {
        if (!isBeingCrafted && onClick) {
            onClick(e, ingredient);
        }
    };

    return (
        <button
            type="button"
            className={`${isClosing ? styles.placedIngredientClosing : ''} ${isTimedSpinning ? styles.continuousSpin : ''}`}
            style={{
                position: "absolute",
                left: displayX,
                top: displayY,
                transform: `translate(-50%, -50%) scale(${scale})${!isTimedSpinning ? ` rotate(${rotation}deg)` : ''}`,
                zIndex: isBeingCrafted || isSpawning ? 10 : 2,
                background: "none",
                border: "none",
                padding: 0,
                cursor: isBeingCrafted || isSpawning ? "default" : "pointer",
                userSelect: "none",
                WebkitUserSelect: "none",
                touchAction: "none",
                opacity,
                transition: shouldTransition || isBeingCrafted
                    ? 'left 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), top 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.8s ease-in-out, opacity 0.3s ease-out'
                    : 'none',
                pointerEvents: isBeingCrafted || isSpawning ? 'none' : 'auto',
            }}
            onClick={handleClick}
        >
            <img draggable={false} src={ingredient.image} alt={ingredient.name} />
        </button>
    );
}

PlacedIngredient.propTypes = {
    ingredient: PropTypes.shape({
        name: PropTypes.string.isRequired,
        image: PropTypes.string.isRequired,
        x: PropTypes.number.isRequired,
        y: PropTypes.number.isRequired,
        currentX: PropTypes.number,
        currentY: PropTypes.number,
        spawnPhase: PropTypes.string,
        spawnId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }).isRequired,
    isBeingCrafted: PropTypes.bool.isRequired,
    craftingPhase: PropTypes.string.isRequired,
    timedCrafting: PropTypes.object,
    isClosing: PropTypes.bool.isRequired,
    onClick: PropTypes.func,
};
