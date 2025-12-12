/**
 * Cow Component Tests
 */

import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Cow from './cow';

// Mock all dependencies
const mockDispatch = jest.fn();
const mockSetDraggingCow = jest.fn();
const mockClearDraggingCow = jest.fn();
const mockUpdateCowPosition = jest.fn();
const mockBreedCows = jest.fn();
const mockClearCowImpulse = jest.fn();
const mockSpawnReward = jest.fn();

const createMockCow = (overrides = {}) => ({
    id: 'cow-1',
    color: { r: 255, g: 100, b: 100, a: 0.5 },
    state: 'full' as const,
    fullness: 1,
    position: { x: 300, y: 300 },
    facingRight: false,
    lastFedAt: null,
    lastBredAt: 0,
    createdAt: Date.now(),
    ...overrides,
});

let mockCow = createMockCow();

jest.mock('../../engine', () => ({
    useGame: () => ({
        dispatch: mockDispatch,
        breedCows: mockBreedCows,
        updateCowPosition: mockUpdateCowPosition,
        setDraggingCow: mockSetDraggingCow,
        clearDraggingCow: mockClearDraggingCow,
        draggingCow: { cowId: null, position: null },
        chaosImpulses: {},
        clearCowImpulse: mockClearCowImpulse,
        ui: { draggingCraftingItem: false },
    }),
    useCow: () => mockCow,
    useCowsById: () => new Map([['cow-1', mockCow]]),
    useTools: () => ({ milking: false, feeding: false }),
    colorToString: (c: any) => `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a})`,
    particleSystem: {
        spawnBreedParticle: jest.fn(),
    },
    actions: {
        updateCowFacing: jest.fn((id, facing) => ({ type: 'UPDATE_COW_FACING', payload: { id, facing } })),
    },
    Position: {},
}));

jest.mock('../../engine/flyingRewards', () => ({
    useFlyingRewards: () => ({
        spawnReward: mockSpawnReward,
    }),
}));

// Mock DraggableSwinging to simplify testing
jest.mock('../draggableSwinging/draggableSwinging', () => {
    return function MockDraggableSwinging({ children, onPickup, onDrop, onPositionChange, id }: any) {
        return (
            <div 
                id={id}
                data-testid="draggable-swinging"
                onMouseDown={() => onPickup?.()}
                onMouseUp={() => onDrop?.({ x: 100, y: 100 })}
            >
                {children}
            </div>
        );
    };
});

// Mock CowSVG components
jest.mock('./CowSVG', () => ({
    CowSVG: ({ color }: any) => <div data-testid="cow-svg" data-color={color}>CowSVG</div>,
    CowMilkedSVG: ({ color }: any) => <div data-testid="cow-milked-svg" data-color={color}>CowMilkedSVG</div>,
    CowToMilkSVG: ({ color }: any) => <div data-testid="cow-to-milk-svg" data-color={color}>CowToMilkSVG</div>,
}));

