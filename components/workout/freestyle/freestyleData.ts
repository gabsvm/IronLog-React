// U5: disciplines, CrossFit WODs, calisthenics skills and session-exercise factory, moved verbatim from components/workout/FreestyleSessionModal.tsx.
import { ExerciseDef, SessionExercise, WorkoutSet } from '../../../types';

export type Discipline = 'gym' | 'crossfit' | 'calisthenics';

// Curated WOD templates (CrossFit benchmark / hero workouts)
export const CF_WODS = [
    {
        id: 'fran',
        name: 'Fran',
        description: '21-15-9: Thrusters + Pull-Ups',
        schema: '21-15-9 reps for time',
        exercises: ['cf_thruster', 'cal_pullup'],
        sets: [21, 15, 9],
        type: 'for_time' as const,
    },
    {
        id: 'cindy',
        name: 'Cindy',
        description: '20 min AMRAP: 5 Pull-Ups, 10 Push-Ups, 15 Air Squats',
        schema: '20 min AMRAP',
        exercises: ['cal_pullup', 'cal_pu_std', 'cal_squat_bw'],
        sets: [5, 10, 15],
        type: 'amrap' as const,
    },
    {
        id: 'helen',
        name: 'Helen',
        description: '3 rounds: 400m Run, 21 KB Swings, 12 Pull-Ups',
        schema: '3 rounds for time',
        exercises: ['cardio_run', 'cf_kb_swing', 'cal_pullup'],
        sets: [1, 21, 12],
        type: 'for_time' as const,
    },
    {
        id: 'dt',
        name: 'DT',
        description: '5 rounds: 12 Deadlifts, 9 Hang PC, 6 Push Jerks',
        schema: '5 rounds for time',
        exercises: ['cf_deadlift', 'cf_hang_clean', 'cf_clean_jerk'],
        sets: [12, 9, 6],
        type: 'for_time' as const,
    },
    {
        id: 'angie',
        name: 'Angie',
        description: '100 Pull-Ups, 100 Push-Ups, 100 Sit-Ups, 100 Squats',
        schema: 'For time (in order)',
        exercises: ['cal_pullup', 'cal_pu_std', 'cf_ghd', 'cal_squat_bw'],
        sets: [100, 100, 100, 100],
        type: 'for_time' as const,
    },
    {
        id: 'grace',
        name: 'Grace',
        description: '30 Clean & Jerks for time',
        schema: '30 reps for time',
        exercises: ['cf_clean_jerk'],
        sets: [30],
        type: 'for_time' as const,
    },
    {
        id: 'jackie',
        name: 'Jackie',
        description: '1000m Row, 50 Thrusters (45lb), 30 Pull-Ups',
        schema: 'For time',
        exercises: ['cf_row_cal', 'cf_thruster', 'cal_pullup'],
        sets: [1, 50, 30],
        type: 'for_time' as const,
    },
    {
        id: 'murph',
        name: 'Murph',
        description: '1mi Run, 100 Pull-Ups, 200 Push-Ups, 300 Squats, 1mi Run',
        schema: 'For time (with vest optional)',
        exercises: ['cardio_run', 'cal_pullup', 'cal_pu_std', 'cal_squat_bw', 'cardio_run'],
        sets: [1, 100, 200, 300, 1],
        type: 'for_time' as const,
    },
];

// Curated Calisthenics full-day templates
export const CAL_SKILLS = [
    {
        id: 'push_full',
        name: { en: 'Push Day', es: 'Día de Empuje' },
        description: { en: 'Chest · Shoulders · Triceps', es: 'Pecho · Hombros · Tríceps' },
        exercises: ['cal_pu_std', 'cal_archer_pu', 'cal_pike_pu', 'cal_dip_std', 'cal_diamond_pu'],
        icon: 'ChevronUp',
        color: 'bg-primary-500'
    },
    {
        id: 'pull_full',
        name: { en: 'Pull Day', es: 'Día de Tracción' },
        description: { en: 'Back · Biceps · Rear Delt', es: 'Espalda · Bíceps · Deltoides Posterior' },
        exercises: ['cal_scap_pull', 'cal_au_pullup', 'cal_pullup', 'cal_chinup', 'cal_comm_pullup'],
        icon: 'ChevronDown',
        color: 'bg-primary-500'
    },
    {
        id: 'core_full',
        name: { en: 'Core Session', es: 'Sesión de Core' },
        description: { en: 'Abs · Anti-extension · Compression', es: 'Abdomen · Anti-extensión · Compresión' },
        exercises: ['cal_plank', 'cal_tuck_lsit', 'cal_hanging_lraise', 'cal_dragon_flag', 'cal_ab_wheel'],
        icon: 'Circle',
        color: 'bg-primary-500'
    },
    {
        id: 'legs_full',
        name: { en: 'Leg Day', es: 'Día de Piernas' },
        description: { en: 'Quads · Hamstrings · Glutes', es: 'Cuádriceps · Isquios · Glúteos' },
        exercises: ['cal_squat_bw', 'cal_bulgariansq', 'cal_pistol', 'cal_nordic_curl', 'cal_glute_bridge_bw'],
        icon: 'Footprints',
        color: 'bg-primary-500'
    },
    {
        id: 'full_upper',
        name: { en: 'Full Upper Body', es: 'Tren Superior Completo' },
        description: { en: 'Push + Pull + Shoulders', es: 'Empuje + Tracción + Hombros' },
        exercises: ['cal_pullup', 'cal_pu_std', 'cal_dip_std', 'cal_pike_pu', 'cal_l_pullup'],
        icon: 'Award',
        color: 'bg-primary-500'
    },
];

export const makeSessionExercise = (ex: ExerciseDef, reps = 10, sets = 3): SessionExercise => {
    const isIsometric = !!(ex as any).isIsometric;
    const setArr: WorkoutSet[] = Array.from({ length: sets }, (_, i) => ({
        id: i + 1,
        weight: '0',
        reps: isIsometric ? '' : String(reps),
        duration: isIsometric ? 0 : undefined,
        rpe: '',
        completed: false,
        type: 'regular' as const,
    }));
    return { ...ex, instanceId: Date.now() + Math.random(), sets: setArr };
};
