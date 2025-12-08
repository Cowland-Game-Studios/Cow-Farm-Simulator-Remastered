/**
 * CraftingOutput - Output animation component
 * Shows the crafted item popping out and flying to the sidebar
 */

import PropTypes from 'prop-types';
import styles from '../crafting.module.css';
import { getProductImage } from '../craftingUtils';

export default function CraftingOutput({
    recipe,
    craftingPhase,
    outputTargetPosition,
}) {
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
                    : window.innerWidth / 2,
                top: isFlyout && outputTargetPosition 
                    ? outputTargetPosition.y 
                    : window.innerHeight / 2,
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

CraftingOutput.propTypes = {
    recipe: PropTypes.shape({
        outputs: PropTypes.arrayOf(PropTypes.shape({
            item: PropTypes.string.isRequired,
            qty: PropTypes.number.isRequired,
        })).isRequired,
    }),
    craftingPhase: PropTypes.string.isRequired,
    outputTargetPosition: PropTypes.shape({
        x: PropTypes.number,
        y: PropTypes.number,
    }),
};
