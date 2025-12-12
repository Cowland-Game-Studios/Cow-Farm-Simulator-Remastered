/**
 * CraftingItem - Recipe Card Component
 * Displays a single recipe with inputs, outputs, and crafting time
 */

import React from 'react';
import { getProductImage, RECIPES } from '../craftingUtils';
import { Recipe } from '../../../engine/types';

interface CraftingItemProps {
    recipe?: Recipe | null;
    canCraft?: boolean;
    onCraft?: (recipe: Recipe) => void;
    highlight?: boolean;
}

export default function CraftingItem({ 
    recipe = null, 
    canCraft = false, 
    onCraft = () => {}, 
    highlight = false 
}: CraftingItemProps): React.ReactElement {
    // Use recipe data if provided, otherwise show placeholder
    const displayRecipe = recipe || RECIPES[0];
    const input = displayRecipe.inputs[0];
    const output = displayRecipe.outputs[0];
    const timeSeconds = displayRecipe.time;
    const isInstant = timeSeconds === 0;
    const timeDisplay = isInstant 
        ? 'Instant' 
        : timeSeconds < 60 
            ? `${timeSeconds}s` 
            : `${Math.floor(timeSeconds / 60)} min`;

    return (
        <button 
            type="button"
            onClick={() => canCraft && recipe && onCraft(recipe)}
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
            <div style={{ 
                display: "flex", 
                flexDirection: "row", 
                gap: 7, 
                justifyContent: "center", 
                alignItems: "center" 
            }}>
                <img 
                    style={{ width: 10 }} 
                    src="./images/crafting/time.svg" 
                    alt="Time icon" 
                />
                <p style={{ 
                    color: "black", 
                    margin: 0,
                    fontFamily: 'Lexend, sans-serif',
                    fontSize: '8px',
                    fontWeight: 400,
                    letterSpacing: '0.7px',
                }}>
                    {timeDisplay}
                </p>
            </div>
            <div style={{ 
                display: "flex", 
                flexDirection: "row", 
                gap: 7, 
                justifyContent: "center", 
                alignItems: "center" 
            }}>
                <div>
                    <img 
                        src={getProductImage(input.item)} 
                        alt={input.item} 
                        style={{ width: 40, height: 40 }} 
                    />
                    <p style={{ 
                        color: "black", 
                        margin: 0,
                        fontFamily: 'Lexend, sans-serif',
                        fontSize: '8px',
                        fontWeight: 400,
                        letterSpacing: '0.7px',
                    }}>{input.qty}x</p>
                </div>
                <p style={{ 
                    color: "black", 
                    margin: 0,
                    marginTop: -20,
                    fontFamily: 'Lexend, sans-serif',
                    fontSize: '12px',
                    fontWeight: 400,
                    letterSpacing: '0.7px',
                }}>=</p>
                <div>
                    <img 
                        src={getProductImage(output.item)} 
                        alt={output.item} 
                        style={{ width: 40, height: 40 }} 
                    />
                    <p style={{ 
                        color: "black", 
                        margin: 0,
                        fontFamily: 'Lexend, sans-serif',
                        fontSize: '8px',
                        fontWeight: 400,
                        letterSpacing: '0.7px',
                    }}>{output.qty}x</p>
                </div>
            </div>
        </button>
    );
}

