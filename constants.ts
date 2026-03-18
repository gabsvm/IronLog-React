 
import { ExerciseDef, ProgramDay, MuscleGroup, GlobalTemplate } from './types';

export const MUSCLE_GROUPS: Record<string, MuscleGroup> = { 
    CHEST: 'CHEST', BACK: 'BACK', QUADS: 'QUADS', HAMS: 'HAMSTRINGS', 
    GLUTES: 'GLUTES', CALVES: 'CALVES', SHOULDERS: 'SHOULDERS', 
    BICEPS: 'BICEPS', TRICEPS: 'TRICEPS', TRAPS: 'TRAPS', 
    ABS: 'ABS', FOREARMS: 'FOREARMS', NECK: 'NECK', CARDIO: 'CARDIO'
};

const ASSETS_BASE = (import.meta as any).env?.VITE_ASSETS_BASE || '';

// ... (KEEP DEFAULT_LIBRARY, TEMPLATES, etc. exactly as they are - omitted for brevity) ...
export const DEFAULT_LIBRARY: ExerciseDef[] = [
    // ... same content as before ...
    // Cardio
    { id: 'cardio_run', name: { en: 'Running (Steady)', es: 'Correr (Ritmo Constante)' }, muscle: 'CARDIO', defaultCardioType: 'steady', videoId: "brFHyOTtwNs" },
    { id: 'cardio_hiit_sprint', name: { en: 'HIIT Sprints', es: 'Sprints HIIT' }, muscle: 'CARDIO', defaultCardioType: 'hiit', instructions: { en: "High intensity intervals.", es: "Intervalos de alta intensidad." }, videoId: "Mp8qJ57971Y" },
    { id: 'cardio_tabata', name: { en: 'Tabata Protocol', es: 'Protocolo Tabata' }, muscle: 'CARDIO', defaultCardioType: 'tabata', instructions: { en: "20s Work / 10s Rest x 8 Rounds.", es: "20s Trabajo / 10s Descanso x 8 Rondas." }, videoId: "a_L3b7d7rYs" },
    { id: 'cardio_cycle', name: { en: 'Cycling', es: 'Ciclismo' }, muscle: 'CARDIO', defaultCardioType: 'steady', videoId: "4g7z3v3Yy34" },
    { id: 'cardio_elliptical', name: { en: 'Elliptical', es: 'Elíptica' }, muscle: 'CARDIO', defaultCardioType: 'steady', videoId: "8Z7t6j5G9V0" },
    { id: 'cardio_row', name: { en: 'Rowing Machine', es: 'Remo (Ergómetro)' }, muscle: 'CARDIO', defaultCardioType: 'steady', videoId: "H0r_ZGCx2l8" },
    { id: 'farmers_walk', name: { en: 'Farmers Walk', es: 'Paseo de Granjero' }, muscle: 'TRAPS', instructions: { en: "Walk tall, heavy dumbbells. 30-60s.", es: "Camina erguido con mancuernas pesadas. 30-60s." }, videoId: "rt12T74g3ms" },
    // Chest
    { id: 'bp_flat', name: { en: 'Machine Chest Press', es: 'Press Pecho Máquina' }, muscle: 'CHEST', instructions: { en: "Standard volume builder.", es: "Añade volumen de forma segura." }, videoId: "NwzUje3z0qY" },
    { id: 'bp_inc', name: { en: 'Incline Dumbbell Press', es: 'Press Inclinado Mancuernas' }, muscle: 'CHEST', instructions: { en: "Focus on upper chest. Get a deep stretch.", es: "Enfoque en pecho superior. Busca un estiramiento profundo." }, videoId: "8iPEnn-ltC8" },
    { id: 'bp_bar', name: { en: 'Barbell Bench Press', es: 'Press Banca Barra' }, muscle: 'CHEST', videoId: "rT7DgCr-3pg" },
    { id: 'bp_inc_bar', name: { en: 'Incline Barbell Press', es: 'Press Inclinado Barra' }, muscle: 'CHEST', instructions: { en: "Regular grip, control the descent. Touches upper chest.", es: "Agarre regular, controla la bajada. Toca la parte superior del pecho." }, videoId: "SrqOu55lr00" },
    { id: 'bp_inc_wide', name: { en: 'Wide Grip Incline Press', es: 'Press Inclinado Agarre Ancho' }, muscle: 'CHEST', instructions: { en: "Wider grip to bias chest. Pause at the bottom.", es: "Agarre más ancho para enfatizar el pecho. Haz una pausa en la parte inferior." }, videoId: "SrqOu55lr00" },
    { id: 'bp_mach_inc', name: { en: 'Machine Incline Press', es: 'Press Inclinado Máquina' }, muscle: 'CHEST', instructions: { en: "Constant tension for upper pecs.", es: "Tensión constante para pectorales superiores." }, videoId: "NwzUje3z0qY" },
    { id: 'pec_fly', name: { en: 'Pec Dec Flye', es: 'Aperturas Pec Dec' }, muscle: 'CHEST', videoId: "eGjt4lkiwuc" },
    { id: 'diamond_pushup', name: { en: 'Diamond Pushups', es: 'Flexiones Diamante' }, muscle: 'CHEST', instructions: { en: "Hands close together. Hits triceps and inner chest.", es: "Manos juntas. Enfatiza tríceps y pecho interno." }, videoId: "J0DnG1_S92I", isBodyweight: true },
    { id: 'pushup', name: { en: 'Push Ups', es: 'Flexiones' }, muscle: 'CHEST', isBodyweight: true, videoId: "IODxDxX7oi4" },
    { id: 'bp_paused', name: { en: 'Paused Bench Press', es: 'Press Banca Pausado' }, muscle: 'CHEST', instructions: { en: "1-2s pause on chest. No bounce.", es: "Pausa 1-2s en el pecho. Sin rebote." }, videoId: "rT7DgCr-3pg" },
    // Back
    { id: 'lat_pull', name: { en: 'Lat Pulldown', es: 'Jalón al Pecho' }, muscle: 'BACK', instructions: { en: "Prone, neutral, or supine grip. Focus on back width.", es: "Agarre prono, neutro o supino. Enfocado en la amplitud de espalda." }, videoId: "CAwf7n6Luuc" },
    { id: 'lat_pull_supine', name: { en: 'Supine Lat Pulldown', es: 'Jalón Supino (Chin-grip)' }, muscle: 'BACK', instructions: { en: "Underhand grip. Great for lats.", es: "Agarre supino (palmas hacia ti). Excelente para dorsales." }, videoId: "8hKEjE58Jzo" },
    { id: 'lat_prayer', name: { en: 'Cable Lat Prayer', es: 'Pullover Polea Alta' }, muscle: 'BACK', instructions: { en: "Isolation movement for back width. Keep tension constant.", es: "Movimiento de aislamiento para ancho de espalda. Mantén tensión constante." }, videoId: "F_iF87c4gD8" },
    { id: 'pullover_db', name: { en: 'Dumbbell Pullover', es: 'Pullover con Mancuerna' }, muscle: 'BACK', instructions: { en: "Old school lat builder. Stretch.", es: "Constructor de dorsales de la vieja escuela. Estira bien." }, videoId: "5_J5E68rFfE" },
    { id: 'row_mach', name: { en: 'Machine Row', es: 'Remo en Máquina' }, muscle: 'BACK', videoId: "H75im9hGYUE" },
    { id: 'row_cable', name: { en: 'Cable Row', es: 'Remo en Polea' }, muscle: 'BACK', videoId: "GZbfZ033f74" },
    { id: 'row_db', name: { en: 'Dumbbell Row (Kroc)', es: 'Remo Mancuerna (Kroc)' }, muscle: 'BACK', instructions: { en: "Heavy, high reps. Use straps if needed.", es: "Pesado, altas repeticiones. Usa straps si es necesario." }, videoId: "roCP6wCXPqq" },
    { id: 'pendlay_row', name: { en: 'Pendlay Row', es: 'Remo Pendlay' }, muscle: 'BACK', instructions: { en: "Explosive off the floor. Reset each rep.", es: "Explosivo desde el suelo. Resetea en cada repetición." }, videoId: "hUYmnfkHQ98" },
    { id: 'pullup', name: { en: 'Pull Ups', es: 'Dominadas' }, muscle: 'BACK', instructions: { en: "Strict technique, full range of motion.", es: "Técnica estricta, rango de movimiento completo." }, videoId: "eGo4IYlbE5g", isBodyweight: true },
    { id: 'chinup', name: { en: 'Chin Ups', es: 'Dominadas Supinas' }, muscle: 'BACK', instructions: { en: "Palms facing you. Hits biceps more.", es: "Palmas hacia ti. Enfatiza bíceps." }, videoId: "mRy9m2Q9_1I", isBodyweight: true },
    { id: 'rack_pull', name: { en: 'Rack Pull', es: 'Rack Pull' }, muscle: 'BACK', instructions: { en: "Start just below knees. Heavy trap/back load.", es: "Inicia justo bajo la rodilla. Carga pesada para trapecios/espalda." }, videoId: "u9Fz88jX8HQ" },
    // Legs
    { id: 'sq_bar', name: { en: 'Barbell Squat', es: 'Sentadilla con Barra' }, muscle: 'QUADS', instructions: { en: "The king of legs. Hit depth.", es: "El rey de las piernas. Rompe la paralela." }, videoId: "MVMVx5g0Zsk" },
    { id: 'sq_paused', name: { en: 'Paused Squat', es: 'Sentadilla Pausada' }, muscle: 'QUADS', instructions: { en: "Pause 1-2s at the bottom.", es: "Pausa 1-2s en el fondo." }, videoId: "MVMVx5g0Zsk" },
    { id: 'sq_hack', name: { en: 'Hack Squat', es: 'Sentadilla Hack' }, muscle: 'QUADS', videoId: "EdzE55jqUbs" },
    { id: 'leg_ext', name: { en: 'Leg Extension', es: 'Extensiones de Cuádriceps' }, muscle: 'QUADS', videoId: "YyvSfVjQeL0" },
    { id: 'leg_press', name: { en: 'Leg Press', es: 'Prensa de Piernas' }, muscle: 'QUADS', instructions: { en: "Maintenance volume. Full ROM.", es: "Volumen de mantenimiento. Rango completo." }, videoId: "IZxyjW7MPJQ" },
    { id: 'rdl', name: { en: 'Romanian Deadlift', es: 'Peso Muerto Rumano' }, muscle: 'HAMSTRINGS', videoId: "JCXUYuzwNrM" },
    { id: 'deadlift', name: { en: 'Deadlift (Conventional)', es: 'Peso Muerto (Convencional)' }, muscle: 'BACK', instructions: { en: "Total body strength. Keep spine neutral.", es: "Fuerza total. Mantén la columna neutra." }, videoId: "r4MzxtBKyNE" },
    { id: 'sldl', name: { en: 'Stiff Leg Deadlift', es: 'Peso Muerto Piernas Rígidas' }, muscle: 'HAMSTRINGS', instructions: { en: "Minimal knee bend. Hamstring focus.", es: "Mínima flexión de rodilla. Enfoque en isquios." }, videoId: "1uDiW5--rAE" },
    { id: 'good_morning', name: { en: 'Good Morning', es: 'Buenos Días' }, muscle: 'HAMSTRINGS', instructions: { en: "Hinge at hips, keep back straight.", es: "Bisagra de cadera, espalda recta." }, videoId: "d_1D8x_hM7o" },
    { id: 'glute_bridge', name: { en: 'Glute Bridge', es: 'Puente de Glúteos' }, muscle: 'GLUTES', videoId: "8Z7t6j5G9V0" },
    { id: 'leg_curl', name: { en: 'Seated Leg Curl', es: 'Curl Femoral Sentado' }, muscle: 'HAMSTRINGS', videoId: "OrxowZ454Po" },
    { id: 'lying_curl', name: { en: 'Lying Leg Curl', es: 'Curl Femoral Tumbado' }, muscle: 'HAMSTRINGS', videoId: "1Tq3QdYUuHs" },
    { id: 'calf_raise', name: { en: 'Calf Raise', es: 'Elevación de Talones' }, muscle: 'CALVES', videoId: "gwLzBJYoWlI" },
    { id: 'lunges', name: { en: 'Walking Lunges', es: 'Zancadas (Lunges)' }, muscle: 'QUADS', instructions: { en: "Knee touches ground gently.", es: "Rodilla toca suelo suavemente." }, videoId: "D7KaRcUTQeE" },
    { id: 'lunge_reverse', name: { en: 'Reverse Lunges', es: 'Zancadas Inversas' }, muscle: 'QUADS', videoId: "7pK8da5r6g" },
    // Shoulders
    { id: 'ohp', name: { en: 'Overhead Press', es: 'Press Militar' }, muscle: 'SHOULDERS', videoId: "QAQ64hK4Xxs" },
    { id: 'ohp_db', name: { en: 'Seated DB Press', es: 'Press Militar Mancuernas' }, muscle: 'SHOULDERS', videoId: "qEwK657kfLM" },
    { id: 'lat_raise', name: { en: 'Lateral Raise', es: 'Elevaciones Laterales' }, muscle: 'SHOULDERS', instructions: { en: "Standard dumbbell raises for capped delts.", es: "Elevaciones estándar para hombros redondos 'capitaneados'." }, videoId: "3VcKaXpzqRo" },
    { id: 'lat_raise_cable', name: { en: 'Cable Lateral Raise', es: 'Elev. Laterales Polea' }, muscle: 'SHOULDERS', instructions: { en: "Maintain constant tension throughout the movement.", es: "Mantén tensión constante durante todo el movimiento." }, videoId: "PzmPFkm-ldk" },
    { id: 'lat_raise_mach', name: { en: 'Machine Lateral Raise', es: 'Elev. Laterales Máquina' }, muscle: 'SHOULDERS', videoId: "3VcKaXpzqRo" },
    { id: 'lat_raise_seat', name: { en: 'Seated Lateral Raise', es: 'Elev. Laterales Sentado' }, muscle: 'SHOULDERS', videoId: "3VcKaXpzqRo" },
    { id: 'face_pull', name: { en: 'Face Pull', es: 'Face Pull' }, muscle: 'SHOULDERS', videoId: "rep-qVOkqgk" },
    { id: 'shrug_db', name: { en: 'Dumbbell Shrugs', es: 'Encogimientos Mancuerna' }, muscle: 'TRAPS', videoId: "g6qbq4Lf1FI" },
    { id: 'rear_delt_fly', name: { en: 'Rear Delt Fly', es: 'Pájaros (Deltoides Post.)' }, muscle: 'SHOULDERS', videoId: "0P6CNhTR_Y8" },
    // Arms
    { id: 'curl_ez', name: { en: 'EZ Bar Curl', es: 'Curl Barra Z' }, muscle: 'BICEPS', instructions: { en: "Strict curls. Range 5-10 or 10-15.", es: "Curl estricto. Rangos de 5-10 o 10-15 reps." }, videoId: "kwG2ipFRgfo" },
    { id: 'curl_bar', name: { en: 'Barbell Curl', es: 'Curl con Barra' }, muscle: 'BICEPS', instructions: { en: "Can use Myo-reps here for volume.", es: "Puedes usar Myo-reps aquí para meter volumen rápido." }, videoId: "kwG2ipFRgfo" },
    { id: 'curl_db', name: { en: 'Dumbbell Curl', es: 'Curl con Mancuernas' }, muscle: 'BICEPS', videoId: "sAq_ocpRh_I" },
    { id: 'curl_hammer', name: { en: 'Hammer Curl', es: 'Curl Martillo' }, muscle: 'BICEPS', instructions: { en: "Neutral grip. Hits brachialis.", es: "Agarre neutro. Enfatiza braquial." }, videoId: "zC3nLlEvin4" },
    { id: 'curl_cable', name: { en: 'Cable Curl', es: 'Curl en Polea' }, muscle: 'BICEPS', instructions: { en: "High reps (15-20). Constant tension.", es: "Altas repeticiones (15-20). Tensión constante." }, videoId: "AsAVcaJ8-Y" },
    { id: 'curl_preacher', name: { en: 'Preacher Curl', es: 'Curl Predicador' }, muscle: 'BICEPS', videoId: "fIWP-FRFnU" },
    { id: 'skull_crusher', name: { en: 'Skull Crushers', es: 'Rompecráneos (Skullcrusher)' }, muscle: 'TRICEPS', instructions: { en: "Keep elbows tucked in.", es: "Mantén los codos cerrados hacia dentro." }, videoId: "d_KZxkY_0cM" },
    { id: 'db_tri_ext', name: { en: 'DB Tricep Extension', es: 'Extensión Tríceps Mancuerna' }, muscle: 'TRICEPS', videoId: "nRiJVZDpdL0" },
    { id: 'tri_push', name: { en: 'Tricep Pushdown', es: 'Extensión Tríceps Polea' }, muscle: 'TRICEPS', videoId: "2-LAMcpzOD8" },
    { id: 'tri_ext', name: { en: 'Overhead Extension', es: 'Extensión sobre Cabeza' }, muscle: 'TRICEPS', instructions: { en: "Focus on the long head stretch.", es: "Enfócate en el estiramiento de la cabeza larga." }, videoId: "nRiJVZDpdL0" },
    { id: 'jm_press', name: { en: 'JM Press / Smith Tri', es: 'Press JM / Smith Tríceps' }, muscle: 'TRICEPS', instructions: { en: "Giant set style: aim for 50-60 total reps.", es: "Estilo 'Giant Set': busca 50-60 reps totales con descansos cortos." }, videoId: "2t4B3-1Z9G4" },
    { id: 'dips', name: { en: 'Weighted Dips', es: 'Fondos Lastrados' }, muscle: 'TRICEPS', instructions: { en: "Leaning forward hits chest, upright hits triceps.", es: "Inclinado enfoca pecho, vertical enfoca tríceps." }, videoId: "2z8DdPdFfD4", isBodyweight: true },
    { id: 'abs_cable', name: { en: 'Cable Crunch', es: 'Crunch en Polea' }, muscle: 'ABS', videoId: "6GMkpQ08jLQ" },
    { id: 'leg_raise', name: { en: 'Hanging Leg Raise', es: 'Elevación de Piernas' }, muscle: 'ABS', videoId: "hdng3NzbzKs", isBodyweight: true },
    { id: 'knee_raise', name: { en: 'Knee Raise', es: 'Elevación de Rodillas' }, muscle: 'ABS', videoId: "9pFL2fX8K-M", isBodyweight: true },
    { id: 'wrist_curl', name: { en: 'Wrist Curl', es: 'Curl de Muñeca' }, muscle: 'FOREARMS', instructions: { en: "Marathon sets: 50-60 reps with short breaks.", es: "Series maratón: 50-60 repeticiones con descansos cortos." }, videoId: "3Vq7J2V5y0" },
    { id: 'forearm_pushup', name: { en: 'Forearm Bar Pushups', es: 'Flexiones Antebrazo en Barra' }, muscle: 'FOREARMS', instructions: { en: "Lean on bar, push with fingers/wrists.", es: "Apóyate en la barra, empuja usando dedos y muñecas." }, videoId: "8xXJ2qM_5Z0", isBodyweight: true },
    { id: 'finger_curl', name: { en: 'Finger Curls', es: 'Curl de Dedos' }, muscle: 'FOREARMS', instructions: { en: "Roll barbell down to fingertips and curl back up.", es: "Deja rodar la barra hasta la punta de los dedos y sube." }, videoId: "3Vq7J2V5y0" },
    // Neck
    { id: 'neck_curl', name: { en: 'Neck Curls (Plate)', es: 'Flexión de Cuello (Disco)' }, muscle: 'NECK', instructions: { en: "Lying on bench, plate on forehead. Control.", es: "Tumbado en banco, disco en la frente. Controla." }, videoId: "wJ8s3s7_2s" },
    { id: 'neck_ext', name: { en: 'Neck Extension', es: 'Extensión de Cuello' }, muscle: 'NECK', instructions: { en: "Use harness or plate. Look up.", es: "Usa arnés o disco. Mira hacia arriba." }, videoId: "wJ8s3s7_2s" }
];

