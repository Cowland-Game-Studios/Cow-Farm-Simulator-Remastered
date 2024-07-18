import styles from "./questMenu.module.css";

const quests = [
    {
        name: "Breed 3 cows",
        progress: 1,
        goal: 3,
    }
]

export default function QuestMenu ({...props}) {
    return (
        <div className={styles.questMenu} {...props}>
            {/* <div className={styles.questMenuContainer}> */}
                <div className={styles.questItem}>
                    <h3>breeder</h3>
                    <p>- breed cows (1/3) </p>
                </div>
                <div className={styles.questItem}>
                    <h3>cheesy</h3>
                    <p>- obtain cheese</p>
                </div>
            {/* </div> */}
        </div>
    );
}
