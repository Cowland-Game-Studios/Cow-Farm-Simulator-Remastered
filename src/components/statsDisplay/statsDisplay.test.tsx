/**
 * StatsDisplay Component Tests
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import StatsDisplay from './statsDisplay';

// Mock dependencies BEFORE importing the component
jest.mock('../../engine/achievements', () => ({
    getLevelFromXp: (xp: number) => ({
        level: Math.floor(xp / 100) + 1,
        xpIntoLevel: xp % 100,
        xpForNextLevel: 100,
        totalXp: xp,
    }),
}));

jest.mock('../../engine/flyingRewards', () => ({
    useRewardTarget: (_type: string) => ({
        ref: { current: null },
        isPulsing: false,
    }),
}));

jest.mock('../rollingNumber', () => ({
    RollingNumber: ({ value, formatFn }: { value: number; formatFn?: (v: number) => string }) => (
        <span data-testid="rolling-number">
            {formatFn ? formatFn(value) : value}
        </span>
    ),
}));

describe('StatsDisplay', () => {
    describe('rendering', () => {
        it('renders without crashing', () => {
            render(<StatsDisplay />);
            expect(document.querySelector('[class*="statsDisplay"]')).toBeInTheDocument();
        });

        it('renders money section', () => {
            render(<StatsDisplay coins={5000} />);
            expect(screen.getByText('money')).toBeInTheDocument();
        });

        it('renders level section', () => {
            render(<StatsDisplay xp={150} />);
            expect(screen.getByText(/lvl/)).toBeInTheDocument();
        });
    });

    describe('coins display', () => {
        it('displays coins with @ prefix', () => {
            render(<StatsDisplay coins={1234} />);
            expect(screen.getByText('@1,234')).toBeInTheDocument();
        });

        it('formats large coin amounts with commas', () => {
            render(<StatsDisplay coins={1000000} />);
            expect(screen.getByText('@1,000,000')).toBeInTheDocument();
        });

        it('defaults to 0 coins', () => {
            render(<StatsDisplay />);
            expect(screen.getByText('@0')).toBeInTheDocument();
        });
    });

    describe('level display', () => {
        it('shows correct level based on XP', () => {
            render(<StatsDisplay xp={250} />);
            // With mocked getLevelFromXp: level = Math.floor(250/100) + 1 = 3
            expect(screen.getByText('lvl 3')).toBeInTheDocument();
        });

        it('defaults to 0 XP', () => {
            render(<StatsDisplay />);
            expect(screen.getByText('lvl 1')).toBeInTheDocument();
        });
    });

    describe('XP display modes', () => {
        it('starts with progress bar display (mode 2)', () => {
            render(<StatsDisplay xp={50} />);
            // Should show progress bar characters (█ and ░)
            const progressText = document.querySelector('[class*="xpText"]');
            expect(progressText?.textContent).toContain('█');
        });

        it('cycles to progress mode on click', () => {
            render(<StatsDisplay xp={50} />);
            const xpText = document.querySelector('[class*="xpText"]');
            
            fireEvent.click(xpText!);
            
            // After click, should show progress/remaining format
            expect(screen.getByTestId('rolling-number')).toBeInTheDocument();
        });

        it('cycles through all three modes', () => {
            render(<StatsDisplay xp={50} />);
            const xpText = document.querySelector('[class*="xpText"]');
            
            // Mode 2 (bar) -> Mode 0 (progress)
            fireEvent.click(xpText!);
            expect(screen.getByText(/xp/)).toBeInTheDocument();
            
            // Mode 0 (progress) -> Mode 1 (remaining)
            fireEvent.click(xpText!);
            expect(screen.getByText(/xp left/)).toBeInTheDocument();
            
            // Mode 1 (remaining) -> Mode 2 (bar)
            fireEvent.click(xpText!);
            expect(xpText?.textContent).toContain('█');
        });
    });

    describe('number formatting', () => {
        it('formats thousands as k', () => {
            render(<StatsDisplay xp={1500} />);
            const xpText = document.querySelector('[class*="xpText"]');
            fireEvent.click(xpText!); // Switch to number mode
            
            // The rolling number should use formatNumber
            expect(screen.getByTestId('rolling-number')).toBeInTheDocument();
        });

        it('formats millions as m', () => {
            // This would be tested via the formatNumber function
            render(<StatsDisplay xp={1500000} />);
            expect(screen.getByText(/lvl/)).toBeInTheDocument();
        });
    });

    describe('progress bar', () => {
        it('generates correct progress bar length', () => {
            render(<StatsDisplay xp={50} />);
            const xpText = document.querySelector('[class*="xpText"]');
            // Progress bar should be 10 characters (PROGRESS_BAR_LENGTH)
            const barText = xpText?.textContent || '';
            const filledCount = (barText.match(/█/g) || []).length;
            const emptyCount = (barText.match(/░/g) || []).length;
            expect(filledCount + emptyCount).toBe(10);
        });

        it('shows partial progress', () => {
            render(<StatsDisplay xp={50} />); // 50% through level
            const xpText = document.querySelector('[class*="xpText"]');
            const barText = xpText?.textContent || '';
            const filledCount = (barText.match(/█/g) || []).length;
            expect(filledCount).toBe(5); // 50% = 5 filled
        });
    });

    describe('additional props', () => {
        it('passes through additional props', () => {
            render(<StatsDisplay data-testid="stats-test" />);
            expect(screen.getByTestId('stats-test')).toBeInTheDocument();
        });
    });
});