export const TOKITA_TEMPLATE: ProgramDay[] = [
    {
        id: 'tokita_1',
        dayName: { en: 'Day 1: Upper', es: 'Día 1: Torso' },
        slots: [
            { muscle: 'CHEST', setTarget: 3, exerciseId: 'bp_bar', reps: '6-10' },
            // Superset 1: DB Shoulder Press + Weighted Chin-ups
            { muscle: 'SHOULDERS', setTarget: 4, exerciseId: 'ohp_db', reps: '8-12', supersetId: 'tokita_d1_ss1' },
            { muscle: 'BACK', setTarget: 4, exerciseId: 'chinup', reps: '3-6', supersetId: 'tokita_d1_ss1' },
            // Tri-set 1: Curls + Knee Raises + Face Pulls
            { muscle: 'BICEPS', setTarget: 4, exerciseId: 'curl_bar', reps: '8-12', supersetId: 'tokita_d1_ss2' },
            { muscle: 'ABS', setTarget: 3, exerciseId: 'knee_raise', reps: 'AMRAP', supersetId: 'tokita_d1_ss2' },
            { muscle: 'SHOULDERS', setTarget: 4, exerciseId: 'face_pull', reps: '15-20', supersetId: 'tokita_d1_ss2' },
            // Tri-set 2: Pushups + Lateral Raises + Calves
            { muscle: 'CHEST', setTarget: 3, exerciseId: 'pushup', reps: 'AMRAP', supersetId: 'tokita_d1_ss3' },
            { muscle: 'SHOULDERS', setTarget: 4, exerciseId: 'lat_raise', reps: '8-12', supersetId: 'tokita_d1_ss3' },
            { muscle: 'CALVES', setTarget: 3, exerciseId: 'calf_raise', reps: 'AMRAP', supersetId: 'tokita_d1_ss3' }
        ]
    },
    {
        id: 'tokita_2',
        dayName: { en: 'Day 2: Lower', es: 'Día 2: Pierna' },
        slots: [
            { muscle: 'HAMSTRINGS', setTarget: 3, exerciseId: 'good_morning', reps: '6-12' }, 
            // Superset 1: Lunges + Pullups
            { muscle: 'QUADS', setTarget: 4, exerciseId: 'lunges', reps: '10-15', supersetId: 'tokita_d2_ss1' },
            { muscle: 'BACK', setTarget: 4, exerciseId: 'pullup', reps: 'AMRAP', supersetId: 'tokita_d2_ss1' },
            // Tri-set: Finger Curls + Leg Raises + Calves
            { muscle: 'FOREARMS', setTarget: 4, exerciseId: 'finger_curl', reps: '8-12', supersetId: 'tokita_d2_ss2' },
            { muscle: 'ABS', setTarget: 3, exerciseId: 'leg_raise', reps: 'AMRAP', supersetId: 'tokita_d2_ss2' },
            { muscle: 'CALVES', setTarget: 3, exerciseId: 'calf_raise', reps: 'AMRAP', supersetId: 'tokita_d2_ss2' }
        ]
    },
    {
        id: 'tokita_3',
        dayName: { en: 'Day 3: Upper', es: 'Día 3: Torso' },
        slots: [
            { muscle: 'SHOULDERS', setTarget: 4, exerciseId: 'ohp', reps: '6-10' },
            // Superset 1: Pause Bench + Face Pulls
            { muscle: 'CHEST', setTarget: 4, exerciseId: 'bp_paused', reps: '4-8', supersetId: 'tokita_d3_ss1' },
            { muscle: 'SHOULDERS', setTarget: 4, exerciseId: 'face_pull', reps: '15-20', supersetId: 'tokita_d3_ss1' },
            // Tri-set: Preacher + Rear Delt + Calves
            { muscle: 'BICEPS', setTarget: 4, exerciseId: 'curl_preacher', reps: '6-10', supersetId: 'tokita_d3_ss2' },
            { muscle: 'SHOULDERS', setTarget: 4, exerciseId: 'rear_delt_fly', reps: '8-12', supersetId: 'tokita_d3_ss2' },
            { muscle: 'CALVES', setTarget: 3, exerciseId: 'calf_raise', reps: 'AMRAP', supersetId: 'tokita_d3_ss2' }
        ]
    },
    {
        id: 'tokita_4',
        dayName: { en: 'Day 4: Full Body', es: 'Día 4: Cuerpo Completo' },
        slots: [
            // Superset 1: Reverse Lunges + Chest Flies
            { muscle: 'QUADS', setTarget: 4, exerciseId: 'lunge_reverse', reps: '10-15', supersetId: 'tokita_d4_ss1' },
            { muscle: 'CHEST', setTarget: 4, exerciseId: 'pec_fly', reps: '10-15', supersetId: 'tokita_d4_ss1' },
            // Superset 2: Weighted Pullups + Pushups
            { muscle: 'BACK', setTarget: 4, exerciseId: 'pullup', reps: '3-6', supersetId: 'tokita_d4_ss2' },
            { muscle: 'CHEST', setTarget: 3, exerciseId: 'pushup', reps: 'AMRAP', supersetId: 'tokita_d4_ss2' },
            // Tri-set: Triceps + Face Pulls + Leg Raises
            { muscle: 'TRICEPS', setTarget: 4, exerciseId: 'tri_ext', reps: '8-12', supersetId: 'tokita_d4_ss3' },
            { muscle: 'SHOULDERS', setTarget: 4, exerciseId: 'face_pull', reps: '15-20', supersetId: 'tokita_d4_ss3' },
            { muscle: 'ABS', setTarget: 3, exerciseId: 'leg_raise', reps: 'AMRAP', supersetId: 'tokita_d4_ss3' }
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
        { muscle: 'CHEST', label: 'Press (Banco / Inclinado / Smith)', setTarget: 2, reps: '6-8', isAVT: true, avtRounds: 2, avtStartReps: 6, avtHops: '6-10', restBetweenHopsSec: 20, restBetweenRoundsSec: 180, notes: '6-10 hops por round. Subir peso en cada hop.' },
        { muscle: 'CHEST', label: 'Aislamiento Pecho (Cruces / Fly)', setTarget: 2, reps: '10-12', isAVT: false },
        { muscle: 'BACK', label: 'Jalón Vertical / Pull-ups / Straight-arm pulldown', setTarget: 2, reps: '6-8', isAVT: true, avtRounds: 2, avtStartReps: 6, avtHops: '6-10', restBetweenHopsSec: 20, restBetweenRoundsSec: 180, notes: '6-10 hops por round.' },
        { muscle: 'SHOULDERS', label: 'Rear Delt (Fly invertido / Face pull)', setTarget: 2, reps: '10-12', isAVT: false },
        { muscle: 'BICEPS', label: 'Curl (Barra / Mancuerna / Predicador)', setTarget: 2, reps: '20', isAVT: false },
        { muscle: 'TRICEPS', label: 'Tríceps (Pushdown / Extensión overhead / PJR)', setTarget: 2, reps: '20', isAVT: false },
      ]
    },
    {
      id: 'ji3_lb1',
      dayName: { en: 'Lower Body 1', es: 'Tren Inferior 1' },
      notes: 'Leg Press AVT primero, luego Sentadilla conservadora con peso máximo cómodo.',
      slots: [
        { muscle: 'QUADS', label: 'Leg Press', setTarget: 1, reps: '10-12', isAVT: true, avtRounds: 1, avtStartReps: 10, avtHops: '12-15', restBetweenHopsSec: 20, notes: '12-15 hops. Muchos hops = mucho volumen acumulado.' },
        { muscle: 'QUADS', label: 'Sentadilla (Back / Front / Hack)', setTarget: 1, reps: '6-8', isAVT: false, notes: 'Peso conservador post leg press. 1 top set pesado.' },
        { muscle: 'QUADS', label: 'Extensión de cuádriceps', setTarget: 2, reps: '15-20', isAVT: false },
        { muscle: 'BICEPS', label: 'Curl', setTarget: 2, reps: '20', isAVT: false },
        { muscle: 'TRICEPS', label: 'Tríceps', setTarget: 2, reps: '20', isAVT: false },
      ]
    },
    {
      id: 'ji3_ub2',
      dayName: { en: 'Upper Body 2', es: 'Tren Superior 2' },
      notes: 'Jalón horizontal (remo) + Press. Trapecios en lugar de rear delts.',
      slots: [
        { muscle: 'CHEST', label: 'Press (Banco / Hombro / Smith)', setTarget: 2, reps: '6-8', isAVT: true, avtRounds: 2, avtStartReps: 6, avtHops: '6-10', restBetweenHopsSec: 20, restBetweenRoundsSec: 180 },
        { muscle: 'CHEST', label: 'Aislamiento Hombro/Pecho (Lateral raise / Fly)', setTarget: 2, reps: '10-12', isAVT: false },
        { muscle: 'BACK', label: 'Remo Horizontal (T-bar / Mancuerna / Cable)', setTarget: 2, reps: '6-8', isAVT: true, avtRounds: 2, avtStartReps: 6, avtHops: '6-10', restBetweenHopsSec: 20, restBetweenRoundsSec: 180 },
        { muscle: 'TRAPS', label: 'Encogimientos (Mancuerna / Barra / Meadows)', setTarget: 2, reps: '10-12', isAVT: false },
        { muscle: 'BICEPS', label: 'Curl', setTarget: 2, reps: '20', isAVT: false },
        { muscle: 'TRICEPS', label: 'Tríceps', setTarget: 2, reps: '20', isAVT: false },
      ]
    },
    {
      id: 'ji3_lb2',
      dayName: { en: 'Lower Body 2', es: 'Tren Inferior 2' },
      notes: 'Unilateral primero (split squat o leg press sumo). Peso muerto al final.',
      slots: [
        { muscle: 'GLUTES', label: 'Split Squat / Búlgaro / Leg Press Sumo unilateral', setTarget: 2, reps: '10-12', isAVT: true, avtRounds: 2, avtStartReps: 10, avtHops: '10-12', restBetweenHopsSec: 20, restBetweenRoundsSec: 180, notes: 'Por pierna. Enfocarse en cadena posterior empujando el pie trasero hacia abajo.' },
        { muscle: 'HAMSTRINGS', label: 'Peso Muerto (Convencional / Sumo / RDL)', setTarget: 2, reps: '6-8', isAVT: false, notes: '1-2 top sets. Conservador.' },
        { muscle: 'HAMSTRINGS', label: 'Curl femoral acostado', setTarget: 2, reps: '10-12', isAVT: false },
        { muscle: 'BICEPS', label: 'Curl', setTarget: 2, reps: '20', isAVT: false },
        { muscle: 'TRICEPS', label: 'Tríceps', setTarget: 2, reps: '20', isAVT: false },
      ]
    }
];

