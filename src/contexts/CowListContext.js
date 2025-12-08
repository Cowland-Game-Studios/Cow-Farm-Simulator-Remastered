import { createContext } from "react";
import { v4 as uuidv4 } from 'uuid';
import { createCowColor } from "../config/gameConfig";

const CowListContext = createContext([]);

export default CowListContext;

export const defaultCowList = [
    {
        id: uuidv4(),
        color: createCowColor(255, 0, 0),
        fullness: 1,
        state: "full",
    },
    {
        id: uuidv4(),
        color: createCowColor(255, 230, 0),
        fullness: 1,
        state: "full",
    },
    {
        id: uuidv4(),
        color: createCowColor(0, 0, 255),
        fullness: 1,
        state: "full",
    },
];