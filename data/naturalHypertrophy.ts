import { GlobalTemplate, ProgramDay, ProgramStage } from '../types';

export const NH_ULT_BEGINNER: ProgramDay[] = [
    {
        id: 'd1', dayName: { en: 'Monday', es: 'Lunes' },
        slots: [
            { muscle: 'QUADS', setTarget: 2, reps: '6-8', exerciseId: 'sq_bar', supersetId: 'ss_beg_m_1', notes: 'Barbell Squats 2x6-8 + DB curls 2x8-10' },
            { muscle: 'BICEPS', setTarget: 2, reps: '8-10', exerciseId: 'curl_db', supersetId: 'ss_beg_m_1' },
            { muscle: 'CHEST', setTarget: 2, reps: '6-8', exerciseId: 'dips', supersetId: 'ss_beg_m_2', notes: 'Dips 2x6-8 + DB rows 2x10-12' },
            { muscle: 'BACK', setTarget: 2, reps: '10-12', exerciseId: 'row_db', supersetId: 'ss_beg_m_2' },
            { muscle: 'TRICEPS', setTarget: 3, reps: '10-15', exerciseId: 'rope_pressdown', supersetId: 'gs_beg_m_3', notes: 'Rope triceps extension 3x10-15 + Cable lateral raises 3x10-15 + Cannonball crunches 3x8-10' },
            { muscle: 'SHOULDERS', setTarget: 3, reps: '10-15', exerciseId: 'lat_raise_cable', supersetId: 'gs_beg_m_3' },
            { muscle: 'ABS', setTarget: 3, reps: '8-10', exerciseId: 'abs_cable', supersetId: 'gs_beg_m_3' }
        ]
    },
    {
        id: 'd2', dayName: { en: 'Wednesday', es: 'Miércoles' },
        slots: [
            { muscle: 'SHOULDERS', setTarget: 2, reps: '6-8', exerciseId: 'ohp', supersetId: 'ss_beg_w_1', notes: 'Barbell OHP 2x6-8 + Hammer curls 2x8-10' },
            { muscle: 'BICEPS', setTarget: 2, reps: '8-10', exerciseId: 'curl_hammer', supersetId: 'ss_beg_w_1' },
            { muscle: 'BACK', setTarget: 3, reps: '8-12', exerciseId: 'lat_pull', supersetId: 'ss_beg_w_2', notes: 'Neutral grip lat pulldowns 3x8-12 + Leg curls 3x12-15' },
            { muscle: 'HAMSTRINGS', setTarget: 3, reps: '12-15', exerciseId: 'leg_curl', supersetId: 'ss_beg_w_2' },
            { muscle: 'QUADS', setTarget: 3, reps: '10-15', exerciseId: 'leg_ext', supersetId: 'gs_beg_w_3', notes: 'Leg extensions 3x10-15 + Cable flies 3x12-15 + Neck curls 3x15-20' },
            { muscle: 'CHEST', setTarget: 3, reps: '12-15', exerciseId: 'cable_crossover', supersetId: 'gs_beg_w_3' },
            { muscle: 'NECK', setTarget: 3, reps: '15-20', exerciseId: 'neck_curl', supersetId: 'gs_beg_w_3' }
        ]
    },
    {
        id: 'd3', dayName: { en: 'Friday', es: 'Viernes' },
        slots: [
            { muscle: 'HAMSTRINGS', setTarget: 2, reps: '8-10', exerciseId: 'rdl', supersetId: 'ss_beg_f_1', notes: 'Romanian Deadlifts 2x8-10 + Seated calf raises 2x15-20' },
            { muscle: 'CALVES', setTarget: 2, reps: '15-20', exerciseId: 'calf_raise', supersetId: 'ss_beg_f_1' },
            { muscle: 'CHEST', setTarget: 3, reps: '10-12', exerciseId: 'pushup', supersetId: 'ss_beg_f_2', notes: 'Ring push-ups 3x10-12 + DB preacher curls 3x8-10' },
            { muscle: 'BICEPS', setTarget: 3, reps: '8-10', exerciseId: 'curl_preacher', supersetId: 'ss_beg_f_2' },
            { muscle: 'QUADS', setTarget: 2, reps: '8-10', exerciseId: 'leg_press', supersetId: 'gs_beg_f_3', notes: 'Leg press 2x8-10 + Skull-crushers 2x10-12 + Leg raises 2xAMRAP' },
            { muscle: 'TRICEPS', setTarget: 2, reps: '10-12', exerciseId: 'skull_crusher', supersetId: 'gs_beg_f_3' },
            { muscle: 'ABS', setTarget: 2, reps: 'AMRAP', exerciseId: 'leg_raise', supersetId: 'gs_beg_f_3' }
        ]
    }
];

export const NH_ULT_NOVICE: ProgramDay[] = [
    {
        id: 'd1', dayName: { en: 'Monday', es: 'Lunes' },
        slots: [
            { muscle: 'QUADS', setTarget: 3, reps: '4-8', exerciseId: 'sq_bar', supersetId: 'ss_nov_m_1', notes: 'Barbell Squats 3x4-8 OR Hack Squats 3x6-10 + EZ bar curls 3x6-8 OR DB curls 3x6-10' },
            { muscle: 'BICEPS', setTarget: 3, reps: '6-8', exerciseId: 'curl_ez', supersetId: 'ss_nov_m_1' },
            { muscle: 'CHEST', setTarget: 3, reps: '6-8', exerciseId: 'dips', supersetId: 'ss_nov_m_2', notes: 'Dips 3x6-8 OR Bench 3x6-8 + DB rows 3x8-12 OR Cable rows 3x10-15' },
            { muscle: 'BACK', setTarget: 3, reps: '8-12', exerciseId: 'row_db', supersetId: 'ss_nov_m_2' },
            { muscle: 'TRICEPS', setTarget: 3, reps: '10-15', exerciseId: 'rope_pressdown', supersetId: 'gs_nov_m_3', notes: 'Rope triceps extension 3x10-15 OR Katana extension 3x10-12 + Cable lateral raises 3x10-15 OR Powell raises 3x10-12 + Sit-ups 3x10-12 OR Cannonball crunches 3x8-10' },
            { muscle: 'SHOULDERS', setTarget: 3, reps: '10-15', exerciseId: 'lat_raise_cable', supersetId: 'gs_nov_m_3' },
            { muscle: 'ABS', setTarget: 3, reps: '10-12', exerciseId: 'sit_up', supersetId: 'gs_nov_m_3' }
        ]
    },
    {
        id: 'd2', dayName: { en: 'Wednesday', es: 'Miércoles' },
        slots: [
            { muscle: 'SHOULDERS', setTarget: 3, reps: '6-10', exerciseId: 'ohp', supersetId: 'ss_nov_w_1', notes: 'Barbell OHP 3x6-10 OR DB OHP 3x8-12 + Hammer curls 3x6-10 OR Reverse curls 3x6-12' },
            { muscle: 'BICEPS', setTarget: 3, reps: '6-10', exerciseId: 'curl_hammer', supersetId: 'ss_nov_w_1' },
            { muscle: 'BACK', setTarget: 3, reps: '4-6', exerciseId: 'neutral_chinup', supersetId: 'ss_nov_w_2', notes: 'Neutral-ups 3x4-6 OR Neutral grip lat pulldowns 3x8-12 + Leg curls 3x12-15 OR Hyperextensions 3x10-12' },
            { muscle: 'HAMSTRINGS', setTarget: 3, reps: '12-15', exerciseId: 'leg_curl', supersetId: 'ss_nov_w_2' },
            { muscle: 'QUADS', setTarget: 3, reps: '8-12', exerciseId: 'bulgarian_split_squat', supersetId: 'gs_nov_w_3', notes: 'Split squats 3x8-12 OR Leg extensions 3x10-15 + DB fly press 3x10-12 OR Cable flies 3x12-15 + Neck curls 3x15-20 OR Neck extensions 3x15-20' },
            { muscle: 'CHEST', setTarget: 3, reps: '10-12', exerciseId: 'db_fly', supersetId: 'gs_nov_w_3' },
            { muscle: 'NECK', setTarget: 3, reps: '15-20', exerciseId: 'neck_curl', supersetId: 'gs_nov_w_3' }
        ]
    },
    {
        id: 'd3', dayName: { en: 'Friday', es: 'Viernes' },
        slots: [
            { muscle: 'HAMSTRINGS', setTarget: 3, reps: '6-12', exerciseId: 'rdl', supersetId: 'ss_nov_f_1', notes: 'Romanian Deadlifts 3x6-12 OR Barbell Row 3x8-12 + Seated calf raises 3x15-20' },
            { muscle: 'CALVES', setTarget: 3, reps: '15-20', exerciseId: 'calf_raise', supersetId: 'ss_nov_f_1' },
            { muscle: 'CHEST', setTarget: 3, reps: '6-10', exerciseId: 'bp_inc', supersetId: 'ss_nov_f_2', notes: 'Incline press 3x6-10 OR Ring push-ups 3x10-12 + DB preacher curls 3x8-10 OR Bayesian curls 3x12-15' },
            { muscle: 'BICEPS', setTarget: 3, reps: '8-10', exerciseId: 'curl_preacher', supersetId: 'ss_nov_f_2' },
            { muscle: 'QUADS', setTarget: 3, reps: '8-12', exerciseId: 'leg_press', supersetId: 'gs_nov_f_3', notes: 'Leg press 3x8-12 OR Smith machine squats 3x8-10 + Skull-crushers 3x8-12 OR French press 3x8-10 + Hanging knee raises 3xAMRAP OR Leg raises 3xAMRAP' },
            { muscle: 'TRICEPS', setTarget: 3, reps: '8-12', exerciseId: 'skull_crusher', supersetId: 'gs_nov_f_3' },
            { muscle: 'ABS', setTarget: 3, reps: 'AMRAP', exerciseId: 'leg_raise', supersetId: 'gs_nov_f_3' }
        ]
    }
];

export const NH_ULT_BRIDGE: ProgramDay[] = [
    {
        id: 'd1', dayName: { en: 'Monday', es: 'Lunes' },
        slots: [
            { muscle: 'QUADS', setTarget: 4, reps: '4-8', exerciseId: 'sq_bar', supersetId: 'ss_bri_m_1', notes: 'Barbell Squats 3-4x4-8 OR Hack Squats 3-4x6-10 + EZ bar curls 3-4x6-10 OR DB curls 3-4x6-12' },
            { muscle: 'BICEPS', setTarget: 4, reps: '6-10', exerciseId: 'curl_ez', supersetId: 'ss_bri_m_1' },
            { muscle: 'CHEST', setTarget: 4, reps: '6-8', exerciseId: 'dips', supersetId: 'ss_bri_m_2', notes: 'Dips 3-4x6-8 OR Bench 3-4x6-8 + DB rows 3-4x8-12 OR Cable rows 3-4x10-15' },
            { muscle: 'BACK', setTarget: 4, reps: '8-12', exerciseId: 'row_db', supersetId: 'ss_bri_m_2' },
            { muscle: 'TRICEPS', setTarget: 4, reps: '10-15', exerciseId: 'rope_pressdown', supersetId: 'gs_bri_m_3', notes: 'Rope triceps extension 3-4x10-15 OR Katana extension 3-4x10-12 + Cable lateral raises 3-4x10-15 OR Powell raises 3-4x8-12 + Sit-ups 3-4x8-12 OR Cannonball crunches 3-4x10-15' },
            { muscle: 'SHOULDERS', setTarget: 4, reps: '10-15', exerciseId: 'lat_raise_cable', supersetId: 'gs_bri_m_3' },
            { muscle: 'ABS', setTarget: 4, reps: '8-12', exerciseId: 'sit_up', supersetId: 'gs_bri_m_3' }
        ]
    },
    {
        id: 'd2', dayName: { en: 'Wednesday', es: 'Miércoles' },
        slots: [
            { muscle: 'SHOULDERS', setTarget: 4, reps: '6-12', exerciseId: 'ohp', supersetId: 'ss_bri_w_1', notes: 'Barbell OHP 3-4x6-12 OR DB OHP 3-4x8-12 + Hammer curls 3-4x6-12 OR Reverse curls 3-4x6-12' },
            { muscle: 'BICEPS', setTarget: 4, reps: '6-12', exerciseId: 'curl_hammer', supersetId: 'ss_bri_w_1' },
            { muscle: 'BACK', setTarget: 4, reps: '4-8', exerciseId: 'neutral_chinup', supersetId: 'ss_bri_w_2', notes: 'Neutral-ups 3-4x4-8 OR Neutral grip lat pulldowns 3-4x8-12 + Leg curls 3-4x12-15 OR Hyperextensions 3-4x8-12' },
            { muscle: 'HAMSTRINGS', setTarget: 4, reps: '12-15', exerciseId: 'leg_curl', supersetId: 'ss_bri_w_2' },
            { muscle: 'QUADS', setTarget: 4, reps: '8-12', exerciseId: 'bulgarian_split_squat', supersetId: 'gs_bri_w_3', notes: 'Split squats 3-4x8-12 OR Leg extensions 3-4x10-15 + DB fly press 3-4x8-12 OR Cable flies 3-4x12-15 + Neck curls 3-4x15-20 OR Neck extensions 3-4x15-20' },
            { muscle: 'CHEST', setTarget: 4, reps: '12-15', exerciseId: 'cable_crossover', supersetId: 'gs_bri_w_3' },
            { muscle: 'NECK', setTarget: 4, reps: '15-20', exerciseId: 'neck_curl', supersetId: 'gs_bri_w_3' }
        ]
    },
    {
        id: 'd3', dayName: { en: 'Friday', es: 'Viernes' },
        slots: [
            { muscle: 'HAMSTRINGS', setTarget: 3, reps: '6-12', exerciseId: 'rdl', supersetId: 'ss_bri_f_1', notes: 'Romanian Deadlifts 3x6-12 OR Barbell Row 3x8-12 + Seated calf raises 3x15-20' },
            { muscle: 'CALVES', setTarget: 3, reps: '15-20', exerciseId: 'calf_raise', supersetId: 'ss_bri_f_1' },
            { muscle: 'QUADS', setTarget: 3, reps: '8-12', exerciseId: 'leg_press', supersetId: 'ss_bri_f_2', notes: 'Leg press 3x8-12 OR Smith machine squats 3x8-10 + Machine rows 3x8-12 OR Incline rows 3x8-10' },
            { muscle: 'BACK', setTarget: 3, reps: '8-12', exerciseId: 'row_mach', supersetId: 'ss_bri_f_2' },
            { muscle: 'SHOULDERS', setTarget: 3, reps: '12-15', exerciseId: 'upright_row', supersetId: 'ss_bri_f_3', notes: 'Upright rows 3x12-15 OR Face-pulls 3x10-15 + Hanging knee raises AMRAP OR Leg raises 3xAMRAP' },
            { muscle: 'ABS', setTarget: 3, reps: 'AMRAP', exerciseId: 'leg_raise', supersetId: 'ss_bri_f_3' }
        ]
    },
    {
        id: 'd4', dayName: { en: 'Saturday', es: 'Sábado' },
        slots: [
            { muscle: 'CHEST', setTarget: 4, reps: '6-10', exerciseId: 'bp_inc', supersetId: 'ss_bri_s_1', notes: 'Incline press 4x6-10 OR Ring push-ups 4x10-12 + DB pullovers OR Machine pullovers 4x8-12' },
            { muscle: 'BACK', setTarget: 4, reps: '8-12', exerciseId: 'pullover_db', supersetId: 'ss_bri_s_1' },
            { muscle: 'BICEPS', setTarget: 4, reps: '8-10', exerciseId: 'curl_preacher', supersetId: 'ss_bri_s_2', notes: 'DB preacher curls 4x8-10 OR Bayesian curls 4x12-15 + Skull-crushers 4x8-12 OR French press 4x8-10' },
            { muscle: 'TRICEPS', setTarget: 4, reps: '8-12', exerciseId: 'skull_crusher', supersetId: 'ss_bri_s_2' }
        ]
    }
];

export const NH_ULT_INTERMEDIATE: ProgramDay[] = [
    {
        id: 'd1', dayName: { en: 'Monday (Upper)', es: 'Lunes (Torso)' },
        slots: [
            { muscle: 'CHEST', setTarget: 4, reps: '6-8', exerciseId: 'dips', supersetId: 'ss_int_m_1', notes: 'Dips 3-4x6-8 OR Bench 3-4x6-8 + DB rows 3-4x8-12 OR Incline rows 3-4x10-15' },
            { muscle: 'BACK', setTarget: 4, reps: '8-12', exerciseId: 'row_db', supersetId: 'ss_int_m_1' },
            { muscle: 'SHOULDERS', setTarget: 4, reps: '6-12', exerciseId: 'ohp', supersetId: 'ss_int_m_2', notes: 'Barbell OHP 3-4x6-12 OR DB OHP 3-4x8-12 + EZ bar curls 3-4x6-10 OR DB curls 3-4x6-12' },
            { muscle: 'BICEPS', setTarget: 4, reps: '6-10', exerciseId: 'curl_ez', supersetId: 'ss_int_m_2' },
            { muscle: 'TRICEPS', setTarget: 4, reps: '10-15', exerciseId: 'rope_pressdown', supersetId: 'gs_int_m_3', notes: 'Rope triceps extension 3-4x10-15 OR Katana extension 3-4x10-12 + Cable lateral raises 3-4x10-15 OR Powell raises 3-4x8-12 + Sit-ups 3-4x8-12 OR Cannonball crunches 3-4x10-15' },
            { muscle: 'SHOULDERS', setTarget: 4, reps: '10-15', exerciseId: 'lat_raise_cable', supersetId: 'gs_int_m_3' },
            { muscle: 'ABS', setTarget: 4, reps: '8-12', exerciseId: 'sit_up', supersetId: 'gs_int_m_3' }
        ]
    },
    {
        id: 'd2', dayName: { en: 'Tuesday (Lower)', es: 'Martes (Piernas)' },
        slots: [
            { muscle: 'QUADS', setTarget: 4, reps: '4-8', exerciseId: 'sq_bar', supersetId: 'ss_int_t_1', notes: 'Barbell Squats 3-4x4-8 OR Hack Squats 3-4x6-10 + Seated calf raises 3-4x15-20' },
            { muscle: 'CALVES', setTarget: 4, reps: '15-20', exerciseId: 'calf_raise', supersetId: 'ss_int_t_1' },
            { muscle: 'TRAPS', setTarget: 4, reps: '6-10', exerciseId: 'shrug_db', supersetId: 'ss_int_t_2', notes: 'Power shrugs OR Clean pulls 3-4x6-10 + Leg curls 3-4x12-15 OR Hyperextensions 3-4x8-12' },
            { muscle: 'HAMSTRINGS', setTarget: 4, reps: '12-15', exerciseId: 'leg_curl', supersetId: 'ss_int_t_2' },
            { muscle: 'QUADS', setTarget: 4, reps: '8-12', exerciseId: 'bulgarian_split_squat', supersetId: 'ss_int_t_3', notes: 'Split squats 3-4x8-12 OR Leg extensions 3-4x10-15 + Neck curls OR Neck extensions 3-4x15-20' },
            { muscle: 'NECK', setTarget: 4, reps: '15-20', exerciseId: 'neck_curl', supersetId: 'ss_int_t_3' }
        ]
    },
    {
        id: 'd3', dayName: { en: 'Wednesday (Arms)', es: 'Miércoles (Brazos)' },
        slots: [
            { muscle: 'CHEST', setTarget: 4, reps: '6-10', exerciseId: 'close_grip_bench', supersetId: 'ss_int_w_1', notes: 'Close grip bench 3-4x6-10 OR Ring push-ups 3-4x8-12 + DB pullovers OR Machine pullovers 4x8-12' },
            { muscle: 'BACK', setTarget: 4, reps: '8-12', exerciseId: 'pullover_db', supersetId: 'ss_int_w_1' },
            { muscle: 'TRICEPS', setTarget: 4, reps: '6-12', exerciseId: 'jm_press', supersetId: 'ss_int_w_2', notes: 'JM press 3-4x6-12 OR Skull-crushers 3-4x10-12 + EZ bar preacher curls 3-4x6-12 OR Spider curls 3-4x10-15' },
            { muscle: 'BICEPS', setTarget: 4, reps: '6-12', exerciseId: 'curl_preacher', supersetId: 'ss_int_w_2' },
            { muscle: 'BICEPS', setTarget: 4, reps: '6-12', exerciseId: 'curl_hammer', supersetId: 'gs_int_w_3', notes: 'Hammer curls 3-4x6-12 OR Reverse curls 3-4x6-12 + Upright rows 3x12-15 OR Face-pulls 3x10-15 + Windshield wipers 3-4x8-12 OR Russian twists 3-4x10-15' },
            { muscle: 'SHOULDERS', setTarget: 3, reps: '12-15', exerciseId: 'upright_row', supersetId: 'gs_int_w_3' },
            { muscle: 'ABS', setTarget: 4, reps: '10-15', exerciseId: 'leg_raise', supersetId: 'gs_int_w_3' }
        ]
    },
    {
        id: 'd4', dayName: { en: 'Friday (Upper)', es: 'Viernes (Torso)' },
        slots: [
            { muscle: 'CHEST', setTarget: 3, reps: '6-10', exerciseId: 'bp_inc', supersetId: 'ss_int_f_1', notes: 'Incline press 3x6-10 OR AD press 3x8-12 + Krock rows 3x10-12 OR Meadows rows 3x12-15' },
            { muscle: 'BACK', setTarget: 3, reps: '10-12', exerciseId: 'row_db', supersetId: 'ss_int_f_1' },
            { muscle: 'BACK', setTarget: 3, reps: '4-8', exerciseId: 'chinup', supersetId: 'ss_int_f_2', notes: 'Chin-ups OR Neutral-ups 3x4-8 + Triceps pushdowns OR Cross body triceps extensions 3x10-15' },
            { muscle: 'TRICEPS', setTarget: 3, reps: '10-15', exerciseId: 'tri_push', supersetId: 'ss_int_f_2' },
            { muscle: 'CHEST', setTarget: 3, reps: '8-12', exerciseId: 'db_fly', supersetId: 'ss_int_f_3', notes: 'DB fly press 3x8-12 OR Cable flies 3x12-15 + Preacher hammer curls OR Bayesian curls 3x8-12' },
            { muscle: 'BICEPS', setTarget: 3, reps: '8-12', exerciseId: 'curl_cable', supersetId: 'ss_int_f_3' }
        ]
    },
    {
        id: 'd5', dayName: { en: 'Saturday (Lower)', es: 'Sábado (Piernas)' },
        slots: [
            { muscle: 'HAMSTRINGS', setTarget: 3, reps: '6-12', exerciseId: 'rdl', supersetId: 'ss_int_s_1', notes: 'RDL 3x6-12 OR Good morning 3x6-10 + Standing calf raises 3x12-15' },
            { muscle: 'CALVES', setTarget: 3, reps: '12-15', exerciseId: 'calf_raise', supersetId: 'ss_int_s_1' },
            { muscle: 'TRAPS', setTarget: 3, reps: '30m', exerciseId: 'farmers_walk', supersetId: 'ss_int_s_2', notes: 'Farmers carries 3x30m OR Suitcase deadlifts 3x8-10 + Neck curls OR Neck extensions 3-4x15-20' },
            { muscle: 'NECK', setTarget: 4, reps: '15-20', exerciseId: 'neck_ext', supersetId: 'ss_int_s_2' },
            { muscle: 'QUADS', setTarget: 3, reps: '8-12', exerciseId: 'leg_press', supersetId: 'ss_int_s_3', notes: 'Leg press 3x8-12 OR Smith machine squats 3x8-10 + Cable crunches OR Dragon Flags 3x6-12' },
            { muscle: 'ABS', setTarget: 3, reps: '6-12', exerciseId: 'abs_cable', supersetId: 'ss_int_s_3' }
        ]
    }
];

