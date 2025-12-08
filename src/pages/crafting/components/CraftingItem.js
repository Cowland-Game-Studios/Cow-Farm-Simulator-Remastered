/**
 * CraftingItem - Recipe Card Component
 * Displays a single recipe with inputs, outputs, and crafting time
 */

import PropTypes from 'prop-types';
import { getProductImage, RECIPES } from '../craftingUtils';

export default function CraftingItem({ 
    recipe = null, 
    canCraft = false, 
    onCraft = () => {}, 
    highlight = false 
}) {
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
                <p style={{ color: "black", marginTop: 5, fontSize: 12 }}>
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
                    <p style={{ color: "black", marginTop: 0 }}>{input.qty}x</p>
                </div>
                <p style={{ color: "black", fontSize: 20, marginTop: -20 }}>=</p>
                <div>
                    <img 
                        src={getProductImage(output.item)} 
                        alt={output.item} 
                        style={{ width: 40, height: 40 }} 
                    />
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
