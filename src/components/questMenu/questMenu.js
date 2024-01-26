import styles from "./questMenu.module.css";

export default function QuestMenu ({...props}) {
    return (
        <div className={styles.questMenu} {...props}>
            <div className={styles.questMenuContainer}>
                {/* <h4></h4> */}
                <p>Breed 4 Cows</p>
                <p>Feed 3 Cows</p>
            </div>
        </div>
    );
}
