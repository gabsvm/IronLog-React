import { GlobalTemplate, ProgramDay } from '../../types';

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

export const NH_GENTLEMAN_SPLIT: ProgramDay[] = [
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
];

export const NH_APOLLONIAN: ProgramDay[] = [
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
];

export const NH_ALEX_EUBANK: ProgramDay[] = [
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
];

export const NH_BALD_OMNI_HYBRID: ProgramDay[] = [
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
];

export const NH_KINOBODY: ProgramDay[] = [
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
];

export const NH_AESTHETICS_AND_COLLABS_TEMPLATES: GlobalTemplate[] = [
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
        program: NH_GENTLEMAN_SPLIT,
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
        program: NH_APOLLONIAN,
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
        program: NH_ALEX_EUBANK,
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
        program: NH_BALD_OMNI_HYBRID,
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
        program: NH_KINOBODY,
    },
];
