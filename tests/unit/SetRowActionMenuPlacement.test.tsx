import React, { useRef } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SetRowActionMenu } from '../../components/workout/setRow/SetRowActionMenu';
import { WorkoutSet } from '../../types';

describe('SetRowActionMenu Smart Placement & Portal', () => {
    const mockSet: WorkoutSet = {
        id: 1,
        type: 'regular',
        weight: '60',
        reps: '8',
        rpe: '',
        completed: false,
    };

    const TestWrapper: React.FC<{
        isOpen: boolean;
        rect: DOMRect;
        onClose?: () => void;
        onUpdate?: any;
    }> = ({ isOpen, rect, onClose = vi.fn(), onUpdate = vi.fn() }) => {
        const buttonRef = useRef<HTMLButtonElement>(null);

        const setRef = (el: HTMLButtonElement | null) => {
            (buttonRef as any).current = el;
            if (el) {
                el.getBoundingClientRect = () => rect;
            }
        };

        return (
            <div>
                <button ref={setRef} type="button">
                    Set Menu
                </button>
                <SetRowActionMenu
                    isOpen={isOpen}
                    onClose={onClose}
                    set={mockSet}
                    exInstanceId={100}
                    lang="es"
                    onUpdate={onUpdate}
                    onChangeType={vi.fn()}
                    anchorRef={buttonRef}
                />
            </div>
        );
    };

    it('renders inside document.body via Portal and is visible', () => {
        const rect = {
            top: 200,
            bottom: 240,
            left: 20,
            right: 50,
            width: 30,
            height: 40,
            x: 20,
            y: 200,
            toJSON: () => {},
        } as DOMRect;

        render(<TestWrapper isOpen={true} rect={rect} />);

        // Should render menu items
        expect(screen.getByText('Añadir serie debajo')).toBeInTheDocument();
        expect(screen.getByText('Saltar serie')).toBeInTheDocument();
        expect(screen.getByText('Eliminar serie')).toBeInTheDocument();
        expect(screen.getByText('Myorep')).toBeInTheDocument();

        // Check that it's portaled to document.body
        const menuEl = screen.getByText('Añadir serie debajo').closest('.fixed.z-\\[9999\\]');
        expect(menuEl).toBeInTheDocument();
        expect(document.body.contains(menuEl)).toBe(true);
    });

    it('opens upwards when space below is tight (e.g. last set near screen bottom)', () => {
        // Mock viewport height 800, button near bottom at y=700 (space below = 60px)
        Object.defineProperty(window, 'innerHeight', { value: 800, writable: true });
        Object.defineProperty(window, 'innerWidth', { value: 390, writable: true });

        const rect = {
            top: 700,
            bottom: 740,
            left: 20,
            right: 50,
            width: 30,
            height: 40,
            x: 20,
            y: 700,
            toJSON: () => {},
        } as DOMRect;

        render(<TestWrapper isOpen={true} rect={rect} />);

        const menuEl = screen.getByText('Añadir serie debajo').closest('.fixed.z-\\[9999\\]') as HTMLElement;
        expect(menuEl).toBeInTheDocument();
        // Since space below (60px) < 360 and space above (700px) > space below, it should have a bottom style!
        expect(menuEl.style.bottom).toBeTruthy();
        expect(menuEl.style.top).toBeFalsy();
    });

    it('opens downwards when space below is ample (e.g. first set near screen top)', () => {
        Object.defineProperty(window, 'innerHeight', { value: 800, writable: true });
        Object.defineProperty(window, 'innerWidth', { value: 390, writable: true });

        const rect = {
            top: 150,
            bottom: 190,
            left: 20,
            right: 50,
            width: 30,
            height: 40,
            x: 20,
            y: 150,
            toJSON: () => {},
        } as DOMRect;

        render(<TestWrapper isOpen={true} rect={rect} />);

        const menuEl = screen.getByText('Añadir serie debajo').closest('.fixed.z-\\[9999\\]') as HTMLElement;
        expect(menuEl).toBeInTheDocument();
        // Since space below (610px) >= 360, it should have a top style!
        expect(menuEl.style.top).toBeTruthy();
        expect(menuEl.style.bottom).toBeFalsy();
    });

    it('calls onUpdate and closes when selecting a set type', () => {
        const onUpdate = vi.fn();
        const onClose = vi.fn();

        const rect = {
            top: 200,
            bottom: 240,
            left: 20,
            right: 50,
            width: 30,
            height: 40,
            x: 20,
            y: 200,
            toJSON: () => {},
        } as DOMRect;

        render(<TestWrapper isOpen={true} rect={rect} onUpdate={onUpdate} onClose={onClose} />);

        const myorepBtn = screen.getByText('Myorep');
        fireEvent.click(myorepBtn);

        expect(onUpdate).toHaveBeenCalledWith(100, 1, 'type', 'myorep');
        expect(onClose).toHaveBeenCalled();
    });
});