export const NH_ULT_ADVANCED: ProgramDay[] = [
    {
        id: 'd1', dayName: { en: 'Monday (Upper)', es: 'Lunes (Torso)' },
        slots: [
            { muscle: 'CHEST', setTarget: 4, reps: '6-8', exerciseId: 'dips', supersetId: 'gs_adv_m_1', notes: 'Dips 3-4x6-8 OR Bench 3-4x6-8 + DB rows 3-4x8-12 OR Incline rows 3-4x10-15 + EZ bar curls 3-4x6-10 OR DB curls 3-4x6-12' },
            { muscle: 'BACK', setTarget: 4, reps: '8-12', exerciseId: 'row_db', supersetId: 'gs_adv_m_1' },
            { muscle: 'BICEPS', setTarget: 4, reps: '6-10', exerciseId: 'curl_ez', supersetId: 'gs_adv_m_1' },
            { muscle: 'SHOULDERS', setTarget: 4, reps: '6-12', exerciseId: 'ohp', supersetId: 'gs_adv_m_2', notes: 'Barbell OHP 3-4x6-12 OR DB OHP 3-4x8-12 + Fat grip neutral ups 3-4x4-8 OR Neutral grip lat pulldowns 3-4x8-12 + Decline sit-ups 3-4x8-12 OR Abs rollout 3-4x10-15' },
            { muscle: 'BACK', setTarget: 4, reps: '4-8', exerciseId: 'neutral_chinup', supersetId: 'gs_adv_m_2' },
            { muscle: 'ABS', setTarget: 4, reps: '8-12', exerciseId: 'sit_up', supersetId: 'gs_adv_m_2' },
            { muscle: 'CHEST', setTarget: 4, reps: '8-12', exerciseId: 'cable_crossover', supersetId: 'gs_adv_m_3', notes: 'Incline cable flies 3-4x8-12 OR Converging chest press 3-4x6-10 + Rope triceps extension 3-4x10-15 OR Katana extension 3-4x10-12 + Seated lateral raises 3-4x10-15 OR Powell raises 3-4x8-12' },
            { muscle: 'TRICEPS', setTarget: 4, reps: '10-15', exerciseId: 'rope_pressdown', supersetId: 'gs_adv_m_3' },
            { muscle: 'SHOULDERS', setTarget: 4, reps: '10-15', exerciseId: 'lat_raise_seat', supersetId: 'gs_adv_m_3' }
        ]
    },
    {
        id: 'd2', dayName: { en: 'Tuesday (Lower)', es: 'Martes (Piernas)' },
        slots: [
            { muscle: 'QUADS', setTarget: 4, reps: '4-8', exerciseId: 'sq_bar', supersetId: 'ss_adv_t_1', notes: 'Barbell Squats 3-4x4-8 OR Hack Squats 3-4x6-10 + Seated calf raises 3-4x12-15' },
            { muscle: 'CALVES', setTarget: 4, reps: '12-15', exerciseId: 'calf_raise', supersetId: 'ss_adv_t_1' },
            { muscle: 'TRAPS', setTarget: 4, reps: '6-10', exerciseId: 'shrug_db', supersetId: 'ss_adv_t_2', notes: 'Power shrugs OR Clean pulls + Leg curls 3-4x12-15 OR Hyperextensions 3-4x8-12' },
            { muscle: 'HAMSTRINGS', setTarget: 4, reps: '12-15', exerciseId: 'leg_curl', supersetId: 'ss_adv_t_2' },
            { muscle: 'QUADS', setTarget: 4, reps: '8-12', exerciseId: 'bulgarian_split_squat', supersetId: 'gs_adv_t_3', notes: 'Split squats 3-4x8-12 OR Leg extensions 3-4x10-15 + Neck curls OR Neck extensions 3-4x15-20 + Close stance DB seated calf raises 3-4xAMRAP' },
            { muscle: 'NECK', setTarget: 4, reps: '15-20', exerciseId: 'neck_curl', supersetId: 'gs_adv_t_3' },
            { muscle: 'CALVES', setTarget: 4, reps: 'AMRAP', exerciseId: 'calf_raise', supersetId: 'gs_adv_t_3' }
        ]
    },
    {
        id: 'd3', dayName: { en: 'Wednesday (Upper)', es: 'Miércoles (Torso)' },
        slots: [
            { muscle: 'CHEST', setTarget: 4, reps: '6-10', exerciseId: 'close_grip_bench', supersetId: 'gs_adv_w_1', notes: 'Close grip bench 3-4x6-10 OR Ring push-ups 3-4x8-12 + DB pullovers OR Machine pullovers 4x8-12 + EZ bar preacher curls 3-4x6-12 OR Spider curls 3-4x10-15' },
            { muscle: 'BACK', setTarget: 4, reps: '8-12', exerciseId: 'pullover_db', supersetId: 'gs_adv_w_1' },
            { muscle: 'BICEPS', setTarget: 4, reps: '6-12', exerciseId: 'curl_preacher', supersetId: 'gs_adv_w_1' },
            { muscle: 'BACK', setTarget: 4, reps: '4-8', exerciseId: 'chinup', supersetId: 'gs_adv_w_2', notes: 'Fat-grip chin-ups 3-4x4-8 OR Supinated grip lats machine 3-4x8-12 + Hanging knee raises 3-4x10-15 OR Reverse crunches 3-4x8-12 + Cable lateral raises 3-4x10-15 OR Incline Y raises 3-4x8-12' },
            { muscle: 'ABS', setTarget: 4, reps: '10-15', exerciseId: 'knee_raise', supersetId: 'gs_adv_w_2' },
            { muscle: 'SHOULDERS', setTarget: 4, reps: '10-15', exerciseId: 'lat_raise_cable', supersetId: 'gs_adv_w_2' },
            { muscle: 'TRICEPS', setTarget: 4, reps: '6-12', exerciseId: 'jm_press', supersetId: 'gs_adv_w_3', notes: 'JM press 3-4x6-12 OR Lying triceps extensions 3-4x10-12 + Hammer curls 3-4x6-12 OR Reverse curls 3-4x6-12 + Upright rows OR Face-pulls 3-4x10-15' },
            { muscle: 'BICEPS', setTarget: 4, reps: '6-12', exerciseId: 'curl_hammer', supersetId: 'gs_adv_w_3' },
            { muscle: 'SHOULDERS', setTarget: 4, reps: '10-15', exerciseId: 'upright_row', supersetId: 'gs_adv_w_3' }
        ]
    },
    {
        id: 'd4', dayName: { en: 'Thursday (Lower)', es: 'Jueves (Piernas)' },
        slots: [
            { muscle: 'HAMSTRINGS', setTarget: 4, reps: '6-12', exerciseId: 'rdl', supersetId: 'ss_adv_th_1', notes: 'RDL 3-4x6-12 OR Good morning 3-4x6-10 + Standing calf raises 3-4x8-12' },
            { muscle: 'CALVES', setTarget: 4, reps: '8-12', exerciseId: 'calf_raise', supersetId: 'ss_adv_th_1' },
            { muscle: 'QUADS', setTarget: 4, reps: '8-12', exerciseId: 'leg_press', supersetId: 'ss_adv_th_2', notes: 'Leg press 3-4x8-12 OR Heel elevated pause squats 3-4x8-10 + Serratus push-ups OR Serratus punch 3-4x15-20' },
            { muscle: 'CHEST', setTarget: 4, reps: '15-20', exerciseId: 'pushup', supersetId: 'ss_adv_th_2' },
            { muscle: 'QUADS', setTarget: 4, reps: '10-12', exerciseId: 'lunge_reverse', supersetId: 'gs_adv_th_3', notes: 'Reverse lunges 3-4x10-12 OR GHR 3-4x10-15 + Neck curls OR Neck extensions 3-4x15-20 + Toes-out standing calf raises 3-4xAMRAP' },
            { muscle: 'NECK', setTarget: 4, reps: '15-20', exerciseId: 'neck_ext', supersetId: 'gs_adv_th_3' },
            { muscle: 'CALVES', setTarget: 4, reps: 'AMRAP', exerciseId: 'calf_raise', supersetId: 'gs_adv_th_3' }
        ]
    },
    {
        id: 'd5', dayName: { en: 'Friday (Upper)', es: 'Viernes (Torso)' },
        slots: [
            { muscle: 'CHEST', setTarget: 4, reps: '6-10', exerciseId: 'bp_inc', supersetId: 'gs_adv_f_1', notes: 'Incline press 3-4x6-10 OR AD press 3-4x8-12 + Krock rows 3-4x8-12 OR Meadows rows 3-4x12-15 + Preacher hammer curls 3-4x8-12 OR Pronation twists 3-4x10-15' },
            { muscle: 'BACK', setTarget: 4, reps: '8-12', exerciseId: 'row_db', supersetId: 'gs_adv_f_1' },
            { muscle: 'BICEPS', setTarget: 4, reps: '8-12', exerciseId: 'curl_preacher', supersetId: 'gs_adv_f_1' },
            { muscle: 'BACK', setTarget: 4, reps: '4-8', exerciseId: 'chinup', supersetId: 'gs_adv_f_2', notes: 'Chin-ups OR Neutral-ups 3-4x4-8 + Triceps dips 3-4x6-10 OR Cable skull-crushers 3-4x10-15 + Cable crunches 3-4x8-12 OR Dragon Flags 3-4x6-10' },
            { muscle: 'TRICEPS', setTarget: 4, reps: '6-10', exerciseId: 'dips', supersetId: 'gs_adv_f_2' },
            { muscle: 'ABS', setTarget: 4, reps: '8-12', exerciseId: 'abs_cable', supersetId: 'gs_adv_f_2' },
            { muscle: 'CHEST', setTarget: 4, reps: '8-12', exerciseId: 'db_fly', supersetId: 'gs_adv_f_3', notes: 'DB fly press 3-4x8-12 OR Cable flies 3x12-15 + Bayesian curls 3-4x12-15 OR Pelican curls 3-4x6-10 + Rear delt swings 3-4x10-15 OR Upright rows 3-4x12-15' },
            { muscle: 'BICEPS', setTarget: 4, reps: '12-15', exerciseId: 'curl_cable', supersetId: 'gs_adv_f_3' },
            { muscle: 'SHOULDERS', setTarget: 4, reps: '10-15', exerciseId: 'rear_delt_fly', supersetId: 'gs_adv_f_3' }
        ]
    },
    {
        id: 'd6', dayName: { en: 'Saturday (Lower)', es: 'Sábado (Piernas)' },
        slots: [
            { muscle: 'QUADS', setTarget: 4, reps: '6-12', exerciseId: 'sq_hack', supersetId: 'ss_adv_s_1', notes: 'Smith machine squats 3-4x10-15 OR Pendulum hack squats 3-4x6-12 + Seated calf raises 3-4x8-12' },
            { muscle: 'CALVES', setTarget: 4, reps: '8-12', exerciseId: 'calf_raise', supersetId: 'ss_adv_s_1' },
            { muscle: 'TRAPS', setTarget: 4, reps: '30m', exerciseId: 'farmers_walk', supersetId: 'gs_adv_s_2', notes: 'Farmers carries 3-4x30m OR Suitcase deadlifts 3-4x8-12 + Incline rows 3-4x8-12 OR Kelso shrugs 3-4x10-15 + Neck curls OR Neck extensions 3-4x15-20' },
            { muscle: 'BACK', setTarget: 4, reps: '8-12', exerciseId: 'tbar_row_chest_supported', supersetId: 'gs_adv_s_2' },
            { muscle: 'NECK', setTarget: 4, reps: '15-20', exerciseId: 'neck_curl', supersetId: 'gs_adv_s_2' },
            { muscle: 'HAMSTRINGS', setTarget: 4, reps: '8-12', exerciseId: 'back_extension', supersetId: 'ss_adv_s_3', notes: 'Snatch grip hyperextensions 3-4x8-12 OR Single leg RDLs 3-4x10-15 + Close stance DB seated calf raises 3-4xAMRAP' },
            { muscle: 'CALVES', setTarget: 4, reps: 'AMRAP', exerciseId: 'calf_raise', supersetId: 'ss_adv_s_3' }
        ]
    }
];

export const NH_ULTIMATE_STAGES: ProgramStage[] = [
    {
        id: 'beginner',
        label: { en: 'Stage 1 · Beginner', es: 'Stage 1 · Principiante' },
        subtitle: { en: '3 Days · Full Body', es: '3 Días · Cuerpo Completo' },
        program: NH_ULT_BEGINNER,
    },
    {
        id: 'novice',
        label: { en: 'Stage 2 · Novice', es: 'Stage 2 · Novato' },
        subtitle: { en: '3 Days · Full Body', es: '3 Días · Cuerpo Completo' },
        program: NH_ULT_NOVICE,
    },
    {
        id: 'bridge',
        label: { en: 'Stage 3 · Bridge', es: 'Stage 3 · Puente' },
        subtitle: { en: '4 Days · Full Body + Upper', es: '4 Días · Cuerpo Completo + Torso' },
        program: NH_ULT_BRIDGE,
    },
    {
        id: 'intermediate',
        label: { en: 'Stage 4 · Intermediate', es: 'Stage 4 · Intermedio' },
        subtitle: { en: '5 Days · Upper/Lower + Arms', es: '5 Días · Torso/Pierna + Brazos' },
        program: NH_ULT_INTERMEDIATE,
    },
    {
        id: 'advanced',
        label: { en: 'Stage 5 · Advanced', es: 'Stage 5 · Avanzado' },
        subtitle: { en: '6 Days · High Volume U/L', es: '6 Días · Alto Volumen T/P' },
        program: NH_ULT_ADVANCED,
    },
];

export const NH_BAKI_PROG_1: ProgramDay[] = [
    {
        id: 'baki_p1_d1', dayName: { en: 'Day 1', es: 'Día 1' },
        slots: [
            { muscle: 'CHEST', setTarget: 4, reps: 'AMRAP', exerciseId: 'pushup', supersetId: 'ss_baki_p1_d1_1', notes: 'Push-ups AMRAP + Neck curls 4x15-20' },
            { muscle: 'NECK', setTarget: 4, reps: '15-20', exerciseId: 'neck_curl', supersetId: 'ss_baki_p1_d1_1' },
            { muscle: 'BACK', setTarget: 4, reps: 'AMRAP', exerciseId: 'pullup', supersetId: 'ss_baki_p1_d1_2', notes: 'Pull-ups AMRAP + Leg raises AMRAP' },
            { muscle: 'ABS', setTarget: 4, reps: 'AMRAP', exerciseId: 'leg_raise', supersetId: 'ss_baki_p1_d1_2' },
            { muscle: 'QUADS', setTarget: 4, reps: '15-20', exerciseId: 'sq_bar', supersetId: 'ss_baki_p1_d1_3', notes: 'Squats (bodyweight/bands) + Band shrugs AMRAP' },
            { muscle: 'TRAPS', setTarget: 4, reps: 'AMRAP', exerciseId: 'shrug_db', supersetId: 'ss_baki_p1_d1_3' }
        ]
    },
    {
        id: 'baki_p1_d2', dayName: { en: 'Day 2', es: 'Día 2' },
        slots: [
            { muscle: 'BACK', setTarget: 4, reps: 'AMRAP', exerciseId: 'row_cable', supersetId: 'ss_baki_p1_d2_1', notes: 'Ring rows AMRAP + Neck extensions 4x15-20' },
            { muscle: 'NECK', setTarget: 4, reps: '15-20', exerciseId: 'neck_ext', supersetId: 'ss_baki_p1_d2_1' },
            { muscle: 'SHOULDERS', setTarget: 4, reps: 'AMRAP', exerciseId: 'ohp_db', supersetId: 'ss_baki_p1_d2_2', notes: 'Pike push-ups / Band OHP AMRAP + Calf raises AMRAP' },
            { muscle: 'CALVES', setTarget: 4, reps: 'AMRAP', exerciseId: 'calf_raise', supersetId: 'ss_baki_p1_d2_2' },
            { muscle: 'HAMSTRINGS', setTarget: 4, reps: '12-15', exerciseId: 'good_morning', supersetId: 'ss_baki_p1_d2_3', notes: 'Band Good mornings + Band Curls AMRAP' },
            { muscle: 'BICEPS', setTarget: 4, reps: 'AMRAP', exerciseId: 'curl_db', supersetId: 'ss_baki_p1_d2_3' }
        ]
    },
    {
        id: 'baki_p1_d3', dayName: { en: 'Day 3', es: 'Día 3' },
        slots: [
            { muscle: 'CHEST', setTarget: 4, reps: 'AMRAP', exerciseId: 'diamond_pushup', supersetId: 'ss_baki_p1_d3_1', notes: 'Diamond push-ups AMRAP + Neck side raises 4x15-20' },
            { muscle: 'NECK', setTarget: 4, reps: '15-20', exerciseId: 'neck_curl', supersetId: 'ss_baki_p1_d3_1' },
            { muscle: 'BACK', setTarget: 4, reps: 'AMRAP', exerciseId: 'chinup', supersetId: 'ss_baki_p1_d3_2', notes: 'Chin-ups AMRAP + Planks / Sit-ups AMRAP' },
            { muscle: 'ABS', setTarget: 4, reps: 'AMRAP', exerciseId: 'sit_up', supersetId: 'ss_baki_p1_d3_2' },
            { muscle: 'BACK', setTarget: 4, reps: '10-15', exerciseId: 'deadlift', supersetId: 'ss_baki_p1_d3_3', notes: 'Band Deadlifts + Shrugs AMRAP' },
            { muscle: 'TRAPS', setTarget: 4, reps: 'AMRAP', exerciseId: 'shrug_db', supersetId: 'ss_baki_p1_d3_3' }
        ]
    }
];

