
import { ExerciseDef, ProgramDay, MuscleGroup } from './types';

export const MUSCLE_GROUPS: Record<string, MuscleGroup> = { 
    CHEST: 'CHEST', BACK: 'BACK', QUADS: 'QUADS', HAMS: 'HAMSTRINGS', 
    GLUTES: 'GLUTES', CALVES: 'CALVES', SHOULDERS: 'SHOULDERS', 
    BICEPS: 'BICEPS', TRICEPS: 'TRICEPS', TRAPS: 'TRAPS', 
    ABS: 'ABS', FOREARMS: 'FOREARMS', CARDIO: 'CARDIO'
};

// ... (KEEP ALL EXISTING EXERCISES & TEMPLATES AS IS - DO NOT REMOVE) ...
export const DEFAULT_LIBRARY: ExerciseDef[] = [
    // Cardio (Generic safe links)
    { 
        id: 'cardio_run', 
        name: { en: 'Running (Steady)', es: 'Correr (Ritmo Constante)' }, 
        muscle: 'CARDIO',
        defaultCardioType: 'steady',
        videoId: "brFHyOTtwNs"
    },
    { 
        id: 'cardio_hiit_sprint', 
        name: { en: 'HIIT Sprints', es: 'Sprints HIIT' }, 
        muscle: 'CARDIO',
        defaultCardioType: 'hiit',
        instructions: { en: "High intensity intervals.", es: "Intervalos de alta intensidad." },
        videoId: "Mp8qJ57971Y"
    },
    { 
        id: 'cardio_tabata', 
        name: { en: 'Tabata Protocol', es: 'Protocolo Tabata' }, 
        muscle: 'CARDIO',
        defaultCardioType: 'tabata',
        instructions: { en: "20s Work / 10s Rest x 8 Rounds.", es: "20s Trabajo / 10s Descanso x 8 Rondas." },
        videoId: "a_L3b7d7rYs"
    },
    { 
        id: 'cardio_cycle', 
        name: { en: 'Cycling', es: 'Ciclismo' }, 
        muscle: 'CARDIO',
        defaultCardioType: 'steady',
        videoId: "4g7z3v3Yy34"
    },
    { 
        id: 'cardio_elliptical', 
        name: { en: 'Elliptical', es: 'Elíptica' }, 
        muscle: 'CARDIO',
        defaultCardioType: 'steady',
        videoId: "8Z7t6j5G9V0"
    },
    { 
        id: 'cardio_row', 
        name: { en: 'Rowing Machine', es: 'Remo (Ergómetro)' }, 
        muscle: 'CARDIO',
        defaultCardioType: 'steady',
        videoId: "H0r_ZGCx2l8"
    },

    // Chest - Stable IDs (Scott Herman Primary)
    { 
        id: 'bp_flat', 
        name: { en: 'Machine Chest Press', es: 'Press Pecho Máquina' }, 
        muscle: 'CHEST',
        instructions: { en: "Standard volume builder.", es: "Añade volumen de forma segura." },
        videoId: "NwzUje3z0qY"
    },
    { 
        id: 'bp_inc', 
        name: { en: 'Incline Dumbbell Press', es: 'Press Inclinado Mancuernas' }, 
        muscle: 'CHEST',
        instructions: { en: "Focus on upper chest. Get a deep stretch.", es: "Enfoque en pecho superior. Busca un estiramiento profundo." },
        videoId: "8iPEnn-ltC8"
    },
    { 
        id: 'bp_bar', 
        name: { en: 'Barbell Bench Press', es: 'Press Banca Barra' }, 
        muscle: 'CHEST',
        videoId: "rT7DgCr-3pg"
    },
    { 
        id: 'bp_inc_bar', 
        name: { en: 'Incline Barbell Press', es: 'Press Inclinado Barra' }, 
        muscle: 'CHEST',
        instructions: { en: "Regular grip, control the descent. Touches upper chest.", es: "Agarre regular, controla la bajada. Toca la parte superior del pecho." },
        videoId: "SrqOu55lr00"
    },
    { 
        id: 'bp_inc_wide', 
        name: { en: 'Wide Grip Incline Press', es: 'Press Inclinado Agarre Ancho' }, 
        muscle: 'CHEST',
        instructions: { en: "Wider grip to bias chest. Pause at the bottom.", es: "Agarre más ancho para enfatizar el pecho. Haz una pausa en la parte inferior." },
        videoId: "SrqOu55lr00" 
    },
    { 
        id: 'bp_mach_inc', 
        name: { en: 'Machine Incline Press', es: 'Press Inclinado Máquina' }, 
        muscle: 'CHEST',
        instructions: { en: "Constant tension for upper pecs.", es: "Tensión constante para pectorales superiores." },
        videoId: "NwzUje3z0qY"
    },
    { 
        id: 'pec_fly', 
        name: { en: 'Pec Dec Flye', es: 'Aperturas Pec Dec' }, 
        muscle: 'CHEST',
        videoId: "eGjt4lkiwuc"
    },
    
    // Back - Fixed & Verified
    { 
        id: 'lat_pull', 
        name: { en: 'Lat Pulldown', es: 'Jalón al Pecho' }, 
        muscle: 'BACK',
        instructions: { en: "Prone, neutral, or supine grip. Focus on back width.", es: "Agarre prono, neutro o supino. Enfocado en la amplitud de espalda." },
        videoId: "CAwf7n6Luuc" // Scott Herman Verified
    },
    { 
        id: 'lat_pull_supine', 
        name: { en: 'Supine Lat Pulldown', es: 'Jalón Supino (Chin-grip)' }, 
        muscle: 'BACK',
        instructions: { en: "Underhand grip. Great for lats.", es: "Agarre supino (palmas hacia ti). Excelente para dorsales." },
        videoId: "8hKEjE58Jzo"
    },
    { 
        id: 'lat_prayer', 
        name: { en: 'Cable Lat Prayer', es: 'Pullover Polea Alta' }, 
        muscle: 'BACK',
        instructions: { en: "Isolation movement for back width. Keep tension constant.", es: "Movimiento de aislamiento para ancho de espalda. Mantén tensión constante." },
        videoId: "F_iF87c4gD8" // Straight Arm Pulldown
    },
    { 
        id: 'pullover_db', 
        name: { en: 'Dumbbell Pullover', es: 'Pullover con Mancuerna' }, 
        muscle: 'BACK',
        instructions: { en: "Old school lat builder. Stretch.", es: "Constructor de dorsales de la vieja escuela. Estira bien." },
        videoId: "5_J5E68rFfE" 
    },
    { 
        id: 'row_mach', 
        name: { en: 'Machine Row', es: 'Remo en Máquina' }, 
        muscle: 'BACK',
        videoId: "H75im9hGYUE"
    },
    { 
        id: 'row_cable', 
        name: { en: 'Cable Row', es: 'Remo en Polea' }, 
        muscle: 'BACK',
        videoId: "GZbfZ033f74"
    },
    { 
        id: 'row_db', 
        name: { en: 'Dumbbell Row', es: 'Remo con Mancuerna' }, 
        muscle: 'BACK',
        videoId: "roCP6wCXPqq"
    },
    { 
        id: 'pullup', 
        name: { en: 'Pull Ups', es: 'Dominadas' }, 
        muscle: 'BACK',
        instructions: { en: "Strict technique, full range of motion. No swinging.", es: "Técnica estricta, rango de movimiento completo. Sin balanceos." },
        videoId: "eGo4IYlbE5g"
    },
    
    // Legs - Verified Scott Herman Links
    { 
        id: 'sq_bar', 
        name: { en: 'Barbell Squat', es: 'Sentadilla con Barra' }, 
        muscle: 'QUADS',
        instructions: { en: "The king of legs. Hit depth.", es: "El rey de las piernas. Rompe la paralela." },
        videoId: "MVMVx5g0Zsk" // Scott Herman Squat
    },
    { 
        id: 'sq_hack', 
        name: { en: 'Hack Squat', es: 'Sentadilla Hack' }, 
        muscle: 'QUADS',
        videoId: "EdzE55jqUbs" // Scott Herman Hack Squat
    },
    { 
        id: 'leg_ext', 
        name: { en: 'Leg Extension', es: 'Extensiones de Cuádriceps' }, 
        muscle: 'QUADS', 
        videoId: "YyvSfVjQeL0" // Scott Herman Leg Extension
    },
    { 
        id: 'leg_press', 
        name: { en: 'Leg Press', es: 'Prensa de Piernas' }, 
        muscle: 'QUADS',
        instructions: { en: "Maintenance volume. Full ROM.", es: "Volumen de mantenimiento. Rango completo." },
        videoId: "IZxyjW7MPJQ"
    },
    { 
        id: 'rdl', 
        name: { en: 'Romanian Deadlift', es: 'Peso Muerto Rumano' }, 
        muscle: 'HAMSTRINGS',
        videoId: "JCXUYuzwNrM"
    },
    { 
        id: 'sldl', 
        name: { en: 'Stiff Leg Deadlift', es: 'Peso Muerto Piernas Rígidas' }, 
        muscle: 'HAMSTRINGS',
        instructions: { en: "Minimal knee bend. Hamstring focus.", es: "Mínima flexión de rodilla. Enfoque en isquios." },
        videoId: "1uDiW5--rAE"
    },
    { 
        id: 'glute_bridge', 
        name: { en: 'Glute Bridge', es: 'Puente de Glúteos' }, 
        muscle: 'GLUTES',
        videoId: "8Z7t6j5G9V0" // Generic placeholder
    },
    { 
        id: 'leg_curl', 
        name: { en: 'Seated Leg Curl', es: 'Curl Femoral Sentado' }, 
        muscle: 'HAMSTRINGS', 
        videoId: "OrxowZ454Po" // Scott Herman Seated Curl
    },
    { 
        id: 'lying_curl', 
        name: { en: 'Lying Leg Curl', es: 'Curl Femoral Tumbado' }, 
        muscle: 'HAMSTRINGS',
        videoId: "1Tq3QdYUuHs"
    },
    { 
        id: 'calf_raise', 
        name: { en: 'Calf Raise', es: 'Elevación de Talones' }, 
        muscle: 'CALVES',
        videoId: "gwLzBJYoWlI"
    },
    
    // Shoulders
    { 
        id: 'ohp', 
        name: { en: 'Overhead Press', es: 'Press Militar' }, 
        muscle: 'SHOULDERS', 
        videoId: "QAQ64hK4Xxs"
    },
    { 
        id: 'ohp_db', 
        name: { en: 'Seated DB Press', es: 'Press Militar Mancuernas' }, 
        muscle: 'SHOULDERS', 
        videoId: "qEwK657kfLM"
    },
    { 
        id: 'lat_raise', 
        name: { en: 'Lateral Raise', es: 'Elevaciones Laterales' }, 
        muscle: 'SHOULDERS',
        instructions: { en: "Standard dumbbell raises for capped delts.", es: "Elevaciones estándar para hombros redondos 'capitaneados'." },
        videoId: "3VcKaXpzqRo"
    },
    { 
        id: 'lat_raise_cable', 
        name: { en: 'Cable Lateral Raise', es: 'Elev. Laterales Polea' }, 
        muscle: 'SHOULDERS',
        instructions: { en: "Maintain constant tension throughout the movement.", es: "Mantén tensión constante durante todo el movimiento." },
        videoId: "PzmPFkm-ldk"
    },
    { 
        id: 'lat_raise_mach', 
        name: { en: 'Machine Lateral Raise', es: 'Elev. Laterales Máquina' }, 
        muscle: 'SHOULDERS',
        videoId: "3VcKaXpzqRo" // Fallback to DB video as machines vary
    },
    { 
        id: 'lat_raise_seat', 
        name: { en: 'Seated Lateral Raise', es: 'Elev. Laterales Sentado' }, 
        muscle: 'SHOULDERS',
        videoId: "3VcKaXpzqRo"
    },
    { 
        id: 'face_pull', 
        name: { en: 'Face Pull', es: 'Face Pull' }, 
        muscle: 'SHOULDERS', 
        videoId: "rep-qVOkqgk" // Scott Herman Face Pull
    },
    { 
        id: 'shrug_db', 
        name: { en: 'Dumbbell Shrugs', es: 'Encogimientos Mancuerna' }, 
        muscle: 'TRAPS',
        videoId: "g6qbq4Lf1FI"
    },
    
    // Arms - Verified Scott Herman
    { 
        id: 'curl_ez', 
        name: { en: 'EZ Bar Curl', es: 'Curl Barra EZ' }, 
        muscle: 'BICEPS',
        instructions: { en: "Strict curls. Range 5-10 or 10-15.", es: "Curl estricto. Rangos de 5-10 o 10-15 reps." },
        videoId: "kwG2ipFRgfo" // Using BB Curl as perfect proxy
    },
    { 
        id: 'curl_bar', 
        name: { en: 'Barbell Curl', es: 'Curl con Barra' }, 
        muscle: 'BICEPS',
        instructions: { en: "Can use Myo-reps here for volume.", es: "Puedes usar Myo-reps aquí para meter volumen rápido." },
        videoId: "kwG2ipFRgfo"
    },
    { 
        id: 'curl_db', 
        name: { en: 'Dumbbell Curl', es: 'Curl con Mancuernas' }, 
        muscle: 'BICEPS', 
        videoId: "sAq_ocpRh_I" 
    },
    { 
        id: 'curl_cable', 
        name: { en: 'Cable Curl', es: 'Curl en Polea' }, 
        muscle: 'BICEPS',
        instructions: { en: "High reps (15-20). Constant tension.", es: "Altas repeticiones (15-20). Tensión constante." },
        videoId: "AsAVcaJ8-Y"
    },
    
    { 
        id: 'skull_crusher', 
        name: { en: 'Skull Crushers', es: 'Rompecráneos (Skullcrusher)' }, 
        muscle: 'TRICEPS',
        instructions: { en: "Keep elbows tucked in.", es: "Mantén los codos cerrados hacia dentro." },
        videoId: "d_KZxkY_0cM"
    },
    { 
        id: 'tri_push', 
        name: { en: 'Tricep Pushdown', es: 'Extensión Tríceps Polea' }, 
        muscle: 'TRICEPS', 
        videoId: "2-LAMcpzOD8" // Scott Herman Pushdown (Classic)
    },
    { 
        id: 'tri_ext', 
        name: { en: 'Overhead Extension', es: 'Extensión sobre Cabeza' }, 
        muscle: 'TRICEPS',
        instructions: { en: "Focus on the long head stretch.", es: "Enfócate en el estiramiento de la cabeza larga." },
        videoId: "nRiJVZDpdL0"
    },
    { 
        id: 'jm_press', 
        name: { en: 'JM Press / Smith Tri', es: 'Press JM / Smith Tríceps' }, 
        muscle: 'TRICEPS',
        instructions: { en: "Giant set style: aim for 50-60 total reps.", es: "Estilo 'Giant Set': busca 50-60 reps totales con descansos cortos." },
        videoId: "2t4B3-1Z9G4"
    },
    { 
        id: 'dips', 
        name: { en: 'Weighted Dips', es: 'Fondos Lastrados' }, 
        muscle: 'TRICEPS',
        instructions: { en: "Leaning forward hits chest, upright hits triceps.", es: "Inclinado enfoca pecho, vertical enfoca tríceps." },
        videoId: "2z8DdPdFfD4"
    },
    
    { 
        id: 'abs_cable', 
        name: { en: 'Cable Crunch', es: 'Crunch en Polea' }, 
        muscle: 'ABS',
        videoId: "6GMkpQ08jLQ"
    },
    { 
        id: 'wrist_curl', 
        name: { en: 'Wrist Curl', es: 'Curl de Muñeca' }, 
        muscle: 'FOREARMS',
        instructions: { en: "Marathon sets: 50-60 reps with short breaks.", es: "Series maratón: 50-60 repeticiones con descansos cortos." },
        videoId: "3Vq7J2V5y0"
    },
    {
        id: 'forearm_pushup',
        name: { en: 'Forearm Bar Pushups', es: 'Flexiones Antebrazo en Barra' },
        muscle: 'FOREARMS',
        instructions: { en: "Lean on bar, push with fingers/wrists.", es: "Apóyate en la barra, empuja usando dedos y muñecas." },
        videoId: "8xXJ2qM_5Z0"
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

export const TRANSLATIONS = {
    en: { 
        startMeso: "Start New Mesocycle", finishWorkout: "Finish Workout", finishConfirm: "Finish workout?", cancel: "Cancel", delete: "Delete", skip: "Skip Exercise", skipDay: "Skip Workout", skipped: "Skipped", completed: "Completed", swap: "Swap Exercise", changeMuscle: "Change muscle", chooseMuscle: "Choose muscle", addSetBelow: "Add Set Below", deleteSet: "Delete Set", skipSet: "Skip Set", unskipSet: "Unskip Set", sets: "Set", weight: "Weight", reps: "Reps", rir: "RIR", log: "Log", note: "Range: 6-10", active: "Active", history: "History", settings: "Settings", volume: "Weekly Volume", workouts: "Recent Workouts", noData: "No data", duration: "Duration", exercises: "Exercises", configure: "Configure", week: "WEEK", massPhase: "Mass Phase", resting: "Resting", language: "Language", theme: "Theme", back: "Back", finishCycle: "Finish Cycle", confirmCycle: "Finish current mesocycle?", selectEx: "Select Exercise", searchPlaceholder: "Search...", createEx: "Create", noExFound: "No exercises found", keepScreen: "Keep Screen On", setType: "SET TYPE", mesoStats: "Mesocycle Stats", totalWorkouts: "Total Workouts", currentWeek: "Current Week", linkSuperset: "Link Superset", unlinkSuperset: "Unlink", selectToLink: "Select exercise to link...", superset: "SUPERSET", workoutComplete: "WORKOUT COMPLETE", goodJob: "Great job!", totalVolume: "Total Volume", totalSets: "Total Sets", totalReps: "Total Reps", share: "Share", close: "Save & Close", resume: "Resume Workout", backup: "Data Backup", export: "Export Data", import: "Import Data", importConfirm: "Overwrite data?", dataSaved: "Saved!", addSet: "Set", remSet: "Set", delSlot: "Delete Slot", offline: "Local Mode", mesoAvg: "Meso Avg Volume", routineGuide: "Routine Guide", executionInfo: "Execution & Goals",
        types: { regular: "Regular", myorep: "Myorep", myorep_match: "Myorep Match", cluster: "Cluster", top: "Top Set", backoff: "Back-off Set", giant: "Giant Set", warmup: "Warmup" }, 
        typeDesc: { regular: "Standard straight set", myorep: "Activation set + mini-sets (short rest)", myorep_match: "Match reps of previous set", cluster: "Intra-set rest periods", top: "Heaviest set (High Intensity)", backoff: "Volume work after Top Set", giant: "High reps to failure (Metabolite)", warmup: "Low fatigue preparation" }, 
        muscle: { CHEST: "Chest", BACK: "Back", QUADS: "Quads", HAMSTRINGS: "Hamstrings", GLUTES: "Glutes", CALVES: "Calves", SHOULDERS: "Shoulders", BICEPS: "Biceps", TRICEPS: "Triceps", TRAPS: "Traps", ABS: "Abs", FOREARMS: "Forearms", CARDIO: "Cardio" },
        rp: "IronCoach Progression", rpEnabled: "IronCoach Suggestions", rpTargetRIR: "Target RIR", rpFeedbackTitle: "Muscle Feedback", rpRatingHelp: "Rate to auto-regulate volume (RP Logic)", rpSave: "Save feedback", rpSuggestion: "Suggested", rpNoSuggestion: "No suggestion",
        editTemplate: "Edit Program", resetTemplate: "Reset to Default", editDay: "Edit Day", addDay: "Add Day", addSlot: "Add Exercise Slot", save: "Save", swapTitle: "Swap Exercise", swapMsg: "How do you want to apply this change?", swapSession: "This Session Only", swapForever: "Update Plan (Forever)", programEditor: "Program Editor", selectExBtn: "Select Exercise", any: "Any",
        manageEx: "Manage Exercises", addEx: "Add New Exercise", exName: "Exercise Name", selectMuscle: "Select Muscle", deleteConfirm: "Delete this exercise?",
        setsCount: "Sets", notes: "Notes", addNote: "Add Note...", volumeStatus: { low: "Low", maintenance: "Maint.", optimal: "Optimal", high: "High" }, showRIR: "Show RIR Column", install: "Install App", unitToggle: "Weight Unit", addExercise: "Add Exercise", updateTemplate: "Update Routine Template", selectMuscleToAdd: "Select Muscle to Add",
        appearance: "Appearance", database: "Database", dangerZone: "Danger Zone", factoryReset: "Factory Reset App", workoutConfig: "Workout Config",
        completeWeek: "Complete Week", completeWeekConfirm: "Advance to next week?", autoRegulate: "Auto-regulate volume?", autoRegulateDesc: "IronCoach will adjust volume based on your feedback.", applyingChanges: "Applying IronCoach Changes:", setsAdded: "sets added", setsRemoved: "sets removed", noChanges: "No volume changes needed.",
        finishMesoConfirm: "Finish this mesocycle? This will archive your current progress and let you start a fresh cycle.",
        deleteDataConfirm: "Delete ALL data? This cannot be undone.",
        importSuccess: "Import successful!", invalidFile: "Invalid file format",
        day: "Day",
        replaceEx: "Replace Exercise", removeEx: "Remove Exercise", moveUp: "Move Up", moveDown: "Move Down",
        emptyWorkoutTitle: "Empty Workout?", emptyWorkoutMsg: "You haven't completed any sets yet. Are you sure?",
        completedSetsMsg: "You've completed {0} sets. Save progress?", confirmRemoveEx: "Remove this exercise from current session?",
        volPerCycle: "Avg. Weekly Volume", avgDuration: "Duration", addSetBtn: "ADD SET", removeSetBtn: "REMOVE SET",
        prev: "Prev", target: "TARGET",
        warmup: "Smart Warmup", warmupTitle: "Warmup Protocol", potentiation: "Potentiation", workingWeight: "Working Weight",
        warmupSets: { light: "Light", moderate: "Moderate", potentiation: "Potentiation" },
        mesoConfig: "Mesocycle Settings", targetWeeks: "Planned Duration", weeks: "Weeks",
        deloadMode: "Deload Mode", deloadDesc: "Reduces volume (50%) for recovery.", enableDeload: "Enable Deload",
        skipDayConfirm: "Skip this workout? It will be marked as skipped.",
        mesoName: "Mesocycle Name",
        exportReport: "Export Report & Finish", justFinish: "Just Finish",
        mesoType: "Phase Type",
        phases: { hyp_1: "Base Hypertrophy 1", hyp_2: "Base Hypertrophy 2", metabolite: "Metabolite Phase", resensitization: "Resensitization", full_body: "Aesthetic V-Taper", wizard: "The Wizard v3 (Full Body)", male_physique: "Male Physique (Upper/Lower)" },
        phaseDesc: { hyp_1: "Standard PPL. Balanced volume.", hyp_2: "Upper/Lower Split (4 Days). Focus on compounds.", metabolite: "High reps (20-30), short rests, the 'burn'.", resensitization: "Low volume, heavy weight to reset fatigue.", full_body: "Dr. Mike Style. Focus on V-Taper (Lats/Side Delts).", wizard: "3-Days Heavy/Light/Medium. Classic intensity cycling for steady gains.", male_physique: "4-Days Bodybuilding Focus. Higher volume, arm & shoulder specialization." },
        
        // PAYWALL & PRO
        pro: {
            title: "Unlock Your Maximum Potential",
            subtitle: "Access advanced analytics, AI, and professional tracking.",
            features: [
                "Advanced analytics & full mesocycles",
                "AI auto-regulation & progress adjustments",
                "Unlimited templates & complete history"
            ],
            plans: {
                monthly: "$5.99 / month",
                yearly: "$34.99 / year",
                lifetime: "$49.99 lifetime"
            },
            bestValue: "Save 50%",
            guarantee: "Cancel anytime. Your data is always yours.",
            triggers: {
                history: "Unlock full history to see your real progress.",
                analytics: "Advanced analytics are available in Premium.",
                ai: "AI training features are part of Premium.",
                sync: "Cloud Sync is a Premium feature."
            }
        },

        // Template Categories
        cat: {
            beginner: "Beginner / Reset",
            intermediate: "Intermediate (Steady Progress)",
            advanced: "Advanced / Specialization"
        },

        targetRIR: "Target RIR", recoveryWeek: "Recovery Week", focusMode: "Focus Mode", repsRange: "Reps Range", startNow: "Start Cycle Now", setupCycle: "Setup & Start Cycle", saveAsMeso: "Use this program to create a new active mesocycle immediately.",
        units: { kg: "KG", pl: "Plates", lb: "LBS", toggle: "Change Unit (KG/Plates)", plateWeight: "Weight per Plate", setPlateWeight: "Set Weight per Plate (kg)", enterWeight: "e.g. 5, 10..." },
        fb: { sorenessLabel: "Soreness / Recovery", performanceLabel: "Pump / Capacity", soreness: { 1: "Healed Early / Fresh", 2: "Healed on Time (Ideal)", 3: "Still Sore / Ouch" }, performance: { 1: "Bad / Grind", 2: "Good / Target", 3: "Great / Too Easy" }, adjust: { add: "+1/2 Sets", sub: "-1 Set", keep: "Keep (Optimal)" } },
        onb: { skip: "Skip", next: "Next", start: "Start", s1_title: "Welcome to IronLog", s1_desc: "The ultimate hypertrophy tool, powered by IronCoach.", s2_title: "Mesocycles", s2_desc: "Organize your training by weeks. IronCoach auto-regulates volume based on your feedback.", s3_title: "Smart Tracking", s3_desc: "Log RIR, use the built-in timer, and calculate warmups instantly.", s4_title: "Progress", s4_desc: "Visualize your volume landmarks (MEV/MRV) and ensure progressive overload." },
        createAndSelect: "Create and Select", overwriteTemplateConfirm: "This overwrites your current routine with the selected template.", newRecord: "New Record!", prMessage: "You beat your previous bests!", continue: "Continue",
        
        updateRoutine: "Update Routine Template?",
        updateRoutineDesc: "Save exercises, order, and sets for future workouts.",

        // Setup Wizard
        wizard: {
            title: "Setup Your Profile",
            welcome: "Let's build your perfect plan.",
            steps: {
                exp: "Experience Level",
                freq: "Training Frequency",
                goal: "Primary Goal",
                time: "Session Duration",
                result: "Your Recommended Plan"
            },
            expOptions: {
                beginner: "Beginner",
                intermediate: "Intermediate",
                advanced: "Advanced"
            },
            // NEW: Detailed Descriptions
            expDesc: {
                beginner: "Training consistently for <1 year. You get stronger every week.",
                intermediate: "1-3 years of consistent training. You need periods of accumulation.",
                advanced: "3+ years of serious training. Gains are very slow and require specialization."
            },
            // NEW: Global Disclaimer
            expNote: "Note: 'Years' implies consistent training with a structured plan. If your training has been sporadic or without a clear program, choose Beginner.",
            
            goalOptions: {
                hypertrophy: "Hypertrophy (Muscle Size)",
                strength: "Strength / Power",
                endurance: "Endurance / Conditioning"
            },
            timeOptions: {
                short: "Short (<45 mins)",
                medium: "Standard (60 mins)",
                long: "Long (90+ mins)"
            },
            generating: "Analyzing profile...",
            apply: "Apply & Start",
            manual: "Skip to Manual Setup",
            reason: {
                rec_low_freq: "Recommended for 2 days/week to hit full body frequency.",
                rec_3_day: "Classic 3-day Full Body split for optimal frequency.",
                rec_4_day: "Upper/Lower split allows focused work with good recovery.",
                rec_ppl: "Push/Pull/Legs allows high volume for advanced trainees.",
                rec_endurance: "Metabolite training focuses on higher reps and endurance.",
                rec_default: "Balanced starting point.",
                rec_wizard: "The 'Wizard' split (Heavy/Light/Medium) is perfecto for 3-day frequency."
            },
            adjusted: "Note: Volume reduced slightly to fit your time constraints."
        },

        // Auth
        auth: {
            signIn: "Sign In",
            register: "Create Account",
            email: "Email",
            password: "Password",
            continueGuest: "Continue as Guest (Local Mode)",
            guestNote: "Data is kept on device until you sign in.",
            noAccount: "Don't have an account?",
            hasAccount: "Already have an account?",
            signUpBtn: "Sign Up",
            signInBtn: "Log In",
            processing: "Processing...",
            or: "OR",
            syncNote: "Data is synced securely to the cloud when online. You can use the app offline and it will sync later.",
            logout: "Log Out",
            guestUser: "Guest User",
            localStorage: "Local Storage Only",
            proMember: "Pro Member",
            signInRegister: "Sign In / Register"
        },

        // NEW: PWA Install
        installApp: "Install App",
        installDesc: "Install IronLog on your home screen for quick access and full offline support.",
        installBtn: "Install Now",
        iosInstall: "iOS: Share → Add to Home Screen",
        androidInstall: "Android: Menu → Install App",

        // ... (REST OF THE FILE)
        // Home View Specific
        upNext: "Up Next",
        tapToStart: "Tap to start",
        consistency: "Consistency",
        schedule: "Schedule",
        weekCompleteTitle: "Week Complete!",
        weekCompleteDesc: "Great job. Rest up or start next week.",
        unnamedCycle: "Unnamed Cycle",
        loading: "Loading...",
        emptySession: "No exercises yet.",
        calc: "Calc",

        // Cardio Specific
        cardioTime: "Time (min)",
        cardioDist: "Dist (km)",
        cardioSpeed: "Vel/Int",
        cardioWork: "Work (s)",
        cardioRest: "Rest (s)",
        cardioRounds: "Rounds",
        cardioModes: {
            steady: "Steady State",
            hiit: "HIIT / Intervals",
            tabata: "Tabata"
        },
        changeCardioMode: "Cardio Mode",
        
        // Exercise Details
        exDetail: "Exercise Guide",
        instructions: "Instructions",
        watchVideo: "Watch on YouTube",
        noVideo: "No video available",
        guide: "Guide",
        videoIssues: "Video Issues?",
        executionTipTitle: "Execution Tip",
        executionTipText: "Focus on a full range of motion. If the video fails to load due to restrictions, use the button above to watch directly on YouTube.",
        statsProgress: "Progress Tracker",
        statsBalance: "Muscular Balance",
        statsIntensity: "Intensity Distribution",
        statsSets: "Sets",
        statsNoData: "No Data",

        // Plate Calculator
        plateCalc: {
            title: "Plate Calc",
            totalWeight: "Total Weight (KG)",
            bar: "Bar",
            empty: "Empty Bar",
            loadPerSide: "Load per side",
            cannotLoad: "⚠️ Cannot load exact weight"
        },

        // AI Chat
        aiPrompts: [
            { label: "Create Beginner Routine", prompt: "Create a 3-day full body routine for a beginner." },
            { label: "Modify Day 1", prompt: "Change Day 1 to focus purely on Chest and Triceps." },
            { label: "Analyze Progress", prompt: "Analyze my last 3 workouts. Am I progressing?" },
        ],

        // Tutorials (Expanded)
        tutorial: {
            next: "Next",
            finish: "Got it!",
            reset: "Reset Tutorials",
            home: [
                { title: "Your Next Workout", text: "This card shows your immediate next session. Tap the card to enter the 'Workout Mode' and start logging." },
                { title: "Mesocycle Management", text: "A 'Mesocycle' is a block of training (usually 4-8 weeks). Here you can edit the plan or rename it. When a cycle ends, you start a new one to keep progressing." },
                { title: "App Navigation", text: "Switch between your Active Plan (Home), History Log (Past workouts), and Analytics (Stats)." }
            ],
            workout: [
                { title: "Exercise List", text: "This is your plan for today. You can drag exercises to reorder them if equipment is busy." },
                { title: "Logging Sets", text: "Log your Weight and Reps here. Tap the checkmark to complete a set. The timer will start automatically." },
                { title: "What is RIR?", text: "RIR = Reps In Reserve. It means 'how many more reps could I have done with good form?'. For growth, aim for 1-3 RIR (close to failure, but not failing)." },
                { title: "Finish Workout", text: "When you are done, tap here. This saves your data and updates your volume stats for the week." }
            ],
            history: [
                { title: "Log Archive", text: "This is your training diary. Tap any workout card to see exactly what you did, including weights, reps, and notes." },
                { title: "Search & Filter", text: "Looking for a specific Personal Record? Search by exercise name here." }
            ],
            stats: [
                { title: "Progress Tracker", text: "Visualize your estimated 1RM (strength) or Volume accumulation over time. Consistent upward trends mean muscle growth." },
                { title: "Muscular Balance", text: "This radar chart shows which muscles you are training the most. Use it to find lagging body parts." },
                { title: "Volume Landmarks", text: "This is the most important chart for Hypertrophy. It compares your weekly sets against scientific benchmarks." },
                { title: "MV (Maintenance)", text: "Yellow (MV): Maintenance Volume. Doing this much keeps the muscle you have, but won't grow much new muscle." },
                { title: "MEV (Minimum)", text: "Green (MEV): Minimum Effective Volume. This is the starting point for growth. You must do at least this much to gain muscle." },
                { title: "MAV (Optimal)", text: "Blue (MAV): Maximum Adaptive Volume. The 'Sweet Spot'. Training in this zone yields the fastest gains." },
                { title: "MRV (Max Recoverable)", text: "Red (MRV): Maximum Recoverable Volume. If you exceed this, you are overtraining and risking injury. Back off if you hit this." }
            ]
        }
    },
    es: { 
        startMeso: "Nuevo Mesociclo", finishWorkout: "Terminar", finishConfirm: "¿Terminar entreno?", cancel: "Cancelar", delete: "Eliminar", skip: "Omitir Ejercicio", skipDay: "Saltar Día", skipped: "Saltado", completed: "Completado", swap: "Cambiar Ejercicio", changeMuscle: "Cambiar Músculo", chooseMuscle: "Elegir Músculo", addSetBelow: "Añadir Serie", deleteSet: "Borrar Serie", skipSet: "Saltar Serie", unskipSet: "Restaurar Serie", sets: "Series", weight: "Peso", reps: "Reps", rir: "RIR", log: "Log", note: "Rango: 6-10", active: "Activo", history: "Historial", settings: "Ajustes", volume: "Volumen Semanal", workouts: "Entrenos Recientes", noData: "Sin datos", duration: "Duración", exercises: "Ejercicios", configure: "Configurar", week: "SEMANA", massPhase: "Fase de Volumen", resting: "Descansando", language: "Idioma", theme: "Tema", back: "Atrás", finishCycle: "Terminar Ciclo", confirmCycle: "¿Terminar mesociclo actual?", selectEx: "Seleccionar Ejercicio", searchPlaceholder: "Buscar...", createEx: "Crear", noExFound: "No se encontraron ejercicios", keepScreen: "Pantalla Encendida", setType: "TIPO DE SERIE", mesoStats: "Estadísticas Meso", totalWorkouts: "Entrenos Totales", currentWeek: "Semana Actual", linkSuperset: "Vincular Superserie", unlinkSuperset: "Desvincular", selectToLink: "Selecciona ejercicio a vincular...", superset: "SUPERSERIE", workoutComplete: "ENTRENO COMPLETADO", goodJob: "¡Buen trabajo!", totalVolume: "Volumen Total", totalSets: "Series Totales", totalReps: "Reps Totales", share: "Compartir", close: "Guardar y Cerrar", resume: "Reanudar", backup: "Copia de Seguridad", export: "Exportar Datos", import: "Importar Datos", importConfirm: "¿Sobrescribir datos?", dataSaved: "¡Guardado!", addSet: "Serie", remSet: "Serie", delSlot: "Borrar Slot", offline: "Modo Local", mesoAvg: "Vol. Promedio Meso", routineGuide: "Guía de Rutina", executionInfo: "Ejecución y Objetivos",
        types: { regular: "Normal", myorep: "Myo-rep", myorep_match: "Myorep Match", cluster: "Cluster", top: "Serie Top", backoff: "Serie Back-off", giant: "Serie Gigante", warmup: "Calentamiento" }, 
        typeDesc: { regular: "Serie normal estándar", myorep: "Activación + mini-series (descanso corto)", myorep_match: "Igualar reps de serie anterior", cluster: "Descansos intra-serie", top: "Serie más pesada (Alta Intensidad)", backoff: "Trabajo de volumen tras Top Set", giant: "Reps altas al fallo (Metabolitos)", warmup: "Preparación baja fatiga" }, 
        muscle: { CHEST: "Pecho", BACK: "Espalda", QUADS: "Cuádriceps", HAMSTRINGS: "Isquios", GLUTES: "Glúteos", CALVES: "Gemelos", SHOULDERS: "Hombros", BICEPS: "Bíceps", TRICEPS: "Tríceps", TRAPS: "Trapecios", ABS: "Abdominales", FOREARMS: "Antebrazos", CARDIO: "Cardio" },
        rp: "Progresión IronCoach", rpEnabled: "Sugerencias IronCoach", rpTargetRIR: "RIR Objetivo", rpFeedbackTitle: "Feedback Muscular", rpRatingHelp: "Valora para auto-regular volumen (Lógica RP)", rpSave: "Guardar feedback", rpSuggestion: "Sugerido", rpNoSuggestion: "Sin sugerencia",
        editTemplate: "Editar Programa", resetTemplate: "Restaurar Predeterminado", editDay: "Editar Día", addDay: "Añadir Día", addSlot: "Añadir Slot", save: "Guardar", swapTitle: "Cambiar Ejercicio", swapMsg: "¿Cómo quieres aplicar el cambio?", swapSession: "Solo esta sesión", swapForever: "Actualizar Plan (Siempre)", programEditor: "Editor de Programa", selectExBtn: "Seleccionar Ejercicio", any: "Cualquiera",
        manageEx: "Gestionar Ejercicios", addEx: "Nuevo Ejercicio", exName: "Nombre", selectMuscle: "Músculo", deleteConfirm: "¿Eliminar este ejercicio?",
        setsCount: "Series", notes: "Notas", addNote: "Nota...", volumeStatus: { low: "Bajo", maintenance: "Mant.", optimal: "Óptimo", high: "Alto" }, showRIR: "Mostrar Columna RIR", install: "Instalar App", unitToggle: "Unidad de Peso", addExercise: "Añadir Ejercicio", updateTemplate: "Actualizar Plantilla", selectMuscleToAdd: "Selecciona Músculo",
        appearance: "Apariencia", database: "Base de Datos", dangerZone: "Zona Peligrosa", factoryReset: "Restablecer Fábrica", workoutConfig: "Configuración Entreno",
        completeWeek: "Completar Semana", completeWeekConfirm: "¿Avanzar a la siguiente semana?", autoRegulate: "¿Auto-regular volumen?", autoRegulateDesc: "IronCoach ajustará el volumen según tu feedback.", applyingChanges: "Aplicando Cambios IronCoach:", setsAdded: "series añadidas", setsRemoved: "series eliminadas", noChanges: "Sin cambios de volumen.",
        finishMesoConfirm: "¿Terminar este mesociclo? Esto archivará tu progreso y podrás iniciar uno nuevo.",
        deleteDataConfirm: "¿Borrar TODOS los datos? No se puede deshacer.",
        importSuccess: "¡Importación exitosa!", invalidFile: "Archivo inválido",
        day: "Día",
        replaceEx: "Reemplazar", removeEx: "Quitar", moveUp: "Subir", moveDown: "Bajar",
        emptyWorkoutTitle: "¿Entreno Vacío?", emptyWorkoutMsg: "No has completado ninguna serie. ¿Seguro?",
        completedSetsMsg: "Has completado {0} series. ¿Guardar?", confirmRemoveEx: "¿Quitar este ejercicio de la sesión?",
        volPerCycle: "Vol. Semanal Promedio", avgDuration: "Duración", addSetBtn: "AÑADIR SERIE", removeSetBtn: "QUITAR SERIE",
        prev: "Ant", target: "OBJ",
        warmup: "Calentamiento Inteligente", warmupTitle: "Protocolo Calentamiento", potentiation: "Potenciación", workingWeight: "Peso de Trabajo",
        warmupSets: { light: "Ligera", moderate: "Moderada", potentiation: "Potenciación" },
        mesoConfig: "Ajustes Mesociclo", targetWeeks: "Duración Planeada", weeks: "Semanas",
        deloadMode: "Modo Descarga", deloadDesc: "Reduce volumen (50%) para recuperación.", enableDeload: "Activar Descarga",
        skipDayConfirm: "¿Saltar este entreno? Se marcará como saltado.",
        mesoName: "Nombre Mesociclo",
        exportReport: "Exportar Informe y Terminar", justFinish: "Solo Terminar",
        mesoType: "Tipo de Fase",
        phases: { hyp_1: "Hipertrofia Base 1", hyp_2: "Hipertrofia Base 2", metabolite: "Fase Metabolitos", resensitization: "Resensitization", full_body: "Aesthetic V-Taper", wizard: "The Wizard v3 (Full Body)", male_physique: "Male Physique (Torso/Pierna)" },
        phaseDesc: { hyp_1: "PPL Estándar. Volumen equilibrado.", hyp_2: "Torso/Pierna (4 Días). Foco en básicos.", metabolite: "Reps altas (20-30), descanso corto, 'quemazón'.", resensitization: "Bajo volumen, peso alto para resetear fatiga.", full_body: "Estilo Dr. Mike. Foco en V-Taper (Dorsal/Hombro Lateral).", wizard: "3-Días Pesado/Liviano/Medio. Ciclo de intensidad clásico para ganancias constantes.", male_physique: "4-Días Foco Culturismo. Mayor volumen, especialización en brazos y hombros." },
        
        // PAYWALL & PRO (Updated with specific strategy)
        pro: {
            title: "Desbloquea tu máximo potencial",
            subtitle: "Accede a analíticas avanzadas, IA y seguimiento profesional.",
            features: [
                "Analíticas avanzadas y mesociclos completos",
                "IA que ajusta tu progreso automáticamente",
                "Plantillas ilimitadas y historial completo"
            ],
            plans: {
                monthly: "$5.99 / mes",
                yearly: "$34.99 / año",
                lifetime: "$49.99 de por vida"
            },
            bestValue: "Ahorra 50%",
            guarantee: "Cancela cuando quieras. Tus datos siempre son tuyos.",
            triggers: {
                history: "Has llegado al límite. Desbloquea el historial completo.",
                analytics: "Las analíticas avanzadas están disponibles en Premium.",
                ai: "La IA de entrenamiento es parte de Premium.",
                sync: "Sincronización en nube es Premium."
            }
        },

        // Template Categories
        cat: {
            beginner: "Principiante / Reset",
            intermediate: "Intermedio (Progreso Constante)",
            advanced: "Avanzado / Especialización"
        },

        targetRIR: "RIR Objetivo", recoveryWeek: "Semana Recuperación", focusMode: "Modo Foco", repsRange: "Rango Reps", startNow: "Empezar Ciclo", setupCycle: "Configurar y Empezar", saveAsMeso: "Usar este programa para crear un nuevo mesociclo activo.",
        units: { kg: "KG", pl: "Discos", lb: "LBS", toggle: "Cambiar Unidad (KG/Discos)", plateWeight: "Peso por Disco", setPlateWeight: "Fijar Peso Disco (kg)", enterWeight: "ej. 5, 10..." },
        fb: { sorenessLabel: "Agujetas / Recuperación", performanceLabel: "Bombeo / Capacidad", soreness: { 1: "Recuperado Antes / Fresco", 2: "Recuperado a Tiempo (Ideal)", 3: "Aún con Agujetas / Dolor" }, performance: { 1: "Mal / Forzado", 2: "Bien / Objetivo", 3: "Genial / Demasiado Fácil" }, adjust: { add: "+1/2 Series", sub: "-1 Serie", keep: "Mantener (Óptimo)" } },
        onb: { skip: "Omitir", next: "Siguiente", start: "Empezar", s1_title: "Bienvenido a IronLog", s1_desc: "La herramienta definitiva para hipertrofia, impulsada por IronCoach.", s2_title: "Mesociclos", s2_desc: "Organiza tu entreno por semanas. IronCoach auto-regula el volumen según tu feedback.", s3_title: "Seguimiento Inteligente", s3_desc: "Registra RIR, usa el temporizador integrado y calcula el calentamiento al instante.", s4_title: "Progreso", s4_desc: "Visualiza tus hitos de volumen (MEV/MRV) y asegura la sobrecarga progresiva." },
        createAndSelect: "Crear y Seleccionar", overwriteTemplateConfirm: "Esto sobrescribe tu rutina actual con la plantilla seleccionada.", newRecord: "¡Nuevo Récord!", prMessage: "¡Superaste tus marcas anteriores!", continue: "Continuar",
        
        updateRoutine: "¿Actualizar Plantilla?",
        updateRoutineDesc: "Guardar ejercicios, orden y series para futuros entrenos.",

        // Setup Wizard
        wizard: {
            title: "Configura tu Perfil",
            welcome: "Construyamos tu plan ideal.",
            steps: {
                exp: "Nivel de Experiencia",
                freq: "Frecuencia Semanal",
                goal: "Objetivo Principal",
                time: "Duración de Sesión",
                result: "Tu Plan Recomendado"
            },
            expOptions: {
                beginner: "Principiante",
                intermediate: "Intermedio",
                advanced: "Avanzado"
            },
            // NEW: Detailed Descriptions (Spanish)
            expDesc: {
                beginner: "Entrenamiento constante <1 año. Progresas en cargas casi cada semana.",
                intermediate: "1-3 años constantes. Necesitas periodización para seguir avanzando.",
                advanced: "3+ años serios. Ganancias muy lentas, requiere bloques especializados."
            },
            // NEW: Global Disclaimer (Spanish)
            expNote: "Nota: 'Años' implica entrenamiento constante con un plan real. Si has entrenado intermitentemente o sin rutina clara, elige Principiante.",

            goalOptions: {
                hypertrophy: "Hipertrofia (Músculo)",
                strength: "Fuerza / Power",
                endurance: "Resistencia / Cardio"
            },
            timeOptions: {
                short: "Corto (<45 min)",
                medium: "Estándar (60 min)",
                long: "Largo (90+ min)"
            },
            generating: "Analizando perfil...",
            apply: "Aplicar y Empezar",
            manual: "Saltar a Configuración Manual",
            reason: {
                rec_low_freq: "Recomendado para 2 días/sem para cubrir cuerpo completo.",
                rec_3_day: "Full Body de 3 días para frecuencia óptima.",
                rec_4_day: "División Torso/Pierna: buen equilibrio trabajo/descanso.",
                rec_ppl: "Push/Pull/Legs: alto volumen para avanzados.",
                rec_endurance: "Entreno de metabolitos enfocado en altas reps.",
                rec_default: "Punto de partida equilibrado.",
                rec_wizard: "El sistema 'Wizard' (Pesado/Liviano/Medio) es perfecto para frecuencia 3 días."
            },
            adjusted: "Nota: Volumen reducido ligeramente por tiempo limitado."
        },

        // Auth
        auth: {
            signIn: "Iniciar Sesión",
            register: "Crear Cuenta",
            email: "Correo Electrónico",
            password: "Contraseña",
            continueGuest: "Seguir como Invitado (Modo Local)",
            guestNote: "Los datos se guardan en el dispositivo hasta que inicies sesión.",
            noAccount: "¿No tienes cuenta?",
            hasAccount: "¿Ya tienes cuenta?",
            signUpBtn: "Regístrate",
            signInBtn: "Acceder",
            processing: "Procesando...",
            or: "O",
            syncNote: "Tus datos se sincronizan en la nube. Puedes usar la app offline y se sincronizará luego.",
            logout: "Cerrar Sesión",
            guestUser: "Usuario Invitado",
            localStorage: "Solo almacenamiento local",
            proMember: "Miembro Pro",
            signInRegister: "Iniciar Sesión / Registro"
        },

        // NEW: PWA Install
        installApp: "Instalar App",
        installDesc: "Instala IronLog en tu pantalla de inicio para acceso rápido y modo offline completo.",
        installBtn: "Instalar Ahora",
        iosInstall: "iOS: Compartir → Añadir a Inicio",
        androidInstall: "Android: Menú → Instalar App",

        // ... (REST OF FILE)
        // Home View Specific
        upNext: "Siguiente",
        tapToStart: "Toca para empezar",
        consistency: "Constancia",
        schedule: "Calendario",
        weekCompleteTitle: "¡Semana Completada!",
        weekCompleteDesc: "Buen trabajo. Descansa o empieza la siguiente.",
        unnamedCycle: "Ciclo Sin Nombre",
        loading: "Cargando...",
        emptySession: "Aún no hay ejercicios.",
        calc: "Calc",

        // Cardio Specific
        cardioTime: "Tiempo (min)",
        cardioDist: "Dist (km)",
        cardioSpeed: "Vel/Int",
        cardioWork: "Trabajo (s)",
        cardioRest: "Descanso (s)",
        cardioRounds: "Rondas",
        cardioModes: {
            steady: "Ritmo Constante",
            hiit: "HIIT / Intervalos",
            tabata: "Tabata"
        },
        changeCardioMode: "Modo Cardio",

        // Exercise Details
        exDetail: "Guía de Ejercicio",
        instructions: "Instrucciones",
        watchVideo: "Abrir en YouTube",
        noVideo: "Sin video disponible",
        guide: "Guía",
        videoIssues: "¿Problemas de Video?",
        executionTipTitle: "Consejo de Ejecución",
        executionTipText: "Concéntrate en un rango de movimiento completo. Si el video falla por restricciones, usa el botón de arriba para verlo en YouTube.",
        statsProgress: "Seguimiento de Progreso",
        statsBalance: "Equilibrio Muscular",
        statsIntensity: "Distribución de Intensidad",
        statsSets: "Series",
        statsNoData: "Sin Datos",

        // Plate Calculator
        plateCalc: {
            title: "Calc. Discos",
            totalWeight: "Peso Total (KG)",
            bar: "Bar",
            empty: "Barra Vacía",
            loadPerSide: "Carga por lado",
            cannotLoad: "⚠️ No se puede cargar exacto"
        },

        // AI Chat
        aiPrompts: [
            { label: "Crear Rutina Principiante", prompt: "Crea una rutina de cuerpo completo de 3 días para principiantes." },
            { label: "Modificar Día 1", prompt: "Cambia el Día 1 para enfocarlo puramente en Pecho y Tríceps." },
            { label: "Analizar Progreso", prompt: "Analiza mis últimos 3 entrenamientos. ¿Estoy progresando?" },
        ],

        // Tutorials (Fully Translated & Educational)
        tutorial: {
            next: "Siguiente",
            finish: "¡Entendido!",
            reset: "Reiniciar Tutoriales",
            home: [
                { title: "Tu Próximo Entreno", text: "Esta tarjeta muestra tu sesión inmediata. Tócala para entrar al 'Modo Entreno' y empezar a registrar." },
                { title: "Gestión de Mesociclo", text: "Un 'Mesociclo' es un bloque de entrenamiento (4-8 semanas). Aquí puedes editar el plan o renombrarlo. Al acabar el ciclo, inicias uno nuevo para seguir progresando." },
                { title: "Navegación", text: "Cambia entre tu Plan Activo (Inicio), Historial (Entrenos pasados) y Análisis (Estadísticas)." }
            ],
            workout: [
                { title: "Lista de Ejercicios", text: "Este es tu plan para hoy. Puedes arrastrar los ejercicios para reordenarlos si el equipo está ocupado." },
                { title: "Registrar Series", text: "Introduce Peso y Reps. Toca el check para completar la serie. El temporizador iniciará automáticamente." },
                { title: "¿Qué es el RIR?", text: "RIR = Reps en Reserva. Significa '¿cuántas reps más podría haber hecho con buena técnica?'. Para crecer, busca un RIR de 1-3 (cerca del fallo, pero sin fallar)." },
                { title: "Terminar Entreno", text: "Al acabar, toca aquí. Esto guarda tus datos y actualiza tus estadísticas de volumen semanal." }
            ],
            history: [
                { title: "Archivo de Entrenos", text: "Este es tu diario. Toca cualquier tarjeta para expandir y ver exactamente qué hiciste, incluyendo pesos, reps y notas." },
                { title: "Buscar y Filtrar", text: "¿Buscas un Récord Personal específico? Busca por nombre de ejercicio aquí." }
            ],
            stats: [
                { title: "Seguimiento de Progreso", text: "Visualiza tu 1RM estimado (fuerza) o acumulación de Volumen. Tendencias ascendentes significan crecimiento muscular." },
                { title: "Equilibrio Muscular", text: "Este gráfico de radar muestra qué músculos entrenas más. Úsalo para encontrar partes rezagadas." },
                { title: "Hitos de Volumen", text: "Este es el gráfico más importante. Compara tus series semanales con referencias científicas." },
                { title: "MV (Mantenimiento)", text: "Amarillo (MV): Volumen de Mantenimiento. Hacer esto mantiene el músculo que tienes, pero no crea nuevo." },
                { title: "MEV (Mínimo)", text: "Verde (MEV): Volumen Mínimo Efectivo. Punto de partida para crecer. Debes hacer al menos esto para ganar músculo." },
                { title: "MAV (Óptimo)", text: "Azul (MAV): Volumen Máximo Adaptativo. El 'Punto Dulce'. Entrenar en esta zona da las mejores ganancias." },
                { title: "MRV (Máximo Recup.)", text: "Rojo (MRV): Volumen Máximo Recuperable. Si pasas de aquí, estás sobreentrenando y arriesgas lesión. Baja el ritmo si llegas aquí." }
            ]
        }
    }
};
