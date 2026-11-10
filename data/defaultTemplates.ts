import { ProgramDay, GlobalTemplate, MuscleGroup } from '../types';
import { NATURAL_HYPERTROPHY_TEMPLATES } from './naturalHypertrophy';
import { GOLDEN_SIX_REVISITED_TEMPLATE } from './goldenSixRevisited';
import { RP_ALL_TEMPLATES, RP_GUIDELINE_IMAGES } from './rpTemplates';
import { DAVID_SHAUGHNESSY_SILVERBACK_TEMPLATE } from './davidShaughnessy';

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

export const DEFAULT_TEMPLATE: ProgramDay[] = [
    {
        id: 'd_push',
        dayName: { en: 'Push (Chest/Shoulders/Tri)', es: 'Empuje (Pecho/Hombro/Tri)' },
        slots: [
            { muscle: 'CHEST', setTarget: 3, exerciseId: 'bp_flat' },
            { muscle: 'SHOULDERS', setTarget: 3, exerciseId: 'ohp' },
            { muscle: 'CHEST', setTarget: 3, exerciseId: 'bp_inc' },
            { muscle: 'SHOULDERS', setTarget: 3, exerciseId: 'lat_raise' },
            { muscle: 'TRICEPS', setTarget: 3, exerciseId: 'tri_push' }
        ]
    },
    {
        id: 'd_pull',
        dayName: { en: 'Pull (Back/Biceps)', es: 'Tracción (Espalda/Biceps)' },
        slots: [
            { muscle: 'BACK', setTarget: 3, exerciseId: 'lat_pull' },
            { muscle: 'BACK', setTarget: 3, exerciseId: 'row_cable' },
            { muscle: 'BACK', setTarget: 3, exerciseId: 'pullup' },
            { muscle: 'BICEPS', setTarget: 3, exerciseId: 'curl_ez' },
            { muscle: 'BICEPS', setTarget: 3, exerciseId: 'curl_db' }
        ]
    },
    {
        id: 'd_legs',
        dayName: { en: 'Legs', es: 'Pierna' },
        slots: [
            { muscle: 'QUADS', setTarget: 3, exerciseId: 'sq_hack' },
            { muscle: 'HAMSTRINGS', setTarget: 3, exerciseId: 'rdl' },
            { muscle: 'QUADS', setTarget: 3, exerciseId: 'leg_ext' },
            { muscle: 'HAMSTRINGS', setTarget: 3, exerciseId: 'leg_curl' },
            { muscle: 'CALVES', setTarget: 4, exerciseId: 'calf_raise' }
        ]
    }
];

export const UPPER_LOWER_TEMPLATE: ProgramDay[] = [
    {
        id: 'ul_1',
        dayName: { en: 'Upper Power', es: 'Torso Fuerza' },
        slots: [
            { muscle: 'CHEST', setTarget: 4, exerciseId: 'bp_bar' },
            { muscle: 'BACK', setTarget: 4, exerciseId: 'row_mach' },
            { muscle: 'SHOULDERS', setTarget: 3, exerciseId: 'ohp' },
            { muscle: 'BICEPS', setTarget: 3, exerciseId: 'curl_bar' },
            { muscle: 'TRICEPS', setTarget: 3, exerciseId: 'skull_crusher' }
        ]
    },
    {
        id: 'ul_2',
        dayName: { en: 'Lower Power', es: 'Pierna Fuerza' },
        slots: [
            { muscle: 'QUADS', setTarget: 4, exerciseId: 'sq_hack' },
            { muscle: 'HAMSTRINGS', setTarget: 4, exerciseId: 'rdl' },
            { muscle: 'CALVES', setTarget: 4, exerciseId: 'calf_raise' },
            { muscle: 'ABS', setTarget: 3, exerciseId: 'abs_cable' }
        ]
    },
    {
        id: 'ul_3',
        dayName: { en: 'Upper Hypertrophy', es: 'Torso Hipertrofia' },
        slots: [
            { muscle: 'CHEST', setTarget: 3, exerciseId: 'bp_inc_wide' },
            { muscle: 'BACK', setTarget: 3, exerciseId: 'lat_pull' },
            { muscle: 'SHOULDERS', setTarget: 4, exerciseId: 'lat_raise' },
            { muscle: 'CHEST', setTarget: 3, exerciseId: 'pec_fly' },
            { muscle: 'TRICEPS', setTarget: 3, exerciseId: 'tri_push' }
        ]
    },
    {
        id: 'ul_4',
        dayName: { en: 'Lower Hypertrophy', es: 'Pierna Hipertrofia' },
        slots: [
            { muscle: 'QUADS', setTarget: 4, exerciseId: 'leg_press' },
            { muscle: 'HAMSTRINGS', setTarget: 4, exerciseId: 'leg_curl' },
            { muscle: 'QUADS', setTarget: 3, exerciseId: 'leg_ext' },
            { muscle: 'CALVES', setTarget: 4, exerciseId: 'calf_raise' }
        ]
    }
];

