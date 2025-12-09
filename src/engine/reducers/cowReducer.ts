/**
 * Cow-related reducer actions
 * Handles: MILK_COW, FEED_COW, BREED_COWS, UPDATE_COW_*, ADD_COW, REMOVE_COW
 */

import { v4 as uuidv4 } from 'uuid';
import { ActionTypes, GameState, Cow, Color, Position, GameAction, CowState } from '../types';
import { GAME_CONFIG } from '../../config/gameConfig';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Create a color object from RGB values
 */
export const createColor = (r: number, g: number, b: number, a: number = GAME_CONFIG.VISUAL.COW_COLOR_OPACITY): Color => ({
    r, g, b, a
});

/**
 * Convert color object to CSS rgba string
 */
export const colorToString = (color: Color): string => {
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
};

/**
 * Average two colors for breeding
 */
export const averageColors = (c1: Color, c2: Color): Color => ({
    r: Math.round((c1.r + c2.r) / 2),
    g: Math.round((c1.g + c2.g) / 2),
    b: Math.round((c1.b + c2.b) / 2),
    a: GAME_CONFIG.VISUAL.COW_COLOR_OPACITY,
});

/**
 * Generate a random vibrant color
 */
export const randomColor = (): Color => {
    const { COLOR_SATURATION_MIN, COLOR_SATURATION_RANGE, COLOR_LIGHTNESS_MIN, COLOR_LIGHTNESS_RANGE } = GAME_CONFIG.COW;
    const hue = Math.random() * 360;
    const saturation = COLOR_SATURATION_MIN + Math.random() * COLOR_SATURATION_RANGE;
    const lightness = COLOR_LIGHTNESS_MIN + Math.random() * COLOR_LIGHTNESS_RANGE;
    
    // Convert HSL to RGB
    const c = (1 - Math.abs(2 * lightness / 100 - 1)) * saturation / 100;
    const x = c * (1 - Math.abs((hue / 60) % 2 - 1));
    const m = lightness / 100 - c / 2;
    
    let r: number, g: number, b: number;
    if (hue < 60) { r = c; g = x; b = 0; }
    else if (hue < 120) { r = x; g = c; b = 0; }
    else if (hue < 180) { r = 0; g = c; b = x; }
    else if (hue < 240) { r = 0; g = x; b = c; }
    else if (hue < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    
    return createColor(
        Math.round((r + m) * 255),
        Math.round((g + m) * 255),
        Math.round((b + m) * 255)
    );
};

/**
 * Create a new cow object
 */
export const createCow = (color: Color, position: Position | null = null): Cow => ({
    id: uuidv4(),
    color,
    state: 'hungry',
    fullness: GAME_CONFIG.COW.INITIAL_FULLNESS_HUNGRY,
    position: position || { x: 0, y: 0 },
    facingRight: Math.random() > 0.5,
    lastFedAt: null,
    lastBredAt: 0,
    createdAt: Date.now(),
});

// ============================================
// COW REDUCER
// ============================================

export function cowReducer(state: GameState, action: GameAction): GameState | null {
    switch (action.type) {
        case ActionTypes.MILK_COW: {
            const { cowId } = action.payload as { cowId: string };
            
            const cow = state.cows.find(c => c.id === cowId);
            if (!cow || cow.state !== 'full') {
                return state;
            }
            
            return {
                ...state,
                cows: state.cows.map(c =>
                    c.id === cowId
                        ? { 
                            ...c, 
                            state: 'hungry' as CowState, 
                            fullness: GAME_CONFIG.COW.INITIAL_FULLNESS_HUNGRY,
                            lastFedAt: null,
                          }
                        : c
                ),
                inventory: {
                    ...state.inventory,
                    milk: state.inventory.milk + 1,
                },
            };
        }

        case ActionTypes.FEED_COW: {
            const { cowId } = action.payload as { cowId: string };
            
            if (state.inventory.grass < 1) {
                console.warn('Not enough grass to feed cow');
                return state;
            }
            
            const cow = state.cows.find(c => c.id === cowId);
            if (!cow || cow.state !== 'hungry') {
                return state;
            }
            
            return {
                ...state,
                cows: state.cows.map(c =>
                    c.id === cowId
                        ? { 
                            ...c, 
                            state: 'producing' as CowState, 
                            fullness: GAME_CONFIG.COW.INITIAL_FULLNESS_PRODUCING,
                            lastFedAt: Date.now(),
                          }
                        : c
                ),
                inventory: {
                    ...state.inventory,
                    grass: state.inventory.grass - 1,
                },
            };
        }

        case ActionTypes.BREED_COWS: {
            const { cowId1, cowId2, spawnPosition } = action.payload as { cowId1: string; cowId2: string; spawnPosition: Position };
            const cow1 = state.cows.find(c => c.id === cowId1);
            const cow2 = state.cows.find(c => c.id === cowId2);

            if (!cow1 || !cow2) return state;

            const now = Date.now();
            const cooldown = GAME_CONFIG.COW.BREEDING_COOLDOWN_MS;

            if (now - cow1.lastBredAt < cooldown || now - cow2.lastBredAt < cooldown) {
                return state;
            }

            const newCow: Cow = {
                ...createCow(averageColors(cow1.color, cow2.color), spawnPosition),
            };

            return {
                ...state,
                cows: [
                    ...state.cows.map(cow => {
                        if (cow.id === cowId1 || cow.id === cowId2) {
                            return {
                                ...cow,
                                state: 'hungry' as CowState,
                                fullness: GAME_CONFIG.COW.INITIAL_FULLNESS_HUNGRY,
                                lastFedAt: null,
                                lastBredAt: now,
                            };
                        }
                        return cow;
                    }),
                    newCow,
                ],
            };
        }

        case ActionTypes.UPDATE_COW_FULLNESS: {
            const { cowId, fullness } = action.payload as { cowId: string; fullness: number };
            return {
                ...state,
                cows: state.cows.map(cow => {
                    if (cow.id !== cowId) return cow;
                    
                    const newFullness = Math.min(1, fullness);
                    const newState: CowState = newFullness >= 1 ? 'full' : cow.state;
                    
                    return { ...cow, fullness: newFullness, state: newState };
                }),
            };
        }

        case ActionTypes.UPDATE_COW_POSITION: {
            const { cowId, position } = action.payload as { cowId: string; position: Position };
            return {
                ...state,
                cows: state.cows.map(cow =>
                    cow.id === cowId ? { ...cow, position } : cow
                ),
            };
        }

        case ActionTypes.UPDATE_COW_FACING: {
            const { cowId, facingRight } = action.payload as { cowId: string; facingRight: boolean };
            return {
                ...state,
                cows: state.cows.map(cow =>
                    cow.id === cowId ? { ...cow, facingRight } : cow
                ),
            };
        }

        case ActionTypes.ADD_COW: {
            const { cow } = action.payload as { cow: Cow };
            return {
                ...state,
                cows: [...state.cows, cow],
            };
        }

        case ActionTypes.REMOVE_COW: {
            const { cowId } = action.payload as { cowId: string };
            return {
                ...state,
                cows: state.cows.filter(cow => cow.id !== cowId),
            };
        }

        case ActionTypes.SET_DRAGGING_COW: {
            const { cowId, position } = action.payload as { cowId: string; position: Position };
            return {
                ...state,
                draggingCow: { cowId, position },
            };
        }

        case ActionTypes.CLEAR_DRAGGING_COW: {
            return {
                ...state,
                draggingCow: { cowId: null, position: null },
            };
        }

        case ActionTypes.TRIGGER_CHAOS: {
            const { impulses } = action.payload as { impulses: { [cowId: string]: Position } };
            return {
                ...state,
                chaosImpulses: impulses,
            };
        }

        case ActionTypes.CLEAR_COW_IMPULSE: {
            const { cowId } = action.payload as { cowId: string };
            const newImpulses = { ...state.chaosImpulses };
            delete newImpulses[cowId];
            return {
                ...state,
                chaosImpulses: newImpulses,
            };
        }

        default:
            return null; // Not handled by this reducer
    }
}

