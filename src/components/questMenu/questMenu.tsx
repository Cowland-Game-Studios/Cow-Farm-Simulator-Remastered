import React from 'react';
import styles from "./questMenu.module.css";

interface Quest {
    id: string;
    name: string;
    description: string;
    progress: number;
    goal: number;
    xp: number;
}

// Quest data - will eventually come from game state/database
const QUESTS: Quest[] = [
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

interface QuestMenuProps {
    [key: string]: unknown;
}

export default function QuestMenu({ ...props }: QuestMenuProps): React.ReactElement {
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

