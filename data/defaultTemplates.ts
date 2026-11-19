import { ProgramDay, GlobalTemplate, MuscleGroup } from '../types';
import { NATURAL_HYPERTROPHY_TEMPLATES } from './naturalHypertrophy';
import { GOLDEN_SIX_REVISITED_TEMPLATE } from './goldenSixRevisited';
import { RP_ALL_TEMPLATES, RP_GUIDELINE_IMAGES } from './rpTemplates';
import { DAVID_SHAUGHNESSY_SILVERBACK_TEMPLATE } from './davidShaughnessy';
import { FULL_BODY_TEMPLATE, DEFAULT_TEMPLATE } from './defaultProgram';

export { FULL_BODY_TEMPLATE, DEFAULT_TEMPLATE };

const ASSETS_BASE = (import.meta as any).env?.VITE_ASSETS_BASE || '';

export const TOKITA_TEMPLATE: ProgramDay[] = [
    {
        id: 'tokita_1',
        dayName: { en: 'Day 1: Upper', es: 'Día 1: Torso' },
        slots: [
            { muscle: 'CHEST', setTarget: 3, exerciseId: 'bp_bar', reps: '6-10', notes: 'Bench press (3 sets of 6-10)' },
            // Superset 1: DB Shoulder Press + Weighted Chin-ups
            { muscle: 'SHOULDERS', setTarget: 4, exerciseId: 'ohp_db', reps: '8-12', supersetId: 'tokita_d1_ss1', notes: 'DB press (4x8-12) + Weighted chin-ups (4x3-6)' },
            { muscle: 'BACK', setTarget: 4, exerciseId: 'chinup', reps: '3-6', supersetId: 'tokita_d1_ss1' },
            // Giant Set 1: Curls + Knee Raises + Face Pulls
            { muscle: 'BICEPS', setTarget: 4, exerciseId: 'curl_bar', reps: '8-12', supersetId: 'tokita_d1_ss2', notes: 'Curls (4x8-12) + Hanging knee raises AMRAP + Face pulls (4x15-20)' },
            { muscle: 'ABS', setTarget: 4, exerciseId: 'knee_raise', reps: 'AMRAP', supersetId: 'tokita_d1_ss2' },
            { muscle: 'SHOULDERS', setTarget: 4, exerciseId: 'face_pull', reps: '15-20', supersetId: 'tokita_d1_ss2' },
            // Giant Set 2: Pushups + Lateral Raises + Calves
            { muscle: 'CHEST', setTarget: 4, exerciseId: 'pushup', reps: 'AMRAP', supersetId: 'tokita_d1_ss3', notes: 'Push-ups AMRAP + Lateral raises (4x8-12) + Calf raises AMRAP' },
            { muscle: 'SHOULDERS', setTarget: 4, exerciseId: 'lat_raise', reps: '8-12', supersetId: 'tokita_d1_ss3' },
            { muscle: 'CALVES', setTarget: 4, exerciseId: 'calf_raise', reps: 'AMRAP', supersetId: 'tokita_d1_ss3' }
        ]
    },
    {
        id: 'tokita_2',
        dayName: { en: 'Day 2: Lower', es: 'Día 2: Pierna' },
        slots: [
            { muscle: 'HAMSTRINGS', setTarget: 3, exerciseId: 'good_morning', reps: '6-12', notes: 'Good mornings (3 sets of 6-12)' }, 
            // Superset 1: Lunges + Pullups
            { muscle: 'QUADS', setTarget: 4, exerciseId: 'lunges', reps: '10-15', supersetId: 'tokita_d2_ss1', notes: 'Lunges (or HIIT cardio, 4x10-15) + Pull-ups (bodyweight only) AMRAP' },
            { muscle: 'BACK', setTarget: 4, exerciseId: 'pullup', reps: 'AMRAP', supersetId: 'tokita_d2_ss1' },
            // Giant Set: Finger Curls + Leg Raises + Calves
            { muscle: 'FOREARMS', setTarget: 4, exerciseId: 'finger_curl', reps: '8-12', supersetId: 'tokita_d2_ss2', notes: 'Finger curls (4x8-12) + Hanging leg raises AMRAP + Calf raises AMRAP' },
            { muscle: 'ABS', setTarget: 4, exerciseId: 'leg_raise', reps: 'AMRAP', supersetId: 'tokita_d2_ss2' },
            { muscle: 'CALVES', setTarget: 4, exerciseId: 'calf_raise', reps: 'AMRAP', supersetId: 'tokita_d2_ss2' }
        ]
    },
    {
        id: 'tokita_3',
        dayName: { en: 'Day 3: Upper', es: 'Día 3: Torso' },
        slots: [
            { muscle: 'SHOULDERS', setTarget: 4, exerciseId: 'ohp', reps: '6-10', notes: 'OHP (4 sets of 6-10)' },
            // Superset 1: Pause Bench + Face Pulls
            { muscle: 'CHEST', setTarget: 4, exerciseId: 'bp_paused', reps: '4-8', supersetId: 'tokita_d3_ss1', notes: 'Pause bench (4x4-8) + Face pulls (4x15-20)' },
            { muscle: 'SHOULDERS', setTarget: 4, exerciseId: 'face_pull', reps: '15-20', supersetId: 'tokita_d3_ss1' },
            // Giant Set: Preacher + Rear Delt + Calves
            { muscle: 'BICEPS', setTarget: 4, exerciseId: 'curl_preacher', reps: '6-10', supersetId: 'tokita_d3_ss2', notes: 'Preacher curls (4x6-10) + Bent over lateral raises (4x8-12) + Calf raises AMRAP' },
            { muscle: 'SHOULDERS', setTarget: 4, exerciseId: 'rear_delt_fly', reps: '8-12', supersetId: 'tokita_d3_ss2' },
            { muscle: 'CALVES', setTarget: 4, exerciseId: 'calf_raise', reps: 'AMRAP', supersetId: 'tokita_d3_ss2' }
        ]
    },
    {
        id: 'tokita_4',
        dayName: { en: 'Day 4: Full Body', es: 'Día 4: Cuerpo Completo' },
        slots: [
            // Superset 1: Reverse Lunges + Chest Flies
            { muscle: 'QUADS', setTarget: 4, exerciseId: 'lunge_reverse', reps: '10-15', supersetId: 'tokita_d4_ss1', notes: 'Reverse lunges (or HIIT cardio, 4x10-15) + Chest flies (4x10-15)' },
            { muscle: 'CHEST', setTarget: 4, exerciseId: 'pec_fly', reps: '10-15', supersetId: 'tokita_d4_ss1' },
            // Superset 2: Weighted Pullups + Pushups
            { muscle: 'BACK', setTarget: 4, exerciseId: 'pullup', reps: '3-6', supersetId: 'tokita_d4_ss2', notes: 'Weighted pull-ups (4x3-6) + Push-ups AMRAP' },
            { muscle: 'CHEST', setTarget: 4, exerciseId: 'pushup', reps: 'AMRAP', supersetId: 'tokita_d4_ss2' },
            // Giant Set: Triceps + Face Pulls + Leg Raises
            { muscle: 'TRICEPS', setTarget: 4, exerciseId: 'tri_ext', reps: '8-12', supersetId: 'tokita_d4_ss3', notes: 'Triceps extensions (4x8-12) + Face-pulls (4x15-20) + Leg raises AMRAP' },
            { muscle: 'SHOULDERS', setTarget: 4, exerciseId: 'face_pull', reps: '15-20', supersetId: 'tokita_d4_ss3' },
            { muscle: 'ABS', setTarget: 4, exerciseId: 'leg_raise', reps: 'AMRAP', supersetId: 'tokita_d4_ss3' }
        ]
    }
];

