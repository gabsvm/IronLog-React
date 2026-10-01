import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SetRow } from '../../components/workout/SetRow';
import { WorkoutSet } from '../../types';

describe('SetRow Pending Flush (D2)', () => {
    const mockSet: WorkoutSet = {
        id: 101,
        type: 'regular',
        weight: 60,
        reps: 10,
        completed: false,
    };

    it('flushes pending typed values before calling onToggleComplete when check button is clicked', () => {
        const callOrder: string[] = [];
        const handleUpdate = vi.fn((_exId, _setId, field, val) => {
            callOrder.push(`update:${field}:${val}`);
        });
        const handleToggleComplete = vi.fn(() => {
            callOrder.push('toggleComplete');
        });

        render(
            <SetRow
                set={mockSet}
                exInstanceId={1}
                onUpdate={handleUpdate}
                onToggleComplete={handleToggleComplete}
                onChangeType={vi.fn()}
                lang="es"
            />
        );

        // Find weight input (value="60")
        const weightInput = screen.getByDisplayValue('60');

        // Type '80' without blurring
        fireEvent.change(weightInput, { target: { value: '80' } });

        // Click the check button
        const checkButton = screen.getByRole('button', { name: /completar serie/i });
        fireEvent.click(checkButton);

        // Verify onUpdate was called with '80' before onToggleComplete
        expect(handleUpdate).toHaveBeenCalledWith(1, 101, 'weight', '80');
        expect(handleToggleComplete).toHaveBeenCalledWith(1, 101);
        expect(callOrder).toEqual(['update:weight:80', 'toggleComplete']);
    });

    it('flushes pending typed values before calling onToggleComplete when completed via swipe gesture', () => {
        const callOrder: string[] = [];
        const handleUpdate = vi.fn((_exId, _setId, field, val) => {
            callOrder.push(`update:${field}:${val}`);
        });
        const handleToggleComplete = vi.fn(() => {
            callOrder.push('toggleComplete');
        });

        const { container } = render(
            <SetRow
                set={mockSet}
                exInstanceId={1}
                onUpdate={handleUpdate}
                onToggleComplete={handleToggleComplete}
                onChangeType={vi.fn()}
                lang="es"
            />
        );

        const weightInput = screen.getByDisplayValue('60');
        fireEvent.change(weightInput, { target: { value: '85' } });

        // Simulate touch swipe on the row container
        const row = container.querySelector('#set-row-101')!;
        expect(row).toBeTruthy();

        fireEvent.touchStart(row, {
            touches: [{ clientX: 10, clientY: 20 }]
        });
        // Swipe > 90px horizontally
        fireEvent.touchMove(row, {
            touches: [{ clientX: 110, clientY: 20 }]
        });
        fireEvent.touchEnd(row);

        expect(handleUpdate).toHaveBeenCalledWith(1, 101, 'weight', '85');
        expect(handleToggleComplete).toHaveBeenCalledWith(1, 101);
        expect(callOrder).toEqual(['update:weight:85', 'toggleComplete']);
    });
});
