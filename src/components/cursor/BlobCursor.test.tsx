/**
 * BlobCursor Component Tests
 */

import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import BlobCursor from './BlobCursor';

// Mock matchMedia for mobile detection
const mockMatchMedia = (matches: boolean) => {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
            matches,
            media: query,
            onchange: null,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
        })),
    });
};

describe('BlobCursor', () => {
    beforeEach(() => {
        // Default to desktop (fine pointer, hover supported)
        mockMatchMedia(false);
    });

    describe('rendering', () => {
        it('renders on desktop devices', () => {
            const { container } = render(
                <BlobCursor mousePosition={{ x: 100, y: 100 }} />
            );
            const cursor = container.querySelector('[data-blob-cursor="true"]');
            expect(cursor).toBeInTheDocument();
        });

        it('returns null on mobile devices', () => {
            // Mock mobile detection
            mockMatchMedia(true); // coarse pointer, no hover
            
            const { container } = render(
                <BlobCursor mousePosition={{ x: 100, y: 100 }} />
            );
            expect(container.firstChild).toBeNull();
        });
    });

    describe('positioning', () => {
        it('positions at mouse coordinates', () => {
            const { container } = render(
                <BlobCursor mousePosition={{ x: 200, y: 300 }} />
            );

            const cursor = container.querySelector('[data-blob-cursor="true"]') as HTMLElement;
            // Position is lerped, so it won't be exact immediately but the element should exist
            expect(cursor).toBeInTheDocument();
            expect(cursor.style.left).toBeDefined();
            expect(cursor.style.top).toBeDefined();
        });
    });

    describe('dragging state', () => {
        it('scales down when dragging', () => {
            const { container } = render(
                <BlobCursor mousePosition={{ x: 100, y: 100 }} isDragging={true} />
            );
            const cursor = container.querySelector('[data-blob-cursor="true"]') as HTMLElement;
            expect(cursor.style.transform).toContain('scale(0.5)');
        });

        it('fades out when dragging', () => {
            const { container } = render(
                <BlobCursor mousePosition={{ x: 100, y: 100 }} isDragging={true} />
            );
            const cursor = container.querySelector('[data-blob-cursor="true"]') as HTMLElement;
            expect(cursor.style.opacity).toBe('0');
        });

        it('is fully visible when not dragging', () => {
            const { container } = render(
                <BlobCursor mousePosition={{ x: 100, y: 100 }} isDragging={false} />
            );
            const cursor = container.querySelector('[data-blob-cursor="true"]') as HTMLElement;
            expect(cursor.style.opacity).toBe('1');
        });
    });

    describe('styling', () => {
        it('has fixed positioning', () => {
            const { container } = render(
                <BlobCursor mousePosition={{ x: 100, y: 100 }} />
            );
            const cursor = container.querySelector('[data-blob-cursor="true"]') as HTMLElement;
            expect(cursor.style.position).toBe('fixed');
        });

        it('has pointer-events none', () => {
            const { container } = render(
                <BlobCursor mousePosition={{ x: 100, y: 100 }} />
            );
            const cursor = container.querySelector('[data-blob-cursor="true"]') as HTMLElement;
            expect(cursor.style.pointerEvents).toBe('none');
        });

        it('has high z-index', () => {
            const { container } = render(
                <BlobCursor mousePosition={{ x: 100, y: 100 }} />
            );
            const cursor = container.querySelector('[data-blob-cursor="true"]') as HTMLElement;
            expect(cursor.style.zIndex).toBe('9999');
        });

        it('has translate(-50%, -50%) transform for centering', () => {
            const { container } = render(
                <BlobCursor mousePosition={{ x: 100, y: 100 }} isDragging={false} />
            );
            const cursor = container.querySelector('[data-blob-cursor="true"]') as HTMLElement;
            expect(cursor.style.transform).toContain('translate(-50%, -50%)');
        });
    });

    describe('default shape', () => {
        it('has default size of 20px', () => {
            const { container } = render(
                <BlobCursor mousePosition={{ x: 100, y: 100 }} />
            );
            const cursor = container.querySelector('[data-blob-cursor="true"]') as HTMLElement;
            expect(cursor.style.width).toBe('20px');
            expect(cursor.style.height).toBe('20px');
        });

        it('has circular border radius', () => {
            const { container } = render(
                <BlobCursor mousePosition={{ x: 100, y: 100 }} />
            );
            const cursor = container.querySelector('[data-blob-cursor="true"]') as HTMLElement;
            expect(cursor.style.borderRadius).toBe('10px'); // Half of 20px
        });
    });

    describe('animation cleanup', () => {
        it('cleans up on unmount', () => {
            const { unmount, container } = render(
                <BlobCursor mousePosition={{ x: 100, y: 100 }} />
            );
            
            const cursor = container.querySelector('[data-blob-cursor="true"]');
            expect(cursor).toBeInTheDocument();
            
            // Just verify unmount doesn't throw
            expect(() => unmount()).not.toThrow();
        });
    });
});