export const TOKITA_NO_BARBELL_TEMPLATE: ProgramDay[] = [
    {
        id: 'tokita_nb_1',
        dayName: { en: 'Day 1: Upper', es: 'Día 1: Torso' },
        slots: [
            { muscle: 'CHEST', setTarget: 4, exerciseId: 'pushup', reps: '8-15', notes: 'Push-ups (4 sets of 8-15)' },
            // Superset 1: DB Shoulder Press + Weighted Chin-ups
            { muscle: 'SHOULDERS', setTarget: 4, exerciseId: 'ohp_db', reps: '8-12', supersetId: 'tokita_nb_d1_ss1', notes: 'DB press (4x8-12) + Weighted chin-ups (4x3-6)' },
            { muscle: 'BACK', setTarget: 4, exerciseId: 'chinup', reps: '3-6', supersetId: 'tokita_nb_d1_ss1' },
            // Giant Set 1: Curls + Knee Raises + Face Pulls
            { muscle: 'BICEPS', setTarget: 4, exerciseId: 'curl_db', reps: '8-12', supersetId: 'tokita_nb_d1_ss2', notes: 'Curls (4x8-12) + Hanging knee raises AMRAP + Face pulls (4x15-20)' },
            { muscle: 'ABS', setTarget: 4, exerciseId: 'knee_raise', reps: 'AMRAP', supersetId: 'tokita_nb_d1_ss2' },
            { muscle: 'SHOULDERS', setTarget: 4, exerciseId: 'face_pull', reps: '15-20', supersetId: 'tokita_nb_d1_ss2' },
            // Giant Set 2: Pushups + Lateral Raises + Calves
            { muscle: 'CHEST', setTarget: 4, exerciseId: 'pushup', reps: 'AMRAP', supersetId: 'tokita_nb_d1_ss3', notes: 'Push-ups AMRAP + Lateral raises (4x8-12) + Calf raises AMRAP' },
            { muscle: 'SHOULDERS', setTarget: 4, exerciseId: 'lat_raise', reps: '8-12', supersetId: 'tokita_nb_d1_ss3' },
            { muscle: 'CALVES', setTarget: 4, exerciseId: 'calf_raise', reps: 'AMRAP', supersetId: 'tokita_nb_d1_ss3' }
        ]
    },
    {
        id: 'tokita_nb_2',
        dayName: { en: 'Day 2: Lower', es: 'Día 2: Pierna' },
        slots: [
            { muscle: 'HAMSTRINGS', setTarget: 3, exerciseId: 'good_morning', reps: '6-12', notes: 'Band good mornings (3 sets of 6-12)' },
            // Superset 1: Lunges + Pullups
            { muscle: 'QUADS', setTarget: 4, exerciseId: 'lunges', reps: '10-15', supersetId: 'tokita_nb_d2_ss1', notes: 'Lunges (or HIIT cardio, 4x10-15) + Pull-ups (bodyweight only) AMRAP' },
            { muscle: 'BACK', setTarget: 4, exerciseId: 'pullup', reps: 'AMRAP', supersetId: 'tokita_nb_d2_ss1' },
            // Giant Set: Finger Curls + Leg Raises + Calves
            { muscle: 'FOREARMS', setTarget: 4, exerciseId: 'finger_curl', reps: '8-12', supersetId: 'tokita_nb_d2_ss2', notes: 'Finger curls (4x8-12) + Hanging leg raises AMRAP + Calf raises AMRAP' },
            { muscle: 'ABS', setTarget: 4, exerciseId: 'leg_raise', reps: 'AMRAP', supersetId: 'tokita_nb_d2_ss2' },
            { muscle: 'CALVES', setTarget: 4, exerciseId: 'calf_raise', reps: 'AMRAP', supersetId: 'tokita_nb_d2_ss2' }
        ]
    },
    {
        id: 'tokita_nb_3',
        dayName: { en: 'Day 3: Upper', es: 'Día 3: Torso' },
        slots: [
            { muscle: 'SHOULDERS', setTarget: 4, exerciseId: 'ohp_db', reps: '6-10', notes: 'Standing DB OHP OR Banded OHP (4 sets of 6-10)' },
            // Superset 1: Pushups + Face Pulls
            { muscle: 'CHEST', setTarget: 4, exerciseId: 'pushup', reps: '8-15', supersetId: 'tokita_nb_d3_ss1', notes: 'Push-ups (4x8-15) + Face pulls (4x15-20)' },
            { muscle: 'SHOULDERS', setTarget: 4, exerciseId: 'face_pull', reps: '15-20', supersetId: 'tokita_nb_d3_ss1' },
            // Giant Set: Preacher + Rear Delt + Calves
            { muscle: 'BICEPS', setTarget: 4, exerciseId: 'curl_preacher', reps: '6-10', supersetId: 'tokita_nb_d3_ss2', notes: 'Preacher curls (4x6-10) + Bent over lateral raises (4x8-12) + Calf raises AMRAP' },
            { muscle: 'SHOULDERS', setTarget: 4, exerciseId: 'rear_delt_fly', reps: '8-12', supersetId: 'tokita_nb_d3_ss2' },
            { muscle: 'CALVES', setTarget: 4, exerciseId: 'calf_raise', reps: 'AMRAP', supersetId: 'tokita_nb_d3_ss2' }
        ]
    },
    {
        id: 'tokita_nb_4',
        dayName: { en: 'Day 4: Full Body', es: 'Día 4: Cuerpo Completo' },
        slots: [
            // Superset 1: Reverse Lunges + Standing Chest Flies
            { muscle: 'QUADS', setTarget: 4, exerciseId: 'lunge_reverse', reps: '10-15', supersetId: 'tokita_nb_d4_ss1', notes: 'Reverse lunges (or HIIT cardio, 4x10-15) + Standing chest flies (4x10-15)' },
            { muscle: 'CHEST', setTarget: 4, exerciseId: 'pec_fly', reps: '10-15', supersetId: 'tokita_nb_d4_ss1' },
            // Superset 2: Weighted Pullups + Pushups
            { muscle: 'BACK', setTarget: 4, exerciseId: 'pullup', reps: '3-6', supersetId: 'tokita_nb_d4_ss2', notes: 'Weighted pull-ups (4x3-6) + Push-ups AMRAP' },
            { muscle: 'CHEST', setTarget: 4, exerciseId: 'pushup', reps: 'AMRAP', supersetId: 'tokita_nb_d4_ss2' },
            // Giant Set: Triceps + Face Pulls + Leg Raises
            { muscle: 'TRICEPS', setTarget: 4, exerciseId: 'tri_ext', reps: '8-12', supersetId: 'tokita_nb_d4_ss3', notes: 'Triceps extensions (4x8-12) + Face-pulls (4x15-20) + Leg raises AMRAP' },
            { muscle: 'SHOULDERS', setTarget: 4, exerciseId: 'face_pull', reps: '15-20', supersetId: 'tokita_nb_d4_ss3' },
            { muscle: 'ABS', setTarget: 4, exerciseId: 'leg_raise', reps: 'AMRAP', supersetId: 'tokita_nb_d4_ss3' }
        ]
    }
];

