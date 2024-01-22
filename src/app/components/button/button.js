"use client"

import Image from "next/image";
import styles from "./button.module.css";

export default function Button({text, image, onClick = () => {}}) {
    return (
        <a onClick={onClick}>
            <div className={styles.buttonContainer}>
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
