import React from 'react';
import styles from "./button.module.css";

interface ButtonProps {
    /** Button text label */
    text?: string;
    /** Image source URL */
    image?: string | null;
    /** Click handler */
    onClick?: ((e: React.MouseEvent) => void) | null;
    /** Mouse down handler */
    onMouseDown?: ((e: React.MouseEvent | React.TouchEvent) => void) | null;
    /** Keep default cursor instead of pointer */
    keepOriginalCursor?: boolean;
    /** Hide the button */
    hidden?: boolean;
    /** Disable the button */
    disabled?: boolean;
    [key: string]: unknown;
}

export default function Button({ 
    text = '', 
    image = null, 
    onClick = null, 
    onMouseDown = null, 
    keepOriginalCursor = false, 
    hidden = false, 
    disabled = false, 
    ...props 
}: ButtonProps): React.ReactElement {
    // Handle both mouse and touch for mobile support
    const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
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

