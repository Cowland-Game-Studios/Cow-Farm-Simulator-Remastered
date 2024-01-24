import styles from "./draggable.module.css";
import { useContext, useState } from "react";
import MousePositionContext from "../../contexts/MousePositionContext";

export default function Draggable({...props}) {

    const [position, setPosition] = useState({x: 10, y: 50});
    
    const {mousePosition} = useContext(MousePositionContext);

    const [dragging, setDragging] = useState(false);
    
    return (
        <div
            onMouseDown={() => {
                setDragging(true);
            }}

            onMouseMove={(e) => {
                if (dragging) {
                    console.log(mousePosition)
                    // setPosition({
                    //     x: mousePosition.x,
                    //     y: mousePosition.y
                    // });
                }
            }}

            onMouseUp={() => {
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