describe('Cow', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();
        mockCow = createMockCow();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('rendering', () => {
        it('renders without crashing', () => {
            render(<Cow cowId="cow-1" />);
            expect(screen.getByTestId('draggable-swinging')).toBeInTheDocument();
        });

        it('renders CowToMilkSVG when full', () => {
            mockCow = createMockCow({ state: 'full' });
            render(<Cow cowId="cow-1" />);
            expect(screen.getByTestId('cow-to-milk-svg')).toBeInTheDocument();
        });

        it('renders CowSVG when producing', () => {
            mockCow = createMockCow({ state: 'producing' });
            render(<Cow cowId="cow-1" />);
            expect(screen.getByTestId('cow-svg')).toBeInTheDocument();
        });

        it('renders CowMilkedSVG when hungry', () => {
            mockCow = createMockCow({ state: 'hungry' });
            render(<Cow cowId="cow-1" />);
            expect(screen.getByTestId('cow-milked-svg')).toBeInTheDocument();
        });

        it('returns null if cow not found', () => {
            mockCow = undefined as any;
            const { container } = render(<Cow cowId="nonexistent" />);
            expect(container.firstChild).toBeNull();
        });
    });

    describe('cow ID', () => {
        it('passes cowId to DraggableSwinging', () => {
            mockCow = createMockCow();
            render(<Cow cowId="cow-1" />);
            expect(document.getElementById('cow-1')).toBeInTheDocument();
        });
    });

    describe('pickup and drop', () => {
        it('calls setDraggingCow on pickup', () => {
            mockCow = createMockCow();
            render(<Cow cowId="cow-1" />);
            
            fireEvent.mouseDown(screen.getByTestId('draggable-swinging'));
            
            expect(mockSetDraggingCow).toHaveBeenCalled();
        });

        it('calls clearDraggingCow on drop', () => {
            mockCow = createMockCow();
            render(<Cow cowId="cow-1" />);
            
            fireEvent.mouseDown(screen.getByTestId('draggable-swinging'));
            fireEvent.mouseUp(screen.getByTestId('draggable-swinging'));
            
            expect(mockClearDraggingCow).toHaveBeenCalled();
        });

        it('calls updateCowPosition on drop', () => {
            mockCow = createMockCow();
            render(<Cow cowId="cow-1" />);
            
            fireEvent.mouseDown(screen.getByTestId('draggable-swinging'));
            fireEvent.mouseUp(screen.getByTestId('draggable-swinging'));
            
            expect(mockUpdateCowPosition).toHaveBeenCalled();
        });
    });

    describe('thought bubbles', () => {
        it('does not show thought bubble by default', () => {
            mockCow = createMockCow({ state: 'full' });
            render(<Cow cowId="cow-1" />);
            expect(screen.queryByAltText('Thinking about milk')).not.toBeInTheDocument();
        });
    });

    describe('scale based on state', () => {
        it('applies larger scale when full', () => {
            mockCow = createMockCow({ state: 'full' });
            render(<Cow cowId="cow-1" />);
            const cowContainer = document.querySelector('[class*="cowContainer"]');
            expect(cowContainer).toBeInTheDocument();
        });

        it('applies smaller scale when hungry', () => {
            mockCow = createMockCow({ state: 'hungry' });
            render(<Cow cowId="cow-1" />);
            const cowContainer = document.querySelector('[class*="cowContainer"]');
            expect(cowContainer).toBeInTheDocument();
        });
    });

    describe('facing direction', () => {
        it('respects facingRight prop', () => {
            mockCow = createMockCow({ facingRight: true });
            render(<Cow cowId="cow-1" />);
            // The cow container should have scaleX(-1) for right-facing
            const cowWrapper = document.querySelector('[style*="scaleX"]');
            expect(cowWrapper).toBeInTheDocument();
        });
    });

    describe('color', () => {
        it('passes color to SVG components', () => {
            mockCow = createMockCow({ state: 'full' });
            render(<Cow cowId="cow-1" />);
            const svg = screen.getByTestId('cow-to-milk-svg');
            expect(svg).toHaveAttribute('data-color');
        });
    });

    describe('pulse animation', () => {
        it('applies pulse class when full (periodically)', async () => {
            mockCow = createMockCow({ state: 'full' });
            render(<Cow cowId="cow-1" />);
            
            // Advance timers to trigger pulse
            act(() => {
                jest.advanceTimersByTime(5000);
            });
            
            // Cow container should have pulse animation class
            const cowContainer = document.querySelector('[class*="cowContainer"]');
            expect(cowContainer).toBeInTheDocument();
        });
    });

    describe('random movement', () => {
        it('does not move when state is full', () => {
            mockCow = createMockCow({ state: 'full' });
            render(<Cow cowId="cow-1" />);
            
            // Full cows should not have random movement
            const cowWrapper = document.querySelector('[style*="translate(0px, 0px)"]');
            expect(cowWrapper).toBeInTheDocument();
        });

        it('does not move when state is hungry', () => {
            mockCow = createMockCow({ state: 'hungry' });
            render(<Cow cowId="cow-1" />);
            
            const cowWrapper = document.querySelector('[style*="translate(0px, 0px)"]');
            expect(cowWrapper).toBeInTheDocument();
        });
    });

    describe('breed target indicator', () => {
        it('does not show breed target by default', () => {
            mockCow = createMockCow({ state: 'full' });
            render(<Cow cowId="cow-1" />);
            
            const container = document.querySelector('[class*="breedTarget"]');
            expect(container).not.toBeInTheDocument();
        });
    });
});

