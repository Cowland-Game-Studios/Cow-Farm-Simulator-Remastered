/**
 * App - Main Application
 * 
 * Uses the centralized game engine with:
 * - GameProvider for state management
 * - Collision engine for interactions
 * - Single game loop
 * - Supabase-ready persistence
 * - Error boundary for graceful error handling
 */

import { GameProvider, useMousePosition } from "./engine";
import Pasture from "./pages/pasture";
import BlobCursor from "./components/cursor/BlobCursor";
import ErrorBoundary from "./components/ErrorBoundary";

import "./App.css";

// Cursor wrapper that gets mouse from context
function CursorWrapper() {
    const mousePosition = useMousePosition();
    return <BlobCursor mousePosition={mousePosition} />;
}

function App() {
    return (
        <ErrorBoundary>
        <GameProvider>
            <main className="canvas">
                <CursorWrapper />
                <Pasture />
            </main>
        </GameProvider>
        </ErrorBoundary>
    );
}

export default App;
