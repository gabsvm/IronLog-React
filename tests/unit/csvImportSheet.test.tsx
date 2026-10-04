import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { CsvImportSheet } from '../../components/profile/CsvImportSheet';
import {
    matchParsedExerciseNames,
    parseHevyCsv,
    parseStrongCsv,
    splitFreshSessions,
} from '../../services/trainingCsv';
import type { ExerciseDef } from '../../types';

const LIB: ExerciseDef[] = [
    { id: 'bp_bar', name: { en: 'Barbell Bench Press', es: 'Press Banca Barra' }, muscle: 'CHEST' },
    { id: 'ohp', name: { en: 'Overhead Press', es: 'Press Militar' }, muscle: 'SHOULDERS' },
];

const HEVY = [
    'title,start_time,end_time,description,exercise_title,superset_id,exercise_notes,set_index,set_type,weight_kg,reps,distance_km,duration_seconds,rpe',
    '"Morning Push","2026-09-20 08:00:00","2026-09-20 09:00:00","","Barbell Bench Press","","",0,normal,60,8,,,8',
    '"Morning Push","2026-09-20 08:00:00","2026-09-20 09:00:00","","Zercher Squat","","",0,normal,50,6,,,8',
].join('\n');

const STRONG = [
    'Date,Workout Name,Exercise Name,Set Order,Weight,Reps,Distance,Seconds,Notes,Workout Notes,RPE',
    '2026-09-21 18:00:00,Evening Pull,Deadlift,1,100,5,,,,"",8',
].join('\n');

const renderSheet = (overrides: Record<string, any> = {}) => {
    const parsed = parseHevyCsv(HEVY);
    const { fresh, skippedCount } = splitFreshSessions(parsed.sessions, new Set());
    const matches = matchParsedExerciseNames(
        [...new Set(fresh.flatMap((s) => s.exercises.map((e) => e.name)))],
        LIB
    );
    const onConfirm = vi.fn();
    const onStrongUnitChange = vi.fn();
    const view = render(
        <CsvImportSheet
            open
            onClose={vi.fn()}
            parsed={parsed}
            fresh={fresh}
            skippedCount={skippedCount}
            matches={matches}
            library={LIB}
            lang="es"
            strongUnit="kg"
            onStrongUnitChange={onStrongUnitChange}
            onConfirm={onConfirm}
            {...overrides}
        />
    );
    return { onConfirm, onStrongUnitChange, ...view };
};

describe('Q12: CsvImportSheet', () => {
    it('shows the preview with auto-matched and unmapped exercises', () => {
        renderSheet();
        expect(screen.getByText('Hevy')).toBeTruthy();
        expect(screen.getByText('✓ Press Banca Barra')).toBeTruthy();
        expect(screen.getByText('Zercher Squat')).toBeTruthy();
        expect(screen.getByText(/Importar 1 sesion/)).toBeTruthy();
    });

    it('requires a muscle for created exercises, then confirms the mapping', () => {
        const { onConfirm } = renderSheet();
        const importBtn = screen.getByText(/Importar 1 sesion/);
        expect((importBtn as HTMLButtonElement).disabled).toBe(true);

        const muscleSelect = screen.getByText('Músculo').parentElement!.querySelector('select')!;
        fireEvent.change(muscleSelect, { target: { value: 'QUADS' } });
        expect((importBtn as HTMLButtonElement).disabled).toBe(false);

        fireEvent.click(importBtn);
        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onConfirm.mock.calls[0]![0]).toEqual({
            'Barbell Bench Press': { kind: 'existing', exerciseId: 'bp_bar' },
            'Zercher Squat': { kind: 'create', muscle: 'QUADS' },
        });
    });

    it('supports mapping an unknown exercise onto an existing one', () => {
        const { onConfirm } = renderSheet();
        const card = screen.getByText('Zercher Squat').parentElement!;
        fireEvent.click(within(card).getByRole('button', { name: /Mapear a/ }));
        const select = within(card).getByRole('combobox')!;
        fireEvent.change(select, { target: { value: 'ohp' } });
        fireEvent.click(screen.getByText(/Importar 1 sesion/));
        expect(onConfirm.mock.calls[0]![0]).toEqual({
            'Barbell Bench Press': { kind: 'existing', exerciseId: 'bp_bar' },
            'Zercher Squat': { kind: 'existing', exerciseId: 'ohp' },
        });
    });

    it('shows the Strong unit toggle and reports changes', () => {
        const parsed = parseStrongCsv(STRONG, 'kg');
        const { fresh, skippedCount } = splitFreshSessions(parsed.sessions, new Set());
        const matches = matchParsedExerciseNames(['Deadlift'], LIB);
        const onStrongUnitChange = vi.fn();
        render(
            <CsvImportSheet
                open
                onClose={vi.fn()}
                parsed={parsed}
                fresh={fresh}
                skippedCount={skippedCount}
                matches={matches}
                library={LIB}
                lang="en"
                strongUnit="kg"
                onStrongUnitChange={onStrongUnitChange}
                onConfirm={vi.fn()}
            />
        );
        expect(screen.getByText('File weights are in')).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'LBS' }));
        expect(onStrongUnitChange).toHaveBeenCalledWith('lb');
    });

    it('shows the nothing-new state when every session was imported', () => {
        const parsed = parseHevyCsv(HEVY);
        renderSheet({ fresh: [], skippedCount: parsed.sessions.length });
        expect(screen.getByText('No hay sesiones nuevas para importar.')).toBeTruthy();
        expect(screen.queryByText(/Importar 1 sesion/)).toBeNull();
    });
});
