/**
 * PlacedIngredient - Single ingredient on the crafting board
 * Handles display with spawn, crafting, and removing animations
 */

import React, { MouseEvent } from 'react';
import styles from '../crafting.module.css';

export interface PlacedIngredientData {
    name: string;
    image: string;
    x: number;
    y: number;
    currentX?: number;
    currentY?: number;
    spawnPhase?: 'starting' | 'animating' | 'done';
    spawnId?: string | number;
}

export interface TimedCraftingData {
    startedAt: number;
    duration: number;
    recipe: {
        id: string;
        outputs: Array<{ item: string; qty: number }>;
    };
    ingredientIds: number[];
}

interface PlacedIngredientProps {
    ingredient: PlacedIngredientData;
    isBeingCrafted: boolean;
    craftingPhase: string;
    craftingCenter: { x: number; y: number };
    timedCrafting: TimedCraftingData | null;
    isClosing: boolean;
    isEntering: boolean;
    onClick?: (e: MouseEvent, ingredient: PlacedIngredientData) => void;
}

export default function PlacedIngredient({
    ingredient,
    isBeingCrafted,
    craftingPhase,
    craftingCenter,
    timedCrafting,
    isClosing,
    isEntering,
    onClick,
}: PlacedIngredientProps): React.ReactElement {
    // Use the center of ingredients being crafted, not screen center
    const centerX = craftingCenter.x;
    const centerY = craftingCenter.y;
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
    
    const handleClick = (e: MouseEvent) => {
        if (!isBeingCrafted && onClick) {
            onClick(e, ingredient);
        }
    };

    // Determine animation class
    const getAnimationClass = () => {
        if (isClosing) return styles.placedIngredientClosing;
        if (isEntering && !isSpawning && !isBeingCrafted) return styles.placedIngredientEntering;
        return '';
    };

    return (
        <button
            type="button"
            className={`${getAnimationClass()} ${isTimedSpinning ? styles.continuousSpin : ''}`}
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

