import { createContext } from "react";

const MousePositionContext = createContext({
    x: 0,
    y: 0
});

export default MousePositionContext;