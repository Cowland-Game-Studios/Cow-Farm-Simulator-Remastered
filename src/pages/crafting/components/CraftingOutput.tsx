/**
 * CraftingOutput - Output animation component
 * Shows the crafted item popping out and flying to the sidebar
 */

import React from 'react';
import styles from '../crafting.module.css';
import { getProductImage } from '../craftingUtils';
import { Recipe } from '../../../engine/types';

interface CraftingOutputProps {
    recipe: Recipe | null;
    craftingPhase: string;
    craftingCenter: { x: number; y: number };
    outputTargetPosition: { x: number; y: number } | null;
}

export default function CraftingOutput({
    recipe,
    craftingPhase,
    craftingCenter,
    outputTargetPosition,
}: CraftingOutputProps): React.ReactElement | null {
    if (!recipe || (craftingPhase !== 'output' && craftingPhase !== 'flyout')) {
        return null;
    }

    const outputItem = recipe.outputs[0];
    const isFlyout = craftingPhase === 'flyout';
    
    return (
        <div
            style={{
                position: 'absolute',
                left: isFlyout && outputTargetPosition 
                    ? outputTargetPosition.x 
                    : craftingCenter.x,
                top: isFlyout && outputTargetPosition 
                    ? outputTargetPosition.y 
                    : craftingCenter.y,
                transform: 'translate(-50%, -50%)',
                zIndex: 20,
                opacity: isFlyout ? 0 : 1,
                transition: 'left 0.5s ease-in-out, top 0.5s ease-in-out, opacity 0.5s ease-out, transform 0.3s ease-out',
                pointerEvents: 'none',
            }}
        >
            <div className={craftingPhase === 'output' ? styles.craftOutputPop : ''}>
                <img 
                    draggable={false} 
                    src={getProductImage(outputItem.item)} 
                    alt={outputItem.item}
                    style={{ width: 50, height: 50 }}
                />
            </div>
        </div>
    );
}

