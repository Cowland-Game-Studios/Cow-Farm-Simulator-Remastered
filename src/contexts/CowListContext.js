import { createContext } from "react";
import { v4 as uuidv4 } from 'uuid';

const CowListContext = createContext([]);

export default CowListContext;

export const defaultCowList = [
    //rgb
    {
        id: uuidv4(),
        color: "rgba(255, 0, 0)",
        fullness: 1,
        state: "full",
    },
    {
        id: uuidv4(),
        color: "rgba(0, 255, 0)",
        fullness: 1,
        state: "full",
    },
    {
        id: uuidv4(),
        color: "rgba(0, 0, 255)",
        fullness: 1,
        state: "full",
    },
]