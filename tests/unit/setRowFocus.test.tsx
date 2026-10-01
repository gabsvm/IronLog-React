import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SetRow } from '../../components/workout/SetRow';
import { WorkoutSet } from '../../types';

describe('SetRow Focus Transition (D3)', () => {
    const mockSet: WorkoutSet = {
        id: 101,
        type: 'regular',
        weight: 60,
        reps: 10,
        rpe: 8,
        completed: false,
    };

    it('advances focus to reps input when Enter key is pressed in weight input', () => {
        render(
            <SetRow
                set={mockSet}
                exInstanceId={1}
                onUpdate={vi.fn()}
                onToggleComplete={vi.fn()}
                onChangeType={vi.fn()}
                lang="es"
            />
        );

        const weightInput = screen.getByDisplayValue('60');
        const repsInput = screen.getByDisplayValue('10');

        weightInput.focus();
        expect(document.activeElement).toBe(weightInput);

        fireEvent.keyDown(weightInput, { key: 'Enter', code: 'Enter' });

        expect(document.activeElement).toBe(repsInput);
    });

    it('does NOT force focus to reps when weight input simply loses focus (blur)', () => {
        vi.useFakeTimers();

        render(
            <div>
                <SetRow
                    set={mockSet}
                    exInstanceId={1}
                    onUpdate={vi.fn()}
                    onToggleComplete={vi.fn()}
                    onChangeType={vi.fn()}
                    lang="es"
                />
                <button data-testid="outside-button">Outside</button>
            </div>
        );

        const weightInput = screen.getByDisplayValue('60');
        const repsInput = screen.getByDisplayValue('10');
        const outsideButton = screen.getByTestId('outside-button');

        weightInput.focus();
        expect(document.activeElement).toBe(weightInput);

        // User clicks or focuses outside button
        outsideButton.focus();
        fireEvent.blur(weightInput);

        // Fast forward any timers (previously there was an 80ms timeout)
        vi.advanceTimersByTime(200);

        expect(document.activeElement).toBe(outsideButton);
        expect(document.activeElement).not.toBe(repsInput);

        vi.useRealTimers();
    });
});
