import styles from "./draggable.module.css";
import { useContext, useEffect, useState } from "react";
import MousePositionContext from "../../contexts/MousePositionContext";

export default function Draggable({canGoOffScreen = false, safeArea = 25, defaultLocation = null, ...props}) {

    const getCenterOfLocation = () => {
        return {x: window.innerWidth/2, y: window.innerHeight/2};
    }

    const [position, setPosition] = useState(defaultLocation ?? getCenterOfLocation());
    
    const {mousePosition} = useContext(MousePositionContext);

    const [dragging, setDragging] = useState(false);

    const isPositionBad = (x, y) => {
        if (canGoOffScreen) {
            return false;
        }

        return (x < safeArea || x > window.innerWidth - safeArea) || (y < safeArea || y > window.innerHeight - safeArea)
    }

    useEffect(() => {
        const up = () => {
            setDragging(false);
        };

        const resize = () => {
            if (isPositionBad(position.x, position.y)) {
                setPosition(getCenterOfLocation());
            }
        };

        window.addEventListener("mouseup", up);
        window.addEventListener("touchend", up);
        window.addEventListener("resize", resize);

    }, []);

    useEffect(() => {
        if (dragging) {return}

        if (isPositionBad(mousePosition.x, mousePosition.y)) {
            setPosition(getCenterOfLocation());
        }
        else {
            setPosition({x: mousePosition.x, y: mousePosition.y});
        }
    }, [dragging])
    
    return (
        <div
            onMouseDown={() => {
                setDragging(true);
            }}

            onTouchStart={() => {
                setDragging(true);
            }}

            style={{
                position: "absolute",                
                transform: `translate(-50%, -50%) translate(${dragging ? mousePosition.x : position.x}px, ${dragging ? mousePosition.y : position.y}px)`,
                transformOrigin: "center",
                transition: dragging ? "all 0.1s ease-out" : "all 1s ease-out",

                zIndex: dragging ? 1000 : 0,
                ...props.style
            }}
        >
            {props.children}
        </div>
    );
}
