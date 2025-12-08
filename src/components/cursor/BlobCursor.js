import { useEffect, useRef, useState } from "react";

const CURSOR_CONFIG = {
    SIZE: 20,
    LERP_SPEED: 0.25,  // Higher = faster following (0-1)
    COLOR: "rgba(0, 0, 0, 0.15)",  // 15% opacity black
};

export default function BlobCursor({ mousePosition }) {
    const [position, setPosition] = useState({ x: mousePosition.x, y: mousePosition.y });
    const animationRef = useRef(null);
    const positionRef = useRef({ x: mousePosition.x, y: mousePosition.y });

    useEffect(() => {
        // Initialize position to mouse on first render
        if (positionRef.current.x === 0 && positionRef.current.y === 0) {
            positionRef.current = { x: mousePosition.x, y: mousePosition.y };
        }

        const animate = () => {
            const currentPos = positionRef.current;
            
            // Lerp towards mouse position
            const newX = currentPos.x + (mousePosition.x - currentPos.x) * CURSOR_CONFIG.LERP_SPEED;
            const newY = currentPos.y + (mousePosition.y - currentPos.y) * CURSOR_CONFIG.LERP_SPEED;
            
            positionRef.current = { x: newX, y: newY };
            setPosition({ x: newX, y: newY });
            
            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [mousePosition]);

    return (
        <div
            style={{
                position: "fixed",
                left: position.x,
                top: position.y,
                width: CURSOR_CONFIG.SIZE,
                height: CURSOR_CONFIG.SIZE,
                backgroundColor: CURSOR_CONFIG.COLOR,
                borderRadius: "50%",
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
                zIndex: 9999,
            }}
        />
    );
}