export const JACKED_IN_3_TEMPLATE: ProgramDay[] = [
    {
      id: 'ji3_ub1',
      dayName: { en: 'Upper Body 1', es: 'Tren Superior 1' },
      notes: 'Jalón vertical + Press horizontal. Bíceps y tríceps al final con reps altas.',
      slots: [
        { muscle: 'CHEST', exerciseId: 'bp_bar', setTarget: 4, reps: '6-8', notes: 'Press (Banco / Inclinado / Smith) — Rampa progresiva. Las últimas 1-2 series deben sentirse pesadas.' },
        { muscle: 'CHEST', exerciseId: 'cable_crossover', setTarget: 2, reps: '10-12', notes: 'Aislamiento Pecho (Cruces / Fly)' },
        { muscle: 'BACK', exerciseId: 'lat_pull', setTarget: 4, reps: '6-8', notes: 'Jalón Vertical / Pull-ups / Straight-arm pulldown — Mantén repeticiones limpias y sube la carga sólo si completas todo el rango.' },
        { muscle: 'SHOULDERS', exerciseId: 'rear_delt_fly', setTarget: 2, reps: '10-12', notes: 'Rear Delt (Fly invertido / Face pull)' },
        { muscle: 'BICEPS', exerciseId: 'curl_preacher', setTarget: 2, reps: '20', notes: 'Curl (Barra / Mancuerna / Predicador) — 2x20' },
        { muscle: 'TRICEPS', exerciseId: 'tri_push', setTarget: 2, reps: '20', notes: 'Tríceps (Pushdown / Extensión overhead / PJR) — 2x20' },
      ]
    },
    {
      id: 'ji3_lb1',
      dayName: { en: 'Lower Body 1', es: 'Tren Inferior 1' },
      notes: 'Leg Press AVT primero, luego Sentadilla conservadora con peso máximo cómodo.',
      slots: [
        { muscle: 'QUADS', exerciseId: 'leg_press', setTarget: 3, reps: '10-12', notes: 'Leg Press — Volumen base del día. Busca una subida de carga gradual.' },
        { muscle: 'QUADS', exerciseId: 'sq_bar', setTarget: 2, reps: '6-8', notes: 'Sentadilla (Back / Front / Hack) — Peso conservador post leg press. Enfócate en 1-2 sets de calidad.' },
        { muscle: 'QUADS', exerciseId: 'leg_ext', setTarget: 2, reps: '15-20', notes: 'Extensión de cuádriceps' },
        { muscle: 'BICEPS', exerciseId: 'curl_db', setTarget: 2, reps: '20', notes: 'Curl — 2x20' },
        { muscle: 'TRICEPS', exerciseId: 'tri_ext', setTarget: 2, reps: '20', notes: 'Tríceps — 2x20' },
      ]
    },
    {
      id: 'ji3_ub2',
      dayName: { en: 'Upper Body 2', es: 'Tren Superior 2' },
      notes: 'Jalón horizontal (remo) + Press. Trapecios en lugar de rear delts.',
      slots: [
        { muscle: 'CHEST', exerciseId: 'bp_inc', setTarget: 4, reps: '6-8', notes: 'Press (Banco / Hombro / Smith) — Rampa agresiva pero controlada. Deja 1 rep en reserva en la última serie dura.' },
        { muscle: 'SHOULDERS', exerciseId: 'lat_raise_cable', setTarget: 2, reps: '10-12', notes: 'Aislamiento Hombro/Pecho (Lateral raise / Fly)' },
        { muscle: 'BACK', exerciseId: 'tbar_row_chest_supported', setTarget: 4, reps: '6-8', notes: 'Remo Horizontal (T-bar / Mancuerna / Cable) — Empieza más liviano y termina pesado sin perder control escapular.' },
        { muscle: 'TRAPS', exerciseId: 'shrug_db', setTarget: 2, reps: '10-12', notes: 'Encogimientos (Mancuerna / Barra / Meadows)' },
        { muscle: 'BICEPS', exerciseId: 'curl_ez', setTarget: 2, reps: '20', notes: 'Curl — 2x20' },
        { muscle: 'TRICEPS', exerciseId: 'rope_pressdown', setTarget: 2, reps: '20', notes: 'Tríceps — 2x20' },
      ]
    },
    {
      id: 'ji3_lb2',
      dayName: { en: 'Lower Body 2', es: 'Tren Inferior 2' },
      notes: 'Unilateral primero (split squat o leg press sumo). Peso muerto al final.',
      slots: [
        { muscle: 'GLUTES', exerciseId: 'bulgarian_split_squat', setTarget: 4, reps: '10-12', notes: 'Split Squat / Búlgaro / Leg Press Sumo unilateral — Por pierna. Enfócate en control y en cargar duro las últimas series.' },
        { muscle: 'HAMSTRINGS', exerciseId: 'rdl', setTarget: 2, reps: '6-8', notes: 'Peso Muerto (Convencional / Sumo / RDL) — 1-2 top sets conservadores.' },
        { muscle: 'HAMSTRINGS', exerciseId: 'lying_curl', setTarget: 2, reps: '10-12', notes: 'Curl femoral acostado' },
        { muscle: 'BICEPS', exerciseId: 'curl_cable', setTarget: 2, reps: '20', notes: 'Curl — 2x20' },
        { muscle: 'TRICEPS', exerciseId: 'skull_crusher', setTarget: 2, reps: '20', notes: 'Tríceps — 2x20' },
      ]
    }
];

