import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SetRow } from '../../components/workout/SetRow';
import { WorkoutSet } from '../../types';

describe('HoldTimer (D4)', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    const mockIsometricSet: WorkoutSet = {
        id: 201,
        type: 'regular',
        duration: 0,
        completed: false,
    };

    it('starts timer on click and keeps running without double-trigger on touchstart+click', async () => {
        const handleUpdate = vi.fn();

        render(
            <SetRow
                set={mockIsometricSet}
                exInstanceId={1}
                onUpdate={handleUpdate}
                onToggleComplete={vi.fn()}
                onChangeType={vi.fn()}
                lang="es"
                isIsometric={true}
            />
        );

        const playButton = screen.getByRole('button', { name: /^iniciar timer$/i });
        expect(playButton).toBeTruthy();

        // Simulate touchstart then click sequence common on mobile devices
        fireEvent.touchStart(playButton, { touches: [{ clientX: 10, clientY: 10 }] });
        fireEvent.click(playButton);

        // After start, play button should have transitioned to stop button
        const stopButton = screen.getByRole('button', { name: /^detener timer$/i });
        expect(stopButton).toBeTruthy();

        // Advance 3 seconds
        act(() => {
            vi.advanceTimersByTime(3000);
        });

        // Timer must still be running (stop button still present)
        expect(screen.getByRole('button', { name: /^detener timer$/i })).toBeTruthy();

        // Now explicitly click stop
        fireEvent.click(stopButton);

        expect(handleUpdate).toHaveBeenCalledWith(1, 201, 'duration', expect.any(Number));
        // Play button should be available again along with Reset button
        expect(screen.getByRole('button', { name: /^iniciar timer$/i })).toBeTruthy();
        expect(screen.getByRole('button', { name: /^reiniciar timer$/i })).toBeTruthy();
    });
});
