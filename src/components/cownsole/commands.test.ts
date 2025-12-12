/**
 * Commands Module Tests
 */

import { 
    executeCommand, 
    getByPath, 
    setByPath, 
    getConfig, 
    configOverrides 
} from './commands';
import { GameState } from '../../engine/types';

// Mock Audio (needs to be a proper constructor)
class MockAudio {
    volume = 1;
    playbackRate = 1;
    play = jest.fn().mockResolvedValue(undefined);
}
Object.defineProperty(global, 'Audio', {
    writable: true,
    value: MockAudio,
});

// Mock window.location.reload
const mockReload = jest.fn();
Object.defineProperty(window, 'location', {
    value: { reload: mockReload },
    writable: true,
});

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value; },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { store = {}; },
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock deleteSave
jest.mock('../../save', () => ({
    deleteSave: jest.fn(),
}));

const createMockState = (): GameState => ({
    userId: null,
    saveId: null,
    lastSavedAt: 0,
    playTime: 0,
    cows: [
        {
            id: 'cow-1',
            color: { r: 255, g: 100, b: 100, a: 0.5 },
            state: 'full',
            fullness: 1,
            position: { x: 300, y: 300 },
            facingRight: false,
            lastFedAt: null,
            lastBredAt: 0,
            createdAt: Date.now(),
        },
    ],
    resources: { coins: 10000 },
    inventory: {
        milk: 5,
        grass: 10,
        cream: 2,
        butter: 0,
        cheese: 0,
        yogurt: 0,
        iceCream: 0,
        cheesecake: 0,
    },
    craftingQueue: [],
    tools: { milking: false, feeding: false, toolPosition: null },
    draggingCow: { cowId: null, position: null },
    ui: { crafting: false, paused: false, saving: false, draggingCraftingItem: false },
    chaosImpulses: {},
    activeBoardCraft: null,
    stats: {
        cowsBred: 0,
        cowsFed: 0,
        cowsMilked: 0,
        milkCollected: 0,
        itemsCrafted: 0,
        creamCrafted: 0,
        butterCrafted: 0,
        cheeseCrafted: 0,
        yogurtCrafted: 0,
        iceCreamCrafted: 0,
        cheesecakeCrafted: 0,
        coinsSpent: 0,
        coinsEarned: 0,
        grassPurchased: 0,
        itemsSold: 0,
        creamSold: 0,
        butterSold: 0,
        cheeseSold: 0,
        yogurtSold: 0,
        iceCreamSold: 0,
        cheesecakeSold: 0,
        totalXpEarned: 0,
    },
    achievements: { unlocked: {} },
});

describe('getByPath', () => {
    it('returns root object for empty path', () => {
        const obj = { a: 1 };
        expect(getByPath(obj, '')).toEqual(obj);
    });

    it('gets nested property', () => {
        const obj = { a: { b: { c: 42 } } };
        expect(getByPath(obj, 'a.b.c')).toBe(42);
    });

    it('handles array indexing with brackets', () => {
        const obj = { items: [{ name: 'first' }, { name: 'second' }] };
        expect(getByPath(obj, 'items[0].name')).toBe('first');
        expect(getByPath(obj, 'items[1].name')).toBe('second');
    });

    it('returns undefined for non-existent path', () => {
        const obj = { a: 1 };
        expect(getByPath(obj, 'b.c')).toBeUndefined();
    });
});

describe('setByPath', () => {
    it('sets nested property immutably', () => {
        const obj = { a: { b: 1 } };
        const result = setByPath(obj, 'a.b', 2);
        
        expect(result.a.b).toBe(2);
        expect(obj.a.b).toBe(1); // Original unchanged
    });

    it('handles array indexing', () => {
        const obj = { items: [1, 2, 3] };
        const result = setByPath(obj, 'items[1]', 99);
        
        expect(result.items[1]).toBe(99);
    });

    it('returns original object if path is empty', () => {
        const obj = { a: 1 };
        expect(setByPath(obj, '', 2)).toEqual(obj);
    });
});

describe('getConfig', () => {
    beforeEach(() => {
        // Clear overrides
        Object.keys(configOverrides).forEach(key => delete configOverrides[key]);
    });

    it('returns config value for valid path', () => {
        const value = getConfig('COW.MILK_PRODUCTION_TIME_MS');
        expect(typeof value).toBe('number');
    });

    it('returns override if set', () => {
        configOverrides['COW.MILK_PRODUCTION_TIME_MS'] = 5000;
        expect(getConfig('COW.MILK_PRODUCTION_TIME_MS')).toBe(5000);
    });
});

