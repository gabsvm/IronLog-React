import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../../context/AuthContext', () => ({
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useAuth: () => ({
        user: null,
        subscription: { isPro: false },
        logout: vi.fn(),
    }),
}));

vi.mock('../../context/TimerContext', () => ({
    TimerProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useTimerActions: () => ({ setRestTimer: vi.fn() }),
    useTimerState: () => ({ active: false, timeLeft: 0 }),
}));

vi.mock('../../context/AppContext', () => ({
    useAppPreferences: () => ({ lang: 'es', theme: 'dark' }),
}));
import {
    DndContext,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TRANSLATIONS } from '../../constants';
import type { SessionExercise, WorkoutSet } from '../../types';
import { resolveMuscleLabel } from '../../utils/muscle';
import { SortableExerciseRow } from '../../components/workout/ReorderExercisesSheet';
import { ProgressChart } from '../../components/stats/ProgressChart';

const RAW_ENUMS = ['CHEST', 'BACK', 'QUADS', 'HAMSTRINGS', 'SHOULDERS', 'BICEPS', 'TRICEPS'];

describe('K4: Spanish UI has no raw English enums or strings', () => {
    it('resolveMuscleLabel translates valid groups and preserves custom text', () => {
        expect(resolveMuscleLabel('CHEST', 'es')).toBe('Pecho');
        expect(resolveMuscleLabel('QUADS', 'es')).toBe('Cuádriceps');
        expect(resolveMuscleLabel('BICEPS', 'es')).toBe('Bíceps');
        expect(resolveMuscleLabel('CHEST', 'en')).toBe('Chest');
        expect(resolveMuscleLabel('Mi press banca inclinado', 'es')).toBe('Mi press banca inclinado');
        expect(resolveMuscleLabel(undefined, 'es')).toBe('');
    });

    it('reorder row in es shows translated muscle, never the raw enum', () => {
        const Harness: React.FC<{ exercise: SessionExercise }> = ({ exercise }) => {
            const sensors = useSensors(useSensor(PointerSensor));
            return (
                <DndContext sensors={sensors} collisionDetection={closestCenter}>
                    <SortableContext items={[exercise.instanceId]} strategy={verticalListSortingStrategy}>
                        <SortableExerciseRow exercise={exercise} index={0} lang="es" />
                    </SortableContext>
                </DndContext>
            );
        };
        const sets = [{ id: 1, type: 'regular', weight: 80, reps: 10, completed: false }] as WorkoutSet[];

        const { unmount } = render(
            <Harness exercise={{ id: 'e1', instanceId: 1, name: 'Press', muscle: 'CHEST', sets }} />
        );
        expect(screen.getByText('Pecho')).toBeTruthy();
        for (const raw of RAW_ENUMS) {
            expect(screen.queryByText(raw, { exact: true })).toBeNull();
        }
        unmount();

        render(
            <Harness exercise={{ id: 'e2', instanceId: 2, name: 'Press', muscle: 'CHEST', slotLabel: 'Pecho superior polea', sets }} />
        );
        expect(screen.getByText('Pecho superior polea')).toBeTruthy();
    });

    it('ProgressChart empty state in es shows Spanish, not English', () => {
        render(<ProgressChart dataPoints={[]} metric="1rm" />);
        expect(screen.getByText(TRANSLATIONS.es.progressEmptyTitle)).toBeTruthy();
        expect(screen.getByText(TRANSLATIONS.es.progressEmptyBody)).toBeTruthy();
        expect(screen.queryByText('Not enough data', { exact: true })).toBeNull();
        expect(screen.queryByText(/Complete at least 2 workouts/)).toBeNull();
    });

    it('stats title, levels and plan types resolve in both languages', () => {
        expect(TRANSLATIONS.es.statsTitle).toBe('Estadísticas');
        expect(TRANSLATIONS.en.statsTitle).toBe('Stats');
        expect(TRANSLATIONS.es.statsLevels).toEqual({ beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado' });
        expect(TRANSLATIONS.es.planTypes.lifetime).toBe('Vitalicio');
        expect(TRANSLATIONS.en.planTypes.lifetime).toBe('Lifetime');
    });
});
