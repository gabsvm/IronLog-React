import { describe, it, expect } from 'vitest';
import { SessionBuilder } from '../../services/SessionBuilder';
import { ExerciseDef, MesoCycle, ProgramDay } from '../../types';
import { KONG_4DAY_V1 } from '../../programs/kong/kong4Day';

describe('SessionBuilder', () => {
    const mockExercises: ExerciseDef[] = [
        { id: 'bench_press', name: 'Barbell Bench Press', muscle: 'CHEST' },
        { id: 'incline_db_press', name: 'Incline DB Press', muscle: 'CHEST' },
        { id: 'pull_up', name: 'Pull Up', muscle: 'BACK' },
        { id: 'barbell_squat', name: 'Barbell Squat', muscle: 'QUADS' },
    ];

    const standardProgramDay: ProgramDay = {
        id: 'day_1',
        dayName: { en: 'Upper A', es: 'Torso A' },
        slots: [
            { muscle: 'CHEST', exerciseId: 'bench_press', setTarget: 3, reps: '8-10', setType: 'regular' },
            { muscle: 'BACK', exerciseId: 'pull_up', setTarget: 3, reps: '10-12', setType: 'regular' },
        ],
    };

    const mockMeso: MesoCycle = {
        id: 1,
        name: 'Hypertrophy Meso 1',
        week: 1,
        duration: 5,
        targetWeeks: 5,
        mesoType: 'hyp_1',
        plan: [['bench_press', 'pull_up']],
    };

    it('returns null if programDay is not provided', () => {
        const session = SessionBuilder.buildFromProgramDay(
            0,
            null as any,
            mockMeso,
            mockExercises,
            [],
            'es',
            {},
            { rpEnabled: false }
        );
        expect(session).toBeNull();
    });

    it('builds an active session from a standard program day', () => {
        const session = SessionBuilder.buildFromProgramDay(
            0,
            standardProgramDay,
            mockMeso,
            mockExercises,
            [],
            'es',
            {},
            { rpEnabled: false }
        );

        expect(session).not.toBeNull();
        expect(session!.name).toContain('Torso A');
        expect(session!.exercises.length).toBe(2);
        expect(session!.exercises[0].id).toBe('bench_press');
        expect(session!.exercises[0].name).toBe('Barbell Bench Press');
        expect(session!.exercises[0].sets.length).toBe(3);
        expect(session!.exercises[0].sets[0].completed).toBe(false);
    });

    it('falls back to same-muscle exercise if exact ID is not found in exercise list', () => {
        const missingExerciseDay: ProgramDay = {
            id: 'day_missing',
            dayName: { en: 'Chest Focus', es: 'Enfoque Pecho' },
            slots: [
                { muscle: 'CHEST', exerciseId: 'non_existent_chest_ex', setTarget: 3, reps: '8-12' },
            ],
        };

        const session = SessionBuilder.buildFromProgramDay(
            0,
            missingExerciseDay,
            mockMeso,
            mockExercises,
            [],
            'en',
            {},
            { rpEnabled: false }
        );

        expect(session).not.toBeNull();
        expect(session!.exercises[0].muscle).toBe('CHEST');
        // Falls back to one of the chest exercises
        expect(['bench_press', 'incline_db_press']).toContain(session!.exercises[0].id);
    });

    it('creates placeholder exercise if muscle has no matching exercise in catalog', () => {
        const unknownMuscleDay: ProgramDay = {
            id: 'day_calves',
            dayName: { en: 'Rare Muscle', es: 'Músculo Raro' },
            slots: [
                { muscle: 'CALVES', exerciseId: 'calf_raise_missing', setTarget: 2, reps: '15' },
            ],
        };

        const session = SessionBuilder.buildFromProgramDay(
            0,
            unknownMuscleDay,
            mockMeso,
            mockExercises,
            [],
            'en',
            {},
            { rpEnabled: false }
        );

        expect(session).not.toBeNull();
        expect(session!.exercises[0].id).toContain('placeholder_CALVES');
    });

    it('resolves KONG program day with exact block prescriptions and day names', () => {
        const kongMeso: MesoCycle = {
            id: 2,
            name: 'KONG',
            week: 1,
            duration: 12,
            targetWeeks: 12,
            mesoType: 'hyp_1',
            plan: [],
            programSystem: {
                systemId: KONG_4DAY_V1.id,
                systemVersion: 1,
                startedAt: Date.now(),
                substitutions: {},
            },
        };

        const session = SessionBuilder.buildFromProgramDay(
            0,
            standardProgramDay,
            kongMeso,
            mockExercises,
            [],
            'es',
            {},
            { rpEnabled: false }
        );

        expect(session).not.toBeNull();
        expect(session!.name).toContain('Día 1');
        expect(session!.exercises.length).toBeGreaterThan(0);
        // Prescriptions should be mapped
        expect(session!.exercises[0].sets.length).toBeGreaterThan(0);
        expect(session!.exercises[0].sets[0].targetRpe).toBeDefined();
    });

    it('halves set count during deload week for non-prescribed templates', () => {
        const deloadMeso: MesoCycle = {
            ...mockMeso,
            isDeload: true,
            week: 5,
        };

        const session = SessionBuilder.buildFromProgramDay(
            0,
            standardProgramDay,
            deloadMeso,
            mockExercises,
            [],
            'en',
            {},
            { rpEnabled: false }
        );

        expect(session).not.toBeNull();
        // Standard setTarget is 3, deload should ceil(3 / 2) = 2
        expect(session!.exercises[0].sets.length).toBe(2);
    });
});
