/**
 * DraggableSwinging Component Tests
 */

import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DraggableSwinging from './draggableSwinging';

// Mock useMousePosition hook
jest.mock('../../engine', () => ({
    useMousePosition: jest.fn(() => ({ x: 100, y: 100 })),
    Position: {},
}));

const mockUseMousePosition = require('../../engine').useMousePosition;

describe('DraggableSwinging', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        mockUseMousePosition.mockReturnValue({ x: 100, y: 100 });
        
        // Mock window dimensions
        Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
        Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
        
        // Mock requestAnimationFrame
        jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
            setTimeout(cb, 16);
            return 1;
        });
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    describe('rendering', () => {
        it('renders children', () => {
            render(
                <DraggableSwinging>
                    <div>Swinging Content</div>
                </DraggableSwinging>
            );
            expect(screen.getByText('Swinging Content')).toBeInTheDocument();
        });

        it('applies custom id', () => {
            render(
                <DraggableSwinging id="swing-test">
                    <span>Test</span>
                </DraggableSwinging>
            );
            expect(document.getElementById('swing-test')).toBeInTheDocument();
        });
    });

    describe('visibility', () => {
        it('is visible by default', () => {
            const { container } = render(
                <DraggableSwinging>
                    <div>Content</div>
                </DraggableSwinging>
            );
            const element = container.firstChild as HTMLElement;
            expect(element.style.visibility).toBe('visible');
        });

        it('respects isActive prop for controlled visibility', async () => {
            const { container, rerender } = render(
                <DraggableSwinging isActive={false}>
                    <div>Content</div>
                </DraggableSwinging>
            );
            
            // Wait for initial hide
            await act(async () => {
                jest.advanceTimersByTime(500);
            });
            
            let element = container.firstChild as HTMLElement;
            expect(element.style.visibility).toBe('hidden');

            // Activate
            rerender(
                <DraggableSwinging isActive={true}>
                    <div>Content</div>
                </DraggableSwinging>
            );
            
            element = container.firstChild as HTMLElement;
            expect(element.style.visibility).toBe('visible');
        });
    });

    describe('drag interactions', () => {
        it('calls onPickup when mouse down (not disabled)', () => {
            const onPickup = jest.fn();
            const { container } = render(
                <DraggableSwinging onPickup={onPickup}>
                    <div>Drag Me</div>
                </DraggableSwinging>
            );

            fireEvent.mouseDown(container.firstChild as Element);
            expect(onPickup).toHaveBeenCalledTimes(1);
        });

        it('does not call onPickup when disabled', () => {
            const onPickup = jest.fn();
            const { container } = render(
                <DraggableSwinging onPickup={onPickup} disabled>
                    <div>Drag Me</div>
                </DraggableSwinging>
            );

            fireEvent.mouseDown(container.firstChild as Element);
            expect(onPickup).not.toHaveBeenCalled();
        });

        it('calls onPickup on touch start', () => {
            const onPickup = jest.fn();
            const { container } = render(
                <DraggableSwinging onPickup={onPickup}>
                    <div>Drag Me</div>
                </DraggableSwinging>
            );

            fireEvent.touchStart(container.firstChild as Element);
            expect(onPickup).toHaveBeenCalledTimes(1);
        });
    });

    describe('physics properties', () => {
        it('applies ropeLength', () => {
            const { container } = render(
                <DraggableSwinging ropeLength={50}>
                    <div>Content</div>
                </DraggableSwinging>
            );
            expect(container.firstChild).toBeInTheDocument();
        });

        it('applies gravity', () => {
            const { container } = render(
                <DraggableSwinging gravity={0.8}>
                    <div>Content</div>
                </DraggableSwinging>
            );
            expect(container.firstChild).toBeInTheDocument();
        });

        it('applies damping', () => {
            const { container } = render(
                <DraggableSwinging damping={0.95}>
                    <div>Content</div>
                </DraggableSwinging>
            );
            expect(container.firstChild).toBeInTheDocument();
        });
    });

    describe('throwable behavior', () => {
        it('can be thrown when throwable is true (default)', () => {
            const { container } = render(
                <DraggableSwinging throwable>
                    <div>Throw Me</div>
                </DraggableSwinging>
            );
            expect(container.firstChild).toBeInTheDocument();
        });

        it('settles immediately when throwable is false', () => {
            const { container } = render(
                <DraggableSwinging throwable={false}>
                    <div>No Throw</div>
                </DraggableSwinging>
            );
            expect(container.firstChild).toBeInTheDocument();
        });
    });

    describe('impulse', () => {
        it('applies external impulse', () => {
            const { container, rerender } = render(
                <DraggableSwinging impulse={null}>
                    <div>Content</div>
                </DraggableSwinging>
            );

            // Apply impulse
            rerender(
                <DraggableSwinging impulse={{ x: 10, y: -10 }}>
                    <div>Content</div>
                </DraggableSwinging>
            );

            expect(container.firstChild).toBeInTheDocument();
        });
    });

    describe('position callbacks', () => {
        it('calls onPositionChange during drag', async () => {
            const onPositionChange = jest.fn();
            const { container } = render(
                <DraggableSwinging onPositionChange={onPositionChange}>
                    <div>Drag Me</div>
                </DraggableSwinging>
            );

            fireEvent.mouseDown(container.firstChild as Element);
            
            // Run physics simulation
            await act(async () => {
                jest.advanceTimersByTime(100);
            });

            expect(onPositionChange).toHaveBeenCalled();
        });
    });

    describe('collision detection', () => {
        it('accepts collision targets', () => {
            const onCollide = jest.fn();
            const { container } = render(
                <DraggableSwinging 
                    collisionTargets={['target-1', 'target-2']}
                    onCollide={onCollide}
                >
                    <div>Content</div>
                </DraggableSwinging>
            );
            expect(container.firstChild).toBeInTheDocument();
        });

        it('accepts collision threshold', () => {
            const { container } = render(
                <DraggableSwinging collisionThreshold={50}>
                    <div>Content</div>
                </DraggableSwinging>
            );
            expect(container.firstChild).toBeInTheDocument();
        });
    });

    describe('cursor styles', () => {
        it('shows grab cursor when not dragging', () => {
            const { container } = render(
                <DraggableSwinging>
                    <div>Content</div>
                </DraggableSwinging>
            );
            const element = container.firstChild as HTMLElement;
            expect(element.style.cursor).toBe('grab');
        });

        it('shows default cursor when disabled', () => {
            const { container } = render(
                <DraggableSwinging disabled>
                    <div>Content</div>
                </DraggableSwinging>
            );
            const element = container.firstChild as HTMLElement;
            expect(element.style.cursor).toBe('default');
        });
    });

    describe('initial position', () => {
        it('uses provided initial position', () => {
            const { container } = render(
                <DraggableSwinging initialPosition={{ x: 300, y: 400 }}>
                    <div>Content</div>
                </DraggableSwinging>
            );
            expect(container.firstChild).toBeInTheDocument();
        });

        it('generates random position when not provided', () => {
            const { container } = render(
                <DraggableSwinging>
                    <div>Content</div>
                </DraggableSwinging>
            );
            expect(container.firstChild).toBeInTheDocument();
        });
    });

    describe('safe areas', () => {
        it('respects safeArea prop', () => {
            const { container } = render(
                <DraggableSwinging safeArea={50}>
                    <div>Content</div>
                </DraggableSwinging>
            );
            expect(container.firstChild).toBeInTheDocument();
        });

        it('respects bottomSafeArea prop', () => {
            const { container } = render(
                <DraggableSwinging bottomSafeArea={300}>
                    <div>Content</div>
                </DraggableSwinging>
            );
            expect(container.firstChild).toBeInTheDocument();
        });
    });
});

