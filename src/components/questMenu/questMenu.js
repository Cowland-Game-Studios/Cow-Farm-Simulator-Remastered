import styles from "./questMenu.module.css";

export default function QuestMenu ({...props}) {
    return (
        <div className={styles.questMenu} {...props}>
            <div className={styles.questMenuContainer}>
                <div className={styles.questItem}>
                    <h3>Breed 3 cows</h3>
                    <p>- 1/3</p>
                </div>
                <div className={styles.questItem}>
                    <h3>Side quest</h3>
                    <p>- Sunny Park 😩</p>
                </div>
            </div>
        </div>
    );
}
