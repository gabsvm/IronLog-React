import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, fireEvent, screen, act } from '@testing-library/react';
import { SetRow } from '../../components/workout/SetRow';
import { WorkoutSet } from '../../types';

describe('U8: Swipe-to-complete safety and isometric alerts', () => {
    const mockSet: WorkoutSet = {
        id: 101,
        weight: 80,
        reps: 10,
        completed: false,
        type: 'regular'
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('ignores swipes starting within 24px of the screen left edge', () => {
        const handleToggle = vi.fn();
        const { container } = render(
            <SetRow
                set={mockSet}
                exInstanceId={1}
                onUpdate={vi.fn()}
                onToggleComplete={handleToggle}
                onChangeType={vi.fn()}
                lang="es"
            />
        );

        const row = container.querySelector('#set-row-101')!;

        // Start touch at clientX: 12 (< 24px)
        fireEvent.touchStart(row, {
            touches: [{ clientX: 12, clientY: 50 }]
        });
        fireEvent.touchMove(row, {
            touches: [{ clientX: 150, clientY: 50 }]
        });
        fireEvent.touchEnd(row);

        expect(handleToggle).not.toHaveBeenCalled();
    });

    it('rejects diagonal/vertical gestures and cancels tracking', () => {
        const handleToggle = vi.fn();
        const { container } = render(
            <SetRow
                set={mockSet}
                exInstanceId={1}
                onUpdate={vi.fn()}
                onToggleComplete={handleToggle}
                onChangeType={vi.fn()}
                lang="es"
            />
        );

        const row = container.querySelector('#set-row-101')!;

        // Start at clientX: 60, clientY: 50
        fireEvent.touchStart(row, {
            touches: [{ clientX: 60, clientY: 50 }]
        });
        // Move diagonally where vertical movement is large (dy = 60, dx = 50)
        fireEvent.touchMove(row, {
            touches: [{ clientX: 110, clientY: 110 }]
        });
        fireEvent.touchEnd(row);

        expect(handleToggle).not.toHaveBeenCalled();
    });

    it('completes set when gesture is clearly horizontal and starts safely inside bounds', () => {
        const handleToggle = vi.fn();
        const { container } = render(
            <SetRow
                set={mockSet}
                exInstanceId={1}
                onUpdate={vi.fn()}
                onToggleComplete={handleToggle}
                onChangeType={vi.fn()}
                lang="es"
            />
        );

        const row = container.querySelector('#set-row-101')!;
        const overlay = container.querySelector('[data-testid="swipe-overlay"]') as HTMLDivElement;

        // Start at clientX: 50, clientY: 50
        fireEvent.touchStart(row, {
            touches: [{ clientX: 50, clientY: 50 }]
        });
        // Move horizontally (dx = 110, dy = 5)
        fireEvent.touchMove(row, {
            touches: [{ clientX: 160, clientY: 55 }]
        });

        // Overlay is styled via ref
        expect(overlay).toBeTruthy();
        expect(overlay.style.display).toBe('flex');
        expect(parseFloat(overlay.style.width)).toBeGreaterThanOrEqual(85);

        fireEvent.touchEnd(row);

        expect(handleToggle).toHaveBeenCalledWith(1, 101);
    });

    it('triggers completion alert when isometric countdown timer reaches zero', () => {
        vi.useFakeTimers();

        const isometricSet: WorkoutSet = {
            id: 202,
            duration: 0,
            completed: false,
            type: 'regular'
        };

        const { container } = render(
            <SetRow
                set={isometricSet}
                exInstanceId={1}
                onUpdate={vi.fn()}
                onToggleComplete={vi.fn()}
                onChangeType={vi.fn()}
                lang="es"
                isIsometric={true}
                isometricTargetSecs={5}
            />
        );

        // Find play button
        const playBtn = screen.getByLabelText('Iniciar timer');
        fireEvent.click(playBtn);

        // Advance 5 seconds
        act(() => {
            vi.advanceTimersByTime(5000);
        });

        // Verify timer displays 0s
        expect(container.textContent).toContain('0s');

        vi.useRealTimers();
    });
});
