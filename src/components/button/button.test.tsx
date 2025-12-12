/**
 * Button Component Tests
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Button from './button';

describe('Button', () => {
    describe('rendering', () => {
        it('renders with text', () => {
            render(<Button text="Click Me" />);
            expect(screen.getByText('Click Me')).toBeInTheDocument();
        });

        it('renders with image', () => {
            render(<Button text="Test" image="/test-icon.svg" />);
            const img = screen.getByAltText('Test');
            expect(img).toBeInTheDocument();
            expect(img).toHaveAttribute('src', '/test-icon.svg');
        });

        it('renders without image when not provided', () => {
            render(<Button text="No Image" />);
            expect(screen.queryByRole('img')).not.toBeInTheDocument();
        });

        it('uses default alt text when no text provided', () => {
            render(<Button image="/test-icon.svg" />);
            expect(screen.getByAltText('Button icon')).toBeInTheDocument();
        });
    });

    describe('interactions', () => {
        it('calls onClick when clicked', () => {
            const onClick = jest.fn();
            render(<Button text="Click" onClick={onClick} />);
            
            fireEvent.click(screen.getByRole('button'));
            expect(onClick).toHaveBeenCalledTimes(1);
        });

        it('calls onMouseDown when mouse down', () => {
            const onMouseDown = jest.fn();
            render(<Button text="Press" onMouseDown={onMouseDown} />);
            
            fireEvent.mouseDown(screen.getByRole('button'));
            expect(onMouseDown).toHaveBeenCalledTimes(1);
        });

        it('calls onMouseDown on touch start', () => {
            const onMouseDown = jest.fn();
            render(<Button text="Touch" onMouseDown={onMouseDown} />);
            
            fireEvent.touchStart(screen.getByRole('button'));
            expect(onMouseDown).toHaveBeenCalledTimes(1);
        });

        it('does not call onClick when disabled', () => {
            const onClick = jest.fn();
            render(<Button text="Disabled" onClick={onClick} disabled />);
            
            fireEvent.click(screen.getByRole('button'));
            expect(onClick).not.toHaveBeenCalled();
        });

        it('does not call onMouseDown when disabled', () => {
            const onMouseDown = jest.fn();
            render(<Button text="Disabled" onMouseDown={onMouseDown} disabled />);
            
            fireEvent.mouseDown(screen.getByRole('button'));
            expect(onMouseDown).not.toHaveBeenCalled();
        });
    });

    describe('visibility and states', () => {
        it('applies hidden class when hidden prop is true', () => {
            render(<Button text="Hidden" hidden />);
            const button = screen.getByRole('button');
            expect(button.className).toContain('hidden');
        });

        it('applies disabled class when disabled prop is true', () => {
            render(<Button text="Disabled" disabled />);
            const button = screen.getByRole('button');
            expect(button.className).toContain('disabled');
        });

        it('sets aria-disabled when disabled', () => {
            render(<Button text="Disabled" disabled />);
            expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
        });
    });

    describe('cursor behavior', () => {
        it('uses pointer cursor by default', () => {
            render(<Button text="Pointer" />);
            const container = screen.getByRole('button').querySelector('[class*="buttonContainer"]');
            expect(container).toHaveStyle({ cursor: 'pointer' });
        });

        it('uses default cursor when keepOriginalCursor is true', () => {
            render(<Button text="Default" keepOriginalCursor />);
            const container = screen.getByRole('button').querySelector('[class*="buttonContainer"]');
            expect(container).toHaveStyle({ cursor: 'default' });
        });
    });

    describe('image behavior', () => {
        it('image is not draggable', () => {
            render(<Button text="Test" image="/test.svg" />);
            const img = screen.getByAltText('Test');
            expect(img).toHaveAttribute('draggable', 'false');
        });
    });

    describe('button type', () => {
        it('has type="button" to prevent form submission', () => {
            render(<Button text="Submit" />);
            expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
        });
    });
});

