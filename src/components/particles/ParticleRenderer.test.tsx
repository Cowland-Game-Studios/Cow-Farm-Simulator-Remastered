/**
 * ParticleRenderer Component Tests
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ParticleRenderer from './ParticleRenderer';
import { Particle } from '../../engine/particleSystem';

// Mock the useParticles hook
const mockUseParticles = jest.fn(() => [] as Particle[]);
jest.mock('../../engine/particleSystem', () => ({
    useParticles: () => mockUseParticles(),
    particleSystem: {
        subscribe: jest.fn(),
        spawn: jest.fn(),
    },
}));

const createMockParticle = (overrides: Partial<Particle> = {}): Particle => ({
    id: 'particle-1',
    text: '+1',
    x: 100,
    y: 200,
    vx: 0,
    vy: -3,
    gravity: 0.15,
    opacity: 1,
    fadeRate: 0,
    fadeDelay: 500,
    color: '#000000',
    fontSize: 24,
    createdAt: Date.now(),
    lifetime: 1500,
    ...overrides,
});

describe('ParticleRenderer', () => {
    beforeEach(() => {
        mockUseParticles.mockClear();
        mockUseParticles.mockReturnValue([]);
    });

    describe('empty state', () => {
        it('returns null when no particles', () => {
            const { container } = render(<ParticleRenderer />);
            expect(container.firstChild).toBeNull();
        });
    });

    describe('rendering particles', () => {
        it('renders a single particle', () => {
            const particle = createMockParticle({ text: '++milk;' });
            mockUseParticles.mockReturnValue([particle]);

            render(<ParticleRenderer />);
            expect(screen.getByText('++milk;')).toBeInTheDocument();
        });

        it('renders multiple particles', () => {
            const particles = [
                createMockParticle({ id: 'p1', text: '+1' }),
                createMockParticle({ id: 'p2', text: '+2' }),
                createMockParticle({ id: 'p3', text: '+3' }),
            ];
            mockUseParticles.mockReturnValue(particles);

            render(<ParticleRenderer />);
            expect(screen.getByText('+1')).toBeInTheDocument();
            expect(screen.getByText('+2')).toBeInTheDocument();
            expect(screen.getByText('+3')).toBeInTheDocument();
        });
    });

    describe('particle positioning', () => {
        it('applies transform based on x and y', () => {
            const particle = createMockParticle({ x: 150, y: 250 });
            mockUseParticles.mockReturnValue([particle]);

            render(<ParticleRenderer />);
            const element = screen.getByText('+1');
            expect(element).toHaveStyle({ transform: 'translate(150px, 250px)' });
        });
    });

    describe('particle opacity', () => {
        it('applies opacity style', () => {
            const particle = createMockParticle({ opacity: 0.5 });
            mockUseParticles.mockReturnValue([particle]);

            render(<ParticleRenderer />);
            const element = screen.getByText('+1');
            expect(element).toHaveStyle({ opacity: '0.5' });
        });

        it('handles full opacity', () => {
            const particle = createMockParticle({ opacity: 1 });
            mockUseParticles.mockReturnValue([particle]);

            render(<ParticleRenderer />);
            const element = screen.getByText('+1');
            expect(element).toHaveStyle({ opacity: '1' });
        });
    });

    describe('particle color', () => {
        it('applies color style', () => {
            const particle = createMockParticle({ color: '#ff0000' });
            mockUseParticles.mockReturnValue([particle]);

            render(<ParticleRenderer />);
            const element = screen.getByText('+1');
            expect(element).toHaveStyle({ color: '#ff0000' });
        });
    });

    describe('container', () => {
        it('wraps particles in container', () => {
            const particle = createMockParticle();
            mockUseParticles.mockReturnValue([particle]);

            render(<ParticleRenderer />);
            const container = document.querySelector('[class*="particleContainer"]');
            expect(container).toBeInTheDocument();
        });
    });

    describe('unique keys', () => {
        it('uses particle id as key', () => {
            const particles = [
                createMockParticle({ id: 'unique-1', text: 'A' }),
                createMockParticle({ id: 'unique-2', text: 'B' }),
            ];
            mockUseParticles.mockReturnValue(particles);

            const { container } = render(<ParticleRenderer />);
            const elements = container.querySelectorAll('p');
            expect(elements.length).toBe(2);
        });
    });
});

