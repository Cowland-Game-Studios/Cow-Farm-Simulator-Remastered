import styles from "./cow.module.css";
import DraggableSwinging from "../draggableSwinging/draggableSwinging";
import { useContext, useEffect, useState, useRef, useCallback } from "react";
import PastureStateContext from "../../contexts/PastureStateContext";
import { v4 as uuidv4 } from 'uuid';
import { CowSVG, CowMilkedSVG } from "./CowSVG";
import CowListContext, { opacity } from "../../contexts/CowListContext";

// Game constants
const COW_CONFIG = {
    MILK_PRODUCTION_TIME_MS: 30000,      // Time to fully produce milk
    FULLNESS_POLL_INTERVAL_MS: 1000,     // How often to update fullness
    TOUCH_CHECK_INTERVAL_MS: 100,        // How often to check for bucket touch
    TOUCH_DISTANCE_THRESHOLD: 50,        // Pixels for collision detection
    MOVE_MAX_DISTANCE: 100,              // Max random movement distance
    MOVE_DISTANCE_FULL_MULTIPLIER: 0.25, // Movement reduction when full
    MOVE_INTERVAL_MAX_MS: 10000,         // Max time between random moves
    INITIAL_FULLNESS_HUNGRY: 0.1,        // Fullness when hungry
    INITIAL_FULLNESS_PRODUCING: 0.25,    // Fullness when starting production
    SCALE_FULL: 1.1,                     // Scale when cow is full
    SCALE_HUNGRY: 0.8,                   // Scale when cow is hungry
    SCALE_NORMAL: 1,                     // Normal scale
};

