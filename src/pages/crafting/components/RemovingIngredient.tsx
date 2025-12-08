/**
 * RemovingIngredient - Flyout animation when removing an ingredient
 * Shows ingredient flying back to the sidebar
 */

import React from 'react';

export interface RemovingIngredientData {
    id: string;
    ingredient: {
        name: string;
        image: string;
    };
    startX: number;
    startY: number;
    targetX: number;
    targetY: number;
    phase: 'starting' | 'flyout';
}

interface RemovingIngredientProps {
    removing: RemovingIngredientData;
}

export default function RemovingIngredient({ removing }: RemovingIngredientProps): React.ReactElement {
    const isFlyout = removing.phase === 'flyout';
    
    return (
        <div
            style={{
                position: 'absolute',
                left: isFlyout ? removing.targetX : removing.startX,
                top: isFlyout ? removing.targetY : removing.startY,
                transform: `translate(-50%, -50%) scale(${isFlyout ? 0.5 : 1})`,
                zIndex: 20,
                opacity: isFlyout ? 0 : 1,
                transition: isFlyout 
                    ? 'left 0.4s ease-in-out, top 0.4s ease-in-out, opacity 0.4s ease-out, transform 0.4s ease-out'
                    : 'none',
                pointerEvents: 'none',
            }}
        >
            <img 
                draggable={false} 
                src={removing.ingredient.image} 
                alt={removing.ingredient.name}
                style={{ width: 50, height: 50 }}
            />
        </div>
    );
}