export const CAL_BEGINNER_TEMPLATE: ProgramDay[] = [
    {
        id: 'cal_beg_1',
        dayName: { en: 'Push Day', es: 'Día Empuje' },
        slots: [
            { muscle: 'CHEST' as MuscleGroup, exerciseId: 'cal_pu_std', setTarget: 4, reps: '8-12' },
            { muscle: 'SHOULDERS' as MuscleGroup, exerciseId: 'cal_pike_pu', setTarget: 3, reps: '8-12' },
            { muscle: 'TRICEPS' as MuscleGroup, exerciseId: 'cal_diamond_pu', setTarget: 3, reps: '8-12' },
            { muscle: 'CHEST' as MuscleGroup, exerciseId: 'cal_dip_std', setTarget: 3, reps: '8-12' },
        ]
    },
    {
        id: 'cal_beg_2',
        dayName: { en: 'Pull Day', es: 'Día Tracción' },
        slots: [
            { muscle: 'BACK' as MuscleGroup, exerciseId: 'cal_scap_pull', setTarget: 3, reps: '10-15' },
            { muscle: 'BACK' as MuscleGroup, exerciseId: 'cal_au_pullup', setTarget: 4, reps: '8-15' },
            { muscle: 'BACK' as MuscleGroup, exerciseId: 'cal_neg_pullup', setTarget: 3, reps: '5-8' },
            { muscle: 'BICEPS' as MuscleGroup, exerciseId: 'cal_chinup', setTarget: 3, reps: '6-10' },
        ]
    },
    {
        id: 'cal_beg_3',
        dayName: { en: 'Legs & Core', es: 'Piernas y Core' },
        slots: [
            { muscle: 'QUADS' as MuscleGroup, exerciseId: 'cal_squat_bw', setTarget: 4, reps: '15-20' },
            { muscle: 'QUADS' as MuscleGroup, exerciseId: 'cal_bulgariansq', setTarget: 3, reps: '10-15' },
            { muscle: 'HAMSTRINGS' as MuscleGroup, exerciseId: 'cal_nordic_curl', setTarget: 3, reps: '5-8' },
            { muscle: 'ABS' as MuscleGroup, exerciseId: 'cal_plank', setTarget: 4, reps: 'HOLD' },
            { muscle: 'ABS' as MuscleGroup, exerciseId: 'cal_hanging_lraise', setTarget: 3, reps: '8-12' },
        ]
    }
];