export const RESENS_TEMPLATE: ProgramDay[] = [
    {
        id: 'res_1',
        dayName: { en: 'Full Body A (Low Vol)', es: 'Cuerpo Completo A (Bajo Vol)' },
        slots: [
            { muscle: 'QUADS', setTarget: 2, exerciseId: 'leg_press' },
            { muscle: 'CHEST', setTarget: 2, exerciseId: 'bp_flat' },
            { muscle: 'BACK', setTarget: 2, exerciseId: 'row_mach' },
            { muscle: 'SHOULDERS', setTarget: 2, exerciseId: 'lat_raise' },
            { muscle: 'BICEPS', setTarget: 2, exerciseId: 'curl_ez' }
        ]
    },
    {
        id: 'res_2',
        dayName: { en: 'Full Body B (Low Vol)', es: 'Cuerpo Completo B (Bajo Vol)' },
        slots: [
            { muscle: 'HAMSTRINGS', setTarget: 2, exerciseId: 'rdl' },
            { muscle: 'CHEST', setTarget: 2, exerciseId: 'bp_inc' },
            { muscle: 'BACK', setTarget: 2, exerciseId: 'lat_pull' },
            { muscle: 'TRICEPS', setTarget: 2, exerciseId: 'tri_push' },
            { muscle: 'ABS', setTarget: 2, exerciseId: 'abs_cable' }
        ]
    }
];

export const METABOLITE_TEMPLATE: ProgramDay[] = [
    {
        id: 'meta_1',
        dayName: { en: 'Metabolite Upper', es: 'Metabolitos Torso' },
        slots: [
            { muscle: 'CHEST', setTarget: 4, exerciseId: 'pec_fly', reps: "20-30" },
            { muscle: 'BACK', setTarget: 4, exerciseId: 'row_cable', reps: "20-30" },
            { muscle: 'SHOULDERS', setTarget: 4, exerciseId: 'lat_raise_cable', reps: "20-30" },
            { muscle: 'BICEPS', setTarget: 4, exerciseId: 'curl_cable', reps: "20-30" },
            { muscle: 'TRICEPS', setTarget: 4, exerciseId: 'tri_push', reps: "20-30" }
        ]
    },
    {
        id: 'meta_2',
        dayName: { en: 'Metabolite Lower', es: 'Metabolitos Pierna' },
        slots: [
            { muscle: 'QUADS', setTarget: 4, exerciseId: 'leg_ext', reps: "20-30" },
            { muscle: 'HAMSTRINGS', setTarget: 4, exerciseId: 'leg_curl', reps: "20-30" },
            { muscle: 'CALVES', setTarget: 5, exerciseId: 'calf_raise', reps: "20-30" },
            { muscle: 'ABS', setTarget: 4, exerciseId: 'abs_cable', reps: "20-30" }
        ]
    },
     {
        id: 'meta_3',
        dayName: { en: 'Metabolite Pump', es: 'Bombeo Torso' },
        slots: [
            { muscle: 'CHEST', setTarget: 4, exerciseId: 'bp_inc_wide', reps: "15-20" },
            { muscle: 'BACK', setTarget: 4, exerciseId: 'lat_prayer', reps: "15-20" },
            { muscle: 'SHOULDERS', setTarget: 4, exerciseId: 'face_pull', reps: "15-20" },
            { muscle: 'FOREARMS', setTarget: 4, exerciseId: 'wrist_curl', reps: "20-30" }
        ]
    }
];

