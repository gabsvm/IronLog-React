import { GlobalTemplate, ProgramDay, ProgramSlot } from '../types';

export const NATURAL_HYPERTROPHY_TEMPLATES: GlobalTemplate[] = [
    // ---------------------------------------------------------
    // BEGINNER / NOVICE
    // ---------------------------------------------------------
    {
        id: 'nh_ult_beginner',
        name: 'NH Ultimate Beginner',
        title: { en: 'Ultimate Hypertrophy (Beginner)', es: 'Hipertrofia Definitiva (Principiante)' },
        description: { en: 'Natural Hypertrophy - 3 days/week full body for beginners.', es: 'Natural Hypertrophy - 3 días/semana full body para principiantes.' },
        isPro: false,
        order: 200,
        program: [
            {
                id: 'd1', dayName: { en: 'Monday', es: 'Lunes' },
                slots: [
                    { muscle: 'QUADS', setTarget: 2, reps: '6-8', exerciseId: 'sq_bar', notes: 'Barbell Squats + DB curls superset' },
                    { muscle: 'BICEPS', setTarget: 2, reps: '8-10', exerciseId: 'curl_db' },
                    { muscle: 'TRICEPS', setTarget: 2, reps: '6-8', exerciseId: 'dips', notes: 'Dips + DB rows superset' },
                    { muscle: 'BACK', setTarget: 2, reps: '10-12', exerciseId: 'row_db' },
                    { muscle: 'TRICEPS', setTarget: 3, reps: '10-15', exerciseId: 'tri_push', notes: 'Rope triceps + cable lateral + crunches' },
                    { muscle: 'SHOULDERS', setTarget: 3, reps: '10-15', exerciseId: 'lat_raise_cable' },
                    { muscle: 'ABS', setTarget: 3, reps: '8-10', exerciseId: 'abs_cable' }
                ]
            },
            {
                id: 'd2', dayName: { en: 'Wednesday', es: 'Miércoles' },
                slots: [
                    { muscle: 'SHOULDERS', setTarget: 2, reps: '6-8', exerciseId: 'ohp', notes: 'Barbell OHP + Hammer curls' },
                    { muscle: 'BICEPS', setTarget: 2, reps: '8-10', exerciseId: 'curl_hammer' },
                    { muscle: 'BACK', setTarget: 3, reps: '8-12', exerciseId: 'lat_pull' },
                    { muscle: 'HAMSTRINGS', setTarget: 3, reps: '12-15', exerciseId: 'leg_curl' },
                    { muscle: 'QUADS', setTarget: 3, reps: '10-15', exerciseId: 'leg_ext' },
                    { muscle: 'CHEST', setTarget: 3, reps: '12-15', exerciseId: 'pec_fly' },
                    { muscle: 'NECK', setTarget: 3, reps: '15-20', exerciseId: 'neck_curl' }
                ]
            },
            {
                id: 'd3', dayName: { en: 'Friday', es: 'Viernes' },
                slots: [
                    { muscle: 'HAMSTRINGS', setTarget: 2, reps: '8-10', exerciseId: 'rdl', notes: 'RDL + Seated calf raises' },
                    { muscle: 'CALVES', setTarget: 2, reps: '15-20', exerciseId: 'calf_raise' },
                    { muscle: 'CHEST', setTarget: 3, reps: '10-12', exerciseId: 'pushup', notes: 'Ring push-ups + DB preacher curls' },
                    { muscle: 'BICEPS', setTarget: 3, reps: '8-10', exerciseId: 'curl_preacher' },
                    { muscle: 'QUADS', setTarget: 2, reps: '8-10', exerciseId: 'leg_press' },
                    { muscle: 'TRICEPS', setTarget: 2, reps: '10-12', exerciseId: 'skull_crusher' },
                    { muscle: 'ABS', setTarget: 2, reps: 'AMRAP', exerciseId: 'leg_raise' }
                ]
            }
        ]
    },
    {
        id: 'nh_novice_split',
        name: 'NH Novice Split 3x',
        title: { en: 'Novice Split 3x', es: 'Rutina Dividida Novato 3x' },
        description: { en: 'Natural Hypertrophy - 3 days split focusing on main knee flexion, horizontal press, and hip hinge.', es: 'Natural Hypertrophy - Rutina 3 días enfocada en sentadilla, press y peso muerto.' },
        isPro: false,
        order: 201,
        program: [
            {
                id: 'd1', dayName: { en: 'Monday (Squat)', es: 'Lunes (Sentadilla)' },
                slots: [
                    { muscle: 'QUADS', setTarget: 3, reps: '4-8', exerciseId: 'sq_bar', notes: 'Main knee flexion (1-3 heavy sets)' },
                    { muscle: 'BACK', setTarget: 4, reps: '6-10', exerciseId: 'pullup', notes: 'Deadlift variation / pull-ups' },
                    { muscle: 'TRICEPS', setTarget: 4, reps: '8-12', exerciseId: 'skull_crusher' },
                    { muscle: 'BICEPS', setTarget: 4, reps: '8-12', exerciseId: 'curl_hammer' },
                    { muscle: 'CHEST', setTarget: 2, reps: 'AMRAP', exerciseId: 'pushup', notes: 'Pseudo GPP' },
                    { muscle: 'ABS', setTarget: 2, reps: 'AMRAP', exerciseId: 'abs_cable' }
                ]
            },
            {
                id: 'd2', dayName: { en: 'Wednesday (Bench)', es: 'Miércoles (Banca)' },
                slots: [
                    { muscle: 'CHEST', setTarget: 3, reps: '4-8', exerciseId: 'bp_bar', notes: 'Main horizontal press (1-3 heavy sets)' },
                    { muscle: 'CHEST', setTarget: 3, reps: '6-10', exerciseId: 'bp_bar', notes: 'Back off sets' },
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '6-10', exerciseId: 'ohp' },
                    { muscle: 'BACK', setTarget: 4, reps: '8-12', exerciseId: 'row_cable' },
                    { muscle: 'HAMSTRINGS', setTarget: 4, reps: '8-12', exerciseId: 'good_morning', notes: 'Hyperextensions or similar' },
                    { muscle: 'ABS', setTarget: 2, reps: 'AMRAP', exerciseId: 'leg_raise' }
                ]
            },
            {
                id: 'd3', dayName: { en: 'Friday (Deadlift)', es: 'Viernes (Peso Muerto)' },
                slots: [
                    { muscle: 'BACK', setTarget: 3, reps: '2-5', exerciseId: 'deadlift', notes: 'Main hip hinge (1-3 heavy sets)' },
                    { muscle: 'QUADS', setTarget: 4, reps: '6-10', exerciseId: 'sq_paused', notes: 'Squat variation / pull-ups' },
                    { muscle: 'BICEPS', setTarget: 4, reps: '8-12', exerciseId: 'curl_ez' },
                    { muscle: 'BACK', setTarget: 4, reps: 'AMRAP', exerciseId: 'pullup' },
                    { muscle: 'CHEST', setTarget: 2, reps: 'AMRAP', exerciseId: 'pushup', notes: 'Pseudo GPP' }
                ]
            }
        ]
    },

    // ---------------------------------------------------------
    // INTERMEDIATE
    // ---------------------------------------------------------
    {
        id: 'nh_intermediate_4d',
        name: 'NH 4-Day Intermediate',
        title: { en: 'Four-day Intermediate Program', es: 'Intermedio 4 Días (Natural Hypertrophy)' },
        description: { en: 'Natural Hypertrophy - 4 days (Upper/Lower/Full/Full).', es: 'Natural Hypertrophy - 4 días (Torso/Pierna/Full/Full).' },
        isPro: true,
        order: 202,
        program: [
            {
                id: 'd1', dayName: { en: 'Monday (Upper)', es: 'Lunes (Torso)' },
                slots: [
                    { muscle: 'CHEST', setTarget: 4, reps: '4-8', exerciseId: 'bp_bar', notes: 'Bench or Dips' },
                    { muscle: 'CHEST', setTarget: 4, reps: '6-10', exerciseId: 'bp_paused', notes: 'Bench variation + Chin ups AMRAP' },
                    { muscle: 'BACK', setTarget: 4, reps: 'AMRAP', exerciseId: 'chinup' },
                    { muscle: 'BACK', setTarget: 4, reps: '8-12', exerciseId: 'pendlay_row', notes: 'Pendlay or Seal rows + BB shrugs + Skullcrushers' },
                    { muscle: 'TRAPS', setTarget: 4, reps: 'AMRAP', exerciseId: 'shrug_db' },
                    { muscle: 'TRICEPS', setTarget: 4, reps: '8-12', exerciseId: 'skull_crusher' },
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '4-8', exerciseId: 'ohp', notes: 'OHP + EZ/DB curls + Chin ups' },
                    { muscle: 'BICEPS', setTarget: 4, reps: '8-12', exerciseId: 'curl_ez' },
                    { muscle: 'SHOULDERS', setTarget: 3, reps: '8-12', exerciseId: 'lat_raise' }
                ]
            },
            {
                id: 'd2', dayName: { en: 'Tuesday (Lower)', es: 'Martes (Piernas)' },
                slots: [
                    { muscle: 'QUADS', setTarget: 4, reps: '4-8', exerciseId: 'sq_bar' },
                    { muscle: 'QUADS', setTarget: 4, reps: '6-10', exerciseId: 'sq_paused', notes: 'Squat variation + Pull ups' },
                    { muscle: 'BACK', setTarget: 4, reps: 'AMRAP', exerciseId: 'pullup' },
                    { muscle: 'HAMSTRINGS', setTarget: 4, reps: '8-12', exerciseId: 'rdl', notes: 'RDLs + Coan grip / Plate pinch' },
                    { muscle: 'FOREARMS', setTarget: 4, reps: '15s', exerciseId: 'farmers_walk', notes: 'Grip hold' },
                    { muscle: 'ABS', setTarget: 3, reps: 'AMRAP', exerciseId: 'abs_cable' },
                    { muscle: 'CALVES', setTarget: 3, reps: '10-15', exerciseId: 'calf_raise' }
                ]
            },
            {
                id: 'd3', dayName: { en: 'Thursday (Full)', es: 'Jueves (Full Body)' },
                slots: [
                    { muscle: 'BACK', setTarget: 4, reps: '4-8', exerciseId: 'deadlift' },
                    { muscle: 'QUADS', setTarget: 4, reps: '8-12', exerciseId: 'sq_hack', notes: 'Squat variation + Pull ups' },
                    { muscle: 'BACK', setTarget: 4, reps: 'AMRAP', exerciseId: 'pullup' },
                    { muscle: 'CHEST', setTarget: 4, reps: '4-8', exerciseId: 'dips', notes: 'Bench or Dips + Chin ups' },
                    { muscle: 'BACK', setTarget: 4, reps: 'AMRAP', exerciseId: 'chinup' },
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '4-8', exerciseId: 'ohp', notes: 'OHP + Skullcrushers' },
                    { muscle: 'TRICEPS', setTarget: 4, reps: '8-12', exerciseId: 'skull_crusher' },
                    { muscle: 'BACK', setTarget: 4, reps: '4-8', exerciseId: 'pullup', notes: 'Weighted pull ups or Rows' }
                ]
            },
            {
                id: 'd4', dayName: { en: 'Saturday (Full)', es: 'Sábado (Full Body)' },
                slots: [
                    { muscle: 'QUADS', setTarget: 4, reps: '4-8', exerciseId: 'sq_bar' },
                    { muscle: 'HAMSTRINGS', setTarget: 4, reps: '8-12', exerciseId: 'rdl', notes: 'Deadlift variation + Pull ups' },
                    { muscle: 'BACK', setTarget: 4, reps: 'AMRAP', exerciseId: 'pullup' },
                    { muscle: 'CHEST', setTarget: 4, reps: '4-8', exerciseId: 'bp_bar', notes: 'Bench or Dips + Chin ups' },
                    { muscle: 'BACK', setTarget: 4, reps: 'AMRAP', exerciseId: 'chinup' },
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '4-8', exerciseId: 'ohp', notes: 'OHP + Skullcrushers' },
                    { muscle: 'TRICEPS', setTarget: 4, reps: '8-12', exerciseId: 'skull_crusher' },
                    { muscle: 'BACK', setTarget: 4, reps: '8-12', exerciseId: 'pendlay_row', notes: 'Pendlay rows + Chin ups' }
                ]
            }
        ]
    },

    // ---------------------------------------------------------
    // ANIME CHARACTERS (Specialist Physiques)
    // ---------------------------------------------------------
    {
        id: 'nh_baki',
        name: 'NH Baki Hanma Weight Training',
        title: { en: 'Baki Hanma Weight Training', es: 'Baki Hanma Weight Training' },
        description: { en: 'Natural Hypertrophy - 3 day advanced physical strength program mimicking Baki.', es: 'Natural Hypertrophy - Entrenamiento de pesas avanzado 3 días emulando a Baki Hanma.' },
        isPro: true,
        order: 203,
        program: [
            {
                id: 'd1', dayName: { en: 'Day 1', es: 'Día 1' },
                slots: [
                    { muscle: 'QUADS', setTarget: 3, reps: '4-8', exerciseId: 'sq_bar' },
                    { muscle: 'TRAPS', setTarget: 3, reps: 'AMRAP', exerciseId: 'shrug_db', notes: 'Band shrugs' },
                    { muscle: 'HAMSTRINGS', setTarget: 4, reps: '8-12', exerciseId: 'rdl' },
                    { muscle: 'BACK', setTarget: 4, reps: 'AMRAP', exerciseId: 'pullup' },
                    { muscle: 'TRICEPS', setTarget: 4, reps: '8-12', exerciseId: 'skull_crusher' },
                    { muscle: 'BICEPS', setTarget: 4, reps: 'AMRAP', exerciseId: 'curl_db' },
                    { muscle: 'CHEST', setTarget: 3, reps: 'AMRAP', exerciseId: 'pushup', notes: 'Giant set with Abs/Neck/Calves' },
                    { muscle: 'ABS', setTarget: 3, reps: 'AMRAP', exerciseId: 'leg_raise' },
                    { muscle: 'NECK', setTarget: 3, reps: 'AMRAP', exerciseId: 'neck_curl' },
                    { muscle: 'CALVES', setTarget: 3, reps: 'AMRAP', exerciseId: 'calf_raise' }
                ]
            },
            {
                id: 'd2', dayName: { en: 'Day 2', es: 'Día 2' },
                slots: [
                    { muscle: 'CHEST', setTarget: 3, reps: '6-10', exerciseId: 'bp_bar' },
                    { muscle: 'TRAPS', setTarget: 3, reps: 'AMRAP', exerciseId: 'shrug_db', notes: 'Horizontal torso shrugs' },
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '6-10', exerciseId: 'ohp' },
                    { muscle: 'BACK', setTarget: 4, reps: 'AMRAP', exerciseId: 'chinup' },
                    { muscle: 'HAMSTRINGS', setTarget: 4, reps: '8-12', exerciseId: 'good_morning', notes: 'Back hyperextensions' },
                    { muscle: 'BACK', setTarget: 4, reps: 'AMRAP', exerciseId: 'row_mach', notes: 'Ring rows' },
                    { muscle: 'CHEST', setTarget: 3, reps: 'AMRAP', exerciseId: 'diamond_pushup', notes: 'Giant set' },
                    { muscle: 'ABS', setTarget: 3, reps: 'AMRAP', exerciseId: 'abs_cable' },
                    { muscle: 'SHOULDERS', setTarget: 3, reps: 'AMRAP', exerciseId: 'lat_raise' }
                ]
            },
            {
                id: 'd3', dayName: { en: 'Day 3', es: 'Día 3' },
                slots: [
                    { muscle: 'BACK', setTarget: 3, reps: '2-5', exerciseId: 'deadlift', notes: 'Heavy deadlifts' },
                    { muscle: 'QUADS', setTarget: 4, reps: '6-10', exerciseId: 'sq_paused' },
                    { muscle: 'BACK', setTarget: 4, reps: 'AMRAP', exerciseId: 'pullup' },
                    { muscle: 'TRAPS', setTarget: 4, reps: '10-15', exerciseId: 'shrug_db' },
                    { muscle: 'SHOULDERS', setTarget: 4, reps: 'AMRAP', exerciseId: 'face_pull' },
                    { muscle: 'CHEST', setTarget: 3, reps: 'AMRAP', exerciseId: 'pushup', notes: 'Giant set' },
                    { muscle: 'ABS', setTarget: 3, reps: 'AMRAP', exerciseId: 'leg_raise' },
                    { muscle: 'NECK', setTarget: 3, reps: 'AMRAP', exerciseId: 'neck_ext' },
                    { muscle: 'CALVES', setTarget: 3, reps: 'AMRAP', exerciseId: 'calf_raise' }
                ]
            }
        ]
    },
    {
        id: 'nh_toji',
        name: 'NH Toji Fushiguro (V-Taper)',
        title: { en: 'Toji Fushiguro (V-Taper Workout)', es: 'Toji Fushiguro (Espalda V)' },
        description: { en: 'Natural Hypertrophy - Aesthetic V-Taper workout based on Toji.', es: 'Natural Hypertrophy - Entrenamiento estético de espalda en V basado en Toji.' },
        isPro: true,
        order: 204,
        program: [
            {
                id: 'd1', dayName: { en: 'Monday', es: 'Lunes' },
                slots: [
                    { muscle: 'CHEST', setTarget: 4, reps: 'AMRAP', exerciseId: 'dips', notes: 'Weighted dips' },
                    { muscle: 'TRAPS', setTarget: 4, reps: '6-10', exerciseId: 'shrug_db' },
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '6-12', exerciseId: 'lat_raise_cable' },
                    { muscle: 'ABS', setTarget: 4, reps: '8-12', exerciseId: 'abs_cable', notes: 'Weighted sit-ups' },
                    { muscle: 'BACK', setTarget: 4, reps: '6-10', exerciseId: 'chinup', notes: 'Weighted chin-ups' },
                    { muscle: 'QUADS', setTarget: 4, reps: '8-12', exerciseId: 'lunges', notes: 'Split-squats' }
                ]
            },
            {
                id: 'd2', dayName: { en: 'Wednesday', es: 'Miércoles' },
                slots: [
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '6-10', exerciseId: 'ohp_db' },
                    { muscle: 'BICEPS', setTarget: 4, reps: '6-12', exerciseId: 'curl_hammer' },
                    { muscle: 'TRICEPS', setTarget: 4, reps: '10-15', exerciseId: 'tri_push', notes: 'Cable katana extensions' },
                    { muscle: 'NECK', setTarget: 4, reps: '15-20', exerciseId: 'neck_curl' },
                    { muscle: 'BACK', setTarget: 4, reps: '8-12', exerciseId: 'row_db', notes: 'Krock rows' },
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '12-15', exerciseId: 'rear_delt_fly' }
                ]
            },
            {
                id: 'd3', dayName: { en: 'Friday', es: 'Viernes' },
                slots: [
                    { muscle: 'CHEST', setTarget: 3, reps: '6-10', exerciseId: 'bp_bar', notes: 'Close grip bench' },
                    { muscle: 'BICEPS', setTarget: 4, reps: '6-12', exerciseId: 'curl_ez', notes: 'EZ bar preacher curls' },
                    { muscle: 'BACK', setTarget: 3, reps: '8-12', exerciseId: 'pullover_db' },
                    { muscle: 'ABS', setTarget: 3, reps: '10-15', exerciseId: 'abs_cable', notes: 'Weighted Russian twists' },
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '10-15', exerciseId: 'lat_raise', notes: 'Upright rows' },
                    { muscle: 'QUADS', setTarget: 4, reps: '8-12', exerciseId: 'leg_press' }
                ]
            },
            {
                id: 'd4', dayName: { en: 'Saturday', es: 'Sábado' },
                slots: [
                    { muscle: 'SHOULDERS', setTarget: 3, reps: '8-12', exerciseId: 'ohp', notes: 'Machine shoulder press' },
                    { muscle: 'NECK', setTarget: 3, reps: '15-20', exerciseId: 'neck_ext' },
                    { muscle: 'BACK', setTarget: 3, reps: '6-10', exerciseId: 'row_db', notes: 'Incline DB rows' },
                    { muscle: 'TRICEPS', setTarget: 3, reps: '8-12', exerciseId: 'tri_push' },
                    { muscle: 'TRAPS', setTarget: 3, reps: '30m', exerciseId: 'farmers_walk' },
                    { muscle: 'SHOULDERS', setTarget: 3, reps: '8-12', exerciseId: 'lat_raise', notes: 'Y raises' }
                ]
            }
        ]
    },

    // ---------------------------------------------------------
    // DOOM SLAYER & KRATOS
    // ---------------------------------------------------------
    {
        id: 'nh_doom_slayer',
        name: 'NH Doom Slayer PPL',
        title: { en: 'Doom Slayer PPL', es: 'Doom Slayer PPL' },
        description: { en: 'Natural Hypertrophy - Extremely high volume Pull/Push/Legs.', es: 'Natural Hypertrophy - PPL de altísimo volumen basado en Doom Slayer.' },
        isPro: true,
        order: 205,
        program: [
            {
                id: 'd1', dayName: { en: 'Pull 1', es: 'Tirón 1' },
                slots: [
                    { muscle: 'BACK', setTarget: 3, reps: '6-10', exerciseId: 'row_cable', notes: 'Barbell row OR T-bar row' },
                    { muscle: 'ABS', setTarget: 3, reps: '10-15', exerciseId: 'abs_cable' },
                    { muscle: 'BACK', setTarget: 3, reps: '10-15', exerciseId: 'lat_pull' },
                    { muscle: 'SHOULDERS', setTarget: 3, reps: '10-15', exerciseId: 'lat_raise', notes: 'Upright rows OR Y raises' },
                    { muscle: 'NECK', setTarget: 3, reps: '15-20', exerciseId: 'neck_ext' },
                    { muscle: 'BICEPS', setTarget: 3, reps: '8-12', exerciseId: 'curl_db' },
                    { muscle: 'TRAPS', setTarget: 3, reps: '30m', exerciseId: 'farmers_walk' },
                    { muscle: 'TRAPS', setTarget: 3, reps: '10-15', exerciseId: 'shrug_db' }
                ]
            },
            {
                id: 'd2', dayName: { en: 'Push 1', es: 'Empuje 1' },
                slots: [
                    { muscle: 'CHEST', setTarget: 3, reps: '6-10', exerciseId: 'dips', notes: 'Dips OR Bench press' },
                    { muscle: 'SHOULDERS', setTarget: 3, reps: '10-15', exerciseId: 'rear_delt_fly', notes: 'Rear delt row OR Reverse peck deck' },
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '8-12', exerciseId: 'ohp' },
                    { muscle: 'BICEPS', setTarget: 4, reps: '8-12', exerciseId: 'curl_hammer' },
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '10-15', exerciseId: 'lat_raise_cable' },
                    { muscle: 'TRICEPS', setTarget: 4, reps: '8-12', exerciseId: 'tri_push', notes: 'Crossbody extensions' },
                    { muscle: 'CHEST', setTarget: 4, reps: '6-10', exerciseId: 'pec_fly' }
                ]
            },
            {
                id: 'd3', dayName: { en: 'Legs 1', es: 'Piernas 1' },
                slots: [
                    { muscle: 'QUADS', setTarget: 3, reps: '6-10', exerciseId: 'sq_bar' },
                    { muscle: 'NECK', setTarget: 3, reps: '10-15', exerciseId: 'neck_curl' },
                    { muscle: 'HAMSTRINGS', setTarget: 4, reps: '8-12', exerciseId: 'leg_curl', notes: 'Hyperextensions OR Leg curls' },
                    { muscle: 'ABS', setTarget: 4, reps: '10-15', exerciseId: 'abs_cable', notes: 'Russian twists' },
                    { muscle: 'QUADS', setTarget: 3, reps: '10-15', exerciseId: 'leg_ext' },
                    { muscle: 'CALVES', setTarget: 3, reps: '15-20', exerciseId: 'calf_raise' }
                ]
            },
            {
                id: 'd4', dayName: { en: 'Pull 2', es: 'Tirón 2' },
                slots: [
                    { muscle: 'BACK', setTarget: 3, reps: '3-5', exerciseId: 'pullup', notes: 'Weighted pull-ups' },
                    { muscle: 'SHOULDERS', setTarget: 3, reps: '10-15', exerciseId: 'face_pull' },
                    { muscle: 'BACK', setTarget: 4, reps: '6-12', exerciseId: 'row_db', notes: 'Kroc rows OR Meadows rows' },
                    { muscle: 'FOREARMS', setTarget: 4, reps: '10-15', exerciseId: 'wrist_curl', notes: 'Goose neck wrist curls' },
                    { muscle: 'TRAPS', setTarget: 3, reps: '6-10', exerciseId: 'shrug_db', notes: 'Power shrugs OR Block pulls' },
                    { muscle: 'BICEPS', setTarget: 3, reps: '6-12', exerciseId: 'curl_preacher' }
                ]
            },
            {
                id: 'd5', dayName: { en: 'Push 2', es: 'Empuje 2' },
                slots: [
                    { muscle: 'CHEST', setTarget: 3, reps: '8-12', exerciseId: 'bp_inc' },
                    { muscle: 'NECK', setTarget: 3, reps: '10-15', exerciseId: 'neck_ext' },
                    { muscle: 'CHEST', setTarget: 3, reps: '6-10', exerciseId: 'bp_flat', notes: 'Converging chest press OR Weighted push-ups' },
                    { muscle: 'ABS', setTarget: 3, reps: '8-12', exerciseId: 'abs_cable', notes: 'Decline sit-ups' },
                    { muscle: 'TRICEPS', setTarget: 4, reps: '8-12', exerciseId: 'jm_press' },
                    { muscle: 'BICEPS', setTarget: 4, reps: '6-10', exerciseId: 'curl_hammer', notes: 'Hangman curls' }
                ]
            },
            {
                id: 'd6', dayName: { en: 'Legs 2', es: 'Piernas 2' },
                slots: [
                    { muscle: 'HAMSTRINGS', setTarget: 2, reps: '6-12', exerciseId: 'rdl' },
                    { muscle: 'SHOULDERS', setTarget: 2, reps: '8-12', exerciseId: 'rear_delt_fly', notes: 'DB rear delt swings' },
                    { muscle: 'QUADS', setTarget: 3, reps: '8-12', exerciseId: 'sq_hack', notes: 'Smith machine squat OR Leg press' },
                    { muscle: 'CALVES', setTarget: 3, reps: '10-15', exerciseId: 'calf_raise' },
                    { muscle: 'HAMSTRINGS', setTarget: 3, reps: '10-15', exerciseId: 'leg_curl', notes: 'GHR OR Nordic hamstring curls' },
                    { muscle: 'FOREARMS', setTarget: 3, reps: '1min', exerciseId: 'farmers_walk', notes: 'Dead-hangs' }
                ]
            }
        ]
    },
    {
        id: 'nh_superman',
        name: 'NH Superman Aesthetics',
        title: { en: 'Superman Aesthetics (Henry Cavill)', es: 'Superman Aesthetics (Henry Cavill)' },
        description: { en: 'Natural Hypertrophy - Build the Man of Steel physique.', es: 'Natural Hypertrophy - Construye el físico del Hombre de Acero.' },
        isPro: true,
        order: 206,
        program: [
            {
                id: 'd1', dayName: { en: 'Monday (Upper)', es: 'Lunes (Torso)' },
                slots: [
                    { muscle: 'CHEST', setTarget: 4, reps: '4-10', exerciseId: 'bp_bar', notes: 'Bench press OR Dips' },
                    { muscle: 'BACK', setTarget: 4, reps: '6-12', exerciseId: 'row_mach' },
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '6-10', exerciseId: 'ohp', notes: 'Machine overhead press' },
                    { muscle: 'BICEPS', setTarget: 4, reps: '8-12', exerciseId: 'curl_ez' },
                    { muscle: 'ABS', setTarget: 4, reps: '10-15', exerciseId: 'abs_cable', notes: 'Decline sit-ups' },
                    { muscle: 'CHEST', setTarget: 4, reps: '12-15', exerciseId: 'pec_fly' },
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '10-15', exerciseId: 'lat_raise' }
                ]
            },
            {
                id: 'd2', dayName: { en: 'Wednesday (Lower)', es: 'Miércoles (Piernas)' },
                slots: [
                    { muscle: 'QUADS', setTarget: 3, reps: '6-8', exerciseId: 'sq_bar', notes: 'Zercher squats OR Belt squats' },
                    { muscle: 'NECK', setTarget: 4, reps: '10-15', exerciseId: 'neck_ext' },
                    { muscle: 'HAMSTRINGS', setTarget: 4, reps: '8-12', exerciseId: 'rdl', notes: 'RDLs OR Block pulls' },
                    { muscle: 'BICEPS', setTarget: 4, reps: '10-12', exerciseId: 'curl_cable', notes: 'Behind the back cable curls' },
                    { muscle: 'CALVES', setTarget: 4, reps: '15-20', exerciseId: 'calf_raise' },
                    { muscle: 'BACK', setTarget: 4, reps: '8-12', exerciseId: 'lat_pull' },
                    { muscle: 'TRICEPS', setTarget: 4, reps: '10-12', exerciseId: 'tri_push' }
                ]
            },
            {
                id: 'd3', dayName: { en: 'Friday (Full Body)', es: 'Viernes (Full Body)' },
                slots: [
                    { muscle: 'CHEST', setTarget: 4, reps: '6-12', exerciseId: 'bp_inc', notes: 'Incline press OR Viking press' },
                    { muscle: 'BACK', setTarget: 4, reps: '8-12', exerciseId: 'pullover_db', notes: 'Krock rows OR DB pullovers' },
                    { muscle: 'TRAPS', setTarget: 3, reps: '30m', exerciseId: 'farmers_walk' },
                    { muscle: 'SHOULDERS', setTarget: 3, reps: '12-15', exerciseId: 'lat_raise_cable' },
                    { muscle: 'QUADS', setTarget: 4, reps: '15-20', exerciseId: 'leg_ext', notes: 'Split squats' },
                    { muscle: 'BICEPS', setTarget: 4, reps: '10-12', exerciseId: 'curl_hammer' },
                    { muscle: 'NECK', setTarget: 4, reps: '10-15', exerciseId: 'neck_curl' }
                ]
            }
        ]
    }
];
