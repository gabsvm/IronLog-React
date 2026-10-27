import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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
    weight: '',
    reps: '',
    rpe: '',
    completed: false,
    type: 'regular',
    ...overrides,
});

const renderRow = (set: WorkoutSet, showRIR = true) => render(
    React.createElement(SetRow, {
        set,
        exInstanceId: 1,
        onUpdate: vi.fn(),
        onToggleComplete: vi.fn(),
        onChangeType: vi.fn(),
        lang: 'es' as const,
        setIndex: 0,
        showRIR,
        unit: 'kg' as const,
    })
);

describe('Task 3: set row target before actual input', () => {
    it('shows weight x reps target and RIR target before the weight input', () => {
        renderRow(baseSet({ hintWeight: '60', prescribedReps: 8, targetRpe: 2 }));

        const target = screen.getByTestId('set-target');
        expect(target.textContent).toContain('60k');
        expect(target.textContent).toContain('8');
        expect(target.textContent).toContain('RIR 2');

        const weightInput = screen.getByLabelText(t.weight);
        expect(target.compareDocumentPosition(weightInput) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('falls back to hint reps and omits RIR when no RIR target is exposed', () => {
        renderRow(baseSet({ hintWeight: '50', hintReps: '10' }));

        const target = screen.getByTestId('set-target');
        expect(target.textContent).toContain('50k');
        expect(target.textContent).toContain('10');
        expect(target.textContent).not.toContain('RIR');
    });

    it('keeps the target visible on a completed set and shows no target when none is exposed', () => {
        const { unmount } = renderRow(baseSet({ hintWeight: '60', prescribedReps: 8, completed: true }));
        expect(screen.getByTestId('set-target').textContent).toContain('60k');
        unmount();

        renderRow(baseSet());
        expect(screen.queryByTestId('set-target')).toBeNull();
    });
});
