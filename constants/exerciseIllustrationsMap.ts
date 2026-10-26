import type { ExerciseDef } from '../types';

export const EXERCISE_ILLUSTRATIONS: Record<string, string[]> = {
    "bp_bar": [
        "Barbell_Bench_Press_-_Medium_Grip/0.jpg",
        "Barbell_Bench_Press_-_Medium_Grip/1.jpg"
    ],
    "bp_inc": [
        "Incline_Dumbbell_Press/0.jpg",
        "Incline_Dumbbell_Press/1.jpg"
    ],
    "bp_inc_bar": [
        "Barbell_Incline_Bench_Press_-_Medium_Grip/0.jpg",
        "Barbell_Incline_Bench_Press_-_Medium_Grip/1.jpg"
    ],
    "bp_inc_wide": [
        "Barbell_Incline_Bench_Press_-_Medium_Grip/0.jpg",
        "Barbell_Incline_Bench_Press_-_Medium_Grip/1.jpg"
    ],
    "bp_flat": [
        "Machine_Bench_Press/0.jpg",
        "Machine_Bench_Press/1.jpg"
    ],
    "bp_mach_inc": [
        "Leverage_Incline_Chest_Press/0.jpg",
        "Leverage_Incline_Chest_Press/1.jpg"
    ],
    "bp_paused": [
        "Barbell_Bench_Press_-_Medium_Grip/0.jpg",
        "Barbell_Bench_Press_-_Medium_Grip/1.jpg"
    ],
    "wide_bench_press": [
        "Wide-Grip_Barbell_Bench_Press/0.jpg",
        "Wide-Grip_Barbell_Bench_Press/1.jpg"
    ],
    "close_grip_bench": [
        "Close-Grip_Barbell_Bench_Press/0.jpg",
        "Close-Grip_Barbell_Bench_Press/1.jpg"
    ],
    "close_grip_floor_press": [
        "Close-Grip_Barbell_Bench_Press/0.jpg",
        "Close-Grip_Barbell_Bench_Press/1.jpg"
    ],
    "neutral_db_press": [
        "Dumbbell_Bench_Press_with_Neutral_Grip/0.jpg",
        "Dumbbell_Bench_Press_with_Neutral_Grip/1.jpg"
    ],
    "pec_fly": [
        "Butterfly/0.jpg",
        "Butterfly/1.jpg"
    ],
    "db_fly": [
        "Dumbbell_Flyes/0.jpg",
        "Dumbbell_Flyes/1.jpg"
    ],
    "cable_crossover": [
        "Cable_Crossover/0.jpg",
        "Cable_Crossover/1.jpg"
    ],
    "pushup": [
        "Pushups/0.jpg",
        "Pushups/1.jpg"
    ],
    "lat_pull": [
        "Wide-Grip_Lat_Pulldown/0.jpg",
        "Wide-Grip_Lat_Pulldown/1.jpg"
    ],
    "lat_pull_supine": [
        "Underhand_Cable_Pulldowns/0.jpg",
        "Underhand_Cable_Pulldowns/1.jpg"
    ],
    "close_grip_lat_pulldown": [
        "Close-Grip_Front_Lat_Pulldown/0.jpg",
        "Close-Grip_Front_Lat_Pulldown/1.jpg"
    ],
    "one_arm_lat_pulldown": [
        "Wide-Grip_Lat_Pulldown/0.jpg",
        "Wide-Grip_Lat_Pulldown/1.jpg"
    ],
    "behind_neck_pulldown": [
        "Wide-Grip_Pulldown_Behind_The_Neck/0.jpg",
        "Wide-Grip_Pulldown_Behind_The_Neck/1.jpg"
    ],
    "pullup": [
        "Pullups/0.jpg",
        "Pullups/1.jpg"
    ],
    "chinup": [
        "Chin-Up/0.jpg",
        "Chin-Up/1.jpg"
    ],
    "lat_prayer": [
        "Cable_Rope_Overhead_Triceps_Extension/0.jpg",
        "Cable_Rope_Overhead_Triceps_Extension/1.jpg"
    ],
    "pullover_db": [
        "Straight-Arm_Dumbbell_Pullover/0.jpg",
        "Straight-Arm_Dumbbell_Pullover/1.jpg"
    ],
    "row_mach": [
        "Leverage_Iso_Row/0.jpg",
        "Leverage_Iso_Row/1.jpg"
    ],
    "row_cable": [
        "Seated_Cable_Rows/0.jpg",
        "Seated_Cable_Rows/1.jpg"
    ],
    "row_db": [
        "One-Arm_Dumbbell_Row/0.jpg",
        "One-Arm_Dumbbell_Row/1.jpg"
    ],
    "pendlay_row": [
        "Bent_Over_Barbell_Row/0.jpg",
        "Bent_Over_Barbell_Row/1.jpg"
    ],
    "bent_barbell_row": [
        "Bent_Over_Barbell_Row/0.jpg",
        "Bent_Over_Barbell_Row/1.jpg"
    ],
    "high_machine_row": [
        "Leverage_Iso_Row/0.jpg",
        "Leverage_Iso_Row/1.jpg"
    ],
    "wide_grip_cable_row": [
        "Seated_Cable_Rows/0.jpg",
        "Seated_Cable_Rows/1.jpg"
    ],
    "tbar_row_chest_supported": [
        "Leverage_Iso_Row/0.jpg",
        "Leverage_Iso_Row/1.jpg"
    ],
    "rack_pull": [
        "Barbell_Deadlift/0.jpg",
        "Barbell_Deadlift/1.jpg"
    ],
    "sq_bar": [
        "Barbell_Full_Squat/0.jpg",
        "Barbell_Full_Squat/1.jpg"
    ],
    "sq_paused": [
        "Barbell_Squat/0.jpg",
        "Barbell_Squat/1.jpg"
    ],
    "sq_hack": [
        "Hack_Squat/0.jpg",
        "Hack_Squat/1.jpg"
    ],
    "leg_press": [
        "Leg_Press/0.jpg",
        "Leg_Press/1.jpg"
    ],
    "single_leg_press": [
        "Leg_Press/0.jpg",
        "Leg_Press/1.jpg"
    ],
    "leg_ext": [
        "Leg_Extensions/0.jpg",
        "Leg_Extensions/1.jpg"
    ],
    "single_leg_extension": [
        "Leg_Extensions/0.jpg",
        "Leg_Extensions/1.jpg"
    ],
    "lunges": [
        "Dumbbell_Lunges/0.jpg",
        "Dumbbell_Lunges/1.jpg"
    ],
    "lunge_reverse": [
        "Dumbbell_Rear_Lunge/0.jpg",
        "Dumbbell_Rear_Lunge/1.jpg"
    ],
    "bulgarian_split_squat": [
        "Split_Squats/0.jpg",
        "Split_Squats/1.jpg"
    ],
    "step_up_db": [
        "Dumbbell_Step_Ups/0.jpg",
        "Dumbbell_Step_Ups/1.jpg"
    ],
    "high_bar_close_squat": [
        "Barbell_Squat/0.jpg",
        "Barbell_Squat/1.jpg"
    ],
    "low_bar_wide_squat": [
        "Barbell_Squat/0.jpg",
        "Barbell_Squat/1.jpg"
    ],
    "front_squat": [
        "Front_Barbell_Squat/0.jpg",
        "Front_Barbell_Squat/1.jpg"
    ],
    "rdl": [
        "Romanian_Deadlift/0.jpg",
        "Romanian_Deadlift/1.jpg"
    ],
    "deadlift": [
        "Barbell_Deadlift/0.jpg",
        "Barbell_Deadlift/1.jpg"
    ],
    "deadlift_13in": [
        "Barbell_Deadlift/0.jpg",
        "Barbell_Deadlift/1.jpg"
    ],
    "sldl": [
        "Stiff-Legged_Barbell_Deadlift/0.jpg",
        "Stiff-Legged_Barbell_Deadlift/1.jpg"
    ],
    "good_morning": [
        "Good_Morning/0.jpg",
        "Good_Morning/1.jpg"
    ],
    "good_morning_pause": [
        "Good_Morning/0.jpg",
        "Good_Morning/1.jpg"
    ],
    "glute_bridge": [
        "Barbell_Hip_Thrust/0.jpg",
        "Barbell_Hip_Thrust/1.jpg"
    ],
    "back_extension": [
        "Hyperextensions_Back_Extensions/0.jpg",
        "Hyperextensions_Back_Extensions/1.jpg"
    ],
    "leg_curl": [
        "Seated_Leg_Curl/0.jpg",
        "Seated_Leg_Curl/1.jpg"
    ],
    "lying_curl": [
        "Lying_Leg_Curls/0.jpg",
        "Lying_Leg_Curls/1.jpg"
    ],
    "calf_raise": [
        "Standing_Calf_Raises/0.jpg",
        "Standing_Calf_Raises/1.jpg"
    ],
    "ohp": [
        "Standing_Military_Press/0.jpg",
        "Standing_Military_Press/1.jpg"
    ],
    "ohp_db": [
        "Seated_Dumbbell_Press/0.jpg",
        "Seated_Dumbbell_Press/1.jpg"
    ],
    "push_press": [
        "Push_Press/0.jpg",
        "Push_Press/1.jpg"
    ],
    "behind_neck_press": [
        "Standing_Barbell_Press_Behind_Neck/0.jpg",
        "Standing_Barbell_Press_Behind_Neck/1.jpg"
    ],
    "front_raise_db": [
        "Front_Dumbbell_Raise/0.jpg",
        "Front_Dumbbell_Raise/1.jpg"
    ],
    "lat_raise": [
        "Side_Lateral_Raise/0.jpg",
        "Side_Lateral_Raise/1.jpg"
    ],
    "lat_raise_cable": [
        "Cable_Seated_Lateral_Raise/0.jpg",
        "Cable_Seated_Lateral_Raise/1.jpg"
    ],
    "lat_raise_mach": [
        "Side_Lateral_Raise/0.jpg",
        "Side_Lateral_Raise/1.jpg"
    ],
    "lat_raise_seat": [
        "Seated_Side_Lateral_Raise/0.jpg",
        "Seated_Side_Lateral_Raise/1.jpg"
    ],
    "face_pull": [
        "Face_Pull/0.jpg",
        "Face_Pull/1.jpg"
    ],
    "upright_row": [
        "Upright_Barbell_Row/0.jpg",
        "Upright_Barbell_Row/1.jpg"
    ],
    "shrug_db": [
        "Dumbbell_Shrug/0.jpg",
        "Dumbbell_Shrug/1.jpg"
    ],
    "rear_delt_fly": [
        "Seated_Bent-Over_Rear_Delt_Raise/0.jpg",
        "Seated_Bent-Over_Rear_Delt_Raise/1.jpg"
    ],
    "farmers_walk": [
        "Farmers_Walk/0.jpg",
        "Farmers_Walk/1.jpg"
    ],
    "curl_ez": [
        "EZ-Bar_Curl/0.jpg",
        "EZ-Bar_Curl/1.jpg"
    ],
    "curl_bar": [
        "Barbell_Curl/0.jpg",
        "Barbell_Curl/1.jpg"
    ],
    "curl_db": [
        "Dumbbell_Bicep_Curl/0.jpg",
        "Dumbbell_Bicep_Curl/1.jpg"
    ],
    "curl_hammer": [
        "Hammer_Curls/0.jpg",
        "Hammer_Curls/1.jpg"
    ],
    "curl_cable": [
        "Cable_Preacher_Curl/0.jpg",
        "Cable_Preacher_Curl/1.jpg"
    ],
    "curl_preacher": [
        "Preacher_Curl/0.jpg",
        "Preacher_Curl/1.jpg"
    ],
    "incline_db_curl": [
        "Incline_Dumbbell_Curl/0.jpg",
        "Incline_Dumbbell_Curl/1.jpg"
    ],
    "close_grip_cable_curl": [
        "Cable_Preacher_Curl/0.jpg",
        "Cable_Preacher_Curl/1.jpg"
    ],
    "rope_cable_curl": [
        "Cable_Preacher_Curl/0.jpg",
        "Cable_Preacher_Curl/1.jpg"
    ],
    "tri_push": [
        "Triceps_Pushdown/0.jpg",
        "Triceps_Pushdown/1.jpg"
    ],
    "rope_pressdown": [
        "Triceps_Pushdown_-_Rope_Attachment/0.jpg",
        "Triceps_Pushdown_-_Rope_Attachment/1.jpg"
    ],
    "skull_crusher": [
        "Decline_EZ_Bar_Triceps_Extension/0.jpg",
        "Decline_EZ_Bar_Triceps_Extension/1.jpg"
    ],
    "db_tri_ext": [
        "Standing_Dumbbell_Triceps_Extension/0.jpg",
        "Standing_Dumbbell_Triceps_Extension/1.jpg"
    ],
    "tri_ext": [
        "Standing_Dumbbell_Triceps_Extension/0.jpg",
        "Standing_Dumbbell_Triceps_Extension/1.jpg"
    ],
    "jm_press": [
        "Close-Grip_Barbell_Bench_Press/0.jpg",
        "Close-Grip_Barbell_Bench_Press/1.jpg"
    ],
    "db_overhead_tri": [
        "Standing_Dumbbell_Triceps_Extension/0.jpg",
        "Standing_Dumbbell_Triceps_Extension/1.jpg"
    ],
    "dips": [
        "Dips_-_Chest_Version/0.jpg",
        "Dips_-_Chest_Version/1.jpg"
    ],
    "dip_machine": [
        "Dips_-_Chest_Version/0.jpg",
        "Dips_-_Chest_Version/1.jpg"
    ],
    "wrist_curl": [
        "Palms-Down_Wrist_Curl_Over_A_Bench/0.jpg",
        "Palms-Down_Wrist_Curl_Over_A_Bench/1.jpg"
    ],
    "finger_curl": [
        "Palms-Up_Barbell_Wrist_Curl_Over_A_Bench/0.jpg",
        "Palms-Up_Barbell_Wrist_Curl_Over_A_Bench/1.jpg"
    ],
    "forearm_pushup": [
        "Pushups/0.jpg",
        "Pushups/1.jpg"
    ],
    "neck_curl": [
        "Lying_Face_Up_Plate_Neck_Resistance/0.jpg",
        "Lying_Face_Up_Plate_Neck_Resistance/1.jpg"
    ],
    "neck_ext": [
        "Lying_Face_Down_Plate_Neck_Resistance/0.jpg",
        "Lying_Face_Down_Plate_Neck_Resistance/1.jpg"
    ],
    "abs_cable": [
        "Cable_Crunch/0.jpg",
        "Cable_Crunch/1.jpg"
    ],
    "leg_raise": [
        "Hanging_Leg_Raise/0.jpg",
        "Hanging_Leg_Raise/1.jpg"
    ],
    "knee_raise": [
        "Flat_Bench_Lying_Leg_Raise/0.jpg",
        "Flat_Bench_Lying_Leg_Raise/1.jpg"
    ],
    "cal_bulgariansq": [
        "Split_Squats/0.jpg",
        "Split_Squats/1.jpg"
    ],
    "cal_dips": [
        "Dips_-_Chest_Version/0.jpg",
        "Dips_-_Chest_Version/1.jpg"
    ],
    "cal_pullup_strict": [
        "Pullups/0.jpg",
        "Pullups/1.jpg"
    ],
    "cal_chinup_strict": [
        "Chin-Up/0.jpg",
        "Chin-Up/1.jpg"
    ],
    "cal_pushup_regular": [
        "Pushups/0.jpg",
        "Pushups/1.jpg"
    ],
    "cal_ab_wheel": [
        "Ab_Roller/0.jpg",
        "Ab_Roller/1.jpg"
    ],
    "cal_hanging_lraise": [
        "Hanging_Leg_Raise/0.jpg",
        "Hanging_Leg_Raise/1.jpg"
    ],
    "cf_deadlift": [
        "Barbell_Deadlift/0.jpg",
        "Barbell_Deadlift/1.jpg"
    ],
    "cf_thruster": [
        "Push_Press/0.jpg",
        "Push_Press/1.jpg"
    ],
    "cf_kb_swing": [
        "One-Arm_Kettlebell_Clean/0.jpg",
        "One-Arm_Kettlebell_Clean/1.jpg"
    ],
    "cf_box_jump": [
        "Dumbbell_Step_Ups/0.jpg",
        "Dumbbell_Step_Ups/1.jpg"
    ],
    "diamond_pushup": [
        "Pushups/0.jpg",
        "Pushups/1.jpg"
    ],
    "cal_diamond_pu": [
        "Pushups/0.jpg",
        "Pushups/1.jpg"
    ],
    "cal_pistol": [
        "Kettlebell_Pistol_Squat/0.jpg",
        "Kettlebell_Pistol_Squat/1.jpg"
    ]
};

