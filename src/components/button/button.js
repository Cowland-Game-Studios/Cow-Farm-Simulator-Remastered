import styles from "./button.module.css";

export default function Button({ text, image, onClick, keepOriginalCursor = false, ...props }) {
    return (
        <button 
            type="button"
            onClick={onClick ? onClick : () => {}} 
            className={styles.buttonWrapper}
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
