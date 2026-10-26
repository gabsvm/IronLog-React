import { describe, it, expect } from 'vitest';
import {
    resolveExerciseIllustrationKey,
    resolveExerciseIllustration,
    EXERCISE_ILLUSTRATIONS,
    MUSCLE_ARCHETYPE_ILLUSTRATIONS,
} from '../../constants/exerciseIllustrationsMap';
import type { ExerciseDef } from '../../types';

describe('Exercise Illustrations Resolution Engine', () => {
    it('resolves direct built-in catalog exercises', () => {
        const ex: ExerciseDef = {
            id: 'bp_bar',
            name: { en: 'Barbell Bench Press', es: 'Press Banca Barra' },
            muscle: 'CHEST',
        };
        expect(resolveExerciseIllustrationKey(ex)).toBe('bp_bar');
        const paths = resolveExerciseIllustration(ex);
        expect(paths).toEqual(EXERCISE_ILLUSTRATIONS['bp_bar']);
    });

    it('prioritizes explicit user illustrationId override on custom exercises', () => {
        const customEx: ExerciseDef = {
            id: 'custom_123456789',
            name: 'Press Declinado Casero',
            muscle: 'CHEST',
            isCustom: true,
            illustrationId: 'bp_inc',
        };
        expect(resolveExerciseIllustrationKey(customEx)).toBe('bp_inc');
        const paths = resolveExerciseIllustration(customEx);
        expect(paths).toEqual(EXERCISE_ILLUSTRATIONS['bp_inc']);
    });

    it('matches custom exercise semantically by name and equipment tokens', () => {
        const testCases: { name: string; muscle: any; expectedKey: string }[] = [
            { name: 'Press militar con mancuernas', muscle: 'SHOULDERS', expectedKey: 'ohp_db' },
            { name: 'Sentadilla hack inclinada', muscle: 'QUADS', expectedKey: 'sq_hack' },
            { name: 'Dominadas neutras con lastre', muscle: 'BACK', expectedKey: 'cal_pullup_strict' },
            { name: 'Curl martillo en polea', muscle: 'BICEPS', expectedKey: 'curl_hammer' },
            { name: 'Aperturas en contractor / peck deck', muscle: 'CHEST', expectedKey: 'pec_fly' },
            { name: 'Remo en polea baja gironda', muscle: 'BACK', expectedKey: 'row_cable' },
            { name: 'Extensiones de triceps en polea con cuerda', muscle: 'TRICEPS', expectedKey: 'rope_pressdown' },
            { name: 'Peso muerto rumano con mancuernas', muscle: 'HAMSTRINGS', expectedKey: 'rdl' },
            { name: 'Elevaciones laterales sentado', muscle: 'SHOULDERS', expectedKey: 'lat_raise' },
            { name: 'Sentadilla búlgara profunda', muscle: 'QUADS', expectedKey: 'bulgarian_split_squat' },
        ];

        for (const tc of testCases) {
            const ex: ExerciseDef = {
                id: `custom_${Date.now()}`,
                name: tc.name,
                muscle: tc.muscle,
                isCustom: true,
            };
            const resolved = resolveExerciseIllustrationKey(ex);
            expect(resolved, `Failed to match "${tc.name}"`).toBe(tc.expectedKey);
            expect(resolveExerciseIllustration(ex)).toBeDefined();
        }
    });

    it('falls back to the muscle archetype when the custom exercise has an abstract name', () => {
        const abstractChest: ExerciseDef = {
            id: 'custom_99991',
            name: 'Reto 100 repeticiones secretas',
            muscle: 'CHEST',
            isCustom: true,
        };
        expect(resolveExerciseIllustrationKey(abstractChest)).toBe(MUSCLE_ARCHETYPE_ILLUSTRATIONS['CHEST']);
        expect(resolveExerciseIllustrationKey(abstractChest)).toBe('bp_bar');

        const abstractQuads: ExerciseDef = {
            id: 'custom_99992',
            name: 'Destructor infernal',
            muscle: 'QUADS',
            isCustom: true,
        };
        expect(resolveExerciseIllustrationKey(abstractQuads)).toBe(MUSCLE_ARCHETYPE_ILLUSTRATIONS['QUADS']);
        expect(resolveExerciseIllustrationKey(abstractQuads)).toBe('sq_bar');

        const abstractBack: ExerciseDef = {
            id: 'custom_99993',
            name: 'Finisher dorsal',
            muscle: 'BACK',
            isCustom: true,
        };
        expect(resolveExerciseIllustrationKey(abstractBack)).toBe('lat_pull');
    });
});
