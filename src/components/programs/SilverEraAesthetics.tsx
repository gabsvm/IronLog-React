import { ProgramDay } from '../../../types';

export const SILVER_ERA_INTERMEDIATE: ProgramDay[] = [
    {
        id: 'se_int_1',
        dayName: { en: 'Monday', es: 'Lunes' },
        slots: [
            { muscle: 'QUADS', setTarget: 4, exerciseId: 'sq_bar', reps: '3/4x6-12', supersetId: 'se_int_1_ss1' },
            { muscle: 'BACK', setTarget: 4, exerciseId: 'seal_row', reps: '3/4x8-15', supersetId: 'se_int_1_ss1' },
            { muscle: 'CHEST', setTarget: 3, exerciseId: 'bp_inc', reps: '4x6-10', supersetId: 'se_int_1_ss2' },
            { muscle: 'BICEPS', setTarget: 3, exerciseId: 'reverse_curl', reps: '4x6-12', supersetId: 'se_int_1_ss2' },
            { muscle: 'HAMSTRINGS', setTarget: 4, exerciseId: 'rdl', reps: '4x8-12', supersetId: 'se_int_1_ss3' },
            { muscle: 'SHOULDERS', setTarget: 4, exerciseId: 'upright_row', reps: '4x10-15', supersetId: 'se_int_1_ss3' },
            { muscle: 'NECK', setTarget: 4, exerciseId: 'neck_curl', reps: '4x15-20' },
            { muscle: 'BICEPS', setTarget: 4, exerciseId: 'curl_cable', reps: '4x12-15', supersetId: 'se_int_1_ss4' },
            { muscle: 'TRICEPS', setTarget: 4, exerciseId: 'french_press', reps: '4x6-10', supersetId: 'se_int_1_ss4' },
            { muscle: 'CALVES', setTarget: 4, exerciseId: 'sited_calf_raise', reps: '4x15-20' },
        ]
    },
    {
        id: 'se_int_2',
        dayName: { en: 'Wednesday', es: 'Miércoles' },
        slots: [
            { muscle: 'BACK', setTarget: 3, exerciseId: 'row_bar', reps: '4x8-10', supersetId: 'se_int_2_ss1' },
            { muscle: 'TRAPS', setTarget: 4, exerciseId: 'wide_grip_shrug', reps: '3/4x12-20', supersetId: 'se_int_2_ss1' },
            { muscle: 'TRICEPS', setTarget: 3, exerciseId: 'dips', reps: '4x6-10', supersetId: 'se_int_2_ss2' },
            { muscle: 'QUADS', setTarget: 3, exerciseId: 'split_squat', reps: '4x12-15', supersetId: 'se_int_2_ss2' },
            { muscle: 'BACK', setTarget: 3, exerciseId: 'weighted_chin_up', reps: '4x4-6', supersetId: 'se_int_2_ss3' },
            { muscle: 'SHOULDERS', setTarget: 3, exerciseId: 'ohp_db', reps: 'x6-10', supersetId: 'se_int_2_ss3' },
            { muscle: 'SHOULDERS', setTarget: 3, exerciseId: 'face_pull', reps: '3x15' },
            { muscle: 'HAMSTRINGS', setTarget: 3, exerciseId: 'leg_curl', reps: '3x12-15' },
            { muscle: 'BICEPS', setTarget: 4, exerciseId: 'pelican_curl', reps: '4x10-15', supersetId: 'se_int_2_ss4' },
            { muscle: 'TRICEPS', setTarget: 4, exerciseId: 'cable_pushdown', reps: '4x8-15', supersetId: 'se_int_2_ss4' },
            { muscle: 'SHOULDERS', setTarget: 3, exerciseId: 'lat_raise_db', reps: '3x15' },
        ]
    },
    {
        id: 'se_int_3',
        dayName: { en: 'Friday', es: 'Viernes' },
        slots: [
            { muscle: 'BACK', setTarget: 3, exerciseId: 'deadlift', reps: '3x3' },
            { muscle: 'TRICEPS', setTarget: 3, exerciseId: 'cable_triceps_ext', reps: '3x10-12' },
            { muscle: 'SHOULDERS', setTarget: 3, exerciseId: 'ohp', reps: '4x6-12', supersetId: 'se_int_3_ss1' },
            { muscle: 'CHEST', setTarget: 3, exerciseId: 'db_pullover', reps: '4x8-12', supersetId: 'se_int_3_ss1' },
            { muscle: 'QUADS', setTarget: 4, exerciseId: 'leg_press', reps: '4x8-15', supersetId: 'se_int_3_ss2' },
            { muscle: 'CHEST', setTarget: 4, exerciseId: 'cable_chest_fly', reps: '4x10-15', supersetId: 'se_int_3_ss2' },
            { muscle: 'BICEPS', setTarget: 4, exerciseId: 'curl_hammer', reps: '4x8-12' },
            { muscle: 'BACK', setTarget: 4, exerciseId: 'wide_grip_pull_up', reps: '4x8-12', supersetId: 'se_int_3_ss3' },
            { muscle: 'HAMSTRINGS', setTarget: 4, exerciseId: 'hyperextension', reps: '4x10-15', supersetId: 'se_int_3_ss3' },
            { muscle: 'CALVES', setTarget: 4, exerciseId: 'standing_calf_raise', reps: '4x12-20' },
        ]
    }
];

