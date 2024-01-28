import { createContext } from "react";
import { v4 as uuidv4 } from 'uuid';

const CowListContext = createContext([]);

export default CowListContext;

export const opacity = 0.5;

export const defaultCowList = [
    //rgb
    {
        id: uuidv4(),
        color: "rgba(255, 0, 0, " + opacity + ")",
        fullness: 1,
        state: "full",
    },
    {
        id: uuidv4(),
        color: "rgba(255, 230, 0, " + opacity + ")",
        fullness: 1,
        state: "full",
    },
    {
        id: uuidv4(),
        color: "rgba(0, 0, 255, " + opacity + ")",
        fullness: 1,
        state: "full",
    },
]