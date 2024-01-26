import styles from "./questMenu.module.css";

export default function QuestMenu ({...props}) {
    return (
        <div className={styles.questMenu} {...props}>
            <div className={styles.questMenuContainer}>
                <div className={styles.questItem}>
                    <h3>Learning The Ropes</h3>
                    <p>- Feed 3 Cows</p>
                </div>
            </div>
            <div className={styles.questMenuContainer}>
                <div className={styles.questItem}>
                    <h3>Baals</h3>
                    <p>- Larry</p>
                </div>
            </div>
        </div>
    );
}
