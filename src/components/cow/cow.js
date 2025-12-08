/**
 * Cow Component
 * 
 * Uses the centralized game engine:
 * - Gets state from GameProvider context
 * - Tool collisions handled by DraggableSwinging in pasture.js
 * - DOM-based collision for breeding only (on drop)
 */

import PropTypes from 'prop-types';
import styles from "./cow.module.css";
import DraggableSwinging from "../draggableSwinging/draggableSwinging";
import { useEffect, useState, useRef, useCallback } from "react";
import { CowSVG, CowMilkedSVG, CowToMilkSVG } from "./CowSVG";
import { 
    useGame, 
    colorToString,
    particleSystem,
} from "../../engine";
import { GAME_CONFIG } from "../../config/gameConfig";

const COW_CONFIG = GAME_CONFIG.COW;

export default function Cow({ cowId }) {
    // ---- Get cow data from central state ----
    const { state, breedCows, updateCowPosition } = useGame();
    const cow = state.cows.find(c => c.id === cowId);
    
    // ---- Local visual state (not saved) ----
    const [cowOffset, setCowOffset] = useState({ x: 0, y: 0 });
    const [cowFlipHorizontal, setCowFlipHorizontal] = useState(false);
    const moveTimeoutRef = useRef(null);

    // ---- DOM-based collision detection (for breeding only) ----
    const isTouchingCow = useCallback((otherCowId, maxDistance = COW_CONFIG.TOUCH_DISTANCE_THRESHOLD) => {
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

    // ---- Handle drop (breeding check) ----
    const onDrop = useCallback((dropPosition) => {
        if (!cow) return;
        
        // Update position in state
        updateCowPosition(cowId, dropPosition);

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
    }, [cowId, cow, state.cows, breedCows, updateCowPosition, isTouchingCow]);

    // ---- Early return AFTER all hooks ----
    if (!cow) return null;

    // ---- Derived values ----
    const { color, fullness, position } = cow;
    const colorString = colorToString(color);

    // ---- Calculate scale based on state ----
    const getCowScale = () => {
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
                    onDrop={onDrop}
                    id={cowId} 
                    ropeLength={GAME_CONFIG.PHYSICS.COW_ROPE_LENGTH} 
                    gravity={GAME_CONFIG.PHYSICS.COW_GRAVITY} 
                    damping={GAME_CONFIG.PHYSICS.COW_DAMPING} 
                    initialPosition={position}
                >
                    {/* Thought bubble */}
                    <div style={{
                        position: "absolute",
                        top: -5,
                        left: 50,
                        transition: "all 1s ease-in-out",
                    }}>
                        {state.tools.milking && cowState === 'full' && (
                            <img src="./images/cows/thinkMilk.svg" draggable={false} className={styles.bucket} alt="Thinking about milk" />
                        )}
                        {state.tools.feeding && cowState === 'hungry' && (
                            <img src="./images/cows/thinkFood.svg" draggable={false} className={styles.bucket} alt="Thinking about food" />
                        )}
                    </div>

                    {/* Cow sprite */}
                    <div className={styles.cowContainer}>
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

Cow.propTypes = {
    /** Unique identifier for the cow (UUID) */
    cowId: PropTypes.string.isRequired,
};
