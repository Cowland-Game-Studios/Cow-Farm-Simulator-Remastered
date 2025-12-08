/**
 * Pasture - Main Game Screen
 * 
 * Uses the centralized game engine:
 * - Gets state from GameProvider context
 * - No local state duplication
 * - Clean separation of concerns
 */

import styles from "./pasture.module.css";
import Dock from "../components/dock/dock";
import Button from "../components/button/button";
import Cow from "../components/cow/cow";
import DraggableSwinging from "../components/draggableSwinging/draggableSwinging";
import QuestMenu from "../components/questMenu/questMenu";
import StatsDisplay from "../components/statsDisplay";
import ParticleRenderer from "../components/particles/ParticleRenderer";
import Crafting from "./crafting";
import { useGame, useMousePosition, particleSystem } from "../engine";
import { useEffect, useCallback, useMemo } from "react";
import { GAME_CONFIG } from "../config/gameConfig";

export default function Pasture() {
    // ---- Get state and actions from context ----
    const { 
        cows,
        tools,
        resources,
        ui,
        startMilking,
        startFeeding,
        updateToolPosition,
        openCrafting,
        closeCrafting,
        milkCow,
        feedCow,
    } = useGame();
    
    const mousePosition = useMousePosition();

    // ---- Get cow IDs for collision detection ----
    const fullCowIds = useMemo(() => 
        cows.filter(cow => cow.state === 'full').map(cow => cow.id),
        [cows]
    );
    
    const hungryCowIds = useMemo(() => 
        cows.filter(cow => cow.state === 'hungry').map(cow => cow.id),
        [cows]
    );

    // ---- Collision handler for milking (bucket collides with full cow) ----
    const handleMilkCollide = useCallback((cowId, position) => {
        const cow = cows.find(c => c.id === cowId);
        if (cow && cow.state === 'full') {
            milkCow(cowId);
            // Spawn +1 particle at collision position
            particleSystem.spawnMilkParticle(position.x, position.y - 30);
        }
    }, [cows, milkCow]);

    // ---- Collision handler for feeding (feed collides with hungry cow) ----
    const handleFeedCollide = useCallback((cowId, position) => {
        const cow = cows.find(c => c.id === cowId);
        if (cow && cow.state === 'hungry') {
            feedCow(cowId);
            // Spawn -1 particle that floats up and falls with gravity
            particleSystem.spawnFeedParticle(position.x, position.y - 30);
        }
    }, [cows, feedCow]);

    // ---- Update tool position when dragging ----
    useEffect(() => {
        if (tools.milking || tools.feeding) {
            updateToolPosition(mousePosition);
        }
    }, [mousePosition, tools.milking, tools.feeding, updateToolPosition]);

    // ---- Render ----
    return (
        <>
            {ui.crafting && <Crafting onClose={closeCrafting} />}

            {/* Particle effects layer */}
            <ParticleRenderer />

            <div className={styles.pasture}>
                {/* Render all cows */}
                {cows.map((cow) => (
                    <Cow key={cow.id} cowId={cow.id} />
                ))}

                <div className={styles.UI}>
                    {/* Milking bucket tool */}
                    <DraggableSwinging 
                        id="bucket" 
                        isActive={tools.milking} 
                        ropeLength={GAME_CONFIG.PHYSICS.BUCKET_ROPE_LENGTH} 
                        gravity={GAME_CONFIG.PHYSICS.BUCKET_GRAVITY} 
                        damping={GAME_CONFIG.PHYSICS.BUCKET_DAMPING}
                        collisionTargets={fullCowIds}
                        onCollide={handleMilkCollide}
                    >
                        <div>
                            <img draggable={false} src="./images/pasture/bucket.svg" alt="Milk bucket" />
                        </div>
                    </DraggableSwinging>

                    {/* Feeding tool */}
                    <DraggableSwinging 
                        id="feed" 
                        isActive={tools.feeding} 
                        ropeLength={GAME_CONFIG.PHYSICS.FEED_ROPE_LENGTH} 
                        gravity={GAME_CONFIG.PHYSICS.FEED_GRAVITY} 
                        damping={GAME_CONFIG.PHYSICS.FEED_DAMPING}
                        collisionTargets={hungryCowIds}
                        onCollide={handleFeedCollide}
                    >
                        <div>
                            <img draggable={false} src="./images/pasture/grass.svg" alt="Cow feed" />
                            <p style={{ position: "absolute", left: 30, top: 35 }}>3x</p>
                        </div>
                    </DraggableSwinging>

                    {/* Quest Menu (bottom left) */}
                    <QuestMenu />

                    {/* Stats Display (top right) */}
                    <StatsDisplay 
                        coins={resources.coins} 
                        xp={Math.floor(resources.stars * 1000)} 
                    />

                    {/* Bottom dock - Tools */}
                    <Dock style={{ bottom: 25 }}>
                        <Button 
                            text="collect" 
                            image="./images/buttons/bucketIcon.svg" 
                            hidden={tools.milking}
                            onMouseDown={startMilking}
                        />
                        <Button 
                            text="feed" 
                            image="./images/buttons/grassIcon.svg" 
                            hidden={tools.feeding}
                            onMouseDown={startFeeding}
                        />
                        <Button 
                            text="make" 
                            image="./images/buttons/milkIcon.svg" 
                            onMouseDown={openCrafting}
                        />
                        <Button 
                            text="shop" 
                            image="./images/buttons/shopIcon.svg"
                        />
                    </Dock>
                </div>
            </div>
        </>
    );
}
