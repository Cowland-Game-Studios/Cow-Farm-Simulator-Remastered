import { createContext } from "react";

const PastureStateContext = createContext({
    milking: false,
    feeding: false,
});

export default PastureStateContext;