describe('executeCommand', () => {
    let mockState: GameState;
    let mockDispatch: jest.Mock;

    beforeEach(() => {
        mockState = createMockState();
        mockDispatch = jest.fn();
        Object.keys(configOverrides).forEach(key => delete configOverrides[key]);
    });

    describe('empty command', () => {
        it('returns empty output for empty input', () => {
            const result = executeCommand('', mockState, mockDispatch);
            expect(result.success).toBe(true);
            expect(result.output).toBe('');
        });

        it('returns empty output for whitespace input', () => {
            const result = executeCommand('   ', mockState, mockDispatch);
            expect(result.success).toBe(true);
            expect(result.output).toBe('');
        });
    });

    describe('unknown command', () => {
        it('returns error for unknown command', () => {
            const result = executeCommand('foobar', mockState, mockDispatch);
            expect(result.success).toBe(false);
            expect(result.output).toContain('Unknown command');
        });
    });

    describe('ls command', () => {
        it('lists root state keys', () => {
            const result = executeCommand('ls', mockState, mockDispatch);
            expect(result.success).toBe(true);
            expect(result.output).toContain('cows');
            expect(result.output).toContain('resources');
            expect(result.output).toContain('inventory');
        });

        it('lists nested path', () => {
            const result = executeCommand('ls inventory', mockState, mockDispatch);
            expect(result.success).toBe(true);
            expect(result.output).toContain('milk');
            expect(result.output).toContain('grass');
        });

        it('returns error for invalid path', () => {
            const result = executeCommand('ls nonexistent', mockState, mockDispatch);
            expect(result.success).toBe(false);
            expect(result.output).toContain('not found');
        });

        it('lists config with --config flag', () => {
            const result = executeCommand('ls --config', mockState, mockDispatch);
            expect(result.success).toBe(true);
            expect(result.output).toContain('GAME_CONFIG');
        });

        it('lists state with --state flag', () => {
            const result = executeCommand('ls --state', mockState, mockDispatch);
            expect(result.success).toBe(true);
            expect(result.output).toContain('Game State');
        });
    });

    describe('dir command', () => {
        it('is alias for ls', () => {
            const result = executeCommand('dir inventory', mockState, mockDispatch);
            expect(result.success).toBe(true);
            expect(result.output).toContain('milk');
        });
    });

    describe('get command', () => {
        it('gets a value', () => {
            const result = executeCommand('get inventory.milk', mockState, mockDispatch);
            expect(result.success).toBe(true);
            expect(result.output).toContain('5');
        });

        it('shows usage for missing path', () => {
            const result = executeCommand('get', mockState, mockDispatch);
            expect(result.success).toBe(false);
            expect(result.output).toContain('Usage');
        });

        it('returns error for invalid path', () => {
            const result = executeCommand('get nonexistent.path', mockState, mockDispatch);
            expect(result.success).toBe(false);
            expect(result.output).toContain('not found');
        });

        it('shows array preview', () => {
            const result = executeCommand('get cows', mockState, mockDispatch);
            expect(result.success).toBe(true);
            expect(result.output).toContain('Array');
        });
    });

    describe('set command', () => {
        it('sets inventory value', () => {
            const result = executeCommand('set inventory.milk 99', mockState, mockDispatch);
            expect(result.success).toBe(true);
            expect(mockDispatch).toHaveBeenCalled();
        });

        it('sets resources.coins', () => {
            const result = executeCommand('set resources.coins 50000', mockState, mockDispatch);
            expect(result.success).toBe(true);
            expect(mockDispatch).toHaveBeenCalled();
        });

        it('shows usage for missing args', () => {
            const result = executeCommand('set', mockState, mockDispatch);
            expect(result.success).toBe(false);
            expect(result.output).toContain('Usage');
        });

        it('returns error for invalid path', () => {
            const result = executeCommand('set nonexistent.path 123', mockState, mockDispatch);
            expect(result.success).toBe(false);
            expect(result.output).toContain('not found');
        });

        it('handles --force flag', () => {
            const result = executeCommand('set inventory.milk 99 --force', mockState, mockDispatch);
            expect(result.success).toBe(true);
        });

        it('sets config with --config flag', () => {
            const result = executeCommand('set --config COW.MILK_PRODUCTION_TIME_MS 5000', mockState, mockDispatch);
            expect(result.success).toBe(true);
            expect(configOverrides['COW.MILK_PRODUCTION_TIME_MS']).toBe(5000);
        });

        it('resets config with reset value', () => {
            configOverrides['COW.MILK_PRODUCTION_TIME_MS'] = 5000;
            const result = executeCommand('set --config COW.MILK_PRODUCTION_TIME_MS reset', mockState, mockDispatch);
            expect(result.success).toBe(true);
            expect(configOverrides['COW.MILK_PRODUCTION_TIME_MS']).toBeUndefined();
        });
    });

    describe('clear command', () => {
        it('returns clear flag', () => {
            const result = executeCommand('clear', mockState, mockDispatch);
            expect(result.success).toBe(true);
            expect(result.clear).toBe(true);
        });
    });

    describe('cow halp command', () => {
        it('shows help', () => {
            const result = executeCommand('cow halp', mockState, mockDispatch);
            expect(result.success).toBe(true);
            expect(result.output).toContain('Moo.sh Commands');
        });

        it('returns moo for plain cow command', () => {
            const result = executeCommand('cow', mockState, mockDispatch);
            expect(result.success).toBe(true);
            expect(result.output).toContain('Moo?');
        });
    });

    describe('cowsay command', () => {
        it('generates cow ASCII art', () => {
            const result = executeCommand('cowsay Hello', mockState, mockDispatch);
            expect(result.success).toBe(true);
            expect(result.output).toContain('Hello');
            expect(result.output).toContain('(oo)');
        });

        it('uses default message if none provided', () => {
            const result = executeCommand('cowsay', mockState, mockDispatch);
            expect(result.success).toBe(true);
            expect(result.output).toContain('Moo!');
        });
    });

    describe('cowable command', () => {
        it('resets all cows', () => {
            const result = executeCommand('cowable', mockState, mockDispatch);
            expect(result.success).toBe(true);
            expect(result.output).toContain('Reset');
            expect(mockDispatch).toHaveBeenCalled();
        });

        it('returns error if no cows', () => {
            mockState.cows = [];
            const result = executeCommand('cowable', mockState, mockDispatch);
            expect(result.success).toBe(false);
            expect(result.output).toContain('No cows');
        });
    });

    describe('udder chaos command', () => {
        it('triggers chaos', () => {
            const result = executeCommand('udder chaos', mockState, mockDispatch);
            expect(result.success).toBe(true);
            expect(result.output).toContain('CHAOS');
            expect(result.closeConsole).toBe(true);
            expect(mockDispatch).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'TRIGGER_CHAOS' })
            );
        });

        it('returns error for unknown udder command', () => {
            const result = executeCommand('udder foo', mockState, mockDispatch);
            expect(result.success).toBe(false);
            expect(result.output).toContain('Unknown udder command');
        });
    });

    describe('cheats command', () => {
        it('sets everything to 1 billion', () => {
            const result = executeCommand('cheats', mockState, mockDispatch);
            expect(result.success).toBe(true);
            expect(result.output).toContain('CHEATS ACTIVATED');
            expect(mockDispatch).toHaveBeenCalled();
        });
    });

    describe('mooclear command', () => {
        it('shows warning without --confirm', () => {
            const result = executeCommand('mooclear', mockState, mockDispatch);
            expect(result.success).toBe(true);
            expect(result.warning).toBe(true);
            expect(result.output).toContain('NUCLEAR OPTION');
        });

        it('deletes save with --confirm', () => {
            jest.useFakeTimers();
            const result = executeCommand('mooclear --confirm', mockState, mockDispatch);
            expect(result.success).toBe(true);
            expect(result.output).toContain('deleted');
            jest.useRealTimers();
        });
    });

    describe('case insensitivity', () => {
        it('handles uppercase commands', () => {
            const result = executeCommand('LS', mockState, mockDispatch);
            expect(result.success).toBe(true);
        });

        it('handles mixed case commands', () => {
            const result = executeCommand('CowSay Hello', mockState, mockDispatch);
            expect(result.success).toBe(true);
        });
    });
});

