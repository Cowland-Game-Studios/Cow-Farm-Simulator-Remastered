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

import { GameProvider, useMousePosition, useTools, useGame } from "./engine";
import Pasture from "./pages/pasture";
import BlobCursor from "./components/cursor/BlobCursor";
import ErrorBoundary from "./components/ErrorBoundary";

import "./App.css";

// Cursor wrapper that gets mouse, tools, and dragging state from context
function CursorWrapper() {
    const mousePosition = useMousePosition();
    const tools = useTools();
    const { draggingCow } = useGame();
    // Use defensive check - only hide cursor if actively dragging something
    const isDraggingTool = tools?.milking || tools?.feeding;
    const isDraggingCow = Boolean(draggingCow?.cowId);
    const isDragging = isDraggingTool || isDraggingCow;
    return <BlobCursor mousePosition={mousePosition} isDragging={isDragging} />;
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
