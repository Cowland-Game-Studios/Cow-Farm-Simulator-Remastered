/**
 * RemovingIngredient - Flyout animation when removing an ingredient
 * Shows ingredient flying back to the sidebar
 */

import PropTypes from 'prop-types';

export default function RemovingIngredient({ removing }) {
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

RemovingIngredient.propTypes = {
    removing: PropTypes.shape({
        id: PropTypes.string.isRequired,
        ingredient: PropTypes.shape({
            name: PropTypes.string.isRequired,
            image: PropTypes.string.isRequired,
        }).isRequired,
        startX: PropTypes.number.isRequired,
        startY: PropTypes.number.isRequired,
        targetX: PropTypes.number.isRequired,
        targetY: PropTypes.number.isRequired,
        phase: PropTypes.string.isRequired,
    }).isRequired,
};