export const MUSCLE_ARCHETYPE_ILLUSTRATIONS: Record<string, string> = {
    CHEST: 'bp_bar',
    BACK: 'lat_pull',
    QUADS: 'sq_bar',
    HAMSTRINGS: 'rdl',
    GLUTES: 'glute_bridge',
    SHOULDERS: 'ohp_db',
    BICEPS: 'curl_db',
    TRICEPS: 'tri_push',
    CALVES: 'calf_raise',
    ABS: 'abs_cable',
    TRAPS: 'shrug_db',
    FOREARMS: 'wrist_curl',
    CARDIO: 'cf_box_jump',
};

export interface IllustrationOption {
    id: string;
    name: { en: string; es: string };
    muscle: string;
}

export const CURATED_ILLUSTRATION_OPTIONS: IllustrationOption[] = [
    // Chest
    { id: 'bp_bar', name: { en: 'Barbell Bench Press', es: 'Press Banca con Barra' }, muscle: 'CHEST' },
    { id: 'bp_inc', name: { en: 'Incline Dumbbell Press', es: 'Press Inclinado con Mancuernas' }, muscle: 'CHEST' },
    { id: 'bp_inc_bar', name: { en: 'Incline Barbell Press', es: 'Press Inclinado con Barra' }, muscle: 'CHEST' },
    { id: 'bp_flat', name: { en: 'Machine Chest Press', es: 'Press de Pecho en Máquina' }, muscle: 'CHEST' },
    { id: 'pec_fly', name: { en: 'Pec Dec Fly / Butterfly', es: 'Aperturas Pec Dec' }, muscle: 'CHEST' },
    { id: 'cable_crossover', name: { en: 'Cable Crossover', es: 'Cruces en Polea' }, muscle: 'CHEST' },
    { id: 'pushup', name: { en: 'Push Up', es: 'Flexiones' }, muscle: 'CHEST' },
    { id: 'dips', name: { en: 'Dips / Chest Dips', es: 'Fondos en Paralelas' }, muscle: 'CHEST' },
    // Back
    { id: 'lat_pull', name: { en: 'Lat Pulldown', es: 'Jalón al Pecho' }, muscle: 'BACK' },
    { id: 'lat_pull_supine', name: { en: 'Supine Lat Pulldown', es: 'Jalón Supino' }, muscle: 'BACK' },
    { id: 'pullup', name: { en: 'Strict Pull Up', es: 'Dominadas Pronas' }, muscle: 'BACK' },
    { id: 'chinup', name: { en: 'Chin Up', es: 'Dominadas Supinas' }, muscle: 'BACK' },
    { id: 'lat_prayer', name: { en: 'Straight-Arm Cable Pulldown', es: 'Pullover en Polea Alta' }, muscle: 'BACK' },
    { id: 'pullover_db', name: { en: 'Dumbbell Pullover', es: 'Pullover con Mancuerna' }, muscle: 'BACK' },
    { id: 'row_cable', name: { en: 'Seated Cable Row', es: 'Remo en Polea Baja / Gironda' }, muscle: 'BACK' },
    { id: 'row_db', name: { en: 'One-Arm Dumbbell Row', es: 'Remo con Mancuerna' }, muscle: 'BACK' },
    { id: 'bent_barbell_row', name: { en: 'Bent-Over Barbell Row', es: 'Remo con Barra' }, muscle: 'BACK' },
    { id: 'tbar_row_chest_supported', name: { en: 'T-Bar Row', es: 'Remo en T con Apoyo' }, muscle: 'BACK' },
    // Quads
    { id: 'sq_bar', name: { en: 'Barbell Back Squat', es: 'Sentadilla con Barra Trasera' }, muscle: 'QUADS' },
    { id: 'front_squat', name: { en: 'Barbell Front Squat', es: 'Sentadilla Frontal' }, muscle: 'QUADS' },
    { id: 'sq_hack', name: { en: 'Hack Squat Machine', es: 'Sentadilla Hack' }, muscle: 'QUADS' },
    { id: 'leg_press', name: { en: 'Incline Leg Press', es: 'Prensa Inclinada' }, muscle: 'QUADS' },
    { id: 'leg_ext', name: { en: 'Leg Extension Machine', es: 'Extensiones de Cuádriceps' }, muscle: 'QUADS' },
    { id: 'bulgarian_split_squat', name: { en: 'Bulgarian Split Squat', es: 'Sentadilla Búlgara' }, muscle: 'QUADS' },
    { id: 'lunges', name: { en: 'Walking Lunges', es: 'Zancadas' }, muscle: 'QUADS' },
    // Hamstrings & Glutes
    { id: 'rdl', name: { en: 'Romanian Deadlift (RDL)', es: 'Peso Muerto Rumano' }, muscle: 'HAMSTRINGS' },
    { id: 'deadlift', name: { en: 'Conventional Deadlift', es: 'Peso Muerto Convencional' }, muscle: 'HAMSTRINGS' },
    { id: 'leg_curl', name: { en: 'Lying Leg Curl', es: 'Curl Femoral Tumbado' }, muscle: 'HAMSTRINGS' },
    { id: 'glute_bridge', name: { en: 'Glute Bridge / Hip Thrust', es: 'Hip Thrust / Puente de Glúteo' }, muscle: 'GLUTES' },
    { id: 'back_extension', name: { en: 'Hyperextension', es: 'Hiperextensiones Lumbares' }, muscle: 'HAMSTRINGS' },
    // Calves
    { id: 'calf_raise', name: { en: 'Standing Calf Raise', es: 'Elevación de Talones / Gemelos' }, muscle: 'CALVES' },
    // Shoulders
    { id: 'ohp_db', name: { en: 'Seated Dumbbell Shoulder Press', es: 'Press de Hombros con Mancuernas' }, muscle: 'SHOULDERS' },
    { id: 'ohp', name: { en: 'Standing Barbell Overhead Press', es: 'Press Militar con Barra' }, muscle: 'SHOULDERS' },
    { id: 'lat_raise', name: { en: 'Dumbbell Lateral Raise', es: 'Elevaciones Laterales con Mancuerna' }, muscle: 'SHOULDERS' },
    { id: 'lat_raise_cable', name: { en: 'Cable Lateral Raise', es: 'Elevaciones Laterales en Polea' }, muscle: 'SHOULDERS' },
    { id: 'face_pull', name: { en: 'Cable Face Pull', es: 'Face Pull en Polea' }, muscle: 'SHOULDERS' },
    { id: 'rear_delt_fly', name: { en: 'Rear Delt Fly / Reverse Pec Dec', es: 'Pájaros / Deltoides Posterior' }, muscle: 'SHOULDERS' },
    // Traps
    { id: 'shrug_db', name: { en: 'Dumbbell Shrug', es: 'Encogimientos con Mancuernas' }, muscle: 'TRAPS' },
    // Biceps
    { id: 'curl_db', name: { en: 'Dumbbell Biceps Curl', es: 'Curl de Bíceps con Mancuernas' }, muscle: 'BICEPS' },
    { id: 'curl_bar', name: { en: 'Barbell Biceps Curl', es: 'Curl de Bíceps con Barra' }, muscle: 'BICEPS' },
    { id: 'curl_hammer', name: { en: 'Hammer Curl', es: 'Curl Martillo' }, muscle: 'BICEPS' },
    { id: 'curl_preacher', name: { en: 'Preacher Curl (Scott)', es: 'Curl en Banco Scott' }, muscle: 'BICEPS' },
    { id: 'curl_cable', name: { en: 'Cable Biceps Curl', es: 'Curl en Polea Baja' }, muscle: 'BICEPS' },
    // Triceps
    { id: 'tri_push', name: { en: 'Tricep Cable Pushdown', es: 'Extensiones de Tríceps en Polea' }, muscle: 'TRICEPS' },
    { id: 'rope_pressdown', name: { en: 'Tricep Rope Pushdown', es: 'Extensiones de Tríceps con Cuerda' }, muscle: 'TRICEPS' },
    { id: 'skull_crusher', name: { en: 'Lying Triceps Extension (Skull Crusher)', es: 'Press Francés / Rompecráneos' }, muscle: 'TRICEPS' },
    { id: 'db_overhead_tri', name: { en: 'Overhead Dumbbell Triceps Extension', es: 'Extensión de Tríceps Copa' }, muscle: 'TRICEPS' },
    // Abs
    { id: 'abs_cable', name: { en: 'Kneeling Cable Crunch', es: 'Crunch Abdominal en Polea' }, muscle: 'ABS' },
    { id: 'cal_ab_wheel', name: { en: 'Ab Roller Wheel', es: 'Rueda Abdominal' }, muscle: 'ABS' },
    { id: 'cal_hanging_lraise', name: { en: 'Hanging Leg Raise', es: 'Elevaciones de Piernas Colgado' }, muscle: 'ABS' },
    // Forearms & Others
    { id: 'wrist_curl', name: { en: 'Wrist Curl', es: 'Curl de Muñeca / Antebrazo' }, muscle: 'FOREARMS' },
    { id: 'farmers_walk', name: { en: 'Farmers Walk', es: 'Paseo del Granjero' }, muscle: 'TRAPS' },
    { id: 'cf_box_jump', name: { en: 'Box Jump / Step Up', es: 'Salto al Cajón / Step Up' }, muscle: 'CARDIO' },
];