export const SILVER_ERA_ADVANCED: ProgramDay[] = [
    {
        id: 'se_adv_1',
        dayName: { en: 'Monday', es: 'Lunes' },
        slots: [
            { muscle: 'QUADS', setTarget: 3, exerciseId: 'sq_bar', reps: '4x6-12', supersetId: 'se_adv_1_ss1' },
            { muscle: 'BACK', setTarget: 3, exerciseId: 'seal_row', reps: '4x8-15', supersetId: 'se_adv_1_ss1' },
            { muscle: 'CHEST', setTarget: 3, exerciseId: 'bp_inc', reps: '4x6-10', supersetId: 'se_adv_1_ss2' },
            { muscle: 'BICEPS', setTarget: 3, exerciseId: 'reverse_curl', reps: '4x6-12', supersetId: 'se_adv_1_ss2' },
            { muscle: 'HAMSTRINGS', setTarget: 4, exerciseId: 'rdl', reps: '4x8-12', supersetId: 'se_adv_1_ss3' },
            { muscle: 'SHOULDERS', setTarget: 4, exerciseId: 'upright_row', reps: '4x10-15', supersetId: 'se_adv_1_ss3' },
            { muscle: 'NECK', setTarget: 4, exerciseId: 'neck_curl', reps: '4x15-20' },
            { muscle: 'BICEPS', setTarget: 4, exerciseId: 'curl_cable', reps: '4x12-15', supersetId: 'se_adv_1_ss4' },
            { muscle: 'TRICEPS', setTarget: 4, exerciseId: 'french_press', reps: '4x6-10', supersetId: 'se_adv_1_ss4' },
            { muscle: 'CALVES', setTarget: 4, exerciseId: 'sited_calf_raise', reps: '4x15-20' },
        ]
    },
    {
        id: 'se_adv_2',
        dayName: { en: 'Wednesday', es: 'Miércoles' },
        slots: [
            { muscle: 'BACK', setTarget: 3, exerciseId: 'row_bar', reps: '4x8-10', supersetId: 'se_adv_2_ss1' },
            { muscle: 'TRAPS', setTarget: 3, exerciseId: 'wide_grip_shrug', reps: '4x12-20', supersetId: 'se_adv_2_ss1' },
            { muscle: 'TRICEPS', setTarget: 3, exerciseId: 'dips', reps: '4x6-10', supersetId: 'se_adv_2_ss2' },
            { muscle: 'QUADS', setTarget: 3, exerciseId: 'split_squat', reps: '4x12-15', supersetId: 'se_adv_2_ss2' },
            { muscle: 'BACK', setTarget: 3, exerciseId: 'weighted_chin_up', reps: '4x4-6', supersetId: 'se_adv_2_ss3' },
            { muscle: 'SHOULDERS', setTarget: 3, exerciseId: 'ohp_db', reps: 'x6-10', supersetId: 'se_adv_2_ss3' },
            { muscle: 'SHOULDERS', setTarget: 3, exerciseId: 'face_pull', reps: '3x15' },
            { muscle: 'HAMSTRINGS', setTarget: 3, exerciseId: 'leg_curl', reps: '3x12-15' },
            { muscle: 'BICEPS', setTarget: 4, exerciseId: 'pelican_curl', reps: '4x10-15', supersetId: 'se_adv_2_ss4' },
            { muscle: 'TRICEPS', setTarget: 4, exerciseId: 'cable_pushdown', reps: '4x8-15', supersetId: 'se_adv_2_ss4' },
            { muscle: 'SHOULDERS', setTarget: 3, exerciseId: 'lat_raise_db', reps: '3x15' },
        ]
    },
    {
        id: 'se_adv_3',
        dayName: { en: 'Friday', es: 'Viernes' },
        slots: [
            { muscle: 'BACK', setTarget: 3, exerciseId: 'deadlift', reps: '3x3' },
            { muscle: 'TRICEPS', setTarget: 3, exerciseId: 'cable_triceps_ext', reps: '3x10-12' },
            { muscle: 'SHOULDERS', setTarget: 3, exerciseId: 'ohp', reps: '4x6-12', supersetId: 'se_adv_3_ss1' },
            { muscle: 'CHEST', setTarget: 3, exerciseId: 'db_pullover', reps: '4x8-12', supersetId: 'se_adv_3_ss1' },
            { muscle: 'QUADS', setTarget: 4, exerciseId: 'leg_press', reps: '4x8-15', supersetId: 'se_adv_3_ss2' },
            { muscle: 'CHEST', setTarget: 4, exerciseId: 'cable_chest_fly', reps: '4x10-15', supersetId: 'se_adv_3_ss2' },
            { muscle: 'BICEPS', setTarget: 4, exerciseId: 'curl_hammer', reps: '4x8-12' },
            { muscle: 'BACK', setTarget: 4, exerciseId: 'wide_grip_pull_up', reps: '4x8-12', supersetId: 'se_adv_3_ss3' },
            { muscle: 'HAMSTRINGS', setTarget: 4, exerciseId: 'hyperextension', reps: '4x10-15', supersetId: 'se_adv_3_ss3' },
            { muscle: 'CALVES', setTarget: 4, exerciseId: 'standing_calf_raise', reps: '4x12-20' },
        ]
    }
];
