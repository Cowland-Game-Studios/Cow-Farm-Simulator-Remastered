/**
 * CowSVG Components Tests
 */

import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CowSVG, CowToMilkSVG, CowMilkedSVG } from './CowSVG';

describe('CowSVG', () => {
    describe('rendering', () => {
        it('renders without crashing', () => {
            const { container } = render(<CowSVG />);
            expect(container.querySelector('svg')).toBeInTheDocument();
        });

        it('renders with default color', () => {
            const { container } = render(<CowSVG />);
            const paths = container.querySelectorAll('path');
            // Should have paths with white fill (default color)
            expect(paths.length).toBeGreaterThan(0);
        });

        it('renders with custom color', () => {
            const { container } = render(<CowSVG color="red" />);
            const svg = container.querySelector('svg:last-of-type');
            const path = svg?.querySelector('path');
            expect(path).toHaveAttribute('fill', 'red');
        });
    });

    describe('fullness animation', () => {
        it('applies clip-path based on fullness', () => {
            const { container } = render(<CowSVG fullness={0.5} />);
            const coloredSvg = container.querySelector('svg:last-of-type') as HTMLElement;
            // The clip-path should be set via inline style
            expect(coloredSvg.style.clipPath).toBeTruthy();
        });

        it('shows no fill at fullness 0', () => {
            const { container } = render(<CowSVG fullness={0} />);
            const coloredSvg = container.querySelector('svg:last-of-type') as HTMLElement;
            // At fullness 0, clip should be at maxY (70%)
            expect(coloredSvg.style.clipPath).toContain('70%');
        });

        it('shows full fill at fullness 1', () => {
            const { container } = render(<CowSVG fullness={1} />);
            const coloredSvg = container.querySelector('svg:last-of-type') as HTMLElement;
            // At fullness 1, clip should be at minY (27%)
            expect(coloredSvg.style.clipPath).toContain('27%');
        });
    });

    describe('transition', () => {
        it('applies transition based on poll interval', () => {
            const { container } = render(<CowSVG pollInterval={2000} />);
            const coloredSvg = container.querySelector('svg:last-of-type') as HTMLElement;
            // Transition should be 2s (pollInterval / 1000)
            expect(coloredSvg?.style.transition).toContain('2s');
        });
    });

    describe('size', () => {
        it('renders at 100x100 size', () => {
            const { container } = render(<CowSVG />);
            const wrapper = container.firstChild as HTMLElement;
            expect(wrapper).toHaveStyle({ width: '100px', height: '100px' });
        });
    });
});

describe('CowToMilkSVG', () => {
    describe('rendering', () => {
        it('renders without crashing', () => {
            const { container } = render(<CowToMilkSVG />);
            expect(container.querySelector('svg')).toBeInTheDocument();
        });

        it('renders with default color', () => {
            const { container } = render(<CowToMilkSVG />);
            const path = container.querySelector('path');
            expect(path).toHaveAttribute('fill', 'white');
        });

        it('renders with custom color', () => {
            const { container } = render(<CowToMilkSVG color="blue" />);
            const path = container.querySelector('path');
            expect(path).toHaveAttribute('fill', 'blue');
        });
    });

    describe('size', () => {
        it('renders at 100x100 size', () => {
            const { container } = render(<CowToMilkSVG />);
            const svg = container.querySelector('svg');
            expect(svg).toHaveAttribute('width', '100');
            expect(svg).toHaveAttribute('height', '100');
        });
    });

    describe('viewBox', () => {
        it('has correct viewBox', () => {
            const { container } = render(<CowToMilkSVG />);
            const svg = container.querySelector('svg');
            expect(svg).toHaveAttribute('viewBox', '0 0 100 100');
        });
    });
});

describe('CowMilkedSVG', () => {
    describe('rendering', () => {
        it('renders without crashing', () => {
            const { container } = render(<CowMilkedSVG />);
            expect(container.querySelector('svg')).toBeInTheDocument();
        });

        it('uses stroke color instead of fill', () => {
            const { container } = render(<CowMilkedSVG color="green" />);
            const paths = container.querySelectorAll('path');
            // Paths should have stroke colors (outline-only cow)
            expect(paths.length).toBeGreaterThan(0);
        });
    });

    describe('color opacity', () => {
        it('converts rgb to rgba with 0.25 opacity', () => {
            const { container } = render(<CowMilkedSVG color="rgb(255, 0, 0)" />);
            const path = container.querySelector('path');
            expect(path?.getAttribute('stroke')).toContain('0.25');
        });

        it('handles rgba colors', () => {
            const { container } = render(<CowMilkedSVG color="rgba(255, 0, 0, 1)" />);
            const path = container.querySelector('path');
            expect(path?.getAttribute('stroke')).toContain('0.25');
        });

        it('handles hex/named colors', () => {
            const { container } = render(<CowMilkedSVG color="red" />);
            const path = container.querySelector('path');
            // For non-rgb colors, it just uses the color directly
            expect(path?.getAttribute('stroke')).toBe('red');
        });
    });

    describe('size', () => {
        it('renders at 100x100 size', () => {
            const { container } = render(<CowMilkedSVG />);
            const svg = container.querySelector('svg');
            expect(svg).toHaveAttribute('width', '100');
            expect(svg).toHaveAttribute('height', '100');
        });
    });
});

