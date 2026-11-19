import { GlobalTemplate, ProgramDay, ProgramStage } from '../../types';

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

export const NH_ULTIMATE_TEMPLATES: GlobalTemplate[] = [
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
];
