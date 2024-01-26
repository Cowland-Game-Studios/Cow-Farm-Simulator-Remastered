import styles from "./pasture.module.css";
import Dock from "../components/dock/dock";
import Button from "../components/button/button";
import Cow from "../components/cow/cow";
import { useEffect, useState } from "react";
import Draggable from "../components/draggable/draggable";
import QuestMenu from "../components/questMenu/questMenu";

export default function Pasture() {

    const [showQuestMenu, setShowQuestMenu] = useState(false);
    const [isMilking, setIsMilking] = useState(false);
    const [isFeeding, setIsFeeding] = useState(false);

    useEffect(() => {

        const ridAllMouseEvents = () => {
            setIsMilking(false);
            setIsFeeding(false);
        }

        window.addEventListener("mouseup", () => {
            ridAllMouseEvents();
        })
    }, []);

    return (
        <div className={styles.pasture}>
            <Cow defaultColor="red" />
            <Cow defaultColor="blue"/>
            <Cow defaultColor="yellow"/>

            {Array(10).fill(0).map(() => <Cow defaultColor={`rgba(
                ${Math.random() * 100  + 155},
                ${Math.random() * 100 + 155},
                ${Math.random() * 100 + 155},
                1
            )`}/>)}

            <div className={styles.UI}>

                {isMilking && <Draggable initialDragging>
                    <div onMouseUp={() => {
                        setIsMilking(false);
                    }}>
                        <img src="./images/pasture/bucket.svg" />
                    </div>    
                </Draggable>}

                {isFeeding && <Draggable initialDragging>
                    <div onMouseUp={() => {
                        setIsMilking(false);
                    }}>
                        <img src="./images/pasture/grass.svg" />
                    </div>    
                </Draggable>}

                {showQuestMenu && <QuestMenu style={{bottom: 100}} />}

                <Dock style={{top: 25}}>
                    <Button keepOriginalCursor text="10,000" image={"./images/buttons/coinIcon.svg"}/>
                    <Button keepOriginalCursor text="5.2/10k" image={"./images/buttons/starIcon.svg"}/>
                </Dock>
                <Dock style={{bottom: 25}}>
                    <Button text="quest" image={"./images/buttons/questIcon.svg"} onClick={() => {
                        setShowQuestMenu(!showQuestMenu);
                    }}/>
                    <Button text="collect" image={"./images/buttons/bucketIcon.svg"} onMouseDown={() => {
                        setIsMilking(true);
                    }}/>
                    <Button text="feed" image={"./images/buttons/grassIcon.svg"} onMouseDown={() => {
                        setIsFeeding(true);
                    }}/>
                    <Button text="make" image={"./images/buttons/milkIcon.svg"}/>
                    <Button text="shop" image={"./images/buttons/shopIcon.svg"}/>
                </Dock>
            </div>
        </div>
    );
}
