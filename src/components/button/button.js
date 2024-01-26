import styles from "./button.module.css";

export default function Button({text, image, onClick, keepOriginalCursor = false, ...props}) {
    return (
        <a onClick={onClick ? onClick : () => {}} {...props}>
            <div className={styles.buttonContainer} style={{
                cursor: !keepOriginalCursor ? "pointer" : "default"
            }}>
                {
                    image && <img draggable={false} className={styles.buttonImage} src={image} />
                }
                <p className={styles.buttonText}>
                    {text}
                </p>
            </div>
        </a>
    );
}