export const FULL_BODY_TEMPLATE: ProgramDay[] = [
    {
        id: 'vt_1',
        dayName: { en: 'Day 1: Back Width & Upper Chest', es: 'Día 1: Espalda Ancho y Pecho Sup.' },
        slots: [
            { muscle: 'BACK', setTarget: 3, exerciseId: 'pullup' }, // Pull-ups
            { muscle: 'BACK', setTarget: 3, exerciseId: 'lat_pull' }, // Lat Pulldown
            { muscle: 'CHEST', setTarget: 3, exerciseId: 'bp_inc_bar' }, // Incline BB
            { muscle: 'CHEST', setTarget: 3, exerciseId: 'bp_inc' }, // Incline DB
            { muscle: 'QUADS', setTarget: 2, exerciseId: 'leg_press' } // Maintenance Legs
        ]
    },
    {
        id: 'vt_2',
        dayName: { en: 'Day 2: Arms & Delts (Triceps Focus)', es: 'Día 2: Brazos y Hombros (Tríceps)' },
        slots: [
            { muscle: 'TRICEPS', setTarget: 3, exerciseId: 'skull_crusher' },
            { muscle: 'TRICEPS', setTarget: 3, exerciseId: 'tri_ext' }, // Overhead
            { muscle: 'SHOULDERS', setTarget: 3, exerciseId: 'lat_raise' }, // DB
            { muscle: 'SHOULDERS', setTarget: 3, exerciseId: 'lat_raise_cable' }, // Cable
            { muscle: 'BICEPS', setTarget: 4, exerciseId: 'curl_bar' }, // Barbell Curl (Myo)
            { muscle: 'FOREARMS', setTarget: 3, exerciseId: 'wrist_curl', reps: "50-60" } // Marathon
        ]
    },
    {
        id: 'vt_3',
        dayName: { en: 'Day 3: Chest & Back (Chest Focus)', es: 'Día 3: Pecho y Espalda (Pecho)' },
        slots: [
            { muscle: 'CHEST', setTarget: 3, exerciseId: 'bp_inc_wide' }, // Wide Grip
            { muscle: 'CHEST', setTarget: 3, exerciseId: 'bp_mach_inc' }, // Machine Incline
            { muscle: 'BACK', setTarget: 3, exerciseId: 'lat_pull_supine' }, // Supine
            { muscle: 'BACK', setTarget: 3, exerciseId: 'lat_prayer' }, // Pullover
            { muscle: 'QUADS', setTarget: 2, exerciseId: 'leg_ext' } // Maintenance Legs
        ]
    },
    {
        id: 'vt_4',
        dayName: { en: 'Day 4: Arms & Delts (Biceps Focus)', es: 'Día 4: Brazos y Hombros (Bíceps)' },
        slots: [
            { muscle: 'BICEPS', setTarget: 3, exerciseId: 'curl_ez' },
            { muscle: 'BICEPS', setTarget: 3, exerciseId: 'curl_cable', reps: "15-20" },
            { muscle: 'SHOULDERS', setTarget: 3, exerciseId: 'lat_raise_mach' },
            { muscle: 'SHOULDERS', setTarget: 3, exerciseId: 'lat_raise_seat' },
            { muscle: 'TRICEPS', setTarget: 3, exerciseId: 'jm_press', reps: "50-60" }, // Giant Set
            { muscle: 'FOREARMS', setTarget: 3, exerciseId: 'forearm_pushup' }
        ]
    }
];

export const WIZARD_TEMPLATE: ProgramDay[] = [
    {
        id: 'wiz_heavy',
        dayName: { en: 'Day 1: Heavy (5-8 Reps)', es: 'Día 1: Pesado (5-8 Reps)' },
        slots: [
            { muscle: 'CHEST', setTarget: 3, exerciseId: 'bp_bar', reps: '5-8' },
            { muscle: 'BACK', setTarget: 3, exerciseId: 'pullup', reps: '5-8' },
            { muscle: 'QUADS', setTarget: 3, exerciseId: 'sq_bar', reps: '5-8' },
            { muscle: 'HAMSTRINGS', setTarget: 3, exerciseId: 'sldl', reps: '5-8' },
            { muscle: 'SHOULDERS', setTarget: 3, exerciseId: 'ohp', reps: '5-8' },
            { muscle: 'BICEPS', setTarget: 3, exerciseId: 'curl_bar', reps: '5-8' },
            { muscle: 'TRICEPS', setTarget: 3, exerciseId: 'dips', reps: '5-8' }
        ]
    },
    {
        id: 'wiz_light',
        dayName: { en: 'Day 2: Light (12-15 Reps)', es: 'Día 2: Liviano (12-15 Reps)' },
        slots: [
            { muscle: 'CHEST', setTarget: 3, exerciseId: 'pec_fly', reps: '12-15' },
            { muscle: 'BACK', setTarget: 3, exerciseId: 'pullover_db', reps: '12-15' },
            { muscle: 'QUADS', setTarget: 3, exerciseId: 'leg_ext', reps: '12-15' },
            { muscle: 'HAMSTRINGS', setTarget: 3, exerciseId: 'leg_curl', reps: '12-15' },
            { muscle: 'SHOULDERS', setTarget: 3, exerciseId: 'lat_raise', reps: '12-15' },
            { muscle: 'BICEPS', setTarget: 3, exerciseId: 'curl_cable', reps: '12-15' },
            { muscle: 'TRICEPS', setTarget: 3, exerciseId: 'tri_push', reps: '12-15' }
        ]
    },
    {
        id: 'wiz_medium',
        dayName: { en: 'Day 3: Medium (8-12 Reps)', es: 'Día 3: Medio (8-12 Reps)' },
        slots: [
            { muscle: 'CHEST', setTarget: 3, exerciseId: 'bp_inc_bar', reps: '8-12' },
            { muscle: 'BACK', setTarget: 3, exerciseId: 'row_db', reps: '8-12' },
            { muscle: 'QUADS', setTarget: 3, exerciseId: 'leg_press', reps: '8-12' },
            { muscle: 'GLUTES', setTarget: 3, exerciseId: 'glute_bridge', reps: '8-12' },
            { muscle: 'SHOULDERS', setTarget: 3, exerciseId: 'ohp_db', reps: '8-12' },
            { muscle: 'BICEPS', setTarget: 3, exerciseId: 'curl_ez', reps: '8-12' },
            { muscle: 'TRICEPS', setTarget: 3, exerciseId: 'tri_ext', reps: '8-12' }
        ]
    }
];

