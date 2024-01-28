import styles from "./cow.module.css";
import Draggable from "../draggable/draggable";
import { useContext, useEffect, useState } from "react";
import PastureStateContext from "../../contexts/PastureStateContext";
import { v4 as uuidv4 } from 'uuid';
import { CowSVG } from "./CowSVG";

export default function Cow({initialColor = "cyan", initialFullness = 1, getStats = () => {}}) {

    const [cowID, setCowID] = useState(uuidv4());
    const {isMilking, isFeeding} = useContext(PastureStateContext);

    const [color, setColor] = useState(initialColor);

    const [cowState, setCowState] = useState("producing milk")
    const [fullness, setFullness] = useState(initialFullness);

    useEffect(() => {
        if (cowState != "producing milk") {
            return
        }

        const interval = setInterval(() => {
            setFullness(fullness => fullness + 1/30)
        }, 1000)
        return () => clearInterval(interval)
    }, [cowState])

    useEffect(() => {
        if (fullness >= 1) {
            setCowState("full")
        }
    }, [fullness])


    useEffect(() => {

        if (cowState == "producing milk") {
            return
        }

        if (isMilking || isFeeding) {
            const a = setInterval(() => {
                    const cowRect = document.getElementById(cowID)?.getBoundingClientRect();
                    // console.log(cowRect)
                    const bucketRect = document.getElementById("bucket")?.getBoundingClientRect();
                    // console.log(bucketRect)

                    if (!cowRect || !bucketRect) {
                        return;
                    }

                    const cowCenter = {
                        x: cowRect.x + cowRect.width / 2,
                        y: cowRect.y + cowRect.height / 2,
                    }

                    const bucketCenter = {
                        x: bucketRect.x + bucketRect.width / 2,
                        y: bucketRect.y + bucketRect.height / 2,
                    }

                    const distance = Math.sqrt(
                        Math.pow(cowCenter.x - bucketCenter.x, 2) + Math.pow(cowCenter.y - bucketCenter.y, 2)
                    );

                    if (distance < 50) {
                        if (isMilking && cowState === "full") {
                            setCowState("hungry");
                            setFullness(0.1);

                            clearInterval(a);
                            return
                        }
                        else if (isFeeding && cowState === "hungry") {
                            setCowState("producing milk");
                            setFullness(0.25);

                            clearInterval(a);
                            return
                        }
                    }
            }, 100);
        }
    }, [isMilking, isFeeding, cowState]);

    return (
        <Draggable id={cowID} trackRotationSettings={{rotates: true, sensitivity: 1, displacement: 90}}>
            <div style={{
                position: "absolute",
                top: 0,
                left: 30,
                transition: "all 1s ease-in-out",
            }}>
                {isMilking && cowState === "full" && <img src="./images/cows/thinkMilk.svg" draggable={false} className={styles.bucket}/>}  
                {isFeeding && cowState === "hungry" && <img src="./images/cows/thinkFood.svg" draggable={false} className={styles.bucket}/>}  
            </div>

            <div style={{

            }}>
                <CowSVG color={color} fullness={fullness}/>
            </div>
        </Draggable>
    );
}
