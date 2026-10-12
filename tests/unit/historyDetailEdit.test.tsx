import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HistoryDetailView } from '../../views/history/HistoryDetailView';
import type { Log } from '../../types';

const makeLog = (): Log => ({
    id: 7, dayIdx: 0, name: 'Push', startTime: 1000, endTime: 5000, duration: 4000, mesoId: 1, week: 1,
    exercises: [{
        id: 'bench', instanceId: 1, name: 'Bench', muscle: 'CHEST',
        sets: [
            { id: 1, weight: 100, reps: 5, rpe: '', completed: true, type: 'regular' },
            { id: 2, weight: 100, reps: 5, rpe: '', completed: true, type: 'regular' },
        ],
    } as any],
});

const renderView = (onSaveEdit = vi.fn(), log = makeLog(), unit: 'kg' | 'lb' = 'kg') => {
    const onBack = vi.fn();
    render(<HistoryDetailView log={log} lang="en" unit={unit} onBack={onBack} onRepeat={() => {}} onDelete={() => {}} onSaveEdit={onSaveEdit} />);
    return { onSaveEdit, onBack };
};

describe('HistoryDetailView editing', () => {
    it('hides the edit action when no save handler is provided', () => {
        render(<HistoryDetailView log={makeLog()} lang="en" onBack={() => {}} onRepeat={() => {}} onDelete={() => {}} />);
        expect(screen.queryByLabelText('Edit workout')).toBeNull();
    });

    it('saves a corrected set once and exits edit mode', () => {
        const { onSaveEdit } = renderView();
        fireEvent.click(screen.getByLabelText('Edit workout'));
        fireEvent.change(screen.getByLabelText('Weight (kg) #1'), { target: { value: '110' } });
        fireEvent.click(screen.getByText('Save'));

        expect(onSaveEdit).toHaveBeenCalledTimes(1);
        const [original, edited] = onSaveEdit.mock.calls[0];
        expect(original.id).toBe(7);
        expect(edited.exercises[0].sets[0].weight).toBe(110);
        expect(edited.exercises[0].sets[1]).toBe(original.exercises[0].sets[1]);
        expect(edited.updatedAt).toBeGreaterThan(5000);
        expect(screen.queryByLabelText('Weight (kg) #1')).toBeNull();
    });

    it('blocks saving invalid values and shows an alert', () => {
        const { onSaveEdit } = renderView();
        fireEvent.click(screen.getByLabelText('Edit workout'));
        fireEvent.change(screen.getByLabelText('Reps #2'), { target: { value: '0' } });
        fireEvent.click(screen.getByText('Save'));

        expect(onSaveEdit).not.toHaveBeenCalled();
        expect(screen.getByLabelText('Reps #2').getAttribute('aria-invalid')).toBe('true');
        expect(screen.getByRole('alert').textContent).toContain('Check the highlighted values');
    });

    it('does not report a change when nothing was edited', () => {
        const { onSaveEdit } = renderView();
        fireEvent.click(screen.getByLabelText('Edit workout'));
        fireEvent.click(screen.getByText('Save'));
        expect(onSaveEdit).not.toHaveBeenCalled();
        expect(screen.queryByLabelText('Weight (kg) #1')).toBeNull();
    });

    it('asks before discarding unsaved changes', () => {
        const { onSaveEdit, onBack } = renderView();
        fireEvent.click(screen.getByLabelText('Edit workout'));
        fireEvent.change(screen.getByLabelText('Reps #1'), { target: { value: '9' } });
        fireEvent.click(screen.getByLabelText('Back'));

        expect(onBack).not.toHaveBeenCalled();
        expect(screen.getByRole('alertdialog')).toBeTruthy();
        fireEvent.click(screen.getByText('Keep editing'));
        expect((screen.getByLabelText('Reps #1') as HTMLInputElement).value).toBe('9');

        fireEvent.click(screen.getByLabelText('Back'));
        fireEvent.click(screen.getByText('Discard'));
        expect(onSaveEdit).not.toHaveBeenCalled();
        expect(screen.queryByLabelText('Reps #1')).toBeNull();
    });

    it('can remove and add a set, and refuses to empty the workout', () => {
        const { onSaveEdit } = renderView();
        fireEvent.click(screen.getByLabelText('Edit workout'));
        fireEvent.click(screen.getByText('Add set'));
        expect(screen.getByLabelText('Reps #3')).toBeTruthy();
        fireEvent.click(screen.getByLabelText('Remove set #3'));
        fireEvent.click(screen.getByLabelText('Remove set #2'));
        fireEvent.click(screen.getByLabelText('Remove set #1'));
        fireEvent.click(screen.getByText('Save'));
        expect(onSaveEdit).not.toHaveBeenCalled();
        expect(screen.getByRole('alert').textContent).toContain('at least one completed set');
    });

    it('shows and saves weights in the display unit', () => {
        const { onSaveEdit } = renderView(vi.fn(), makeLog(), 'lb');
        fireEvent.click(screen.getByLabelText('Edit workout'));
        expect((screen.getByLabelText('Weight (lbs) #1') as HTMLInputElement).value).toBe('220.5');
        fireEvent.change(screen.getByLabelText('Weight (lbs) #2'), { target: { value: '225' } });
        fireEvent.click(screen.getByText('Save'));
        const edited = onSaveEdit.mock.calls[0][1];
        expect(edited.exercises[0].sets[0].weight).toBe(100);
        expect(edited.exercises[0].sets[1].weight).toBeCloseTo(102.0583, 3);
    });
});