export const NH_BAKI: ProgramDay[] = [
    {
        id: 'd1', dayName: { en: 'Day 1', es: 'Día 1' },
        slots: [
            { muscle: 'QUADS', setTarget: 3, reps: '4-8', exerciseId: 'sq_bar', supersetId: 'ss_baki_1', notes: 'Squats (3x4-8) + Band shrugs AMRAP' },
            { muscle: 'TRAPS', setTarget: 3, reps: 'AMRAP', exerciseId: 'shrug_db', supersetId: 'ss_baki_1' },
            { muscle: 'HAMSTRINGS', setTarget: 4, reps: '8-12', exerciseId: 'rdl', supersetId: 'ss_baki_2', notes: 'Romanian deadlifts (4x8-12) + Pull-ups AMRAP' },
            { muscle: 'BACK', setTarget: 4, reps: 'AMRAP', exerciseId: 'pullup', supersetId: 'ss_baki_2' },
            { muscle: 'TRICEPS', setTarget: 4, reps: '8-12', exerciseId: 'skull_crusher', supersetId: 'ss_baki_3', notes: 'Skullcrushers (4x8-12) + Band Curls (4xAMRAP)' },
            { muscle: 'BICEPS', setTarget: 4, reps: 'AMRAP', exerciseId: 'curl_db', supersetId: 'ss_baki_3' },
            { muscle: 'CHEST', setTarget: 3, reps: 'AMRAP', exerciseId: 'pushup', supersetId: 'gs_baki_4', notes: 'Push ups + Leg raises + Neck curls/extensions + Band Calf raises AMRAP' },
            { muscle: 'ABS', setTarget: 3, reps: 'AMRAP', exerciseId: 'leg_raise', supersetId: 'gs_baki_4' },
            { muscle: 'NECK', setTarget: 3, reps: 'AMRAP', exerciseId: 'neck_curl', supersetId: 'gs_baki_4' },
            { muscle: 'CALVES', setTarget: 3, reps: 'AMRAP', exerciseId: 'calf_raise', supersetId: 'gs_baki_4' }
        ]
    },
    {
        id: 'd2', dayName: { en: 'Day 2', es: 'Día 2' },
        slots: [
            { muscle: 'CHEST', setTarget: 3, reps: '6-10', exerciseId: 'bp_bar', supersetId: 'ss_baki_w_1', notes: 'Bench (3x6-10) + Band shrugs (horizontal torso) AMRAP' },
            { muscle: 'TRAPS', setTarget: 3, reps: 'AMRAP', exerciseId: 'shrug_db', supersetId: 'ss_baki_w_1' },
            { muscle: 'SHOULDERS', setTarget: 4, reps: '6-10', exerciseId: 'ohp', supersetId: 'ss_baki_w_2', notes: 'OHP (4x6-10) + Chin-ups AMRAP' },
            { muscle: 'BACK', setTarget: 4, reps: 'AMRAP', exerciseId: 'chinup', supersetId: 'ss_baki_w_2' },
            { muscle: 'HAMSTRINGS', setTarget: 4, reps: '8-12', exerciseId: 'back_extension', supersetId: 'ss_baki_w_3', notes: 'Back hyperextensions (4x8-12) + Ring rows AMRAP' },
            { muscle: 'BACK', setTarget: 4, reps: 'AMRAP', exerciseId: 'row_cable', supersetId: 'ss_baki_w_3' },
            { muscle: 'CHEST', setTarget: 3, reps: 'AMRAP', exerciseId: 'diamond_pushup', supersetId: 'gs_baki_w_4', notes: 'Diamond push ups + Crunches + Neck side raises + Band Calf raises AMRAP' },
            { muscle: 'ABS', setTarget: 3, reps: 'AMRAP', exerciseId: 'abs_cable', supersetId: 'gs_baki_w_4' },
            { muscle: 'NECK', setTarget: 3, reps: 'AMRAP', exerciseId: 'neck_curl', supersetId: 'gs_baki_w_4' },
            { muscle: 'CALVES', setTarget: 3, reps: 'AMRAP', exerciseId: 'calf_raise', supersetId: 'gs_baki_w_4' }
        ]
    },
    {
        id: 'd3', dayName: { en: 'Day 3', es: 'Día 3' },
        slots: [
            { muscle: 'BACK', setTarget: 3, reps: '2-5', exerciseId: 'deadlift', notes: 'Deadlifts (1-3 heavy sets, 2-5 reps)' },
            { muscle: 'QUADS', setTarget: 4, reps: '6-10', exerciseId: 'sq_paused', supersetId: 'ss_baki_f_1', notes: 'Pause squats (4x6-10) + Pull-ups AMRAP' },
            { muscle: 'BACK', setTarget: 4, reps: 'AMRAP', exerciseId: 'pullup', supersetId: 'ss_baki_f_1' },
            { muscle: 'TRAPS', setTarget: 4, reps: '10-15', exerciseId: 'shrug_db', supersetId: 'ss_baki_f_2', notes: 'Shrugs (4x10-15) + Facepulls AMRAP' },
            { muscle: 'SHOULDERS', setTarget: 4, reps: 'AMRAP', exerciseId: 'face_pull', supersetId: 'ss_baki_f_2' },
            { muscle: 'CHEST', setTarget: 3, reps: 'AMRAP', exerciseId: 'pushup', supersetId: 'gs_baki_f_3', notes: 'Push ups + Leg raises + Neck curls/extensions + Band Calf raises AMRAP' },
            { muscle: 'ABS', setTarget: 3, reps: 'AMRAP', exerciseId: 'leg_raise', supersetId: 'gs_baki_f_3' },
            { muscle: 'NECK', setTarget: 3, reps: 'AMRAP', exerciseId: 'neck_ext', supersetId: 'gs_baki_f_3' },
            { muscle: 'CALVES', setTarget: 3, reps: 'AMRAP', exerciseId: 'calf_raise', supersetId: 'gs_baki_f_3' }
        ]
    }
];

export const NH_BAKI_PROG_2_2: ProgramDay[] = [
    {
        id: 'baki_p22_d1', dayName: { en: 'Day 1', es: 'Día 1' },
        slots: [
            { muscle: 'QUADS', setTarget: 3, reps: '3-5', exerciseId: 'sq_bar', supersetId: 'ss_baki_p22_d1_1', notes: 'Squats (3x3-5) + Shrugs AMRAP' },
            { muscle: 'TRAPS', setTarget: 3, reps: 'AMRAP', exerciseId: 'shrug_db', supersetId: 'ss_baki_p22_d1_1' },
            { muscle: 'BACK', setTarget: 4, reps: '8-12', exerciseId: 'rack_pull', supersetId: 'ss_baki_p22_d1_2', notes: 'Rack pulls (4x8-12) + Weighted Pull-ups (4x3-5)' },
            { muscle: 'BACK', setTarget: 4, reps: '3-5', exerciseId: 'pullup', supersetId: 'ss_baki_p22_d1_2' },
            { muscle: 'CHEST', setTarget: 4, reps: '6-10', exerciseId: 'close_grip_bench', supersetId: 'ss_baki_p22_d1_3', notes: 'Close grip bench (4x6-10) + Curls (4xAMRAP)' },
            { muscle: 'BICEPS', setTarget: 4, reps: 'AMRAP', exerciseId: 'curl_db', supersetId: 'ss_baki_p22_d1_3' },
            { muscle: 'HAMSTRINGS', setTarget: 3, reps: '8-12', exerciseId: 'back_extension', supersetId: 'ss_baki_p22_d1_4', notes: 'Hyperextensions (3x8-12) + Facepulls AMRAP' },
            { muscle: 'SHOULDERS', setTarget: 3, reps: 'AMRAP', exerciseId: 'face_pull', supersetId: 'ss_baki_p22_d1_4' },
            { muscle: 'CHEST', setTarget: 3, reps: 'AMRAP', exerciseId: 'pushup', supersetId: 'gs_baki_p22_d1_5', notes: 'Decline push-ups + Leg raises + Neck curls + Calf raises AMRAP' },
            { muscle: 'ABS', setTarget: 3, reps: 'AMRAP', exerciseId: 'leg_raise', supersetId: 'gs_baki_p22_d1_5' },
            { muscle: 'NECK', setTarget: 3, reps: 'AMRAP', exerciseId: 'neck_curl', supersetId: 'gs_baki_p22_d1_5' },
            { muscle: 'CALVES', setTarget: 3, reps: 'AMRAP', exerciseId: 'calf_raise', supersetId: 'gs_baki_p22_d1_5' }
        ]
    },
    {
        id: 'baki_p22_d2', dayName: { en: 'Day 2', es: 'Día 2' },
        slots: [
            { muscle: 'CHEST', setTarget: 4, reps: '6-10', exerciseId: 'bp_bar', supersetId: 'ss_baki_p22_d2_1', notes: 'Bench (4x6-10) + Shrugs AMRAP' },
            { muscle: 'TRAPS', setTarget: 4, reps: 'AMRAP', exerciseId: 'shrug_db', supersetId: 'ss_baki_p22_d2_1' },
            { muscle: 'BACK', setTarget: 3, reps: '6-10', exerciseId: 'deadlift', supersetId: 'ss_baki_p22_d2_2', notes: 'Deficit DL (3x6-10) + Weighted Chin-ups (3x4-6)' },
            { muscle: 'BACK', setTarget: 3, reps: '4-6', exerciseId: 'chinup', supersetId: 'ss_baki_p22_d2_2' },
            { muscle: 'QUADS', setTarget: 4, reps: 'AMRAP', exerciseId: 'lunges', supersetId: 'ss_baki_p22_d2_3', notes: 'Lunges (4xAMRAP) + Wrist curls (4x8-12)' },
            { muscle: 'FOREARMS', setTarget: 4, reps: '8-12', exerciseId: 'wrist_curl', supersetId: 'ss_baki_p22_d2_3' },
            { muscle: 'HAMSTRINGS', setTarget: 4, reps: 'AMRAP', exerciseId: 'good_morning', supersetId: 'ss_baki_p22_d2_4', notes: 'Good mornings (4xAMRAP) + Hanging leg raises AMRAP' },
            { muscle: 'ABS', setTarget: 4, reps: 'AMRAP', exerciseId: 'leg_raise', supersetId: 'ss_baki_p22_d2_4' },
            { muscle: 'BACK', setTarget: 3, reps: 'AMRAP', exerciseId: 'row_cable', supersetId: 'gs_baki_p22_d2_5', notes: 'Ring rows + Crunches + Neck + Calf raises AMRAP' },
            { muscle: 'ABS', setTarget: 3, reps: 'AMRAP', exerciseId: 'abs_cable', supersetId: 'gs_baki_p22_d2_5' },
            { muscle: 'NECK', setTarget: 3, reps: 'AMRAP', exerciseId: 'neck_curl', supersetId: 'gs_baki_p22_d2_5' },
            { muscle: 'CALVES', setTarget: 3, reps: 'AMRAP', exerciseId: 'calf_raise', supersetId: 'gs_baki_p22_d2_5' }
        ]
    },
    {
        id: 'baki_p22_d3', dayName: { en: 'Day 3', es: 'Día 3' },
        slots: [
            { muscle: 'BACK', setTarget: 3, reps: '2-5', exerciseId: 'deadlift', supersetId: 'ss_baki_p22_d3_1', notes: 'Deadlift (3x2-5) + Shrugs AMRAP' },
            { muscle: 'TRAPS', setTarget: 3, reps: 'AMRAP', exerciseId: 'shrug_db', supersetId: 'ss_baki_p22_d3_1' },
            { muscle: 'QUADS', setTarget: 4, reps: '4-8', exerciseId: 'sq_paused', supersetId: 'ss_baki_p22_d3_2', notes: 'Pause squats (4x4-8) + Weighted Pull-ups (4x3-5)' },
            { muscle: 'BACK', setTarget: 4, reps: '3-5', exerciseId: 'pullup', supersetId: 'ss_baki_p22_d3_2' },
            { muscle: 'SHOULDERS', setTarget: 4, reps: '6-10', exerciseId: 'ohp', supersetId: 'ss_baki_p22_d3_3', notes: 'OHP (4x6-10) + Tri ext AMRAP' },
            { muscle: 'TRICEPS', setTarget: 4, reps: 'AMRAP', exerciseId: 'tri_ext', supersetId: 'ss_baki_p22_d3_3' },
            { muscle: 'CHEST', setTarget: 4, reps: 'AMRAP', exerciseId: 'pushup', supersetId: 'ss_baki_p22_d3_4', notes: 'Push-ups AMRAP + Curls (4x8-12)' },
            { muscle: 'BICEPS', setTarget: 4, reps: '8-12', exerciseId: 'curl_db', supersetId: 'ss_baki_p22_d3_4' },
            { muscle: 'BACK', setTarget: 3, reps: 'AMRAP', exerciseId: 'row_cable', supersetId: 'gs_baki_p22_d3_5', notes: 'Rows + Leg raises + Neck + Calf raises AMRAP' },
            { muscle: 'ABS', setTarget: 3, reps: 'AMRAP', exerciseId: 'leg_raise', supersetId: 'gs_baki_p22_d3_5' },
            { muscle: 'NECK', setTarget: 3, reps: 'AMRAP', exerciseId: 'neck_ext', supersetId: 'gs_baki_p22_d3_5' },
            { muscle: 'CALVES', setTarget: 3, reps: 'AMRAP', exerciseId: 'calf_raise', supersetId: 'gs_baki_p22_d3_5' }
        ]
    }
];

export const NH_TOJI_STAGE_1: ProgramDay[] = [
    {
        id: 'toji_s1_d1', dayName: { en: 'Monday', es: 'Lunes' },
        slots: [
            { muscle: 'CHEST', setTarget: 3, reps: 'AMRAP', exerciseId: 'pushup', supersetId: 'ss_toji_s1_m_1', notes: 'Push-ups 3xAMRAP' },
            { muscle: 'TRAPS', setTarget: 3, reps: '10-15', exerciseId: 'shrug_db', supersetId: 'ss_toji_s1_m_1', notes: 'DB shrugs 3x10-15' },
            { muscle: 'SHOULDERS', setTarget: 4, reps: '6-12', exerciseId: 'lat_raise', supersetId: 'ss_toji_s1_m_2', notes: 'Lateral raises 4x6-12' },
            { muscle: 'ABS', setTarget: 4, reps: 'AMRAP', exerciseId: 'knee_raise', supersetId: 'ss_toji_s1_m_2', notes: 'Reverse crunches 4xAMRAP' },
            { muscle: 'BACK', setTarget: 3, reps: 'AMRAP', exerciseId: 'chinup', supersetId: 'ss_toji_s1_m_3', notes: 'Chin-ups 3xAMRAP' },
            { muscle: 'QUADS', setTarget: 3, reps: '8-12', exerciseId: 'bulgarian_split_squat', supersetId: 'ss_toji_s1_m_3', notes: 'Split-squats 3x8-12' }
        ]
    },
    {
        id: 'toji_s1_d2', dayName: { en: 'Wednesday', es: 'Miércoles' },
        slots: [
            { muscle: 'SHOULDERS', setTarget: 3, reps: '6-10', exerciseId: 'ohp_db', supersetId: 'ss_toji_s1_w_1', notes: 'DB OHP 3x6-10' },
            { muscle: 'NECK', setTarget: 3, reps: '15-20', exerciseId: 'neck_curl', supersetId: 'ss_toji_s1_w_1', notes: 'Neck curls 3x15-20' },
            { muscle: 'BACK', setTarget: 4, reps: '8-12', exerciseId: 'row_db', supersetId: 'ss_toji_s1_w_2', notes: 'DB rows 4x8-12' },
            { muscle: 'TRICEPS', setTarget: 4, reps: '10-15', exerciseId: 'tri_ext', supersetId: 'ss_toji_s1_w_2', notes: 'Cable katana extensions 4x10-15' },
            { muscle: 'SHOULDERS', setTarget: 3, reps: '12-15', exerciseId: 'rear_delt_fly', supersetId: 'ss_toji_s1_w_3', notes: 'Reverse flies 3x12-15' },
            { muscle: 'BICEPS', setTarget: 3, reps: '6-10', exerciseId: 'curl_hammer', supersetId: 'ss_toji_s1_w_3', notes: 'Hammer curls 3x6-10' }
        ]
    },
    {
        id: 'toji_s1_d3', dayName: { en: 'Friday', es: 'Viernes' },
        slots: [
            { muscle: 'CHEST', setTarget: 3, reps: '6-10', exerciseId: 'bp_db', supersetId: 'ss_toji_s1_f_1', notes: 'DB bench 3x6-10' },
            { muscle: 'BICEPS', setTarget: 3, reps: '8-12', exerciseId: 'curl_cable', supersetId: 'ss_toji_s1_f_1', notes: 'Cable curls 3x8-12' },
            { muscle: 'BACK', setTarget: 3, reps: '8-12', exerciseId: 'pullover_db', supersetId: 'ss_toji_s1_f_2', notes: 'Pullovers 3x8-12' },
            { muscle: 'ABS', setTarget: 3, reps: 'AMRAP', exerciseId: 'abs_cable', supersetId: 'ss_toji_s1_f_2', notes: 'Russian twists 3xAMRAP' },
            { muscle: 'SHOULDERS', setTarget: 4, reps: '10-15', exerciseId: 'upright_row', supersetId: 'ss_toji_s1_f_3', notes: 'Upright rows 4x10-15' },
            { muscle: 'QUADS', setTarget: 4, reps: '8-12', exerciseId: 'goblet_sq', supersetId: 'ss_toji_s1_f_3', notes: 'Goblet squats 4x8-12' }
        ]
    }
];

