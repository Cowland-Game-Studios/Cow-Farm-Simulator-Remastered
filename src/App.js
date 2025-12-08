import Pasture from "./pages/pasture";
import MousePositionContext from "./contexts/MousePositionContext";
import { useEffect, useState } from "react";
import BlobCursor from "./components/cursor/BlobCursor";

import "./App.css";
import { loadSave } from "./save/saveFunctions";

function App() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Update mouse position every tick
  useEffect(() => {
    const updateMousePosition = (ev) => {
      setMousePosition({ x: ev.clientX, y: ev.clientY });
    };
    window.addEventListener("mousemove", updateMousePosition);

    loadSave();

    return () => window.removeEventListener("mousemove", updateMousePosition);
  }, []);

  return (
    <main className="canvas">
      <BlobCursor mousePosition={mousePosition} />
      <MousePositionContext.Provider value={{ mousePosition: mousePosition }}>
        <Pasture />
      </MousePositionContext.Provider>
    </main>
  );
}

export default App;
