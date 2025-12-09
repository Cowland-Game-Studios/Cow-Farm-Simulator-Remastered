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
import Cownsole from "../components/cownsole/cownsole";
import IconDock from "../components/iconDock";
import { useGame, useMousePosition, useInventory, particleSystem } from "../engine";
import React, { useEffect, useCallback, useMemo, useState, useRef } from "react";
import { GAME_CONFIG } from "../config/gameConfig";
import { Position } from "../engine/types";

export default function Pasture(): React.ReactElement {
    // ---- Get state and actions from context ----
    const { 
        cows,
        tools,
        resources,
        startMilking,
        startFeeding,
        updateToolPosition,
        milkCow,
        feedCow,
    } = useGame();
    
    const mousePosition = useMousePosition();
    const { inventory } = useInventory();
    
    // ---- Grass availability ----
    const grassCount = inventory.grass || 0;
    const hasGrass = grassCount > 0;
    
    // ---- Crafting menu state ----
    const [showCrafting, setShowCrafting] = useState(false);
    
    // ---- Moo.sh (dev console) state ----
    const [showCownsole, setShowCownsole] = useState(false);

    // ---- Swipe/scroll state for opening crafting ----
    const swipeStartY = useRef<number | null>(null);
    const SWIPE_UP_THRESHOLD = 80;

    // ---- Open crafting on scroll up ----
    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            // Scroll up (negative deltaY) opens crafting
            // Only if not dragging tools
            if (e.deltaY < -50 && !showCrafting && !showCownsole && !tools.milking && !tools.feeding) {
                setShowCrafting(true);
            }
        };

        window.addEventListener('wheel', handleWheel);

        return () => {
            window.removeEventListener('wheel', handleWheel);
        };
    }, [showCrafting, showCownsole, tools.milking, tools.feeding]);
    
    // ---- Open crafting on swipe up (mobile) ----
    useEffect(() => {
        const handleTouchStart = (e: globalThis.TouchEvent) => {
            // Don't start swipe if crafting/cownsole open or tools active
            if (showCrafting || showCownsole || tools.milking || tools.feeding) return;
            
            const target = e.target as HTMLElement;
            
            // Don't trigger on UI elements, cows, or draggables
            if (target.closest('button') || 
                target.closest('[draggable]') || 
                target.closest('.cowContainer') ||
                target.closest('#bucket') ||
                target.closest('#feed')) {
                return;
            }
            
            swipeStartY.current = e.touches[0].clientY;
        };
        
        const handleTouchMove = (e: globalThis.TouchEvent) => {
            if (swipeStartY.current === null) return;
            if (showCrafting || showCownsole || tools.milking || tools.feeding) {
                swipeStartY.current = null;
                return;
            }
        };
        
        const handleTouchEnd = (e: globalThis.TouchEvent) => {
            if (swipeStartY.current === null) return;
            
            const endY = e.changedTouches[0].clientY;
            const deltaY = endY - swipeStartY.current; // Positive = swipe down
            
            // Swipe DOWN opens crafting (pulling down the menu from above)
            if (deltaY > SWIPE_UP_THRESHOLD && !showCrafting && !showCownsole && !tools.milking && !tools.feeding) {
                setShowCrafting(true);
            }
            
            swipeStartY.current = null;
        };
        
        window.addEventListener('touchstart', handleTouchStart, { passive: true });
        window.addEventListener('touchmove', handleTouchMove, { passive: true });
        window.addEventListener('touchend', handleTouchEnd, { passive: true });
        
        return () => {
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [showCrafting, showCownsole, tools.milking, tools.feeding]);

    // ---- Open Moo.sh on "/" key press ----
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger if typing in an input or if other menus are open
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
            if (showCrafting) return;
            
            if (e.key === '/') {
                e.preventDefault();
                setShowCownsole(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [showCrafting]);

    // ---- Toggle Moo.sh from icon dock ----
    const handleTerminalToggle = useCallback(() => {
        setShowCownsole(prev => !prev);
    }, []);

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
    const handleMilkCollide = useCallback((cowId: string, position: Position) => {
        const cow = cows.find(c => c.id === cowId);
        if (cow && cow.state === 'full') {
            milkCow(cowId);
            // Spawn +1 particle at collision position
            particleSystem.spawnMilkParticle(position.x, position.y - 30);
        }
    }, [cows, milkCow]);

    // ---- Collision handler for feeding (feed collides with hungry cow) ----
    const handleFeedCollide = useCallback((cowId: string, position: Position) => {
        const cow = cows.find(c => c.id === cowId);
        // Check if cow is hungry AND we have grass (reducer also validates)
        if (cow && cow.state === 'hungry' && hasGrass) {
            feedCow(cowId);
            // Spawn -1 grass particle that floats up and falls with gravity
            particleSystem.spawnFeedParticle(position.x, position.y - 30);
        }
    }, [cows, feedCow, hasGrass]);

    // ---- Update tool position when dragging ----
    useEffect(() => {
        if (tools.milking || tools.feeding) {
            updateToolPosition(mousePosition);
        }
    }, [mousePosition, tools.milking, tools.feeding, updateToolPosition]);

    // ---- Render ----
    return (
        <>
            {/* Particle effects layer */}
            <ParticleRenderer />

            {/* Crafting menu popup */}
            {showCrafting && (
                <Crafting onClose={() => setShowCrafting(false)} />
            )}

            {/* Moo.sh (dev console) - PiP style window */}
            {showCownsole && (
                <Cownsole 
                    onClose={() => setShowCownsole(false)} 
                    onMinimize={() => setShowCownsole(false)}
                />
            )}

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
                        throwable={false}
                    >
                        <div>
                            <img draggable={false} src="./images/pasture/bucket.svg" alt="Milk bucket" />
                        </div>
                    </DraggableSwinging>

                    {/* Feeding tool */}
                    <DraggableSwinging 
                        id="feed" 
                        isActive={tools.feeding && hasGrass} 
                        ropeLength={GAME_CONFIG.PHYSICS.FEED_ROPE_LENGTH} 
                        gravity={GAME_CONFIG.PHYSICS.FEED_GRAVITY} 
                        damping={GAME_CONFIG.PHYSICS.FEED_DAMPING}
                        collisionTargets={hungryCowIds}
                        onCollide={handleFeedCollide}
                        throwable={false}
                    >
                        <div>
                            <img draggable={false} src="./images/pasture/grass.svg" alt="Cow feed" />
                            <p style={{ position: "absolute", left: 30, top: 35 }}>{grassCount}x</p>
                        </div>
                    </DraggableSwinging>

                    {/* Fence row at bottom */}
                    <pre className={styles.fence}>{
`${'/\\ '.repeat(Math.ceil(window.innerWidth / 10))}
${'||='.repeat(Math.ceil(window.innerWidth / 10))}
${'||='.repeat(Math.ceil(window.innerWidth / 10))}`
                    }</pre>

                    {/* Quest Menu (bottom left) */}
                    <QuestMenu />

                    {/* Stats Display (bottom right, above icon dock) */}
                    <StatsDisplay 
                        coins={resources.coins} 
                        xp={Math.floor(resources.stars * 1000)} 
                    />

                    {/* Icon Dock (bottom right) */}
                    <IconDock 
                        onTerminalClick={handleTerminalToggle}
                        terminalOpen={showCownsole}
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
                            disabled={!hasGrass}
                            onMouseDown={hasGrass ? startFeeding : undefined}
                        />
                    </Dock>
                </div>
            </div>
        </>
    );
}