export const MALE_PHYSIQUE_TEMPLATE: ProgramDay[] = [
    {
        id: 'mp_1',
        dayName: { en: 'Upper A (Chest Focus)', es: 'Torso A (Foco Pecho)' },
        slots: [
            { muscle: 'CHEST', setTarget: 3, exerciseId: 'bp_bar', reps: "6-10" },
            { muscle: 'CHEST', setTarget: 3, exerciseId: 'bp_inc', reps: "8-12" },
            { muscle: 'TRICEPS', setTarget: 3, exerciseId: 'skull_crusher', reps: "10-15" },
            { muscle: 'BACK', setTarget: 3, exerciseId: 'pullup', reps: "AMRAP" },
            { muscle: 'BACK', setTarget: 3, exerciseId: 'row_cable', reps: "10-15" },
            { muscle: 'BICEPS', setTarget: 3, exerciseId: 'curl_ez', reps: "10-15" },
            { muscle: 'SHOULDERS', setTarget: 4, exerciseId: 'lat_raise', reps: "12-20" }
        ]
    },
    {
        id: 'mp_2',
        dayName: { en: 'Lower A (Quad Focus)', es: 'Pierna A (Foco Quads)' },
        slots: [
            { muscle: 'QUADS', setTarget: 3, exerciseId: 'sq_bar', reps: "6-10" },
            { muscle: 'QUADS', setTarget: 3, exerciseId: 'leg_press', reps: "10-15" },
            { muscle: 'GLUTES', setTarget: 3, exerciseId: 'glute_bridge', reps: "10-15" },
            { muscle: 'HAMSTRINGS', setTarget: 3, exerciseId: 'rdl', reps: "8-12" },
            { muscle: 'CALVES', setTarget: 4, exerciseId: 'calf_raise', reps: "12-20" }
        ]
    },
    {
        id: 'mp_3',
        dayName: { en: 'Upper B (Shoulder/Arm Focus)', es: 'Torso B (Foco Hombro/Brazo)' },
        slots: [
            { muscle: 'SHOULDERS', setTarget: 3, exerciseId: 'ohp', reps: "6-10" },
            { muscle: 'BICEPS', setTarget: 3, exerciseId: 'curl_bar', reps: "8-12" },
            { muscle: 'BICEPS', setTarget: 3, exerciseId: 'curl_cable', reps: "12-15" },
            { muscle: 'BACK', setTarget: 3, exerciseId: 'lat_pull', reps: "10-15" },
            { muscle: 'TRICEPS', setTarget: 3, exerciseId: 'tri_push', reps: "12-15" },
            { muscle: 'TRICEPS', setTarget: 3, exerciseId: 'tri_ext', reps: "12-15" },
            { muscle: 'CHEST', setTarget: 3, exerciseId: 'pec_fly', reps: "12-20" }
        ]
    },
    {
        id: 'mp_4',
        dayName: { en: 'Lower B (Hams/Glute Focus)', es: 'Pierna B (Foco Isquios/Glúteo)' },
        slots: [
            { muscle: 'HAMSTRINGS', setTarget: 3, exerciseId: 'leg_curl', reps: "10-15" },
            { muscle: 'HAMSTRINGS', setTarget: 3, exerciseId: 'sldl', reps: "8-12" },
            { muscle: 'GLUTES', setTarget: 3, exerciseId: 'glute_bridge', reps: "10-15" },
            { muscle: 'QUADS', setTarget: 3, exerciseId: 'leg_ext', reps: "12-20" },
            { muscle: 'CALVES', setTarget: 4, exerciseId: 'calf_raise', reps: "12-20" }
        ]
    }
];

