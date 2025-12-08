import PropTypes from 'prop-types';
import styles from "./button.module.css";

export default function Button({ text, image, onClick, keepOriginalCursor = false, hidden = false, ...props }) {
    return (
        <button 
            type="button"
            onClick={onClick ? onClick : () => {}} 
            className={`${styles.buttonWrapper} ${hidden ? styles.hidden : ''}`}
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
};

Button.defaultProps = {
    text: '',
    image: null,
    onClick: null,
    keepOriginalCursor: false,
    hidden: false,
    onMouseDown: null,
};