export const INITIAL_TEMPLATES: GlobalTemplate[] = [
    { id: 'ji3', name: 'jacked_in_3', title: { en: "Jacked in 3 — Paul Carter", es: "Jacked in 3 — Paul Carter" }, description: { en: "Accumulative Volume Training (AVT). 3 days per week. Upper/Lower with pyramid hops.", es: "Accumulative Volume Training (AVT). 3 días por semana. Torso/Pierna con pirámide de hops." }, isPro: true, program: JACKED_IN_3_TEMPLATE, order: 0 },
    { id: 'toji_fushiguro', name: 'toji_fushiguro', title: { en: "Toji (Natural Hypertrophy)", es: "Toji (Natural Hypertrophy)" }, description: { en: "4-Day Elite Split. Giant Sets, Neck, Forearms & Aesthetic focus.", es: "Rutina Élite de 4 Días. Series Gigantes, Cuello, Antebrazo y Estética." }, isPro: true, program: TOJI_TEMPLATE, order: 1 },
    {
        id: 'tokita',
        name: 'tokita',
        title: { en: "Tokita Ohma Program", es: "Programa Tokita Ohma" },
        description: { en: "4-Day Hybrid Split. High volume, supersets & functional strength.", es: "Rutina Híbrida 4 Días. Alto volumen, superseries y fuerza funcional." },
        isPro: false,
        program: TOKITA_TEMPLATE,
        order: 2,
        guidelineImages: Array.from({length: 8}, (_, i) => 
            `${ASSETS_BASE}/assets/templates/tokita/Tokita${i === 0 ? '' : `-${i+1}`}.png`
        )
    },
    { id: 'wizard', name: 'wizard', title: { en: "The Wizard v3 (Full Body)", es: "The Wizard v3 (Full Body)" }, description: { en: "3-Days Heavy/Light/Medium. Classic intensity cycling.", es: "3-Días Pesado/Liviano/Medio. Ciclo de intensidad clásico." }, isPro: true, program: WIZARD_TEMPLATE, order: 3 },
    { id: 'full_body', name: 'full_body', title: { en: "Aesthetic V-Taper", es: "Aesthetic V-Taper" }, description: { en: "Dr. Mike Style. Focus on V-Taper (Lats/Side Delts).", es: "Estilo Dr. Mike. Foco en V-Taper (Dorsal/Hombro Lateral)." }, isPro: true, program: FULL_BODY_TEMPLATE, order: 4 },
    { id: 'male_physique', name: 'male_physique', title: { en: "Male Physique (Upper/Lower)", es: "Male Physique (Torso/Pierna)" }, description: { en: "4-Days Bodybuilding Focus. Higher volume.", es: "4-Días Foco Culturismo. Mayor volumen." }, isPro: false, program: MALE_PHYSIQUE_TEMPLATE, order: 5 },
    { id: 'hyp_1', name: 'hyp_1', title: { en: "Base Hypertrophy 1", es: "Hipertrofia Base 1" }, description: { en: "Standard PPL. Balanced volume.", es: "PPL Estándar. Volumen equilibrado." }, isPro: false, program: DEFAULT_TEMPLATE, order: 6 },
    { id: 'hyp_2', name: 'hyp_2', title: { en: "Base Hypertrophy 2", es: "Hipertrofia Base 2" }, description: { en: "Upper/Lower Split (4 Days). Focus on basics.", es: "Torso/Pierna (4 Días). Foco en básicos." }, isPro: false, program: UPPER_LOWER_TEMPLATE, order: 7 },
    { id: 'metabolite', name: 'metabolite', title: { en: "Metabolite Phase", es: "Fase Metabolitos" }, description: { en: "High reps (20-30), short rests, the 'burn'.", es: "Reps altas (20-30), descanso corto, 'quemazón'." }, isPro: false, program: METABOLITE_TEMPLATE, order: 8 },
    { id: 'resensitization', name: 'resensitization', title: { en: "Resensitization", es: "Resensitization" }, description: { en: "Low volume, heavy weight to reset fatigue.", es: "Bajo volumen, peso alto para resetear fatiga." }, isPro: false, program: RESENS_TEMPLATE, order: 9 },
];

