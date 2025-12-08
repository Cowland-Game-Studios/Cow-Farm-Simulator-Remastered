import { useContext, useEffect, useRef, useState } from "react";
import MousePositionContext from "../../contexts/MousePositionContext";

export default function Draggable({
    onPickup = () => {},
    onDrop = () => {},
    canGoOffScreen = false,
    safeArea = 25,
    initialDragging = false,
    offset = { x: 0, y: 0 },
    trackRotationSettings = { rotates: true, sensitivity: 1, displacement: 0 },
    ...props
}) {
    const draggableRef = useRef(null);

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

    const [position, setPosition] = useState(getValidLocation);
    const { mousePosition } = useContext(MousePositionContext);
    const [dragging, setDragging] = useState(initialDragging);

    useEffect(() => {
        const handleMouseUp = () => {
            setDragging(false);
        };

        const handleResize = () => {
            if (isPositionBad(position.x, position.y)) {
                setPosition(getValidLocation());
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
    }, [position.x, position.y]);

    useEffect(() => {
        if (dragging) return;

        if (isPositionBad(mousePosition.x, mousePosition.y)) {
            setPosition(getValidLocation());
        } else {
            setPosition({ x: mousePosition.x, y: mousePosition.y });
        }

        onDrop({ x: mousePosition.x, y: mousePosition.y });
    }, [dragging]);

    return (
        <div
            {...props}
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
                    scale(${dragging ? 1.25 : 1})
                    rotate(${dragging ? (trackRotationSettings.rotates ? Math.atan2(mousePosition.y - position.y, mousePosition.x - position.x) * 180 / Math.PI + 90 : 0) : 0}deg)
                `,
                transformOrigin: "center",
                transition: "transform 0.1s ease-out",
                zIndex: dragging ? 1000 : 0,
                ...props.style
            }}
        >
            {props.children}
        </div>
    );
}
