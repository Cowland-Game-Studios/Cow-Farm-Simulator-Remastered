import { useContext, useEffect, useRef, useState } from "react";
import MousePositionContext from "../../contexts/MousePositionContext";

export default function DraggableSwinging({
    onPickup = () => {},
    onDrop = () => {},
    canGoOffScreen = false,
    safeArea = 25,
    initialDragging = false,
    offset = { x: 0, y: 0 },
    ropeLength = 80,
    gravity = 0.5,
    damping = 0.98,
    ...props
}) {
    const draggableRef = useRef(null);
    const animationRef = useRef(null);
    
    // Physics state stored in refs to avoid re-render issues in animation loop
    const velocityRef = useRef({ x: 0, y: 0 });
    const objectPosRef = useRef({ x: 0, y: 0 });
    const lastMousePosRef = useRef({ x: 0, y: 0 });

    const isPositionBad = (x, y) => {
        if (canGoOffScreen) {
            return false;
        }
        return (x < safeArea || x > window.innerWidth - safeArea) || 
               (y < safeArea || y > window.innerHeight - safeArea);
    };

    const getValidLocation = () => {
        const x = Math.random() * (window.innerWidth - safeArea * 2) + safeArea;
        const y = Math.random() * (window.innerHeight - safeArea * 2) + safeArea;

        if (isPositionBad(x, y)) {
            return getValidLocation();
        }
        return { x, y };
    };

    const [restPosition, setRestPosition] = useState(getValidLocation);
    const [objectPos, setObjectPos] = useState({ x: 0, y: 0 });
    const { mousePosition } = useContext(MousePositionContext);
    const [dragging, setDragging] = useState(initialDragging);

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
                // This creates more realistic pendulum motion
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
    }, [dragging, mousePosition, gravity, damping, ropeLength]);

    // Handle mouse/touch up
    useEffect(() => {
        const up = () => {
            setDragging(false);
        };

        const resize = () => {
            if (!dragging && isPositionBad(restPosition.x, restPosition.y)) {
                setRestPosition(getValidLocation());
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
    }, [dragging, restPosition]);

    // Handle drop
    useEffect(() => {
        if (dragging) return;

        const dropX = objectPosRef.current.x || mousePosition.x;
        const dropY = objectPosRef.current.y || mousePosition.y;

        if (isPositionBad(dropX, dropY)) {
            const newPos = getValidLocation();
            setRestPosition(newPos);
            objectPosRef.current = { x: newPos.x, y: newPos.y + ropeLength };
            setObjectPos(objectPosRef.current);
        } else {
            setRestPosition({ x: dropX, y: dropY });
        }

        // Reset velocity on drop
        velocityRef.current = { x: 0, y: 0 };

        onDrop({ x: dropX, y: dropY });
    }, [dragging]);

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
            ref={draggableRef}
            onMouseDown={() => {
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
                transition: dragging ? "none" : "transform 0.2s ease-out",
                zIndex: dragging ? 1000 : 0,
                cursor: dragging ? "grabbing" : "grab",
                ...props.style
            }}
        >
            {props.children}
        </div>
    );
}

