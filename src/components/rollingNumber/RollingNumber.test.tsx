/**
 * RollingNumber Component Tests
 */

import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RollingNumber from './RollingNumber';

describe('RollingNumber', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('rendering', () => {
        it('renders initial value', () => {
            render(<RollingNumber value={100} />);
            expect(screen.getByText('100')).toBeInTheDocument();
        });

        it('renders zero value', () => {
            render(<RollingNumber value={0} />);
            expect(screen.getByText('0')).toBeInTheDocument();
        });

        it('renders negative values', () => {
            render(<RollingNumber value={-50} />);
            expect(screen.getByText('-50')).toBeInTheDocument();
        });
    });

    describe('formatting', () => {
        it('uses custom format function', () => {
            const formatFn = (v: number) => `$${v.toFixed(2)}`;
            render(<RollingNumber value={42} formatFn={formatFn} />);
            expect(screen.getByText('$42.00')).toBeInTheDocument();
        });

        it('uses default toString format', () => {
            render(<RollingNumber value={1234} />);
            expect(screen.getByText('1234')).toBeInTheDocument();
        });
    });

    describe('animation', () => {
        it('animates from old value to new value', async () => {
            const { rerender } = render(<RollingNumber value={0} />);
            expect(screen.getByText('0')).toBeInTheDocument();

            rerender(<RollingNumber value={100} />);

            // Fast forward through animation
            act(() => {
                jest.advanceTimersByTime(500);
            });

            // Should reach final value
            await waitFor(() => {
                expect(screen.getByText('100')).toBeInTheDocument();
            });
        });

        it('calls onAnimating callback when animation starts', async () => {
            const onAnimating = jest.fn();
            const { rerender } = render(
                <RollingNumber value={0} onAnimating={onAnimating} />
            );

            rerender(<RollingNumber value={100} onAnimating={onAnimating} />);

            // Animation should start
            await waitFor(() => {
                expect(onAnimating).toHaveBeenCalledWith(true);
            });
        });

        it('calls onAnimating callback with false when animation ends', async () => {
            const onAnimating = jest.fn();
            const { rerender } = render(
                <RollingNumber value={0} onAnimating={onAnimating} />
            );

            rerender(<RollingNumber value={100} onAnimating={onAnimating} />);

            // Fast forward to end of animation
            act(() => {
                jest.advanceTimersByTime(500);
            });

            await waitFor(() => {
                expect(onAnimating).toHaveBeenCalledWith(false);
            });
        });

        it('respects custom duration', async () => {
            const onAnimating = jest.fn();
            const { rerender } = render(
                <RollingNumber value={0} duration={1000} onAnimating={onAnimating} />
            );

            rerender(<RollingNumber value={100} duration={1000} onAnimating={onAnimating} />);

            // At 500ms, should still be animating (duration is 1000ms)
            act(() => {
                jest.advanceTimersByTime(500);
            });

            // Continue until animation completes
            act(() => {
                jest.advanceTimersByTime(600);
            });

            await waitFor(() => {
                expect(screen.getByText('100')).toBeInTheDocument();
            });
        });
    });

    describe('no animation when value unchanged', () => {
        it('does not animate when value stays the same', () => {
            const onAnimating = jest.fn();
            const { rerender } = render(
                <RollingNumber value={50} onAnimating={onAnimating} />
            );

            rerender(<RollingNumber value={50} onAnimating={onAnimating} />);

            // Should not call onAnimating since value didn't change
            expect(onAnimating).not.toHaveBeenCalled();
        });
    });

    describe('className', () => {
        it('applies custom className', () => {
            render(<RollingNumber value={100} className="custom-class" />);
            expect(screen.getByText('100')).toHaveClass('custom-class');
        });
    });

    describe('cleanup', () => {
        it('clears interval on unmount', () => {
            const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
            const { unmount, rerender } = render(<RollingNumber value={0} />);
            
            // Trigger animation
            rerender(<RollingNumber value={100} />);
            
            // Unmount before animation completes
            unmount();
            
            expect(clearIntervalSpy).toHaveBeenCalled();
            clearIntervalSpy.mockRestore();
        });
    });

    describe('rapid value changes', () => {
        it('handles rapid value changes', async () => {
            const { rerender } = render(<RollingNumber value={0} />);

            // Rapid changes
            rerender(<RollingNumber value={50} />);
            act(() => {
                jest.advanceTimersByTime(100);
            });
            
            rerender(<RollingNumber value={100} />);
            act(() => {
                jest.advanceTimersByTime(100);
            });
            
            rerender(<RollingNumber value={200} />);
            act(() => {
                jest.advanceTimersByTime(500);
            });

            // Should eventually reach final value
            await waitFor(() => {
                expect(screen.getByText('200')).toBeInTheDocument();
            });
        });
    });
});

