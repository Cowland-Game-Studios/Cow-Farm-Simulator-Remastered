import styles from "./cow.module.css";
import Draggable from "../draggable/draggable";
import { useContext, useEffect, useState } from "react";
import PastureStateContext from "../../contexts/PastureStateContext";
import { v4 as uuidv4 } from 'uuid';
import { CowSVG } from "./CowSVG";
import CowListContext, { opacity } from "../../contexts/CowListContext";

export default function Cow({id = uuidv4(), initialState = "hungry", initialColor = "cyan", initialFullness = 0.1}) {

    const colorPollingFrequency = 1000

    const [cowID, setCowID] = useState(id);
    const {isMilking, isFeeding} = useContext(PastureStateContext);
    const {cowList, setCowList} = useContext(CowListContext);

    const [color, setColor] = useState(initialColor);

    const [cowState, setCowState] = useState(initialState)
    const [fullness, setFullness] = useState(initialFullness);

    const [cowOffset, setCowOffset] = useState({x: 0, y: 0});
    const [cowFlipHorizontal, setCowFlipHorizontal] = useState(false);

    useEffect(() => {
        if (cowState != "producing milk") {
            return
        }

        const pollColor = () => {
            setFullness(fullness => fullness + 1 / (30 * 1000 / colorPollingFrequency))
        }

        const interval = setInterval(pollColor, colorPollingFrequency)
        pollColor()

        return () => clearInterval(interval)
    }, [cowState])

    useEffect(() => {
        if (fullness >= 1) {
            setCowState("full")
        }
    }, [fullness])

    const isTouching = (bucketID, maxDistance = 50) => {
        const cowRect = document.getElementById(cowID)?.getBoundingClientRect();
        const bucketRect = document.getElementById(bucketID)?.getBoundingClientRect();

        if (!cowRect || !bucketRect) {
            return false;
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

        return distance < maxDistance;
    }


    useEffect(() => {

        if (cowState == "producing milk") {
            return
        }

        if (isMilking || isFeeding) {
            const a = setInterval(() => {
                    if (isTouching("bucket")) {
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

    useState(() => {
        const moveRandomly = () => {

            const cowMoveMaxDistance = 100 * (cowState != "full" ? 1 : 0.25);

            if (cowState != "hungry") {
                const randomX = Math.random() * cowMoveMaxDistance - cowMoveMaxDistance / 2;
                const randomY = Math.random() * cowMoveMaxDistance - cowMoveMaxDistance / 2;

                setCowOffset({x: randomX, y: randomY})
                setCowFlipHorizontal(randomX > 0)
            }

            setTimeout(() => {
                moveRandomly()
            }, Math.random() * 10000);
        }

        moveRandomly()
    }, [])

    //
    //breeding
    //
    const canBreed = () => {
        return cowState === "full";
    }

    const ifTouchingBreed = () => {

        //average 2 string rgba() colors
        const averageTwoRGB = (rgb1, rgb2) => {
            const rgb1Array = rgb1.substring(5, rgb1.length - 1).split(",");
            const rgb2Array = rgb2.substring(5, rgb2.length - 1).split(",");

            const averageArray = rgb1Array.map((value, index) => {
                return (parseInt(value) + parseInt(rgb2Array[index])) / 2;
            }
            );

            return `rgba(${averageArray[0]}, ${averageArray[1]}, ${averageArray[2]}, ${opacity})`;
        }

        for (const cow of cowList) {
            if (cow.id == cowID) {
                continue;
            }

            if (isTouching(cow.id)) { //somehow check other cow fullness
                const newCow = {
                    id: uuidv4(),
                    color: averageTwoRGB(cow.color, color),
                    state: "hungry"
                }

                setCowState("hungry");
                setFullness(0.1);
    
                setCowList(cowList => [...cowList, newCow]);
            }
        }
    }

    const onDrop = () => {
        if (canBreed()) {
            ifTouchingBreed();
        }
    }

    return (
        <div
            // style={{
            //     transform: `scaleX(${cowFlipHorizontal ? -1 : 1})`,
            //     transition: "all 0.25s ease-in-out",
            // }}
        >
            <div
                style={{
                    transform: `translate(${cowOffset.x}px, ${cowOffset.y}px)`,
                    transition: "all 1s ease-in-out",
                }}
            >
                <Draggable onDrop={onDrop} id={cowID} trackRotationSettings={{rotates: true, sensitivity: 1, displacement: 90}}>
                    <div style={{
                        position: "absolute",
                        top: -5,
                        left: 50,
                        transition: "all 1s ease-in-out",
                    }}>
                        {isMilking && cowState === "full" && <img src="./images/cows/thinkMilk.svg" draggable={false} className={styles.bucket}/>}  
                        {isFeeding && cowState === "hungry" && <img src="./images/cows/thinkFood.svg" draggable={false} className={styles.bucket}/>}  
                    </div>

                    <div
                        style={{
                            transform: `scaleX(${cowFlipHorizontal ? -1 : 1}) scale(${cowState == "full" ? 1.1 : cowState == "hungry" ? 0.8 : 1})`,
                            transition: "all 0.25s ease-in-out",
                        }}
                    >
                        <CowSVG color={color} fullness={fullness} colorPollingFrequency={colorPollingFrequency}/>
                    </div>
                </Draggable>
            </div>
        </div>
    );
}