export const CAL_SKILL_MASTERY_TEMPLATE: ProgramDay[] = [
    {
        id: 'cal_skill_1',
        dayName: { en: 'Planche + Push', es: 'Planche + Empuje' },
        slots: [
            { muscle: 'SHOULDERS' as MuscleGroup, exerciseId: 'cal_planche_lean', setTarget: 5, reps: 'HOLD' },
            { muscle: 'SHOULDERS' as MuscleGroup, exerciseId: 'cal_tuck_planche', setTarget: 4, reps: 'HOLD' },
            { muscle: 'CHEST' as MuscleGroup, exerciseId: 'cal_pu_std', setTarget: 3, reps: '8-12' },
            { muscle: 'TRICEPS' as MuscleGroup, exerciseId: 'cal_dip_std', setTarget: 3, reps: '8-12' },
        ]
    },
    {
        id: 'cal_skill_2',
        dayName: { en: 'Front Lever + Pull', es: 'Front Lever + Tracción' },
        slots: [
            { muscle: 'BACK' as MuscleGroup, exerciseId: 'cal_scap_pull', setTarget: 4, reps: '10-15' },
            { muscle: 'BACK' as MuscleGroup, exerciseId: 'cal_tuck_fl', setTarget: 5, reps: 'HOLD' },
            { muscle: 'BACK' as MuscleGroup, exerciseId: 'cal_pullup', setTarget: 4, reps: '6-10' },
            { muscle: 'BICEPS' as MuscleGroup, exerciseId: 'cal_l_pullup', setTarget: 3, reps: '5-8' },
        ]
    },
    {
        id: 'cal_skill_3',
        dayName: { en: 'L-Sit + Core', es: 'L-Sit + Core' },
        slots: [
            { muscle: 'ABS' as MuscleGroup, exerciseId: 'cal_tuck_lsit', setTarget: 5, reps: 'HOLD' },
            { muscle: 'ABS' as MuscleGroup, exerciseId: 'cal_lsit', setTarget: 3, reps: 'HOLD' },
            { muscle: 'ABS' as MuscleGroup, exerciseId: 'cal_dragon_flag', setTarget: 3, reps: '5-8' },
            { muscle: 'ABS' as MuscleGroup, exerciseId: 'cal_hanging_lraise', setTarget: 3, reps: '10-15' },
        ]
    },
    {
        id: 'cal_skill_4',
        dayName: { en: 'Handstand + Legs', es: 'Pino + Piernas' },
        slots: [
            { muscle: 'SHOULDERS' as MuscleGroup, exerciseId: 'cal_wall_hs', setTarget: 5, reps: 'HOLD' },
            { muscle: 'SHOULDERS' as MuscleGroup, exerciseId: 'cf_hspu', setTarget: 3, reps: '5-8' },
            { muscle: 'QUADS' as MuscleGroup, exerciseId: 'cal_pistol', setTarget: 4, reps: '5-8' },
            { muscle: 'HAMSTRINGS' as MuscleGroup, exerciseId: 'cal_nordic_curl', setTarget: 3, reps: '5-8' },
        ]
    }
];

