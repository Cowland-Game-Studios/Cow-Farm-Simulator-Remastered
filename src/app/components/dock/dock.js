import Image from "next/image";
import styles from "./dock.module.css";

export default function Dock ({...props}) {
    return (
        <div className={styles.dock} {...props}>
            <div className={styles.dockContainer}>
                {props.children}
            </div>
        </div>
    );
}
