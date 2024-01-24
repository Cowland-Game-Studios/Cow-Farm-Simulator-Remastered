import Pasture from "./pages/pasture";
import MousePositionContext from "./contexts/MousePositionContext";
import { useEffect, useState } from "react";

function App() {
  const [mousePosition, setMousePosition] = useState({x: 0, y: 0});

  //update mouse pos every tick
  useEffect(() => {
    const updateMousePosition = ev => {
      setMousePosition({x: ev.clientX, y: ev.clientY});
    }
    window.addEventListener("mousemove", updateMousePosition);
    return () => window.removeEventListener("mousemove", updateMousePosition);
  }, []);

  return (
    <MousePositionContext.Provider value={mousePosition}>
      <Pasture />
    </MousePositionContext.Provider>
  );
}

export default App;
