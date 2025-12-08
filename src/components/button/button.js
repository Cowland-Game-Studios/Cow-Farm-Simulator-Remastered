import PropTypes from 'prop-types';
import styles from "./button.module.css";

export default function Button({ text = '', image = null, onClick = null, onMouseDown = null, keepOriginalCursor = false, hidden = false, disabled = false, ...props }) {
    // Handle both mouse and touch for mobile support
    const handlePointerDown = (e) => {
        if (onMouseDown && !disabled) {
            onMouseDown(e);
        }
    };

    return (
        <button 
            type="button"
            onClick={!disabled && onClick ? onClick : () => {}} 
            onMouseDown={handlePointerDown}
            onTouchStart={handlePointerDown}
            className={`${styles.buttonWrapper} ${hidden ? styles.hidden : ''} ${disabled ? styles.disabled : ''}`}
            aria-disabled={disabled}
            {...props}
        >
            <div className={styles.buttonContainer} style={{
                cursor: !keepOriginalCursor ? "pointer" : "default"
            }}>
                {image && (
                    <img 
                        draggable={false} 
                        className={styles.buttonImage} 
                        src={image} 
                        alt={text || "Button icon"} 
                    />
                )}
                <p className={styles.buttonText}>
                    {text}
                </p>
            </div>
        </button>
    );
}

Button.propTypes = {
    /** Button text label */
    text: PropTypes.string,
    /** Image source URL */
    image: PropTypes.string,
    /** Click handler */
    onClick: PropTypes.func,
    /** Keep default cursor instead of pointer */
    keepOriginalCursor: PropTypes.bool,
    /** Hide the button */
    hidden: PropTypes.bool,
    /** Mouse down handler */
    onMouseDown: PropTypes.func,
    /** Disable the button */
    disabled: PropTypes.bool,
};