export default function Cow({ id = uuidv4(), initialState = "hungry", initialColor = "cyan", initialFullness = 0.1, initialPosition = null }) {

    const cowID = id;  // No need for state since ID doesn't change
    const { isMilking, isFeeding } = useContext(PastureStateContext);
    const { cowList, setCowList } = useContext(CowListContext);

    const color = initialColor;  // Color only changes through breeding (new cow created)

    const [cowState, setCowState] = useState(initialState);
    const [fullness, setFullness] = useState(initialFullness);

    const [cowOffset, setCowOffset] = useState({ x: 0, y: 0 });
    const [cowFlipHorizontal, setCowFlipHorizontal] = useState(false);

    // Ref to track timeout for random movement cleanup
    const moveTimeoutRef = useRef(null);

    // Milk production effect
    useEffect(() => {
        if (cowState !== "producing milk") {
            return;
        }

        const pollFullness = () => {
            setFullness(prevFullness => 
                prevFullness + 1 / (COW_CONFIG.MILK_PRODUCTION_TIME_MS / COW_CONFIG.FULLNESS_POLL_INTERVAL_MS)
            );
        };

        const interval = setInterval(pollFullness, COW_CONFIG.FULLNESS_POLL_INTERVAL_MS);
        pollFullness();

        return () => clearInterval(interval);
    }, [cowState]);

    // Check if cow is full
    useEffect(() => {
        if (fullness >= 1) {
            setCowState("full");
        }
    }, [fullness]);

    // Collision detection helper
    const isTouching = useCallback((targetID, maxDistance = COW_CONFIG.TOUCH_DISTANCE_THRESHOLD) => {
        const cowRect = document.getElementById(cowID)?.getBoundingClientRect();
        const targetRect = document.getElementById(targetID)?.getBoundingClientRect();

        if (!cowRect || !targetRect) {
            return false;
        }

        const cowCenter = {
            x: cowRect.x + cowRect.width / 2,
            y: cowRect.y + cowRect.height / 2,
        };

        const targetCenter = {
            x: targetRect.x + targetRect.width / 2,
            y: targetRect.y + targetRect.height / 2,
        };

        const distance = Math.sqrt(
            Math.pow(cowCenter.x - targetCenter.x, 2) + Math.pow(cowCenter.y - targetCenter.y, 2)
        );

        return distance < maxDistance;
    }, [cowID]);

    // Milking and feeding interaction effect
    useEffect(() => {
        if (cowState === "producing milk") {
            return;
        }

        if (!isMilking && !isFeeding) {
            return;
        }

        const intervalId = setInterval(() => {
            // Check for bucket (milking) or feed (feeding) based on current action
            const targetId = isMilking ? "bucket" : "feed";
            
            if (isTouching(targetId)) {
                if (isMilking && cowState === "full") {
                    setCowState("hungry");
                    setFullness(COW_CONFIG.INITIAL_FULLNESS_HUNGRY);
                    clearInterval(intervalId);
                } else if (isFeeding && cowState === "hungry") {
                    setCowState("producing milk");
                    setFullness(COW_CONFIG.INITIAL_FULLNESS_PRODUCING);
                    clearInterval(intervalId);
                }
            }
        }, COW_CONFIG.TOUCH_CHECK_INTERVAL_MS);

        return () => clearInterval(intervalId);
    }, [isMilking, isFeeding, cowState, isTouching]);

    // Random movement effect (fixed from useState misuse)
    useEffect(() => {
        const moveRandomly = () => {
            const moveDistance = COW_CONFIG.MOVE_MAX_DISTANCE * 
                (cowState !== "full" ? 1 : COW_CONFIG.MOVE_DISTANCE_FULL_MULTIPLIER);

            if (cowState !== "hungry") {
                const randomX = Math.random() * moveDistance - moveDistance / 2;
                const randomY = Math.random() * moveDistance - moveDistance / 2;

                setCowOffset({ x: randomX, y: randomY });
                setCowFlipHorizontal(randomX > 0);
            }

            moveTimeoutRef.current = setTimeout(
                moveRandomly,
                Math.random() * COW_CONFIG.MOVE_INTERVAL_MAX_MS
            );
        };

        moveRandomly();

        return () => {
            if (moveTimeoutRef.current) {
                clearTimeout(moveTimeoutRef.current);
            }
        };
    }, [cowState]);

    // Breeding logic
    const canBreed = () => {
        return cowState === "full";
    };

    const ifTouchingBreed = () => {
        // Average two RGBA color strings
        const averageTwoRGB = (rgb1, rgb2) => {
            const rgb1Array = rgb1.substring(5, rgb1.length - 1).split(",");
            const rgb2Array = rgb2.substring(5, rgb2.length - 1).split(",");

            const averageArray = rgb1Array.map((value, index) => {
                return (parseInt(value) + parseInt(rgb2Array[index])) / 2;
            });

            return `rgba(${averageArray[0]}, ${averageArray[1]}, ${averageArray[2]}, ${opacity})`;
        };

        // Get midpoint between two cows
        const getMidpoint = (id1, id2) => {
            const rect1 = document.getElementById(id1)?.getBoundingClientRect();
            const rect2 = document.getElementById(id2)?.getBoundingClientRect();

            if (!rect1 || !rect2) return null;

            const center1 = { x: rect1.x + rect1.width / 2, y: rect1.y + rect1.height / 2 };
            const center2 = { x: rect2.x + rect2.width / 2, y: rect2.y + rect2.height / 2 };

            return {
                x: (center1.x + center2.x) / 2,
                y: (center1.y + center2.y) / 2
            };
        };

        for (const cow of cowList) {
            if (cow.id === cowID) {
                continue;
            }

            if (isTouching(cow.id)) {
                const spawnPosition = getMidpoint(cowID, cow.id);

                const newCow = {
                    id: uuidv4(),
                    color: averageTwoRGB(cow.color, color),
                    state: "hungry",
                    initialPosition: spawnPosition
                };

                setCowState("hungry");
                setFullness(COW_CONFIG.INITIAL_FULLNESS_HUNGRY);

                setCowList(prevCowList => [...prevCowList, newCow]);
            }
        }
    };

    const onDrop = () => {
        if (canBreed()) {
            ifTouchingBreed();
        }
    };

    // Calculate scale based on cow state
    const getCowScale = () => {
        if (cowState === "full") return COW_CONFIG.SCALE_FULL;
        if (cowState === "hungry") return COW_CONFIG.SCALE_HUNGRY;
        return COW_CONFIG.SCALE_NORMAL;
    };

    return (
        <div>
            <div
                style={{
                    transform: `translate(${cowOffset.x}px, ${cowOffset.y}px)`,
                    transition: "all 1s ease-in-out",
                }}
            >
                <DraggableSwinging onDrop={onDrop} id={cowID} ropeLength={35} gravity={0.6} damping={0.97} initialPosition={initialPosition}>
                    <div style={{
                        position: "absolute",
                        top: -5,
                        left: 50,
                        transition: "all 1s ease-in-out",
                    }}>
                        {isMilking && cowState === "full" && (
                            <img src="./images/cows/thinkMilk.svg" draggable={false} className={styles.bucket} alt="Thinking about milk" />
                        )}
                        {isFeeding && cowState === "hungry" && (
                            <img src="./images/cows/thinkFood.svg" draggable={false} className={styles.bucket} alt="Thinking about food" />
                        )}
                    </div>

                    <div
                        style={{
                            transform: `scaleX(${cowFlipHorizontal ? -1 : 1}) scale(${getCowScale()})`,
                            transition: "all 0.25s ease-in-out",
                        }}
                    >
                        {cowState === "hungry" ? (
                            <CowMilkedSVG color={color} />
                        ) : (
                            <CowSVG color={color} fullness={fullness} pollInterval={COW_CONFIG.FULLNESS_POLL_INTERVAL_MS} />
                        )}
                    </div>
                </DraggableSwinging>
            </div>
        </div>
    );
}
