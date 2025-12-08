import { useEffect, useRef, useState, useCallback } from "react";
import PropTypes from 'prop-types';
import { useMousePosition } from "../../engine";
import { GAME_CONFIG } from "../../config/gameConfig";

const { PHYSICS } = GAME_CONFIG;

export default function DraggableSwinging({
    id,
    onPickup = () => {},
    onDrop = () => {},
    onPositionChange = null,
    onCollide = null,
    collisionTargets = [],
    collisionThreshold = PHYSICS.DEFAULT_COLLISION_THRESHOLD,
    canGoOffScreen = false,
    safeArea = PHYSICS.DEFAULT_SAFE_AREA,
    initialDragging = false,
    initialPosition = null,
    isActive = null,
    disabled = false,
    offset = { x: 0, y: 0 },
    ropeLength = PHYSICS.DEFAULT_ROPE_LENGTH,
    gravity = PHYSICS.DEFAULT_GRAVITY,
    damping = PHYSICS.DEFAULT_DAMPING,
    children,
    style,
    ...props
}) {
    const draggableRef = useRef(null);
    const animationRef = useRef(null);
    
    // Physics state stored in refs to avoid re-render issues in animation loop
    const velocityRef = useRef({ x: 0, y: 0 });
    const objectPosRef = useRef({ x: 0, y: 0 });
    const lastMousePosRef = useRef({ x: 0, y: 0 });
    const spawnPositionRef = useRef(null);
    const collidedTargetsRef = useRef(new Set()); // Track collisions to avoid duplicates

    const isControlled = isActive !== null;

    // Check collision with target elements using DOM
    const checkCollisions = useCallback((position) => {
        if (!onCollide || !collisionTargets || collisionTargets.length === 0) return;

        for (const targetId of collisionTargets) {
            // Skip already-collided targets
            if (collidedTargetsRef.current.has(targetId)) continue;

            const targetElement = document.getElementById(targetId);
            if (!targetElement) continue;

            const targetRect = targetElement.getBoundingClientRect();
            const targetCenter = {
                x: targetRect.x + targetRect.width / 2,
                y: targetRect.y + targetRect.height / 2,
            };

            const distance = Math.sqrt(
                Math.pow(position.x - targetCenter.x, 2) +
                Math.pow(position.y - targetCenter.y, 2)
            );

            if (distance < collisionThreshold) {
                collidedTargetsRef.current.add(targetId);
                onCollide(targetId, position);
            }
        }
    }, [onCollide, collisionTargets, collisionThreshold]);

    const isPositionBad = (x, y) => {
        if (canGoOffScreen) {
            return false;
        }
        return (x < safeArea || x > window.innerWidth - safeArea) || 
               (y < safeArea || y > window.innerHeight - safeArea);
    };

    // Clamp position to the closest safe spot within bounds
    const getClosestSafePosition = (x, y) => {
        const minX = safeArea;
        const maxX = window.innerWidth - safeArea;
        const minY = safeArea;
        const maxY = window.innerHeight - safeArea;

        return {
            x: Math.max(minX, Math.min(maxX, x)),
            y: Math.max(minY, Math.min(maxY, y))
        };
    };

    // Get a random valid starting location
    const getRandomValidLocation = () => {
        const x = Math.random() * (window.innerWidth - safeArea * 2) + safeArea;
        const y = Math.random() * (window.innerHeight - safeArea * 2) + safeArea;
        return { x, y };
    };

    // Get initial position - use provided position if valid, otherwise random
    const getInitialPosition = () => {
        if (initialPosition && initialPosition.x && initialPosition.y) {
            return getClosestSafePosition(initialPosition.x, initialPosition.y);
        }
        return getRandomValidLocation();
    };

    const [restPosition, setRestPosition] = useState(getInitialPosition);
    const [objectPos, setObjectPos] = useState({ x: 0, y: 0 });
    const mousePosition = useMousePosition();
    const [dragging, setDragging] = useState(initialDragging);
    const [opacity, setOpacity] = useState(isControlled ? 0 : 1);
    const [visible, setVisible] = useState(!isControlled);

    // Store spawn position on mount and report to collision engine
    useEffect(() => {
        const initialPos = getInitialPosition();
        spawnPositionRef.current = initialPos;
        
        // Report initial position to collision engine
        if (onPositionChange) {
            onPositionChange(initialPos);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onPositionChange]);

    // Handle controlled visibility (isActive prop)
    useEffect(() => {
        if (!isControlled) return;

        if (isActive) {
            // Becoming active - show at mouse position and start dragging
            setVisible(true);
            setOpacity(1);
            setDragging(true);
            
            // Position at mouse
            objectPosRef.current = { 
                x: mousePosition.x, 
                y: mousePosition.y + ropeLength 
            };
            setObjectPos(objectPosRef.current);
            setRestPosition({ x: mousePosition.x, y: mousePosition.y });
            velocityRef.current = { x: 0, y: 0 };
        } else {
            // Becoming inactive - fade out and return to spawn
            setOpacity(0);
            if (spawnPositionRef.current) {
                setRestPosition(spawnPositionRef.current);
            }
            // Clear collision tracking when tool becomes inactive
            collidedTargetsRef.current.clear();
            // Hide after animation completes
            const hideTimeout = setTimeout(() => {
                setVisible(false);
                setDragging(false);
            }, 400);
            return () => clearTimeout(hideTimeout);
        }
    }, [isActive, isControlled]);

    // Initialize object position below the rest position
    useEffect(() => {
        const initialPos = { x: restPosition.x, y: restPosition.y + ropeLength };
        objectPosRef.current = initialPos;
        setObjectPos(initialPos);
    }, []);

    // Physics simulation loop
    useEffect(() => {
        if (!dragging) {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            return;
        }

        const simulate = () => {
            const velocity = velocityRef.current;
            const pos = objectPosRef.current;
            const anchorX = mousePosition.x;
            const anchorY = mousePosition.y;

            // Apply gravity
            velocity.y += gravity;

            // Apply damping
            velocity.x *= damping;
            velocity.y *= damping;

            // Update position
            let newX = pos.x + velocity.x;
            let newY = pos.y + velocity.y;

            // Apply rope constraint - keep object at fixed distance from cursor
            const dx = newX - anchorX;
            const dy = newY - anchorY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 0) {
                // Normalize and scale to rope length
                const normalizedX = dx / distance;
                const normalizedY = dy / distance;
                
                newX = anchorX + normalizedX * ropeLength;
                newY = anchorY + normalizedY * ropeLength;

                // Adjust velocity to be tangent to the rope (remove radial component)
                const radialVelComponent = (velocity.x * normalizedX + velocity.y * normalizedY);
                velocity.x -= radialVelComponent * normalizedX * 0.5;
                velocity.y -= radialVelComponent * normalizedY * 0.5;
            }

            // Add velocity from cursor movement (drag effect)
            const mouseDx = mousePosition.x - lastMousePosRef.current.x;
            const mouseDy = mousePosition.y - lastMousePosRef.current.y;
            velocity.x += mouseDx * 0.3;
            velocity.y += mouseDy * 0.3;

            // Update refs
            objectPosRef.current = { x: newX, y: newY };
            velocityRef.current = velocity;
            lastMousePosRef.current = { x: mousePosition.x, y: mousePosition.y };

            // Update state for render
            setObjectPos({ x: newX, y: newY });

            // Notify collision engine of position change
            if (onPositionChange) {
                onPositionChange({ x: newX, y: newY });
            }

            // Check for collisions with targets
            checkCollisions({ x: newX, y: newY });

            animationRef.current = requestAnimationFrame(simulate);
        };

        // Initialize last mouse position
        lastMousePosRef.current = { x: mousePosition.x, y: mousePosition.y };
        
        // Initialize object position below cursor when starting drag
        if (objectPosRef.current.x === 0 && objectPosRef.current.y === 0) {
            objectPosRef.current = { x: mousePosition.x, y: mousePosition.y + ropeLength };
        }

        animationRef.current = requestAnimationFrame(simulate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dragging, gravity, damping, ropeLength, checkCollisions]);

    // Handle mouse/touch up (only for non-controlled mode)
    useEffect(() => {
        if (isControlled) return;

        const up = () => {
            setDragging(false);
        };

        const resize = () => {
            if (!dragging && isPositionBad(restPosition.x, restPosition.y)) {
                setRestPosition(getClosestSafePosition(restPosition.x, restPosition.y));
            }
        };

        window.addEventListener("mouseup", up);
        window.addEventListener("touchend", up);
        window.addEventListener("resize", resize);

        return () => {
            window.removeEventListener("mouseup", up);
            window.removeEventListener("touchend", up);
            window.removeEventListener("resize", resize);
        };
    }, [dragging, restPosition, isControlled]);

    // Handle drop (only for non-controlled mode)
    useEffect(() => {
        if (isControlled) return;
        if (dragging) return;

        const dropX = objectPosRef.current.x || mousePosition.x;
        const dropY = objectPosRef.current.y || mousePosition.y;

        let finalPos;
        if (isPositionBad(dropX, dropY)) {
            finalPos = getClosestSafePosition(dropX, dropY);
            setRestPosition(finalPos);
            objectPosRef.current = { x: finalPos.x, y: finalPos.y + ropeLength };
            setObjectPos(objectPosRef.current);
        } else {
            finalPos = { x: dropX, y: dropY };
            setRestPosition(finalPos);
        }

        // Reset velocity on drop
        velocityRef.current = { x: 0, y: 0 };

        // Report final position to collision engine
        if (onPositionChange) {
            onPositionChange(finalPos);
        }

        onDrop(finalPos);
    }, [dragging, isControlled]);

    // Calculate rotation based on rope angle
    const getRotation = () => {
        if (!dragging) return 0;
        
        const dx = objectPos.x - mousePosition.x;
        const dy = objectPos.y - mousePosition.y;
        
        // Angle from vertical (cursor is above, object hangs below)
        const angle = Math.atan2(dx, dy) * (180 / Math.PI);
        return -angle;
    };

    const displayX = dragging ? objectPos.x : restPosition.x;
    const displayY = dragging ? objectPos.y : restPosition.y;

    return (
        <div
            {...props}
            id={id}
            ref={draggableRef}
            onMouseDown={() => {
                if (disabled) return;
                if (isControlled && !isActive) return;
                // Initialize swing position below cursor
                objectPosRef.current = { 
                    x: mousePosition.x, 
                    y: mousePosition.y + ropeLength 
                };
                setObjectPos(objectPosRef.current);
                velocityRef.current = { x: 0, y: 0 };
                setDragging(true);
                onPickup();
            }}
            onTouchStart={() => {
                if (disabled) return;
                if (isControlled && !isActive) return;
                objectPosRef.current = { 
                    x: mousePosition.x, 
                    y: mousePosition.y + ropeLength 
                };
                setObjectPos(objectPosRef.current);
                velocityRef.current = { x: 0, y: 0 };
                setDragging(true);
                onPickup();
            }}
            style={{
                position: "absolute",
                transform: `
                    translate(-50%, -50%)
                    translate(${displayX + offset.x}px, ${displayY + offset.y}px)
                    scale(${dragging ? 1.15 : 1})
                    rotate(${getRotation()}deg)
                `,
                transformOrigin: "center",
                transition: dragging 
                    ? "opacity 0.1s ease-out" 
                    : "transform 0.4s ease-out, opacity 0.3s ease-out",
                opacity: opacity,
                visibility: visible ? "visible" : "hidden",
                zIndex: dragging ? 1000 : 0,
                cursor: disabled ? "default" : (dragging ? "grabbing" : "grab"),
                pointerEvents: (isControlled && !isActive) ? "none" : "auto",
                ...style
            }}
        >
            {children}
        </div>
    );
}

DraggableSwinging.propTypes = {
    /** DOM id for collision detection */
    id: PropTypes.string,
    /** Callback when element is picked up */
    onPickup: PropTypes.func,
    /** Callback when element is dropped, receives position */
    onDrop: PropTypes.func,
    /** Callback during drag with current position (for collision engine) */
    onPositionChange: PropTypes.func,
    /** Callback when colliding with a target: (targetId, position) => void */
    onCollide: PropTypes.func,
    /** Array of element IDs to check collision against */
    collisionTargets: PropTypes.arrayOf(PropTypes.string),
    /** Distance threshold for collision detection */
    collisionThreshold: PropTypes.number,
    /** Allow element to go off screen */
    canGoOffScreen: PropTypes.bool,
    /** Safe area margin from screen edges */
    safeArea: PropTypes.number,
    /** Start in dragging state */
    initialDragging: PropTypes.bool,
    /** Initial position { x, y } */
    initialPosition: PropTypes.shape({
        x: PropTypes.number,
        y: PropTypes.number,
    }),
    /** Controlled visibility: null = always visible, true/false = controlled */
    isActive: PropTypes.bool,
    /** Prevents dragging when true */
    disabled: PropTypes.bool,
    /** Offset from cursor position */
    offset: PropTypes.shape({
        x: PropTypes.number,
        y: PropTypes.number,
    }),
    /** Length of the rope for swinging physics */
    ropeLength: PropTypes.number,
    /** Gravity strength for physics simulation */
    gravity: PropTypes.number,
    /** Damping factor for physics simulation */
    damping: PropTypes.number,
    /** Child elements to render */
    children: PropTypes.node,
    /** Custom inline styles */
    style: PropTypes.object,
};

DraggableSwinging.defaultProps = {
    id: undefined,
    onPickup: () => {},
    onDrop: () => {},
    onPositionChange: null,
    onCollide: null,
    collisionTargets: [],
    collisionThreshold: PHYSICS.DEFAULT_COLLISION_THRESHOLD,
    canGoOffScreen: false,
    safeArea: PHYSICS.DEFAULT_SAFE_AREA,
    initialDragging: false,
    initialPosition: null,
    isActive: null,
    disabled: false,
    offset: { x: 0, y: 0 },
    ropeLength: PHYSICS.DEFAULT_ROPE_LENGTH,
    gravity: PHYSICS.DEFAULT_GRAVITY,
    damping: PHYSICS.DEFAULT_DAMPING,
    children: null,
    style: {},
};
