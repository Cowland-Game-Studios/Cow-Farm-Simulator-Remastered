// Jest setup file
// This runs before all tests

import '@testing-library/jest-dom';

// Polyfill structuredClone for Node.js environments that don't have it
if (typeof global.structuredClone === 'undefined') {
    global.structuredClone = <T>(obj: T): T => {
        if (obj === undefined) return undefined as unknown as T;
        if (obj === null) return null as unknown as T;
        return JSON.parse(JSON.stringify(obj));
    };
}

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => setTimeout(cb, 16) as unknown as number);
global.cancelAnimationFrame = jest.fn((id) => clearTimeout(id as unknown as NodeJS.Timeout));

// Mock document.elementsFromPoint
document.elementsFromPoint = jest.fn(() => []);

// Mock Audio
global.Audio = jest.fn(() => ({
    play: jest.fn(() => Promise.resolve()),
    pause: jest.fn(),
    volume: 1,
    playbackRate: 1,
})) as jest.Mock;

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});

// Mock localStorage
const mockLocalStorage = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: jest.fn((key: string) => store[key] || null),
        setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
        removeItem: jest.fn((key: string) => { delete store[key]; }),
        clear: jest.fn(() => { store = {}; }),
    };
})();
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

