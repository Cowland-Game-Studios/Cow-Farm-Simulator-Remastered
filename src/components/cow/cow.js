import styles from "./cow.module.css";
import Draggable from "../draggable/draggable";
import { useContext, useEffect, useState } from "react";
import PastureStateContext from "../../contexts/PastureStateContext";
import { v4 as uuidv4 } from 'uuid';

//.27 start | .7 end
function CowSVG({color="white", fullness = 0.7}) {
    return <>
        <div className={styles.moveForever} style={{
            //crop to 50% height
            height: (100 - (fullness * (0.7 - 0.27) * 100 + 27)) + "%",
            overflow: "hidden",
            position: "absolute",

            transition: "all 1s ease-in-out",
        }}>
            <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.64197 45.679L11.7284 40.7407L17.2839 33.3333L20.1106 32.5L22.5 33.3333L24.6914 34.5679L44.4444 32.0988L78.75 32.5L83.3333 34.5679L87.5 38.75L88.8889 45.0617L88.75 55L82.0988 58.642V60.4938V64.1975L80.8642 76.5432L79.6296 78.395H77.7778L75.9259 77.7778L75.4349 77.5H73.75L72.2222 77.1605L71.25 75L73.75 63.75L71.6049 59.2592L67.5 61.25L58.642 62.3457L50 61.7284L45.679 61.25V70.3704L45.3944 76.25L44.4444 77.7778L41.9753 78.395L40.7407 77.7778L38.75 78.75L35.9225 77.5L36.4197 72.8395L37.5 67.5L35.8025 63.5802L35 63.75L32.0988 62.9629L29.6296 61.1111L27.5 53.75L25.3086 51.25L22.5 50L17.2839 51.2346L11.25 51.25L8.74998 48.75L8.64197 45.679Z" fill={"white"}/>
                
                <path d="M45.0618 56.1728L45.5663 75.703C45.6098 77.0784 44.6697 78.2721 43.3557 78.5084L42.9359 78.5833C42.2114 78.7137 41.5201 78.5381 40.9674 78.1608" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M81.3727 45.7455C82.697 48.5697 83.1495 53.4452 82.1733 57.4565L82.431 64.7073L81.0462 75.8243C80.8982 77.0063 80.0334 77.9511 78.8964 78.1721L78.5446 78.2405C77.5961 78.4249 76.6956 78.0787 76.0868 77.4357" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M82.0988 57.4074L80.2802 65.7289L76.7996 76.3775C76.4288 77.5094 75.3996 78.2719 74.2413 78.2719H73.883C72.0469 78.2719 70.7469 76.4247 71.3163 74.6233L73.5746 64.9192C73.5746 64.9192 67.8344 54.2789 69.4094 49.3469" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M49.65 61.8069C49.65 61.8069 66.45 63.6278 71.0083 59.8069M90.5556 61.6417C90.5556 61.6417 87.5445 56.5486 88.8333 48.7972C90.4945 34.2806 77.0042 32.2111 79.8806 32.9L79.4083 32.7181L47.1903 31.9069C45.8986 31.8736 44.607 31.9278 43.3236 32.0681L32.3361 33.2653M10.8195 30.9306C13.5833 34.4542 16.35 34.4542 16.35 34.4542" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M26.3542 28.7431C28.3236 32.6917 23.9403 34.7181 23.9403 34.7181C23.9403 34.7181 20.1667 29.4708 16.35 34.4542L13.4875 37.9264C13.4875 37.9264 10.5556 42.7458 8.5014 45.5125C7.93056 46.2819 8.95973 48.8805 9.45417 49.7055C10.3708 51.2403 16.8875 52.1861 22.9583 50C22.9583 50 28.0208 50.4542 28.9722 59.8056C29.1542 61.5847 32.775 63.9958 35.7556 63.6" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M43.125 44.2542L45.2514 55.5847L41.7292 76.5945C41.557 77.9597 40.4417 78.9917 39.107 79.0195L38.6806 79.0278C36.8292 79.0667 35.4889 77.2264 36.0528 75.407C37.2 71.707 37.4167 65.725 35.7181 61.6417C33.7764 56.9778 34.6723 54.7542 34.6723 54.7542" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M25.9083 43.7569C32.5139 45.9139 32.8458 40.3431 32.8458 40.3431V39.9847C29.6319 36.1514 26.6569 38.9056 26.6569 38.9056" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </div>


        <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8.64197 45.679L11.7284 40.7407L17.2839 33.3333L20.1106 32.5L22.5 33.3333L24.6914 34.5679L44.4444 32.0988L78.75 32.5L83.3333 34.5679L87.5 38.75L88.8889 45.0617L88.75 55L82.0988 58.642V60.4938V64.1975L80.8642 76.5432L79.6296 78.395H77.7778L75.9259 77.7778L75.4349 77.5H73.75L72.2222 77.1605L71.25 75L73.75 63.75L71.6049 59.2592L67.5 61.25L58.642 62.3457L50 61.7284L45.679 61.25V70.3704L45.3944 76.25L44.4444 77.7778L41.9753 78.395L40.7407 77.7778L38.75 78.75L35.9225 77.5L36.4197 72.8395L37.5 67.5L35.8025 63.5802L35 63.75L32.0988 62.9629L29.6296 61.1111L27.5 53.75L25.3086 51.25L22.5 50L17.2839 51.2346L11.25 51.25L8.74998 48.75L8.64197 45.679Z" fill={color}/>
            
            <path d="M45.0618 56.1728L45.5663 75.703C45.6098 77.0784 44.6697 78.2721 43.3557 78.5084L42.9359 78.5833C42.2114 78.7137 41.5201 78.5381 40.9674 78.1608" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M81.3727 45.7455C82.697 48.5697 83.1495 53.4452 82.1733 57.4565L82.431 64.7073L81.0462 75.8243C80.8982 77.0063 80.0334 77.9511 78.8964 78.1721L78.5446 78.2405C77.5961 78.4249 76.6956 78.0787 76.0868 77.4357" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M82.0988 57.4074L80.2802 65.7289L76.7996 76.3775C76.4288 77.5094 75.3996 78.2719 74.2413 78.2719H73.883C72.0469 78.2719 70.7469 76.4247 71.3163 74.6233L73.5746 64.9192C73.5746 64.9192 67.8344 54.2789 69.4094 49.3469" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M49.65 61.8069C49.65 61.8069 66.45 63.6278 71.0083 59.8069M90.5556 61.6417C90.5556 61.6417 87.5445 56.5486 88.8333 48.7972C90.4945 34.2806 77.0042 32.2111 79.8806 32.9L79.4083 32.7181L47.1903 31.9069C45.8986 31.8736 44.607 31.9278 43.3236 32.0681L32.3361 33.2653M10.8195 30.9306C13.5833 34.4542 16.35 34.4542 16.35 34.4542" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M26.3542 28.7431C28.3236 32.6917 23.9403 34.7181 23.9403 34.7181C23.9403 34.7181 20.1667 29.4708 16.35 34.4542L13.4875 37.9264C13.4875 37.9264 10.5556 42.7458 8.5014 45.5125C7.93056 46.2819 8.95973 48.8805 9.45417 49.7055C10.3708 51.2403 16.8875 52.1861 22.9583 50C22.9583 50 28.0208 50.4542 28.9722 59.8056C29.1542 61.5847 32.775 63.9958 35.7556 63.6" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M43.125 44.2542L45.2514 55.5847L41.7292 76.5945C41.557 77.9597 40.4417 78.9917 39.107 79.0195L38.6806 79.0278C36.8292 79.0667 35.4889 77.2264 36.0528 75.407C37.2 71.707 37.4167 65.725 35.7181 61.6417C33.7764 56.9778 34.6723 54.7542 34.6723 54.7542" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M25.9083 43.7569C32.5139 45.9139 32.8458 40.3431 32.8458 40.3431V39.9847C29.6319 36.1514 26.6569 38.9056 26.6569 38.9056" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    </>
}

export default function Cow({defaultColor = "cyan", initialFullness = 1}) {

    const [cowID, setCowID] = useState(uuidv4());
    const {isMilking, isFeeding} = useContext(PastureStateContext);

    const [color, setColor] = useState(defaultColor);

    const [cowState, setCowState] = useState("producing milk")
    const [fullness, setFullness] = useState(initialFullness);

    // console.log(cowState)

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
