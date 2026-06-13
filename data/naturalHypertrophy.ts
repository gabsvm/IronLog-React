import { GlobalTemplate, ProgramDay, ProgramSlot } from '../types';

export const NATURAL_HYPERTROPHY_TEMPLATES: GlobalTemplate[] = [
    // =========================================================
    // 1. BEGINNER (Ultimate Hypertrophy)
    // =========================================================
    {
        id: 'nh_ult_beginner',
        name: 'NH Ultimate Beginner',
        title: { en: 'Ultimate Hypertrophy (Beginner)', es: 'Hipertrofia Definitiva (Principiante)' },
        description: { en: 'Natural Hypertrophy - 3 days/week full body with exact supersets.', es: 'Natural Hypertrophy - 3 días/semana full body con superseries exactas.' },
        isPro: false,
        order: 200,
        program: [
            {
                id: 'd1', dayName: { en: 'Monday', es: 'Lunes' },
                slots: [
                    { muscle: 'QUADS', setTarget: 2, reps: '6-8', exerciseId: 'sq_bar', supersetId: 'ss_beg_m_1', notes: 'Squat + DB Curls' },
                    { muscle: 'BICEPS', setTarget: 2, reps: '8-10', exerciseId: 'curl_db', supersetId: 'ss_beg_m_1' },
                    { muscle: 'TRICEPS', setTarget: 2, reps: '6-8', exerciseId: 'dips', supersetId: 'ss_beg_m_2', notes: 'Dips + DB Rows' },
                    { muscle: 'BACK', setTarget: 2, reps: '10-12', exerciseId: 'row_db', supersetId: 'ss_beg_m_2' },
                    { muscle: 'TRICEPS', setTarget: 3, reps: '10-15', exerciseId: 'tri_push', supersetId: 'gs_beg_m_3', notes: 'Triceps + Lateral Raises + Crunches (Giant Set)' },
                    { muscle: 'SHOULDERS', setTarget: 3, reps: '10-15', exerciseId: 'lat_raise', supersetId: 'gs_beg_m_3' },
                    { muscle: 'ABS', setTarget: 3, reps: '8-10', exerciseId: 'abs_cable', supersetId: 'gs_beg_m_3' }
                ]
            },
            {
                id: 'd2', dayName: { en: 'Wednesday', es: 'Miércoles' },
                slots: [
                    { muscle: 'SHOULDERS', setTarget: 2, reps: '6-8', exerciseId: 'ohp', supersetId: 'ss_beg_w_1', notes: 'OHP + Hammer Curls' },
                    { muscle: 'BICEPS', setTarget: 2, reps: '8-10', exerciseId: 'curl_hammer', supersetId: 'ss_beg_w_1' },
                    { muscle: 'BACK', setTarget: 3, reps: '8-12', exerciseId: 'lat_pull', supersetId: 'ss_beg_w_2', notes: 'Lat Pulldowns + Leg Curls' },
                    { muscle: 'HAMSTRINGS', setTarget: 3, reps: '12-15', exerciseId: 'leg_curl', supersetId: 'ss_beg_w_2' },
                    { muscle: 'QUADS', setTarget: 3, reps: '10-15', exerciseId: 'leg_ext', supersetId: 'gs_beg_w_3', notes: 'Leg Extensions + Cable Flyes + Neck Curls (Giant Set)' },
                    { muscle: 'CHEST', setTarget: 3, reps: '12-15', exerciseId: 'pec_fly', supersetId: 'gs_beg_w_3' },
                    { muscle: 'NECK', setTarget: 3, reps: '15-20', exerciseId: 'neck_curl', supersetId: 'gs_beg_w_3' }
                ]
            },
            {
                id: 'd3', dayName: { en: 'Friday', es: 'Viernes' },
                slots: [
                    { muscle: 'HAMSTRINGS', setTarget: 2, reps: '8-10', exerciseId: 'rdl', supersetId: 'ss_beg_f_1', notes: 'RDLs + Calf raises' },
                    { muscle: 'CALVES', setTarget: 2, reps: '15-20', exerciseId: 'calf_raise', supersetId: 'ss_beg_f_1' },
                    { muscle: 'CHEST', setTarget: 3, reps: '10-12', exerciseId: 'pushup', supersetId: 'ss_beg_f_2', notes: 'Pushups + Preacher Curls' },
                    { muscle: 'BICEPS', setTarget: 3, reps: '8-10', exerciseId: 'curl_preacher', supersetId: 'ss_beg_f_2' },
                    { muscle: 'QUADS', setTarget: 2, reps: '8-10', exerciseId: 'leg_press', supersetId: 'gs_beg_f_3', notes: 'Leg Press + Skullcrushers + Leg Raises (Giant Set)' },
                    { muscle: 'TRICEPS', setTarget: 2, reps: '10-12', exerciseId: 'skull_crusher', supersetId: 'gs_beg_f_3' },
                    { muscle: 'ABS', setTarget: 2, reps: 'AMRAP', exerciseId: 'leg_raise', supersetId: 'gs_beg_f_3' }
                ]
            }
        ]
    },

    // =========================================================
    // 2. NOVICE (Ultimate Hypertrophy)
    // =========================================================
    {
        id: 'nh_ult_novice',
        name: 'NH Ultimate Novice',
        title: { en: 'Ultimate Hypertrophy (Novice)', es: 'Hipertrofia Definitiva (Novato)' },
        description: { en: 'Natural Hypertrophy - Balanced 3 days novice routine with options and supersets.', es: 'Natural Hypertrophy - Rutina de novato de 3 días con opciones de superseries.' },
        isPro: false,
        order: 201,
        program: [
            {
                id: 'd1', dayName: { en: 'Monday', es: 'Lunes' },
                slots: [
                    { muscle: 'QUADS', setTarget: 3, reps: '4-8', exerciseId: 'sq_bar', supersetId: 'ss_nov_m_1', notes: 'Squat/Hack + EZ/DB Curls' },
                    { muscle: 'BICEPS', setTarget: 3, reps: '6-8', exerciseId: 'curl_ez', supersetId: 'ss_nov_m_1' },
                    { muscle: 'CHEST', setTarget: 3, reps: '6-8', exerciseId: 'dips', supersetId: 'ss_nov_m_2', notes: 'Dips/Bench + DB Rows' },
                    { muscle: 'BACK', setTarget: 3, reps: '8-12', exerciseId: 'row_db', supersetId: 'ss_nov_m_2' },
                    { muscle: 'TRICEPS', setTarget: 3, reps: '10-15', exerciseId: 'tri_push', supersetId: 'gs_nov_m_3', notes: 'Triceps + Lateral raises + Crunches (Giant Set)' },
                    { muscle: 'SHOULDERS', setTarget: 3, reps: '10-15', exerciseId: 'lat_raise', supersetId: 'gs_nov_m_3' },
                    { muscle: 'ABS', setTarget: 3, reps: '10-12', exerciseId: 'abs_cable', supersetId: 'gs_nov_m_3' }
                ]
            },
            {
                id: 'd2', dayName: { en: 'Wednesday', es: 'Miércoles' },
                slots: [
                    { muscle: 'SHOULDERS', setTarget: 3, reps: '6-10', exerciseId: 'ohp', supersetId: 'ss_nov_w_1', notes: 'OHP + Hammer/Reverse Curls' },
                    { muscle: 'BICEPS', setTarget: 3, reps: '6-10', exerciseId: 'curl_hammer', supersetId: 'ss_nov_w_1' },
                    { muscle: 'BACK', setTarget: 3, reps: '4-6', exerciseId: 'chinup', supersetId: 'ss_nov_w_2', notes: 'Chin-ups + Leg curls' },
                    { muscle: 'HAMSTRINGS', setTarget: 3, reps: '12-15', exerciseId: 'leg_curl', supersetId: 'ss_nov_w_2' },
                    { muscle: 'QUADS', setTarget: 3, reps: '8-12', exerciseId: 'lunges', supersetId: 'gs_nov_w_3', notes: 'Split squats + Cable flies + Neck curls (Giant Set)' },
                    { muscle: 'CHEST', setTarget: 3, reps: '10-12', exerciseId: 'pec_fly', supersetId: 'gs_nov_w_3' },
                    { muscle: 'NECK', setTarget: 3, reps: '15-20', exerciseId: 'neck_curl', supersetId: 'gs_nov_w_3' }
                ]
            },
            {
                id: 'd3', dayName: { en: 'Friday', es: 'Viernes' },
                slots: [
                    { muscle: 'HAMSTRINGS', setTarget: 3, reps: '6-12', exerciseId: 'rdl', supersetId: 'ss_nov_f_1', notes: 'RDLs + Calf raises' },
                    { muscle: 'CALVES', setTarget: 3, reps: '15-20', exerciseId: 'calf_raise', supersetId: 'ss_nov_f_1' },
                    { muscle: 'CHEST', setTarget: 3, reps: '6-10', exerciseId: 'bp_inc', supersetId: 'ss_nov_f_2', notes: 'Incline press + Preacher curls' },
                    { muscle: 'BICEPS', setTarget: 3, reps: '8-10', exerciseId: 'curl_preacher', supersetId: 'ss_nov_f_2' },
                    { muscle: 'QUADS', setTarget: 3, reps: '8-12', exerciseId: 'leg_press', supersetId: 'gs_nov_f_3', notes: 'Leg press + Skullcrushers + Leg raises (Giant Set)' },
                    { muscle: 'TRICEPS', setTarget: 3, reps: '8-12', exerciseId: 'skull_crusher', supersetId: 'gs_nov_f_3' },
                    { muscle: 'ABS', setTarget: 3, reps: 'AMRAP', exerciseId: 'leg_raise', supersetId: 'gs_nov_f_3' }
                ]
            }
        ]
    },

    // =========================================================
    // 3. BRIDGE (Ultimate Hypertrophy)
    // =========================================================
    {
        id: 'nh_ult_bridge',
        name: 'NH Ultimate Bridge',
        title: { en: 'Ultimate Hypertrophy (Bridge)', es: 'Hipertrofia Definitiva (Puente)' },
        description: { en: 'Natural Hypertrophy - Transition program introducing 4-day high frequency split.', es: 'Natural Hypertrophy - Rutina puente de 4 días (Lunes, Miércoles, Viernes, Sábado).' },
        isPro: true,
        order: 202,
        program: [
            {
                id: 'd1', dayName: { en: 'Monday', es: 'Lunes' },
                slots: [
                    { muscle: 'QUADS', setTarget: 3, reps: '4-8', exerciseId: 'sq_bar', supersetId: 'ss_bri_m_1', notes: 'Squats + EZ/DB curls' },
                    { muscle: 'BICEPS', setTarget: 3, reps: '6-10', exerciseId: 'curl_db', supersetId: 'ss_bri_m_1' },
                    { muscle: 'CHEST', setTarget: 3, reps: '6-8', exerciseId: 'dips', supersetId: 'ss_bri_m_2', notes: 'Dips + DB Rows' },
                    { muscle: 'BACK', setTarget: 3, reps: '8-12', exerciseId: 'row_db', supersetId: 'ss_bri_m_2' },
                    { muscle: 'TRICEPS', setTarget: 3, reps: '10-15', exerciseId: 'tri_push', supersetId: 'gs_bri_m_3', notes: 'Triceps + Lateral raises + Sit-ups' },
                    { muscle: 'SHOULDERS', setTarget: 3, reps: '10-15', exerciseId: 'lat_raise', supersetId: 'gs_bri_m_3' },
                    { muscle: 'ABS', setTarget: 3, reps: '8-12', exerciseId: 'abs_cable', supersetId: 'gs_bri_m_3' }
                ]
            },
            {
                id: 'd2', dayName: { en: 'Wednesday', es: 'Miércoles' },
                slots: [
                    { muscle: 'SHOULDERS', setTarget: 3, reps: '6-12', exerciseId: 'ohp', supersetId: 'ss_bri_w_1', notes: 'OHP + Hammer/Reverse curls' },
                    { muscle: 'BICEPS', setTarget: 3, reps: '6-12', exerciseId: 'curl_hammer', supersetId: 'ss_bri_w_1' },
                    { muscle: 'BACK', setTarget: 3, reps: '4-8', exerciseId: 'chinup', supersetId: 'ss_bri_w_2', notes: 'Chin-ups + Leg curls' },
                    { muscle: 'HAMSTRINGS', setTarget: 3, reps: '12-15', exerciseId: 'leg_curl', supersetId: 'ss_bri_w_2' },
                    { muscle: 'QUADS', setTarget: 3, reps: '8-12', exerciseId: 'lunges', supersetId: 'gs_bri_w_3', notes: 'Split squats + Cable flies + Neck curls' },
                    { muscle: 'CHEST', setTarget: 3, reps: '12-15', exerciseId: 'pec_fly', supersetId: 'gs_bri_w_3' },
                    { muscle: 'NECK', setTarget: 3, reps: '15-20', exerciseId: 'neck_curl', supersetId: 'gs_bri_w_3' }
                ]
            },
            {
                id: 'd3', dayName: { en: 'Friday', es: 'Viernes' },
                slots: [
                    { muscle: 'HAMSTRINGS', setTarget: 3, reps: '6-12', exerciseId: 'rdl', supersetId: 'ss_bri_f_1', notes: 'RDLs + Calf raises' },
                    { muscle: 'CALVES', setTarget: 3, reps: '15-20', exerciseId: 'calf_raise', supersetId: 'ss_bri_f_1' },
                    { muscle: 'QUADS', setTarget: 3, reps: '8-12', exerciseId: 'leg_press', supersetId: 'ss_bri_f_2', notes: 'Leg press + Machine rows' },
                    { muscle: 'BACK', setTarget: 3, reps: '8-12', exerciseId: 'row_mach', supersetId: 'ss_bri_f_2' },
                    { muscle: 'SHOULDERS', setTarget: 3, reps: '12-15', exerciseId: 'lat_raise', supersetId: 'gs_bri_f_3', notes: 'Upright rows + Leg raises' },
                    { muscle: 'ABS', setTarget: 3, reps: 'AMRAP', exerciseId: 'leg_raise', supersetId: 'gs_bri_f_3' }
                ]
            },
            {
                id: 'd4', dayName: { en: 'Saturday', es: 'Sábado' },
                slots: [
                    { muscle: 'CHEST', setTarget: 4, reps: '6-10', exerciseId: 'bp_inc', supersetId: 'ss_bri_s_1', notes: 'Incline Press + DB pullovers' },
                    { muscle: 'BACK', setTarget: 4, reps: '8-12', exerciseId: 'pullover_db', supersetId: 'ss_bri_s_1' },
                    { muscle: 'BICEPS', setTarget: 4, reps: '8-10', exerciseId: 'curl_preacher', supersetId: 'ss_bri_s_2', notes: 'Preacher curls + Skullcrushers' },
                    { muscle: 'TRICEPS', setTarget: 4, reps: '8-12', exerciseId: 'skull_crusher', supersetId: 'ss_bri_s_2' }
                ]
            }
        ]
    },

    // =========================================================
    // 4. INTERMEDIATE (Ultimate Hypertrophy Upper/Lower)
    // =========================================================
    {
        id: 'nh_ult_intermediate',
        name: 'NH Ultimate Intermediate',
        title: { en: 'Ultimate Hypertrophy (Intermediate)', es: 'Hipertrofia Definitiva (Intermedio)' },
        description: { en: 'Natural Hypertrophy - Fully structured 5-day Upper/Lower split.', es: 'Natural Hypertrophy - Split Torso/Pierna completo de 5 días de alta frecuencia.' },
        isPro: true,
        order: 203,
        program: [
            {
                id: 'd1', dayName: { en: 'Monday (Upper)', es: 'Lunes (Torso)' },
                slots: [
                    { muscle: 'CHEST', setTarget: 4, reps: '6-8', exerciseId: 'bp_bar', supersetId: 'ss_int_m_1', notes: 'Bench + DB Rows' },
                    { muscle: 'BACK', setTarget: 4, reps: '8-12', exerciseId: 'row_db', supersetId: 'ss_int_m_1' },
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '6-12', exerciseId: 'ohp', supersetId: 'ss_int_m_2', notes: 'OHP + EZ preacher curls' },
                    { muscle: 'BICEPS', setTarget: 4, reps: '6-10', exerciseId: 'curl_preacher', supersetId: 'ss_int_m_2' },
                    { muscle: 'TRICEPS', setTarget: 4, reps: '10-15', exerciseId: 'tri_push', supersetId: 'gs_int_m_3', notes: 'Triceps + Lateral raises + Sit-ups' },
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '10-15', exerciseId: 'lat_raise', supersetId: 'gs_int_m_3' },
                    { muscle: 'ABS', setTarget: 4, reps: '8-12', exerciseId: 'abs_cable', supersetId: 'gs_int_m_3' }
                ]
            },
            {
                id: 'd2', dayName: { en: 'Tuesday (Lower)', es: 'Martes (Piernas)' },
                slots: [
                    { muscle: 'QUADS', setTarget: 4, reps: '4-8', exerciseId: 'sq_bar', supersetId: 'ss_int_t_1', notes: 'Squat + Calf raises' },
                    { muscle: 'CALVES', setTarget: 4, reps: '15-20', exerciseId: 'calf_raise', supersetId: 'ss_int_t_1' },
                    { muscle: 'QUADS', setTarget: 3, reps: '6-10', exerciseId: 'sq_hack', supersetId: 'ss_int_t_2', notes: 'Power shrugs + Leg curls' },
                    { muscle: 'HAMSTRINGS', setTarget: 3, reps: '12-15', exerciseId: 'leg_curl', supersetId: 'ss_int_t_2' },
                    { muscle: 'QUADS', setTarget: 3, reps: '8-12', exerciseId: 'lunges', supersetId: 'gs_int_t_3', notes: 'Split squats + Neck curls' },
                    { muscle: 'NECK', setTarget: 3, reps: '15-20', exerciseId: 'neck_curl', supersetId: 'gs_int_t_3' }
                ]
            },
            {
                id: 'd3', dayName: { en: 'Wednesday (Arms)', es: 'Miércoles (Brazos)' },
                slots: [
                    { muscle: 'CHEST', setTarget: 4, reps: '6-10', exerciseId: 'bp_flat', supersetId: 'ss_int_w_1', notes: 'Close grip bench + DB pullovers' },
                    { muscle: 'BACK', setTarget: 4, reps: '8-12', exerciseId: 'pullover_db', supersetId: 'ss_int_w_1' },
                    { muscle: 'TRICEPS', setTarget: 4, reps: '6-12', exerciseId: 'skull_crusher', supersetId: 'ss_int_w_2', notes: 'JM Press/Skullcrushers + Preacher curls' },
                    { muscle: 'BICEPS', setTarget: 4, reps: '6-12', exerciseId: 'curl_preacher', supersetId: 'ss_int_w_2' },
                    { muscle: 'BICEPS', setTarget: 4, reps: '6-12', exerciseId: 'curl_hammer', supersetId: 'gs_int_w_3', notes: 'Hammer curls + Upright rows + Russian twists' },
                    { muscle: 'SHOULDERS', setTarget: 3, reps: '12-15', exerciseId: 'lat_raise', supersetId: 'gs_int_w_3' },
                    { muscle: 'ABS', setTarget: 3, reps: '10-15', exerciseId: 'abs_cable', supersetId: 'gs_int_w_3' }
                ]
            },
            {
                id: 'd4', dayName: { en: 'Friday (Upper)', es: 'Viernes (Torso)' },
                slots: [
                    { muscle: 'CHEST', setTarget: 3, reps: '6-10', exerciseId: 'bp_inc', supersetId: 'ss_int_f_1', notes: 'Incline press + Krock rows' },
                    { muscle: 'BACK', setTarget: 3, reps: '10-12', exerciseId: 'row_db', supersetId: 'ss_int_f_1' },
                    { muscle: 'BACK', setTarget: 3, reps: '4-8', exerciseId: 'chinup', supersetId: 'ss_int_f_2', notes: 'Chin-ups + Triceps pushdowns' },
                    { muscle: 'TRICEPS', setTarget: 3, reps: '10-15', exerciseId: 'tri_push', supersetId: 'ss_int_f_2' },
                    { muscle: 'CHEST', setTarget: 3, reps: '8-12', exerciseId: 'pec_fly', supersetId: 'ss_int_f_3', notes: 'DB flies + Bayesian curls' },
                    { muscle: 'BICEPS', setTarget: 3, reps: '8-12', exerciseId: 'curl_cable', supersetId: 'ss_int_f_3' }
                ]
            },
            {
                id: 'd5', dayName: { en: 'Saturday (Lower)', es: 'Sábado (Piernas)' },
                slots: [
                    { muscle: 'HAMSTRINGS', setTarget: 3, reps: '6-12', exerciseId: 'rdl', supersetId: 'ss_int_s_1', notes: 'RDLs + Standing calf raises' },
                    { muscle: 'CALVES', setTarget: 3, reps: '12-15', exerciseId: 'calf_raise', supersetId: 'ss_int_s_1' },
                    { muscle: 'QUADS', setTarget: 3, reps: '8-12', exerciseId: 'leg_press', supersetId: 'ss_int_s_2', notes: 'Leg press + Neck extensions' },
                    { muscle: 'NECK', setTarget: 3, reps: '15-20', exerciseId: 'neck_ext', supersetId: 'ss_int_s_2' },
                    { muscle: 'TRAPS', setTarget: 3, reps: '30m', exerciseId: 'farmers_walk', supersetId: 'ss_int_s_3', notes: 'Farmers walk + Cable crunches' },
                    { muscle: 'ABS', setTarget: 3, reps: '6-12', exerciseId: 'abs_cable', supersetId: 'ss_int_s_3' }
                ]
            }
        ]
    },

    // =========================================================
    // 5. ADVANCED (Ultimate Hypertrophy 6-Day Split)
    // =========================================================
    {
        id: 'nh_ult_advanced',
        name: 'NH Ultimate Advanced',
        title: { en: 'Ultimate Hypertrophy (Advanced)', es: 'Hipertrofia Definitiva (Avanzado)' },
        description: { en: 'Natural Hypertrophy - Pure 6-day hypertrophy routine with targeted daily focus.', es: 'Natural Hypertrophy - Rutina de volumen estricto de 6 días para atletas avanzados.' },
        isPro: true,
        order: 204,
        program: [
            {
                id: 'd1', dayName: { en: 'Monday (Upper)', es: 'Lunes (Torso)' },
                slots: [
                    { muscle: 'CHEST', setTarget: 4, reps: '6-8', exerciseId: 'bp_flat', supersetId: 'ss_adv_m_1', notes: 'Bench + DB Rows + EZ curls' },
                    { muscle: 'BACK', setTarget: 4, reps: '8-12', exerciseId: 'row_db', supersetId: 'ss_adv_m_1' },
                    { muscle: 'BICEPS', setTarget: 4, reps: '6-10', exerciseId: 'curl_ez', supersetId: 'ss_adv_m_1' },
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '6-12', exerciseId: 'ohp', supersetId: 'ss_adv_m_2', notes: 'OHP + Neutral chin-ups + Sit-ups' },
                    { muscle: 'BACK', setTarget: 4, reps: '4-8', exerciseId: 'chinup', supersetId: 'ss_adv_m_2' },
                    { muscle: 'ABS', setTarget: 3, reps: '8-12', exerciseId: 'abs_cable', supersetId: 'ss_adv_m_2' }
                ]
            },
            {
                id: 'd2', dayName: { en: 'Tuesday (Lower)', es: 'Martes (Piernas)' },
                slots: [
                    { muscle: 'QUADS', setTarget: 4, reps: '4-8', exerciseId: 'sq_bar', supersetId: 'ss_adv_t_1', notes: 'Squat + Seated calf raises' },
                    { muscle: 'CALVES', setTarget: 4, reps: '12-15', exerciseId: 'calf_raise', supersetId: 'ss_adv_t_1' },
                    { muscle: 'TRAPS', setTarget: 4, reps: '10-15', exerciseId: 'shrug_db', notes: 'Power shrugs + Leg curls' },
                    { muscle: 'HAMSTRINGS', setTarget: 4, reps: '12-15', exerciseId: 'leg_curl', supersetId: 'ss_adv_t_2' },
                    { muscle: 'QUADS', setTarget: 4, reps: '8-12', exerciseId: 'lunges', supersetId: 'gs_adv_t_3', notes: 'Split squats + Neck curls' },
                    { muscle: 'NECK', setTarget: 4, reps: '15-20', exerciseId: 'neck_curl', supersetId: 'gs_adv_t_3' }
                ]
            },
            {
                id: 'd3', dayName: { en: 'Wednesday (Upper)', es: 'Miércoles (Torso)' },
                slots: [
                    { muscle: 'CHEST', setTarget: 4, reps: '6-10', exerciseId: 'bp_flat', supersetId: 'ss_adv_w_1', notes: 'Close grip bench + DB pullovers + Preacher curls' },
                    { muscle: 'BACK', setTarget: 4, reps: '8-12', exerciseId: 'pullover_db', supersetId: 'ss_adv_w_1' },
                    { muscle: 'BICEPS', setTarget: 4, reps: '6-12', exerciseId: 'curl_preacher', supersetId: 'ss_adv_w_1' },
                    { muscle: 'BACK', setTarget: 4, reps: '4-8', exerciseId: 'chinup', supersetId: 'ss_adv_w_2', notes: 'Chin-ups + Knee raises' },
                    { muscle: 'ABS', setTarget: 4, reps: '10-15', exerciseId: 'knee_raise', supersetId: 'ss_adv_w_2' }
                ]
            },
            {
                id: 'd4', dayName: { en: 'Thursday (Lower)', es: 'Jueves (Piernas)' },
                slots: [
                    { muscle: 'HAMSTRINGS', setTarget: 4, reps: '6-12', exerciseId: 'rdl', supersetId: 'ss_adv_th_1', notes: 'RDLs + Standing calf raises' },
                    { muscle: 'CALVES', setTarget: 4, reps: '8-12', exerciseId: 'calf_raise', supersetId: 'ss_adv_th_1' },
                    { muscle: 'QUADS', setTarget: 4, reps: '8-12', exerciseId: 'leg_press', supersetId: 'ss_adv_th_2', notes: 'Leg press + Neck extensions' },
                    { muscle: 'NECK', setTarget: 4, reps: '15-20', exerciseId: 'neck_ext', supersetId: 'ss_adv_th_2' }
                ]
            },
            {
                id: 'd5', dayName: { en: 'Friday (Upper)', es: 'Viernes (Torso)' },
                slots: [
                    { muscle: 'CHEST', setTarget: 4, reps: '6-10', exerciseId: 'bp_inc', supersetId: 'ss_adv_f_1', notes: 'Incline press + Krock rows' },
                    { muscle: 'BACK', setTarget: 4, reps: '8-12', exerciseId: 'row_db', supersetId: 'ss_adv_f_1' },
                    { muscle: 'BACK', setTarget: 4, reps: '4-8', exerciseId: 'chinup', supersetId: 'ss_adv_f_2', notes: 'Chin-ups + Skullcrushers + Cable crunches' },
                    { muscle: 'TRICEPS', setTarget: 4, reps: '10-15', exerciseId: 'skull_crusher', supersetId: 'ss_adv_f_2' },
                    { muscle: 'ABS', setTarget: 4, reps: '8-12', exerciseId: 'abs_cable', supersetId: 'ss_adv_f_2' }
                ]
            },
            {
                id: 'd6', dayName: { en: 'Saturday (Lower)', es: 'Sábado (Piernas)' },
                slots: [
                    { muscle: 'QUADS', setTarget: 4, reps: '10-15', exerciseId: 'sq_hack', supersetId: 'ss_adv_s_1', notes: 'Hack Squats + Seated calf raises' },
                    { muscle: 'CALVES', setTarget: 4, reps: '8-12', exerciseId: 'calf_raise', supersetId: 'ss_adv_s_1' },
                    { muscle: 'TRAPS', setTarget: 4, reps: '30m', exerciseId: 'farmers_walk', supersetId: 'ss_adv_s_2', notes: 'Farmers walk + Incline rows' },
                    { muscle: 'BACK', setTarget: 4, reps: '8-12', exerciseId: 'row_cable', supersetId: 'ss_adv_s_2' },
                    { muscle: 'HAMSTRINGS', setTarget: 4, reps: '8-12', exerciseId: 'leg_curl', supersetId: 'ss_adv_s_3', notes: 'Hyperextensions + Calf raises' },
                    { muscle: 'CALVES', setTarget: 4, reps: 'AMRAP', exerciseId: 'calf_raise', supersetId: 'ss_adv_s_3' }
                ]
            }
        ]
    },

    // =========================================================
    // 6. SPECIALIST PHYSIQUE PROGRAMS (Anime)
    // =========================================================
    {
        id: 'nh_baki',
        name: 'NH Baki Hanma Weight Training',
        title: { en: 'Baki Hanma Weight Training', es: 'Baki Hanma Weight Training' },
        description: { en: 'Natural Hypertrophy - 3 day advanced physical strength program mimicking Baki.', es: 'Natural Hypertrophy - Entrenamiento de pesas avanzado 3 días emulando a Baki Hanma.' },
        isPro: true,
        order: 205,
        program: [
            {
                id: 'd1', dayName: { en: 'Day 1', es: 'Día 1' },
                slots: [
                    { muscle: 'QUADS', setTarget: 3, reps: '4-8', exerciseId: 'sq_bar', supersetId: 'ss_baki_1', notes: 'Squat + Shrugs' },
                    { muscle: 'TRAPS', setTarget: 3, reps: 'AMRAP', exerciseId: 'shrug_db', supersetId: 'ss_baki_1' },
                    { muscle: 'HAMSTRINGS', setTarget: 4, reps: '8-12', exerciseId: 'rdl', supersetId: 'ss_baki_2', notes: 'RDLs + Pull-ups' },
                    { muscle: 'BACK', setTarget: 4, reps: 'AMRAP', exerciseId: 'pullup', supersetId: 'ss_baki_2' },
                    { muscle: 'TRICEPS', setTarget: 4, reps: '8-12', exerciseId: 'skull_crusher', supersetId: 'ss_baki_3', notes: 'Skullcrushers + Curls' },
                    { muscle: 'BICEPS', setTarget: 4, reps: 'AMRAP', exerciseId: 'curl_db', supersetId: 'ss_baki_3' },
                    { muscle: 'CHEST', setTarget: 3, reps: 'AMRAP', exerciseId: 'pushup', supersetId: 'gs_baki_4', notes: 'Pushups + Leg raises + Neck curls + Calf raises' },
                    { muscle: 'ABS', setTarget: 3, reps: 'AMRAP', exerciseId: 'leg_raise', supersetId: 'gs_baki_4' },
                    { muscle: 'NECK', setTarget: 3, reps: 'AMRAP', exerciseId: 'neck_curl', supersetId: 'gs_baki_4' },
                    { muscle: 'CALVES', setTarget: 3, reps: 'AMRAP', exerciseId: 'calf_raise', supersetId: 'gs_baki_4' }
                ]
            },
            {
                id: 'd2', dayName: { en: 'Day 2', es: 'Día 2' },
                slots: [
                    { muscle: 'CHEST', setTarget: 3, reps: '6-10', exerciseId: 'bp_bar', supersetId: 'ss_baki_w_1', notes: 'Bench + Horizontal shrugs' },
                    { muscle: 'TRAPS', setTarget: 3, reps: 'AMRAP', exerciseId: 'shrug_db', supersetId: 'ss_baki_w_1' },
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '6-10', exerciseId: 'ohp', supersetId: 'ss_baki_w_2', notes: 'OHP + Chin-ups' },
                    { muscle: 'BACK', setTarget: 4, reps: 'AMRAP', exerciseId: 'chinup', supersetId: 'ss_baki_w_2' },
                    { muscle: 'HAMSTRINGS', setTarget: 4, reps: '8-12', exerciseId: 'good_morning', supersetId: 'ss_baki_w_3', notes: 'Hyperextensions + Ring rows' },
                    { muscle: 'BACK', setTarget: 4, reps: 'AMRAP', exerciseId: 'row_mach', supersetId: 'ss_baki_w_3' },
                    { muscle: 'CHEST', setTarget: 3, reps: 'AMRAP', exerciseId: 'diamond_pushup', supersetId: 'gs_baki_w_4', notes: 'Diamond push-ups + Crunches + Neck side raises + Calf raises' },
                    { muscle: 'ABS', setTarget: 3, reps: 'AMRAP', exerciseId: 'abs_cable', supersetId: 'gs_baki_w_4' },
                    { muscle: 'SHOULDERS', setTarget: 3, reps: 'AMRAP', exerciseId: 'lat_raise', supersetId: 'gs_baki_w_4' }
                ]
            },
            {
                id: 'd3', dayName: { en: 'Day 3', es: 'Día 3' },
                slots: [
                    { muscle: 'BACK', setTarget: 3, reps: '2-5', exerciseId: 'deadlift', notes: 'Deadlifts' },
                    { muscle: 'QUADS', setTarget: 4, reps: '6-10', exerciseId: 'sq_paused', supersetId: 'ss_baki_f_1', notes: 'Pause squats + Pull-ups' },
                    { muscle: 'BACK', setTarget: 4, reps: 'AMRAP', exerciseId: 'pullup', supersetId: 'ss_baki_f_1' },
                    { muscle: 'TRAPS', setTarget: 4, reps: '10-15', exerciseId: 'shrug_db', supersetId: 'ss_baki_f_2', notes: 'Shrugs + Face pulls' },
                    { muscle: 'SHOULDERS', setTarget: 4, reps: 'AMRAP', exerciseId: 'face_pull', supersetId: 'ss_baki_f_2' },
                    { muscle: 'CHEST', setTarget: 3, reps: 'AMRAP', exerciseId: 'pushup', supersetId: 'gs_baki_f_3', notes: 'Pushups + Leg raises + Neck curls + Calf raises' },
                    { muscle: 'ABS', setTarget: 3, reps: 'AMRAP', exerciseId: 'leg_raise', supersetId: 'gs_baki_f_3' },
                    { muscle: 'NECK', setTarget: 3, reps: 'AMRAP', exerciseId: 'neck_ext', supersetId: 'gs_baki_f_3' },
                    { muscle: 'CALVES', setTarget: 3, reps: 'AMRAP', exerciseId: 'calf_raise', supersetId: 'gs_baki_f_3' }
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
        order: 206,
        program: [
            {
                id: 'd1', dayName: { en: 'Monday', es: 'Lunes' },
                slots: [
                    { muscle: 'CHEST', setTarget: 4, reps: 'AMRAP', exerciseId: 'dips', supersetId: 'ss_toji_m_1', notes: 'Weighted dips + Shrugs' },
                    { muscle: 'TRAPS', setTarget: 4, reps: '6-10', exerciseId: 'shrug_db', supersetId: 'ss_toji_m_1' },
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '6-12', exerciseId: 'lat_raise_cable', supersetId: 'ss_toji_m_2', notes: 'Lateral raises + Reverse crunches' },
                    { muscle: 'ABS', setTarget: 4, reps: 'AMRAP', exerciseId: 'leg_raise', supersetId: 'ss_toji_m_2' },
                    { muscle: 'BACK', setTarget: 4, reps: '6-10', exerciseId: 'chinup', supersetId: 'ss_toji_m_3', notes: 'Weighted chin-ups + Split-squats' },
                    { muscle: 'QUADS', setTarget: 4, reps: '8-12', exerciseId: 'lunges', supersetId: 'ss_toji_m_3' }
                ]
            },
            {
                id: 'd2', dayName: { en: 'Wednesday', es: 'Miércoles' },
                slots: [
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '6-10', exerciseId: 'ohp_db', supersetId: 'ss_toji_w_1', notes: 'DB OHP + Neck curls' },
                    { muscle: 'NECK', setTarget: 4, reps: '15-20', exerciseId: 'neck_curl', supersetId: 'ss_toji_w_1' },
                    { muscle: 'BACK', setTarget: 4, reps: '8-12', exerciseId: 'row_db', supersetId: 'ss_toji_w_2', notes: 'Rows + Katana extensions' },
                    { muscle: 'TRICEPS', setTarget: 4, reps: '10-15', exerciseId: 'tri_push', supersetId: 'ss_toji_w_2' },
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '12-15', exerciseId: 'rear_delt_fly', supersetId: 'ss_toji_w_3', notes: 'Reverse flies + Hammer curls' },
                    { muscle: 'BICEPS', setTarget: 4, reps: '6-10', exerciseId: 'curl_hammer', supersetId: 'ss_toji_w_3' }
                ]
            },
            {
                id: 'd3', dayName: { en: 'Friday', es: 'Viernes' },
                slots: [
                    { muscle: 'CHEST', setTarget: 4, reps: '6-10', exerciseId: 'bp_flat', supersetId: 'ss_toji_f_1', notes: 'Close grip bench + Preacher curls' },
                    { muscle: 'BICEPS', setTarget: 4, reps: '6-12', exerciseId: 'curl_preacher', supersetId: 'ss_toji_f_1' },
                    { muscle: 'BACK', setTarget: 4, reps: '8-12', exerciseId: 'pullover_db', supersetId: 'ss_toji_f_2', notes: 'Pullovers + Russian twists' },
                    { muscle: 'ABS', setTarget: 4, reps: 'AMRAP', exerciseId: 'abs_cable', supersetId: 'ss_toji_f_2' },
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '10-15', exerciseId: 'lat_raise', supersetId: 'ss_toji_f_3', notes: 'Upright rows + Split-squats' },
                    { muscle: 'QUADS', setTarget: 4, reps: '8-12', exerciseId: 'lunges', supersetId: 'ss_toji_f_3' }
                ]
            },
            {
                id: 'd4', dayName: { en: 'Saturday', es: 'Sábado' },
                slots: [
                    { muscle: 'SHOULDERS', setTarget: 3, reps: '8-12', exerciseId: 'ohp', supersetId: 'ss_toji_s_1', notes: 'Machine shoulder press + Neck extensions' },
                    { muscle: 'NECK', setTarget: 3, reps: '15-20', exerciseId: 'neck_ext', supersetId: 'ss_toji_s_1' },
                    { muscle: 'BACK', setTarget: 3, reps: '6-10', exerciseId: 'row_db', supersetId: 'ss_toji_s_2', notes: 'Incline DB rows + Triceps pushdowns' },
                    { muscle: 'TRICEPS', setTarget: 3, reps: '8-12', exerciseId: 'tri_push', supersetId: 'ss_toji_s_2' },
                    { muscle: 'TRAPS', setTarget: 3, reps: '30m', exerciseId: 'farmers_walk', supersetId: 'ss_toji_s_3', notes: 'Farmers walks + Y raises' },
                    { muscle: 'SHOULDERS', setTarget: 3, reps: '8-12', exerciseId: 'lat_raise', supersetId: 'ss_toji_s_3' }
                ]
            }
        ]
    },

    // =========================================================
    // 7. DOOM SLAYER & KRATOS
    // =========================================================
    {
        id: 'nh_doom_slayer',
        name: 'NH Doom Slayer PPL',
        title: { en: 'Doom Slayer PPL', es: 'Doom Slayer PPL' },
        description: { en: 'Natural Hypertrophy - Extremely high volume Pull/Push/Legs.', es: 'Natural Hypertrophy - PPL de altísimo volumen basado en Doom Slayer.' },
        isPro: true,
        order: 207,
        program: [
            {
                id: 'd1', dayName: { en: 'Pull 1', es: 'Tirón 1' },
                slots: [
                    { muscle: 'BACK', setTarget: 3, reps: '6-10', exerciseId: 'row_cable', supersetId: 'ss_doom_pull1_1', notes: 'Barbell row OR T-bar row + Cable crunches' },
                    { muscle: 'ABS', setTarget: 3, reps: '10-15', exerciseId: 'abs_cable', supersetId: 'ss_doom_pull1_1' },
                    { muscle: 'BACK', setTarget: 3, reps: '10-15', exerciseId: 'lat_pull', supersetId: 'ss_doom_pull1_2', notes: 'Machine high row OR Lat pulldowns + Upright rows' },
                    { muscle: 'SHOULDERS', setTarget: 3, reps: '10-15', exerciseId: 'lat_raise', supersetId: 'ss_doom_pull1_2' },
                    { muscle: 'NECK', setTarget: 3, reps: '15-20', exerciseId: 'neck_ext', supersetId: 'ss_doom_pull1_3', notes: 'Neck extensions + Curls + Farmers walk' },
                    { muscle: 'BICEPS', setTarget: 3, reps: '8-12', exerciseId: 'curl_db', supersetId: 'ss_doom_pull1_3' },
                    { muscle: 'TRAPS', setTarget: 3, reps: '30m', exerciseId: 'farmers_walk', supersetId: 'ss_doom_pull1_3' }
                ]
            },
            {
                id: 'd2', dayName: { en: 'Push 1', es: 'Empuje 1' },
                slots: [
                    { muscle: 'CHEST', setTarget: 3, reps: '6-10', exerciseId: 'dips', supersetId: 'ss_doom_push1_1', notes: 'Dips OR Bench press + Rear delts' },
                    { muscle: 'SHOULDERS', setTarget: 3, reps: '10-15', exerciseId: 'rear_delt_fly', supersetId: 'ss_doom_push1_1' },
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '8-12', exerciseId: 'ohp', supersetId: 'ss_doom_push1_2', notes: 'AD press OR Military press + Hammer curls' },
                    { muscle: 'BICEPS', setTarget: 4, reps: '8-12', exerciseId: 'curl_hammer', supersetId: 'ss_doom_push1_2' },
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '10-15', exerciseId: 'lat_raise_cable', supersetId: 'ss_doom_push1_3', notes: 'Lateral raises + Crossbody extensions + Chest flyes' },
                    { muscle: 'TRICEPS', setTarget: 4, reps: '8-12', exerciseId: 'tri_push', supersetId: 'ss_doom_push1_3' },
                    { muscle: 'CHEST', setTarget: 4, reps: '6-10', exerciseId: 'pec_fly', supersetId: 'ss_doom_push1_3' }
                ]
            },
            {
                id: 'd3', dayName: { en: 'Legs 1', es: 'Piernas 1' },
                slots: [
                    { muscle: 'QUADS', setTarget: 3, reps: '6-10', exerciseId: 'sq_bar', supersetId: 'ss_doom_legs1_1', notes: 'Barbell back squat + Neck flexions' },
                    { muscle: 'NECK', setTarget: 3, reps: '10-15', exerciseId: 'neck_curl', supersetId: 'ss_doom_legs1_1' },
                    { muscle: 'HAMSTRINGS', setTarget: 4, reps: '8-12', exerciseId: 'leg_curl', supersetId: 'ss_doom_legs1_2', notes: 'Hyperextensions + Russian twists' },
                    { muscle: 'ABS', setTarget: 4, reps: '10-15', exerciseId: 'abs_cable', supersetId: 'ss_doom_legs1_2' },
                    { muscle: 'QUADS', setTarget: 3, reps: '10-15', exerciseId: 'leg_ext', supersetId: 'ss_doom_legs1_3', notes: 'Leg extensions + Calf raises' },
                    { muscle: 'CALVES', setTarget: 3, reps: '15-20', exerciseId: 'calf_raise', supersetId: 'ss_doom_legs1_3' }
                ]
            },
            {
                id: 'd4', dayName: { en: 'Pull 2', es: 'Tirón 2' },
                slots: [
                    { muscle: 'BACK', setTarget: 3, reps: '3-5', exerciseId: 'pullup', supersetId: 'ss_doom_pull2_1', notes: 'Weighted pull-ups + Face-pulls' },
                    { muscle: 'SHOULDERS', setTarget: 3, reps: '10-15', exerciseId: 'face_pull', supersetId: 'ss_doom_pull2_1' },
                    { muscle: 'BACK', setTarget: 4, reps: '6-12', exerciseId: 'row_db', supersetId: 'ss_doom_pull2_2', notes: 'Kroc rows OR Meadows rows + Pronation twists' },
                    { muscle: 'FOREARMS', setTarget: 4, reps: '10-15', exerciseId: 'wrist_curl', supersetId: 'ss_doom_pull2_2' },
                    { muscle: 'TRAPS', setTarget: 3, reps: '6-10', exerciseId: 'shrug_db', supersetId: 'ss_doom_pull2_3', notes: 'Power shrugs + Preacher curls' },
                    { muscle: 'BICEPS', setTarget: 3, reps: '6-12', exerciseId: 'curl_preacher', supersetId: 'ss_doom_pull2_3' }
                ]
            },
            {
                id: 'd5', dayName: { en: 'Push 2', es: 'Empuje 2' },
                slots: [
                    { muscle: 'CHEST', setTarget: 3, reps: '8-12', exerciseId: 'bp_inc', supersetId: 'ss_doom_push2_1', notes: 'Incline press + Neck extensions' },
                    { muscle: 'NECK', setTarget: 3, reps: '10-15', exerciseId: 'neck_ext', supersetId: 'ss_doom_push2_1' },
                    { muscle: 'CHEST', setTarget: 3, reps: '6-10', exerciseId: 'bp_flat', supersetId: 'ss_doom_push2_2', notes: 'Converging chest press + Decline sit-ups' },
                    { muscle: 'ABS', setTarget: 3, reps: '8-12', exerciseId: 'abs_cable', supersetId: 'ss_doom_push2_2' },
                    { muscle: 'TRICEPS', setTarget: 4, reps: '8-12', exerciseId: 'jm_press', supersetId: 'ss_doom_push2_3', notes: 'JM press + Hammer preacher curls' },
                    { muscle: 'BICEPS', setTarget: 4, reps: '6-10', exerciseId: 'curl_hammer', supersetId: 'ss_doom_push2_3' }
                ]
            },
            {
                id: 'd6', dayName: { en: 'Legs 2', es: 'Piernas 2' },
                slots: [
                    { muscle: 'HAMSTRINGS', setTarget: 2, reps: '6-12', exerciseId: 'rdl', supersetId: 'ss_doom_legs2_1', notes: 'RDLs + DB rear delt swings' },
                    { muscle: 'SHOULDERS', setTarget: 2, reps: '8-12', exerciseId: 'rear_delt_fly', supersetId: 'ss_doom_legs2_1' },
                    { muscle: 'QUADS', setTarget: 3, reps: '8-12', exerciseId: 'sq_hack', supersetId: 'ss_doom_legs2_2', notes: 'Smith machine squat + Calf raises' },
                    { muscle: 'CALVES', setTarget: 3, reps: '10-15', exerciseId: 'calf_raise', supersetId: 'ss_doom_legs2_2' },
                    { muscle: 'HAMSTRINGS', setTarget: 3, reps: '10-15', exerciseId: 'leg_curl', supersetId: 'ss_doom_legs2_3', notes: 'GHR or Nordic hamstring curls + Dead-hangs' },
                    { muscle: 'FOREARMS', setTarget: 3, reps: '1min', exerciseId: 'farmers_walk', supersetId: 'ss_doom_legs2_3' }
                ]
            }
        ]
    },
    {
        id: 'nh_superman',
        name: 'NH Superman Aesthetics',
        title: { en: 'Superman Aesthetics (Henry Cavill)', es: 'Superman Aesthetics (Henry Cavill)' },
        description: { en: 'Natural Hypertrophy - Build the Man of Steel physique with exact supersets.', es: 'Natural Hypertrophy - Construye el físico del Hombre de Acero con superseries.' },
        isPro: true,
        order: 208,
        program: [
            {
                id: 'd1', dayName: { en: 'Monday (Upper)', es: 'Lunes (Torso)' },
                slots: [
                    { muscle: 'CHEST', setTarget: 4, reps: '4-10', exerciseId: 'bp_bar', supersetId: 'ss_sup_m_1', notes: 'Bench press OR Dips + Rows' },
                    { muscle: 'BACK', setTarget: 4, reps: '6-12', exerciseId: 'row_mach', supersetId: 'ss_sup_m_1' },
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '6-10', exerciseId: 'ohp', supersetId: 'ss_sup_m_2', notes: 'OHP + DB or EZ bar curls + Sit-ups' },
                    { muscle: 'BICEPS', setTarget: 4, reps: '8-12', exerciseId: 'curl_ez', supersetId: 'ss_sup_m_2' },
                    { muscle: 'ABS', setTarget: 4, reps: '10-15', exerciseId: 'abs_cable', supersetId: 'ss_sup_m_2' },
                    { muscle: 'CHEST', setTarget: 4, reps: '12-15', exerciseId: 'pec_fly', supersetId: 'ss_sup_m_3', notes: 'Cable flies + Upright rows' },
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '10-15', exerciseId: 'lat_raise', supersetId: 'ss_sup_m_3' }
                ]
            },
            {
                id: 'd2', dayName: { en: 'Wednesday (Lower)', es: 'Miércoles (Piernas)' },
                slots: [
                    { muscle: 'QUADS', setTarget: 3, reps: '6-8', exerciseId: 'sq_bar', supersetId: 'ss_sup_w_1', notes: 'Squats + Neck extensions' },
                    { muscle: 'NECK', setTarget: 4, reps: '10-15', exerciseId: 'neck_ext', supersetId: 'ss_sup_w_1' },
                    { muscle: 'HAMSTRINGS', setTarget: 4, reps: '8-12', exerciseId: 'rdl', supersetId: 'ss_sup_w_2', notes: 'RDLs + Behind the back curls + Calf raises' },
                    { muscle: 'BICEPS', setTarget: 4, reps: '10-12', exerciseId: 'curl_cable', supersetId: 'ss_sup_w_2' },
                    { muscle: 'CALVES', setTarget: 4, reps: '15-20', exerciseId: 'calf_raise', supersetId: 'ss_sup_w_2' },
                    { muscle: 'BACK', setTarget: 4, reps: '8-12', exerciseId: 'lat_pull', supersetId: 'ss_sup_w_3', notes: 'Lat pulldowns + French press' },
                    { muscle: 'TRICEPS', setTarget: 4, reps: '10-12', exerciseId: 'tri_push', supersetId: 'ss_sup_w_3' }
                ]
            },
            {
                id: 'd3', dayName: { en: 'Friday (Full Body)', es: 'Viernes (Full Body)' },
                slots: [
                    { muscle: 'CHEST', setTarget: 4, reps: '6-12', exerciseId: 'bp_inc', supersetId: 'ss_sup_f_1', notes: 'Incline press + Krock rows' },
                    { muscle: 'BACK', setTarget: 4, reps: '8-12', exerciseId: 'pullover_db', supersetId: 'ss_sup_f_1' },
                    { muscle: 'TRAPS', setTarget: 3, reps: '30m', exerciseId: 'farmers_walk', supersetId: 'ss_sup_f_2', notes: 'Farmers carry + Cable lateral raises' },
                    { muscle: 'SHOULDERS', setTarget: 3, reps: '12-15', exerciseId: 'lat_raise_cable', supersetId: 'ss_sup_f_2' },
                    { muscle: 'QUADS', setTarget: 4, reps: '15-20', exerciseId: 'leg_ext', supersetId: 'gs_sup_f_3', notes: 'Leg extensions + Hammer curls + Neck curls' },
                    { muscle: 'BICEPS', setTarget: 4, reps: '10-12', exerciseId: 'curl_hammer', supersetId: 'gs_sup_f_3' },
                    { muscle: 'NECK', setTarget: 4, reps: '10-15', exerciseId: 'neck_curl', supersetId: 'gs_sup_f_3' }
                ]
            }
        ]
    },

    // =========================================================
    // 8. GENTLEMAN SPLIT (Complete)
    // =========================================================
    {
        id: 'nh_gentleman_split',
        name: 'NH Gentleman Split Complete',
        title: { en: 'Gentleman Split Complete', es: 'Gentleman Split Completo' },
        description: { en: 'Natural Hypertrophy - The legendary 5-day classic upper/lower/arm/posterior chain split.', es: 'Natural Hypertrophy - El legendario split clásico de 5 días (OHP/Squat/Bench/Deadlift/Arms).' },
        isPro: true,
        order: 209,
        program: [
            {
                id: 'd1', dayName: { en: 'Monday (Upper OHP)', es: 'Lunes (Torso OHP)' },
                slots: [
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '2-5', exerciseId: 'ohp', notes: 'Barbell OHP heavy' },
                    { muscle: 'BICEPS', setTarget: 4, reps: '6-10', exerciseId: 'curl_ez', supersetId: 'ss_gent_m_1', notes: 'EZ bar curls + skull-crushers + rows' },
                    { muscle: 'TRICEPS', setTarget: 4, reps: '8-12', exerciseId: 'skull_crusher', supersetId: 'ss_gent_m_1' },
                    { muscle: 'BACK', setTarget: 4, reps: '6-10', exerciseId: 'pendlay_row', supersetId: 'ss_gent_m_1' },
                    { muscle: 'BACK', setTarget: 4, reps: 'AMRAP', exerciseId: 'chinup', supersetId: 'ss_gent_m_2', notes: 'Chin-ups + cable lateral + shrugs' },
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '10-15', exerciseId: 'lat_raise_cable', supersetId: 'ss_gent_m_2' },
                    { muscle: 'TRAPS', setTarget: 4, reps: '10-15', exerciseId: 'shrug_db', supersetId: 'ss_gent_m_2' }
                ]
            },
            {
                id: 'd2', dayName: { en: 'Tuesday (Lower Squats)', es: 'Martes (Pierna Sentadilla)' },
                slots: [
                    { muscle: 'QUADS', setTarget: 3, reps: '4-8', exerciseId: 'sq_bar', notes: 'Heavy squats 1-3 sets' },
                    { muscle: 'QUADS', setTarget: 3, reps: '4-8', exerciseId: 'sq_paused', notes: 'Back-off set or variation' },
                    { muscle: 'HAMSTRINGS', setTarget: 4, reps: '6-10', exerciseId: 'sldl', supersetId: 'ss_gent_t_1', notes: 'SL Deadlifts + weighted pull-ups + leg raises' },
                    { muscle: 'BACK', setTarget: 4, reps: '4-6', exerciseId: 'pullup', supersetId: 'ss_gent_t_1' },
                    { muscle: 'ABS', setTarget: 4, reps: 'AMRAP', exerciseId: 'leg_raise', supersetId: 'ss_gent_t_1' },
                    { muscle: 'CALVES', setTarget: 4, reps: '10-15', exerciseId: 'calf_raise', supersetId: 'ss_gent_t_2', notes: 'Calf raises + neck work' },
                    { muscle: 'NECK', setTarget: 4, reps: '10-15', exerciseId: 'neck_curl', supersetId: 'ss_gent_t_2' }
                ]
            },
            {
                id: 'd3', dayName: { en: 'Thursday (Upper Bench)', es: 'Jueves (Torso Banca)' },
                slots: [
                    { muscle: 'CHEST', setTarget: 3, reps: '4-6', exerciseId: 'bp_bar', notes: 'Heavy Bench Press' },
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '8-12', exerciseId: 'ohp_db', supersetId: 'ss_gent_th_1', notes: 'DB OHP + French press' },
                    { muscle: 'TRICEPS', setTarget: 4, reps: '6-10', exerciseId: 'tri_ext', supersetId: 'ss_gent_th_1' },
                    { muscle: 'BACK', setTarget: 4, reps: '4-6', exerciseId: 'chinup', supersetId: 'ss_gent_th_2', notes: 'Weighted chin-ups + knee raises + wrist curls' },
                    { muscle: 'ABS', setTarget: 4, reps: 'AMRAP', exerciseId: 'knee_raise', supersetId: 'ss_gent_th_2' },
                    { muscle: 'FOREARMS', setTarget: 4, reps: '8-12', exerciseId: 'wrist_curl', supersetId: 'ss_gent_th_2' }
                ]
            },
            {
                id: 'd4', dayName: { en: 'Friday (Lower Deadlifts)', es: 'Viernes (Pierna Peso Muerto)' },
                slots: [
                    { muscle: 'BACK', setTarget: 3, reps: '2-5', exerciseId: 'deadlift', notes: 'Heavy conventional deadlifts' },
                    { muscle: 'QUADS', setTarget: 4, reps: '8-12', exerciseId: 'sq_hack', notes: 'Squat variation or deadlift back-off' },
                    { muscle: 'BACK', setTarget: 4, reps: '8-12', exerciseId: 'rack_pull', supersetId: 'ss_gent_f_1', notes: 'Rack pulls + unweighted pull-ups + leg raises' },
                    { muscle: 'BACK', setTarget: 4, reps: 'AMRAP', exerciseId: 'pullup', supersetId: 'ss_gent_f_1' },
                    { muscle: 'ABS', setTarget: 4, reps: 'AMRAP', exerciseId: 'leg_raise', supersetId: 'ss_gent_f_1' }
                ]
            },
            {
                id: 'd5', dayName: { en: 'Saturday (Arms/Shoulders)', es: 'Sábado (Brazos/Hombros)' },
                slots: [
                    { muscle: 'BICEPS', setTarget: 4, reps: '8-12', exerciseId: 'curl_hammer', supersetId: 'ss_gent_s_1', notes: 'Hammer curls + DB OHP + French press + Seal rows' },
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '6-10', exerciseId: 'ohp_db', supersetId: 'ss_gent_s_1' },
                    { muscle: 'TRICEPS', setTarget: 4, reps: '6-10', exerciseId: 'tri_ext', supersetId: 'ss_gent_s_1' },
                    { muscle: 'BACK', setTarget: 4, reps: '8-12', exerciseId: 'row_cable', supersetId: 'ss_gent_s_1' }
                ]
            }
        ]
    },

    // =========================================================
    // 9. SILVER ERA (Steve Reeves Classic Aesthetics)
    // =========================================================
    {
        id: 'nh_silver_era',
        name: 'NH Silver Era Reeves',
        title: { en: 'Silver Era Aesthetics (Steve Reeves)', es: 'Alineación de la Era de Plata (Steve Reeves)' },
        description: { en: 'Natural Hypertrophy - High classic frequency and volume for ultimate symmetric aesthetics.', es: 'Natural Hypertrophy - Alta frecuencia clásica para estética y simetría perfectas.' },
        isPro: true,
        order: 210,
        program: [
            {
                id: 'd1', dayName: { en: 'Monday', es: 'Lunes' },
                slots: [
                    { muscle: 'QUADS', setTarget: 4, reps: '6-12', exerciseId: 'sq_bar', supersetId: 'ss_reev_m_1', notes: 'Barbell or Hack Squats + Seal rows' },
                    { muscle: 'BACK', setTarget: 4, reps: '8-15', exerciseId: 'row_cable', supersetId: 'ss_reev_m_1' },
                    { muscle: 'CHEST', setTarget: 4, reps: '6-10', exerciseId: 'bp_inc', supersetId: 'ss_reev_m_2', notes: 'Incline Press + Reverse Curls' },
                    { muscle: 'BICEPS', setTarget: 4, reps: '6-12', exerciseId: 'curl_hammer', supersetId: 'ss_reev_m_2' },
                    { muscle: 'HAMSTRINGS', setTarget: 4, reps: '8-12', exerciseId: 'rdl', supersetId: 'ss_reev_m_3', notes: 'RDLs + Upright rows + Neck curls' },
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '10-15', exerciseId: 'lat_raise', supersetId: 'ss_reev_m_3' },
                    { muscle: 'NECK', setTarget: 4, reps: '15-20', exerciseId: 'neck_curl', supersetId: 'ss_reev_m_3' }
                ]
            },
            {
                id: 'd2', dayName: { en: 'Wednesday', es: 'Miércoles' },
                slots: [
                    { muscle: 'BACK', setTarget: 4, reps: '8-10', exerciseId: 'pendlay_row', supersetId: 'ss_reev_w_1', notes: 'Rows or Good mornings + Shrugs' },
                    { muscle: 'TRAPS', setTarget: 4, reps: '12-20', exerciseId: 'shrug_db', supersetId: 'ss_reev_w_1' },
                    { muscle: 'CHEST', setTarget: 4, reps: '6-10', exerciseId: 'dips', supersetId: 'ss_reev_w_2', notes: 'Weighted Dips or Close Grip Bench + Split squats' },
                    { muscle: 'QUADS', setTarget: 4, reps: '12-15', exerciseId: 'lunges', supersetId: 'ss_reev_w_2' },
                    { muscle: 'BACK', setTarget: 3, reps: '4-6', exerciseId: 'chinup', supersetId: 'ss_reev_w_3', notes: 'Weighted chin-ups + DB Shoulder press + Leg curls' },
                    { muscle: 'SHOULDERS', setTarget: 3, reps: '6-10', exerciseId: 'ohp_db', supersetId: 'ss_reev_w_3' },
                    { muscle: 'HAMSTRINGS', setTarget: 3, reps: '12-15', exerciseId: 'leg_curl', supersetId: 'ss_reev_w_3' }
                ]
            },
            {
                id: 'd3', dayName: { en: 'Friday', es: 'Viernes' },
                slots: [
                    { muscle: 'BACK', setTarget: 3, reps: '3-5', exerciseId: 'deadlift', supersetId: 'ss_reev_f_1', notes: 'Conventional deadlifts + Triceps extension' },
                    { muscle: 'TRICEPS', setTarget: 3, reps: '10-12', exerciseId: 'tri_push', supersetId: 'ss_reev_f_1' },
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '6-12', exerciseId: 'ohp', supersetId: 'ss_reev_f_2', notes: 'Barbell OHP or BTN + DB pullovers' },
                    { muscle: 'BACK', setTarget: 4, reps: '8-12', exerciseId: 'pullover_db', supersetId: 'ss_reev_f_2' },
                    { muscle: 'QUADS', setTarget: 4, reps: '8-15', exerciseId: 'leg_press', supersetId: 'ss_reev_f_3', notes: 'Leg press + DB/Cable chest flies + Hammer curls' },
                    { muscle: 'CHEST', setTarget: 4, reps: '10-15', exerciseId: 'pec_fly', supersetId: 'ss_reev_f_3' },
                    { muscle: 'BICEPS', setTarget: 4, reps: '8-12', exerciseId: 'curl_hammer', supersetId: 'ss_reev_f_3' }
                ]
            }
        ]
    },

    // =========================================================
    // 10. APOLLONIAN PHYSIQUE (Greek Aesthetics)
    // =========================================================
    {
        id: 'nh_apollonian',
        name: 'NH Apollonian Physique',
        title: { en: 'Apollonian Physique', es: 'Físico Apolíneo' },
        description: { en: 'Natural Hypertrophy - Upper, Lower, Hybrid split designed for clean proportion and flow.', es: 'Natural Hypertrophy - Split Torso/Pierna/Híbrido enfocado en proporciones clásicas.' },
        isPro: true,
        order: 211,
        program: [
            {
                id: 'd1', dayName: { en: 'Monday (Upper)', es: 'Lunes (Torso)' },
                slots: [
                    { muscle: 'CHEST', setTarget: 3, reps: '6-10', exerciseId: 'bp_bar', supersetId: 'ss_apol_m_1', notes: 'Bench Press OR Dips + DB rows' },
                    { muscle: 'BACK', setTarget: 3, reps: '8-12', exerciseId: 'row_db', supersetId: 'ss_apol_m_1' },
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '6-12', exerciseId: 'ohp_db', supersetId: 'ss_apol_m_2', notes: 'DB OHP + Abs' },
                    { muscle: 'ABS', setTarget: 4, reps: 'AMRAP', exerciseId: 'leg_raise', supersetId: 'ss_apol_m_2' },
                    { muscle: 'TRICEPS', setTarget: 4, reps: '8-12', exerciseId: 'skull_crusher', supersetId: 'ss_apol_m_3', notes: 'Skull crushers or French press + Hammer curls' },
                    { muscle: 'BICEPS', setTarget: 4, reps: '6-10', exerciseId: 'curl_hammer', supersetId: 'ss_apol_m_3' }
                ]
            },
            {
                id: 'd2', dayName: { en: 'Wednesday (Lower/Hybrid)', es: 'Miércoles (Pierna/Híbrido)' },
                slots: [
                    { muscle: 'BACK', setTarget: 3, reps: '3-5', exerciseId: 'deadlift', notes: 'Deadlifts or RDLs' },
                    { muscle: 'HAMSTRINGS', setTarget: 3, reps: '8-12', exerciseId: 'rdl' },
                    { muscle: 'CALVES', setTarget: 3, reps: '15-20', exerciseId: 'calf_raise' },
                    { muscle: 'BACK', setTarget: 4, reps: '4-8', exerciseId: 'pullup', supersetId: 'ss_apol_w_1', notes: 'Weighted pull-ups + Lunges + Shrugs' },
                    { muscle: 'QUADS', setTarget: 4, reps: '10-15', exerciseId: 'lunges', supersetId: 'ss_apol_w_1' },
                    { muscle: 'TRAPS', setTarget: 4, reps: '12-15', exerciseId: 'shrug_db', supersetId: 'ss_apol_w_1' }
                ]
            },
            {
                id: 'd3', dayName: { en: 'Friday (Arms/Upper Hybrid)', es: 'Viernes (Brazos/Torso Híbrido)' },
                slots: [
                    { muscle: 'CHEST', setTarget: 3, reps: '6-10', exerciseId: 'bp_flat', supersetId: 'ss_apol_f_1', notes: 'Close grip bench or pushups + Seal rows' },
                    { muscle: 'BACK', setTarget: 3, reps: '8-12', exerciseId: 'pendlay_row', supersetId: 'ss_apol_f_1' },
                    { muscle: 'BICEPS', setTarget: 3, reps: '6-8', exerciseId: 'curl_db' },
                    { muscle: 'SHOULDERS', setTarget: 3, reps: '12-15', exerciseId: 'lat_raise', notes: 'Lateral raises' },
                    { muscle: 'TRICEPS', setTarget: 3, reps: '15-20', exerciseId: 'tri_push' }
                ]
            }
        ]
    },

    // =========================================================
    // 11. ALEX EUBANK GREEK GOD
    // =========================================================
    {
        id: 'nh_alex_eubank',
        name: 'NH Revamped Greek God (Eubank)',
        title: { en: 'Revamped Greek God Program', es: 'Programa Dios Griego Mejorado (Alex Eubank)' },
        description: { en: 'Natural Hypertrophy - Revamped 4 days aesthetic program emphasizing high density.', es: 'Natural Hypertrophy - Programa estético de 4 días enfocado en alta densidad.' },
        isPro: true,
        order: 212,
        program: [
            {
                id: 'd1', dayName: { en: 'Monday (Chest/Back/Shoulders/Triceps)', es: 'Lunes (Pecho/Espalda/Hombro/Tríceps)' },
                slots: [
                    { muscle: 'CHEST', setTarget: 4, reps: '6-12', exerciseId: 'bp_bar', supersetId: 'ss_eub_m_1', notes: 'Bench Press + Straight arm pulldown' },
                    { muscle: 'BACK', setTarget: 4, reps: '10-15', exerciseId: 'lat_prayer', supersetId: 'ss_eub_m_1' },
                    { muscle: 'BACK', setTarget: 4, reps: '8-12', exerciseId: 'row_db', supersetId: 'ss_eub_m_2', notes: 'Barbell Row + DB shoulder press' },
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '6-10', exerciseId: 'ohp_db', supersetId: 'ss_eub_m_2' },
                    { muscle: 'TRICEPS', setTarget: 4, reps: '8-10', exerciseId: 'skull_crusher', supersetId: 'ss_eub_m_3', notes: 'Skull-crushers + lateral raises + Decline sit-ups' },
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '12-15', exerciseId: 'lat_raise', supersetId: 'ss_eub_m_3' },
                    { muscle: 'ABS', setTarget: 4, reps: '10-20', exerciseId: 'abs_cable', supersetId: 'ss_eub_m_3' }
                ]
            },
            {
                id: 'd2', dayName: { en: 'Wednesday (Legs/Arms)', es: 'Miércoles (Pierna/Brazo)' },
                slots: [
                    { muscle: 'QUADS', setTarget: 4, reps: '4-8', exerciseId: 'sq_bar', supersetId: 'ss_eub_w_1', notes: 'Squats + Neck curls' },
                    { muscle: 'NECK', setTarget: 4, reps: '15-20', exerciseId: 'neck_curl', supersetId: 'ss_eub_w_1' },
                    { muscle: 'HAMSTRINGS', setTarget: 4, reps: '8-12', exerciseId: 'rdl', supersetId: 'ss_eub_w_2', notes: 'RDLs + EZ bar curls' },
                    { muscle: 'BICEPS', setTarget: 4, reps: '6-10', exerciseId: 'curl_ez', supersetId: 'ss_eub_w_2' },
                    { muscle: 'QUADS', setTarget: 4, reps: '15-18', exerciseId: 'leg_ext', supersetId: 'ss_eub_w_3', notes: 'Extensions + Hammer curls + Seated calf raises' },
                    { muscle: 'BICEPS', setTarget: 4, reps: '8-12', exerciseId: 'curl_hammer', supersetId: 'ss_eub_w_3' },
                    { muscle: 'CALVES', setTarget: 4, reps: '15-20', exerciseId: 'calf_raise', supersetId: 'ss_eub_w_3' }
                ]
            },
            {
                id: 'd3', dayName: { en: 'Thursday (Chest/Back/Shoulders/Triceps)', es: 'Jueves (Pecho/Espalda/Hombro/Tríceps)' },
                slots: [
                    { muscle: 'CHEST', setTarget: 4, reps: '6-10', exerciseId: 'bp_inc', supersetId: 'ss_eub_th_1', notes: 'Incline DB Press + Close grip pulldown' },
                    { muscle: 'BACK', setTarget: 4, reps: '8-15', exerciseId: 'lat_pull', supersetId: 'ss_eub_th_1' },
                    { muscle: 'BACK', setTarget: 4, reps: '10-15', exerciseId: 'row_cable', supersetId: 'ss_eub_th_2', notes: 'Seated rows + Flat DB fly' },
                    { muscle: 'CHEST', setTarget: 4, reps: '12-15', exerciseId: 'pec_fly', supersetId: 'ss_eub_th_2' },
                    { muscle: 'TRICEPS', setTarget: 4, reps: '10-12', exerciseId: 'skull_crusher', supersetId: 'ss_eub_th_3', notes: 'DB Skullcrushers + Upright rows + V sit-ups' },
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '8-10', exerciseId: 'lat_raise', supersetId: 'ss_eub_th_3' },
                    { muscle: 'ABS', setTarget: 4, reps: 'AMRAP', exerciseId: 'abs_cable', supersetId: 'ss_eub_th_3' }
                ]
            },
            {
                id: 'd4', dayName: { en: 'Saturday (Legs/Arms)', es: 'Sábado (Pierna/Brazo)' },
                slots: [
                    { muscle: 'BACK', setTarget: 3, reps: '3-5', exerciseId: 'deadlift', supersetId: 'ss_eub_s_1', notes: 'Deadlifts + Neck curls' },
                    { muscle: 'NECK', setTarget: 3, reps: '10-15', exerciseId: 'neck_curl', supersetId: 'ss_eub_s_1' },
                    { muscle: 'QUADS', setTarget: 4, reps: '10-15', exerciseId: 'leg_press', supersetId: 'ss_eub_s_2', notes: 'Leg Press + Weighted chin-ups' },
                    { muscle: 'BACK', setTarget: 4, reps: '4-8', exerciseId: 'chinup', supersetId: 'ss_eub_s_2' },
                    { muscle: 'BICEPS', setTarget: 4, reps: '6-12', exerciseId: 'curl_hammer', supersetId: 'ss_eub_s_3', notes: 'Pinwheel curls + Leg curls + Standing calf raises' },
                    { muscle: 'HAMSTRINGS', setTarget: 4, reps: '10-15', exerciseId: 'leg_curl', supersetId: 'ss_eub_s_3' },
                    { muscle: 'CALVES', setTarget: 4, reps: '15-20', exerciseId: 'calf_raise', supersetId: 'ss_eub_s_3' }
                ]
            }
        ]
    },

    // =========================================================
    // 12. BALD OMNI MAN HYBRID (Calisthenics & Heavy Iron)
    // =========================================================
    {
        id: 'nh_bald_omni_hybrid',
        name: 'NH Hybrid Calisthenics (Bald Omni Man)',
        title: { en: 'The PERFECT Hybrid Calisthenics Program', es: 'El Programa de Calistenia Híbrida PERFECTO' },
        description: { en: 'Natural Hypertrophy & Bald Omni Man collaboration combining heavy metal with rings.', es: 'Colaboración de Natural Hypertrophy y Bald Omni Man uniendo calistenia con hierros.' },
        isPro: true,
        order: 213,
        program: [
            {
                id: 'd1', dayName: { en: 'Monday (Upper)', es: 'Lunes (Torso)' },
                slots: [
                    { muscle: 'CHEST', setTarget: 6, reps: '10-15', exerciseId: 'pushup', supersetId: 'ss_hybrid_m_1', notes: 'Weighted push-ups (deficit) + Reverse curls' },
                    { muscle: 'BICEPS', setTarget: 6, reps: '8-15', exerciseId: 'curl_hammer', supersetId: 'ss_hybrid_m_1' },
                    { muscle: 'BACK', setTarget: 4, reps: 'AMRAP', exerciseId: 'pullup', supersetId: 'ss_hybrid_m_2', notes: 'Ring rows or BB rows + EZ/DB curls' },
                    { muscle: 'BICEPS', setTarget: 4, reps: '6-10', exerciseId: 'curl_ez', supersetId: 'ss_hybrid_m_2' },
                    { muscle: 'CHEST', setTarget: 4, reps: '12-15', exerciseId: 'pec_fly', supersetId: 'ss_hybrid_m_3', notes: 'Incline cable flies + Lying extensions' },
                    { muscle: 'TRICEPS', setTarget: 4, reps: '10-12', exerciseId: 'skull_crusher', supersetId: 'ss_hybrid_m_3' }
                ]
            },
            {
                id: 'd2', dayName: { en: 'Wednesday (Lower)', es: 'Miércoles (Piernas)' },
                slots: [
                    { muscle: 'QUADS', setTarget: 5, reps: '6-12', exerciseId: 'sq_bar', supersetId: 'ss_hybrid_w_1', notes: 'Heel elevated squats + Neck extensions' },
                    { muscle: 'NECK', setTarget: 5, reps: '10-20', exerciseId: 'neck_ext', supersetId: 'ss_hybrid_w_1' },
                    { muscle: 'BACK', setTarget: 5, reps: '4-10', exerciseId: 'chinup', supersetId: 'ss_hybrid_w_2', notes: 'Weighted chin-ups + Hanging knee raises' },
                    { muscle: 'ABS', setTarget: 5, reps: 'AMRAP', exerciseId: 'knee_raise', supersetId: 'ss_hybrid_w_2' },
                    { muscle: 'HAMSTRINGS', setTarget: 4, reps: '10-15', exerciseId: 'rdl', notes: 'RDLs or Hyperextensions' }
                ]
            },
            {
                id: 'd3', dayName: { en: 'Friday (Push)', es: 'Viernes (Empuje)' },
                slots: [
                    { muscle: 'CHEST', setTarget: 6, reps: 'AMRAP', exerciseId: 'pushup', supersetId: 'ss_hybrid_f_1', notes: 'Handstand or decline ring push-ups + crossbody cable curls' },
                    { muscle: 'BICEPS', setTarget: 6, reps: '10-20', exerciseId: 'curl_cable', supersetId: 'ss_hybrid_f_1' },
                    { muscle: 'CHEST', setTarget: 4, reps: '12-15', exerciseId: 'pec_fly', supersetId: 'ss_hybrid_f_2', notes: 'Ring guillotine flies + tricep extension' },
                    { muscle: 'TRICEPS', setTarget: 4, reps: 'AMRAP', exerciseId: 'tri_push', supersetId: 'ss_hybrid_f_2' },
                    { muscle: 'SHOULDERS', setTarget: 3, reps: '12-15', exerciseId: 'lat_raise', supersetId: 'ss_hybrid_f_3', notes: 'Upright rows + ring rows' },
                    { muscle: 'BACK', setTarget: 3, reps: 'AMRAP', exerciseId: 'pullup', supersetId: 'ss_hybrid_f_3' }
                ]
            },
            {
                id: 'd4', dayName: { en: 'Saturday (Pull)', es: 'Sábado (Tracción)' },
                slots: [
                    { muscle: 'HAMSTRINGS', setTarget: 4, reps: '8-12', exerciseId: 'rdl', supersetId: 'ss_hybrid_s_1', notes: 'RDLs or stiff legged deadlifts + neck flexions' },
                    { muscle: 'NECK', setTarget: 4, reps: '10-20', exerciseId: 'neck_curl', supersetId: 'ss_hybrid_s_1' },
                    { muscle: 'BACK', setTarget: 4, reps: '6-10', exerciseId: 'pullup', supersetId: 'ss_hybrid_s_2', notes: 'Weighted pullups + Hanging leg raises' },
                    { muscle: 'ABS', setTarget: 4, reps: 'AMRAP', exerciseId: 'leg_raise', supersetId: 'ss_hybrid_s_2' },
                    { muscle: 'QUADS', setTarget: 4, reps: '10-15', exerciseId: 'lunges', notes: 'Split squats or sissy squats' }
                ]
            }
        ]
    },

    // =========================================================
    // 13. GUTS TRAINING PROGRAM (Berserk Classic Heavy)
    // =========================================================
    {
        id: 'nh_guts',
        name: 'NH Guts Training Program',
        title: { en: 'Guts Training Program (Berserk)', es: 'Programa de Guts (Berserk)' },
        description: { en: 'Natural Hypertrophy - Survive and grow with the brute force of the Black Swordsman.', es: 'Natural Hypertrophy - Sobrevive y crece con la fuerza bruta del Espadachín Negro.' },
        isPro: true,
        order: 214,
        program: [
            {
                id: 'd1', dayName: { en: 'Monday (Upper - Chest/Shoulders)', es: 'Lunes (Torso - Pecho/Hombros)' },
                slots: [
                    { muscle: 'CHEST', setTarget: 4, reps: '4-8', exerciseId: 'bp_bar', supersetId: 'ss_guts_m_1', notes: 'Bench press OR Dips OR Weighted Push-ups + Pullovers' },
                    { muscle: 'BACK', setTarget: 4, reps: '8-12', exerciseId: 'pullover_db', supersetId: 'ss_guts_m_1' },
                    { muscle: 'SHOULDERS', setTarget: 3, reps: '6-10', exerciseId: 'ohp', supersetId: 'ss_guts_m_2', notes: 'Barbell OR DB OHP + Weighted Chin-ups' },
                    { muscle: 'BACK', setTarget: 3, reps: '6-8', exerciseId: 'chinup', supersetId: 'ss_guts_m_2' },
                    { muscle: 'CHEST', setTarget: 3, reps: 'AMRAP', exerciseId: 'diamond_pushup', supersetId: 'gs_guts_m_3', notes: 'Diamond push-ups + Behind the head extensions + Neck curls' },
                    { muscle: 'TRICEPS', setTarget: 3, reps: '6-12', exerciseId: 'tri_ext', supersetId: 'gs_guts_m_3' },
                    { muscle: 'NECK', setTarget: 3, reps: '12-15', exerciseId: 'neck_curl', supersetId: 'gs_guts_m_3' }
                ]
            },
            {
                id: 'd2', dayName: { en: 'Wednesday (Upper - Back/Traps)', es: 'Miércoles (Torso - Espalda/Trapecios)' },
                slots: [
                    { muscle: 'BACK', setTarget: 4, reps: '6-10', exerciseId: 'pendlay_row', supersetId: 'ss_guts_w_1', notes: 'Barbell rows OR Deadlifts (alternate weekly) + Single leg calves' },
                    { muscle: 'CALVES', setTarget: 4, reps: 'AMRAP', exerciseId: 'calf_raise', supersetId: 'ss_guts_w_1' },
                    { muscle: 'HAMSTRINGS', setTarget: 4, reps: '6-12', exerciseId: 'good_morning', supersetId: 'ss_guts_w_2', notes: 'Zercher/SSB Good mornings OR Weighted pull-ups' },
                    { muscle: 'BACK', setTarget: 4, reps: '3-5', exerciseId: 'pullup', supersetId: 'ss_guts_w_2' },
                    { muscle: 'BACK', setTarget: 4, reps: '8-12', exerciseId: 'pullover_db', supersetId: 'gs_guts_w_3', notes: 'Hyperextensions + Supinated finger curls + DB Curls' },
                    { muscle: 'FOREARMS', setTarget: 4, reps: '6-10', exerciseId: 'finger_curl', supersetId: 'gs_guts_w_3' },
                    { muscle: 'BICEPS', setTarget: 4, reps: '4-10', exerciseId: 'curl_db', supersetId: 'gs_guts_w_3' }
                ]
            },
            {
                id: 'd3', dayName: { en: 'Friday (Upper - Arms)', es: 'Viernes (Torso - Brazos)' },
                slots: [
                    { muscle: 'BICEPS', setTarget: 4, reps: '6-10', exerciseId: 'curl_bar', supersetId: 'ss_guts_f_1', notes: 'Barbell curls + Skull crushers' },
                    { muscle: 'TRICEPS', setTarget: 4, reps: '10-15', exerciseId: 'skull_crusher', supersetId: 'ss_guts_f_1' },
                    { muscle: 'CHEST', setTarget: 3, reps: '6-10', exerciseId: 'bp_flat', supersetId: 'ss_guts_f_2', notes: 'Close grip bench OR Diamond push-ups + Hammer curls' },
                    { muscle: 'BICEPS', setTarget: 3, reps: '8-12', exerciseId: 'curl_hammer', supersetId: 'ss_guts_f_2' },
                    { muscle: 'SHOULDERS', setTarget: 3, reps: '8-12', exerciseId: 'ohp_db', supersetId: 'gs_guts_f_3', notes: 'DB OHP OR Decline push-ups + Finger curls + Neck curls' },
                    { muscle: 'FOREARMS', setTarget: 3, reps: '8-15', exerciseId: 'finger_curl', supersetId: 'gs_guts_f_3' },
                    { muscle: 'NECK', setTarget: 3, reps: '15-20', exerciseId: 'neck_curl', supersetId: 'gs_guts_f_3' }
                ]
            },
            {
                id: 'd4', dayName: { en: 'Saturday (Legs)', es: 'Sábado (Piernas)' },
                slots: [
                    { muscle: 'BACK', setTarget: 3, reps: '5', exerciseId: 'deadlift', supersetId: 'ss_guts_s_1', notes: 'Deadlifts OR Zercher squats + Shrugs' },
                    { muscle: 'TRAPS', setTarget: 3, reps: 'AMRAP', exerciseId: 'shrug_db', supersetId: 'ss_guts_s_1' },
                    { muscle: 'QUADS', setTarget: 3, reps: '4', exerciseId: 'sq_paused', notes: 'Pause squats OR Block pulls' },
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '12-15', exerciseId: 'face_pull', supersetId: 'ss_guts_s_2', notes: 'Face-pulls + DB leg raises' },
                    { muscle: 'ABS', setTarget: 4, reps: '15-20', exerciseId: 'leg_raise', supersetId: 'ss_guts_s_2' }
                ]
            }
        ]
    },

    // =========================================================
    // 14. KRATOS PROGRAM (Advanced Hypertrophy Grid)
    // =========================================================
    {
        id: 'nh_kratos',
        name: 'NH Kratos Advanced',
        title: { en: 'Kratos Program (Advanced)', es: 'Programa de Kratos (Avanzado)' },
        description: { en: 'Natural Hypertrophy - Built for war and godly hypertrophic dominance.', es: 'Natural Hypertrophy - Diseñado para la guerra y la dominación muscular.' },
        isPro: true,
        order: 215,
        program: [
            {
                id: 'd1', dayName: { en: 'Monday (Upper 1)', es: 'Lunes (Torso 1)' },
                slots: [
                    { muscle: 'CHEST', setTarget: 4, reps: '6-10', exerciseId: 'bp_flat', supersetId: 'ss_kratos_m_1', notes: 'Close grip bench OR Dips + DB or Meadows rows' },
                    { muscle: 'BACK', setTarget: 4, reps: '8-12', exerciseId: 'row_db', supersetId: 'ss_kratos_m_1' },
                    { muscle: 'SHOULDERS', setTarget: 3, reps: '6-10', exerciseId: 'ohp_db', supersetId: 'ss_kratos_m_2', notes: 'DB press OR Arnold press + Triceps extensions' },
                    { muscle: 'TRICEPS', setTarget: 3, reps: '8-12', exerciseId: 'tri_ext', supersetId: 'ss_kratos_m_2' },
                    { muscle: 'BACK', setTarget: 4, reps: '10-12', exerciseId: 'pullover_db', supersetId: 'ss_kratos_m_3', notes: 'DB pullovers + Neck curls' },
                    { muscle: 'NECK', setTarget: 4, reps: '15-20', exerciseId: 'neck_curl', supersetId: 'ss_kratos_m_3' }
                ]
            },
            {
                id: 'd2', dayName: { en: 'Tuesday (Lower 1)', es: 'Martes (Piernas 1)' },
                slots: [
                    { muscle: 'BACK', setTarget: 4, reps: '10-12', exerciseId: 'pendlay_row', supersetId: 'ss_kratos_t_1', notes: 'Barbell rows + Seated OR Standing calf raises' },
                    { muscle: 'CALVES', setTarget: 4, reps: '15-20', exerciseId: 'calf_raise', supersetId: 'ss_kratos_t_1' },
                    { muscle: 'BACK', setTarget: 3, reps: '6-10', exerciseId: 'rack_pull', supersetId: 'ss_kratos_t_2', notes: 'Block pulls + Russian twists' },
                    { muscle: 'ABS', setTarget: 3, reps: '12-15', exerciseId: 'abs_cable', supersetId: 'ss_kratos_t_2' },
                    { muscle: 'QUADS', setTarget: 4, reps: '10-15', exerciseId: 'leg_press', supersetId: 'ss_kratos_t_3', notes: 'Leg press OR Split squats + Pinwheel curls' },
                    { muscle: 'BICEPS', setTarget: 4, reps: '8-12', exerciseId: 'curl_hammer', supersetId: 'ss_kratos_t_3' }
                ]
            },
            {
                id: 'd3', dayName: { en: 'Thursday (Upper 2)', es: 'Jueves (Torso 2)' },
                slots: [
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '12-15', exerciseId: 'ohp', supersetId: 'ss_kratos_th_1', notes: 'DB/BB OHP OR Viking press + Seal rows' },
                    { muscle: 'BACK', setTarget: 4, reps: '10-15', exerciseId: 'row_cable', supersetId: 'ss_kratos_th_1' },
                    { muscle: 'BACK', setTarget: 3, reps: '6-8', exerciseId: 'chinup', supersetId: 'ss_kratos_th_2', notes: 'Weighted chin-ups + Neck extensions' },
                    { muscle: 'NECK', setTarget: 3, reps: '15-20', exerciseId: 'neck_ext', supersetId: 'ss_kratos_th_2' },
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '10-15', exerciseId: 'lat_raise', supersetId: 'ss_kratos_th_3', notes: 'Lateral raises + Cable curls' },
                    { muscle: 'BICEPS', setTarget: 4, reps: '12-15', exerciseId: 'curl_cable', supersetId: 'ss_kratos_th_3' }
                ]
            },
            {
                id: 'd4', dayName: { en: 'Friday (Lower 2)', es: 'Viernes (Piernas 2)' },
                slots: [
                    { muscle: 'QUADS', setTarget: 4, reps: '6-8', exerciseId: 'sq_bar', supersetId: 'ss_kratos_f_1', notes: 'Squats or Hack squats + Hang pulls' },
                    { muscle: 'TRAPS', setTarget: 4, reps: '10-15', exerciseId: 'shrug_db', supersetId: 'ss_kratos_f_1' },
                    { muscle: 'HAMSTRINGS', setTarget: 3, reps: '8-12', exerciseId: 'rdl', supersetId: 'ss_kratos_f_2', notes: 'RDLs OR Block-pulls + Decline sit-ups' },
                    { muscle: 'ABS', setTarget: 3, reps: '12-15', exerciseId: 'abs_cable', supersetId: 'ss_kratos_f_2' },
                    { muscle: 'GLUTES', setTarget: 4, reps: '10-15', exerciseId: 'glute_bridge', supersetId: 'ss_kratos_f_3', notes: 'Hip thrusts + Power shrugs' },
                    { muscle: 'TRAPS', setTarget: 4, reps: '8-10', exerciseId: 'shrug_db', supersetId: 'ss_kratos_f_3' }
                ]
            }
        ]
    },

    // =========================================================
    // 15. SUPERHERO AESTHETICS (Kinobody Hollywood)
    // =========================================================
    {
        id: 'nh_kinobody',
        name: 'NH Kinobody Hollywood',
        title: { en: 'Superhero Aesthetics (Kinobody)', es: 'Superhero Aesthetics (Kinobody)' },
        description: { en: 'Natural Hypertrophy - Rest-Pause emphasis for a dense, angular Hollywood physique.', es: 'Natural Hypertrophy - Énfasis en Rest-Pause para un físico Hollywood denso y angular.' },
        isPro: true,
        order: 216,
        program: [
            {
                id: 'd1', dayName: { en: 'Tuesday (Shoulders & Back)', es: 'Martes (Hombros y Espalda)' },
                slots: [
                    { muscle: 'BACK', setTarget: 3, reps: '5-8', exerciseId: 'pullup', supersetId: 'ss_kino_t_1', notes: 'Weighted pull-ups (Rest-Pause on last set) + Abs/Calves/Neck' },
                    { muscle: 'ABS', setTarget: 3, reps: 'AMRAP', exerciseId: 'leg_raise', supersetId: 'ss_kino_t_1' },
                    { muscle: 'SHOULDERS', setTarget: 3, reps: '6-10', exerciseId: 'ohp', supersetId: 'ss_kino_t_2', notes: 'Seated/Standing OHP + DB Rows' },
                    { muscle: 'BACK', setTarget: 3, reps: '6-12', exerciseId: 'row_db', supersetId: 'ss_kino_t_2' },
                    { muscle: 'CHEST', setTarget: 4, reps: '12-15', exerciseId: 'pec_fly', supersetId: 'ss_kino_t_3', notes: 'DB flyes + Cable lateral raises' },
                    { muscle: 'SHOULDERS', setTarget: 4, reps: '10-15', exerciseId: 'lat_raise', supersetId: 'ss_kino_t_3' }
                ]
            },
            {
                id: 'd2', dayName: { en: 'Thursday (Lower Body)', es: 'Jueves (Piernas)' },
                slots: [
                    { muscle: 'QUADS', setTarget: 4, reps: '12-15', exerciseId: 'lunges', supersetId: 'ss_kino_th_1', notes: 'Bulgarian split squats (Rest-Pause on last set) + Neck' },
                    { muscle: 'NECK', setTarget: 4, reps: '15-20', exerciseId: 'neck_curl', supersetId: 'ss_kino_th_1' },
                    { muscle: 'HAMSTRINGS', setTarget: 4, reps: '6-12', exerciseId: 'rdl', supersetId: 'ss_kino_th_2', notes: 'RDLs + Leg extensions' },
                    { muscle: 'QUADS', setTarget: 4, reps: '15-20', exerciseId: 'leg_ext', supersetId: 'ss_kino_th_2' },
                    { muscle: 'CALVES', setTarget: 4, reps: '15-20', exerciseId: 'calf_raise', supersetId: 'ss_kino_th_3', notes: 'Calf raises + Hanging leg raises' },
                    { muscle: 'ABS', setTarget: 4, reps: 'AMRAP', exerciseId: 'leg_raise', supersetId: 'ss_kino_th_3' }
                ]
            },
            {
                id: 'd3', dayName: { en: 'Saturday (Chest & Arms)', es: 'Sábado (Pecho y Brazos)' },
                slots: [
                    { muscle: 'CHEST', setTarget: 3, reps: '6-10', exerciseId: 'bp_inc', supersetId: 'ss_kino_s_1', notes: 'Incline Bench (Rest-Pause on last set) + Abs/Neck' },
                    { muscle: 'ABS', setTarget: 3, reps: 'AMRAP', exerciseId: 'abs_cable', supersetId: 'ss_kino_s_1' },
                    { muscle: 'CHEST', setTarget: 3, reps: '6-10', exerciseId: 'bp_flat', supersetId: 'ss_kino_s_2', notes: 'Bench Press + Machine Row' },
                    { muscle: 'BACK', setTarget: 3, reps: '10-12', exerciseId: 'row_cable', supersetId: 'ss_kino_s_2' },
                    { muscle: 'BICEPS', setTarget: 4, reps: '6-10', exerciseId: 'curl_db', supersetId: 'ss_kino_s_3', notes: 'Incline curls + Triceps pushdowns' },
                    { muscle: 'TRICEPS', setTarget: 4, reps: '15-20', exerciseId: 'tri_push', supersetId: 'ss_kino_s_3' }
                ]
            }
        ]
    }
];