export const TOJI_TEMPLATE: ProgramDay[] = [
    {
        id: 'toji_1',
        dayName: { en: 'Day 1: Heavy Press & Giant Sets', es: 'Día 1: Empuje Pesado & Series Gigantes' },
        slots: [
            { muscle: 'SHOULDERS', setTarget: 4, exerciseId: 'ohp', reps: "2-5" },
            // Giant Set 1: Arms & Back
            { muscle: 'BICEPS', setTarget: 4, exerciseId: 'curl_ez', reps: "6-10" },
            { muscle: 'TRICEPS', setTarget: 4, exerciseId: 'skull_crusher', reps: "8-12" },
            { muscle: 'BACK', setTarget: 4, exerciseId: 'pendlay_row', reps: "6-10" },
            // Superset: Side Delt & Traps
            { muscle: 'BACK', setTarget: 4, exerciseId: 'chinup', reps: "AMRAP" },
            { muscle: 'SHOULDERS', setTarget: 4, exerciseId: 'lat_raise', reps: "10-15" },
            { muscle: 'TRAPS', setTarget: 4, exerciseId: 'shrug_db', reps: "10-15" },
            // Finisher
            { muscle: 'CHEST', setTarget: 4, exerciseId: 'diamond_pushup', reps: "AMRAP" },
            { muscle: 'ABS', setTarget: 4, exerciseId: 'knee_raise', reps: "AMRAP" }
        ]
    },
    {
        id: 'toji_2',
        dayName: { en: 'Day 2: Squat & Neck/Calves', es: 'Día 2: Sentadilla, Cuello y Gemelo' },
        slots: [
            { muscle: 'QUADS', setTarget: 3, exerciseId: 'sq_bar', reps: "4-8" },
            { muscle: 'QUADS', setTarget: 3, exerciseId: 'leg_press', reps: "10-15" },
            // Superset Posterior
            { muscle: 'HAMSTRINGS', setTarget: 3, exerciseId: 'rdl', reps: "6-10" },
            { muscle: 'BACK', setTarget: 4, exerciseId: 'pullup', reps: "4-6" }, // Weighted
            // Finisher
            { muscle: 'NECK', setTarget: 4, exerciseId: 'neck_curl', reps: "15-20" },
            { muscle: 'CALVES', setTarget: 4, exerciseId: 'calf_raise', reps: "10-15" },
            { muscle: 'ABS', setTarget: 4, exerciseId: 'leg_raise', reps: "AMRAP" }
        ]
    },
    {
        id: 'toji_3',
        dayName: { en: 'Day 3: Bench & Upper Mass', es: 'Día 3: Banca y Masa Torso' },
        slots: [
            { muscle: 'CHEST', setTarget: 4, exerciseId: 'bp_flat', reps: "4-6" },
            // Giant Set
            { muscle: 'SHOULDERS', setTarget: 4, exerciseId: 'ohp_db', reps: "8-12" },
            { muscle: 'TRICEPS', setTarget: 4, exerciseId: 'db_tri_ext', reps: "10-15" },
            { muscle: 'BACK', setTarget: 4, exerciseId: 'row_db', reps: "8-12" },
            // Superset Detail
            { muscle: 'BICEPS', setTarget: 3, exerciseId: 'curl_hammer', reps: "8-12" },
            { muscle: 'SHOULDERS', setTarget: 3, exerciseId: 'rear_delt_fly', reps: "10-15" },
            { muscle: 'FOREARMS', setTarget: 3, exerciseId: 'wrist_curl', reps: "15-20" }
        ]
    },
    {
        id: 'toji_4',
        dayName: { en: 'Day 4: Deadlift & Traps', es: 'Día 4: Peso Muerto y Trapecios' },
        slots: [
            { muscle: 'BACK', setTarget: 2, exerciseId: 'deadlift', reps: "2-5" },
            // Superset
            { muscle: 'QUADS', setTarget: 3, exerciseId: 'sq_paused', reps: "4-8" },
            { muscle: 'BACK', setTarget: 3, exerciseId: 'pullup', reps: "AMRAP" },
            // Option A/B
            { muscle: 'BACK', setTarget: 3, exerciseId: 'rack_pull', reps: "8-12" },
            // Finisher
            { muscle: 'NECK', setTarget: 4, exerciseId: 'neck_ext', reps: "15-20" },
            { muscle: 'TRAPS', setTarget: 3, exerciseId: 'farmers_walk', reps: "30-60s" }
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
