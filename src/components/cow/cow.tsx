/**
 * Cow Component
 * 
 * Uses the centralized game engine:
 * - Gets state from GameProvider context
 * - Tool collisions handled by DraggableSwinging in pasture.js
 * - DOM-based collision for breeding only (on drop)
 */

import React, { useEffect, useState, useRef, useCallback } from "react";
import styles from "./cow.module.css";
import DraggableSwinging from "../draggableSwinging/draggableSwinging";
import { CowSVG, CowMilkedSVG, CowToMilkSVG } from "./CowSVG";
import { 
    useGame, 
    colorToString,
    particleSystem,
    Position,
} from "../../engine";
import { GAME_CONFIG } from "../../config/gameConfig";

const COW_CONFIG = GAME_CONFIG.COW;

interface CowProps {
    /** Unique identifier for the cow (UUID) */
    cowId: string;
}

export default function Cow({ cowId }: CowProps): React.ReactElement | null {
    // ---- Get cow data from central state ----
    const { state, breedCows, updateCowPosition, setDraggingCow, clearDraggingCow, draggingCow, chaosImpulses, clearCowImpulse } = useGame();
    const cow = state.cows.find(c => c.id === cowId);
    
    // ---- Chaos mode impulse ----
    const cowImpulse = chaosImpulses?.[cowId] || null;
    
    // ---- Local visual state (not saved) ----
    const [cowOffset, setCowOffset] = useState<Position>({ x: 0, y: 0 });
    const [cowFlipHorizontal, setCowFlipHorizontal] = useState(false);
    const [isPulsing, setIsPulsing] = useState(false);
    const [isBreedTarget, setIsBreedTarget] = useState(false);
    const [isBeingDragged, setIsBeingDragged] = useState(false);
    const moveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const pulseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const pickupPositionRef = useRef<Position | null>(null);
    const breedCheckThrottleRef = useRef<number>(0); // Timestamp of last breed target check

    // ---- DOM-based collision detection (for breeding only) ----
    const isTouchingCow = useCallback((otherCowId: string, maxDistance: number = COW_CONFIG.TOUCH_DISTANCE_THRESHOLD): boolean => {
        const cowRect = document.getElementById(cowId)?.getBoundingClientRect();
        const targetRect = document.getElementById(otherCowId)?.getBoundingClientRect();

        if (!cowRect || !targetRect) return false;

        const cowCenter = {
            x: cowRect.x + cowRect.width / 2,
            y: cowRect.y + cowRect.height / 2,
        };

        const targetCenter = {
            x: targetRect.x + targetRect.width / 2,
            y: targetRect.y + targetRect.height / 2,
        };

        const distance = Math.sqrt(
            Math.pow(cowCenter.x - targetCenter.x, 2) + 
            Math.pow(cowCenter.y - targetCenter.y, 2)
        );

        return distance < maxDistance;
    }, [cowId]);

    // ---- Random movement (only when producing) ----
    const cowState = cow?.state;
    useEffect(() => {
        if (!cowState) return;
        
        // Full cows stay still
        if (cowState === 'full') {
            setCowOffset({ x: 0, y: 0 });
            return;
        }

        // Hungry cows stay still
        if (cowState === 'hungry') {
            setCowOffset({ x: 0, y: 0 });
            return;
        }

        // Only producing cows wander
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
    }, [cowState]); // Only re-run when cow state actually changes

    // ---- "Ready to milk" pulse animation (only when full) ----
    useEffect(() => {
        if (cowState !== 'full') {
            setIsPulsing(false);
            return;
        }

        const triggerPulse = () => {
            setIsPulsing(true);
            // Remove class after animation completes
            setTimeout(() => setIsPulsing(false), COW_CONFIG.PULSE_DURATION_MS);
            
            // Schedule next pulse (random interval)
            const pulseInterval = COW_CONFIG.PULSE_MIN_INTERVAL_MS + 
                Math.random() * (COW_CONFIG.PULSE_MAX_INTERVAL_MS - COW_CONFIG.PULSE_MIN_INTERVAL_MS);
            pulseTimeoutRef.current = setTimeout(triggerPulse, pulseInterval);
        };

        // Start first pulse after a short delay
        const initialDelay = COW_CONFIG.PULSE_INITIAL_DELAY_MIN_MS + 
            Math.random() * (COW_CONFIG.PULSE_INITIAL_DELAY_MAX_MS - COW_CONFIG.PULSE_INITIAL_DELAY_MIN_MS);
        pulseTimeoutRef.current = setTimeout(triggerPulse, initialDelay);

        return () => {
            if (pulseTimeoutRef.current) {
                clearTimeout(pulseTimeoutRef.current);
            }
        };
    }, [cowState]);

    // ---- Clear chaos impulse after it's been applied ----
    useEffect(() => {
        if (cowImpulse) {
            // Small delay to ensure DraggableSwinging receives it
            const timeout = setTimeout(() => {
                clearCowImpulse(cowId);
            }, 100);
            return () => clearTimeout(timeout);
        }
    }, [cowImpulse, cowId, clearCowImpulse]);

    // ---- Check if this cow is a breed target (another full cow is being dragged near) ----
    // Throttled to 60ms (~16fps) to reduce DOM query overhead during rapid mouse movements
    useEffect(() => {
        if (!cow || !draggingCow.cowId || !draggingCow.position) {
            setIsBreedTarget(false);
            return;
        }

        // Don't show for self
        if (draggingCow.cowId === cowId) {
            setIsBreedTarget(false);
            return;
        }

        // Only full cows can be breed targets
        if (cow.state !== 'full') {
            setIsBreedTarget(false);
            return;
        }

        // Check if the dragging cow is also full
        const draggingCowData = state.cows.find(c => c.id === draggingCow.cowId);
        if (!draggingCowData || draggingCowData.state !== 'full') {
            setIsBreedTarget(false);
            return;
        }

        // Throttle DOM queries to ~60ms intervals (reduces layout thrashing)
        const now = Date.now();
        if (now - breedCheckThrottleRef.current < 60) {
            return; // Skip this update, keeping previous isBreedTarget state
        }
        breedCheckThrottleRef.current = now;

        // Check distance using DOM
        const myRect = document.getElementById(cowId)?.getBoundingClientRect();
        if (!myRect) {
            setIsBreedTarget(false);
            return;
        }

        const myCenter = {
            x: myRect.x + myRect.width / 2,
            y: myRect.y + myRect.height / 2,
        };

        const distance = Math.sqrt(
            Math.pow(draggingCow.position.x - myCenter.x, 2) +
            Math.pow(draggingCow.position.y - myCenter.y, 2)
        );

        // Show hover effect when within breeding threshold
        setIsBreedTarget(distance < COW_CONFIG.TOUCH_DISTANCE_THRESHOLD * 1.5);
    }, [cow, cowId, draggingCow, state.cows]);

    // ---- Handle pickup (track starting position) ----
    const onPickup = useCallback(() => {
        setIsBeingDragged(true);
        const cowRect = document.getElementById(cowId)?.getBoundingClientRect();
        if (cowRect) {
            const position = {
                x: cowRect.x + cowRect.width / 2,
                y: cowRect.y + cowRect.height / 2,
            };
            pickupPositionRef.current = position;
            // Report dragging for all cows (for cursor hiding + breeding for full cows)
            setDraggingCow(cowId, position);
        }
    }, [cowId, setDraggingCow]);

    // ---- Handle position change during drag (for breeding hover) ----
    const onPositionChange = useCallback((position: Position) => {
        if (!cow || !isBeingDragged) return;
        
        // Report dragging position for all cows
        setDraggingCow(cowId, position);
    }, [cow, cowId, setDraggingCow, isBeingDragged]);

    // ---- Handle drop (breeding check) ----
    const onDrop = useCallback((dropPosition: Position) => {
        if (!cow) return;
        
        // Clear dragging state
        setIsBeingDragged(false);
        clearDraggingCow();
        
        // Update position in state
        updateCowPosition(cowId, dropPosition);
        
        // Reset for next interaction
        pickupPositionRef.current = null;

        // Only full cows can breed
        if (cow.state !== 'full') return;

        // Check cooldown
        const now = Date.now();
        if (now - cow.lastBredAt < COW_CONFIG.BREEDING_COOLDOWN_MS) return;

        // Check for collisions with other full cows using DOM
        for (const otherCow of state.cows) {
            if (otherCow.id === cowId) continue;
            if (otherCow.state !== 'full') continue;
            
            if (isTouchingCow(otherCow.id)) {
                // Get midpoint for spawn position
                const cowRect = document.getElementById(cowId)?.getBoundingClientRect();
                const otherRect = document.getElementById(otherCow.id)?.getBoundingClientRect();
                
                if (cowRect && otherRect) {
                    const spawnPosition = {
                        x: (cowRect.x + cowRect.width/2 + otherRect.x + otherRect.width/2) / 2,
                        y: (cowRect.y + cowRect.height/2 + otherRect.y + otherRect.height/2) / 2,
                    };
                    breedCows(cowId, otherCow.id, spawnPosition);
                    // Spawn "+1 cow" particle at breed location
                    particleSystem.spawnBreedParticle(spawnPosition.x, spawnPosition.y - 30);
                    return; // Only breed once
                }
            }
        }
    }, [cowId, cow, state.cows, breedCows, updateCowPosition, isTouchingCow, clearDraggingCow]);

    // ---- Early return AFTER all hooks ----
    if (!cow) return null;

    // ---- Derived values ----
    const { color, fullness, position } = cow;
    const colorString = colorToString(color);

    // ---- Calculate scale based on state ----
    const getCowScale = (): number => {
        if (cowState === 'full') return COW_CONFIG.SCALE_FULL;
        if (cowState === 'hungry') return COW_CONFIG.SCALE_HUNGRY;
        return COW_CONFIG.SCALE_NORMAL;
    };

    // ---- Render ----
    return (
        <div>
            <div
                style={{
                    transform: `translate(${cowOffset.x}px, ${cowOffset.y}px)`,
                    transition: "all 1s ease-in-out",
                }}
            >
                <DraggableSwinging 
                    onPickup={onPickup}
                    onDrop={onDrop}
                    onPositionChange={onPositionChange}
                    id={cowId} 
                    ropeLength={GAME_CONFIG.PHYSICS.COW_ROPE_LENGTH} 
                    gravity={GAME_CONFIG.PHYSICS.COW_GRAVITY} 
                    damping={GAME_CONFIG.PHYSICS.COW_DAMPING} 
                    initialPosition={position}
                    impulse={cowImpulse}
                >
                    {/* Thought bubble */}
                    <div style={{
                        position: "absolute",
                        top: -5,
                        left: 50,
                        transition: "all 1s ease-in-out",
                    }}>
                        {state.tools.milking && cowState === 'full' && (
                            <img src="./images/cows/thinkMilk.svg" draggable={false} className={styles.bucket} style={{ marginTop: -45 }} alt="Thinking about milk" />
                        )}
                        {state.tools.feeding && cowState === 'hungry' && (
                            <img src="./images/cows/thinkFood.svg" draggable={false} className={styles.bucket} style={{ marginTop: -5}} alt="Thinking about food" />
                        )}
                    </div>

                    {/* Cow sprite */}
                    <div 
                        className={`${styles.cowContainer} ${isPulsing ? styles.readyPulse : ''} ${isBreedTarget ? styles.breedTarget : ''}`}
                    >
                        <div
                            style={{
                                transform: `scaleX(${cowFlipHorizontal ? -1 : 1}) scale(${getCowScale()})`,
                                transition: "all 0.25s ease-in-out",
                            }}
                        >
                            {cowState === 'hungry' && (
                                <CowMilkedSVG color={colorString} />
                            )}
                            {cowState === 'producing' && (
                                <CowSVG color={colorString} fullness={fullness} pollInterval={COW_CONFIG.FULLNESS_POLL_INTERVAL_MS} />
                            )}
                            {cowState === 'full' && (
                                <CowToMilkSVG color={colorString} />
                            )}
                        </div>
                    </div>
                </DraggableSwinging>
            </div>
        </div>
    );
}

