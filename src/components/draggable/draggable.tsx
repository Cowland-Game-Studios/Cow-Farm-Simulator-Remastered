import React, { useEffect, useRef, useState, useCallback, CSSProperties, ReactNode } from "react";
import { useMousePosition, Position } from "../../engine";
import { GAME_CONFIG } from "../../config/gameConfig";

const { PHYSICS, UI } = GAME_CONFIG;

interface TrackRotationSettings {
    rotates: boolean;
    sensitivity: number;
    displacement: number;
}

interface DraggableProps {
    /** DOM id for the draggable element */
    id?: string;
    /** Callback when element is picked up */
    onPickup?: () => void;
    /** Callback when element is dropped, receives position */
    onDrop?: (position: Position) => void;
    /** Allow element to go off screen */
    canGoOffScreen?: boolean;
    /** Safe area margin from screen edges */
    safeArea?: number;
    /** Start in dragging state */
    initialDragging?: boolean;
    /** Offset from cursor position */
    offset?: Position;
    /** Rotation tracking settings */
    trackRotationSettings?: TrackRotationSettings;
    /** Child elements to render */
    children?: ReactNode;
    /** Custom inline styles */
    style?: CSSProperties;
    [key: string]: unknown;
}

export default function Draggable({
    id,
    onPickup = () => {},
    onDrop = () => {},
    canGoOffScreen = false,
    safeArea = PHYSICS.DEFAULT_SAFE_AREA,
    initialDragging = false,
    offset = { x: 0, y: 0 },
    trackRotationSettings = { rotates: true, sensitivity: 1, displacement: 0 },
    children = null,
    style = {},
    ...props
}: DraggableProps): React.ReactElement {
    const draggableRef = useRef<HTMLDivElement>(null);
    const mousePosition = useMousePosition();
    const [dragging, setDragging] = useState(initialDragging);
    
    // Store onDrop in a ref to avoid triggering effect when callback changes
    const onDropRef = useRef(onDrop);
    onDropRef.current = onDrop;

    const isPositionBad = useCallback((x: number, y: number): boolean => {
        if (canGoOffScreen) {
            return false;
        }
        return (x < safeArea || x > window.innerWidth - safeArea) || 
               (y < safeArea || y > window.innerHeight - safeArea);
    }, [canGoOffScreen, safeArea]);

    // Clamp position to the closest safe spot within bounds
    const getClosestSafePosition = useCallback((x: number, y: number): Position => {
        const minX = safeArea;
        const maxX = window.innerWidth - safeArea;
        const minY = safeArea;
        const maxY = window.innerHeight - safeArea;

        return {
            x: Math.max(minX, Math.min(maxX, x)),
            y: Math.max(minY, Math.min(maxY, y))
        };
    }, [safeArea]);

    // Get a random valid starting location
    const getRandomValidLocation = useCallback((): Position => {
        const x = Math.random() * (window.innerWidth - safeArea * 2) + safeArea;
        const y = Math.random() * (window.innerHeight - safeArea * 2) + safeArea;
        return { x, y };
    }, [safeArea]);

    const [position, setPosition] = useState<Position>(getRandomValidLocation);

    useEffect(() => {
        const handleMouseUp = () => {
            setDragging(false);
        };

        const handleResize = () => {
            setPosition(prev => {
                if (isPositionBad(prev.x, prev.y)) {
                    return getClosestSafePosition(prev.x, prev.y);
                }
                return prev;
            });
        };

        window.addEventListener("mouseup", handleMouseUp);
        window.addEventListener("touchend", handleMouseUp);
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("mouseup", handleMouseUp);
            window.removeEventListener("touchend", handleMouseUp);
            window.removeEventListener("resize", handleResize);
        };
    }, [isPositionBad, getClosestSafePosition]);

    // Handle drop when dragging ends
    useEffect(() => {
        if (dragging) return;

        const dropX = mousePosition.x;
        const dropY = mousePosition.y;

        if (isPositionBad(dropX, dropY)) {
            setPosition(getClosestSafePosition(dropX, dropY));
        } else {
            setPosition({ x: dropX, y: dropY });
        }

        onDropRef.current({ x: dropX, y: dropY });
    }, [dragging, mousePosition.x, mousePosition.y, isPositionBad, getClosestSafePosition]);

    return (
        <div
            {...props}
            id={id}
            ref={draggableRef}
            onMouseDown={() => {
                setDragging(true);
                onPickup();
            }}
            onTouchStart={() => {
                setDragging(true);
                onPickup();
            }}
            style={{
                position: "absolute",
                transform: `
                    translate(-50%, -50%)
                    translate(${(dragging ? mousePosition.x : position.x) + offset.x}px, ${(dragging ? mousePosition.y : position.y) + offset.y}px)
                    scale(${dragging ? PHYSICS.DRAGGING_SCALE : 1})
                    rotate(${dragging ? (trackRotationSettings.rotates ? Math.atan2(mousePosition.y - position.y, mousePosition.x - position.x) * 180 / Math.PI + 90 : 0) : 0}deg)
                `,
                transformOrigin: "center",
                transition: `transform ${UI.TRANSITION_FAST_MS}ms ease-out`,
                zIndex: dragging ? UI.DRAGGING_Z_INDEX : 0,
                touchAction: "none", // Prevent browser touch gestures from interfering with drag
                ...style
            }}
        >
            {children}
        </div>
    );
}

