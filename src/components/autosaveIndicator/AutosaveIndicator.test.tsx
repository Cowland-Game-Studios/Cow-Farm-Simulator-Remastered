/**
 * AutosaveIndicator Component Tests
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AutosaveIndicator } from './AutosaveIndicator';

describe('AutosaveIndicator', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('visibility', () => {
        it('returns null when not saving and never saved', () => {
            const { container } = render(
                <AutosaveIndicator isSaving={false} lastSavedAt={0} />
            );
            expect(container.firstChild).toBeNull();
        });

        it('shows when isSaving is true', () => {
            render(<AutosaveIndicator isSaving={true} lastSavedAt={0} />);
            expect(screen.getByText('Saving...')).toBeInTheDocument();
        });

        it('shows "Saved" after save completes', async () => {
            const { rerender } = render(
                <AutosaveIndicator isSaving={true} lastSavedAt={0} />
            );
            
            // Complete the save
            rerender(<AutosaveIndicator isSaving={false} lastSavedAt={Date.now()} />);
            
            expect(screen.getByText('Saved')).toBeInTheDocument();
        });
    });

    describe('timing behavior', () => {
        it('hides after delay when save completes', async () => {
            const { rerender } = render(
                <AutosaveIndicator isSaving={true} lastSavedAt={0} />
            );
            
            // Complete the save
            rerender(<AutosaveIndicator isSaving={false} lastSavedAt={Date.now()} />);
            
            expect(screen.getByText('Saved')).toBeInTheDocument();
            
            // Advance timers past the hide delay (1500ms)
            act(() => {
                jest.advanceTimersByTime(1600);
            });
            
            // After timer, visible state should be false (null returned)
            await waitFor(() => {
                expect(screen.queryByText('Saved')).not.toBeInTheDocument();
            });
        });

        it('shows immediately when saving starts', () => {
            const { rerender } = render(
                <AutosaveIndicator isSaving={false} lastSavedAt={0} />
            );
            
            rerender(<AutosaveIndicator isSaving={true} lastSavedAt={0} />);
            
            expect(screen.getByText('Saving...')).toBeInTheDocument();
        });
    });

    describe('icons', () => {
        it('shows save icon when saving', () => {
            render(<AutosaveIndicator isSaving={true} lastSavedAt={0} />);
            // Should have the floppy disk icon (SVG with path)
            const svg = document.querySelector('svg');
            expect(svg).toBeInTheDocument();
        });

        it('shows checkmark when saved', () => {
            const { rerender } = render(
                <AutosaveIndicator isSaving={true} lastSavedAt={0} />
            );
            
            rerender(<AutosaveIndicator isSaving={false} lastSavedAt={Date.now()} />);
            
            // Should have checkmark icon (polyline with specific points)
            const polyline = document.querySelector('polyline');
            expect(polyline).toBeInTheDocument();
        });
    });

    describe('CSS classes', () => {
        it('has visible class when showing', () => {
            render(<AutosaveIndicator isSaving={true} lastSavedAt={0} />);
            const container = document.querySelector('[class*="container"]');
            expect(container?.className).toContain('visible');
        });

        it('has spinning class when saving', () => {
            render(<AutosaveIndicator isSaving={true} lastSavedAt={0} />);
            const icon = document.querySelector('[class*="icon"]');
            expect(icon?.className).toContain('spinning');
        });

        it('does not have spinning class when saved', () => {
            const { rerender } = render(
                <AutosaveIndicator isSaving={true} lastSavedAt={0} />
            );
            
            rerender(<AutosaveIndicator isSaving={false} lastSavedAt={Date.now()} />);
            
            const icon = document.querySelector('[class*="icon"]');
            expect(icon?.className).not.toContain('spinning');
        });
    });
});

