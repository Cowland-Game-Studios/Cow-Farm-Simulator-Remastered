import styles from "./cow.module.css";
import DraggableSwinging from "../draggableSwinging/draggableSwinging";
import { useContext, useEffect, useState, useRef, useCallback, useMemo } from "react";
import PastureStateContext from "../../contexts/PastureStateContext";
import { v4 as uuidv4 } from 'uuid';
import { CowSVG, CowMilkedSVG, CowToMilkSVG } from "./CowSVG";
import CowListContext from "../../contexts/CowListContext";
import { GAME_CONFIG, averageColors } from "../../config/gameConfig";

// Alias for cleaner code
const COW_CONFIG = GAME_CONFIG.COW;

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
    
    // Ref to track last breeding time for cooldown
    const lastBredAtRef = useRef(0);

    // Sync local state to cowList context when state/fullness changes
    useEffect(() => {
        setCowList(prevList => 
            prevList.map(cow => 
                cow.id === cowID 
                    ? { ...cow, state: cowState, fullness: fullness }
                    : cow
            )
        );
    }, [cowState, fullness, cowID, setCowList]);

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

    // Memoized collision detection helper - stable reference since cowID never changes
    const isTouching = useMemo(() => {
        return (targetID, maxDistance = COW_CONFIG.TOUCH_DISTANCE_THRESHOLD) => {
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
        };
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

    // Random movement effect - only when producing milk (not hungry, not full)
    useEffect(() => {
        // Full cows stay still (ready to be milked/bred)
        if (cowState === "full") {
            setCowOffset({ x: 0, y: 0 });
            return;
        }

        // Hungry cows stay still
        if (cowState === "hungry") {
            return;
        }

        const moveRandomly = () => {
            const randomX = Math.random() * COW_CONFIG.MOVE_MAX_DISTANCE - COW_CONFIG.MOVE_MAX_DISTANCE / 2;
            const randomY = Math.random() * COW_CONFIG.MOVE_MAX_DISTANCE - COW_CONFIG.MOVE_MAX_DISTANCE / 2;

            setCowOffset({ x: randomX, y: randomY });
            setCowFlipHorizontal(randomX > 0);

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

    // Breeding logic with cooldown
    const canBreed = () => {
        if (cowState !== "full") return false;
        
        // Check breeding cooldown
        const now = Date.now();
        if (now - lastBredAtRef.current < COW_CONFIG.BREEDING_COOLDOWN_MS) {
            return false;
        }
        return true;
    };

    const ifTouchingBreed = () => {
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

        // Only breed with first touching cow (prevents multiple births)
        for (const cow of cowList) {
            if (cow.id === cowID) {
                continue;
            }

            if (isTouching(cow.id)) {
                const spawnPosition = getMidpoint(cowID, cow.id);

                const newCow = {
                    id: uuidv4(),
                    color: averageColors(cow.color, color),
                    state: "hungry",
                    fullness: COW_CONFIG.INITIAL_FULLNESS_HUNGRY,
                    initialPosition: spawnPosition
                };

                // Set cooldown timestamp
                lastBredAtRef.current = Date.now();

                setCowState("hungry");
                setFullness(COW_CONFIG.INITIAL_FULLNESS_HUNGRY);

                setCowList(prevCowList => [...prevCowList, newCow]);
                
                // Only breed once per drop
                return;
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

                    <div className={styles.cowContainer}>
                        <div
                            style={{
                                transform: `scaleX(${cowFlipHorizontal ? -1 : 1}) scale(${getCowScale()})`,
                                transition: "all 0.25s ease-in-out",
                            }}
                        >
                            {cowState === "hungry" && (
                                <CowMilkedSVG color={color} />
                            )}
                            {cowState === "producing milk" && (
                                <CowSVG color={color} fullness={fullness} pollInterval={COW_CONFIG.FULLNESS_POLL_INTERVAL_MS} />
                            )}
                            {cowState === "full" && (
                                <CowToMilkSVG color={color} />
                            )}
                        </div>
                    </div>
                </DraggableSwinging>
            </div>
        </div>
    );
}
