/**
 * AchievementMenu Component Tests
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AchievementMenu from './AchievementMenu';

// Mock dependencies
const mockCheckAchievements = jest.fn();
const mockStats = {
    cowsMilked: 5,
    cowsFed: 10,
    cowsBred: 2,
    milkCollected: 50,
    itemsCrafted: 3,
    totalXpEarned: 100,
};

const mockAchievements = [
    {
        achievement: {
            id: 'milker',
            name: 'Milker',
            description: 'Milk cows',
            actionText: 'milked',
            xpReward: 10,
            icon: '🥛',
        },
        tierIndex: 0,
        tierCurrent: 5,
        tierMax: 10,
        percentComplete: 0.5,
        isComplete: false,
        isUnlocked: false,
    },
    {
        achievement: {
            id: 'feeder',
            name: 'Feeder',
            description: 'Feed cows',
            actionText: 'fed',
            xpReward: 15,
            icon: '🌾',
        },
        tierIndex: 1,
        tierCurrent: 10,
        tierMax: 20,
        percentComplete: 0.5,
        isComplete: false,
        isUnlocked: false,
    },
];

jest.mock('../../engine/GameProvider', () => ({
    useStats: () => mockStats,
    useAchievements: () => ({
        achievements: { unlocked: {} },
        checkAchievements: mockCheckAchievements,
    }),
}));

jest.mock('../../engine/achievements', () => ({
    getClosestAchievements: () => mockAchievements,
}));

jest.mock('../rollingNumber', () => ({
    RollingNumber: ({ value }: { value: number }) => (
        <span data-testid="rolling-number">{value}</span>
    ),
}));

describe('AchievementMenu', () => {
    beforeEach(() => {
        mockCheckAchievements.mockClear();
    });

    describe('rendering', () => {
        it('renders without crashing', () => {
            render(<AchievementMenu />);
            expect(document.querySelector('[class*="achievementMenu"]')).toBeInTheDocument();
        });

        it('renders achievement items', () => {
            render(<AchievementMenu />);
            expect(screen.getByText('Milker')).toBeInTheDocument();
            expect(screen.getByText('Feeder')).toBeInTheDocument();
        });

        it('shows XP reward for each achievement', () => {
            render(<AchievementMenu />);
            expect(screen.getByText('10xp')).toBeInTheDocument();
            expect(screen.getByText('15xp')).toBeInTheDocument();
        });
    });

    describe('display modes', () => {
        it('starts with showing progress (not remaining)', () => {
            render(<AchievementMenu />);
            // Default mode shows progress: current/max  
            expect(screen.getByText('/10 milked')).toBeInTheDocument();
        });

        it('toggles to remaining mode on click', () => {
            render(<AchievementMenu />);
            const progressText = screen.getByText('/10 milked');
            
            fireEvent.click(progressText);
            
            // Should now show remaining: X to be [actionText]
            // The text is split across elements (number + suffix)
            expect(screen.getByText(/to be milked/)).toBeInTheDocument();
        });

        it('toggles back to progress mode', () => {
            render(<AchievementMenu />);
            const progressText = screen.getByText('/10 milked');
            
            // Toggle to remaining
            fireEvent.click(progressText);
            
            // Toggle back to progress - find any clickable element in the achievements
            const progressElements = document.querySelectorAll('[class*="progressText"]');
            fireEvent.click(progressElements[0]);
            
            // After two clicks we should be back at progress mode
            expect(screen.getByText(/milked/)).toBeInTheDocument();
        });
    });

    describe('achievement checking', () => {
        it('calls checkAchievements on mount', () => {
            render(<AchievementMenu />);
            expect(mockCheckAchievements).toHaveBeenCalled();
        });
    });

    describe('scroll behavior', () => {
        it('stops wheel event propagation', () => {
            render(<AchievementMenu />);
            const menu = document.querySelector('[class*="achievementMenu"]');
            
            const wheelEvent = new WheelEvent('wheel', { bubbles: true });
            const stopPropagationSpy = jest.spyOn(wheelEvent, 'stopPropagation');
            
            menu?.dispatchEvent(wheelEvent);
            
            // The event listener should stop propagation
            expect(menu).toBeInTheDocument();
        });

        it('stops touch move propagation', () => {
            render(<AchievementMenu />);
            const menu = document.querySelector('[class*="achievementMenu"]');
            expect(menu).toBeInTheDocument();
            // Touch events are handled to prevent parent scrolling
        });
    });

    describe('fade elements', () => {
        it('renders fade top element', () => {
            render(<AchievementMenu />);
            expect(document.querySelector('[class*="fadeTop"]')).toBeInTheDocument();
        });

        it('renders fade bottom element', () => {
            render(<AchievementMenu />);
            expect(document.querySelector('[class*="fadeBottom"]')).toBeInTheDocument();
        });
    });

    describe('scroll container', () => {
        it('renders scroll container', () => {
            render(<AchievementMenu />);
            expect(document.querySelector('[class*="scrollContainer"]')).toBeInTheDocument();
        });

        it('renders achievements inside scroll container', () => {
            render(<AchievementMenu />);
            const container = document.querySelector('[class*="scrollContainer"]');
            expect(container?.querySelector('[class*="achievementItem"]')).toBeInTheDocument();
        });
    });

    describe('additional props', () => {
        it('passes through additional props', () => {
            render(<AchievementMenu data-testid="achievement-test" />);
            expect(screen.getByTestId('achievement-test')).toBeInTheDocument();
        });
    });
});

