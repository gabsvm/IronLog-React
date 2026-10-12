import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RepMaxTable } from '../../views/stats/RepMaxTable';
import { computeRepMaxTable } from '../../utils/repMaxTable';
import { TRANSLATIONS } from '../../constants';

describe('RepMaxTable', () => {
    it('renders actual and predicted values converted to the display unit', () => {
        const rows = computeRepMaxTable([{
            id: 1, dayIdx: 0, name: 'x', startTime: 1, endTime: 2, duration: 1, mesoId: 1, week: 1,
            exercises: [{ id: 'bench', instanceId: 1, sets: [{ id: 1, weight: 100, reps: 5, rpe: '', completed: true, type: 'regular' }] } as any],
        }], new Set(['bench']));
        const { container } = render(<RepMaxTable rows={rows} unit="lb" lang="en" labels={TRANSLATIONS.en.statsView} />);
        expect(screen.getByTestId('rep-max-best-5').textContent).toContain('220.5 lbs');
        expect(screen.getByTestId('rep-max-best-3').textContent).toBe('—');
        expect(container.textContent).toContain('Rep maxes');
    });
});
