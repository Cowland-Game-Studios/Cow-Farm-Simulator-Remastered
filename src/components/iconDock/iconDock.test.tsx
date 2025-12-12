/**
 * IconDock Component Tests
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import IconDock from './iconDock';

describe('IconDock', () => {
    describe('rendering', () => {
        it('renders without crashing', () => {
            render(<IconDock onTerminalClick={jest.fn()} />);
            expect(document.querySelector('[class*="iconDock"]')).toBeInTheDocument();
        });

        it('renders three buttons/links', () => {
            render(<IconDock onTerminalClick={jest.fn()} />);
            const buttons = screen.getAllByRole('button');
            // Web link button + GitHub link button + Terminal button
            expect(buttons.length).toBe(3);
        });
    });

    describe('web link', () => {
        it('has link to jasonxu.me', () => {
            render(<IconDock onTerminalClick={jest.fn()} />);
            const link = screen.getByTitle('jasonxu.me');
            expect(link).toHaveAttribute('href', 'https://jasonxu.me');
            expect(link).toHaveAttribute('target', '_blank');
            expect(link).toHaveAttribute('rel', 'noopener noreferrer');
        });
    });

    describe('github link', () => {
        it('has link to GitHub repo', () => {
            render(<IconDock onTerminalClick={jest.fn()} />);
            const link = screen.getByTitle('GitHub');
            expect(link).toHaveAttribute('href', 'https://github.com/Cowland-Game-Studios/Cow-Farm-Simulator-Remastered');
            expect(link).toHaveAttribute('target', '_blank');
            expect(link).toHaveAttribute('rel', 'noopener noreferrer');
        });
    });

    describe('terminal button', () => {
        it('calls onTerminalClick when clicked', () => {
            const onTerminalClick = jest.fn();
            render(<IconDock onTerminalClick={onTerminalClick} />);
            
            const terminalButton = screen.getByTitle('Moo.sh Terminal');
            fireEvent.click(terminalButton);
            
            expect(onTerminalClick).toHaveBeenCalledTimes(1);
        });

        it('has active class when terminalOpen is true', () => {
            render(<IconDock onTerminalClick={jest.fn()} terminalOpen={true} />);
            const terminalButton = screen.getByTitle('Moo.sh Terminal');
            expect(terminalButton.className).toContain('active');
        });

        it('does not have active class when terminalOpen is false', () => {
            render(<IconDock onTerminalClick={jest.fn()} terminalOpen={false} />);
            const terminalButton = screen.getByTitle('Moo.sh Terminal');
            expect(terminalButton.className).not.toContain('active');
        });

        it('defaults terminalOpen to false', () => {
            render(<IconDock onTerminalClick={jest.fn()} />);
            const terminalButton = screen.getByTitle('Moo.sh Terminal');
            expect(terminalButton.className).not.toContain('active');
        });
    });

    describe('icons', () => {
        it('renders SVG icons', () => {
            render(<IconDock onTerminalClick={jest.fn()} />);
            const svgs = document.querySelectorAll('svg');
            // Web icon + GitHub icon + Terminal icon = 3 SVGs
            expect(svgs.length).toBe(3);
        });
    });

    describe('accessibility', () => {
        it('buttons have proper titles', () => {
            render(<IconDock onTerminalClick={jest.fn()} />);
            expect(screen.getByTitle('jasonxu.me')).toBeInTheDocument();
            expect(screen.getByTitle('GitHub')).toBeInTheDocument();
            expect(screen.getByTitle('Moo.sh Terminal')).toBeInTheDocument();
        });

        it('all buttons have type="button"', () => {
            render(<IconDock onTerminalClick={jest.fn()} />);
            const buttons = screen.getAllByRole('button');
            buttons.forEach(button => {
                expect(button).toHaveAttribute('type', 'button');
            });
        });
    });
});

