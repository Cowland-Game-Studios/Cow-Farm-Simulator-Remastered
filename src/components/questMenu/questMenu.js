import styles from "./questMenu.module.css";

// Quest data - will eventually come from game state/database
const QUESTS = [
    {
        id: "breeder",
        name: "breeder",
        description: "breed cows",
        progress: 1,
        goal: 3,
        xp: 100,
    },
    {
        id: "cheesy",
        name: "cheesy",
        description: "obtain cheese",
        progress: 0,
        goal: 1,
        xp: 50,
    }
];

export default function QuestMenu({ ...props }) {
    return (
        <div className={styles.questMenu} {...props}>
            {QUESTS.map(quest => (
                <div key={quest.id} className={styles.questItem}>
                    <h3>{quest.name} <span className={styles.xp}>{quest.xp}xp</span></h3>
                    <p>- {quest.description} ({quest.progress}/{quest.goal})</p>
                </div>
            ))}
        </div>
    );
}
