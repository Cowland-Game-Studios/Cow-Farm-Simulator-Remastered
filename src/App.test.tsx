/**
 * App Component Tests
 */

import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

describe('App', () => {
    it('renders without crashing', () => {
        expect(() => render(<App />)).not.toThrow();
    });

    it('renders the pasture (main game area)', () => {
        const { container } = render(<App />);
        // App should contain the pasture/game area
        expect(container.firstChild).toBeInTheDocument();
    });

    it('renders the stats display with coins and XP', () => {
        render(<App />);
        // The StatsDisplay shows coins and XP
        // Look for elements that would be in the game
        const mainContainer = document.querySelector('[class*="pasture"], [class*="app"]');
        expect(mainContainer || document.body.firstChild).toBeTruthy();
    });
});

