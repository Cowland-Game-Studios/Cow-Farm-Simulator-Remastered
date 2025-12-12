/**
 * Dock Component Tests
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dock from './dock';

describe('Dock', () => {
    describe('rendering', () => {
        it('renders without crashing', () => {
            render(<Dock />);
            expect(document.querySelector('[class*="dock"]')).toBeInTheDocument();
        });

        it('renders children', () => {
            render(
                <Dock>
                    <button>Button 1</button>
                    <button>Button 2</button>
                </Dock>
            );
            expect(screen.getByText('Button 1')).toBeInTheDocument();
            expect(screen.getByText('Button 2')).toBeInTheDocument();
        });

        it('renders with no children', () => {
            render(<Dock />);
            const container = document.querySelector('[class*="dockContainer"]');
            expect(container).toBeInTheDocument();
            expect(container?.childElementCount).toBe(0);
        });
    });

    describe('styling', () => {
        it('applies custom inline styles', () => {
            render(<Dock style={{ backgroundColor: 'red', padding: '10px' }} />);
            const dock = document.querySelector('[class*="dock"]');
            expect(dock).toHaveStyle({ backgroundColor: 'red', padding: '10px' });
        });

        it('passes through additional props', () => {
            render(<Dock data-testid="my-dock" />);
            expect(screen.getByTestId('my-dock')).toBeInTheDocument();
        });
    });

    describe('structure', () => {
        it('has dock container inside dock', () => {
            render(<Dock><span>Content</span></Dock>);
            const dock = document.querySelector('[class*="dock"]');
            const container = dock?.querySelector('[class*="dockContainer"]');
            expect(container).toBeInTheDocument();
            expect(screen.getByText('Content')).toBeInTheDocument();
        });
    });
});