function normalizeExerciseSearchText(exercise: ExerciseDef): string {
    const raw = typeof exercise.name === 'string'
        ? exercise.name
        : `${exercise.name?.en || ''} ${exercise.name?.es || ''}`;
    return raw
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Resolves the canonical illustration key for any exercise:
 * 1. User manual override (`illustrationId`)
 * 2. Exact match in catalog (`id`)
 * 3. Merged canonical alias (`mergedInto`)
 * 4. Semantic token keyword & equipment matching
 * 5. Muscle group archetype fallback
 */
export function resolveExerciseIllustrationKey(exercise: ExerciseDef): string {
    // 1. Explicit user selection
    if (exercise.illustrationId && EXERCISE_ILLUSTRATIONS[exercise.illustrationId]) {
        return exercise.illustrationId;
    }

    // 2. Direct catalog match
    const rawId = (exercise.id || '').toLowerCase();
    if (rawId && EXERCISE_ILLUSTRATIONS[rawId]) {
        return rawId;
    }

    // 3. Merged pointer alias
    if (exercise.mergedInto) {
        const mergedKey = exercise.mergedInto.toLowerCase();
        if (EXERCISE_ILLUSTRATIONS[mergedKey]) {
            return mergedKey;
        }
    }

    // 4. Semantic keyword matching
    const text = normalizeExerciseSearchText(exercise);
    const m = (exercise.muscle || '').toUpperCase();

    // Specific anchors first (Quads & Lower Body)
    if (text.includes('bulgara') || text.includes('bulgarian')) return 'bulgarian_split_squat';
    if (text.includes('hack')) return 'sq_hack';
    if (text.includes('prensa') || text.includes('leg press')) return 'leg_press';
    if (text.includes('zancada') || text.includes('lunge') || text.includes('estocada')) return 'lunges';
    if (text.includes('step up') || text.includes('subida')) return 'step_up_db';
    if (text.includes('extensi') && (text.includes('cuadricep') || text.includes('pierna') || text.includes('leg') || m === 'QUADS')) {
        return 'leg_ext';
    }
    if (text.includes('front squat') || text.includes('sentadilla frontal')) return 'front_squat';
    if (text.includes('pistol') && (text.includes('squat') || text.includes('sentadilla'))) return 'cal_pistol';
    if (text.includes('sentadilla') || text.includes('squat')) return 'sq_bar';

    // Hamstrings & Glutes
    if (text.includes('curl femoral') || text.includes('leg curl') || text.includes('isquio') || text.includes('femoral')) {
        return 'leg_curl';
    }
    if (text.includes('hip thrust') || text.includes('puente de gluteo') || text.includes('glute bridge')) {
        return 'glute_bridge';
    }
    if (text.includes('peso muerto') || text.includes('deadlift')) {
        if (text.includes('rumano') || text.includes('rdl') || text.includes('stiff') || text.includes('rigidas')) return 'rdl';
        return 'deadlift';
    }
    if (text.includes('buenos dias') || text.includes('good morning')) return 'good_morning';
    if (text.includes('hiperextension') || text.includes('back extension') || text.includes('lumbar')) return 'back_extension';

    // Calves
    if (text.includes('gemelo') || text.includes('pantorrilla') || text.includes('calf') || text.includes('talon')) {
        return 'calf_raise';
    }

    // Biceps & Triceps
    if (text.includes('martillo') || text.includes('hammer')) return 'curl_hammer';
    if (text.includes('predicador') || text.includes('scott') || text.includes('preacher')) return 'curl_preacher';
    if (text.includes('curl') && text.includes('inclinad')) return 'incline_db_curl';
    if (text.includes('curl') && (text.includes('ez') || text.includes('barra z'))) return 'curl_ez';
    if (text.includes('curl') && (text.includes('polea') || text.includes('cable'))) return 'curl_cable';
    if (text.includes('curl') && (text.includes('barra') || text.includes('barbell'))) return 'curl_bar';
    if (text.includes('curl') || (text.includes('bicep') && !text.includes('tricep'))) return 'curl_db';

    if (text.includes('fondo') || text.includes('dip')) return 'dips';
    if (text.includes('tricep') || text.includes('pushdown')) {
        if (text.includes('cuerda') || text.includes('rope')) return 'rope_pressdown';
        if (text.includes('frances') || text.includes('skull') || text.includes('rompecraneo')) return 'skull_crusher';
        if (text.includes('copa') || text.includes('overhead')) return 'db_overhead_tri';
        return 'tri_push';
    }

    // Back patterns
    if (text.includes('dominada') || text.includes('pullup') || text.includes('pull up') || text.includes('chinup') || text.includes('chin up')) {
        if (text.includes('supin') || text.includes('chin')) return 'cal_chinup_strict';
        return 'cal_pullup_strict';
    }
    if (text.includes('jalon') || text.includes('lat pull') || text.includes('pulldown')) {
        if (text.includes('supin') || text.includes('cerrad') || text.includes('close')) return 'lat_pull_supine';
        return 'lat_pull';
    }
    if (text.includes('pullover') || text.includes('pull over')) {
        return 'pullover_db';
    }
    if (text.includes('lat prayer') || text.includes('polea alta')) {
        return 'lat_prayer';
    }
    if (text.includes('remo') || text.includes('row')) {
        if (text.includes('mancuerna') || text.includes('db') || text.includes('dumbbell') || text.includes('unilateral')) return 'row_db';
        if (text.includes('polea') || text.includes('cable') || text.includes('gironda') || text.includes('sentado')) return 'row_cable';
        if (text.includes('tbar') || text.includes('barra t') || text.includes('apoyo')) return 'tbar_row_chest_supported';
        if (text.includes('pendlay')) return 'pendlay_row';
        if (text.includes('maquina') || text.includes('machine')) return 'row_mach';
        return 'bent_barbell_row';
    }
    if (text.includes('rack pull')) {
        return 'rack_pull';
    }

    // Shoulders
    if (text.includes('lateral') || text.includes('vuelo') || text.includes('side raise')) {
        if (text.includes('polea') || text.includes('cable')) return 'lat_raise_cable';
        return 'lat_raise';
    }
    if (text.includes('pajaro') || text.includes('rear delt') || text.includes('posterior')) return 'rear_delt_fly';
    if (text.includes('face pull')) return 'face_pull';
    if (text.includes('frontal') || text.includes('front raise')) return 'front_raise_db';
    if (text.includes('upright row') || text.includes('remo al menton')) return 'upright_row';
    if (text.includes('militar') || text.includes('overhead') || text.includes('shoulder press') || (text.includes('press') && m === 'SHOULDERS')) {
        if (text.includes('barra') || text.includes('barbell')) return 'ohp';
        return 'ohp_db';
    }

    // Traps
    if (text.includes('encogimiento') || text.includes('shrug')) return 'shrug_db';
    if (text.includes('granjero') || text.includes('farmer')) return 'farmers_walk';

    // Abs
    if (text.includes('ab wheel') || text.includes('rueda')) return 'cal_ab_wheel';
    if (text.includes('colgado') || text.includes('hanging') || text.includes('elevacion pierna')) return 'cal_hanging_lraise';
    if (text.includes('crunch') || text.includes('abdominal') || m === 'ABS') return 'abs_cable';

    // Forearms
    if (text.includes('muñeca') || text.includes('antebrazo') || text.includes('wrist') || text.includes('forearm')) return 'wrist_curl';

    // Chest patterns
    if (text.includes('inclinad') || text.includes('incline')) {
        if (text.includes('mancuerna') || text.includes('db') || text.includes('dumbbell')) return 'bp_inc';
        if (text.includes('barra') || text.includes('barbell')) return 'bp_inc_bar';
        if (text.includes('maquina') || text.includes('machine') || text.includes('smith') || text.includes('multipower')) return 'bp_mach_inc';
        return 'bp_inc';
    }
    if (text.includes('apertura') || text.includes('fly') || text.includes('pec dec') || text.includes('butterfly') || text.includes('cruce') || text.includes('crossover')) {
        return 'pec_fly';
    }
    if (text.includes('pushup') || text.includes('flexion') || text.includes('lagartija')) {
        if (text.includes('diamante') || text.includes('diamond')) return 'diamond_pushup';
        return 'pushup';
    }
    if (text.includes('declinad') || text.includes('decline')) {
        return 'bp_flat';
    }
    if ((text.includes('press') || text.includes('banca') || text.includes('bench')) && (m === 'CHEST' || !m)) {
        if (text.includes('mancuerna') || text.includes('db') || text.includes('dumbbell') || text.includes('neutr')) return 'neutral_db_press';
        if (text.includes('maquina') || text.includes('machine')) return 'bp_flat';
        return 'bp_bar';
    }

    // 5. Fallback to muscle archetype
    if (m && MUSCLE_ARCHETYPE_ILLUSTRATIONS[m]) {
        return MUSCLE_ARCHETYPE_ILLUSTRATIONS[m];
    }

    return 'bp_bar';
}

/**
 * Returns the pair of illustration image paths for the exercise, or null if uncataloged.
 */
export function resolveExerciseIllustration(exercise: ExerciseDef): string[] | null {
    const key = resolveExerciseIllustrationKey(exercise);
    if (key && EXERCISE_ILLUSTRATIONS[key]) {
        return EXERCISE_ILLUSTRATIONS[key];
    }
    return null;
}
