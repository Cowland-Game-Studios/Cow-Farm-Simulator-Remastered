import styles from "./draggable.module.css";
import { useContext, useEffect, useRef, useState } from "react";
import MousePositionContext from "../../contexts/MousePositionContext";
import { v4 as uuidv4 } from 'uuid';

export default function Draggable({canGoOffScreen = false, safeArea = 25, ...props}) {

    const draggabelRef = useRef(null);

    const isPositionBad = (x, y) => {
        if (canGoOffScreen) {
            return false;
        }

        return (x < safeArea || x > window.innerWidth - safeArea) || (y < safeArea || y > window.innerHeight - safeArea)
    }

    const getValidLocation = () => {
        const x = Math.random() * (window.innerWidth - safeArea * 2) + safeArea;
        const y = Math.random() * (window.innerHeight - safeArea * 2) + safeArea;

        if (isPositionBad(x, y)) {
            return getValidLocation();
        }

        return {x, y};
    }

    const getCurrentDraggableLocation = () => {
        const {x, y} = draggabelRef.current.getBoundingClientRect();

        return {x: x + draggabelRef.current.offsetWidth / 2, y: y + draggabelRef.current.offsetHeight / 2};
    }

    const [position, setPosition] = useState(getValidLocation());
    
    const {mousePosition} = useContext(MousePositionContext);

    const [dragging, setDragging] = useState(false);

    useEffect(() => {
        const up = () => {
            setDragging(false);
        };

        const resize = () => {
            if (isPositionBad(position.x, position.y)) {
                setPosition(getValidLocation());
            }
        };

        window.addEventListener("mouseup", up);
        window.addEventListener("touchend", up);
        window.addEventListener("resize", resize);

    }, []);

    useEffect(() => {
        if (dragging) {return}

        if (isPositionBad(mousePosition.x, mousePosition.y)) {
            setPosition(getValidLocation());
        }
        else {
            setPosition({x: mousePosition.x, y: mousePosition.y});
        }
    }, [dragging])
    
    return (
        <div
            ref={draggabelRef}

            onMouseDown={() => {
                setDragging(true);
            }}

            onTouchStart={() => {
                setDragging(true);
            }}

            style={{
                position: "absolute",                
                transform: `
translate(-50%, -50%)
translate(${dragging ? mousePosition.x : position.x}px, ${dragging ? mousePosition.y : position.y}px)
scale(${(dragging ? 1.25 : 1)})
`,

// rotate(${!dragging ? 0 : Math.atan2(mousePosition.y - getCurrentDraggableLocation().y, mousePosition.x - getCurrentDraggableLocation().x)}rad)
//scaleX(${(dragging ? (mousePosition.x - getCurrentDraggableLocation().x > 25 ? -1 : 1) : 1)})

                transformOrigin: "center",
                transition: dragging ? "transform 0.1s ease-out" : "all 0.1s ease-out",

                opacity: dragging ? 0.75 : 1,

                zIndex: dragging ? 1000 : 0,
                ...props.style
            }}
        >
            {props.children}
        </div>
    );
}
