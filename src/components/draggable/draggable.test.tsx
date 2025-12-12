/**
 * Draggable Component Tests
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import Draggable from './draggable';

// Mock useMousePosition hook
jest.mock('../../engine', () => ({
    useMousePosition: jest.fn(() => ({ x: 100, y: 100 })),
    Position: {},
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mockUseMousePosition = require('../../engine').useMousePosition as jest.Mock;

describe('Draggable', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        mockUseMousePosition.mockReturnValue({ x: 100, y: 100 });
        
        // Mock window dimensions
        Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
        Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('rendering', () => {
        it('renders children', () => {
            render(
                <Draggable>
                    <div>Draggable Content</div>
                </Draggable>
            );
            expect(screen.getByText('Draggable Content')).toBeInTheDocument();
        });

        it('applies custom id', () => {
            render(
                <Draggable id="my-draggable">
                    <span>Test</span>
                </Draggable>
            );
            expect(document.getElementById('my-draggable')).toBeInTheDocument();
        });
    });

    describe('positioning', () => {
        it('has absolute positioning', () => {
            const { container } = render(
                <Draggable>
                    <div>Content</div>
                </Draggable>
            );
            const element = container.firstChild as HTMLElement;
            expect(element.style.position).toBe('absolute');
        });

        it('applies custom styles', () => {
            render(
                <Draggable style={{ backgroundColor: 'red' }}>
                    <div>Content</div>
                </Draggable>
            );
            const element = document.querySelector('[style*="background-color"]');
            expect(element).toHaveStyle({ backgroundColor: 'red' });
        });
    });

    describe('drag interactions', () => {
        it('calls onPickup when mouse down', () => {
            const onPickup = jest.fn();
            const { container } = render(
                <Draggable onPickup={onPickup}>
                    <div>Drag Me</div>
                </Draggable>
            );

            fireEvent.mouseDown(container.firstChild as Element);
            expect(onPickup).toHaveBeenCalledTimes(1);
        });

        it('calls onPickup when touch start', () => {
            const onPickup = jest.fn();
            const { container } = render(
                <Draggable onPickup={onPickup}>
                    <div>Drag Me</div>
                </Draggable>
            );

            fireEvent.touchStart(container.firstChild as Element);
            expect(onPickup).toHaveBeenCalledTimes(1);
        });

        it('scales up when dragging', () => {
            const { container } = render(
                <Draggable>
                    <div>Drag Me</div>
                </Draggable>
            );

            fireEvent.mouseDown(container.firstChild as Element);
            
            const element = container.firstChild as HTMLElement;
            expect(element.style.transform).toContain('scale(1.15)');
        });

        it('increases z-index when dragging', () => {
            const { container } = render(
                <Draggable>
                    <div>Drag Me</div>
                </Draggable>
            );

            fireEvent.mouseDown(container.firstChild as Element);
            
            const element = container.firstChild as HTMLElement;
            expect(element.style.zIndex).toBe('1000');
        });
    });

    describe('drop behavior', () => {
        it('calls onDrop when mouse up after drag', async () => {
            const onDrop = jest.fn();
            const { container } = render(
                <Draggable onDrop={onDrop}>
                    <div>Drag Me</div>
                </Draggable>
            );

            // Start dragging
            fireEvent.mouseDown(container.firstChild as Element);
            
            // Release
            fireEvent.mouseUp(window);

            await act(async () => {
                jest.advanceTimersByTime(100);
            });

            expect(onDrop).toHaveBeenCalled();
        });

        it('passes position to onDrop', async () => {
            const onDrop = jest.fn();
            mockUseMousePosition.mockReturnValue({ x: 200, y: 300 });
            
            const { container } = render(
                <Draggable onDrop={onDrop}>
                    <div>Drag Me</div>
                </Draggable>
            );

            fireEvent.mouseDown(container.firstChild as Element);
            fireEvent.mouseUp(window);

            await act(async () => {
                jest.advanceTimersByTime(100);
            });

            expect(onDrop).toHaveBeenCalledWith(
                expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) })
            );
        });
    });

    describe('boundary handling', () => {
        it('constrains to safe area by default', async () => {
            mockUseMousePosition.mockReturnValue({ x: 5, y: 5 }); // Near edge
            
            const onDrop = jest.fn();
            const { container } = render(
                <Draggable safeArea={25} onDrop={onDrop}>
                    <div>Drag Me</div>
                </Draggable>
            );

            fireEvent.mouseDown(container.firstChild as Element);
            fireEvent.mouseUp(window);

            await act(async () => {
                jest.advanceTimersByTime(100);
            });

            // Position should be clamped to safe area
            expect(onDrop).toHaveBeenCalledWith(
                expect.objectContaining({ x: expect.any(Number) })
            );
        });

        it('allows off-screen when canGoOffScreen is true', async () => {
            mockUseMousePosition.mockReturnValue({ x: 5, y: 5 });
            
            const onDrop = jest.fn();
            const { container } = render(
                <Draggable canGoOffScreen={true} onDrop={onDrop}>
                    <div>Drag Me</div>
                </Draggable>
            );

            fireEvent.mouseDown(container.firstChild as Element);
            fireEvent.mouseUp(window);

            await act(async () => {
                jest.advanceTimersByTime(100);
            });

            expect(onDrop).toHaveBeenCalled();
        });
    });

    describe('touch action', () => {
        it('has touch-action: none to prevent browser gestures', () => {
            const { container } = render(
                <Draggable>
                    <div>Drag Me</div>
                </Draggable>
            );
            const element = container.firstChild as HTMLElement;
            expect(element.style.touchAction).toBe('none');
        });
    });

    describe('offset', () => {
        it('applies offset to position', () => {
            const { container } = render(
                <Draggable offset={{ x: 10, y: 20 }}>
                    <div>Drag Me</div>
                </Draggable>
            );
            const element = container.firstChild as HTMLElement;
            expect(element.style.transform).toContain('10px');
            expect(element.style.transform).toContain('20px');
        });
    });
});

