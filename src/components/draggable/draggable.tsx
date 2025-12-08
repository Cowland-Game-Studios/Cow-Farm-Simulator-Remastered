import React, { useEffect, useRef, useState, CSSProperties, ReactNode } from "react";
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

    const isPositionBad = (x: number, y: number): boolean => {
        if (canGoOffScreen) {
            return false;
        }
        return (x < safeArea || x > window.innerWidth - safeArea) || 
               (y < safeArea || y > window.innerHeight - safeArea);
    };

    // Clamp position to the closest safe spot within bounds
    const getClosestSafePosition = (x: number, y: number): Position => {
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
    const getRandomValidLocation = (): Position => {
        const x = Math.random() * (window.innerWidth - safeArea * 2) + safeArea;
        const y = Math.random() * (window.innerHeight - safeArea * 2) + safeArea;
        return { x, y };
    };

    const [position, setPosition] = useState<Position>(getRandomValidLocation);
    const mousePosition = useMousePosition();
    const [dragging, setDragging] = useState(initialDragging);

    useEffect(() => {
        const handleMouseUp = () => {
            setDragging(false);
        };

        const handleResize = () => {
            if (isPositionBad(position.x, position.y)) {
                setPosition(getClosestSafePosition(position.x, position.y));
            }
        };

        window.addEventListener("mouseup", handleMouseUp);
        window.addEventListener("touchend", handleMouseUp);
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("mouseup", handleMouseUp);
            window.removeEventListener("touchend", handleMouseUp);
            window.removeEventListener("resize", handleResize);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [position.x, position.y]);

    useEffect(() => {
        if (dragging) return;

        if (isPositionBad(mousePosition.x, mousePosition.y)) {
            setPosition(getClosestSafePosition(mousePosition.x, mousePosition.y));
        } else {
            setPosition({ x: mousePosition.x, y: mousePosition.y });
        }

        onDrop({ x: mousePosition.x, y: mousePosition.y });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dragging]);

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

