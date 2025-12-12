/**
 * ErrorBoundary Component Tests
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ErrorBoundary from './ErrorBoundary';

// Component that throws an error
const ThrowingComponent: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = true }) => {
    if (shouldThrow) {
        throw new Error('Test error message');
    }
    return <div>No error</div>;
};

// Suppress console.error for these tests
const originalError = console.error;
beforeAll(() => {
    console.error = jest.fn();
});
afterAll(() => {
    console.error = originalError;
});

describe('ErrorBoundary', () => {
    describe('normal rendering', () => {
        it('renders children when there is no error', () => {
            render(
                <ErrorBoundary>
                    <div>Child content</div>
                </ErrorBoundary>
            );
            expect(screen.getByText('Child content')).toBeInTheDocument();
        });

        it('renders multiple children', () => {
            render(
                <ErrorBoundary>
                    <div>First</div>
                    <div>Second</div>
                </ErrorBoundary>
            );
            expect(screen.getByText('First')).toBeInTheDocument();
            expect(screen.getByText('Second')).toBeInTheDocument();
        });
    });

    describe('error handling', () => {
        it('catches errors and shows fallback UI', () => {
            render(
                <ErrorBoundary>
                    <ThrowingComponent />
                </ErrorBoundary>
            );
            expect(screen.getByText('Oops!')).toBeInTheDocument();
        });

        it('shows broken fence ASCII art', () => {
            render(
                <ErrorBoundary>
                    <ThrowingComponent />
                </ErrorBoundary>
            );
            // The fence contains pipes and equals signs
            const fence = document.querySelector('pre');
            expect(fence).toBeInTheDocument();
            expect(fence?.textContent).toContain('|');
            expect(fence?.textContent).toContain('====');
        });

        it('uses custom fallback when provided', () => {
            render(
                <ErrorBoundary fallback={<div>Custom error page</div>}>
                    <ThrowingComponent />
                </ErrorBoundary>
            );
            expect(screen.getByText('Custom error page')).toBeInTheDocument();
            expect(screen.queryByText('Oops!')).not.toBeInTheDocument();
        });

        it('calls onError callback when error occurs', () => {
            const onError = jest.fn();
            render(
                <ErrorBoundary onError={onError}>
                    <ThrowingComponent />
                </ErrorBoundary>
            );
            expect(onError).toHaveBeenCalledTimes(1);
            expect(onError).toHaveBeenCalledWith(
                expect.any(Error),
                expect.objectContaining({
                    componentStack: expect.any(String),
                })
            );
        });

        it('logs error to console', () => {
            render(
                <ErrorBoundary>
                    <ThrowingComponent />
                </ErrorBoundary>
            );
            expect(console.error).toHaveBeenCalled();
        });
    });

    describe('error display (development mode)', () => {
        it('shows error state when error occurs', () => {
            render(
                <ErrorBoundary>
                    <ThrowingComponent />
                </ErrorBoundary>
            );
            // Error boundary should show the Oops! message
            expect(screen.getByText('Oops!')).toBeInTheDocument();
        });
    });

    describe('recovery', () => {
        it('continues to show error after initial catch', () => {
            const { rerender } = render(
                <ErrorBoundary>
                    <ThrowingComponent shouldThrow={true} />
                </ErrorBoundary>
            );
            
            expect(screen.getByText('Oops!')).toBeInTheDocument();
            
            // Rerendering doesn't recover automatically
            rerender(
                <ErrorBoundary>
                    <ThrowingComponent shouldThrow={false} />
                </ErrorBoundary>
            );
            
            // Still shows error (boundary state is not reset)
            expect(screen.getByText('Oops!')).toBeInTheDocument();
        });
    });
});