export const CAL_STREET_WORKOUT_TEMPLATE: ProgramDay[] = [
    {
        id: 'cal_sw_1',
        dayName: { en: 'Power Day A', es: 'Día Potencia A' },
        slots: [
            { muscle: 'BACK' as MuscleGroup, exerciseId: 'cal_pullup', setTarget: 5, reps: '5-8' },
            { muscle: 'CHEST' as MuscleGroup, exerciseId: 'cal_pu_std', setTarget: 5, reps: '8-12' },
            { muscle: 'BACK' as MuscleGroup, exerciseId: 'cal_comm_pullup', setTarget: 3, reps: '6-10' },
            { muscle: 'CHEST' as MuscleGroup, exerciseId: 'cal_archer_pu', setTarget: 3, reps: '6-10' },
            { muscle: 'ABS' as MuscleGroup, exerciseId: 'cal_hanging_lraise', setTarget: 3, reps: '10-15' },
        ]
    },
    {
        id: 'cal_sw_2',
        dayName: { en: 'Skill Day B', es: 'Día Habilidad B' },
        slots: [
            { muscle: 'BACK' as MuscleGroup, exerciseId: 'cal_tuck_fl', setTarget: 4, reps: 'HOLD' },
            { muscle: 'SHOULDERS' as MuscleGroup, exerciseId: 'cal_planche_lean', setTarget: 4, reps: 'HOLD' },
            { muscle: 'BACK' as MuscleGroup, exerciseId: 'cal_chinup', setTarget: 4, reps: '8-12' },
            { muscle: 'TRICEPS' as MuscleGroup, exerciseId: 'cal_dip_std', setTarget: 4, reps: '8-12' },
            { muscle: 'ABS' as MuscleGroup, exerciseId: 'cal_tuck_lsit', setTarget: 4, reps: 'HOLD' },
        ]
    },
    {
        id: 'cal_sw_3',
        dayName: { en: 'Volume Day C', es: 'Día Volumen C' },
        slots: [
            { muscle: 'BACK' as MuscleGroup, exerciseId: 'cal_wide_grip_pu', setTarget: 4, reps: '8-12' },
            { muscle: 'CHEST' as MuscleGroup, exerciseId: 'cal_diamond_pu', setTarget: 4, reps: '10-15' },
            { muscle: 'BACK' as MuscleGroup, exerciseId: 'cal_au_pullup', setTarget: 3, reps: '10-15' },
            { muscle: 'QUADS' as MuscleGroup, exerciseId: 'cal_squat_bw', setTarget: 3, reps: '20-25' },
            { muscle: 'ABS' as MuscleGroup, exerciseId: 'cal_dragon_flag', setTarget: 3, reps: '5-8' },
        ]
    }
];