export const NH_TOJI_STAGE_2: ProgramDay[] = [
    {
        id: 'toji_s2_d1', dayName: { en: 'Monday', es: 'Lunes' },
        slots: [
            { muscle: 'CHEST', setTarget: 4, reps: '4-8', exerciseId: 'dips', supersetId: 'ss_toji_s2_m_1', notes: 'Weighted dips 4x4-8' },
            { muscle: 'TRAPS', setTarget: 4, reps: '6-10', exerciseId: 'shrug_bar', supersetId: 'ss_toji_s2_m_1', notes: 'Power shrugs 4x6-10' },
            { muscle: 'SHOULDERS', setTarget: 4, reps: '6-12', exerciseId: 'lat_raise_cable', supersetId: 'ss_toji_s2_m_2', notes: 'Cable lateral raises 4x6-12' },
            { muscle: 'ABS', setTarget: 4, reps: '8-12', exerciseId: 'sit_up', supersetId: 'ss_toji_s2_m_2', notes: 'Weighted sit-ups 4x8-12' },
            { muscle: 'BACK', setTarget: 4, reps: '6-10', exerciseId: 'chinup', supersetId: 'ss_toji_s2_m_3', notes: 'Weighted chin-ups 4x6-10' },
            { muscle: 'QUADS', setTarget: 4, reps: '8-12', exerciseId: 'bulgarian_split_squat', supersetId: 'ss_toji_s2_m_3', notes: 'Split-squats 4x8-12' }
        ]
    },
    {
        id: 'toji_s2_d2', dayName: { en: 'Wednesday', es: 'Miércoles' },
        slots: [
            { muscle: 'SHOULDERS', setTarget: 4, reps: '6-10', exerciseId: 'ohp_db', supersetId: 'ss_toji_s2_w_1', notes: 'DB OHP 4x6-10' },
            { muscle: 'BICEPS', setTarget: 4, reps: '6-12', exerciseId: 'curl_hammer', supersetId: 'ss_toji_s2_w_1', notes: 'Hammer curls 4x6-12' },
            { muscle: 'TRICEPS', setTarget: 4, reps: '10-15', exerciseId: 'tri_ext', supersetId: 'ss_toji_s2_w_2', notes: 'Cable katana extensions 4x10-15' },
            { muscle: 'NECK', setTarget: 4, reps: '15-20', exerciseId: 'neck_curl', supersetId: 'ss_toji_s2_w_2', notes: 'Neck curls 4x15-20' },
            { muscle: 'BACK', setTarget: 4, reps: '8-12', exerciseId: 'row_db', supersetId: 'ss_toji_s2_w_3', notes: 'Krock rows 4x8-12' },
            { muscle: 'SHOULDERS', setTarget: 4, reps: '12-15', exerciseId: 'rear_delt_fly', supersetId: 'ss_toji_s2_w_3', notes: 'Machine reverse flies 4x12-15' }
        ]
    },
    {
        id: 'toji_s2_d3', dayName: { en: 'Friday', es: 'Viernes' },
        slots: [
            { muscle: 'TRICEPS', setTarget: 4, reps: '6-10', exerciseId: 'close_grip_bench', supersetId: 'ss_toji_s2_f_1', notes: 'Close grip bench 4x6-10' },
            { muscle: 'BICEPS', setTarget: 4, reps: '6-12', exerciseId: 'curl_preacher', supersetId: 'ss_toji_s2_f_1', notes: 'EZ bar preacher curls 4x6-12' },
            { muscle: 'BACK', setTarget: 4, reps: '8-12', exerciseId: 'pullover_db', supersetId: 'ss_toji_s2_f_2', notes: 'Pullovers 4x8-12' },
            { muscle: 'ABS', setTarget: 4, reps: '10-15', exerciseId: 'abs_cable', supersetId: 'ss_toji_s2_f_2', notes: 'Weighted Russian twists 4x10-15' },
            { muscle: 'SHOULDERS', setTarget: 4, reps: '10-15', exerciseId: 'upright_row', supersetId: 'ss_toji_s2_f_3', notes: 'Upright rows 4x10-15' },
            { muscle: 'QUADS', setTarget: 4, reps: '8-12', exerciseId: 'leg_press', supersetId: 'ss_toji_s2_f_3', notes: 'Leg press 4x8-12' }
        ]
    }
];

export const NH_TOJI: ProgramDay[] = [
    {
        id: 'd1', dayName: { en: 'Monday', es: 'Lunes' },
        slots: [
            { muscle: 'CHEST', setTarget: 4, reps: '4-8', exerciseId: 'dips', supersetId: 'ss_toji_m_1', notes: 'Weighted dips 4x4-8 + Power shrugs 4x6-10' },
            { muscle: 'TRAPS', setTarget: 4, reps: '6-10', exerciseId: 'shrug_db', supersetId: 'ss_toji_m_1' },
            { muscle: 'SHOULDERS', setTarget: 4, reps: '6-12', exerciseId: 'lat_raise_cable', supersetId: 'ss_toji_m_2', notes: 'Cable lateral raises 4x6-12 + Weighted sit-ups 4x8-12' },
            { muscle: 'ABS', setTarget: 4, reps: '8-12', exerciseId: 'sit_up', supersetId: 'ss_toji_m_2' },
            { muscle: 'BACK', setTarget: 4, reps: '6-10', exerciseId: 'chinup', supersetId: 'ss_toji_m_3', notes: 'Weighted chin-ups 4x6-10 + Split-squats 4x8-12' },
            { muscle: 'QUADS', setTarget: 4, reps: '8-12', exerciseId: 'bulgarian_split_squat', supersetId: 'ss_toji_m_3' }
        ]
    },
    {
        id: 'd2', dayName: { en: 'Wednesday', es: 'Miércoles' },
        slots: [
            { muscle: 'SHOULDERS', setTarget: 4, reps: '6-10', exerciseId: 'ohp_db', supersetId: 'ss_toji_w_1', notes: 'DB OHP 4x6-10 + Hammer curls 4x6-12' },
            { muscle: 'BICEPS', setTarget: 4, reps: '6-12', exerciseId: 'curl_hammer', supersetId: 'ss_toji_w_1' },
            { muscle: 'TRICEPS', setTarget: 4, reps: '10-15', exerciseId: 'tri_ext', supersetId: 'ss_toji_w_2', notes: 'Cable katana extensions 4x10-15 + Neck curls 4x15-20' },
            { muscle: 'NECK', setTarget: 4, reps: '15-20', exerciseId: 'neck_curl', supersetId: 'ss_toji_w_2' },
            { muscle: 'BACK', setTarget: 4, reps: '8-12', exerciseId: 'row_db', supersetId: 'ss_toji_w_3', notes: 'Krock rows 4x8-12 + Machine reverse flies 4x12-15' },
            { muscle: 'SHOULDERS', setTarget: 4, reps: '12-15', exerciseId: 'rear_delt_fly', supersetId: 'ss_toji_w_3' }
        ]
    },
    {
        id: 'd3', dayName: { en: 'Friday', es: 'Viernes' },
        slots: [
            { muscle: 'CHEST', setTarget: 3, reps: '6-10', exerciseId: 'close_grip_bench', supersetId: 'ss_toji_f_1', notes: 'Close grip bench 3x6-10 + EZ bar preacher curls 3x6-12' },
            { muscle: 'BICEPS', setTarget: 3, reps: '6-12', exerciseId: 'curl_preacher', supersetId: 'ss_toji_f_1' },
            { muscle: 'BACK', setTarget: 3, reps: '8-12', exerciseId: 'pullover_db', supersetId: 'ss_toji_f_2', notes: 'Pullovers 3x8-12 + Weighted Russian twists 3x10-15' },
            { muscle: 'ABS', setTarget: 3, reps: '10-15', exerciseId: 'abs_cable', supersetId: 'ss_toji_f_2' },
            { muscle: 'SHOULDERS', setTarget: 3, reps: '10-15', exerciseId: 'upright_row', supersetId: 'ss_toji_f_3', notes: 'Upright rows 3x10-15 + Leg press 3x8-12' },
            { muscle: 'QUADS', setTarget: 3, reps: '8-12', exerciseId: 'leg_press', supersetId: 'ss_toji_f_3' }
        ]
    },
    {
        id: 'd4', dayName: { en: 'Saturday', es: 'Sábado' },
        slots: [
            { muscle: 'SHOULDERS', setTarget: 3, reps: '8-12', exerciseId: 'ohp', supersetId: 'ss_toji_s_1', notes: 'Machine shoulder press 3x8-12 + Neck extensions 3x15-20' },
            { muscle: 'NECK', setTarget: 3, reps: '15-20', exerciseId: 'neck_ext', supersetId: 'ss_toji_s_1' },
            { muscle: 'BACK', setTarget: 3, reps: '6-10', exerciseId: 'tbar_row_chest_supported', supersetId: 'ss_toji_s_2', notes: 'Incline DB rows 3x6-10 (or Weighted neutral pull-ups 4x4-8) + Triceps pushdowns 3x8-12' },
            { muscle: 'TRICEPS', setTarget: 3, reps: '8-12', exerciseId: 'tri_push', supersetId: 'ss_toji_s_2' },
            { muscle: 'TRAPS', setTarget: 3, reps: '30m', exerciseId: 'farmers_walk', supersetId: 'ss_toji_s_3', notes: 'Farmers walks 3x30m + Y raises 3x8-12' },
            { muscle: 'SHOULDERS', setTarget: 3, reps: '8-12', exerciseId: 'lat_raise', supersetId: 'ss_toji_s_3' }
        ]
    }
];

export const NH_SILVER_ERA: ProgramDay[] = [
    {
        id: 'd1', dayName: { en: 'Monday', es: 'Lunes' },
        slots: [
            { muscle: 'QUADS', setTarget: 4, reps: '6-12', exerciseId: 'sq_bar', supersetId: 'ss_reev_m_1', notes: 'Squats (BB or Hack) 3/4x6-12 + Seated cable rows OR Seal rows 3/4x8-15' },
            { muscle: 'BACK', setTarget: 4, reps: '8-15', exerciseId: 'seal_row', supersetId: 'ss_reev_m_1' },
            { muscle: 'CHEST', setTarget: 4, reps: '6-10', exerciseId: 'bp_inc', supersetId: 'ss_reev_m_2', notes: 'Incline press (DB or BB) OR Machine incline press 3/4x6-10 + Reverse curls (DB or BB) 3/4x6-12' },
            { muscle: 'BICEPS', setTarget: 4, reps: '6-12', exerciseId: 'curl_bar', supersetId: 'ss_reev_m_2' },
            { muscle: 'HAMSTRINGS', setTarget: 4, reps: '8-12', exerciseId: 'rdl', supersetId: 'gs_reev_m_3', notes: 'RDLs OR DB bench 4x8-12 + Upright rows (DB or BB) OR Lat pulldowns 4x10-15 + Neck curls 4x15-20' },
            { muscle: 'SHOULDERS', setTarget: 4, reps: '10-15', exerciseId: 'upright_row', supersetId: 'gs_reev_m_3' },
            { muscle: 'NECK', setTarget: 4, reps: '15-20', exerciseId: 'neck_curl', supersetId: 'gs_reev_m_3' },
            { muscle: 'BICEPS', setTarget: 4, reps: '12-15', exerciseId: 'curl_cable', supersetId: 'gs_reev_m_4', notes: 'Cable curls 4x12-15 + French press OR Lying triceps extensions 4x6-10 + Seated calf raises 4x15-20' },
            { muscle: 'TRICEPS', setTarget: 4, reps: '6-10', exerciseId: 'skull_crusher', supersetId: 'gs_reev_m_4' },
            { muscle: 'CALVES', setTarget: 4, reps: '15-20', exerciseId: 'calf_raise', supersetId: 'gs_reev_m_4' }
        ]
    },
    {
        id: 'd2', dayName: { en: 'Wednesday', es: 'Miércoles' },
        slots: [
            { muscle: 'BACK', setTarget: 4, reps: '8-10', exerciseId: 'bent_barbell_row', supersetId: 'ss_reev_w_1', notes: 'BB rows 3/4x8-10 OR Good mornings 3/4x6-12 + Wide-grip BB shrugs OR DB shrugs 3/4x12-20' },
            { muscle: 'TRAPS', setTarget: 4, reps: '12-20', exerciseId: 'shrug_db', supersetId: 'ss_reev_w_1' },
            { muscle: 'CHEST', setTarget: 4, reps: '6-10', exerciseId: 'dips', supersetId: 'ss_reev_w_2', notes: 'Weighted dips OR Close grip bench 3/4x6-10 + Split squats OR Smith/Dellinger squats 3/4x12-15' },
            { muscle: 'QUADS', setTarget: 4, reps: '12-15', exerciseId: 'bulgarian_split_squat', supersetId: 'ss_reev_w_2' },
            { muscle: 'BACK', setTarget: 3, reps: '4-6', exerciseId: 'chinup', supersetId: 'gs_reev_w_3', notes: 'Weighted chin-ups 3x4-6 + DB OR Machine shoulder press 3x6-10 OR Face-pulls 3x15 + Leg curls 3x12-15' },
            { muscle: 'SHOULDERS', setTarget: 3, reps: '6-10', exerciseId: 'ohp_db', supersetId: 'gs_reev_w_3' },
            { muscle: 'HAMSTRINGS', setTarget: 3, reps: '12-15', exerciseId: 'leg_curl', supersetId: 'gs_reev_w_3' },
            { muscle: 'BICEPS', setTarget: 4, reps: '10-15', exerciseId: 'curl_preacher', supersetId: 'gs_reev_w_4', notes: 'Pelican cable curls OR DB Fat grips Preacher curls 4x10-15 + Cable pushdowns 4x8-15 + Lat raises 3x15' },
            { muscle: 'TRICEPS', setTarget: 4, reps: '8-15', exerciseId: 'tri_push', supersetId: 'gs_reev_w_4' },
            { muscle: 'SHOULDERS', setTarget: 3, reps: '15', exerciseId: 'lat_raise', supersetId: 'gs_reev_w_4' }
        ]
    },
    {
        id: 'd3', dayName: { en: 'Friday', es: 'Viernes' },
        slots: [
            { muscle: 'BACK', setTarget: 3, reps: '3-5', exerciseId: 'deadlift', supersetId: 'ss_reev_f_1', notes: 'Deadlifts 3x3 OR 3x5 + Cable triceps extension OR Cable drag curls 3x10-12' },
            { muscle: 'TRICEPS', setTarget: 3, reps: '10-12', exerciseId: 'tri_push', supersetId: 'ss_reev_f_1' },
            { muscle: 'SHOULDERS', setTarget: 4, reps: '6-12', exerciseId: 'behind_neck_press', supersetId: 'ss_reev_f_2', notes: 'OHP (BB or DB) OR BTN 3/4x6-12 + DB pullovers 3/4x8-12' },
            { muscle: 'BACK', setTarget: 4, reps: '8-12', exerciseId: 'pullover_db', supersetId: 'ss_reev_f_2' },
            { muscle: 'QUADS', setTarget: 4, reps: '8-15', exerciseId: 'leg_press', supersetId: 'gs_reev_f_3', notes: 'Leg press 4x8-15 + DB / Cable chest flies OR DB/Guillotine press 4x10-15 + Hammer curls 4x8-12' },
            { muscle: 'CHEST', setTarget: 4, reps: '10-15', exerciseId: 'db_fly', supersetId: 'gs_reev_f_3' },
            { muscle: 'BICEPS', setTarget: 4, reps: '8-12', exerciseId: 'curl_hammer', supersetId: 'gs_reev_f_3' },
            { muscle: 'BACK', setTarget: 4, reps: '8-12', exerciseId: 'pullup', supersetId: 'gs_reev_f_4', notes: 'Wide-grip pull-ups 4x8-12 + Hyperextensions OR GHR 4x10-15 + Standing calf-raises 4x12-20' },
            { muscle: 'HAMSTRINGS', setTarget: 4, reps: '10-15', exerciseId: 'back_extension', supersetId: 'gs_reev_f_4' },
            { muscle: 'CALVES', setTarget: 4, reps: '12-20', exerciseId: 'calf_raise', supersetId: 'gs_reev_f_4' }
        ]
    }
];

export const NH_SILVER_ERA_ADVANCED: ProgramDay[] = [
    ...NH_SILVER_ERA,
    {
        id: 'd4', dayName: { en: 'Sunday', es: 'Domingo' },
        slots: [
            { muscle: 'CHEST', setTarget: 4, reps: '6-12', exerciseId: 'dips', supersetId: 'ss_reev_sun_1', notes: 'Weighted dips OR Close grip bench 4x6-12' },
            { muscle: 'BACK', setTarget: 4, reps: '8-12', exerciseId: 'row_mach', supersetId: 'ss_reev_sun_1', notes: 'Rowing machine OR DB rows 4x8-12' },
            { muscle: 'QUADS', setTarget: 3, reps: '10-15', exerciseId: 'leg_press', supersetId: 'ss_reev_sun_2', notes: 'Leg press 3x10-15 OR Good morning 3x6-10' },
            { muscle: 'SHOULDERS', setTarget: 3, reps: '10-15', exerciseId: 'rear_delt_fly', supersetId: 'ss_reev_sun_2', notes: 'Seated rear delt raises OR Cable lateral raises 3x10-15' },
            { muscle: 'BACK', setTarget: 4, reps: '4-8', exerciseId: 'neutral_chinup', supersetId: 'gs_reev_sun_3', notes: 'Weighted neutral grip pull-ups 4x4-8' },
            { muscle: 'FOREARMS', setTarget: 4, reps: '10-12', exerciseId: 'finger_curl', supersetId: 'gs_reev_sun_3', notes: 'Finger curls 4x10-12' },
            { muscle: 'TRAPS', setTarget: 4, reps: '15', exerciseId: 'shrug_bar', supersetId: 'gs_reev_sun_3', notes: 'High pulls OR Snatch grip shrugs 4x15' },
            { muscle: 'BICEPS', setTarget: 3, reps: '8-10', exerciseId: 'curl_ez', supersetId: 'gs_reev_sun_4', notes: 'EZ bar curls 3x8-10' },
            { muscle: 'TRICEPS', setTarget: 3, reps: '10-12', exerciseId: 'tri_ext', supersetId: 'gs_reev_sun_4', notes: 'Incline seated DB extensions 3x10-12' },
            { muscle: 'QUADS', setTarget: 3, reps: '12-15', exerciseId: 'goblet_sq', supersetId: 'gs_reev_sun_4', notes: 'Goblet squats OR Sissy squats 3x12-15' }
        ]
    }
];

export const NH_KRATOS_STAGE_1: ProgramDay[] = [
    {
        id: 'kratos_s1_d1', dayName: { en: 'Monday (Pull)', es: 'Lunes (Tracción)' },
        slots: [
            { muscle: 'BACK', setTarget: 3, reps: '3-8', exerciseId: 'dl_conv', notes: 'Deadlifts 3x3 OR RDLs 3x8-12' },
            { muscle: 'QUADS', setTarget: 4, reps: '10-15', exerciseId: 'sq_hack', supersetId: 'ss_kratos_s1_m_1' },
            { muscle: 'ABS', setTarget: 4, reps: 'AMRAP', exerciseId: 'sit_up', supersetId: 'ss_kratos_s1_m_1' },
            { muscle: 'BACK', setTarget: 4, reps: '6-12', exerciseId: 'close_grip_lat_pulldown', supersetId: 'gs_kratos_s1_m_2' },
            { muscle: 'BICEPS', setTarget: 4, reps: '8-12', exerciseId: 'curl_db', supersetId: 'gs_kratos_s1_m_2' },
            { muscle: 'QUADS', setTarget: 4, reps: '10-15', exerciseId: 'bulgarian_split_squat', supersetId: 'gs_kratos_s1_m_2' },
            { muscle: 'TRAPS', setTarget: 4, reps: '20', exerciseId: 'shrug_db', notes: 'SHRUGS BURN-OUT: 20RM to failure, rest 2m -> 1m -> 30s' }
        ]
    },
    {
        id: 'kratos_s1_d2', dayName: { en: 'Wednesday (Push)', es: 'Miércoles (Empuje)' },
        slots: [
            { muscle: 'CHEST', setTarget: 4, reps: '4-8', exerciseId: 'bp_bar', notes: 'Bench press 4x4-8 OR Dips 4x6-8' },
            { muscle: 'SHOULDERS', setTarget: 3, reps: '6-10', exerciseId: 'ohp_bar', supersetId: 'ss_kratos_s1_w_1' },
            { muscle: 'BACK', setTarget: 3, reps: '8-12', exerciseId: 'row_db', supersetId: 'ss_kratos_s1_w_1' },
            { muscle: 'SHOULDERS', setTarget: 4, reps: '10-15', exerciseId: 'lat_raise', supersetId: 'gs_kratos_s1_w_2' },
            { muscle: 'TRICEPS', setTarget: 4, reps: '8-12', exerciseId: 'tri_ext', supersetId: 'gs_kratos_s1_w_2' },
            { muscle: 'NECK', setTarget: 4, reps: '15-20', exerciseId: 'neck_curl', supersetId: 'gs_kratos_s1_w_2' },
            { muscle: 'SHOULDERS', setTarget: 4, reps: '20', exerciseId: 'rear_delt_fly', notes: 'REAR DELT ROWS BURN-OUT: 20RM to failure, rest 2m -> 1m -> 30s' }
        ]
    },
    {
        id: 'kratos_s1_d3', dayName: { en: 'Friday (Legs/Arms)', es: 'Viernes (Piernas/Brazos)' },
        slots: [
            { muscle: 'QUADS', setTarget: 3, reps: '6-10', exerciseId: 'sq_bar', notes: 'Squats 3x6-10 OR Leg press 3x10-15' },
            { muscle: 'BACK', setTarget: 4, reps: '4-6', exerciseId: 'pullup', supersetId: 'ss_kratos_s1_f_1' },
            { muscle: 'BICEPS', setTarget: 4, reps: '6-10', exerciseId: 'curl_ez', supersetId: 'ss_kratos_s1_f_1' },
            { muscle: 'HAMSTRINGS', setTarget: 4, reps: '12-15', exerciseId: 'back_extension', supersetId: 'gs_kratos_s1_f_2' },
            { muscle: 'TRICEPS', setTarget: 4, reps: '10-15', exerciseId: 'tri_push', supersetId: 'gs_kratos_s1_f_2' },
            { muscle: 'CALVES', setTarget: 4, reps: '15-20', exerciseId: 'calf_raise', supersetId: 'gs_kratos_s1_f_2' },
            { muscle: 'CHEST', setTarget: 4, reps: 'AMRAP', exerciseId: 'pushup', supersetId: 'ss_kratos_s1_f_3', notes: 'PUSH-UPS/ABS BURN-OUT: rest 3m -> 2m -> 1m -> 30s' },
            { muscle: 'ABS', setTarget: 4, reps: 'AMRAP', exerciseId: 'sit_up', supersetId: 'ss_kratos_s1_f_3' }
        ]
    }
];

