import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExerciseVolumeLine } from '../../components/workout/ExerciseVolumeLine';
import { TRANSLATIONS } from '../../constants';

const base = { unit: 'kg' as const, unitLabel: 'KG', lang: 'es' as const, labels: TRANSLATIONS.es.exerciseCard.volumeLine };

describe('ExerciseVolumeLine', () => {
    it('shows previous volume before any set is completed', () => {
        render(<ExerciseVolumeLine {...base} comparison={{ kind: 'volume', current: 0, previous: 1800, delta: null }} />);
        const line = screen.getByTestId('exercise-volume-line');
        expect(line.textContent).toContain('Volumen: —');
        expect(line.textContent).toContain('Anterior: 1800 kg');
    });

    it('shows current volume and signed delta once sets are done', () => {
        render(<ExerciseVolumeLine {...base} comparison={{ kind: 'volume', current: 1500, previous: 1800, delta: -300 }} />);
        const text = screen.getByTestId('exercise-volume-line').textContent!;
        expect(text).toContain('1500 kg');
        expect(text).toContain('−300 kg vs. anterior');
    });

    it('converts to lb for display and counts reps for bodyweight', () => {
        const { unmount } = render(<ExerciseVolumeLine {...base} unit="lb" unitLabel="LBS" lang="en" labels={TRANSLATIONS.en.exerciseCard.volumeLine} comparison={{ kind: 'volume', current: 100, previous: 100, delta: 0 }} />);
        expect(screen.getByTestId('exercise-volume-line').textContent).toContain('220.5 lbs');
        unmount();
        render(<ExerciseVolumeLine {...base} comparison={{ kind: 'reps', current: 20, previous: 18, delta: 2 }} />);
        expect(screen.getByTestId('exercise-volume-line').textContent).toContain('+2 reps vs. anterior');
    });
});
