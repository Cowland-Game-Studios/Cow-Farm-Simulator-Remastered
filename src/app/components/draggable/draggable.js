"use client"

import Image from "next/image";
import styles from "./draggable.module.css";
import { useState } from "react";

export default function Draggable({...props}) {

    const [position, setPosition] = useState({x: 0, y: 0});
    const [dragging, setDragging] = useState(false);

    const handleDrag = (e) => {
        console.log("dragging");
        setPosition({
            x: e.clientX,
            y: e.clientY
        });
    }

    console.log(position);
    
    return (
        <div
            onDragStart={(e) => {
                console.log("dragging")
                setDragging(true);
            }}
            
            onDrag={(e) => {
                handleDrag(e);
            }}

            onDragEnd={(e) => {
                console.log("drag ended")
                setDragging(false);
            }}

            style={{
                position: "absolute",
                top: position.y,
                left: position.x,
                translate: "translate(-50%, -50%)",
                zIndex: dragging ? 1000 : 0,
                ...props.style
            }}
        >
            {props.children}
        </div>
    );
}
