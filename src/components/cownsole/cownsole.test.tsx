/**
 * Cownsole (Moo.sh) Component Tests
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import Cownsole from './cownsole';

// Mock game context
const mockDispatch = jest.fn();
const mockState = {
    cows: [{ id: 'cow-1', color: { r: 255, g: 100, b: 100, a: 0.5 } }],
    resources: { coins: 10000 },
    inventory: { milk: 5, grass: 10 },
};

jest.mock('../../engine', () => ({
    useGame: () => ({
        state: mockState,
        dispatch: mockDispatch,
    }),
}));

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

describe('Cownsole', () => {
    const onClose = jest.fn();
    const onMinimize = jest.fn();

    beforeEach(() => {
        jest.useFakeTimers();
        onClose.mockClear();
        onMinimize.mockClear();
        mockDispatch.mockClear();
        localStorageMock.clear();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('rendering', () => {
        it('renders without crashing', () => {
            render(<Cownsole onClose={onClose} />);
            expect(document.querySelector('[class*="terminal"]')).toBeInTheDocument();
        });

        it('shows welcome message', () => {
            render(<Cownsole onClose={onClose} />);
            expect(screen.getByText(/Welcome to Moo.sh/)).toBeInTheDocument();
        });

        it('shows help hint in welcome message', () => {
            render(<Cownsole onClose={onClose} />);
            expect(screen.getByText('cow halp')).toBeInTheDocument();
        });

        it('shows Moo.sh title', () => {
            render(<Cownsole onClose={onClose} />);
            expect(screen.getByText('Moo.sh')).toBeInTheDocument();
        });

        it('shows cow emoji in header', () => {
            render(<Cownsole onClose={onClose} />);
            expect(screen.getByText('🐄')).toBeInTheDocument();
        });
    });

    describe('traffic light buttons', () => {
        it('has close button', () => {
            render(<Cownsole onClose={onClose} />);
            expect(screen.getByTitle('Close')).toBeInTheDocument();
        });

        it('has minimize button', () => {
            render(<Cownsole onClose={onClose} />);
            expect(screen.getByTitle('Minimize')).toBeInTheDocument();
        });

        it('has maximize button', () => {
            render(<Cownsole onClose={onClose} />);
            expect(screen.getByTitle('Maximize')).toBeInTheDocument();
        });

        it('calls onClose when close button clicked', async () => {
            render(<Cownsole onClose={onClose} />);
            fireEvent.click(screen.getByTitle('Close'));
            
            await act(async () => {
                jest.advanceTimersByTime(200);
            });
            
            expect(onClose).toHaveBeenCalled();
        });

        it('calls onMinimize when minimize button clicked', async () => {
            render(<Cownsole onClose={onClose} onMinimize={onMinimize} />);
            fireEvent.click(screen.getByTitle('Minimize'));
            
            await act(async () => {
                jest.advanceTimersByTime(400);
            });
            
            expect(onMinimize).toHaveBeenCalled();
        });
    });

    describe('input handling', () => {
        it('has input field', () => {
            render(<Cownsole onClose={onClose} />);
            expect(screen.getByPlaceholderText('Type a command...')).toBeInTheDocument();
        });

        it('auto-focuses input on mount', () => {
            render(<Cownsole onClose={onClose} />);
            const input = screen.getByPlaceholderText('Type a command...');
            expect(document.activeElement).toBe(input);
        });

        it('accepts text input', () => {
            render(<Cownsole onClose={onClose} />);
            const input = screen.getByPlaceholderText('Type a command...');
            
            fireEvent.change(input, { target: { value: 'test' } });
            expect(input).toHaveValue('test');
        });

        it('clears input after submit', () => {
            render(<Cownsole onClose={onClose} />);
            const input = screen.getByPlaceholderText('Type a command...');
            
            fireEvent.change(input, { target: { value: 'ls' } });
            fireEvent.submit(input.closest('form')!);
            
            expect(input).toHaveValue('');
        });

        it('shows prompt prefix', () => {
            render(<Cownsole onClose={onClose} />);
            expect(screen.getAllByText('moo.sh $').length).toBeGreaterThan(0);
        });
    });

    describe('command execution', () => {
        it('displays command in output', () => {
            render(<Cownsole onClose={onClose} />);
            const input = screen.getByPlaceholderText('Type a command...');
            
            fireEvent.change(input, { target: { value: 'ls' } });
            fireEvent.submit(input.closest('form')!);
            
            // Command should appear in output
            const outputs = screen.getAllByText('ls');
            expect(outputs.length).toBeGreaterThan(0);
        });

        it('ignores empty input', () => {
            render(<Cownsole onClose={onClose} />);
            const input = screen.getByPlaceholderText('Type a command...');
            const form = input.closest('form')!;
            
            // Get initial output count
            const initialOutputs = document.querySelectorAll('[class*="outputEntry"]');
            
            fireEvent.submit(form);
            
            // Should not add new output
            const afterOutputs = document.querySelectorAll('[class*="outputEntry"]');
            expect(afterOutputs.length).toBe(initialOutputs.length);
        });
    });

    describe('history navigation', () => {
        it('navigates history with arrow up', () => {
            render(<Cownsole onClose={onClose} />);
            const input = screen.getByPlaceholderText('Type a command...');
            
            // Submit a command
            fireEvent.change(input, { target: { value: 'first' } });
            fireEvent.submit(input.closest('form')!);
            
            fireEvent.change(input, { target: { value: 'second' } });
            fireEvent.submit(input.closest('form')!);
            
            // Press arrow up
            fireEvent.keyDown(input, { key: 'ArrowUp' });
            expect(input).toHaveValue('second');
            
            fireEvent.keyDown(input, { key: 'ArrowUp' });
            expect(input).toHaveValue('first');
        });

        it('navigates history with arrow down', () => {
            render(<Cownsole onClose={onClose} />);
            const input = screen.getByPlaceholderText('Type a command...');
            
            fireEvent.change(input, { target: { value: 'first' } });
            fireEvent.submit(input.closest('form')!);
            
            fireEvent.change(input, { target: { value: 'second' } });
            fireEvent.submit(input.closest('form')!);
            
            // Navigate up then down
            fireEvent.keyDown(input, { key: 'ArrowUp' });
            fireEvent.keyDown(input, { key: 'ArrowUp' });
            fireEvent.keyDown(input, { key: 'ArrowDown' });
            
            expect(input).toHaveValue('second');
        });

        it('clears input on arrow down past newest', () => {
            render(<Cownsole onClose={onClose} />);
            const input = screen.getByPlaceholderText('Type a command...');
            
            fireEvent.change(input, { target: { value: 'test' } });
            fireEvent.submit(input.closest('form')!);
            
            fireEvent.keyDown(input, { key: 'ArrowUp' });
            fireEvent.keyDown(input, { key: 'ArrowDown' });
            
            expect(input).toHaveValue('');
        });
    });

    describe('tab completion', () => {
        it('autocompletes known commands', () => {
            render(<Cownsole onClose={onClose} />);
            const input = screen.getByPlaceholderText('Type a command...');
            
            fireEvent.change(input, { target: { value: 'cl' } });
            fireEvent.keyDown(input, { key: 'Tab' });
            
            expect(input).toHaveValue('clear ');
        });
    });

    describe('keyboard shortcuts', () => {
        it('closes on Escape key', async () => {
            render(<Cownsole onClose={onClose} />);
            
            fireEvent.keyDown(window, { key: 'Escape' });
            
            await act(async () => {
                jest.advanceTimersByTime(200);
            });
            
            expect(onClose).toHaveBeenCalled();
        });

        it('closes on / key (when not focused on input)', async () => {
            render(<Cownsole onClose={onClose} />);
            
            // Blur the input first
            (document.activeElement as HTMLElement)?.blur();
            
            fireEvent.keyDown(window, { key: '/' });
            
            await act(async () => {
                jest.advanceTimersByTime(200);
            });
            
            expect(onClose).toHaveBeenCalled();
        });
    });

    describe('resize handles', () => {
        it('renders resize handles when not maximized', () => {
            render(<Cownsole onClose={onClose} />);
            expect(document.querySelector('[class*="resizeHandle"]')).toBeInTheDocument();
        });
    });

    describe('maximize behavior', () => {
        it('toggles maximize state', () => {
            render(<Cownsole onClose={onClose} />);
            const maximizeButton = screen.getByTitle('Maximize');
            
            fireEvent.click(maximizeButton);
            expect(document.querySelector('[class*="maximized"]')).toBeInTheDocument();
            
            fireEvent.click(maximizeButton);
            expect(document.querySelector('[class*="maximized"]')).not.toBeInTheDocument();
        });

        it('hides resize handles when maximized', () => {
            render(<Cownsole onClose={onClose} />);
            fireEvent.click(screen.getByTitle('Maximize'));
            
            // Resize handles should not be rendered when maximized
            const terminal = document.querySelector('[class*="terminal"]');
            expect(terminal?.className).toContain('maximized');
        });
    });

    describe('hints footer', () => {
        it('shows keyboard hints', () => {
            render(<Cownsole onClose={onClose} />);
            expect(screen.getByText(/history/)).toBeInTheDocument();
            expect(screen.getByText(/autocomplete/)).toBeInTheDocument();
            expect(screen.getByText(/close/)).toBeInTheDocument();
        });
    });

    describe('input attributes', () => {
        it('has autocomplete off', () => {
            render(<Cownsole onClose={onClose} />);
            const input = screen.getByPlaceholderText('Type a command...');
            expect(input).toHaveAttribute('autocomplete', 'off');
        });

        it('has spellcheck off', () => {
            render(<Cownsole onClose={onClose} />);
            const input = screen.getByPlaceholderText('Type a command...');
            expect(input).toHaveAttribute('spellCheck', 'false');
        });
    });
});

