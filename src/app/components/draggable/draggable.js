"use client"

import Image from "next/image";
import styles from "./draggable.module.css";
import { useState } from "react";

export default function Draggable({...props}) {

    const [position, setPosition] = useState({x: 10, y: 50});
    const [mousePosition, setMousePosition] = useState({x: 0, y: 0});

    const [dragging, setDragging] = useState(false);
    

    
    return (
        <div
            onMouseDown={(e) => {
                setDragging(true);
            }}
            onMouseMove={(e) => {
                if (dragging) {
                    handleDrag(e);
                }
            }}
            onMouseUp={(e) => {
                setDragging(false);
            }}

            style={{
                position: "absolute",
                top: dragging ? position.y : position.y - 50,
                left: dragging ? position.x : position.x - 50,
                zIndex: dragging ? 1000 : 0,
                ...props.style
            }}
        >
            {props.children}
        </div>
    );
}