export const NH_KRATOS_STAGE_2: ProgramDay[] = [
    NH_KRATOS_STAGE_1[0],
    NH_KRATOS_STAGE_1[1],
    {
        id: 'kratos_s2_d3', dayName: { en: 'Friday (Legs)', es: 'Viernes (Piernas)' },
        slots: [
            { muscle: 'QUADS', setTarget: 3, reps: '6-10', exerciseId: 'sq_bar', notes: 'Squats 3x6-10 OR Leg press 3x10-15' },
            { muscle: 'HAMSTRINGS', setTarget: 4, reps: '8-12', exerciseId: 'rdl', supersetId: 'ss_kratos_s2_f_1', notes: 'RDLs 4x8-12 OR Block pulls 4x6-12 + Russian twists 4x10-15' },
            { muscle: 'ABS', setTarget: 4, reps: '10-15', exerciseId: 'abs_cable', supersetId: 'ss_kratos_s2_f_1' },
            { muscle: 'BACK', setTarget: 4, reps: '4-6', exerciseId: 'pullup', supersetId: 'gs_kratos_s2_f_2' },
            { muscle: 'HAMSTRINGS', setTarget: 4, reps: '12-15', exerciseId: 'back_extension', supersetId: 'gs_kratos_s2_f_2' },
            { muscle: 'CALVES', setTarget: 4, reps: '15-20', exerciseId: 'calf_raise', supersetId: 'gs_kratos_s2_f_2' },
            { muscle: 'ABS', setTarget: 4, reps: 'AMRAP', exerciseId: 'sit_up', notes: 'ABS BURN-OUT: rest 3m -> 2m -> 1m -> 30s' }
        ]
    },
    {
        id: 'kratos_s2_d4', dayName: { en: 'Saturday (Arms)', es: 'Sábado (Brazos)' },
        slots: [
            { muscle: 'TRICEPS', setTarget: 3, reps: '6-10', exerciseId: 'close_grip_bench', notes: 'Close grip bench 3x6-10 OR Diamond push-ups 3xAMRAP' },
            { muscle: 'BICEPS', setTarget: 4, reps: '6-10', exerciseId: 'curl_ez', supersetId: 'ss_kratos_s2_s_1', notes: 'EZ bar curls 4x6-10 + Cross body triceps extensions 4x10-15' },
            { muscle: 'TRICEPS', setTarget: 4, reps: '10-15', exerciseId: 'tri_ext', supersetId: 'ss_kratos_s2_s_1' },
            { muscle: 'BICEPS', setTarget: 4, reps: '8-12', exerciseId: 'curl_hammer', supersetId: 'gs_kratos_s2_s_2' },
            { muscle: 'SHOULDERS', setTarget: 4, reps: '12-15', exerciseId: 'lat_raise_cable', supersetId: 'gs_kratos_s2_s_2' },
            { muscle: 'NECK', setTarget: 4, reps: '15-20', exerciseId: 'neck_ext', supersetId: 'gs_kratos_s2_s_2' }
        ]
    }
];

export const NH_KRATOS: ProgramDay[] = [
    {
        id: 'd1', dayName: { en: 'Monday (Upper 1)', es: 'Lunes (Torso 1)' },
        slots: [
            { muscle: 'CHEST', setTarget: 4, reps: '6-10', exerciseId: 'close_grip_bench', supersetId: 'ss_kratos_m_1', notes: 'Close grip bench press 4x6-10 OR Dips 4x4-8 + DB OR Meadows rows 4x8-12' },
            { muscle: 'BACK', setTarget: 4, reps: '8-12', exerciseId: 'row_db', supersetId: 'ss_kratos_m_1' },
            { muscle: 'SHOULDERS', setTarget: 3, reps: '6-10', exerciseId: 'ohp_db', supersetId: 'ss_kratos_m_2', notes: 'DB press OR Arnold press 3x6-10 + Cable/DB triceps extensions 3x8-12' },
            { muscle: 'TRICEPS', setTarget: 3, reps: '8-12', exerciseId: 'tri_ext', supersetId: 'ss_kratos_m_2' },
            { muscle: 'BACK', setTarget: 4, reps: '10-12', exerciseId: 'pullover_db', supersetId: 'gs_kratos_m_3', notes: 'DB pullovers OR Lat pulldowns 4x10-12 + Neck curls 4x15-20 + Rear delt rows 4xNO' },
            { muscle: 'NECK', setTarget: 4, reps: '15-20', exerciseId: 'neck_curl', supersetId: 'gs_kratos_m_3' },
            { muscle: 'SHOULDERS', setTarget: 4, reps: '15-20', exerciseId: 'rear_delt_fly', supersetId: 'gs_kratos_m_3' }
        ]
    },
    {
        id: 'd2', dayName: { en: 'Tuesday (Lower 1)', es: 'Martes (Piernas 1)' },
        slots: [
            { muscle: 'BACK', setTarget: 4, reps: '10-12', exerciseId: 'pendlay_row', supersetId: 'ss_kratos_t_1', notes: 'Barbell rows 4x10-12 OR Power cleans 4x6-10 + Seated OR Standing calf raises 4x15-20' },
            { muscle: 'CALVES', setTarget: 4, reps: '15-20', exerciseId: 'calf_raise', supersetId: 'ss_kratos_t_1' },
            { muscle: 'BACK', setTarget: 3, reps: '6-10', exerciseId: 'rack_pull', supersetId: 'ss_kratos_t_2', notes: 'Block pulls 3x6-10 OR Farmer carries 3x50m + Russian twists 3x12-15' },
            { muscle: 'ABS', setTarget: 3, reps: '12-15', exerciseId: 'abs_cable', supersetId: 'ss_kratos_t_2' },
            { muscle: 'QUADS', setTarget: 4, reps: '10-15', exerciseId: 'leg_press', supersetId: 'gs_kratos_t_3', notes: 'Leg press 4x10-15 OR Split squats 4x12-15 + DB OR Pinwheel curls 4x8-12 + Shrugs 4xNO' },
            { muscle: 'BICEPS', setTarget: 4, reps: '8-12', exerciseId: 'curl_hammer', supersetId: 'gs_kratos_t_3' },
            { muscle: 'TRAPS', setTarget: 4, reps: '15-20', exerciseId: 'shrug_db', supersetId: 'gs_kratos_t_3' }
        ]
    },
    {
        id: 'd3', dayName: { en: 'Thursday (Upper 2)', es: 'Jueves (Torso 2)' },
        slots: [
            { muscle: 'SHOULDERS', setTarget: 4, reps: '12-15', exerciseId: 'ohp', supersetId: 'ss_kratos_th_1', notes: 'DB/BB OHP 4x12-15 OR Viking press 4x8-12 + BB OR DB seal rows 4x10-15' },
            { muscle: 'BACK', setTarget: 4, reps: '10-15', exerciseId: 'seal_row', supersetId: 'ss_kratos_th_1' },
            { muscle: 'BACK', setTarget: 3, reps: '6-8', exerciseId: 'chinup', supersetId: 'ss_kratos_th_2', notes: 'Weighted chin-ups 3x6-8 OR DB OR Machine chest press 3x10-12 + Neck extensions 3x15-20' },
            { muscle: 'NECK', setTarget: 3, reps: '15-20', exerciseId: 'neck_ext', supersetId: 'ss_kratos_th_2' },
            { muscle: 'SHOULDERS', setTarget: 4, reps: '10-15', exerciseId: 'lat_raise', supersetId: 'gs_kratos_th_3', notes: 'Lateral raises OR Upright rows 4x10-15 + Cable curls OR pushdowns 4x12-15 + Rear delt rows 4xNO' },
            { muscle: 'BICEPS', setTarget: 4, reps: '12-15', exerciseId: 'curl_cable', supersetId: 'gs_kratos_th_3' },
            { muscle: 'SHOULDERS', setTarget: 4, reps: '15-20', exerciseId: 'rear_delt_fly', supersetId: 'gs_kratos_th_3' }
        ]
    },
    {
        id: 'd4', dayName: { en: 'Friday (Lower 2)', es: 'Viernes (Piernas 2)' },
        slots: [
            { muscle: 'QUADS', setTarget: 4, reps: '6-8', exerciseId: 'sq_bar', supersetId: 'ss_kratos_f_1', notes: 'Squats 4x6-8 OR Hack squats 4x10-15 + Hang pulls OR Snatch grip hang pulls 4x10-15' },
            { muscle: 'TRAPS', setTarget: 4, reps: '10-15', exerciseId: 'rack_pull', supersetId: 'ss_kratos_f_1' },
            { muscle: 'HAMSTRINGS', setTarget: 3, reps: '8-12', exerciseId: 'rdl', supersetId: 'ss_kratos_f_2', notes: 'RDLs 3x8-12 OR Block-pulls 3x6-10 + Decline sit-ups 3x12-15' },
            { muscle: 'ABS', setTarget: 3, reps: '12-15', exerciseId: 'sit_up', supersetId: 'ss_kratos_f_2' },
            { muscle: 'GLUTES', setTarget: 4, reps: '10-15', exerciseId: 'glute_bridge', supersetId: 'gs_kratos_f_3', notes: 'Hip thrusts 4x10-15 OR BB Hack squats 4x8-12 + Power shrugs OR Pendlay rows 4x8-10 + Shrugs 4xNO' },
            { muscle: 'BACK', setTarget: 4, reps: '8-10', exerciseId: 'pendlay_row', supersetId: 'gs_kratos_f_3' },
            { muscle: 'TRAPS', setTarget: 4, reps: '15-20', exerciseId: 'shrug_db', supersetId: 'gs_kratos_f_3' }
        ]
    },
    {
        id: 'd5', dayName: { en: 'Saturday (Arms)', es: 'Sábado (Brazos)' },
        slots: [
            { muscle: 'CHEST', setTarget: 3, reps: '6-10', exerciseId: 'bp_inc', supersetId: 'ss_kratos_s_1', notes: 'Viking press OR Landmine press OR Incline press 3x6-10 + Cable lateral raises 3x12-15' },
            { muscle: 'SHOULDERS', setTarget: 3, reps: '12-15', exerciseId: 'lat_raise_cable', supersetId: 'ss_kratos_s_1' },
            { muscle: 'BICEPS', setTarget: 4, reps: '8-10', exerciseId: 'curl_preacher', supersetId: 'ss_kratos_s_2', notes: 'EZ bar curls OR EZ bar preacher curls 4x8-10 + Cross-body OR Katana triceps extensions 4x8-12' },
            { muscle: 'TRICEPS', setTarget: 4, reps: '8-12', exerciseId: 'tri_ext', supersetId: 'ss_kratos_s_2' },
            { muscle: 'BICEPS', setTarget: 4, reps: '10-12', exerciseId: 'curl_hammer', supersetId: 'gs_kratos_s_3', notes: 'Hammer OR Towel curls 4x10-12 + Triceps push-downs 4x12-15 + Finger curls 4x10-15' },
            { muscle: 'TRICEPS', setTarget: 4, reps: '12-15', exerciseId: 'tri_push', supersetId: 'gs_kratos_s_3' },
            { muscle: 'FOREARMS', setTarget: 4, reps: '10-15', exerciseId: 'finger_curl', supersetId: 'gs_kratos_s_3' }
        ]
    }
];

