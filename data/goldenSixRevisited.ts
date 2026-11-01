import { ExerciseDef, GlobalTemplate, ProgramDay } from '../types';

// Golden Six Revisited — Hersovyac's expansion of Arnold's Golden Six.
// Source: https://hersovyac.com/arnold-full-body-training-the-golden-six/
// The article proposes 3 alternated full-body days (Workout A/B/C), each
// with 6 exercises. Order below follows the article exactly.

// --- New exercises (also seeded to `global_exercises` for Firebase) ---
export const GOLDEN_SIX_REVISITED_NEW_EXERCISES: ExerciseDef[] = [
    {
        id: 'sit_up',
        name: { en: 'Sit-Up', es: 'Abdominales (Sit-Up)' },
        muscle: 'ABS',
        instructions: {
            en: 'Feet anchored, torso up and down, core tight. Hip-flexor + core work.',
            es: 'Pies fijos, sube y baja el torso con el core firme. Trabajo de flexores de cadera y core.'
        },
        isBodyweight: true,
    },
    {
        id: 'neutral_chinup',
        name: { en: 'Neutral-Grip Chin-Up', es: 'Dominada Agarre Neutro' },
        muscle: 'BACK',
        instructions: {
            en: 'Palms facing each other. Full range of motion; add weight once 3x10-12 BW is easy.',
            es: 'Palmas enfrentadas. Rango completo; lastra cuando hagas 3x10-12 fácil con tu peso.'
        },
        isBodyweight: true,
    },
];

export const GOLDEN_SIX_REVISITED_PROGRAM: ProgramDay[] = [
    {
        id: 'gsr_a',
        dayName: { en: 'Day A: Golden Six Revisited (Classic)', es: 'Día A: Golden Six Revisado (Clásico)' },
        slots: [
            { muscle: 'QUADS', setTarget: 4, exerciseId: 'sq_bar', reps: '8-10', notes: 'Barbell Back Squat (to parallel)' },
            { muscle: 'CHEST', setTarget: 3, exerciseId: 'wide_bench_press', reps: '8-10', notes: 'Wide Grip Bench Press (wider than shoulder width)' },
            { muscle: 'BACK', setTarget: 3, exerciseId: 'chinup', reps: 'AMRAP', notes: 'Supinated Chin-Up: 3x max BW sets' },
            { muscle: 'SHOULDERS', setTarget: 3, exerciseId: 'behind_neck_press', reps: '8-10', notes: 'BTN Press: stop at ear line, wide grip' },
            { muscle: 'BICEPS', setTarget: 3, exerciseId: 'curl_bar', reps: '8-10', notes: 'Barbell Curl: strict, no swing' },
            { muscle: 'ABS', setTarget: 3, exerciseId: 'sit_up', reps: 'AMRAP', notes: 'Sit-Up: 3x max reps at BW' },
        ]
    },
    {
        id: 'gsr_b',
        dayName: { en: 'Day B: Golden Six Revisited (Hinge/Arms)', es: 'Día B: Golden Six Revisado (Bisagra/Brazos)' },
        slots: [
            { muscle: 'HAMSTRINGS', setTarget: 3, exerciseId: 'rdl', reps: '8-10', notes: 'Romanian Deadlift' },
            { muscle: 'HAMSTRINGS', setTarget: 3, exerciseId: 'lying_curl', reps: '8-10', notes: 'Lying Leg Curl: knee-flexor balance' },
            { muscle: 'CHEST', setTarget: 3, exerciseId: 'close_grip_bench', reps: '8-10', notes: 'Close Grip Bench Press: triceps focus' },
            { muscle: 'BACK', setTarget: 3, exerciseId: 'neutral_chinup', reps: 'AMRAP', notes: 'Neutral Chin-Up: 3x max BW or 3x8-10 weighted' },
            { muscle: 'SHOULDERS', setTarget: 3, exerciseId: 'rear_delt_fly', reps: '12-15', notes: 'Rear Delt DB Raises: incline bench ~30 deg' },
            { muscle: 'TRICEPS', setTarget: 3, exerciseId: 'db_tri_ext', reps: '8-10', notes: 'Pull Over Triceps: EZ bar or DB, joint comfort' },
        ]
    },
    {
        id: 'gsr_c',
        dayName: { en: 'Day C: Golden Six Revisited (Variation)', es: 'Día C: Golden Six Revisado (Variación)' },
        slots: [
            { muscle: 'QUADS', setTarget: 4, exerciseId: 'front_squat', reps: '6-8', notes: 'Front Squat (as deep as possible)' },
            { muscle: 'BACK', setTarget: 3, exerciseId: 'bent_barbell_row', reps: '7-10', notes: 'Bent Over Row: torso ~60 deg angle' },
            { muscle: 'TRICEPS', setTarget: 3, exerciseId: 'dips', reps: 'AMRAP', notes: 'Dips: 3x max BW or 3x8-10 weighted' },
            { muscle: 'SHOULDERS', setTarget: 3, exerciseId: 'ohp_db', reps: '8-10', notes: 'DB Seated Shoulder Press' },
            { muscle: 'BICEPS', setTarget: 3, exerciseId: 'curl_db', reps: '8-10/arm', notes: 'DB Seated Curl: 3x8-10 per arm' },
            { muscle: 'ABS', setTarget: 3, exerciseId: 'knee_raise', reps: 'AMRAP', notes: 'Hanging Knee-Bent Leg Raises: 3x max BW' },
        ]
    }
];

export const GOLDEN_SIX_REVISITED_TEMPLATE: GlobalTemplate = {
    id: 'golden_six_revisited',
    name: 'golden_six_revisited',
    title: { en: 'Golden Six Revisited (Arnold Full Body)', es: 'Golden Six Revisado (Full Body Arnold)' },
    description: {
        en: "Hersovyac's Revisited Golden Six: 3 alternating full-body days (A/B/C). Classic compounds plus hinge, upper-back, triceps and rear-delt work.",
        es: 'Golden Six Revisado de Hersovyac: 3 días full body alternados (A/B/C). Básicos clásicos más bisagra, espalda alta, tríceps y deltoides posterior.'
    },
    isPro: false,
    order: 13,
    program: GOLDEN_SIX_REVISITED_PROGRAM,
};
