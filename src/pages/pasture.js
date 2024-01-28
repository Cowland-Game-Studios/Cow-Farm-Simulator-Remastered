import styles from "./pasture.module.css";
import Dock from "../components/dock/dock";
import Button from "../components/button/button";
import Cow from "../components/cow/cow";
import { useEffect, useState } from "react";
import Draggable from "../components/draggable/draggable";
import QuestMenu from "../components/questMenu/questMenu";
import PastureStateContext from "../contexts/PastureStateContext";
import CowListContext, { defaultCowList } from "../contexts/CowListContext";

export default function Pasture() {

    const [showQuestMenu, setShowQuestMenu] = useState(false);
    const [isMilking, setIsMilking] = useState(false);
    const [isFeeding, setIsFeeding] = useState(false);

    const [cowList, setCowList] = useState(defaultCowList);

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
        <PastureStateContext.Provider value={{isMilking: isMilking, isFeeding: isFeeding}}>
            <CowListContext.Provider value={{cowList: cowList, setCowList: setCowList}}> 
                <div className={styles.pasture}>

                    {cowList.map((cow) => <Cow key={cow.id} id={cow.id} initialColor={cow.color} initialFullness={cow.fullness} initialState={cow.state} />)}

                    <div className={styles.UI}>

                        {isMilking && <Draggable id="bucket" initialDragging trackRotationSettings={{rotates: false}}>
                            <div>
                                <img draggable={false} src="./images/pasture/bucket.svg" />
                            </div>
                        </Draggable>}

                        {isFeeding && <Draggable id="bucket" initialDragging trackRotationSettings={{rotates: false}}>
                        <div>
                                <img draggable={false} src="./images/pasture/grass.svg" />
                                <p style={{position: "absolute", left: 30, top: 35}}>3x</p>
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
            </CowListContext.Provider>
        </PastureStateContext.Provider>
    );
}
