import { useEffect, useRef, useState, useCallback } from "react";
import PropTypes from 'prop-types';
import { useMousePosition } from "../../engine";
import { GAME_CONFIG } from "../../config/gameConfig";

const { PHYSICS, UI } = GAME_CONFIG;

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
    bottomSafeArea = PHYSICS.DEFAULT_BOTTOM_SAFE_AREA,
    initialDragging = false,
    initialPosition = null,
    isActive = null,
    disabled = false,
    offset = { x: 0, y: 0 },
    ropeLength = PHYSICS.DEFAULT_ROPE_LENGTH,
    gravity = PHYSICS.DEFAULT_GRAVITY,
    damping = PHYSICS.DEFAULT_DAMPING,
    throwable = true,
    impulse = null, // { x, y } velocity to apply externally (for chaos mode etc)
    children = null,
    style = {},
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
    const mousePositionRef = useRef({ x: 0, y: 0 }); // Ref for animation loop to read current mouse position
    const throwVelocityRef = useRef({ x: 0, y: 0 }); // Track actual throw velocity from mouse movement
    const draggingRef = useRef(false); // Ref to track dragging state for event handlers (avoids stale closure)

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
               (y < safeArea || y > window.innerHeight - bottomSafeArea);
    };

    // Clamp position to the closest safe spot within bounds
    const getClosestSafePosition = (x, y) => {
        const minX = safeArea;
        const maxX = window.innerWidth - safeArea;
        const minY = safeArea;
        const maxY = window.innerHeight - bottomSafeArea;

        return {
            x: Math.max(minX, Math.min(maxX, x)),
            y: Math.max(minY, Math.min(maxY, y))
        };
    };

    // Get a random valid starting location
    const getRandomValidLocation = () => {
        const x = Math.random() * (window.innerWidth - safeArea * 2) + safeArea;
        const y = Math.random() * (window.innerHeight - safeArea - bottomSafeArea) + safeArea;
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
    const [flying, setFlying] = useState(false); // State for thrown objects mid-flight

    // Keep mousePositionRef updated so animation loop can read current position
    mousePositionRef.current = mousePosition;
    // Keep draggingRef in sync with dragging state (for event handlers to avoid stale closures)
    draggingRef.current = dragging;
    
    const [opacity, setOpacity] = useState(isControlled ? 0 : 1);
    const [visible, setVisible] = useState(!isControlled);
    
    // Track spin from bounces for visual effect
    const spinRef = useRef(0);
    const bounceCountRef = useRef(0);

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

    // Handle external impulse (for chaos mode etc)
    useEffect(() => {
        if (impulse && (impulse.x !== 0 || impulse.y !== 0)) {
            // Apply the impulse velocity
            velocityRef.current = {
                x: velocityRef.current.x + impulse.x,
                y: velocityRef.current.y + impulse.y,
            };
            // Trigger flying mode
            setFlying(true);
        }
    }, [impulse]);

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
            }, UI.HIDE_TIMEOUT_MS);
            return () => clearTimeout(hideTimeout);
        }
    }, [isActive, isControlled]);

    // Initialize object position below the rest position
    useEffect(() => {
        const initialPos = { x: restPosition.x, y: restPosition.y + ropeLength };
        objectPosRef.current = initialPos;
        setObjectPos(initialPos);
    }, []);

    // Physics simulation loop - handles both dragging (with rope) and flying (thrown)
    useEffect(() => {
        const isAnimating = dragging || flying;
        
        if (!isAnimating) {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            return;
        }

        const simulate = () => {
            const velocity = velocityRef.current;
            const pos = objectPosRef.current;

            let newX, newY;

            if (dragging) {
                // DRAGGING MODE: Apply rope physics
                const anchorX = mousePositionRef.current.x;
                const anchorY = mousePositionRef.current.y;

                // Apply gravity
                velocity.y += gravity;

                // Apply damping
                velocity.x *= damping;
                velocity.y *= damping;

                // Update position
                newX = pos.x + velocity.x;
                newY = pos.y + velocity.y;

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
                    velocity.x -= radialVelComponent * normalizedX * PHYSICS.RADIAL_VEL_CORRECTION;
                    velocity.y -= radialVelComponent * normalizedY * PHYSICS.RADIAL_VEL_CORRECTION;
                }

                // Add velocity from cursor movement (drag effect)
                const mouseDx = mousePositionRef.current.x - lastMousePosRef.current.x;
                const mouseDy = mousePositionRef.current.y - lastMousePosRef.current.y;
                velocity.x += mouseDx * PHYSICS.CURSOR_DRAG_MULTIPLIER;
                velocity.y += mouseDy * PHYSICS.CURSOR_DRAG_MULTIPLIER;

                // Track throw velocity separately (smoothed mouse movement for throwing)
                // This isn't affected by rope constraints, so it represents actual throw direction
                throwVelocityRef.current = {
                    x: throwVelocityRef.current.x * PHYSICS.THROW_TRACKING_SMOOTHING + mouseDx * PHYSICS.THROW_TRACKING_SENSITIVITY,
                    y: throwVelocityRef.current.y * PHYSICS.THROW_TRACKING_SMOOTHING + mouseDy * PHYSICS.THROW_TRACKING_SENSITIVITY
                };

                lastMousePosRef.current = { x: mousePositionRef.current.x, y: mousePositionRef.current.y };
            } else {
                // FLYING MODE: No rope, just momentum with friction and gravity
                // Make it FUN and BOUNCY! 🐄
                
                // Apply light gravity during flight
                velocity.y += gravity * PHYSICS.FLIGHT_GRAVITY_MULTIPLIER;

                // Apply flight friction
                velocity.x *= PHYSICS.FLIGHT_FRICTION;
                velocity.y *= PHYSICS.FLIGHT_FRICTION;

                // Gradually decay spin
                spinRef.current *= PHYSICS.SPIN_DECAY;

                // Update position
                newX = pos.x + velocity.x;
                newY = pos.y + velocity.y;

                // Bounce off screen edges with dramatic spin!
                const minX = safeArea;
                const maxX = window.innerWidth - safeArea;
                const minY = safeArea;
                const maxY = window.innerHeight - bottomSafeArea; // Use larger bottom safe area

                let bounced = false;

                if (newX < minX) {
                    newX = minX;
                    velocity.x = -velocity.x * PHYSICS.BOUNCE_FACTOR;
                    // Add dramatic spin on wall bounce!
                    spinRef.current += velocity.y * PHYSICS.SPIN_ON_BOUNCE_MULTIPLIER;
                    bounced = true;
                } else if (newX > maxX) {
                    newX = maxX;
                    velocity.x = -velocity.x * PHYSICS.BOUNCE_FACTOR;
                    spinRef.current -= velocity.y * PHYSICS.SPIN_ON_BOUNCE_MULTIPLIER;
                    bounced = true;
                }

                if (newY < minY) {
                    newY = minY;
                    velocity.y = -velocity.y * PHYSICS.BOUNCE_FACTOR;
                    spinRef.current += velocity.x * PHYSICS.SPIN_ON_BOUNCE_MULTIPLIER;
                    bounced = true;
                } else if (newY > maxY) {
                    newY = maxY;
                    velocity.y = -velocity.y * PHYSICS.BOUNCE_FACTOR;
                    spinRef.current -= velocity.x * PHYSICS.SPIN_ON_BOUNCE_MULTIPLIER;
                    bounced = true;
                }

                if (bounced) {
                    bounceCountRef.current += 1;
                }

                // Check if velocity is low enough to settle
                const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
                if (speed < PHYSICS.VELOCITY_THRESHOLD) {
                    // Come to rest
                    isFlyingRef.current = false;
                    setFlying(false);
                    spinRef.current = 0;
                    bounceCountRef.current = 0;
                    const finalPos = getClosestSafePosition(newX, newY);
                    setRestPosition(finalPos);
                    velocityRef.current = { x: 0, y: 0 };
                    
                    if (onPositionChange) {
                        onPositionChange(finalPos);
                    }
                    onDrop(finalPos);
                    return; // Stop animation
                }
            }

            // Update refs
            objectPosRef.current = { x: newX, y: newY };
            velocityRef.current = velocity;

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

        // Initialize last mouse position (for dragging mode)
        if (dragging) {
            lastMousePosRef.current = { x: mousePositionRef.current.x, y: mousePositionRef.current.y };
            
            // Initialize object position below cursor when starting drag
            if (objectPosRef.current.x === 0 && objectPosRef.current.y === 0) {
                objectPosRef.current = { x: mousePositionRef.current.x, y: mousePositionRef.current.y + ropeLength };
            }
        }

        animationRef.current = requestAnimationFrame(simulate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dragging, flying, gravity, damping, ropeLength, safeArea, checkCollisions, onDrop, onPositionChange]);

    // Ref to track if we're transitioning to flying mode (avoids race condition with drop effect)
    const isFlyingRef = useRef(false);

    // Handle mouse/touch up (only for non-controlled mode)
    useEffect(() => {
        if (isControlled) return;

        const up = () => {
            // Use ref to get current dragging state (avoids stale closure)
            if (!draggingRef.current) return;
            
            // Check velocity to decide if we should fly or settle
            if (throwable) {
                // Use throw velocity (from mouse movement) not rope-constrained velocity
                const throwVel = throwVelocityRef.current;
                
                // Always fly after release! No threshold needed - just YEET 🐄
                velocityRef.current = { 
                    x: throwVel.x * PHYSICS.THROW_VELOCITY_MULTIPLIER,
                    y: throwVel.y * PHYSICS.THROW_VELOCITY_MULTIPLIER 
                };
                
                // Set ref immediately to prevent drop effect from settling
                isFlyingRef.current = true;
                setDragging(false);
                setFlying(true);
                return;
            }
            
            // If not throwable, the drop effect will handle settling
            isFlyingRef.current = false;
            setDragging(false);
            // Reset throw velocity
            throwVelocityRef.current = { x: 0, y: 0 };
        };

        const resize = () => {
            if (!dragging && !flying && isPositionBad(restPosition.x, restPosition.y)) {
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
    }, [dragging, flying, restPosition, isControlled, throwable]);

    // Handle drop (only for non-controlled mode, and only if not flying)
    useEffect(() => {
        if (isControlled) return;
        if (dragging) return;
        if (flying) return; // Flying mode handles its own settling
        if (isFlyingRef.current) return; // Also check ref to handle race condition

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
    }, [dragging, flying, isControlled]);

    // Calculate rotation based on rope angle (when dragging) or velocity/spin (when flying)
    const getRotation = () => {
        if (flying) {
            // DRAMATIC spin during flight! 
            const velocity = velocityRef.current;
            const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
            
            // Base rotation from velocity direction
            let rotation = 0;
            if (speed > 1) {
                const velocityAngle = Math.atan2(velocity.x, -velocity.y) * (180 / Math.PI);
                rotation = velocityAngle * 0.5;
            }
            
            // Add accumulated spin from bounces (this is the fun part!)
            rotation += spinRef.current;
            
            return rotation;
        }
        if (!dragging) return 0;
        
        const dx = objectPos.x - mousePosition.x;
        const dy = objectPos.y - mousePosition.y;
        
        // Angle from vertical (cursor is above, object hangs below)
        const angle = Math.atan2(dx, dy) * (180 / Math.PI);
        return -angle;
    };

    // Calculate scale based on speed (faster = bigger for drama!)
    const getFlyingScale = () => {
        if (!flying) return 1;
        const velocity = velocityRef.current;
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        // Scale from base to max based on speed
        return PHYSICS.FLYING_BASE_SCALE + Math.min(speed / PHYSICS.FLYING_SCALE_SPEED_DIVISOR, PHYSICS.FLYING_MAX_SCALE_BONUS);
    };

    const isAnimating = dragging || flying;
    const displayX = isAnimating ? objectPos.x : restPosition.x;
    const displayY = isAnimating ? objectPos.y : restPosition.y;

    return (
        <div
            {...props}
            id={id}
            ref={draggableRef}
            onMouseDown={() => {
                if (disabled) return;
                if (isControlled && !isActive) return;
                // Stop flying if currently in flight
                isFlyingRef.current = false;
                setFlying(false);
                // Reset spin and bounce effects
                spinRef.current = 0;
                bounceCountRef.current = 0;
                // Initialize swing position below cursor
                objectPosRef.current = { 
                    x: mousePosition.x, 
                    y: mousePosition.y + ropeLength 
                };
                setObjectPos(objectPosRef.current);
                velocityRef.current = { x: 0, y: 0 };
                throwVelocityRef.current = { x: 0, y: 0 };
                setDragging(true);
                onPickup();
            }}
            onTouchStart={() => {
                if (disabled) return;
                if (isControlled && !isActive) return;
                // Stop flying if currently in flight
                isFlyingRef.current = false;
                setFlying(false);
                // Reset spin and bounce effects
                spinRef.current = 0;
                bounceCountRef.current = 0;
                objectPosRef.current = { 
                    x: mousePosition.x, 
                    y: mousePosition.y + ropeLength 
                };
                setObjectPos(objectPosRef.current);
                velocityRef.current = { x: 0, y: 0 };
                throwVelocityRef.current = { x: 0, y: 0 };
                setDragging(true);
                onPickup();
            }}
            style={{
                position: "absolute",
                transform: `
                    translate(-50%, -50%)
                    translate(${displayX + offset.x}px, ${displayY + offset.y}px)
                    scale(${flying ? getFlyingScale() : (dragging ? PHYSICS.DRAGGING_SCALE : 1)})
                    rotate(${getRotation()}deg)
                `,
                transformOrigin: "center",
                transition: isAnimating 
                    ? `opacity ${UI.TRANSITION_FAST_MS}ms ease-out` 
                    : `transform ${UI.TRANSITION_SLOW_MS}ms ease-out, opacity ${UI.TRANSITION_NORMAL_MS}ms ease-out`,
                opacity: opacity,
                visibility: visible ? "visible" : "hidden",
                zIndex: isAnimating ? UI.DRAGGING_Z_INDEX : 0,
                cursor: disabled ? "default" : (dragging ? "grabbing" : (flying ? "default" : "grab")),
                pointerEvents: (isControlled && !isActive) ? "none" : "auto",
                touchAction: "none", // Prevent browser touch gestures from interfering with drag
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
    /** Whether the object can be thrown (continues flying with momentum on release) */
    throwable: PropTypes.bool,
    /** External impulse to apply { x, y } velocity */
    impulse: PropTypes.shape({
        x: PropTypes.number,
        y: PropTypes.number,
    }),
    /** Child elements to render */
    children: PropTypes.node,
    /** Custom inline styles */
    style: PropTypes.object,
};