export const NATURAL_HYPERTROPHY_TEMPLATES: GlobalTemplate[] = [
    // =========================================================
    // 1. BEGINNER (Ultimate Hypertrophy — Compendium 2.2 p. 4)
    // =========================================================
    {
        id: 'nh_ult_beginner',
        name: 'NH Ultimate Beginner',
        title: { en: 'Ultimate Hypertrophy (Beginner)', es: 'Hipertrofia Definitiva (Principiante)' },
        description: { en: 'Natural Hypertrophy - 3 days/week full body with exact supersets and giant sets.', es: 'Natural Hypertrophy - 3 días/semana cuerpo completo con superseries y series gigantes exactas.' },
        isPro: false,
        order: 200,
        defaultStageId: 'beginner',
        stages: NH_ULTIMATE_STAGES,
        program: NH_ULT_BEGINNER,
    },

    // =========================================================
    // 2. NOVICE (Ultimate Hypertrophy — Compendium 2.2 pp. 4-5)
    // =========================================================
    {
        id: 'nh_ult_novice',
        name: 'NH Ultimate Novice',
        title: { en: 'Ultimate Hypertrophy (Novice)', es: 'Hipertrofia Definitiva (Novato)' },
        description: { en: 'Natural Hypertrophy - 3 days/week full body novice routine with Compendium variations and giant sets.', es: 'Natural Hypertrophy - Rutina de novato de 3 días cuerpo completo con variaciones y series gigantes.' },
        isPro: false,
        order: 201,
        defaultStageId: 'novice',
        stages: NH_ULTIMATE_STAGES,
        program: NH_ULT_NOVICE,
    },

    // =========================================================
    // 3. BRIDGE (Ultimate Hypertrophy — Compendium 2.2 p. 5)
    // =========================================================
    {
        id: 'nh_ult_bridge',
        name: 'NH Ultimate Bridge',
        title: { en: 'Ultimate Hypertrophy (Bridge)', es: 'Hipertrofia Definitiva (Puente)' },
        description: { en: 'Natural Hypertrophy - 4-day transition program (Monday, Wednesday, Friday, Saturday).', es: 'Natural Hypertrophy - Rutina puente de 4 días (Lunes, Miércoles, Viernes, Sábado).' },
        isPro: true,
        order: 202,
        defaultStageId: 'bridge',
        stages: NH_ULTIMATE_STAGES,
        program: NH_ULT_BRIDGE,
    },

    // =========================================================
    // 4. INTERMEDIATE (Ultimate Hypertrophy — Compendium 2.2 pp. 5-6)
    // =========================================================
    {
        id: 'nh_ult_intermediate',
        name: 'NH Ultimate Intermediate',
        title: { en: 'Ultimate Hypertrophy (Intermediate)', es: 'Hipertrofia Definitiva (Intermedio)' },
        description: { en: 'Natural Hypertrophy - 5-day Upper / Lower / Arms / Upper / Lower split.', es: 'Natural Hypertrophy - Split de 5 días (Torso / Pierna / Brazos / Torso / Pierna).' },
        isPro: true,
        order: 203,
        defaultStageId: 'intermediate',
        stages: NH_ULTIMATE_STAGES,
        program: NH_ULT_INTERMEDIATE,
    },

    // =========================================================
    // 5. ADVANCED (Ultimate Hypertrophy — Compendium 2.2 pp. 6-7)
    // =========================================================
    {
        id: 'nh_ult_advanced',
        name: 'NH Ultimate Advanced',
        title: { en: 'Ultimate Hypertrophy (Advanced)', es: 'Hipertrofia Definitiva (Avanzado)' },
        description: { en: 'Natural Hypertrophy - 6-day high-density Upper/Lower split with giant sets.', es: 'Natural Hypertrophy - Split Torso/Pierna de 6 días con series gigantes.' },
        isPro: true,
        order: 204,
        defaultStageId: 'advanced',
        stages: NH_ULTIMATE_STAGES,
        program: NH_ULT_ADVANCED,
    },

    // =========================================================
    // 6. BAKI HANMA WEIGHT TRAINING (Program 2 — Compendium 2.2 p. 18)
    // =========================================================
    {
        id: 'nh_baki',
        name: 'NH Baki Hanma Weight Training',
        title: { en: 'Baki Hanma Weight Training', es: 'Baki Hanma Weight Training' },
        description: { en: 'Natural Hypertrophy - 3-day Hanma Weight Training (Program 2) with giant set finishers.', es: 'Natural Hypertrophy - Entrenamiento de pesas de 3 días (Programa 2) de Baki Hanma.' },
        isPro: true,
        order: 205,
        defaultStageId: 'prog_2',
        stages: [
            {
                id: 'prog_1',
                label: { en: 'Stage 1 · Calisthenics', es: 'Stage 1 · Calistenia' },
                subtitle: { en: '3 Days · Bodyweight & Bands', es: '3 Días · Peso Corporal y Bandas' },
                program: NH_BAKI_PROG_1,
            },
            {
                id: 'prog_2',
                label: { en: 'Stage 2 · Weight Training', es: 'Stage 2 · Pesas' },
                subtitle: { en: '3 Days · Standard Weights', es: '3 Días · Pesas Estándar' },
                program: NH_BAKI,
            },
            {
                id: 'prog_2_2',
                label: { en: 'Stage 3 · Adv. Weights', es: 'Stage 3 · Pesas Avanzado' },
                subtitle: { en: '3 Days · Advanced Weights', es: '3 Días · Pesas Avanzado' },
                program: NH_BAKI_PROG_2_2,
            },
        ],
        program: NH_BAKI,
    },

    // =========================================================
    // 7. TOJI FUSHIGURO V-TAPER WORKOUT (Stage 3 — Compendium 2.2 pp. 22-23)
    // =========================================================
    {
        id: 'nh_toji',
        name: 'NH Toji Fushiguro (V-Taper)',
        title: { en: 'Toji Fushiguro (V-Taper Workout)', es: 'Toji Fushiguro (Espalda V)' },
        description: { en: 'Natural Hypertrophy - Complete 4-day Stage 3 V-Taper specialization program.', es: 'Natural Hypertrophy - Programa oficial de 4 días (Stage 3) enfocado en estética V-Taper.' },
        isPro: true,
        order: 206,
        defaultStageId: 'stage_3',
        stages: [
            {
                id: 'stage_1',
                label: { en: 'Stage 1', es: 'Stage 1' },
                subtitle: { en: '3 Days · Novice V-Taper', es: '3 Días · V-Taper Novato' },
                program: NH_TOJI_STAGE_1,
            },
            {
                id: 'stage_2',
                label: { en: 'Stage 2', es: 'Stage 2' },
                subtitle: { en: '3 Days · Intermediate V-Taper', es: '3 Días · V-Taper Intermedio' },
                program: NH_TOJI_STAGE_2,
            },
            {
                id: 'stage_3',
                label: { en: 'Stage 3', es: 'Stage 3' },
                subtitle: { en: '4 Days · Complete V-Taper', es: '4 Días · V-Taper Completo' },
                program: NH_TOJI,
            },
        ],
        program: NH_TOJI,
    },

    // =========================================================
    // 8. DOOM SLAYER PPL (Compendium 2.2 pp. 29-30)
    // =========================================================
    {
        id: 'nh_doom_slayer',
        name: 'NH Doom Slayer PPL',
        title: { en: 'Doom Slayer PPL', es: 'Doom Slayer PPL' },
        description: { en: 'Natural Hypertrophy - 6-day Pull/Push/Legs brute-mass program.', es: 'Natural Hypertrophy - Programa Pull/Push/Legs de 6 días basado en Doom Slayer.' },
        isPro: true,
        order: 207,
        program: [
            {
                id: 'd1', dayName: { en: 'Pull 1', es: 'Tirón 1' },
                slots: [
                    { muscle: 'BACK', setTarget: 3, reps: '6-10', exerciseId: 'bent_barbell_row', supersetId: 'ss_doom_pull1_1', notes: 'Barbell row OR T-bar row 3x6-10 + Cable crunches OR Machine crunches 3x10-15' },
                    { muscle: 'ABS', setTarget: 3, reps: '10-15', exerciseId: 'abs_cable', supersetId: 'ss_doom_pull1_1' },
                    { muscle: 'BACK', setTarget: 3, reps: '10-15', exerciseId: 'high_machine_row', supersetId: 'ss_doom_pull1_2', notes: 'Machine high row OR Lat pulldowns 3x10-15 + Upright rows OR Y raises 3x10-15' },
                    { muscle: 'SHOULDERS', setTarget: 3, reps: '10-15', exerciseId: 'upright_row', supersetId: 'ss_doom_pull1_2' },
                    { muscle: 'NECK', setTarget: 3, reps: '15-20', exerciseId: 'neck_ext', supersetId: 'gs_doom_pull1_3', notes: 'Neck extensions 3x15-20 + Curls (DB or EZ) OR Cable curls 3x8-12 + Farmers carries 3x30m OR Shrugs (DB or BB) 3x10-15' },
                    { muscle: 'BICEPS', setTarget: 3, reps: '8-12', exerciseId: 'curl_db', supersetId: 'gs_doom_pull1_3' },
                    { muscle: 'TRAPS', setTarget: 3, reps: '30m', exerciseId: 'farmers_walk', supersetId: 'gs_doom_pull1_3' }
                ]
            },
            {
                id: 'd2', dayName: { en: 'Push 1', es: 'Empuje 1' },
                slots: [
                    { muscle: 'CHEST', setTarget: 3, reps: '6-10', exerciseId: 'dips', supersetId: 'ss_doom_push1_1', notes: 'Dips OR Bench press 3x6-10 + Rear delt row OR Reverse peck deck 3x10-15' },
                    { muscle: 'SHOULDERS', setTarget: 3, reps: '10-15', exerciseId: 'rear_delt_fly', supersetId: 'ss_doom_push1_1' },
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '8-12', exerciseId: 'ohp', supersetId: 'ss_doom_push1_2', notes: 'AD press OR Military press 4x8-12 + Hammer curls OR Reverse curls 4x8-12' },
                    { muscle: 'BICEPS', setTarget: 4, reps: '8-12', exerciseId: 'curl_hammer', supersetId: 'ss_doom_push1_2' },
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '10-15', exerciseId: 'lat_raise_cable', supersetId: 'gs_doom_push1_3', notes: 'Cable lateral raises OR Bulldozer lateral raises 4x10-15 + Crossbody extensions OR Katana extensions 4x8-12 + Cable chest flies OR Peck deck 4x6-10' },
                    { muscle: 'TRICEPS', setTarget: 4, reps: '8-12', exerciseId: 'tri_ext', supersetId: 'gs_doom_push1_3' },
                    { muscle: 'CHEST', setTarget: 4, reps: '6-10', exerciseId: 'pec_fly', supersetId: 'gs_doom_push1_3' }
                ]
            },
            {
                id: 'd3', dayName: { en: 'Legs 1', es: 'Piernas 1' },
                slots: [
                    { muscle: 'QUADS', setTarget: 3, reps: '6-10', exerciseId: 'sq_bar', supersetId: 'ss_doom_legs1_1', notes: 'Barbell back squat OR Hack squat 3x6-10 + Neck flexions 3x10-15' },
                    { muscle: 'NECK', setTarget: 3, reps: '10-15', exerciseId: 'neck_curl', supersetId: 'ss_doom_legs1_1' },
                    { muscle: 'HAMSTRINGS', setTarget: 4, reps: '8-12', exerciseId: 'back_extension', supersetId: 'ss_doom_legs1_2', notes: 'Hyperextensions OR Leg curls 4x8-12 + Russian twists OR Windshield wipers 4x10-15' },
                    { muscle: 'ABS', setTarget: 4, reps: '10-15', exerciseId: 'leg_raise', supersetId: 'ss_doom_legs1_2' },
                    { muscle: 'QUADS', setTarget: 3, reps: '10-15', exerciseId: 'leg_ext', supersetId: 'ss_doom_legs1_3', notes: 'Leg extensions OR Sissy squats 3x10-15 + Seated OR Donkey calf raises 3x15-20' },
                    { muscle: 'CALVES', setTarget: 3, reps: '15-20', exerciseId: 'calf_raise', supersetId: 'ss_doom_legs1_3' }
                ]
            },
            {
                id: 'd4', dayName: { en: 'Pull 2', es: 'Tirón 2' },
                slots: [
                    { muscle: 'BACK', setTarget: 3, reps: '3-5', exerciseId: 'pullup', supersetId: 'ss_doom_pull2_1', notes: 'Weighted pull-ups OR Weighted chin-ups 3x3-5 + Face-pulls OR Powell raises 3x10-15' },
                    { muscle: 'SHOULDERS', setTarget: 3, reps: '10-15', exerciseId: 'powell_raise', supersetId: 'ss_doom_pull2_1' },
                    { muscle: 'BACK', setTarget: 4, reps: '6-12', exerciseId: 'row_db', supersetId: 'ss_doom_pull2_2', notes: 'Kroc rows OR Meadows rows 4x6-12 + Goose neck wrist curls OR Pronation twists 4x10-15' },
                    { muscle: 'FOREARMS', setTarget: 4, reps: '10-15', exerciseId: 'wrist_curl', supersetId: 'ss_doom_pull2_2' },
                    { muscle: 'TRAPS', setTarget: 3, reps: '6-10', exerciseId: 'shrug_db', supersetId: 'ss_doom_pull2_3', notes: 'Power shrugs OR Block pulls 3x6-10 + Preacher curls (DB / EZ) OR Incline curls 3x6-12' },
                    { muscle: 'BICEPS', setTarget: 3, reps: '6-12', exerciseId: 'incline_db_curl', supersetId: 'ss_doom_pull2_3' }
                ]
            },
            {
                id: 'd5', dayName: { en: 'Push 2', es: 'Empuje 2' },
                slots: [
                    { muscle: 'CHEST', setTarget: 3, reps: '8-12', exerciseId: 'bp_inc', supersetId: 'ss_doom_push2_1', notes: 'Incline press (DB / BB) OR Incline smith press 3x8-12 + Neck flexions/extensions 3x10-15' },
                    { muscle: 'NECK', setTarget: 3, reps: '10-15', exerciseId: 'neck_ext', supersetId: 'ss_doom_push2_1' },
                    { muscle: 'CHEST', setTarget: 3, reps: '6-10', exerciseId: 'bp_flat', supersetId: 'ss_doom_push2_2', notes: 'Converging chest press OR Weighted push-ups 3x6-10 + Decline sit-ups OR Dragon flies 3x8-12' },
                    { muscle: 'ABS', setTarget: 3, reps: '8-12', exerciseId: 'sit_up', supersetId: 'ss_doom_push2_2' },
                    { muscle: 'TRICEPS', setTarget: 4, reps: '8-12', exerciseId: 'jm_press', supersetId: 'ss_doom_push2_3', notes: 'JM press (BB / Smith) OR Skull-crushers (DB / EZ) 4x8-12 + Hangman curls OR Hammer preacher curls 4x6-10' },
                    { muscle: 'BICEPS', setTarget: 4, reps: '6-10', exerciseId: 'curl_hammer', supersetId: 'ss_doom_push2_3' }
                ]
            },
            {
                id: 'd6', dayName: { en: 'Legs 2', es: 'Piernas 2' },
                slots: [
                    { muscle: 'HAMSTRINGS', setTarget: 2, reps: '6-12', exerciseId: 'rdl', supersetId: 'ss_doom_legs2_1', notes: 'RDLs OR Good mornings 2x6-12 + DB rear delt swings OR Incline DB shrugs 2x8-12' },
                    { muscle: 'SHOULDERS', setTarget: 2, reps: '8-12', exerciseId: 'rear_delt_fly', supersetId: 'ss_doom_legs2_1' },
                    { muscle: 'QUADS', setTarget: 3, reps: '8-12', exerciseId: 'leg_press', supersetId: 'ss_doom_legs2_2', notes: 'Smith machine squat OR Leg press 3x8-12 + Standing OR Leg press calf raises 3x10-15' },
                    { muscle: 'CALVES', setTarget: 3, reps: '10-15', exerciseId: 'calf_raise', supersetId: 'ss_doom_legs2_2' },
                    { muscle: 'HAMSTRINGS', setTarget: 3, reps: '10-15', exerciseId: 'lying_curl', supersetId: 'ss_doom_legs2_3', notes: 'GHR OR Nordic hamstring curls 3x10-15 + Dead-hangs 3x1min OR Wrist roller extensions 3x5' },
                    { muscle: 'FOREARMS', setTarget: 3, reps: '1min', exerciseId: 'farmers_walk', supersetId: 'ss_doom_legs2_3' }
                ]
            }
        ]
    },

    // =========================================================
    // 9. SUPERMAN AESTHETICS (Henry Cavill — Compendium 2.2 p. 30)
    // =========================================================
    {
        id: 'nh_superman',
        name: 'NH Superman Aesthetics',
        title: { en: 'Superman Aesthetics (Henry Cavill)', es: 'Superman Aesthetics (Henry Cavill)' },
        description: { en: 'Natural Hypertrophy - Build the Man of Steel physique with Upper, Lower & Full Body sessions.', es: 'Natural Hypertrophy - Construye el físico del Hombre de Acero (Torso, Pierna y Cuerpo Completo).' },
        isPro: true,
        order: 208,
        program: [
            {
                id: 'd1', dayName: { en: 'Monday (Upper)', es: 'Lunes (Torso)' },
                slots: [
                    { muscle: 'CHEST', setTarget: 4, reps: '4-10', exerciseId: 'bp_bar', supersetId: 'ss_sup_m_1', notes: 'Bench press OR Dips OR Weighted push-ups 4x4-10 + DB OR Machine rows 4x6-12' },
                    { muscle: 'BACK', setTarget: 4, reps: '6-12', exerciseId: 'row_mach', supersetId: 'ss_sup_m_1' },
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '6-10', exerciseId: 'ohp', supersetId: 'gs_sup_m_2', notes: 'BB, DB OR Machine overhead press 3/4x6-10 + DB OR EZ bar curls 3/4x8-12 + Decline sit-ups 3/4x10-15' },
                    { muscle: 'BICEPS', setTarget: 4, reps: '8-12', exerciseId: 'curl_ez', supersetId: 'gs_sup_m_2' },
                    { muscle: 'ABS', setTarget: 4, reps: '10-15', exerciseId: 'sit_up', supersetId: 'gs_sup_m_2' },
                    { muscle: 'CHEST', setTarget: 4, reps: '12-15', exerciseId: 'pec_fly', supersetId: 'gs_sup_m_3', notes: 'Cable flies OR Bent arm peck deck 4x12-15 + Upright rows OR Lateral raises 4x10-15 + Reverse OR Hammer curls 4x8-12' },
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '10-15', exerciseId: 'upright_row', supersetId: 'gs_sup_m_3' },
                    { muscle: 'BICEPS', setTarget: 4, reps: '8-12', exerciseId: 'curl_hammer', supersetId: 'gs_sup_m_3' }
                ]
            },
            {
                id: 'd2', dayName: { en: 'Wednesday (Lower)', es: 'Miércoles (Piernas)' },
                slots: [
                    { muscle: 'QUADS', setTarget: 3, reps: '6-8', exerciseId: 'zercher_squat', supersetId: 'ss_sup_w_1', notes: 'BB OR Zercher squats 3x6-8 OR Belt, Hack squats or Leg press 4x6-12 + Neck extensions 4x10-15' },
                    { muscle: 'NECK', setTarget: 4, reps: '10-15', exerciseId: 'neck_ext', supersetId: 'ss_sup_w_1' },
                    { muscle: 'HAMSTRINGS', setTarget: 4, reps: '8-12', exerciseId: 'rdl', supersetId: 'gs_sup_w_2', notes: 'RDLs OR Block pulls 3/4x8-12 + Behind the back cable curls 3/4x10-12 + Seated calf raises 3/4x15-20' },
                    { muscle: 'BICEPS', setTarget: 4, reps: '10-12', exerciseId: 'curl_cable', supersetId: 'gs_sup_w_2' },
                    { muscle: 'CALVES', setTarget: 4, reps: '15-20', exerciseId: 'calf_raise', supersetId: 'gs_sup_w_2' },
                    { muscle: 'BACK', setTarget: 4, reps: '8-12', exerciseId: 'lat_pull', supersetId: 'gs_sup_w_3', notes: 'Lat pulldowns 4x8-12 OR Weighted pull-ups 4x6-8 + DB or Upper chest shrugs 4x12-15 + French press OR Behind the head cable extension 4x10-12' },
                    { muscle: 'TRAPS', setTarget: 4, reps: '12-15', exerciseId: 'shrug_db', supersetId: 'gs_sup_w_3' },
                    { muscle: 'TRICEPS', setTarget: 4, reps: '10-12', exerciseId: 'tri_ext', supersetId: 'gs_sup_w_3' }
                ]
            },
            {
                id: 'd3', dayName: { en: 'Friday (Full Body)', es: 'Viernes (Full Body)' },
                slots: [
                    { muscle: 'CHEST', setTarget: 4, reps: '6-12', exerciseId: 'bp_inc', supersetId: 'ss_sup_f_1', notes: 'Incline press OR Viking press 3/4x6-12 + Krock rows OR DB pullovers 3/4x8-12' },
                    { muscle: 'BACK', setTarget: 4, reps: '8-12', exerciseId: 'row_db', supersetId: 'ss_sup_f_1' },
                    { muscle: 'TRAPS', setTarget: 3, reps: '30m', exerciseId: 'farmers_walk', supersetId: 'gs_sup_f_2', notes: 'Farmers carry 3x30m OR Trap bar deadlift 3x6-10 + Cable lateral raises OR Incline cable flies 3x12-15 + Russian twists OR Leg raises 3x15-20' },
                    { muscle: 'SHOULDERS', setTarget: 3, reps: '12-15', exerciseId: 'lat_raise_cable', supersetId: 'gs_sup_f_2' },
                    { muscle: 'ABS', setTarget: 3, reps: '15-20', exerciseId: 'leg_raise', supersetId: 'gs_sup_f_2' },
                    { muscle: 'QUADS', setTarget: 4, reps: '15-20', exerciseId: 'bulgarian_split_squat', supersetId: 'gs_sup_f_3', notes: 'LOWER BODY TWIST: Leg extensions OR Split squats 4x15-20 (OR UPPER BODY TWIST: Machine/DB chest press 4x8-12) + Pinwheel OR Hammer curls 4x10-12 + Neck flexions 4x10-15' },
                    { muscle: 'BICEPS', setTarget: 4, reps: '10-12', exerciseId: 'curl_hammer', supersetId: 'gs_sup_f_3' },
                    { muscle: 'NECK', setTarget: 4, reps: '10-15', exerciseId: 'neck_curl', supersetId: 'gs_sup_f_3' }
                ]
            }
        ]
    },

    // =========================================================
    // 10. GENTLEMAN SPLIT COMPLETE (Compendium 2.2 p. 11)
    // =========================================================
    {
        id: 'nh_gentleman_split',
        name: 'NH Gentleman Split Complete',
        title: { en: 'Gentleman Split Complete', es: 'Gentleman Split Completo' },
        description: { en: 'Natural Hypertrophy - The complete 5-day Gentleman Split (OHP / Squats / Bench / Deadlifts / Arms).', es: 'Natural Hypertrophy - El legendario split clásico de 5 días (OHP / Sentadilla / Banca / Peso Muerto / Brazos).' },
        isPro: true,
        order: 209,
        program: [
            {
                id: 'd1', dayName: { en: 'Monday (Upper – OHP)', es: 'Lunes (Torso – OHP)' },
                slots: [
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '2-5', exerciseId: 'ohp', notes: 'BB OHP 2-5 reps / 3-4 sets' },
                    { muscle: 'BICEPS', setTarget: 4, reps: '6-10', exerciseId: 'curl_ez', supersetId: 'gs_gent_m_1', notes: 'EZ bar curls 6-10 + Skull-crushers 8-12 + Pendlay rows 6-10 (3-4 sets)' },
                    { muscle: 'TRICEPS', setTarget: 4, reps: '8-12', exerciseId: 'skull_crusher', supersetId: 'gs_gent_m_1' },
                    { muscle: 'BACK', setTarget: 4, reps: '6-10', exerciseId: 'pendlay_row', supersetId: 'gs_gent_m_1' },
                    { muscle: 'BACK', setTarget: 4, reps: 'AMRAP', exerciseId: 'chinup', supersetId: 'gs_gent_m_2', notes: 'Chin-ups (not weighted) AMRAP + Cable lateral raises 10-15 + BB shrugs 10-15 (4 sets)' },
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '10-15', exerciseId: 'lat_raise_cable', supersetId: 'gs_gent_m_2' },
                    { muscle: 'TRAPS', setTarget: 4, reps: '10-15', exerciseId: 'shrug_db', supersetId: 'gs_gent_m_2' },
                    { muscle: 'CHEST', setTarget: 3, reps: 'AMRAP', exerciseId: 'diamond_pushup', supersetId: 'gs_gent_m_3', notes: 'Diamond push-ups + Knee raises + Calf raises (unweighted) AMRAP' },
                    { muscle: 'ABS', setTarget: 3, reps: 'AMRAP', exerciseId: 'knee_raise', supersetId: 'gs_gent_m_3' },
                    { muscle: 'CALVES', setTarget: 3, reps: 'AMRAP', exerciseId: 'calf_raise', supersetId: 'gs_gent_m_3' }
                ]
            },
            {
                id: 'd2', dayName: { en: 'Tuesday (Lower – Squats)', es: 'Martes (Pierna – Sentadilla)' },
                slots: [
                    { muscle: 'QUADS', setTarget: 3, reps: '4-8', exerciseId: 'sq_bar', notes: 'Squats 1-3 sets / 4-8 reps' },
                    { muscle: 'QUADS', setTarget: 3, reps: '4-8', exerciseId: 'sq_paused', notes: 'Back-off set or variation 3 sets / 4-8 reps' },
                    { muscle: 'HAMSTRINGS', setTarget: 4, reps: '6-10', exerciseId: 'sldl', supersetId: 'gs_gent_t_1', notes: 'Stiff-legged deadlifts 6-10 (or Back hyperextensions 8-12) + Pull-ups (weighted) 4-6 + Leg raises AMRAP (4 sets)' },
                    { muscle: 'BACK', setTarget: 4, reps: '4-6', exerciseId: 'pullup', supersetId: 'gs_gent_t_1' },
                    { muscle: 'ABS', setTarget: 4, reps: 'AMRAP', exerciseId: 'leg_raise', supersetId: 'gs_gent_t_1' },
                    { muscle: 'CALVES', setTarget: 4, reps: '10-15', exerciseId: 'calf_raise', supersetId: 'gs_gent_t_2', notes: 'Calf raises (weighted) 10-15 + Neck work 10-15 + Leg raises AMRAP (4 sets)' },
                    { muscle: 'NECK', setTarget: 4, reps: '10-15', exerciseId: 'neck_curl', supersetId: 'gs_gent_t_2' },
                    { muscle: 'ABS', setTarget: 4, reps: 'AMRAP', exerciseId: 'leg_raise', supersetId: 'gs_gent_t_2' }
                ]
            },
            {
                id: 'd3', dayName: { en: 'Thursday (Upper – Bench)', es: 'Jueves (Torso – Banca)' },
                slots: [
                    { muscle: 'CHEST', setTarget: 3, reps: '4-6', exerciseId: 'bp_bar', notes: 'Bench 4-6 reps / 3 sets' },
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '8-12', exerciseId: 'ohp_db', supersetId: 'ss_gent_th_1', notes: 'Dumbbell OHP 8-12 + French press 6-10 (4 sets)' },
                    { muscle: 'TRICEPS', setTarget: 4, reps: '6-10', exerciseId: 'tri_ext', supersetId: 'ss_gent_th_1' },
                    { muscle: 'BACK', setTarget: 4, reps: '4-6', exerciseId: 'chinup', supersetId: 'gs_gent_th_2', notes: 'Chin ups (weighted) 4-6 + Knee raises AMRAP + Wrist curls 8-12 (4 sets)' },
                    { muscle: 'ABS', setTarget: 4, reps: 'AMRAP', exerciseId: 'knee_raise', supersetId: 'gs_gent_th_2' },
                    { muscle: 'FOREARMS', setTarget: 4, reps: '8-12', exerciseId: 'wrist_curl', supersetId: 'gs_gent_th_2' },
                    { muscle: 'BICEPS', setTarget: 3, reps: '6-10', exerciseId: 'curl_hammer', supersetId: 'gs_gent_th_3', notes: 'Hammer curls 6-10 + Rear delt flies 8-12 + Triceps extension 10-15 (3 sets)' },
                    { muscle: 'SHOULDERS', setTarget: 3, reps: '8-12', exerciseId: 'rear_delt_fly', supersetId: 'gs_gent_th_3' },
                    { muscle: 'TRICEPS', setTarget: 3, reps: '10-15', exerciseId: 'tri_push', supersetId: 'gs_gent_th_3' },
                    { muscle: 'NECK', setTarget: 4, reps: '8-12', exerciseId: 'neck_curl', supersetId: 'gs_gent_th_4', notes: 'Neck work 8-12 + Crunches AMRAP + Calf raises (weighted) 8-12 (4 sets)' },
                    { muscle: 'ABS', setTarget: 4, reps: 'AMRAP', exerciseId: 'abs_cable', supersetId: 'gs_gent_th_4' },
                    { muscle: 'CALVES', setTarget: 4, reps: '8-12', exerciseId: 'calf_raise', supersetId: 'gs_gent_th_4' }
                ]
            },
            {
                id: 'd4', dayName: { en: 'Friday (Lower – Deadlifts)', es: 'Viernes (Pierna – Peso Muerto)' },
                slots: [
                    { muscle: 'BACK', setTarget: 3, reps: '2-5', exerciseId: 'deadlift', notes: 'Deadlifts 2-5 reps / 1-3 sets' },
                    { muscle: 'QUADS', setTarget: 4, reps: '8-12', exerciseId: 'sq_hack', notes: 'Deadlift back-off set 2-5 reps (1-3 sets) OR Squat variation 8-12 reps (3-4 sets)' },
                    { muscle: 'BACK', setTarget: 4, reps: '8-12', exerciseId: 'rack_pull', supersetId: 'gs_gent_f_1', notes: 'Rack pulls 8-12 + Pull-ups (not weighted) AMRAP + Leg raises AMRAP (3-4 sets)' },
                    { muscle: 'BACK', setTarget: 4, reps: 'AMRAP', exerciseId: 'pullup', supersetId: 'gs_gent_f_1' },
                    { muscle: 'ABS', setTarget: 4, reps: 'AMRAP', exerciseId: 'leg_raise', supersetId: 'gs_gent_f_1' },
                    { muscle: 'TRAPS', setTarget: 4, reps: '10-15', exerciseId: 'shrug_db', supersetId: 'gs_gent_f_2', notes: 'Nippard shrugs 10-15 + Pull-ups (not weighted) AMRAP + Leg raises AMRAP (3-4 sets)' },
                    { muscle: 'BACK', setTarget: 4, reps: 'AMRAP', exerciseId: 'pullup', supersetId: 'gs_gent_f_2' },
                    { muscle: 'ABS', setTarget: 4, reps: 'AMRAP', exerciseId: 'leg_raise', supersetId: 'gs_gent_f_2' }
                ]
            },
            {
                id: 'd5', dayName: { en: 'Saturday (Upper – Arms)', es: 'Sábado (Torso – Brazos)' },
                slots: [
                    { muscle: 'BICEPS', setTarget: 4, reps: '8-12', exerciseId: 'curl_hammer', supersetId: 'gs_gent_s_1', notes: 'Hammer/supinated curls 8-12 + Standing dumbbell OHP 6-10 + Standing French press 6-10 + Seal rows 8-12 (2-4 sets)' },
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '6-10', exerciseId: 'ohp_db', supersetId: 'gs_gent_s_1' },
                    { muscle: 'TRICEPS', setTarget: 4, reps: '6-10', exerciseId: 'tri_ext', supersetId: 'gs_gent_s_1' },
                    { muscle: 'BACK', setTarget: 4, reps: '8-12', exerciseId: 'seal_row', supersetId: 'gs_gent_s_1' },
                    { muscle: 'BICEPS', setTarget: 4, reps: '8-12', exerciseId: 'curl_preacher', supersetId: 'gs_gent_s_2', notes: 'EZ bar preacher curls 8-12 + Cable lateral raises 10-15 + Face pulls 15-20 + DB rows 8-12 (2-4 sets)' },
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '10-15', exerciseId: 'lat_raise_cable', supersetId: 'gs_gent_s_2' },
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '15-20', exerciseId: 'face_pull', supersetId: 'gs_gent_s_2' },
                    { muscle: 'BACK', setTarget: 4, reps: '8-12', exerciseId: 'row_db', supersetId: 'gs_gent_s_2' },
                    { muscle: 'CALVES', setTarget: 4, reps: '10-15', exerciseId: 'calf_raise', supersetId: 'gs_gent_s_3', notes: 'Calf raises (weighted) 10-15 + Neck work 10-15 + Knee raises AMRAP + Wrist curls 8-12 (4 sets)' },
                    { muscle: 'NECK', setTarget: 4, reps: '10-15', exerciseId: 'neck_ext', supersetId: 'gs_gent_s_3' },
                    { muscle: 'ABS', setTarget: 4, reps: 'AMRAP', exerciseId: 'knee_raise', supersetId: 'gs_gent_s_3' },
                    { muscle: 'FOREARMS', setTarget: 4, reps: '8-12', exerciseId: 'wrist_curl', supersetId: 'gs_gent_s_3' }
                ]
            }
        ]
    },

    // =========================================================
    // 11. SILVER ERA AESTHETICS (Steve Reeves — Compendium 2.2 p. 33)
    // =========================================================
    {
        id: 'nh_silver_era',
        name: 'NH Silver Era Reeves',
        title: { en: 'Silver Era Aesthetics (Steve Reeves)', es: 'Era de Plata (Steve Reeves)' },
        description: { en: 'Natural Hypertrophy - Classic 3-day full body Silver Era program for symmetric aesthetics.', es: 'Natural Hypertrophy - Programa clásico de 3 días cuerpo completo (Steve Reeves) para simetría y estética.' },
        isPro: true,
        order: 210,
        defaultStageId: 'intermediate',
        stages: [
            {
                id: 'intermediate',
                label: { en: 'Stage 1 · Intermediate', es: 'Stage 1 · Intermedio' },
                subtitle: { en: '3 Days · Mon / Wed / Fri', es: '3 Días · Lun / Mié / Vie' },
                program: NH_SILVER_ERA,
            },
            {
                id: 'advanced',
                label: { en: 'Stage 2 · Advanced', es: 'Stage 2 · Avanzado' },
                subtitle: { en: '4 Days · + Sunday Session', es: '4 Días · + Sesión de Domingo' },
                program: NH_SILVER_ERA_ADVANCED,
            },
        ],
        program: NH_SILVER_ERA,
    },

    // =========================================================
    // 12. APOLLONIAN PHYSIQUE (Greek Aesthetics — Compendium 2.2 p. 31)
    // =========================================================
    {
        id: 'nh_apollonian',
        name: 'NH Apollonian Physique',
        title: { en: 'Apollonian Physique', es: 'Físico Apolíneo' },
        description: { en: 'Natural Hypertrophy - 4-day Greek Aesthetics split (Upper / Upper-Lower Hybrid / Arms-Upper Hybrid / Lower).', es: 'Natural Hypertrophy - Split Griego de 4 días (Torso / Híbrido Torso-Pierna / Híbrido Brazos-Torso / Pierna).' },
        isPro: true,
        order: 211,
        program: [
            {
                id: 'd1', dayName: { en: 'Day 1: Upper', es: 'Día 1: Torso' },
                slots: [
                    { muscle: 'CHEST', setTarget: 3, reps: '6-10', exerciseId: 'bp_bar', supersetId: 'ss_apol_m_1', notes: 'Bench press OR Dips OR Weighted push-ups 3x6-10 + DB rows 3x8-12 OR Reverse rows 3xAMRAP' },
                    { muscle: 'BACK', setTarget: 3, reps: '8-12', exerciseId: 'row_db', supersetId: 'ss_apol_m_1' },
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '6-12', exerciseId: 'ohp_db', supersetId: 'gs_apol_m_2', notes: 'DB or BB OHP 4x6-12 + Abs (Ω) + French press OR Skull-crushers 4x8-12 + Hammer curls 4x6-10 (+ Lats Δ Nucleus Overload)' },
                    { muscle: 'ABS', setTarget: 4, reps: 'AMRAP', exerciseId: 'leg_raise', supersetId: 'gs_apol_m_2' },
                    { muscle: 'TRICEPS', setTarget: 4, reps: '8-12', exerciseId: 'skull_crusher', supersetId: 'gs_apol_m_2' },
                    { muscle: 'BICEPS', setTarget: 4, reps: '6-10', exerciseId: 'curl_hammer', supersetId: 'gs_apol_m_2' }
                ]
            },
            {
                id: 'd2', dayName: { en: 'Day 2: Upper/Lower Hybrid', es: 'Día 2: Híbrido Torso/Pierna' },
                slots: [
                    { muscle: 'HAMSTRINGS', setTarget: 3, reps: '8-12', exerciseId: 'rdl', supersetId: 'ss_apol_w_1', notes: 'Deadlifts 3x3 OR RDLs 3x8-12 OR Good mornings 3x6-12 + Seated calf raises 3x15-20' },
                    { muscle: 'CALVES', setTarget: 3, reps: '15-20', exerciseId: 'calf_raise', supersetId: 'ss_apol_w_1' },
                    { muscle: 'BACK', setTarget: 4, reps: '4-8', exerciseId: 'pullup', supersetId: 'gs_apol_w_2', notes: 'Weighted pull-ups 4x4-8 + Lunges OR Bulgarian split squats 4x10-15 + Shrugs 4x12-15 (+ Shoulders Θ Nucleus Overload)' },
                    { muscle: 'QUADS', setTarget: 4, reps: '10-15', exerciseId: 'bulgarian_split_squat', supersetId: 'gs_apol_w_2' },
                    { muscle: 'TRAPS', setTarget: 4, reps: '12-15', exerciseId: 'shrug_db', supersetId: 'gs_apol_w_2' }
                ]
            },
            {
                id: 'd3', dayName: { en: 'Day 3: Arms/Upper Hybrid', es: 'Día 3: Híbrido Brazos/Torso' },
                slots: [
                    { muscle: 'CHEST', setTarget: 3, reps: '6-10', exerciseId: 'close_grip_bench', supersetId: 'ss_apol_f_1', notes: 'Close grip bench 3x6-10 OR Diamond push-ups AMRAP + Seal rows OR Pendlay rows 3x8-12 (+ Lats Δ Nucleus Overload)' },
                    { muscle: 'BACK', setTarget: 3, reps: '8-12', exerciseId: 'seal_row', supersetId: 'ss_apol_f_1' },
                    { muscle: 'BICEPS', setTarget: 3, reps: '6-8', exerciseId: 'curl_db', supersetId: 'gs_apol_f_2', notes: 'BB or DB curls 3x6-8 + Upright rows OR Lateral raises 3x12-15 + Abs (Ω) + Triceps push-downs 3x15-20' },
                    { muscle: 'SHOULDERS', setTarget: 3, reps: '12-15', exerciseId: 'upright_row', supersetId: 'gs_apol_f_2' },
                    { muscle: 'ABS', setTarget: 3, reps: 'AMRAP', exerciseId: 'sit_up', supersetId: 'gs_apol_f_2' },
                    { muscle: 'TRICEPS', setTarget: 3, reps: '15-20', exerciseId: 'tri_push', supersetId: 'gs_apol_f_2' }
                ]
            },
            {
                id: 'd4', dayName: { en: 'Day 4: Lower', es: 'Día 4: Pierna' },
                slots: [
                    { muscle: 'QUADS', setTarget: 3, reps: '6-10', exerciseId: 'sq_bar', supersetId: 'ss_apol_s_1', notes: 'Squats 3x6-10 OR Leg press 3x8-12 OR Hack squats 3x10-12 + Seated calf raises 3x15-20' },
                    { muscle: 'CALVES', setTarget: 3, reps: '15-20', exerciseId: 'calf_raise', supersetId: 'ss_apol_s_1' },
                    { muscle: 'HAMSTRINGS', setTarget: 4, reps: '12-15', exerciseId: 'back_extension', supersetId: 'gs_apol_s_2', notes: 'Hyperextensions OR Single-leg DB RDLs 4x12-15 + Decline crunches AMRAP + Neck curls AMRAP (+ Shoulders Θ Nucleus Overload)' },
                    { muscle: 'ABS', setTarget: 4, reps: 'AMRAP', exerciseId: 'sit_up', supersetId: 'gs_apol_s_2' },
                    { muscle: 'NECK', setTarget: 4, reps: 'AMRAP', exerciseId: 'neck_curl', supersetId: 'gs_apol_s_2' }
                ]
            }
        ]
    },

    // =========================================================
    // 13. ALEX EUBANK REVAMPED GREEK GOD (Compendium 2.2 p. 42)
    // =========================================================
    {
        id: 'nh_alex_eubank',
        name: 'NH Revamped Greek God (Eubank)',
        title: { en: 'Revamped Greek God Program', es: 'Programa Dios Griego Mejorado (Alex Eubank)' },
        description: { en: 'Natural Hypertrophy - Revamped 4-day Greek God program (Chest/Back/Shoulders/Triceps & Legs/Arms).', es: 'Natural Hypertrophy - Programa Dios Griego renovado de 4 días (Torso y Pierna/Brazos).' },
        isPro: true,
        order: 212,
        program: [
            {
                id: 'd1', dayName: { en: 'Monday (Chest/Back/Shoulders/Triceps)', es: 'Lunes (Pecho/Espalda/Hombro/Tríceps)' },
                slots: [
                    { muscle: 'CHEST', setTarget: 4, reps: '6-12', exerciseId: 'bp_bar', supersetId: 'ss_eub_m_1', notes: 'Bench press (DB or BB) 4x6-12 + Straight arm pulldown 4x10-15' },
                    { muscle: 'BACK', setTarget: 4, reps: '10-15', exerciseId: 'lat_prayer', supersetId: 'ss_eub_m_1' },
                    { muscle: 'BACK', setTarget: 4, reps: '8-12', exerciseId: 'bent_barbell_row', supersetId: 'ss_eub_m_2', notes: 'Barbell row 4x8-12 + DB shoulder press 4x6-10' },
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '6-10', exerciseId: 'ohp_db', supersetId: 'ss_eub_m_2' },
                    { muscle: 'TRICEPS', setTarget: 4, reps: '8-10', exerciseId: 'skull_crusher', supersetId: 'gs_eub_m_3', notes: 'Skull-crushers 4x8-10 + Lateral raises 4x12-15 + Decline bench sit-ups 4x10-20' },
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '12-15', exerciseId: 'lat_raise', supersetId: 'gs_eub_m_3' },
                    { muscle: 'ABS', setTarget: 4, reps: '10-20', exerciseId: 'sit_up', supersetId: 'gs_eub_m_3' }
                ]
            },
            {
                id: 'd2', dayName: { en: 'Wednesday (Legs/Arms)', es: 'Miércoles (Pierna/Brazo)' },
                slots: [
                    { muscle: 'QUADS', setTarget: 4, reps: '4-8', exerciseId: 'sq_bar', supersetId: 'ss_eub_w_1', notes: 'Barbell squats 4x4-8 + Neck curls 4x15-20' },
                    { muscle: 'NECK', setTarget: 4, reps: '15-20', exerciseId: 'neck_curl', supersetId: 'ss_eub_w_1' },
                    { muscle: 'HAMSTRINGS', setTarget: 4, reps: '8-12', exerciseId: 'rdl', supersetId: 'ss_eub_w_2', notes: 'RDLs 4x8-12 + EZ bar curls 4x6-10' },
                    { muscle: 'BICEPS', setTarget: 4, reps: '6-10', exerciseId: 'curl_ez', supersetId: 'ss_eub_w_2' },
                    { muscle: 'QUADS', setTarget: 4, reps: '15-18', exerciseId: 'leg_ext', supersetId: 'gs_eub_w_3', notes: 'Leg extensions 4x15-18 + Hammer curls 4x8-12 + Seated calf raises 4x15-20' },
                    { muscle: 'BICEPS', setTarget: 4, reps: '8-12', exerciseId: 'curl_hammer', supersetId: 'gs_eub_w_3' },
                    { muscle: 'CALVES', setTarget: 4, reps: '15-20', exerciseId: 'calf_raise', supersetId: 'gs_eub_w_3' }
                ]
            },
            {
                id: 'd3', dayName: { en: 'Thursday (Chest/Back/Shoulders/Triceps)', es: 'Jueves (Pecho/Espalda/Hombro/Tríceps)' },
                slots: [
                    { muscle: 'CHEST', setTarget: 4, reps: '6-10', exerciseId: 'bp_inc', supersetId: 'ss_eub_th_1', notes: 'Incline DB or BB press 4x6-10 + Close grip pulldowns 4x8-15' },
                    { muscle: 'BACK', setTarget: 4, reps: '8-15', exerciseId: 'close_grip_lat_pulldown', supersetId: 'ss_eub_th_1' },
                    { muscle: 'BACK', setTarget: 4, reps: '10-15', exerciseId: 'row_cable', supersetId: 'ss_eub_th_2', notes: 'Seated cable rows 4x10-15 + Flat DB fly 4x12-15' },
                    { muscle: 'CHEST', setTarget: 4, reps: '12-15', exerciseId: 'db_fly', supersetId: 'ss_eub_th_2' },
                    { muscle: 'TRICEPS', setTarget: 4, reps: '10-12', exerciseId: 'skull_crusher', supersetId: 'gs_eub_th_3', notes: 'DB Skull-crushers 4x10-12 + Upright rows 4x8-10 + V sit-ups 4xAMRAP' },
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '8-10', exerciseId: 'upright_row', supersetId: 'gs_eub_th_3' },
                    { muscle: 'ABS', setTarget: 4, reps: 'AMRAP', exerciseId: 'sit_up', supersetId: 'gs_eub_th_3' }
                ]
            },
            {
                id: 'd4', dayName: { en: 'Saturday (Legs/Arms)', es: 'Sábado (Pierna/Brazo)' },
                slots: [
                    { muscle: 'BACK', setTarget: 3, reps: '3-5', exerciseId: 'deadlift', supersetId: 'ss_eub_s_1', notes: 'Deadlifts 3x3 or 3x5 + Neck curls 3x10-15' },
                    { muscle: 'NECK', setTarget: 3, reps: '10-15', exerciseId: 'neck_curl', supersetId: 'ss_eub_s_1' },
                    { muscle: 'QUADS', setTarget: 4, reps: '10-15', exerciseId: 'leg_press', supersetId: 'ss_eub_s_2', notes: 'Leg press 4x10-15 + Weighted chin-ups 4x4-8' },
                    { muscle: 'BACK', setTarget: 4, reps: '4-8', exerciseId: 'chinup', supersetId: 'ss_eub_s_2' },
                    { muscle: 'BICEPS', setTarget: 4, reps: '6-12', exerciseId: 'curl_hammer', supersetId: 'gs_eub_s_3', notes: 'Pinwheel curls 4x6-12 + Leg curls 4x10-15 + Standing calf raises 4x15-20' },
                    { muscle: 'HAMSTRINGS', setTarget: 4, reps: '10-15', exerciseId: 'leg_curl', supersetId: 'gs_eub_s_3' },
                    { muscle: 'CALVES', setTarget: 4, reps: '15-20', exerciseId: 'calf_raise', supersetId: 'gs_eub_s_3' }
                ]
            }
        ]
    },

    // =========================================================
    // 14. BALD OMNI MAN HYBRID (Compendium 2.2 p. 41)
    // =========================================================
    {
        id: 'nh_bald_omni_hybrid',
        name: 'NH Hybrid Calisthenics (Bald Omni Man)',
        title: { en: 'The PERFECT Hybrid Calisthenics Program', es: 'El Programa de Calistenia Híbrida PERFECTO' },
        description: { en: 'Natural Hypertrophy & Bald Omni Man collaboration combining weighted calisthenics with free weights.', es: 'Colaboración de Natural Hypertrophy y Bald Omni Man uniendo calistenia lastrada con pesas.' },
        isPro: true,
        order: 213,
        program: [
            {
                id: 'd1', dayName: { en: 'Monday (Upper)', es: 'Lunes (Torso)' },
                slots: [
                    { muscle: 'CHEST', setTarget: 4, reps: '10-15', exerciseId: 'pushup', supersetId: 'ss_hybrid_m_1', notes: 'Weighted push-ups (deficit, rings) 3-6x10-15 OR Weighted dips 3-4x6-10 (Free weight: Larsen/CGBP 3x6-10) + Reverse curls 3-6x8-15' },
                    { muscle: 'BICEPS', setTarget: 4, reps: '8-15', exerciseId: 'curl_bar', supersetId: 'ss_hybrid_m_1' },
                    { muscle: 'BACK', setTarget: 4, reps: '8-12', exerciseId: 'seal_row', supersetId: 'ss_hybrid_m_2', notes: 'Ring rows 4xAMRAP OR BB/Seal rows 4x8-12 + EZ bar curls 4x6-10 OR Cable curls 4x10-15' },
                    { muscle: 'BICEPS', setTarget: 4, reps: '6-10', exerciseId: 'curl_ez', supersetId: 'ss_hybrid_m_2' },
                    { muscle: 'CHEST', setTarget: 4, reps: '12-15', exerciseId: 'cable_crossover', supersetId: 'ss_hybrid_m_3', notes: 'Incline cable flies OR Decline ring push-ups 4x12-15 + EZ bar OR DB Lying triceps extensions 4x10-12' },
                    { muscle: 'TRICEPS', setTarget: 4, reps: '10-12', exerciseId: 'skull_crusher', supersetId: 'ss_hybrid_m_3' }
                ]
            },
            {
                id: 'd2', dayName: { en: 'Wednesday (Lower)', es: 'Miércoles (Piernas)' },
                slots: [
                    { muscle: 'QUADS', setTarget: 4, reps: '6-12', exerciseId: 'sq_bar', supersetId: 'ss_hybrid_w_1', notes: 'Heel elevated squats 3-5x6-12 OR Hack squats 3-5x8-15 + Neck extensions 3-5x10-20' },
                    { muscle: 'NECK', setTarget: 4, reps: '10-20', exerciseId: 'neck_ext', supersetId: 'ss_hybrid_w_1' },
                    { muscle: 'BACK', setTarget: 4, reps: '4-10', exerciseId: 'chinup', supersetId: 'ss_hybrid_w_2', notes: 'Weighted chin-ups 3-5x4-10 (Free weight: One-arm supinated pulldown 4x6-12) + Hanging knee raises 3-5xAMRAP OR Decline sit-ups 3-5x12-20' },
                    { muscle: 'ABS', setTarget: 4, reps: 'AMRAP', exerciseId: 'knee_raise', supersetId: 'ss_hybrid_w_2' },
                    { muscle: 'HAMSTRINGS', setTarget: 4, reps: '10-15', exerciseId: 'back_extension', supersetId: 'ss_hybrid_w_3', notes: 'Hyperextensions OR Block pulls 4x10-15 OR Leg curls 4x12-20 + Seated calf raises 4x10-20' },
                    { muscle: 'CALVES', setTarget: 4, reps: '10-20', exerciseId: 'calf_raise', supersetId: 'ss_hybrid_w_3' }
                ]
            },
            {
                id: 'd3', dayName: { en: 'Friday (Push)', es: 'Viernes (Empuje)' },
                slots: [
                    { muscle: 'CHEST', setTarget: 4, reps: 'AMRAP', exerciseId: 'pushup', supersetId: 'ss_hybrid_f_1', notes: 'Handstand OR Decline ring push-ups 3-6xAMRAP (Free weight: Incline press OR OHP 3x6-10) + Behind the back OR Cross body cable curls 3-6x10-20' },
                    { muscle: 'BICEPS', setTarget: 4, reps: '10-20', exerciseId: 'curl_cable', supersetId: 'ss_hybrid_f_1' },
                    { muscle: 'CHEST', setTarget: 4, reps: '12-15', exerciseId: 'pec_fly', supersetId: 'ss_hybrid_f_2', notes: 'Ring Guillotine OR Flies 4x12-15 + Bodyweight triceps extension 4xAMRAP OR Rope extensions 4x15-20' },
                    { muscle: 'TRICEPS', setTarget: 4, reps: '15-20', exerciseId: 'rope_pressdown', supersetId: 'ss_hybrid_f_2' },
                    { muscle: 'SHOULDERS', setTarget: 3, reps: '12-15', exerciseId: 'upright_row', supersetId: 'ss_hybrid_f_3', notes: 'Upright rows OR Lateral raises 3x12-15 + Supinated ring rows 3xAMRAP OR DB rows 3x10-12' },
                    { muscle: 'BACK', setTarget: 3, reps: '10-12', exerciseId: 'row_db', supersetId: 'ss_hybrid_f_3' }
                ]
            },
            {
                id: 'd4', dayName: { en: 'Saturday (Pull)', es: 'Sábado (Tracción)' },
                slots: [
                    { muscle: 'HAMSTRINGS', setTarget: 4, reps: '8-12', exerciseId: 'rdl', supersetId: 'ss_hybrid_s_1', notes: 'RDLs 4x8-12 OR Stiff legged deadlifts 4x6-10 + Neck flexions 4x10-20' },
                    { muscle: 'NECK', setTarget: 4, reps: '10-20', exerciseId: 'neck_curl', supersetId: 'ss_hybrid_s_1' },
                    { muscle: 'BACK', setTarget: 4, reps: '6-10', exerciseId: 'pullup', supersetId: 'ss_hybrid_s_2', notes: 'Weighted pull-ups 3-4x6-10 (Free weight: Close grip neutral pulldowns 3x8-12) + Hanging leg raises 3-4xAMRAP OR GHR sit-ups 3-4x8-15' },
                    { muscle: 'ABS', setTarget: 4, reps: 'AMRAP', exerciseId: 'leg_raise', supersetId: 'ss_hybrid_s_2' },
                    { muscle: 'QUADS', setTarget: 4, reps: '10-15', exerciseId: 'bulgarian_split_squat', supersetId: 'ss_hybrid_s_3', notes: 'Split squats OR Sissy squats 4x10-15 OR Leg extensions 4x10-20 + Standing calf raises 4x12-20' },
                    { muscle: 'CALVES', setTarget: 4, reps: '12-20', exerciseId: 'calf_raise', supersetId: 'ss_hybrid_s_3' }
                ]
            }
        ]
    },

    // =========================================================
    // 15. GUTS TRAINING PROGRAM (Berserk — Compendium 2.2 p. 21)
    // =========================================================
    {
        id: 'nh_guts',
        name: 'NH Guts Training Program',
        title: { en: 'Guts Training Program (Berserk)', es: 'Programa de Guts (Berserk)' },
        description: { en: 'Natural Hypertrophy - 4-day Black Swordsman program (Chest/Shoulders, Back/Traps, Arms, Legs).', es: 'Natural Hypertrophy - Programa de 4 días del Espadachín Negro (Pecho/Hombros, Espalda/Trapecios, Brazos, Piernas).' },
        isPro: true,
        order: 214,
        program: [
            {
                id: 'd1', dayName: { en: 'Monday (Upper – Chest/Shoulders)', es: 'Lunes (Torso – Pecho/Hombros)' },
                slots: [
                    { muscle: 'CHEST', setTarget: 4, reps: '4-8', exerciseId: 'bp_bar', supersetId: 'ss_guts_m_1', notes: 'Bench press OR Dips OR Weighted Push-ups 4x4-8 + Pullovers 4x8-12' },
                    { muscle: 'BACK', setTarget: 4, reps: '8-12', exerciseId: 'pullover_db', supersetId: 'ss_guts_m_1' },
                    { muscle: 'SHOULDERS', setTarget: 3, reps: '6-10', exerciseId: 'ohp', supersetId: 'ss_guts_m_2', notes: 'Barbell OR Dumbbell OHP 3x6-10 + Weighted Chin-ups 3x6-8 OR Supinated inverse rows 3xAMRAP' },
                    { muscle: 'BACK', setTarget: 3, reps: '6-8', exerciseId: 'chinup', supersetId: 'ss_guts_m_2' },
                    { muscle: 'CHEST', setTarget: 3, reps: 'AMRAP', exerciseId: 'diamond_pushup', supersetId: 'gs_guts_m_3', notes: 'Diamond push-ups 3xAMRAP + Behind the head triceps extension 3x6-12 + Neck curls 3x12-15 + Plank 3xALAP' },
                    { muscle: 'TRICEPS', setTarget: 3, reps: '6-12', exerciseId: 'tri_ext', supersetId: 'gs_guts_m_3' },
                    { muscle: 'NECK', setTarget: 3, reps: '12-15', exerciseId: 'neck_curl', supersetId: 'gs_guts_m_3' },
                    { muscle: 'ABS', setTarget: 3, reps: 'AMRAP', exerciseId: 'sit_up', supersetId: 'gs_guts_m_3' }
                ]
            },
            {
                id: 'd2', dayName: { en: 'Wednesday (Upper – Back/Traps)', es: 'Miércoles (Torso – Espalda/Trapecios)' },
                slots: [
                    { muscle: 'BACK', setTarget: 4, reps: '6-10', exerciseId: 'bent_barbell_row', supersetId: 'ss_guts_w_1', notes: 'Barbell rows 4x6-10 OR Deadlifts 3x3 (alternate weekly) + Single leg calf raises 3-4xAMRAP' },
                    { muscle: 'CALVES', setTarget: 4, reps: 'AMRAP', exerciseId: 'calf_raise', supersetId: 'ss_guts_w_1' },
                    { muscle: 'HAMSTRINGS', setTarget: 4, reps: '6-12', exerciseId: 'good_morning', supersetId: 'gs_guts_w_2', notes: 'Zercher/SSB Good mornings 4x6-12 OR/AND Weighted pull-ups 3x5 + Leg raises 3-4xAMRAP' },
                    { muscle: 'BACK', setTarget: 3, reps: '5', exerciseId: 'pullup', supersetId: 'gs_guts_w_2' },
                    { muscle: 'ABS', setTarget: 4, reps: 'AMRAP', exerciseId: 'leg_raise', supersetId: 'gs_guts_w_2' },
                    { muscle: 'HAMSTRINGS', setTarget: 4, reps: '8-12', exerciseId: 'back_extension', supersetId: 'gs_guts_w_3', notes: 'Hyperextensions 4x8-12 + Supinated finger curls 4x6-10 + Neck curls 4x10-12 + DB curls 4x6-10' },
                    { muscle: 'FOREARMS', setTarget: 4, reps: '6-10', exerciseId: 'finger_curl', supersetId: 'gs_guts_w_3' },
                    { muscle: 'NECK', setTarget: 4, reps: '10-12', exerciseId: 'neck_curl', supersetId: 'gs_guts_w_3' },
                    { muscle: 'BICEPS', setTarget: 4, reps: '6-10', exerciseId: 'curl_db', supersetId: 'gs_guts_w_3' }
                ]
            },
            {
                id: 'd3', dayName: { en: 'Friday (Upper – Arms)', es: 'Viernes (Torso – Brazos)' },
                slots: [
                    { muscle: 'BICEPS', setTarget: 4, reps: '6-10', exerciseId: 'curl_bar', supersetId: 'gs_guts_f_1', notes: 'EZ bar/Barbell Curls 4x6-10 + Skull crushers 4x10-15 + DB rows 4x8-12' },
                    { muscle: 'TRICEPS', setTarget: 4, reps: '10-15', exerciseId: 'skull_crusher', supersetId: 'gs_guts_f_1' },
                    { muscle: 'BACK', setTarget: 4, reps: '8-12', exerciseId: 'row_db', supersetId: 'gs_guts_f_1' },
                    { muscle: 'CHEST', setTarget: 3, reps: '6-10', exerciseId: 'close_grip_bench', supersetId: 'gs_guts_f_2', notes: 'Close grip bench press 3x6-10 OR Diamond push-ups 3xAMRAP + Hammer curls 3x8-12 + Larrats 3xAMRAP' },
                    { muscle: 'BICEPS', setTarget: 3, reps: '8-12', exerciseId: 'curl_hammer', supersetId: 'gs_guts_f_2' },
                    { muscle: 'BACK', setTarget: 3, reps: 'AMRAP', exerciseId: 'chinup', supersetId: 'gs_guts_f_2' },
                    { muscle: 'SHOULDERS', setTarget: 3, reps: '8-12', exerciseId: 'ohp_db', supersetId: 'gs_guts_f_3', notes: 'DB OHP 3x8-12 OR Decline push-ups 3xAMRAP + Finger curls 3x8-15 + Neck Curls 3x15-20' },
                    { muscle: 'FOREARMS', setTarget: 3, reps: '8-15', exerciseId: 'finger_curl', supersetId: 'gs_guts_f_3' },
                    { muscle: 'NECK', setTarget: 3, reps: '15-20', exerciseId: 'neck_curl', supersetId: 'gs_guts_f_3' }
                ]
            },
            {
                id: 'd4', dayName: { en: 'Saturday (Legs)', es: 'Sábado (Piernas)' },
                slots: [
                    { muscle: 'BACK', setTarget: 3, reps: '5', exerciseId: 'deadlift', supersetId: 'ss_guts_s_1', notes: 'Deadlifts 3x5 OR Zercher/SSB squats 3x6-10 (alternate weekly) + Shrugs 3xAMRAP' },
                    { muscle: 'TRAPS', setTarget: 3, reps: 'AMRAP', exerciseId: 'shrug_db', supersetId: 'ss_guts_s_1' },
                    { muscle: 'QUADS', setTarget: 3, reps: '4', exerciseId: 'sq_paused', supersetId: 'ss_guts_s_2', notes: 'Pause squats 3x4 OR Block pulls 3x8-12 (based on previous set) + Pullovers 3xAMRAP' },
                    { muscle: 'BACK', setTarget: 3, reps: 'AMRAP', exerciseId: 'pullover_db', supersetId: 'ss_guts_s_2' },
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '12-15', exerciseId: 'face_pull', supersetId: 'gs_guts_s_3', notes: 'Face-pulls 4x12-15 + Dumbbell leg raises 4x15-20 + Lateral raises 4x8-12 + Calf raises 4x10-15' },
                    { muscle: 'ABS', setTarget: 4, reps: '15-20', exerciseId: 'leg_raise', supersetId: 'gs_guts_s_3' },
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '8-12', exerciseId: 'lat_raise', supersetId: 'gs_guts_s_3' },
                    { muscle: 'CALVES', setTarget: 4, reps: '10-15', exerciseId: 'calf_raise', supersetId: 'gs_guts_s_3' }
                ]
            }
        ]
    },

    // =========================================================
    // 16. KRATOS PROGRAM ADVANCED (Compendium 2.2 pp. 28-29)
    // =========================================================
    {
        id: 'nh_kratos',
        name: 'NH Kratos Advanced',
        title: { en: 'Kratos Program (Advanced)', es: 'Programa de Kratos (Avanzado)' },
        description: { en: 'Natural Hypertrophy - 5-day God of War advanced program (Upper 1, Lower 1, Upper 2, Lower 2, Arms).', es: 'Natural Hypertrophy - Programa avanzado de 5 días de Kratos (Torso 1, Pierna 1, Torso 2, Pierna 2, Brazos).' },
        isPro: true,
        order: 215,
        defaultStageId: 'stage_3',
        stages: [
            {
                id: 'stage_1',
                label: { en: 'Stage 1 · Atreus', es: 'Stage 1 · Atreus' },
                subtitle: { en: '3 Days · Novice', es: '3 Días · Novato' },
                program: NH_KRATOS_STAGE_1,
            },
            {
                id: 'stage_2',
                label: { en: 'Stage 2 · Bridge', es: 'Stage 2 · Bridge' },
                subtitle: { en: '4 Days · Intermediate', es: '4 Días · Intermedio' },
                program: NH_KRATOS_STAGE_2,
            },
            {
                id: 'stage_3',
                label: { en: 'Stage 3 · Kratos', es: 'Stage 3 · Kratos' },
                subtitle: { en: '5 Days · Advanced', es: '5 Días · Avanzado' },
                program: NH_KRATOS,
            },
        ],
        program: NH_KRATOS,
    },

    // =========================================================
    // 17. SUPERHERO AESTHETICS (Kinobody Hollywood — Compendium 2.2 pp. 42-43)
    // =========================================================
    {
        id: 'nh_kinobody',
        name: 'NH Kinobody Hollywood',
        title: { en: 'Superhero Aesthetics (Kinobody)', es: 'Superhero Aesthetics (Kinobody)' },
        description: { en: 'Natural Hypertrophy - 3-day Rest-Pause Hollywood physique revamp.', es: 'Natural Hypertrophy - Programa de 3 días con Rest-Pause para un físico Hollywood denso y angular.' },
        isPro: true,
        order: 216,
        program: [
            {
                id: 'd1', dayName: { en: 'Tuesday (Shoulders & Back)', es: 'Martes (Hombros y Espalda)' },
                slots: [
                    { muscle: 'BACK', setTarget: 3, reps: '5-8', exerciseId: 'pullup', supersetId: 'ss_kino_t_1', notes: 'Weighted pull-ups (3x5-8 – RP last set) + Abs/Calves/Neck' },
                    { muscle: 'ABS', setTarget: 3, reps: 'AMRAP', exerciseId: 'leg_raise', supersetId: 'ss_kino_t_1' },
                    { muscle: 'SHOULDERS', setTarget: 3, reps: '6-10', exerciseId: 'ohp', supersetId: 'ss_kino_t_2', notes: 'Seated/Standing OHP (3x6-10) + DB rows (3x6-12)' },
                    { muscle: 'BACK', setTarget: 3, reps: '6-12', exerciseId: 'row_db', supersetId: 'ss_kino_t_2' },
                    { muscle: 'CHEST', setTarget: 4, reps: '12-15', exerciseId: 'db_fly', supersetId: 'ss_kino_t_3', notes: 'DB flies/Incline flies (4x12-15) + Cable lateral raises (4x10-15)' },
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '10-15', exerciseId: 'lat_raise_cable', supersetId: 'ss_kino_t_3' }
                ]
            },
            {
                id: 'd2', dayName: { en: 'Thursday (Lower Body)', es: 'Jueves (Piernas)' },
                slots: [
                    { muscle: 'QUADS', setTarget: 4, reps: '12-15', exerciseId: 'bulgarian_split_squat', supersetId: 'ss_kino_th_1', notes: 'Bulgarian split squats (3-4x12-15 – RP last set) + Neck (15-20)' },
                    { muscle: 'NECK', setTarget: 4, reps: '15-20', exerciseId: 'neck_curl', supersetId: 'ss_kino_th_1' },
                    { muscle: 'HAMSTRINGS', setTarget: 4, reps: '6-12', exerciseId: 'rdl', supersetId: 'ss_kino_th_2', notes: 'RDLs (3-4x6-12) + Leg extensions (4x15-20)' },
                    { muscle: 'QUADS', setTarget: 4, reps: '15-20', exerciseId: 'leg_ext', supersetId: 'ss_kino_th_2' },
                    { muscle: 'CALVES', setTarget: 4, reps: '15-20', exerciseId: 'calf_raise', supersetId: 'ss_kino_th_3', notes: 'DB Calf raises (3-4x15-20) + Hanging leg raises OR Ab wheel rollout' },
                    { muscle: 'ABS', setTarget: 4, reps: 'AMRAP', exerciseId: 'leg_raise', supersetId: 'ss_kino_th_3' }
                ]
            },
            {
                id: 'd3', dayName: { en: 'Saturday (Chest & Arms)', es: 'Sábado (Pecho y Brazos)' },
                slots: [
                    { muscle: 'CHEST', setTarget: 3, reps: '6-10', exerciseId: 'bp_inc', supersetId: 'ss_kino_s_1', notes: 'BB/DB Incline press (3x6-10 – RP last set) + Abs/Neck' },
                    { muscle: 'NECK', setTarget: 3, reps: '15-20', exerciseId: 'neck_ext', supersetId: 'ss_kino_s_1' },
                    { muscle: 'CHEST', setTarget: 3, reps: '6-10', exerciseId: 'bp_flat', supersetId: 'ss_kino_s_2', notes: 'DB Bench press (3x6-10) + Machine row (3x10-12)' },
                    { muscle: 'BACK', setTarget: 3, reps: '10-12', exerciseId: 'row_mach', supersetId: 'ss_kino_s_2' },
                    { muscle: 'BICEPS', setTarget: 4, reps: '6-10', exerciseId: 'incline_db_curl', supersetId: 'gs_kino_s_3', notes: 'DB incline curls (3-4x6-10) + Triceps pushdowns (3-4x15-20) + One arm cable rows (4x10-12)' },
                    { muscle: 'TRICEPS', setTarget: 4, reps: '15-20', exerciseId: 'tri_push', supersetId: 'gs_kino_s_3' },
                    { muscle: 'BACK', setTarget: 4, reps: '10-12', exerciseId: 'row_cable', supersetId: 'gs_kino_s_3' }
                ]
            }
        ]
    }
];
