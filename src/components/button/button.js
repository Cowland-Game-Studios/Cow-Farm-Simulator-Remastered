import styles from "./button.module.css";

export default function Button({text, image, onClick = null}) {
    return (
        <a onClick={onClick ? onClick : () => {}}>
            <div className={styles.buttonContainer} style={{
                cursor: onClick ? "pointer" : "default"
            }}>
                {
                    image && <img className={styles.buttonImage} src={image} />
                }
                <p className={styles.buttonText}>
                    {text}
                </p>
            </div>
        </a>
    );
}