export const TRANSLATIONS = {
    en: {
        startMeso: "Start New Mesocycle",
        finishWorkout: "Finish Workout",
        finishConfirm: "Finish workout?",
        finishMesoTitle: "Complete Mesocycle?",
        finishMesoDesc: "You've completed the final week. Great work! Conclude the mesocycle now?",
        complete: "Complete",
        notYet: "Not Yet",
        cancel: "Cancel",
        delete: "Delete",
        skip: "Skip Exercise",
        skipDay: "Skip Workout",
        skipped: "Skipped",
        completed: "Completed",
        swap: "Swap Exercise",
        changeMuscle: "Change muscle",
        chooseMuscle: "Choose muscle",
        addSetBelow: "Add Set Below",
        deleteSet: "Delete Set",
        skipSet: "Skip Set",
        unskipSet: "Unskip Set",
        sets: "Set",
        weight: "Weight",
        reps: "Reps",
        rir: "RIR",
        log: "Log",
        note: "Range: 6-10",
        active: "Active",
        history: "History",
        settings: "Settings",
        volume: "Weekly Volume",
        workouts: "Recent Workouts",
        noData: "No data",
        duration: "Duration",
        exercises: "Exercises",
        configure: "Configure",
        week: "WEEK",
        massPhase: "Mass Phase",
        resting: "Resting",
        language: "Language",
        theme: "Theme",
        back: "Back",
        finishCycle: "Finish Cycle",
        confirmCycle: "Finish current mesocycle?",
        selectEx: "Select Exercise",
        searchPlaceholder: "Search...",
        createEx: "Create",
        noExFound: "No exercises found",
        keepScreen: "Keep Screen On",
        setType: "SET TYPE",
        mesoStats: "Mesocycle Stats",
        totalWorkouts: "Total Workouts",
        currentWeek: "Current Week",
        linkSuperset: "Link Superset",
        unlinkSuperset: "Unlink",
        selectToLink: "Select exercise to link...",
        superset: "SUPERSET",
        workoutComplete: "WORKOUT COMPLETE",
        goodJob: "Great job!",
        totalVolume: "Total Volume",
        totalSets: "Total Sets",
        totalReps: "Total Reps",
        share: "Share",
        close: "Save & Close",
        resume: "Resume Workout",
        backup: "Data Backup",
        export: "Export Data",
        import: "Import Data",
        importConfirm: "Overwrite data?",
        dataSaved: "Saved!",
        addSet: "Set",
        remSet: "Set",
        avtRound: "Round",
        addRound: "+ New Round",
        markFailure: "Failure",
        importPDF: "Import PDF",
        avtLabel: "AVT",
        delSlot: "Delete Slot",
        offline: "Local Mode",
        mesoAvg: "Meso Avg Volume",
        routineGuide: "Routine Guide",
        executionInfo: "Execution & Goals",
        resetSession: "Reset / Discard Session",
        discardSession: "Discard Session",
        discardConfirm: "Discard current session data? This cannot be undone.",
        types: { regular: "Regular", myorep: "Myorep", myorep_match: "Myorep Match", cluster: "Cluster", top: "Top Set", backoff: "Back-off Set", giant: "Giant Set", warmup: "Warmup" },
        typeDesc: { regular: "Standard straight set", myorep: "Activation set + mini-sets (short rest)", myorep_match: "Match reps of previous set", cluster: "Intra-set rest periods", top: "Heaviest set (High Intensity)", backoff: "Volume work after Top Set", giant: "High reps to failure (Metabolite)", warmup: "Low fatigue preparation" },
        muscle: { CHEST: "Chest", BACK: "Back", QUADS: "Quads", HAMSTRINGS: "Hamstrings", GLUTES: "Glutes", CALVES: "Calves", SHOULDERS: "Shoulders", BICEPS: "Biceps", TRICEPS: "Triceps", TRAPS: "Traps", ABS: "Abs", FOREARMS: "Forearms", NECK: "Neck", CARDIO: "Cardio" },
        rp: "IronCoach Progression",
        rpEnabled: "IronCoach Suggestions",
        rpTargetRIR: "Target RIR",
        rpFeedbackTitle: "Muscle Feedback",
        rpRatingHelp: "Rate to auto-regulate volume (RP Logic)",
        rpSave: "Save feedback",
        rpSuggestion: "Suggested",
        rpNoSuggestion: "No suggestion",
        editTemplate: "Edit Program",
        resetTemplate: "Reset to Default",
        editDay: "Edit Day",
        addDay: "Add Day",
        addSlot: "Add Exercise Slot",
        save: "Save",
        swapTitle: "Swap Exercise",
        swapMsg: "How do you want to apply this change?",
        swapSession: "This Session Only",
        swapForever: "Update Plan (Forever)",
        programEditor: "Program Editor",
        selectExBtn: "Select Exercise",
        any: "Any",
        manageEx: "Manage Exercises",
        addEx: "Add New Exercise",
        exName: "Exercise Name",
        selectMuscle: "Select Muscle",
        deleteConfirm: "Delete this exercise?",
        setsCount: "Sets",
        notes: "Notes",
        addNote: "Add Note...",
        volumeStatus: { low: "Low", maintenance: "Maint.", optimal: "Optimal", high: "High" },
        showRIR: "Show RIR Column",
        install: "Install App",
        unitToggle: "Weight Unit",
        addExercise: "Add Exercise",
        updateTemplate: "Update Routine Template",
        selectMuscleToAdd: "Select Muscle to Add",
        appearance: "Appearance",
        database: "Database",
        dangerZone: "Danger Zone",
        factoryReset: "Factory Reset App",
        workoutConfig: "Workout Config",
        completeWeek: "Complete Week",
        completeWeekConfirm: "Advance to the next week of your mesocycle?",
        more: "...and {0} more",
        autoRegulate: "Auto-regulate volume?",
        autoRegulateDesc: "IronCoach will adjust volume based on your feedback.",
        applyingChanges: "Applying IronCoach Changes:",
        setsAdded: "sets added",
        setsRemoved: "sets removed",
        noChanges: "No volume changes needed.",
        finishMesoConfirm: "Finish this mesocycle? This will archive your current progress and let you start a fresh cycle.",
        deleteDataConfirm: "Delete ALL data? This cannot be undone.",
        importSuccess: "Import successful!",
        invalidFile: "Invalid file format",
        day: "Day",
        replaceEx: "Replace Exercise",
        removeEx: "Remove Exercise",
        moveUp: "Move Up",
        moveDown: "Move Down",
        emptyWorkoutTitle: "Empty Workout?",
        emptyWorkoutMsg: "You haven't completed any sets yet. Are you sure?",
        completedSetsMsg: "You've completed {0} sets. Save progress?",
        confirmRemoveEx: "Remove this exercise from current session?",
        volPerCycle: "Avg. Weekly Volume",
        avgDuration: "Duration",
        addSetBtn: "ADD SET",
        removeSetBtn: "REMOVE SET",
        prev: "Prev",
        target: "TARGET",
        warmup: "Smart Warmup",
        warmupTitle: "Warmup Protocol",
        potentiation: "Potentiation",
        workingWeight: "Working Weight",
        warmupSets: { light: "Light", moderate: "Moderate", potentiation: "Potentiation" },
        mesoConfig: "Mesocycle Settings",
        targetWeeks: "Planned Duration",
        weeks: "Weeks",
        deloadMode: "Deload Mode",
        deloadDesc: "Reduces volume (50%) for recovery.",
        enableDeload: "Enable Deload",
        skipDayConfirm: "Skip this workout? It will be marked as skipped.",
        mesoName: "Mesocycle Name",
        exportReport: "Export Report & Finish",
        justFinish: "Just Finish",
        mesoNotes: "General Notes",
        mesoNotesPlaceholder: "Write down your cycle focus, goals or reminders...",
        mesoType: "Phase Type",
        phases: { hyp_1: "Base Hypertrophy 1", hyp_2: "Base Hypertrophy 2", metabolite: "Metabolite Phase", resensitization: "Resensitization", full_body: "Aesthetic V-Taper", wizard: "The Wizard v3 (Full Body)", male_physique: "Male Physique (Upper/Lower)", toji_fushiguro: "Toji (Natural Hypertrophy)", tokita: "Tokita Ohma Program", jacked_in_3: "Jacked in 3 — Paul Carter" },
        phaseDesc: { hyp_1: "Standard PPL. Balanced volume.", hyp_2: "Upper/Lower Split (4 Days). Focus on basics.", metabolite: "High reps (20-30), short rests, the 'burn'.", resensitization: "Low volume, heavy weight to reset fatigue.", full_body: "Dr. Mike Style. Focus on V-Taper (Lats/Side Delts).", wizard: "3-Days Heavy/Light/Medium. Classic intensity cycling for steady gains.", male_physique: "4-Days Bodybuilding Focus. Higher volume, arm & shoulder specialization.", toji_fushiguro: "4-Day Elite Split. Giant Sets, Neck, Forearms & Aesthetic focus. (Pro)", tokita: "4-Day Hybrid Split. High volume, supersets, and functional strength focus.", jacked_in_3: "Accumulative Volume Training (AVT). 3 days per week. Upper/Lower with ascending pyramid of hops." },

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
            tiers: {
                monthly:  { label: 'Monthly',  price: 'USD 4.99 / month' },
                yearly:   { label: 'Annual',   price: 'USD 39.99 / year' },
                lifetime: { label: 'Lifetime', price: 'USD 99.99 one-time' },
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

        targetRIR: "Target RIR",
        recoveryWeek: "Recovery Week",
        focusMode: "Focus Mode",
        repsRange: "Reps Range",
        startNow: "Start Cycle Now",
        setupCycle: "Setup & Start Cycle",
        saveAsMeso: "Use this program to create a new active mesocycle immediately.",
        units: { kg: "KG", pl: "Plates", lb: "LBS", toggle: "Change Unit (KG/Plates)", plateWeight: "Weight per Plate", setPlateWeight: "Set Weight per Plate (kg)", enterWeight: "e.g. 5, 10..." },
        fb: { sorenessLabel: "Soreness / Recovery", performanceLabel: "Pump / Capacity", soreness: { 1: "Healed Early / Fresh", 2: "Healed on Time (Ideal)", 3: "Still Sore / Ouch" }, performance: { 1: "Bad / Grind", 2: "Good / Target", 3: "Great / Too Easy" }, adjust: { add: "+1/2 Sets", sub: "-1 Set", keep: "Keep (Optimal)" } },
        onb: { skip: "Skip", next: "Next", start: "Start", s1_title: "Welcome to IronLog", s1_desc: "The ultimate hypertrophy tool, powered by IronCoach.", s2_title: "Mesocycles", s2_desc: "Organize your training by weeks. IronCoach auto-regulates volume based on your feedback.", s3_title: "Smart Tracking", s3_desc: "Log RIR, use the built-in timer, and calculate warmups instantly.", s4_title: "Progress", s4_desc: "Visualize your volume landmarks (MEV/MRV) and ensure progressive overload." },
        createAndSelect: "Create and Select",
        overwriteTemplateConfirm: "This overwrites your current routine with the selected template.",
        newRecord: "New Record!",
        prMessage: "You beat your previous bests!",
        continue: "Continue",
        updateRoutine: "Update Routine Template?",
        updateRoutineDesc: "Save exercises, order, and sets for future workouts.",

        // Setup Wizard
        wizard: {
            manual: "Manual Setup",
            skip: "Skip / Manual",
            generating: "Generating your plan...",
            steps: { exp: "Experience", freq: "Frequency", goal: "Goal", time: "Availability", result: "Your Plan" },
            expOptions: { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" },
            expDesc: { 
                beginner: "0-1 years of serious training. Focus on form and consistency.",
                intermediate: "1-3 years. Familiar with RPE and compound lifting.",
                advanced: "3+ years. High volume requirements and advanced recovery needs."
            },
            expNote: "IronCoach will adjust initial volume based on your training age.",
            goalOptions: { hypertrophy: "Hypertrophy", strength: "Strength", endurance: "Endurance" },
            goalDesc: {
                hypertrophy: "Maximize muscle size and body composition.",
                strength: "Maximize 1RM on core lifts (Squat, Bench, Deadlift).",
                endurance: "Build work capacity and cardiovascular fitness."
            },
            timeOptions: { short: "Quick (45m)", medium: "Standard (75m)", long: "Extended (100m+)" },
            apply: "Apply & Start Program",
            adjusted: "Plan adjusted to fit your schedule.",
            reason: {
                freq: "Optimal frequency for your experience level.",
                time: "Exercise selection optimized for session length.",
                goal: "Rep ranges and movement patterns aligned with your goal."
            }
        },

        // Landing Page
        landing: {
            login: "Sign In",
            title: "Train",
            titleAccent: "Smarter",
            titleSuffix: "",
            subtitle: "The professional training log for serious athletes. Track every set, rep, and RPE with precision.",
            getStarted: "Get Started Free",
            featuresTitle: "Why IronLog?",
            appVersion: "v4.1 Professional",
            socialProof: "+2,400 athletes tracking progress",
            features: [
                { title: "Smart Tracking", desc: "Predictive RPE and volume tracking designed for hypertrophy.", icon: "Zap" },
                { title: "IronCoach AI", desc: "Real-time volume adjustments based on your recovery.", icon: "Activity" },
                { title: "100% Secure", desc: "Private data sync across all your devices.", icon: "Shield" },
                { title: "Offline First", desc: "Works deep in the gym with zero internet connection.", icon: "Cloud" }
            ]
        },

        // Auth
        auth: {
            signIn: "Sign In",
            register: "Create Account",
            email: "Email Address",
            password: "Password",
            confirmPassword: "Confirm Password",
            passwordMismatch: "Passwords do not match",
            name: "Full Name",
            forgotPassword: "Forgot password?",
            resetSent: "Password reset link sent!",
            startDemo: "Try 7 Days Free",
            continueGuest: "Continue as Guest",
            guestNote: "Workouts will be saved locally on this device.",
            noAccount: "Don't have an account?",
            hasAccount: "Already have an account?",
            signUpBtn: "Sign up",
            signInBtn: "Sign in",
            processing: "Please wait...",
            or: "OR",
            syncNote: "Create an account to sync your data across devices and never lose your progress.",
            logout: "Log Out",
            guestUser: "Guest User",
            localStorage: "Local Storage Only",
            proMember: "Pro Member",
            signInRegister: "Sign In or Register"
        },

        // NEW: PWA Install
        installApp: "Install App",
        installDesc: "Install IronLog on your home screen for quick access and full offline support.",
        installBtn: "Install Now",
        iosInstall: "iOS: Share → Add to Home Screen",
        androidInstall: "Android: Menu → Install App",

        // Timer Notifications
        timer: {
            finished: "Rest Finished!",
            getBack: "Get back to work!"
        },

        // Profile
        profile: {
            stats: "Body Stats",
            bw: "Body Weight",
            height: "Height",
            bf: "Body Fat %",
            isBW: "Bodyweight Exercise"
        },

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
                { title: "Routine Guidelines (Pro)", text: "Tap here to view the detailed philosophy, infographics, and guides for your current program." },
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
            ],
            mesoSettings: [
                { title: "Duration", text: "Plan how long this cycle will last. 4-6 weeks is typical for hypertrophy." },
                { title: "Deload Mode", text: "Feeling fried? Enable this to reduce volume for a week to recover." },
                { title: "Routine Editor", text: "Need to change exercises or days? Jump to the editor from here." },
                { title: "Notes", text: "Keep reminders, focus points, or goals for this specific cycle here." }
            ]
        }
    },
    es: {
        startMeso: "Nuevo Mesociclo",
        finishWorkout: "Terminar",
        finishConfirm: "¿Terminar entreno?",
        finishMesoTitle: "¿Completar Mesociclo?",
        finishMesoDesc: "Has completado la última semana. ¡Gran trabajo! ¿Concluir el mesociclo ahora?",
        complete: "Completar",
        notYet: "Aún No",
        cancel: "Cancelar",
        delete: "Eliminar",
        skip: "Omitir Ejercicio",
        skipDay: "Saltar Día",
        skipped: "Saltado",
        completed: "Completado",
        swap: "Cambiar Ejercicio",
        changeMuscle: "Cambiar Músculo",
        chooseMuscle: "Elegir Músculo",
        addSetBelow: "Añadir Serie",
        deleteSet: "Borrar Serie",
        skipSet: "Saltar Serie",
        unskipSet: "Restaurar Serie",
        sets: "Series",
        weight: "Peso",
        reps: "Reps",
        rir: "RIR",
        log: "Log",
        note: "Rango: 6-10",
        active: "Activo",
        history: "Historial",
        settings: "Ajustes",
        volume: "Volumen Semanal",
        workouts: "Entrenos Recientes",
        noData: "Sin datos",
        duration: "Duración",
        exercises: "Ejercicios",
        configure: "Configurar",
        week: "SEMANA",
        massPhase: "Fase de Volumen",
        resting: "Descansando",
        language: "Idioma",
        theme: "Tema",
        back: "Atrás",
        finishCycle: "Terminar Ciclo",
        confirmCycle: "¿Terminar mesociclo actual?",
        selectEx: "Seleccionar Ejercicio",
        searchPlaceholder: "Buscar...",
        createEx: "Crear",
        noExFound: "No se encontraron ejercicios",
        keepScreen: "Pantalla Encendida",
        setType: "TIPO DE SERIE",
        mesoStats: "Estadísticas Meso",
        totalWorkouts: "Entrenos Totales",
        currentWeek: "Semana Actual",
        linkSuperset: "Vincular Superserie",
        unlinkSuperset: "Desvincular",
        selectToLink: "Selecciona ejercicio a vincular...",
        superset: "SUPERSERIE",
        workoutComplete: "ENTRENO COMPLETADO",
        goodJob: "¡Buen trabajo!",
        totalVolume: "Volumen Total",
        totalSets: "Series Totales",
        totalReps: "Reps Totales",
        share: "Compartir",
        close: "Guardar y Cerrar",
        resume: "Reanudar",
        backup: "Copia de Seguridad",
        export: "Exportar Datos",
        import: "Importar Datos",
        importConfirm: "¿Sobrescribir datos?",
        dataSaved: "¡Guardado!",
        addSet: "Serie",
        remSet: "Serie",
        avtRound: "Round",
        addRound: "+ Nuevo Round",
        markFailure: "Fallo",
        importPDF: "Importar PDF",
        avtLabel: "AVT",
        delSlot: "Borrar Slot",
        offline: "Modo Local",
        mesoAvg: "Vol. Promedio Meso",
        routineGuide: "Guía de Rutina",
        executionInfo: "Ejecución y Objetivos",
        resetSession: "Reiniciar / Descartar Sesión",
        discardSession: "Descartar Sesión",
        discardConfirm: "¿Descartar datos de la sesión actual? No se puede deshacer.",
        types: { regular: "Normal", myorep: "Myo-rep", myorep_match: "Myorep Match", cluster: "Cluster", top: "Serie Top", backoff: "Serie Back-off", giant: "Serie Gigante", warmup: "Calentamiento" },
        typeDesc: { regular: "Serie normal estándar", myorep: "Activación + mini-series (descanso corto)", myorep_match: "Igualar reps de serie anterior", cluster: "Descansos intra-serie", top: "Serie más pesada (Alta Intensidad)", backoff: "Trabajo de volumen tras Top Set", giant: "Reps altas al fallo (Metabolitos)", warmup: "Preparación baja fatiga" },
        muscle: { CHEST: "Pecho", BACK: "Espalda", QUADS: "Cuádriceps", HAMSTRINGS: "Isquios", GLUTES: "Glúteos", CALVES: "Gemelos", SHOULDERS: "Hombros", BICEPS: "Bíceps", TRICEPS: "Tríceps", TRAPS: "Trapecios", ABS: "Abdominales", FOREARMS: "Antebrazos", NECK: "Cuello", CARDIO: "Cardio" },
        rp: "Progresión IronCoach",
        rpEnabled: "Sugerencias IronCoach",
        rpTargetRIR: "RIR Objetivo",
        rpFeedbackTitle: "Feedback Muscular",
        rpRatingHelp: "Valora para auto-regular volumen (Lógica RP)",
        rpSave: "Guardar feedback",
        rpSuggestion: "Sugerido",
        rpNoSuggestion: "Sin sugerencia",
        editTemplate: "Editar Programa",
        resetTemplate: "Restaurar Predeterminado",
        editDay: "Editar Día",
        addDay: "Añadir Día",
        addSlot: "Añadir Slot",
        save: "Guardar",
        swapTitle: "Cambiar Ejercicio",
        swapMsg: "¿Cómo quieres aplicar el cambio?",
        swapSession: "Solo esta sesión",
        swapForever: "Actualizar Plan (Siempre)",
        programEditor: "Editor de Programa",
        selectExBtn: "Seleccionar Ejercicio",
        any: "Cualquiera",
        manageEx: "Gestionar Ejercicios",
        addEx: "Nuevo Ejercicio",
        exName: "Nombre",
        selectMuscle: "Músculo",
        deleteConfirm: "¿Eliminar este ejercicio?",
        setsCount: "Series",
        notes: "Notas",
        addNote: "Nota...",
        volumeStatus: { low: "Bajo", maintenance: "Mant.", optimal: "Óptimo", high: "Alto" },
        showRIR: "Mostrar Columna RIR",
        install: "Instalar App",
        unitToggle: "Unidad de Peso",
        addExercise: "Añadir Ejercicio",
        updateTemplate: "Actualizar Plantilla",
        selectMuscleToAdd: "Selecciona Músculo",
        appearance: "Apariencia",
        database: "Base de Datos",
        dangerZone: "Zona Peligrosa",
        factoryReset: "Restablecer Fábrica",
        workoutConfig: "Configuración Entreno",
        completeWeek: "Completar Semana",
        completeWeekConfirm: "¿Avanzar a la siguiente semana de tu mesociclo?",
        more: "...y {0} más",
        autoRegulate: "¿Auto-regular volumen?",
        autoRegulateDesc: "IronCoach ajustará el volumen según tu feedback.",
        applyingChanges: "Aplicando Cambios IronCoach:",
        setsAdded: "series añadidas",
        setsRemoved: "series eliminadas",
        noChanges: "Sin cambios de volumen.",
        finishMesoConfirm: "¿Terminar este mesociclo? Esto archivará tu progreso y podrás iniciar uno nuevo.",
        deleteDataConfirm: "¿Borrar TODOS los datos? No se puede deshacer.",
        importSuccess: "¡Importación exitosa!",
        invalidFile: "Archivo inválido",
        day: "Día",
        replaceEx: "Reemplazar",
        removeEx: "Quitar",
        moveUp: "Subir",
        moveDown: "Bajar",
        emptyWorkoutTitle: "¿Entreno Vacío?",
        emptyWorkoutMsg: "No has completado ninguna serie. ¿Seguro?",
        completedSetsMsg: "Has completado {0} series. ¿Guardar?",
        confirmRemoveEx: "¿Quitar este ejercicio de la sesión?",
        volPerCycle: "Vol. Semanal Promedio",
        avgDuration: "Duración",
        addSetBtn: "AÑADIR SERIE",
        removeSetBtn: "QUITAR SERIE",
        prev: "Ant",
        target: "OBJ",
        warmup: "Calentamiento Inteligente",
        warmupTitle: "Protocolo Calentamiento",
        potentiation: "Potenciación",
        workingWeight: "Peso de Trabajo",
        warmupSets: { light: "Ligera", moderate: "Moderada", potentiation: "Potenciación" },
        mesoConfig: "Ajustes Mesociclo",
        targetWeeks: "Duración Planeada",
        weeks: "Semanas",
        deloadMode: "Modo Descarga",
        deloadDesc: "Reduce volumen (50%) para recuperación.",
        enableDeload: "Activar Descarga",
        skipDayConfirm: "¿Saltar este entreno? Se marcará como saltado.",
        mesoName: "Nombre Mesociclo",
        exportReport: "Exportar Informe y Terminar",
        justFinish: "Solo Terminar",
        mesoNotes: "Notas Generales",
        mesoNotesPlaceholder: "Escribe tus objetivos, focos o recordatorios para este ciclo...",
        mesoType: "Tipo de Fase",
        phases: { hyp_1: "Hipertrofia Base 1", hyp_2: "Hipertrofia Base 2", metabolite: "Fase Metabolitos", resensitization: "Resensitization", full_body: "Aesthetic V-Taper", wizard: "The Wizard v3 (Full Body)", male_physique: "Male Physique (Torso/Pierna)", toji_fushiguro: "Toji (Natural Hypertrophy)", tokita: "Tokita Ohma Program", jacked_in_3: "Jacked in 3 — Paul Carter" },
        phaseDesc: { hyp_1: "Hipertrofia Base 1", hyp_2: "Torso/Pierna (4 Días). Foco en básicos.", metabolite: "Reps altas (20-30), descanso corto, 'quemazón'.", resensitization: "Bajo volumen, peso alto para resetear fatiga.", full_body: "Estilo Dr. Mike. Foco en V-Taper (Dorsal/Hombro Lateral).", wizard: "3-Días Pesado/Liviano/Medio. Ciclo de intensidad clásico para ganancias constantes.", male_physique: "4-Días Foco Culturismo. Mayor volumen, especialización en brazos y hombros.", toji_fushiguro: "Rutina Élite de 4 Días. Series Gigantes, Cuello, Antebrazo y Estética. (Pro)", tokita: "Rutina Híbrida 4 Días. Alto volumen, superseries y fuerza funcional.", jacked_in_3: "Accumulative Volume Training (AVT). 3 días por semana. Torso/Pierna con pirámide ascendente de hops." },

        // PAYWALL & PRO
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
            tiers: {
                monthly:  { label: 'Mensual',  price: 'USD 4.99 / mes' },
                yearly:   { label: 'Anual',    price: 'USD 39.99 / año' },
                lifetime: { label: 'De por vida', price: 'USD 99.99 único pago' },
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

        targetRIR: "RIR Objetivo",
        recoveryWeek: "Semana Recuperación",
        focusMode: "Modo Foco",
        repsRange: "Rango Reps",
        startNow: "Empezar Ciclo",
        setupCycle: "Configurar y Empezar",
        saveAsMeso: "Usar este programa para crear un nuevo mesociclo activo.",
        units: { kg: "KG", pl: "Planchas", lb: "LBS", toggle: "Cambiar Unidad (KG/Planchas)", plateWeight: "Peso por Plancha", setPlateWeight: "Fijar Peso Plancha (kg)", enterWeight: "ej. 5, 10..." },
        fb: { sorenessLabel: "Agujetas / Recuperación", performanceLabel: "Bombeo / Capacidad", soreness: { 1: "Recuperado Antes / Fresco", 2: "Recuperado a Tiempo (Ideal)", 3: "Aún con Agujetas / Dolor" }, performance: { 1: "Mal / Forzado", 2: "Bien / Objetivo", 3: "Genial / Demasiado Fácil" }, adjust: { add: "+1/2 Series", sub: "-1 Serie", keep: "Mantener (Óptimo)" } },
        onb: { skip: "Omitir", next: "Siguiente", start: "Empezar", s1_title: "Bienvenido a IronLog", s1_desc: "La herramienta definitiva para hipertrofia, impulsada por IronCoach.", s2_title: "Mesociclos", s2_desc: "Organiza tu entreno por semanas. IronCoach auto-regula el volumen según tu feedback.", s3_title: "Seguimiento Inteligente", s3_desc: "Registra RIR, usa el temporizador integrado y calcula el calentamiento al instante.", s4_title: "Progreso", s4_desc: "Visualiza tus hitos de volumen (MEV/MRV) y asegura la sobrecarga progresiva." },
        createAndSelect: "Crear y Seleccionar",
        overwriteTemplateConfirm: "Esto sobrescribe tu rutina actual con la plantilla seleccionada.",
        newRecord: "¡Nuevo Récord!",
        prMessage: "¡Superaste tus marcas anteriores!",
        continue: "Continuar",
        updateRoutine: "¿Actualizar Plantilla?",
        updateRoutineDesc: "Guardar ejercicios, orden y series para futuros entrenos.",

        // Setup Wizard
        wizard: {
            manual: "Configuración Manual",
            skip: "Saltar / Manual",
            generating: "Generando tu plan...",
            steps: { exp: "Experiencia", freq: "Frecuencia", goal: "Objetivo", time: "Tiempo", result: "Tu Plan" },
            expOptions: { beginner: "Principiante", intermediate: "Intermedio", advanced: "Avanzado" },
            expDesc: { 
                beginner: "0-1 años de entrenamiento serio. Enfoque en técnica y consistencia.",
                intermediate: "1-3 años. Familiarizado con RPE y levantamientos compuestos.",
                advanced: "3+ años. Requerimientos de volumen alto y necesidades de recuperación avanzada."
            },
            expNote: "IronCoach ajustará el volumen inicial según tu antigüedad de entrenamiento.",
            goalOptions: { hypertrophy: "Hipertrofia", strength: "Fuerza", endurance: "Resistencia" },
            goalDesc: {
                hypertrophy: "Maximiza el tamaño muscular y la composición corporal.",
                strength: "Maximiza tu 1RM en ejercicios básicos (Squat, Bench, Deadlift).",
                endurance: "Mejora capacidad de trabajo y condición cardiovascular."
            },
            timeOptions: { short: "Rápido (45m)", medium: "Estándar (75m)", long: "Extendido (100m+)" },
            apply: "Aplicar y Empezar Programa",
            adjusted: "Plan ajustado a tu disponibilidad horaria.",
            reason: {
                freq: "Frecuencia óptima para tu nivel de experiencia.",
                time: "Selección de ejercicios optimizada para la duración de la sesión.",
                goal: "Rangos de repeticiones y patrones de movimiento alineados con tu meta."
            }
        },

        // Landing Page
        landing: {
            login: "Entrar",
            title: "Entrena con",
            titleAccent: "Inteligencia",
            titleSuffix: "",
            subtitle: "El diario de entrenamiento profesional para atletas serios. Registra cada serie, rep y RPE con precisión.",
            getStarted: "Empezar Gratis",
            featuresTitle: "¿Por qué IronLog?",
            appVersion: "v4.1 Professional",
            socialProof: "+2,400 atletas registrando sus progresos",
            features: [
                { title: "Seguimiento Inteligente", desc: "RPE predictivo y control de volumen diseñado para hipertrofia.", icon: "Zap" },
                { title: "IronCoach AI", desc: "Ajustes de volumen en tiempo real basados en tu recuperación.", icon: "Activity" },
                { title: "100% Seguro", desc: "Sincronización privada de datos en todos tus dispositivos.", icon: "Shield" },
                { title: "Offline First", desc: "Funciona perfectamente en el gimnasio sin conexión a internet.", icon: "Cloud" }
            ]
        },

        // Auth
        auth: {
            signIn: "Iniciar Sesión",
            register: "Crear Cuenta",
            email: "Correo Electrónico",
            password: "Contraseña",
            confirmPassword: "Confirmar Contraseña",
            passwordMismatch: "Las contraseñas no coinciden",
            name: "Nombre Completo",
            forgotPassword: "¿Olvidaste tu contraseña?",
            resetSent: "¡Enlace de recuperación enviado!",
            startDemo: "Prueba 7 Días Pro",
            continueGuest: "Continuar como Invitado",
            guestNote: "Los entrenamientos se guardarán localmente en este dispositivo.",
            noAccount: "¿No tienes una cuenta?",
            hasAccount: "¿Ya tienes una cuenta?",
            signUpBtn: "Regístrate",
            signInBtn: "Inicia Sesión",
            processing: "Procesando...",
            or: "O",
            syncNote: "Crea una cuenta para sincronizar tus datos entre dispositivos y nunca perder tu progreso.",
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

        // Timer Notifications
        timer: {
            finished: "¡Descanso Terminado!",
            getBack: "¡A trabajar!"
        },

        // Profile
        profile: {
            stats: "Datos Corporales",
            bw: "Peso Corporal",
            height: "Altura",
            bf: "Grasa Corporal %",
            isBW: "Ejercicio de Peso Corporal"
        },

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
                { title: "Guías de Rutina (Pro)", text: "Toca aquí para ver la filosofía detallada, infografías y guías de tu programa actual." },
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
            ],
            mesoSettings: [
                { title: "Duración", text: "Planifica cuánto durará este ciclo. 4-6 semanas es típico para hipertrofia." },
                { title: "Modo Descarga", text: "¿Te sientes agotado? Activa esto para reducir el volumen una semana y recuperar." },
                { title: "Editor de Rutina", text: "¿Necesitas cambiar ejercicios o días? Salta al editor desde aquí." },
                { title: "Notas", text: "Guarda recordatorios, puntos de enfoque o metas para este ciclo aquí." }
            ]
        }
    }
};