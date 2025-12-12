/**
 * App - Main Application
 * 
 * Uses the centralized game engine with:
 * - GameProvider for state management
 * - Collision engine for interactions
 * - Single game loop
 * - Auto-save with visual indicator
 * - Error boundary for graceful error handling
 */

import { GameProvider, useMousePosition, useTools, useGame, useSaveState } from "./engine";
import { FlyingRewardsProvider, FlyingRewardsRenderer } from "./engine/flyingRewards";
import Pasture from "./pages/pasture";
import BlobCursor from "./components/cursor/BlobCursor";
import ErrorBoundary from "./components/ErrorBoundary";
import { AutosaveIndicator } from "./components/autosaveIndicator";

import "./App.css";

// Cursor wrapper that gets mouse, tools, and dragging state from context
function CursorWrapper(): React.ReactElement {
    const mousePosition = useMousePosition();
    const tools = useTools();
    const { draggingCow, ui } = useGame();
    // Use defensive check - only hide cursor if actively dragging something
    const isDraggingTool = tools?.milking || tools?.feeding;
    const isDraggingCow = Boolean(draggingCow?.cowId);
    const isDraggingCraftingItem = ui?.draggingCraftingItem;
    const isDragging = isDraggingTool || isDraggingCow || isDraggingCraftingItem;
    return <BlobCursor mousePosition={mousePosition} isDragging={isDragging} />;
}

// Autosave indicator wrapper
function AutosaveWrapper(): React.ReactElement {
    const { isSaving, lastSavedAt } = useSaveState();
    return <AutosaveIndicator isSaving={isSaving} lastSavedAt={lastSavedAt} />;
}

function App(): React.ReactElement {
    return (
        <ErrorBoundary>
        <GameProvider>
        <FlyingRewardsProvider>
            <main className="canvas">
                <CursorWrapper />
                <AutosaveWrapper />
                <Pasture />
                <FlyingRewardsRenderer />
            </main>
        </FlyingRewardsProvider>
        </GameProvider>
        </ErrorBoundary>
    );
}

export default App;

