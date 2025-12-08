import styles from "./pasture.module.css";
import Dock from "../components/dock/dock";
import Button from "../components/button/button";
import Cow from "../components/cow/cow";
import { useEffect, useState } from "react";
import DraggableSwinging from "../components/draggableSwinging/draggableSwinging";
import QuestMenu from "../components/questMenu/questMenu";
import PastureStateContext from "../contexts/PastureStateContext";
import CowListContext, { defaultCowList } from "../contexts/CowListContext";
import Crafting from "./crafting";

export default function Pasture() {

    const [isMilking, setIsMilking] = useState(false);
    const [isFeeding, setIsFeeding] = useState(false);
    const [isCrafting, setIsCrafting] = useState(false);

    const [cowList, setCowList] = useState(defaultCowList);

    useEffect(() => {
        const handleMouseUp = () => {
            setIsMilking(false);
            setIsFeeding(false);
        };

        window.addEventListener("mouseup", handleMouseUp);
        return () => window.removeEventListener("mouseup", handleMouseUp);
    }, []);

    return (
        <PastureStateContext.Provider value={{isMilking: isMilking, isFeeding: isFeeding}}>
            <CowListContext.Provider value={{cowList: cowList, setCowList: setCowList}}> 
                
                {isCrafting && <Crafting onClose={() => setIsCrafting(false)}/>}

                <div className={styles.pasture}>

                    {cowList.map((cow) => <Cow key={cow.id} id={cow.id} initialColor={cow.color} initialFullness={cow.fullness} initialState={cow.state} initialPosition={cow.initialPosition} />)}

                    <div className={styles.UI}>

                        <DraggableSwinging id="bucket" isActive={isMilking} ropeLength={30} gravity={0.4} damping={0.96}>
                            <div>
                                <img draggable={false} src="./images/pasture/bucket.svg" alt="Milk bucket" />
                            </div>
                        </DraggableSwinging>

                        <DraggableSwinging id="feed" isActive={isFeeding} ropeLength={25} gravity={0.3} damping={0.95}>
                        <div>
                                <img draggable={false} src="./images/pasture/grass.svg" alt="Cow feed" />
                                <p style={{position: "absolute", left: 30, top: 35}}>3x</p>
                            </div>
                        </DraggableSwinging>

                        {true && <QuestMenu />}

                        {/* {!(isCrafting) && <> */}
                            <Dock style={{top: 25}}>
                                <Button keepOriginalCursor text="10,000" image={"./images/buttons/coinIcon.svg"}/>
                                <Button keepOriginalCursor text="5.2/10k" image={"./images/buttons/starIcon.svg"}/>
                            </Dock>
                            <Dock style={{bottom: 25}}>
                                {/* <Button text="quest" image={"./images/buttons/questIcon.svg"} onClick={() => {
                                    setShowQuestMenu(!showQuestMenu);
                                }}/> */}
                                <Button text="collect" image={"./images/buttons/bucketIcon.svg"} onMouseDown={() => {
                                    setIsMilking(true);
                                }}/>
                                <Button text="feed" image={"./images/buttons/grassIcon.svg"} onMouseDown={() => {
                                    setIsFeeding(true);
                                }}/>
                                <Button text="make" image={"./images/buttons/milkIcon.svg"} onMouseDown={() => {
                                    setIsCrafting(true);
                                }}/>
                                <Button text="shop" image={"./images/buttons/shopIcon.svg"}/>
                            </Dock>
                        {/* </>} */}
                    </div>
                </div>
            </CowListContext.Provider>
        </PastureStateContext.Provider>
    );
}
