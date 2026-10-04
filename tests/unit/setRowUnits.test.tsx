import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SetRow } from '../../components/workout/SetRow';
import { TRANSLATIONS } from '../../constants/translations';
import type { WorkoutSet } from '../../types';

vi.mock('../../utils/audio', () => ({
    triggerHaptic: vi.fn(),
    playTimerFinishSound: vi.fn(),
}));

const t = TRANSLATIONS.es;

const baseSet = (overrides: Partial<WorkoutSet> = {}): WorkoutSet => ({
    id: 7,
    weight: '60',
    reps: '5',
    rpe: '',
    completed: false,
    type: 'regular',
    ...overrides,
});

const renderRow = (set: WorkoutSet, unit: 'kg' | 'lb' = 'kg') => {
    const onUpdate = vi.fn();
    const view = render(
        <SetRow
            set={set}
            exInstanceId={1}
            onUpdate={onUpdate}
            onToggleComplete={vi.fn()}
            onChangeType={vi.fn()}
            lang="es"
            unit={unit}
        />
    );
    const weightInput = screen.getByLabelText(t.weight) as HTMLInputElement;
    return { onUpdate, weightInput, ...view };
};

describe('Q11: SetRow units', () => {
    it('kg mode is identical to the legacy behavior (golden)', () => {
        const { onUpdate, weightInput } = renderRow(baseSet({ hintWeight: '60', prevWeight: '60', prevReps: '5' }));
        expect(weightInput.value).toBe('60');
        expect(weightInput.placeholder).toBe('60');
        expect(screen.getByText('60k')).toBeTruthy();
        fireEvent.change(weightInput, { target: { value: '62.5' } });
        fireEvent.blur(weightInput);
        expect(onUpdate).toHaveBeenCalledWith(1, 7, 'weight', '62.5');
    });

    it('lb mode shows the converted display value and commits canonical kg', () => {
        const { onUpdate, weightInput } = renderRow(
            baseSet({ weight: '61.235', hintWeight: '60', prevWeight: '60', prevReps: '5' }),
            'lb'
        );
        expect(weightInput.value).toBe('135');
        expect(weightInput.placeholder).toBe('132.3');
        expect(screen.getByText('132.3lbs')).toBeTruthy();
        fireEvent.change(weightInput, { target: { value: '140' } });
        fireEvent.blur(weightInput);
        expect(onUpdate).toHaveBeenCalledWith(1, 7, 'weight', 63.5029);
    });

    it('switching units with pending keystrokes flushes under the old unit and resyncs', () => {
        const onUpdate = vi.fn();
        const set = baseSet({ weight: '60' });
        const props = {
            set,
            exInstanceId: 1,
            onUpdate,
            onToggleComplete: vi.fn(),
            onChangeType: vi.fn(),
            lang: 'es' as const,
        };
        const view = render(<SetRow {...props} unit="kg" />);
        const input = screen.getByLabelText(t.weight) as HTMLInputElement;
        fireEvent.focus(input);
        fireEvent.change(input, { target: { value: '65' } });
        expect(onUpdate).not.toHaveBeenCalled();

        view.rerender(<SetRow {...props} unit="lb" />);
        // Flushed as kg (old unit), display resynced to lb.
        expect(onUpdate).toHaveBeenCalledTimes(1);
        expect(onUpdate).toHaveBeenCalledWith(1, 7, 'weight', '65');
        expect((screen.getByLabelText(t.weight) as HTMLInputElement).value).toBe('143.3');

        // A later blur must not re-commit the resynced display value.
        fireEvent.blur(screen.getByLabelText(t.weight));
        expect(onUpdate).toHaveBeenCalledTimes(1);
    });

    it('empty input stays empty in both units', () => {
        const { onUpdate, weightInput } = renderRow(baseSet({ weight: '' }), 'lb');
        expect(weightInput.value).toBe('');
        fireEvent.change(weightInput, { target: { value: '' } });
        fireEvent.blur(weightInput);
        expect(onUpdate).not.toHaveBeenCalled();
    });
});