export const INITIAL_TEMPLATES: GlobalTemplate[] = [
    ...NATURAL_HYPERTROPHY_TEMPLATES,
    { id: 'ji3', name: 'jacked_in_3', title: { en: "Jacked in 3 — Paul Carter", es: "Jacked in 3 — Paul Carter" }, description: { en: "4-day upper/lower split with heavy compound ramps and high-rep arm finishers.", es: "Rutina torso/pierna de 4 días con rampas pesadas en compuestos y finalizadores de brazos en reps altas." }, isPro: true, program: JACKED_IN_3_TEMPLATE, order: 0 },
    {
        id: 'tokita',
        name: 'tokita',
        title: { en: "Tokita Ohma Program", es: "Programa Tokita Ohma" },
        description: { en: "Natural Hypertrophy - 4-Day Hybrid Split (Upper / Lower / Upper / Full Body) with supersets & giant sets.", es: "Natural Hypertrophy - Rutina Híbrida de 4 Días (Torso / Pierna / Torso / Cuerpo Completo) con superseries y series gigantes." },
        isPro: false,
        program: TOKITA_TEMPLATE,
        defaultStageId: 'barbell',
        stages: [
            {
                id: 'barbell',
                label: { en: 'Stage 1 · Barbell', es: 'Stage 1 · Con Barra' },
                subtitle: { en: '4 Days · Standard Barbell & DB', es: '4 Días · Barra y Mancuernas' },
                program: TOKITA_TEMPLATE,
            },
            {
                id: 'no_barbell',
                label: { en: 'Stage 2 · No Barbell', es: 'Stage 2 · Sin Barra' },
                subtitle: { en: '4 Days · Bodyweight, DB & Bands', es: '4 Días · Peso Corporal y Mancuernas' },
                program: TOKITA_NO_BARBELL_TEMPLATE,
            },
        ],
        order: 2,
        guidelineImages: Array.from({length: 8}, (_, i) => 
            `${ASSETS_BASE}/assets/templates/tokita/Tokita${i === 0 ? '' : `-${i+1}`}.png`
        )
    },
    { id: 'full_body', name: 'full_body', title: { en: "Aesthetic V-Taper", es: "Aesthetic V-Taper" }, description: { en: "Dr. Mike Style. Focus on V-Taper (Lats/Side Delts).", es: "Estilo Dr. Mike. Foco en V-Taper (Dorsal/Hombro Lateral)." }, isPro: true, program: FULL_BODY_TEMPLATE, order: 4, guidelineImages: RP_GUIDELINE_IMAGES },
    // ── CALISTHENICS TEMPLATES ─────────────────────────────────────────────────
    {
        id: 'cal_beginner',
        name: 'cal_beginner',
        title: { en: '🤸 Calisthenics Beginner', es: '🤸 Calistenia Principiante' },
        description: { en: '3-Day Push/Pull/Legs bodyweight program. No equipment needed.', es: '3 Días Empuje/Tracción/Piernas con peso corporal. Sin equipo.' },
        isPro: false,
        order: 10,
        program: CAL_BEGINNER_TEMPLATE
    },
    {
        id: 'cal_skill_mastery',
        name: 'cal_skill_mastery',
        title: { en: '🎯 Skill Mastery', es: '🎯 Dominio de Habilidades' },
        description: { en: '4-Day skill-focused calisthenics. Planche, Front Lever, L-Sit, Handstand.', es: '4 Días de calistenia enfocada en habilidades. Planche, Front Lever, L-Sit, Pino.' },
        isPro: false,
        order: 11,
        program: CAL_SKILL_MASTERY_TEMPLATE
    },
    {
        id: 'cal_street_workout',
        name: 'cal_street_workout',
        title: { en: '🏙️ Street Workout', es: '🏙️ Street Workout' },
        description: { en: '3-Day full-body calisthenics. Push + Pull every session, explosive & conditioning.', es: '3 Días de calistenia full body. Empuje + Tracción cada sesión, explosivo y acondicionamiento.' },
        isPro: false,
        order: 12,
        program: CAL_STREET_WORKOUT_TEMPLATE
    },
    GOLDEN_SIX_REVISITED_TEMPLATE,
    DAVID_SHAUGHNESSY_SILVERBACK_TEMPLATE,
    ...RP_ALL_TEMPLATES,
];
