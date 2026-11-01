import { ProgramDay, GlobalTemplate, MuscleGroup } from '../types';

const ASSETS_BASE = (import.meta as any).env?.VITE_ASSETS_BASE || '';

export const RP_GUIDELINE_IMAGES: string[] = Array.from(
    { length: 18 },
    (_, i) => `${ASSETS_BASE}/assets/templates/rp/rp_guide_${String(i + 1).padStart(2, '0')}.png`
);

export const RP_FB_3X_PROGRAM: ProgramDay[] = [
    {
        id: 'rp_fb_3x_d1',
        dayName: { en: 'Day 1: Push Emphasis', es: 'Día 1: Énfasis en Empuje' },
        slots: [
            { muscle: 'CHEST' as MuscleGroup, setTarget: 3, exerciseId: 'bp_bar', reps: '8-12', notes: 'Horizontal Push (Bench / DB / Machine Press) — Empuje Horizontal (Banca Plana / Mancuerna / Máquina)' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 3, exerciseId: 'pec_fly', reps: '8-12', notes: 'Chest Isolation or Triceps — Aislamiento Pecho o Tríceps' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 3, exerciseId: 'bp_inc_bar', reps: '8-12', notes: 'Incline Push (Barbell / DB / Machine) — Empuje Inclinado (Barra / Mancuerna / Máquina)' },
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 3, exerciseId: 'lat_raise', reps: '8-12', notes: 'Side Delts (Lateral Raises / Upright Row) — Deltoide Lateral (Elevaciones Laterales / Remo al Cuello)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 3, exerciseId: 'lat_pull', reps: '8-12', notes: 'Vertical Pull (Pulldowns / Pullups / Chinups) — Tracción Vertical (Jalones / Dominadas)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 3, exerciseId: 'bent_barbell_row', reps: '8-12', notes: 'Horizontal Pull (Barbell / DB / Cable Row) — Tracción Horizontal (Remo Barra / Mancuerna / Polea)' },
            { muscle: 'HAMSTRINGS' as MuscleGroup, setTarget: 2, exerciseId: 'leg_curl', reps: '8-12', notes: 'Hamstring Isolation (Seated/Lying Leg Curl) — Isquios Aislamiento (Curl Femoral Sentado/Tumbado)' },
            { muscle: 'QUADS' as MuscleGroup, setTarget: 2, exerciseId: 'sq_bar', reps: '8-12', notes: 'Quads (Squat / Leg Press / Hack) — Cuádriceps (Sentadilla / Prensa / Hack)' },
        ]
    },
    {
        id: 'rp_fb_3x_d2',
        dayName: { en: 'Day 2: Legs Emphasis', es: 'Día 2: Énfasis en Piernas' },
        slots: [
            { muscle: 'QUADS' as MuscleGroup, setTarget: 3, exerciseId: 'sq_bar', reps: '8-12', notes: 'Quads (Squat / Leg Press / Hack) — Cuádriceps (Sentadilla / Prensa / Hack)' },
            { muscle: 'QUADS' as MuscleGroup, setTarget: 3, exerciseId: 'sq_bar', reps: '8-12', notes: 'Quads (Squat / Leg Press / Hack) — Cuádriceps (Sentadilla / Prensa / Hack)' },
            { muscle: 'HAMSTRINGS' as MuscleGroup, setTarget: 3, exerciseId: 'rdl', reps: '8-12', notes: 'Hamstring Hinge (RDL / SLDL / Good Morning) — Isquios Bisagra (RDL / Piernas Rígidas / Buenos Días)' },
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 3, exerciseId: 'lat_raise', reps: '8-12', notes: 'Side Delts (Lateral Raises / Upright Row) — Deltoide Lateral (Elevaciones Laterales / Remo al Cuello)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 3, exerciseId: 'lat_pull', reps: '8-12', notes: 'Vertical Pull (Pulldowns / Pullups / Chinups) — Tracción Vertical (Jalones / Dominadas)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 3, exerciseId: 'bent_barbell_row', reps: '8-12', notes: 'Horizontal Pull (Barbell / DB / Cable Row) — Tracción Horizontal (Remo Barra / Mancuerna / Polea)' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 2, exerciseId: 'bp_inc_bar', reps: '8-12', notes: 'Incline Push (Barbell / DB / Machine) — Empuje Inclinado (Barra / Mancuerna / Máquina)' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 2, exerciseId: 'bp_bar', reps: '8-12', notes: 'Horizontal Push (Bench / DB / Machine Press) — Empuje Horizontal (Banca Plana / Mancuerna / Máquina)' },
        ]
    },
    {
        id: 'rp_fb_3x_d3',
        dayName: { en: 'Day 3: Pull Emphasis', es: 'Día 3: Énfasis en Tracción / Espalda' },
        slots: [
            { muscle: 'BACK' as MuscleGroup, setTarget: 3, exerciseId: 'lat_pull', reps: '8-12', notes: 'Vertical Pull (Pulldowns / Pullups / Chinups) — Tracción Vertical (Jalones / Dominadas)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 3, exerciseId: 'bent_barbell_row', reps: '8-12', notes: 'Horizontal Pull (Barbell / DB / Cable Row) — Tracción Horizontal (Remo Barra / Mancuerna / Polea)' },
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 3, exerciseId: 'rear_delt_fly', reps: '8-12', notes: 'Rear or Side Delts — Deltoide Posterior o Lateral' },
            { muscle: 'BICEPS' as MuscleGroup, setTarget: 3, exerciseId: 'curl_bar', reps: '8-12', notes: 'Biceps (Barbell / DB / Cable Curl) — Bíceps (Curl Barra / Mancuerna / Polea)' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 3, exerciseId: 'bp_bar', reps: '8-12', notes: 'Horizontal Push (Bench / DB / Machine Press) — Empuje Horizontal (Banca Plana / Mancuerna / Máquina)' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 3, exerciseId: 'bp_inc_bar', reps: '8-12', notes: 'Incline Push (Barbell / DB / Machine) — Empuje Inclinado (Barra / Mancuerna / Máquina)' },
            { muscle: 'GLUTES' as MuscleGroup, setTarget: 2, exerciseId: 'glute_bridge', reps: '8-12', notes: 'Glutes (Bridge / Lunge / Sumo DL) — Glúteos (Puente / Zancadas / Peso Muerto Sumo)' },
            { muscle: 'HAMSTRINGS' as MuscleGroup, setTarget: 2, exerciseId: 'leg_curl', reps: '8-12', notes: 'Hamstring Isolation (Seated/Lying Leg Curl) — Isquios Aislamiento (Curl Femoral Sentado/Tumbado)' },
        ]
    },
];

export const RP_FB_3X_TEMPLATE: GlobalTemplate = {
    id: 'rp_fb_3x',
    name: 'rp_fb_3x',
    title: { en: 'RP MPT Full Body (3 Days)', es: 'RP MPT Cuerpo Completo (3 Días)' },
    description: {
        en: 'Official Renaissance Periodization 3-day full body rotation. Alternates Push, Legs, and Pull emphasis with scientific MEV volume landmarks.',
        es: 'Rutina oficial Renaissance Periodization de cuerpo completo en 3 días. Alterna énfasis en Empuje, Piernas y Tirón con volumen MEV optimizado.'
    },
    isPro: false,
    order: 20,
    guidelineImages: RP_GUIDELINE_IMAGES,
    program: RP_FB_3X_PROGRAM
};

export const RP_FB_5X_PROGRAM: ProgramDay[] = [
    {
        id: 'rp_fb_5x_d1',
        dayName: { en: 'Day 1: Chest Upper', es: 'Día 1: Pecho y Tren Superior' },
        slots: [
            { muscle: 'CHEST' as MuscleGroup, setTarget: 2, exerciseId: 'bp_inc_bar', reps: '8-12', notes: 'Incline Push (Barbell / DB / Machine) — Empuje Inclinado (Barra / Mancuerna / Máquina)' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 2, exerciseId: 'pec_fly', reps: '8-12', notes: 'Chest Isolation (Pec Dec / Cable Flye / DB Flye) — Aislamiento Pecho (Pec Dec / Aperturas Polea)' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 2, exerciseId: 'bp_bar', reps: '8-12', notes: 'Horizontal Push (Bench / DB / Machine Press) — Empuje Horizontal (Banca Plana / Mancuerna / Máquina)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 2, exerciseId: 'bent_barbell_row', reps: '8-12', notes: 'Horizontal Pull (Barbell / DB / Cable Row) — Tracción Horizontal (Remo Barra / Mancuerna / Polea)' },
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 3, exerciseId: 'rear_delt_fly', reps: '8-12', notes: 'Rear or Side Delts — Deltoide Posterior o Lateral' },
            { muscle: 'ABS' as MuscleGroup, setTarget: 2, exerciseId: 'knee_raise', reps: '12-15', notes: 'Abs (Hanging Knee/Leg Raises / Cable Crunches) — Abdomen (Elevaciones de Piernas / Encogimientos Polea)' },
        ]
    },
    {
        id: 'rp_fb_5x_d2',
        dayName: { en: 'Day 2: Quad Focused Legs', es: 'Día 2: Piernas (Enfoque Cuádriceps)' },
        slots: [
            { muscle: 'QUADS' as MuscleGroup, setTarget: 3, exerciseId: 'sq_bar', reps: '8-12', notes: 'Quads (Squat / Leg Press / Hack) — Cuádriceps (Sentadilla / Prensa / Hack)' },
            { muscle: 'QUADS' as MuscleGroup, setTarget: 2, exerciseId: 'sq_bar', reps: '8-12', notes: 'Quads (Squat / Leg Press / Hack) — Cuádriceps (Sentadilla / Prensa / Hack)' },
            { muscle: 'HAMSTRINGS' as MuscleGroup, setTarget: 3, exerciseId: 'leg_curl', reps: '8-12', notes: 'Hamstring Isolation (Seated/Lying Leg Curl) — Isquios Aislamiento (Curl Femoral Sentado/Tumbado)' },
            { muscle: 'CALVES' as MuscleGroup, setTarget: 4, exerciseId: 'calf_raise', reps: '12-15', notes: 'Calves (Standing / Machine / Leg Press) — Gemelos (De Pie / Máquina / Prensa)' },
        ]
    },
    {
        id: 'rp_fb_5x_d3',
        dayName: { en: 'Day 3: Back Upper', es: 'Día 3: Espalda y Tren Superior' },
        slots: [
            { muscle: 'BACK' as MuscleGroup, setTarget: 2, exerciseId: 'lat_pull', reps: '8-12', notes: 'Vertical Pull (Pulldowns / Pullups / Chinups) — Tracción Vertical (Jalones / Dominadas)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 2, exerciseId: 'lat_pull', reps: '8-12', notes: 'Vertical Pull (Pulldowns / Pullups / Chinups) — Tracción Vertical (Jalones / Dominadas)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 2, exerciseId: 'bent_barbell_row', reps: '8-12', notes: 'Horizontal Pull (Barbell / DB / Cable Row) — Tracción Horizontal (Remo Barra / Mancuerna / Polea)' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 2, exerciseId: 'bp_bar', reps: '8-12', notes: 'Horizontal Push (Bench / DB / Machine Press) — Empuje Horizontal (Banca Plana / Mancuerna / Máquina)' },
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 3, exerciseId: 'rear_delt_fly', reps: '8-12', notes: 'Rear or Side Delts — Deltoide Posterior o Lateral' },
            { muscle: 'ABS' as MuscleGroup, setTarget: 2, exerciseId: 'knee_raise', reps: '12-15', notes: 'Abs (Hanging Knee/Leg Raises / Cable Crunches) — Abdomen (Elevaciones de Piernas / Encogimientos Polea)' },
        ]
    },
    {
        id: 'rp_fb_5x_d4',
        dayName: { en: 'Day 4: Glute & Hamstring Focused Legs', es: 'Día 4: Piernas (Glúteo e Isquios)' },
        slots: [
            { muscle: 'GLUTES' as MuscleGroup, setTarget: 3, exerciseId: 'glute_bridge', reps: '8-12', notes: 'Glutes (Bridge / Lunge / Sumo DL) — Glúteos (Puente / Zancadas / Peso Muerto Sumo)' },
            { muscle: 'GLUTES' as MuscleGroup, setTarget: 3, exerciseId: 'glute_bridge', reps: '8-12', notes: 'Glutes (Bridge / Lunge / Sumo DL) — Glúteos (Puente / Zancadas / Peso Muerto Sumo)' },
            { muscle: 'HAMSTRINGS' as MuscleGroup, setTarget: 3, exerciseId: 'rdl', reps: '8-12', notes: 'Hamstring Hinge (RDL / SLDL / Good Morning) — Isquios Bisagra (RDL / Piernas Rígidas / Buenos Días)' },
            { muscle: 'QUADS' as MuscleGroup, setTarget: 3, exerciseId: 'sq_bar', reps: '8-12', notes: 'Quads (Squat / Leg Press / Hack) — Cuádriceps (Sentadilla / Prensa / Hack)' },
            { muscle: 'CALVES' as MuscleGroup, setTarget: 4, exerciseId: 'calf_raise', reps: '12-15', notes: 'Calves (Standing / Machine / Leg Press) — Gemelos (De Pie / Máquina / Prensa)' },
        ]
    },
    {
        id: 'rp_fb_5x_d5',
        dayName: { en: 'Day 5: Shoulders & Arms Upper', es: 'Día 5: Hombros y Brazos' },
        slots: [
            { muscle: 'BICEPS' as MuscleGroup, setTarget: 3, exerciseId: 'curl_bar', reps: '8-12', notes: 'Biceps (Barbell / DB / Cable Curl) — Bíceps (Curl Barra / Mancuerna / Polea)' },
            { muscle: 'TRICEPS' as MuscleGroup, setTarget: 3, exerciseId: 'tri_push', reps: '8-12', notes: 'Triceps (Pushdowns / Dips / Skullcrushers) — Tríceps (Extensiones en Polea / Fondos / Press Francés)' },
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 3, exerciseId: 'ohp', reps: '8-12', notes: 'Front Delts (Standing/Seated Overhead Press) — Deltoide Frontal (Press Militar Barra / Mancuerna)' },
            { muscle: 'TRAPS' as MuscleGroup, setTarget: 3, exerciseId: 'shrug_db', reps: '8-12', notes: 'Traps (Barbell / DB Shrugs) — Trapecios (Encogimientos Barra / Mancuerna)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 2, exerciseId: 'lat_pull', reps: '8-12', notes: 'Vertical Pull (Pulldowns / Pullups / Chinups) — Tracción Vertical (Jalones / Dominadas)' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 2, exerciseId: 'bp_inc_bar', reps: '8-12', notes: 'Incline Push (Barbell / DB / Machine) — Empuje Inclinado (Barra / Mancuerna / Máquina)' },
            { muscle: 'ABS' as MuscleGroup, setTarget: 2, exerciseId: 'knee_raise', reps: '12-15', notes: 'Abs (Hanging Knee/Leg Raises / Cable Crunches) — Abdomen (Elevaciones de Piernas / Encogimientos Polea)' },
        ]
    },
];

export const RP_FB_5X_TEMPLATE: GlobalTemplate = {
    id: 'rp_fb_5x',
    name: 'rp_fb_5x',
    title: { en: 'RP MPT Full Body (5 Days)', es: 'RP MPT Cuerpo Completo (5 Días)' },
    description: {
        en: 'High-frequency 5-day full body split by Dr. Mike Israetel. Distributes volume across Chest Upper, Quad Legs, Back Upper, Glute/Ham Legs, and Shoulders/Arms.',
        es: 'Rutina de alta frecuencia en 5 días por el Dr. Mike Israetel. Distribuye el volumen entre Pecho Torso, Pierna Cuádriceps, Espalda Torso, Glúteo/Isquio y Hombros/Brazos.'
    },
    isPro: false,
    order: 21,
    guidelineImages: RP_GUIDELINE_IMAGES,
    program: RP_FB_5X_PROGRAM
};

export const RP_FB_6X_PROGRAM: ProgramDay[] = [
    {
        id: 'rp_fb_6x_d1',
        dayName: { en: 'Day 1: Chest Focused Upper', es: 'Día 1: Tren Superior (Enfoque Pecho)' },
        slots: [
            { muscle: 'CHEST' as MuscleGroup, setTarget: 2, exerciseId: 'bp_inc_bar', reps: '8-12', notes: 'Incline Push (Barbell / DB / Machine) — Empuje Inclinado (Barra / Mancuerna / Máquina)' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 2, exerciseId: 'pec_fly', reps: '8-12', notes: 'Chest Isolation (Pec Dec / Cable Flye / DB Flye) — Aislamiento Pecho (Pec Dec / Aperturas Polea)' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 2, exerciseId: 'bp_bar', reps: '8-12', notes: 'Horizontal Push (Bench / DB / Machine Press) — Empuje Horizontal (Banca Plana / Mancuerna / Máquina)' },
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 4, exerciseId: 'rear_delt_fly', reps: '8-12', notes: 'Rear or Side Delts — Deltoide Posterior o Lateral' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 2, exerciseId: 'bent_barbell_row', reps: '8-12', notes: 'Horizontal Pull (Barbell / DB / Cable Row) — Tracción Horizontal (Remo Barra / Mancuerna / Polea)' },
        ]
    },
    {
        id: 'rp_fb_6x_d2',
        dayName: { en: 'Day 2: Quad Focused Lower', es: 'Día 2: Tren Inferior (Enfoque Cuádriceps)' },
        slots: [
            { muscle: 'QUADS' as MuscleGroup, setTarget: 3, exerciseId: 'sq_bar', reps: '8-12', notes: 'Quads (Squat / Leg Press / Hack) — Cuádriceps (Sentadilla / Prensa / Hack)' },
            { muscle: 'QUADS' as MuscleGroup, setTarget: 3, exerciseId: 'sq_bar', reps: '8-12', notes: 'Quads (Squat / Leg Press / Hack) — Cuádriceps (Sentadilla / Prensa / Hack)' },
            { muscle: 'HAMSTRINGS' as MuscleGroup, setTarget: 3, exerciseId: 'leg_curl', reps: '8-12', notes: 'Hamstring Isolation (Seated/Lying Leg Curl) — Isquios Aislamiento (Curl Femoral Sentado/Tumbado)' },
            { muscle: 'CALVES' as MuscleGroup, setTarget: 3, exerciseId: 'calf_raise', reps: '12-15', notes: 'Calves (Standing / Machine / Leg Press) — Gemelos (De Pie / Máquina / Prensa)' },
            { muscle: 'ABS' as MuscleGroup, setTarget: 3, exerciseId: 'knee_raise', reps: '12-15', notes: 'Abs (Hanging Knee/Leg Raises / Cable Crunches) — Abdomen (Elevaciones de Piernas / Encogimientos Polea)' },
        ]
    },
    {
        id: 'rp_fb_6x_d3',
        dayName: { en: 'Day 3: Arms Focused Upper', es: 'Día 3: Tren Superior (Enfoque Brazos)' },
        slots: [
            { muscle: 'TRICEPS' as MuscleGroup, setTarget: 3, exerciseId: 'tri_push', reps: '8-12', notes: 'Triceps (Pushdowns / Dips / Skullcrushers) — Tríceps (Extensiones en Polea / Fondos / Press Francés)' },
            { muscle: 'TRICEPS' as MuscleGroup, setTarget: 3, exerciseId: 'tri_push', reps: '8-12', notes: 'Triceps (Pushdowns / Dips / Skullcrushers) — Tríceps (Extensiones en Polea / Fondos / Press Francés)' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 2, exerciseId: 'bp_bar', reps: '8-12', notes: 'Horizontal Push (Bench / DB / Machine Press) — Empuje Horizontal (Banca Plana / Mancuerna / Máquina)' },
            { muscle: 'BICEPS' as MuscleGroup, setTarget: 2, exerciseId: 'curl_bar', reps: '8-12', notes: 'Biceps (Barbell / DB / Cable Curl) — Bíceps (Curl Barra / Mancuerna / Polea)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 2, exerciseId: 'lat_pull', reps: '8-12', notes: 'Vertical Pull (Pulldowns / Pullups / Chinups) — Tracción Vertical (Jalones / Dominadas)' },
        ]
    },
    {
        id: 'rp_fb_6x_d4',
        dayName: { en: 'Day 4: Glute Focused Lower', es: 'Día 4: Tren Inferior (Enfoque Glúteos)' },
        slots: [
            { muscle: 'GLUTES' as MuscleGroup, setTarget: 3, exerciseId: 'glute_bridge', reps: '8-12', notes: 'Glutes (Bridge / Lunge / Sumo DL) — Glúteos (Puente / Zancadas / Peso Muerto Sumo)' },
            { muscle: 'GLUTES' as MuscleGroup, setTarget: 3, exerciseId: 'glute_bridge', reps: '8-12', notes: 'Glutes (Bridge / Lunge / Sumo DL) — Glúteos (Puente / Zancadas / Peso Muerto Sumo)' },
            { muscle: 'QUADS' as MuscleGroup, setTarget: 2, exerciseId: 'sq_bar', reps: '8-12', notes: 'Quads (Squat / Leg Press / Hack) — Cuádriceps (Sentadilla / Prensa / Hack)' },
            { muscle: 'CALVES' as MuscleGroup, setTarget: 3, exerciseId: 'calf_raise', reps: '12-15', notes: 'Calves (Standing / Machine / Leg Press) — Gemelos (De Pie / Máquina / Prensa)' },
            { muscle: 'ABS' as MuscleGroup, setTarget: 3, exerciseId: 'knee_raise', reps: '12-15', notes: 'Abs (Hanging Knee/Leg Raises / Cable Crunches) — Abdomen (Elevaciones de Piernas / Encogimientos Polea)' },
        ]
    },
    {
        id: 'rp_fb_6x_d5',
        dayName: { en: 'Day 5: Back Focused Upper', es: 'Día 5: Tren Superior (Enfoque Espalda)' },
        slots: [
            { muscle: 'BACK' as MuscleGroup, setTarget: 2, exerciseId: 'lat_pull', reps: '8-12', notes: 'Vertical Pull (Pulldowns / Pullups / Chinups) — Tracción Vertical (Jalones / Dominadas)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 2, exerciseId: 'lat_pull', reps: '8-12', notes: 'Vertical Pull (Pulldowns / Pullups / Chinups) — Tracción Vertical (Jalones / Dominadas)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 2, exerciseId: 'bent_barbell_row', reps: '8-12', notes: 'Horizontal Pull (Barbell / DB / Cable Row) — Tracción Horizontal (Remo Barra / Mancuerna / Polea)' },
            { muscle: 'BICEPS' as MuscleGroup, setTarget: 3, exerciseId: 'curl_bar', reps: '8-12', notes: 'Biceps (Barbell / DB / Cable Curl) — Bíceps (Curl Barra / Mancuerna / Polea)' },
            { muscle: 'BICEPS' as MuscleGroup, setTarget: 3, exerciseId: 'curl_bar', reps: '8-12', notes: 'Biceps (Barbell / DB / Cable Curl) — Bíceps (Curl Barra / Mancuerna / Polea)' },
        ]
    },
    {
        id: 'rp_fb_6x_d6',
        dayName: { en: 'Day 6: Hamstrings, Calves & Shoulders', es: 'Día 6: Isquios, Gemelos y Hombro' },
        slots: [
            { muscle: 'HAMSTRINGS' as MuscleGroup, setTarget: 3, exerciseId: 'rdl', reps: '8-12', notes: 'Hamstring Hinge (RDL / SLDL / Good Morning) — Isquios Bisagra (RDL / Piernas Rígidas / Buenos Días)' },
            { muscle: 'CALVES' as MuscleGroup, setTarget: 3, exerciseId: 'calf_raise', reps: '12-15', notes: 'Calves (Standing / Machine / Leg Press) — Gemelos (De Pie / Máquina / Prensa)' },
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 3, exerciseId: 'ohp', reps: '8-12', notes: 'Front Delts (Standing/Seated Overhead Press) — Deltoide Frontal (Press Militar Barra / Mancuerna)' },
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 4, exerciseId: 'rear_delt_fly', reps: '8-12', notes: 'Rear or Side Delts — Deltoide Posterior o Lateral' },
            { muscle: 'TRAPS' as MuscleGroup, setTarget: 3, exerciseId: 'shrug_db', reps: '8-12', notes: 'Traps (Barbell / DB Shrugs) — Trapecios (Encogimientos Barra / Mancuerna)' },
        ]
    },
];

export const RP_FB_6X_TEMPLATE: GlobalTemplate = {
    id: 'rp_fb_6x',
    name: 'rp_fb_6x',
    title: { en: 'RP MPT Full Body (6 Days)', es: 'RP MPT Cuerpo Completo (6 Días)' },
    description: {
        en: 'Elite 6-day hypertrophy frequency split. Alternates Chest Upper, Quad Lower, Arms Upper, Glute Lower, Back Upper, and Ham/Calf/Shoulder focus.',
        es: 'Rutina élite de 6 días de alta frecuencia. Alterna Pecho Torso, Cuádriceps Pierna, Brazos Torso, Glúteos Pierna, Espalda Torso e Isquios/Gemelos.'
    },
    isPro: false,
    order: 22,
    guidelineImages: RP_GUIDELINE_IMAGES,
    program: RP_FB_6X_PROGRAM
};

export const RP_ARMS_3X_PROGRAM: ProgramDay[] = [
    {
        id: 'rp_arms_3x_d1',
        dayName: { en: 'Day 1: Biceps, Rear & Side Delts', es: 'Día 1: Bíceps, Posterior y Lateral' },
        slots: [
            { muscle: 'BICEPS' as MuscleGroup, setTarget: 3, exerciseId: 'curl_bar', reps: '8-12', notes: 'Biceps (Barbell / DB / Cable Curl) — Bíceps (Curl Barra / Mancuerna / Polea)' },
            { muscle: 'BICEPS' as MuscleGroup, setTarget: 3, exerciseId: 'curl_bar', reps: '8-12', notes: 'Biceps (Barbell / DB / Cable Curl) — Bíceps (Curl Barra / Mancuerna / Polea)' },
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 3, exerciseId: 'rear_delt_fly', reps: '8-12', notes: 'Rear or Side Delts — Deltoide Posterior o Lateral' },
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 3, exerciseId: 'rear_delt_fly', reps: '8-12', notes: 'Rear or Side Delts — Deltoide Posterior o Lateral' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 3, exerciseId: 'lat_pull', reps: '8-12', notes: 'Vertical Pull (Pulldowns / Pullups / Chinups) — Tracción Vertical (Jalones / Dominadas)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 3, exerciseId: 'bent_barbell_row', reps: '8-12', notes: 'Horizontal Pull (Barbell / DB / Cable Row) — Tracción Horizontal (Remo Barra / Mancuerna / Polea)' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 2, exerciseId: 'bp_bar', reps: '8-12', notes: 'Horizontal Push (Bench / DB / Machine Press) — Empuje Horizontal (Banca Plana / Mancuerna / Máquina)' },
            { muscle: 'QUADS' as MuscleGroup, setTarget: 3, exerciseId: 'sq_bar', reps: '8-12', notes: 'Quads (Squat / Leg Press / Hack) — Cuádriceps (Sentadilla / Prensa / Hack)' },
        ]
    },
    {
        id: 'rp_arms_3x_d2',
        dayName: { en: 'Day 2: Triceps & Front Delts', es: 'Día 2: Tríceps y Deltoide Frontal' },
        slots: [
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 3, exerciseId: 'ohp', reps: '8-12', notes: 'Front Delts (Standing/Seated Overhead Press) — Deltoide Frontal (Press Militar Barra / Mancuerna)' },
            { muscle: 'TRICEPS' as MuscleGroup, setTarget: 3, exerciseId: 'tri_push', reps: '8-12', notes: 'Triceps (Pushdowns / Dips / Skullcrushers) — Tríceps (Extensiones en Polea / Fondos / Press Francés)' },
            { muscle: 'TRICEPS' as MuscleGroup, setTarget: 3, exerciseId: 'tri_push', reps: '8-12', notes: 'Triceps (Pushdowns / Dips / Skullcrushers) — Tríceps (Extensiones en Polea / Fondos / Press Francés)' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 3, exerciseId: 'bp_inc_bar', reps: '8-12', notes: 'Incline Push (Barbell / DB / Machine) — Empuje Inclinado (Barra / Mancuerna / Máquina)' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 3, exerciseId: 'bp_bar', reps: '8-12', notes: 'Horizontal Push (Bench / DB / Machine Press) — Empuje Horizontal (Banca Plana / Mancuerna / Máquina)' },
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 3, exerciseId: 'lat_raise', reps: '8-12', notes: 'Side Delts (Lateral Raises / Upright Row) — Deltoide Lateral (Elevaciones Laterales / Remo al Cuello)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 2, exerciseId: 'lat_pull', reps: '8-12', notes: 'Vertical Pull (Pulldowns / Pullups / Chinups) — Tracción Vertical (Jalones / Dominadas)' },
            { muscle: 'GLUTES' as MuscleGroup, setTarget: 3, exerciseId: 'glute_bridge', reps: '8-12', notes: 'Glutes (Bridge / Lunge / Sumo DL) — Glúteos (Puente / Zancadas / Peso Muerto Sumo)' },
        ]
    },
    {
        id: 'rp_arms_3x_d3',
        dayName: { en: 'Day 3: Arms & Shoulders', es: 'Día 3: Brazos y Hombros' },
        slots: [
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 3, exerciseId: 'lat_raise', reps: '8-12', notes: 'Side Delts (Lateral Raises / Upright Row) — Deltoide Lateral (Elevaciones Laterales / Remo al Cuello)' },
            { muscle: 'BICEPS' as MuscleGroup, setTarget: 3, exerciseId: 'curl_bar', reps: '8-12', notes: 'Biceps (Barbell / DB / Cable Curl) — Bíceps (Curl Barra / Mancuerna / Polea)' },
            { muscle: 'TRICEPS' as MuscleGroup, setTarget: 3, exerciseId: 'tri_push', reps: '8-12', notes: 'Triceps (Pushdowns / Dips / Skullcrushers) — Tríceps (Extensiones en Polea / Fondos / Press Francés)' },
            { muscle: 'TRAPS' as MuscleGroup, setTarget: 3, exerciseId: 'shrug_db', reps: '8-12', notes: 'Traps (Barbell / DB Shrugs) — Trapecios (Encogimientos Barra / Mancuerna)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 3, exerciseId: 'bent_barbell_row', reps: '8-12', notes: 'Horizontal Pull (Barbell / DB / Cable Row) — Tracción Horizontal (Remo Barra / Mancuerna / Polea)' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 3, exerciseId: 'bp_inc_bar', reps: '8-12', notes: 'Incline Push (Barbell / DB / Machine) — Empuje Inclinado (Barra / Mancuerna / Máquina)' },
            { muscle: 'QUADS' as MuscleGroup, setTarget: 2, exerciseId: 'sq_bar', reps: '8-12', notes: 'Quads (Squat / Leg Press / Hack) — Cuádriceps (Sentadilla / Prensa / Hack)' },
            { muscle: 'HAMSTRINGS' as MuscleGroup, setTarget: 2, exerciseId: 'rdl', reps: '8-12', notes: 'Hamstring Hinge (RDL / SLDL / Good Morning) — Isquios Bisagra (RDL / Piernas Rígidas / Buenos Días)' },
        ]
    },
];

export const RP_ARMS_3X_TEMPLATE: GlobalTemplate = {
    id: 'rp_arms_3x',
    name: 'rp_arms_3x',
    title: { en: 'RP MPT Arms & Delts (3 Days)', es: 'RP MPT Brazos y Hombros (3 Días)' },
    description: {
        en: '3-Day arm and shoulder specialization template. Places high priority on biceps, triceps, side and rear delts while maintaining torso and leg mass.',
        es: 'Especialización en brazos y deltoides en 3 días. Prioriza bíceps, tríceps, hombro lateral y posterior manteniendo masa en torso y piernas.'
    },
    isPro: false,
    order: 23,
    guidelineImages: RP_GUIDELINE_IMAGES,
    program: RP_ARMS_3X_PROGRAM
};

export const RP_ARMS_4X_PROGRAM: ProgramDay[] = [
    {
        id: 'rp_arms_4x_d1',
        dayName: { en: 'Day 1: Triceps & Front Delts', es: 'Día 1: Tríceps y Deltoide Frontal' },
        slots: [
            { muscle: 'TRICEPS' as MuscleGroup, setTarget: 3, exerciseId: 'tri_push', reps: '8-12', notes: 'Horizontal Triceps (Pushdowns / Dips / Skullcrushers) — Tríceps Horizontal (Polea / Fondos / Francés)' },
            { muscle: 'TRICEPS' as MuscleGroup, setTarget: 3, exerciseId: 'tri_ext', reps: '8-12', notes: 'Vertical Triceps (Overhead Triceps Extensions) — Tríceps Vertical (Extensiones por encima de la cabeza)' },
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 3, exerciseId: 'ohp', reps: '8-12', notes: 'Front Delts (Standing/Seated Overhead Press) — Deltoide Frontal (Press Militar Barra / Mancuerna)' },
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 3, exerciseId: 'lat_raise', reps: '8-12', notes: 'Side Delts (Lateral Raises / Upright Row) — Deltoide Lateral (Elevaciones Laterales / Remo al Cuello)' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 3, exerciseId: 'bp_inc_bar', reps: '8-12', notes: 'Incline Push (Barbell / DB / Machine) — Empuje Inclinado (Barra / Mancuerna / Máquina)' },
            { muscle: 'QUADS' as MuscleGroup, setTarget: 3, exerciseId: 'sq_bar', reps: '8-12', notes: 'Quads (Squat / Leg Press / Hack) — Cuádriceps (Sentadilla / Prensa / Hack)' },
            { muscle: 'CALVES' as MuscleGroup, setTarget: 4, exerciseId: 'calf_raise', reps: '12-15', notes: 'Calves (Standing / Machine / Leg Press) — Gemelos (De Pie / Máquina / Prensa)' },
        ]
    },
    {
        id: 'rp_arms_4x_d2',
        dayName: { en: 'Day 2: Biceps, Side & Rear Delts', es: 'Día 2: Bíceps, Lateral y Posterior' },
        slots: [
            { muscle: 'BICEPS' as MuscleGroup, setTarget: 3, exerciseId: 'curl_bar', reps: '8-12', notes: 'Biceps (Barbell / DB / Cable Curl) — Bíceps (Curl Barra / Mancuerna / Polea)' },
            { muscle: 'BICEPS' as MuscleGroup, setTarget: 3, exerciseId: 'curl_bar', reps: '8-12', notes: 'Biceps (Barbell / DB / Cable Curl) — Bíceps (Curl Barra / Mancuerna / Polea)' },
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 3, exerciseId: 'rear_delt_fly', reps: '8-12', notes: 'Rear or Side Delts — Deltoide Posterior o Lateral' },
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 3, exerciseId: 'rear_delt_fly', reps: '8-12', notes: 'Rear or Side Delts — Deltoide Posterior o Lateral' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 3, exerciseId: 'lat_pull', reps: '8-12', notes: 'Vertical Pull (Pulldowns / Pullups / Chinups) — Tracción Vertical (Jalones / Dominadas)' },
            { muscle: 'GLUTES' as MuscleGroup, setTarget: 3, exerciseId: 'glute_bridge', reps: '8-12', notes: 'Glutes (Bridge / Lunge / Sumo DL) — Glúteos (Puente / Zancadas / Peso Muerto Sumo)' },
            { muscle: 'HAMSTRINGS' as MuscleGroup, setTarget: 3, exerciseId: 'leg_curl', reps: '8-12', notes: 'Hamstring Isolation (Seated/Lying Leg Curl) — Isquios Aislamiento (Curl Femoral Sentado/Tumbado)' },
        ]
    },
    {
        id: 'rp_arms_4x_d3',
        dayName: { en: 'Day 3: Triceps & Front Delts', es: 'Día 3: Tríceps y Deltoide Frontal' },
        slots: [
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 3, exerciseId: 'ohp', reps: '8-12', notes: 'Front Delts (Standing/Seated Overhead Press) — Deltoide Frontal (Press Militar Barra / Mancuerna)' },
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 3, exerciseId: 'ohp', reps: '8-12', notes: 'Front Delts (Standing/Seated Overhead Press) — Deltoide Frontal (Press Militar Barra / Mancuerna)' },
            { muscle: 'TRICEPS' as MuscleGroup, setTarget: 3, exerciseId: 'tri_push', reps: '8-12', notes: 'Triceps (Pushdowns / Dips / Skullcrushers) — Tríceps (Extensiones en Polea / Fondos / Press Francés)' },
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 3, exerciseId: 'lat_raise', reps: '8-12', notes: 'Side Delts (Lateral Raises / Upright Row) — Deltoide Lateral (Elevaciones Laterales / Remo al Cuello)' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 3, exerciseId: 'bp_bar', reps: '8-12', notes: 'Horizontal Push (Bench / DB / Machine Press) — Empuje Horizontal (Banca Plana / Mancuerna / Máquina)' },
            { muscle: 'QUADS' as MuscleGroup, setTarget: 3, exerciseId: 'sq_bar', reps: '8-12', notes: 'Quads (Squat / Leg Press / Hack) — Cuádriceps (Sentadilla / Prensa / Hack)' },
            { muscle: 'CALVES' as MuscleGroup, setTarget: 4, exerciseId: 'calf_raise', reps: '12-15', notes: 'Calves (Standing / Machine / Leg Press) — Gemelos (De Pie / Máquina / Prensa)' },
        ]
    },
    {
        id: 'rp_arms_4x_d4',
        dayName: { en: 'Day 4: Biceps, Side & Rear Delts', es: 'Día 4: Bíceps, Lateral y Posterior' },
        slots: [
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 3, exerciseId: 'rear_delt_fly', reps: '8-12', notes: 'Rear or Side Delts — Deltoide Posterior o Lateral' },
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 3, exerciseId: 'rear_delt_fly', reps: '8-12', notes: 'Rear or Side Delts — Deltoide Posterior o Lateral' },
            { muscle: 'BICEPS' as MuscleGroup, setTarget: 3, exerciseId: 'curl_bar', reps: '8-12', notes: 'Biceps (Barbell / DB / Cable Curl) — Bíceps (Curl Barra / Mancuerna / Polea)' },
            { muscle: 'BICEPS' as MuscleGroup, setTarget: 3, exerciseId: 'curl_bar', reps: '8-12', notes: 'Biceps (Barbell / DB / Cable Curl) — Bíceps (Curl Barra / Mancuerna / Polea)' },
            { muscle: 'TRAPS' as MuscleGroup, setTarget: 3, exerciseId: 'shrug_db', reps: '8-12', notes: 'Traps (Barbell / DB Shrugs) — Trapecios (Encogimientos Barra / Mancuerna)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 3, exerciseId: 'bent_barbell_row', reps: '8-12', notes: 'Horizontal Pull (Barbell / DB / Cable Row) — Tracción Horizontal (Remo Barra / Mancuerna / Polea)' },
            { muscle: 'HAMSTRINGS' as MuscleGroup, setTarget: 3, exerciseId: 'rdl', reps: '8-12', notes: 'Hamstring Hinge (RDL / SLDL / Good Morning) — Isquios Bisagra (RDL / Piernas Rígidas / Buenos Días)' },
        ]
    },
];

export const RP_ARMS_4X_TEMPLATE: GlobalTemplate = {
    id: 'rp_arms_4x',
    name: 'rp_arms_4x',
    title: { en: 'RP MPT Arms & Delts (4 Days)', es: 'RP MPT Brazos y Hombros (4 Días)' },
    description: {
        en: '4-Day hypertrophy split with dedicated Triceps/Front Delts and Biceps/Side-Rear Delts priority sessions alongside compounds.',
        es: 'Especialización de 4 días con sesiones dedicadas a Tríceps/Deltoide Frontal y Bíceps/Lateral-Posterior combinadas con ejercicios compuestos.'
    },
    isPro: false,
    order: 24,
    guidelineImages: RP_GUIDELINE_IMAGES,
    program: RP_ARMS_4X_PROGRAM
};

export const RP_ARMS_5X_PROGRAM: ProgramDay[] = [
    {
        id: 'rp_arms_5x_d1',
        dayName: { en: 'Day 1: Delts & Triceps Upper', es: 'Día 1: Deltoides y Tríceps Torso' },
        slots: [
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 2, exerciseId: 'ohp', reps: '8-12', notes: 'Front Delts (Standing/Seated Overhead Press) — Deltoide Frontal (Press Militar Barra / Mancuerna)' },
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 2, exerciseId: 'lat_raise', reps: '8-12', notes: 'Side Delts (Lateral Raises / Upright Row) — Deltoide Lateral (Elevaciones Laterales / Remo al Cuello)' },
            { muscle: 'TRICEPS' as MuscleGroup, setTarget: 2, exerciseId: 'tri_push', reps: '8-12', notes: 'Triceps (Pushdowns / Dips / Skullcrushers) — Tríceps (Extensiones en Polea / Fondos / Press Francés)' },
            { muscle: 'TRICEPS' as MuscleGroup, setTarget: 2, exerciseId: 'tri_push', reps: '8-12', notes: 'Triceps (Pushdowns / Dips / Skullcrushers) — Tríceps (Extensiones en Polea / Fondos / Press Francés)' },
            { muscle: 'BICEPS' as MuscleGroup, setTarget: 2, exerciseId: 'curl_bar', reps: '8-12', notes: 'Biceps (Barbell / DB / Cable Curl) — Bíceps (Curl Barra / Mancuerna / Polea)' },
            { muscle: 'ABS' as MuscleGroup, setTarget: 2, exerciseId: 'knee_raise', reps: '12-15', notes: 'Abs (Hanging Knee/Leg Raises / Cable Crunches) — Abdomen (Elevaciones de Piernas / Encogimientos Polea)' },
        ]
    },
    {
        id: 'rp_arms_5x_d2',
        dayName: { en: 'Day 2: Legs & Chest', es: 'Día 2: Piernas y Pecho' },
        slots: [
            { muscle: 'QUADS' as MuscleGroup, setTarget: 2, exerciseId: 'sq_bar', reps: '8-12', notes: 'Quads (Squat / Leg Press / Hack) — Cuádriceps (Sentadilla / Prensa / Hack)' },
            { muscle: 'QUADS' as MuscleGroup, setTarget: 2, exerciseId: 'sq_bar', reps: '8-12', notes: 'Quads (Squat / Leg Press / Hack) — Cuádriceps (Sentadilla / Prensa / Hack)' },
            { muscle: 'HAMSTRINGS' as MuscleGroup, setTarget: 3, exerciseId: 'leg_curl', reps: '8-12', notes: 'Hamstring Isolation (Seated/Lying Leg Curl) — Isquios Aislamiento (Curl Femoral Sentado/Tumbado)' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 3, exerciseId: 'bp_inc_bar', reps: '8-12', notes: 'Incline Push (Barbell / DB / Machine) — Empuje Inclinado (Barra / Mancuerna / Máquina)' },
            { muscle: 'CALVES' as MuscleGroup, setTarget: 4, exerciseId: 'calf_raise', reps: '12-15', notes: 'Calves (Standing / Machine / Leg Press) — Gemelos (De Pie / Máquina / Prensa)' },
        ]
    },
    {
        id: 'rp_arms_5x_d3',
        dayName: { en: 'Day 3: Rear Delts & Biceps Upper', es: 'Día 3: Deltoide Posterior y Bíceps Torso' },
        slots: [
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 3, exerciseId: 'rear_delt_fly', reps: '8-12', notes: 'Rear Delts (Facepulls / Rear Delt Flyes) — Deltoide Posterior (Pájaros / Facepulls)' },
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 3, exerciseId: 'lat_raise', reps: '8-12', notes: 'Side Delts (Lateral Raises / Upright Row) — Deltoide Lateral (Elevaciones Laterales / Remo al Cuello)' },
            { muscle: 'BICEPS' as MuscleGroup, setTarget: 2, exerciseId: 'curl_bar', reps: '8-12', notes: 'Biceps (Barbell / DB / Cable Curl) — Bíceps (Curl Barra / Mancuerna / Polea)' },
            { muscle: 'BICEPS' as MuscleGroup, setTarget: 2, exerciseId: 'curl_bar', reps: '8-12', notes: 'Biceps (Barbell / DB / Cable Curl) — Bíceps (Curl Barra / Mancuerna / Polea)' },
            { muscle: 'TRICEPS' as MuscleGroup, setTarget: 3, exerciseId: 'tri_push', reps: '8-12', notes: 'Triceps (Pushdowns / Dips / Skullcrushers) — Tríceps (Extensiones en Polea / Fondos / Press Francés)' },
            { muscle: 'ABS' as MuscleGroup, setTarget: 3, exerciseId: 'knee_raise', reps: '12-15', notes: 'Abs (Hanging Knee/Leg Raises / Cable Crunches) — Abdomen (Elevaciones de Piernas / Encogimientos Polea)' },
        ]
    },
    {
        id: 'rp_arms_5x_d4',
        dayName: { en: 'Day 4: Legs & Back', es: 'Día 4: Piernas y Espalda' },
        slots: [
            { muscle: 'GLUTES' as MuscleGroup, setTarget: 3, exerciseId: 'glute_bridge', reps: '8-12', notes: 'Glutes (Bridge / Lunge / Sumo DL) — Glúteos (Puente / Zancadas / Peso Muerto Sumo)' },
            { muscle: 'HAMSTRINGS' as MuscleGroup, setTarget: 3, exerciseId: 'rdl', reps: '8-12', notes: 'Hamstring Hinge (RDL / SLDL / Good Morning) — Isquios Bisagra (RDL / Piernas Rígidas / Buenos Días)' },
            { muscle: 'QUADS' as MuscleGroup, setTarget: 3, exerciseId: 'sq_bar', reps: '8-12', notes: 'Quads (Squat / Leg Press / Hack) — Cuádriceps (Sentadilla / Prensa / Hack)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 3, exerciseId: 'bent_barbell_row', reps: '8-12', notes: 'Horizontal Pull (Barbell / DB / Cable Row) — Tracción Horizontal (Remo Barra / Mancuerna / Polea)' },
            { muscle: 'CALVES' as MuscleGroup, setTarget: 4, exerciseId: 'calf_raise', reps: '12-15', notes: 'Calves (Standing / Machine / Leg Press) — Gemelos (De Pie / Máquina / Prensa)' },
        ]
    },
    {
        id: 'rp_arms_5x_d5',
        dayName: { en: 'Day 5: Chest, Back, Shoulders & Arms', es: 'Día 5: Pecho, Espalda, Hombros y Brazos' },
        slots: [
            { muscle: 'BICEPS' as MuscleGroup, setTarget: 2, exerciseId: 'curl_bar', reps: '8-12', notes: 'Biceps (Barbell / DB / Cable Curl) — Bíceps (Curl Barra / Mancuerna / Polea)' },
            { muscle: 'BICEPS' as MuscleGroup, setTarget: 2, exerciseId: 'curl_bar', reps: '8-12', notes: 'Biceps (Barbell / DB / Cable Curl) — Bíceps (Curl Barra / Mancuerna / Polea)' },
            { muscle: 'TRICEPS' as MuscleGroup, setTarget: 2, exerciseId: 'tri_push', reps: '8-12', notes: 'Triceps (Pushdowns / Dips / Skullcrushers) — Tríceps (Extensiones en Polea / Fondos / Press Francés)' },
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 3, exerciseId: 'rear_delt_fly', reps: '8-12', notes: 'Rear or Side Delts — Deltoide Posterior o Lateral' },
            { muscle: 'TRAPS' as MuscleGroup, setTarget: 3, exerciseId: 'shrug_db', reps: '8-12', notes: 'Traps (Barbell / DB Shrugs) — Trapecios (Encogimientos Barra / Mancuerna)' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 3, exerciseId: 'bp_inc_bar', reps: '8-12', notes: 'Incline Push (Barbell / DB / Machine) — Empuje Inclinado (Barra / Mancuerna / Máquina)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 3, exerciseId: 'lat_pull', reps: '8-12', notes: 'Vertical Pull (Pulldowns / Pullups / Chinups) — Tracción Vertical (Jalones / Dominadas)' },
        ]
    },
];

export const RP_ARMS_5X_TEMPLATE: GlobalTemplate = {
    id: 'rp_arms_5x',
    name: 'rp_arms_5x',
    title: { en: 'RP MPT Arms & Delts (5 Days)', es: 'RP MPT Brazos y Hombros (5 Días)' },
    description: {
        en: '5-Day high-volume arm and delt specialization. Maximum adaptive volume for cannons and boulder shoulders with periodized recovery days.',
        es: 'Especialización de 5 días de alto volumen para brazos y hombros. Máximo volumen adaptativo (MAV) con días de recuperación estructurados.'
    },
    isPro: false,
    order: 25,
    guidelineImages: RP_GUIDELINE_IMAGES,
    program: RP_ARMS_5X_PROGRAM
};

export const RP_ARMS_6X_PROGRAM: ProgramDay[] = [
    {
        id: 'rp_arms_6x_d1',
        dayName: { en: 'Day 1: Triceps & Front Delts Push', es: 'Día 1: Empuje Tríceps y Deltoide Frontal' },
        slots: [
            { muscle: 'TRICEPS' as MuscleGroup, setTarget: 3, exerciseId: 'tri_push', reps: '8-12', notes: 'Horizontal Triceps (Pushdowns / Dips / Skullcrushers) — Tríceps Horizontal (Polea / Fondos / Francés)' },
            { muscle: 'TRICEPS' as MuscleGroup, setTarget: 3, exerciseId: 'tri_ext', reps: '8-12', notes: 'Vertical Triceps (Overhead Triceps Extensions) — Tríceps Vertical (Extensiones por encima de la cabeza)' },
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 3, exerciseId: 'ohp', reps: '8-12', notes: 'Front Delts (Standing/Seated Overhead Press) — Deltoide Frontal (Press Militar Barra / Mancuerna)' },
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 3, exerciseId: 'lat_raise', reps: '8-12', notes: 'Side Delts (Lateral Raises / Upright Row) — Deltoide Lateral (Elevaciones Laterales / Remo al Cuello)' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 3, exerciseId: 'bp_inc_bar', reps: '8-12', notes: 'Incline Push (Barbell / DB / Machine) — Empuje Inclinado (Barra / Mancuerna / Máquina)' },
        ]
    },
    {
        id: 'rp_arms_6x_d2',
        dayName: { en: 'Day 2: Legs Day', es: 'Día 2: Día Pierna' },
        slots: [
            { muscle: 'QUADS' as MuscleGroup, setTarget: 3, exerciseId: 'sq_bar', reps: '8-12', notes: 'Quads (Squat / Leg Press / Hack) — Cuádriceps (Sentadilla / Prensa / Hack)' },
            { muscle: 'QUADS' as MuscleGroup, setTarget: 3, exerciseId: 'sq_bar', reps: '8-12', notes: 'Quads (Squat / Leg Press / Hack) — Cuádriceps (Sentadilla / Prensa / Hack)' },
            { muscle: 'HAMSTRINGS' as MuscleGroup, setTarget: 3, exerciseId: 'leg_curl', reps: '8-12', notes: 'Hamstring Isolation (Seated/Lying Leg Curl) — Isquios Aislamiento (Curl Femoral Sentado/Tumbado)' },
            { muscle: 'CALVES' as MuscleGroup, setTarget: 6, exerciseId: 'calf_raise', reps: '12-15', notes: 'Calves (Standing / Machine / Leg Press) — Gemelos (De Pie / Máquina / Prensa)' },
            { muscle: 'ABS' as MuscleGroup, setTarget: 3, exerciseId: 'knee_raise', reps: '12-15', notes: 'Abs (Hanging Knee/Leg Raises / Cable Crunches) — Abdomen (Elevaciones de Piernas / Encogimientos Polea)' },
        ]
    },
    {
        id: 'rp_arms_6x_d3',
        dayName: { en: 'Day 3: Biceps, Side & Rear Delts Pull', es: 'Día 3: Tirón Bíceps, Lateral y Posterior' },
        slots: [
            { muscle: 'BICEPS' as MuscleGroup, setTarget: 3, exerciseId: 'curl_bar', reps: '8-12', notes: 'Biceps (Barbell / DB / Cable Curl) — Bíceps (Curl Barra / Mancuerna / Polea)' },
            { muscle: 'BICEPS' as MuscleGroup, setTarget: 3, exerciseId: 'curl_bar', reps: '8-12', notes: 'Biceps (Barbell / DB / Cable Curl) — Bíceps (Curl Barra / Mancuerna / Polea)' },
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 3, exerciseId: 'rear_delt_fly', reps: '8-12', notes: 'Rear or Side Delts — Deltoide Posterior o Lateral' },
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 3, exerciseId: 'rear_delt_fly', reps: '8-12', notes: 'Rear or Side Delts — Deltoide Posterior o Lateral' },
            { muscle: 'TRAPS' as MuscleGroup, setTarget: 3, exerciseId: 'shrug_db', reps: '8-12', notes: 'Traps (Barbell / DB Shrugs) — Trapecios (Encogimientos Barra / Mancuerna)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 3, exerciseId: 'lat_pull', reps: '8-12', notes: 'Vertical Pull (Pulldowns / Pullups / Chinups) — Tracción Vertical (Jalones / Dominadas)' },
        ]
    },
    {
        id: 'rp_arms_6x_d4',
        dayName: { en: 'Day 4: Front Delts & Triceps Push', es: 'Día 4: Empuje Deltoide Frontal y Tríceps' },
        slots: [
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 3, exerciseId: 'ohp', reps: '8-12', notes: 'Front Delts (Standing/Seated Overhead Press) — Deltoide Frontal (Press Militar Barra / Mancuerna)' },
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 3, exerciseId: 'ohp', reps: '8-12', notes: 'Front Delts (Standing/Seated Overhead Press) — Deltoide Frontal (Press Militar Barra / Mancuerna)' },
            { muscle: 'TRICEPS' as MuscleGroup, setTarget: 3, exerciseId: 'tri_push', reps: '8-12', notes: 'Triceps (Pushdowns / Dips / Skullcrushers) — Tríceps (Extensiones en Polea / Fondos / Press Francés)' },
            { muscle: 'TRICEPS' as MuscleGroup, setTarget: 2, exerciseId: 'tri_push', reps: '8-12', notes: 'Triceps (Pushdowns / Dips / Skullcrushers) — Tríceps (Extensiones en Polea / Fondos / Press Francés)' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 2, exerciseId: 'bp_bar', reps: '8-12', notes: 'Horizontal Push (Bench / DB / Machine Press) — Empuje Horizontal (Banca Plana / Mancuerna / Máquina)' },
        ]
    },
    {
        id: 'rp_arms_6x_d5',
        dayName: { en: 'Day 5: Legs Day', es: 'Día 5: Día Pierna' },
        slots: [
            { muscle: 'GLUTES' as MuscleGroup, setTarget: 3, exerciseId: 'glute_bridge', reps: '8-12', notes: 'Glutes (Bridge / Lunge / Sumo DL) — Glúteos (Puente / Zancadas / Peso Muerto Sumo)' },
            { muscle: 'GLUTES' as MuscleGroup, setTarget: 3, exerciseId: 'glute_bridge', reps: '8-12', notes: 'Glutes (Bridge / Lunge / Sumo DL) — Glúteos (Puente / Zancadas / Peso Muerto Sumo)' },
            { muscle: 'HAMSTRINGS' as MuscleGroup, setTarget: 3, exerciseId: 'rdl', reps: '8-12', notes: 'Hamstring Hinge (RDL / SLDL / Good Morning) — Isquios Bisagra (RDL / Piernas Rígidas / Buenos Días)' },
            { muscle: 'QUADS' as MuscleGroup, setTarget: 3, exerciseId: 'sq_bar', reps: '8-12', notes: 'Quads (Squat / Leg Press / Hack) — Cuádriceps (Sentadilla / Prensa / Hack)' },
            { muscle: 'CALVES' as MuscleGroup, setTarget: 6, exerciseId: 'calf_raise', reps: '12-15', notes: 'Calves (Standing / Machine / Leg Press) — Gemelos (De Pie / Máquina / Prensa)' },
            { muscle: 'ABS' as MuscleGroup, setTarget: 3, exerciseId: 'knee_raise', reps: '12-15', notes: 'Abs (Hanging Knee/Leg Raises / Cable Crunches) — Abdomen (Elevaciones de Piernas / Encogimientos Polea)' },
        ]
    },
    {
        id: 'rp_arms_6x_d6',
        dayName: { en: 'Day 6: Biceps, Side & Rear Delts Pull', es: 'Día 6: Tirón Bíceps, Lateral y Posterior' },
        slots: [
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 3, exerciseId: 'rear_delt_fly', reps: '8-12', notes: 'Rear or Side Delts — Deltoide Posterior o Lateral' },
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 3, exerciseId: 'rear_delt_fly', reps: '8-12', notes: 'Rear or Side Delts — Deltoide Posterior o Lateral' },
            { muscle: 'BICEPS' as MuscleGroup, setTarget: 3, exerciseId: 'curl_bar', reps: '8-12', notes: 'Biceps (Barbell / DB / Cable Curl) — Bíceps (Curl Barra / Mancuerna / Polea)' },
            { muscle: 'BICEPS' as MuscleGroup, setTarget: 3, exerciseId: 'curl_bar', reps: '8-12', notes: 'Biceps (Barbell / DB / Cable Curl) — Bíceps (Curl Barra / Mancuerna / Polea)' },
            { muscle: 'TRAPS' as MuscleGroup, setTarget: 3, exerciseId: 'shrug_db', reps: '8-12', notes: 'Traps (Barbell / DB Shrugs) — Trapecios (Encogimientos Barra / Mancuerna)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 3, exerciseId: 'bent_barbell_row', reps: '8-12', notes: 'Horizontal Pull (Barbell / DB / Cable Row) — Tracción Horizontal (Remo Barra / Mancuerna / Polea)' },
        ]
    },
];

export const RP_ARMS_6X_TEMPLATE: GlobalTemplate = {
    id: 'rp_arms_6x',
    name: 'rp_arms_6x',
    title: { en: 'RP MPT Arms & Delts (6 Days)', es: 'RP MPT Brazos y Hombros (6 Días)' },
    description: {
        en: 'Ultimate 6-day arm and shoulder specialization split. High-frequency arm blasting with optimized systemic fatigue management.',
        es: 'Máxima especialización en 6 días para brazos y deltoides. Alta frecuencia con gestión científica de la fatiga sistémica.'
    },
    isPro: false,
    order: 26,
    guidelineImages: RP_GUIDELINE_IMAGES,
    program: RP_ARMS_6X_PROGRAM
};

export const RP_CB_3X_PROGRAM: ProgramDay[] = [
    {
        id: 'rp_cb_3x_d1',
        dayName: { en: 'Day 1: Chest & Push', es: 'Día 1: Pecho y Empuje' },
        slots: [
            { muscle: 'CHEST' as MuscleGroup, setTarget: 3, exerciseId: 'bp_bar', reps: '8-12', notes: 'Horizontal Push (Bench / DB / Machine Press) — Empuje Horizontal (Banca Plana / Mancuerna / Máquina)' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 3, exerciseId: 'pec_fly', reps: '8-12', notes: 'Chest Isolation or Triceps — Aislamiento Pecho o Tríceps' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 3, exerciseId: 'bp_inc_bar', reps: '8-12', notes: 'Incline Push (Barbell / DB / Machine) — Empuje Inclinado (Barra / Mancuerna / Máquina)' },
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 3, exerciseId: 'lat_raise', reps: '8-12', notes: 'Side Delts (Lateral Raises / Upright Row) — Deltoide Lateral (Elevaciones Laterales / Remo al Cuello)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 3, exerciseId: 'lat_pull', reps: '8-12', notes: 'Vertical Pull (Pulldowns / Pullups / Chinups) — Tracción Vertical (Jalones / Dominadas)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 3, exerciseId: 'bent_barbell_row', reps: '8-12', notes: 'Horizontal Pull (Barbell / DB / Cable Row) — Tracción Horizontal (Remo Barra / Mancuerna / Polea)' },
            { muscle: 'HAMSTRINGS' as MuscleGroup, setTarget: 2, exerciseId: 'leg_curl', reps: '8-12', notes: 'Hamstring Isolation (Seated/Lying Leg Curl) — Isquios Aislamiento (Curl Femoral Sentado/Tumbado)' },
            { muscle: 'QUADS' as MuscleGroup, setTarget: 2, exerciseId: 'sq_bar', reps: '8-12', notes: 'Quads (Squat / Leg Press / Hack) — Cuádriceps (Sentadilla / Prensa / Hack)' },
        ]
    },
    {
        id: 'rp_cb_3x_d2',
        dayName: { en: 'Day 3: Back & Pull', es: 'Día 3: Espalda y Tracción' },
        slots: [
            { muscle: 'BACK' as MuscleGroup, setTarget: 3, exerciseId: 'lat_pull', reps: '8-12', notes: 'Vertical Pull (Pulldowns / Pullups / Chinups) — Tracción Vertical (Jalones / Dominadas)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 3, exerciseId: 'bent_barbell_row', reps: '8-12', notes: 'Horizontal Pull (Barbell / DB / Cable Row) — Tracción Horizontal (Remo Barra / Mancuerna / Polea)' },
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 3, exerciseId: 'rear_delt_fly', reps: '8-12', notes: 'Rear or Side Delts — Deltoide Posterior o Lateral' },
            { muscle: 'BICEPS' as MuscleGroup, setTarget: 3, exerciseId: 'curl_bar', reps: '8-12', notes: 'Biceps (Barbell / DB / Cable Curl) — Bíceps (Curl Barra / Mancuerna / Polea)' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 3, exerciseId: 'bp_bar', reps: '8-12', notes: 'Horizontal Push (Bench / DB / Machine Press) — Empuje Horizontal (Banca Plana / Mancuerna / Máquina)' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 3, exerciseId: 'bp_inc_bar', reps: '8-12', notes: 'Incline Push (Barbell / DB / Machine) — Empuje Inclinado (Barra / Mancuerna / Máquina)' },
            { muscle: 'GLUTES' as MuscleGroup, setTarget: 2, exerciseId: 'glute_bridge', reps: '8-12', notes: 'Glutes (Bridge / Lunge / Sumo DL) — Glúteos (Puente / Zancadas / Peso Muerto Sumo)' },
            { muscle: 'HAMSTRINGS' as MuscleGroup, setTarget: 2, exerciseId: 'leg_curl', reps: '8-12', notes: 'Hamstring Isolation (Seated/Lying Leg Curl) — Isquios Aislamiento (Curl Femoral Sentado/Tumbado)' },
        ]
    },
    {
        id: 'rp_cb_3x_d3',
        dayName: { en: 'Day 1: Chest & Back', es: 'Día 1: Pecho y Espalda' },
        slots: [
            { muscle: 'CHEST' as MuscleGroup, setTarget: 3, exerciseId: 'bp_bar', reps: '8-12', notes: 'Horizontal Push (Bench / DB / Machine Press) — Empuje Horizontal (Banca Plana / Mancuerna / Máquina)' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 3, exerciseId: 'pec_fly', reps: '8-12', notes: 'Chest Isolation or Triceps — Aislamiento Pecho o Tríceps' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 3, exerciseId: 'bp_inc_bar', reps: '8-12', notes: 'Incline Push (Barbell / DB / Machine) — Empuje Inclinado (Barra / Mancuerna / Máquina)' },
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 3, exerciseId: 'lat_raise', reps: '8-12', notes: 'Side Delts (Lateral Raises / Upright Row) — Deltoide Lateral (Elevaciones Laterales / Remo al Cuello)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 3, exerciseId: 'lat_pull', reps: '8-12', notes: 'Vertical Pull (Pulldowns / Pullups / Chinups) — Tracción Vertical (Jalones / Dominadas)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 3, exerciseId: 'bent_barbell_row', reps: '8-12', notes: 'Horizontal Pull (Barbell / DB / Cable Row) — Tracción Horizontal (Remo Barra / Mancuerna / Polea)' },
            { muscle: 'HAMSTRINGS' as MuscleGroup, setTarget: 3, exerciseId: 'rdl', reps: '8-12', notes: 'Hamstring Hinge (RDL / SLDL / Good Morning) — Isquios Bisagra (RDL / Piernas Rígidas / Buenos Días)' },
            { muscle: 'QUADS' as MuscleGroup, setTarget: 2, exerciseId: 'sq_bar', reps: '8-12', notes: 'Quads (Squat / Leg Press / Hack) — Cuádriceps (Sentadilla / Prensa / Hack)' },
        ]
    },
];

export const RP_CB_3X_TEMPLATE: GlobalTemplate = {
    id: 'rp_cb_3x',
    name: 'rp_cb_3x',
    title: { en: 'RP MPT Chest & Back (3 Days)', es: 'RP MPT Pecho y Espalda (3 Días)' },
    description: {
        en: '3-Day torso specialization routine. Concentrates maximal volume on upper/horizontal chest and lat/upper-back thickness.',
        es: 'Especialización de torso en 3 días. Concentra volumen máximo en pecho y amplitud/grosor de espalda manteniendo las piernas.'
    },
    isPro: false,
    order: 27,
    guidelineImages: RP_GUIDELINE_IMAGES,
    program: RP_CB_3X_PROGRAM
};

export const RP_CB_4X_PROGRAM: ProgramDay[] = [
    {
        id: 'rp_cb_4x_d1',
        dayName: { en: 'Day 1: Chest & Push', es: 'Día 1: Pecho y Empuje' },
        slots: [
            { muscle: 'CHEST' as MuscleGroup, setTarget: 3, exerciseId: 'bp_inc_bar', reps: '8-12', notes: 'Incline Push (Barbell / DB / Machine) — Empuje Inclinado (Barra / Mancuerna / Máquina)' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 3, exerciseId: 'pec_fly', reps: '8-12', notes: 'Chest Isolation (Pec Dec / Cable Flye / DB Flye) — Aislamiento Pecho (Pec Dec / Aperturas Polea)' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 2, exerciseId: 'bp_bar', reps: '8-12', notes: 'Horizontal Push (Bench / DB / Machine Press) — Empuje Horizontal (Banca Plana / Mancuerna / Máquina)' },
            { muscle: 'TRICEPS' as MuscleGroup, setTarget: 3, exerciseId: 'tri_ext', reps: '8-12', notes: 'Vertical Triceps (Overhead Triceps Extensions) — Tríceps Vertical (Extensiones por encima de la cabeza)' },
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 3, exerciseId: 'lat_raise', reps: '8-12', notes: 'Side Delts (Lateral Raises / Upright Row) — Deltoide Lateral (Elevaciones Laterales / Remo al Cuello)' },
            { muscle: 'QUADS' as MuscleGroup, setTarget: 3, exerciseId: 'sq_bar', reps: '8-12', notes: 'Quads (Squat / Leg Press / Hack) — Cuádriceps (Sentadilla / Prensa / Hack)' },
            { muscle: 'CALVES' as MuscleGroup, setTarget: 4, exerciseId: 'calf_raise', reps: '12-15', notes: 'Calves (Standing / Machine / Leg Press) — Gemelos (De Pie / Máquina / Prensa)' },
        ]
    },
    {
        id: 'rp_cb_4x_d2',
        dayName: { en: 'Day 2: Back & Pull', es: 'Día 2: Espalda y Tracción' },
        slots: [
            { muscle: 'BACK' as MuscleGroup, setTarget: 3, exerciseId: 'lat_pull', reps: '8-12', notes: 'Vertical Pull (Pulldowns / Pullups / Chinups) — Tracción Vertical (Jalones / Dominadas)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 3, exerciseId: 'lat_pull', reps: '8-12', notes: 'Vertical Pull (Pulldowns / Pullups / Chinups) — Tracción Vertical (Jalones / Dominadas)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 2, exerciseId: 'bent_barbell_row', reps: '8-12', notes: 'Horizontal Pull (Barbell / DB / Cable Row) — Tracción Horizontal (Remo Barra / Mancuerna / Polea)' },
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 3, exerciseId: 'rear_delt_fly', reps: '8-12', notes: 'Rear or Side Delts — Deltoide Posterior o Lateral' },
            { muscle: 'BICEPS' as MuscleGroup, setTarget: 3, exerciseId: 'curl_bar', reps: '8-12', notes: 'Biceps (Barbell / DB / Cable Curl) — Bíceps (Curl Barra / Mancuerna / Polea)' },
            { muscle: 'ABS' as MuscleGroup, setTarget: 3, exerciseId: 'knee_raise', reps: '12-15', notes: 'Abs (Hanging Knee/Leg Raises / Cable Crunches) — Abdomen (Elevaciones de Piernas / Encogimientos Polea)' },
            { muscle: 'HAMSTRINGS' as MuscleGroup, setTarget: 2, exerciseId: 'leg_curl', reps: '8-12', notes: 'Hamstring Isolation (Seated/Lying Leg Curl) — Isquios Aislamiento (Curl Femoral Sentado/Tumbado)' },
        ]
    },
    {
        id: 'rp_cb_4x_d3',
        dayName: { en: 'Day 3: Chest & Push', es: 'Día 3: Pecho y Empuje' },
        slots: [
            { muscle: 'CHEST' as MuscleGroup, setTarget: 3, exerciseId: 'bp_bar', reps: '8-12', notes: 'Horizontal Push (Bench / DB / Machine Press) — Empuje Horizontal (Banca Plana / Mancuerna / Máquina)' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 3, exerciseId: 'pec_fly', reps: '8-12', notes: 'Chest Isolation (Pec Dec / Cable Flye / DB Flye) — Aislamiento Pecho (Pec Dec / Aperturas Polea)' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 2, exerciseId: 'bp_inc_bar', reps: '8-12', notes: 'Incline Push (Barbell / DB / Machine) — Empuje Inclinado (Barra / Mancuerna / Máquina)' },
            { muscle: 'TRICEPS' as MuscleGroup, setTarget: 3, exerciseId: 'tri_push', reps: '8-12', notes: 'Horizontal Triceps (Pushdowns / Dips / Skullcrushers) — Tríceps Horizontal (Polea / Fondos / Francés)' },
            { muscle: 'GLUTES' as MuscleGroup, setTarget: 3, exerciseId: 'glute_bridge', reps: '8-12', notes: 'Glutes (Bridge / Lunge / Sumo DL) — Glúteos (Puente / Zancadas / Peso Muerto Sumo)' },
            { muscle: 'QUADS' as MuscleGroup, setTarget: 3, exerciseId: 'sq_bar', reps: '8-12', notes: 'Quads (Squat / Leg Press / Hack) — Cuádriceps (Sentadilla / Prensa / Hack)' },
            { muscle: 'CALVES' as MuscleGroup, setTarget: 4, exerciseId: 'calf_raise', reps: '12-15', notes: 'Calves (Standing / Machine / Leg Press) — Gemelos (De Pie / Máquina / Prensa)' },
        ]
    },
    {
        id: 'rp_cb_4x_d4',
        dayName: { en: 'Day 4: Back & Pull', es: 'Día 4: Espalda y Tracción' },
        slots: [
            { muscle: 'BACK' as MuscleGroup, setTarget: 3, exerciseId: 'bent_barbell_row', reps: '8-12', notes: 'Horizontal Pull (Barbell / DB / Cable Row) — Tracción Horizontal (Remo Barra / Mancuerna / Polea)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 3, exerciseId: 'bent_barbell_row', reps: '8-12', notes: 'Horizontal Pull (Barbell / DB / Cable Row) — Tracción Horizontal (Remo Barra / Mancuerna / Polea)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 3, exerciseId: 'lat_pull', reps: '8-12', notes: 'Vertical Pull (Pulldowns / Pullups / Chinups) — Tracción Vertical (Jalones / Dominadas)' },
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 3, exerciseId: 'rear_delt_fly', reps: '8-12', notes: 'Rear Delts (Facepulls / Rear Delt Flyes) — Deltoide Posterior (Pájaros / Facepulls)' },
            { muscle: 'BICEPS' as MuscleGroup, setTarget: 3, exerciseId: 'curl_bar', reps: '8-12', notes: 'Biceps (Barbell / DB / Cable Curl) — Bíceps (Curl Barra / Mancuerna / Polea)' },
            { muscle: 'ABS' as MuscleGroup, setTarget: 3, exerciseId: 'knee_raise', reps: '12-15', notes: 'Abs (Hanging Knee/Leg Raises / Cable Crunches) — Abdomen (Elevaciones de Piernas / Encogimientos Polea)' },
            { muscle: 'HAMSTRINGS' as MuscleGroup, setTarget: 3, exerciseId: 'rdl', reps: '8-12', notes: 'Hamstring Hinge (RDL / SLDL / Good Morning) — Isquios Bisagra (RDL / Piernas Rígidas / Buenos Días)' },
        ]
    },
];

export const RP_CB_4X_TEMPLATE: GlobalTemplate = {
    id: 'rp_cb_4x',
    name: 'rp_cb_4x',
    title: { en: 'RP MPT Chest & Back (4 Days)', es: 'RP MPT Pecho y Espalda (4 Días)' },
    description: {
        en: '4-Day Chest & Back specialization split. Alternating dedicated Chest-emphasis and Back-emphasis sessions for maximum upper body growth.',
        es: 'Especialización en 4 días alternando días de Pecho y días de Espalda para maximizar el crecimiento del tren superior.'
    },
    isPro: false,
    order: 28,
    guidelineImages: RP_GUIDELINE_IMAGES,
    program: RP_CB_4X_PROGRAM
};

export const RP_CB_5X_PROGRAM: ProgramDay[] = [
    {
        id: 'rp_cb_5x_d1',
        dayName: { en: 'Day 1: Chest Upper', es: 'Día 1: Pecho y Tren Superior' },
        slots: [
            { muscle: 'CHEST' as MuscleGroup, setTarget: 3, exerciseId: 'bp_inc_bar', reps: '8-12', notes: 'Incline Push (Barbell / DB / Machine) — Empuje Inclinado (Barra / Mancuerna / Máquina)' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 3, exerciseId: 'pec_fly', reps: '8-12', notes: 'Chest Isolation (Pec Dec / Cable Flye / DB Flye) — Aislamiento Pecho (Pec Dec / Aperturas Polea)' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 2, exerciseId: 'bp_bar', reps: '8-12', notes: 'Horizontal Push (Bench / DB / Machine Press) — Empuje Horizontal (Banca Plana / Mancuerna / Máquina)' },
            { muscle: 'TRICEPS' as MuscleGroup, setTarget: 3, exerciseId: 'tri_push', reps: '8-12', notes: 'Triceps (Pushdowns / Dips / Skullcrushers) — Tríceps (Extensiones en Polea / Fondos / Press Francés)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 3, exerciseId: 'bent_barbell_row', reps: '8-12', notes: 'Horizontal Pull (Barbell / DB / Cable Row) — Tracción Horizontal (Remo Barra / Mancuerna / Polea)' },
            { muscle: 'ABS' as MuscleGroup, setTarget: 3, exerciseId: 'knee_raise', reps: '12-15', notes: 'Abs (Hanging Knee/Leg Raises / Cable Crunches) — Abdomen (Elevaciones de Piernas / Encogimientos Polea)' },
        ]
    },
    {
        id: 'rp_cb_5x_d2',
        dayName: { en: 'Day 2: Legs Day', es: 'Día 2: Día Pierna' },
        slots: [
            { muscle: 'QUADS' as MuscleGroup, setTarget: 3, exerciseId: 'sq_bar', reps: '8-12', notes: 'Quads (Squat / Leg Press / Hack) — Cuádriceps (Sentadilla / Prensa / Hack)' },
            { muscle: 'QUADS' as MuscleGroup, setTarget: 3, exerciseId: 'sq_bar', reps: '8-12', notes: 'Quads (Squat / Leg Press / Hack) — Cuádriceps (Sentadilla / Prensa / Hack)' },
            { muscle: 'HAMSTRINGS' as MuscleGroup, setTarget: 3, exerciseId: 'leg_curl', reps: '8-12', notes: 'Hamstring Isolation (Seated/Lying Leg Curl) — Isquios Aislamiento (Curl Femoral Sentado/Tumbado)' },
            { muscle: 'CALVES' as MuscleGroup, setTarget: 6, exerciseId: 'calf_raise', reps: '12-15', notes: 'Calves (Standing / Machine / Leg Press) — Gemelos (De Pie / Máquina / Prensa)' },
        ]
    },
    {
        id: 'rp_cb_5x_d3',
        dayName: { en: 'Day 3: Back Upper', es: 'Día 3: Espalda y Tren Superior' },
        slots: [
            { muscle: 'BACK' as MuscleGroup, setTarget: 3, exerciseId: 'lat_pull', reps: '8-12', notes: 'Vertical Pull (Pulldowns / Pullups / Chinups) — Tracción Vertical (Jalones / Dominadas)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 3, exerciseId: 'lat_pull', reps: '8-12', notes: 'Vertical Pull (Pulldowns / Pullups / Chinups) — Tracción Vertical (Jalones / Dominadas)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 3, exerciseId: 'bent_barbell_row', reps: '8-12', notes: 'Horizontal Pull (Barbell / DB / Cable Row) — Tracción Horizontal (Remo Barra / Mancuerna / Polea)' },
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 2, exerciseId: 'rear_delt_fly', reps: '8-12', notes: 'Rear or Side Delts — Deltoide Posterior o Lateral' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 3, exerciseId: 'bp_inc_bar', reps: '8-12', notes: 'Incline Push (Barbell / DB / Machine) — Empuje Inclinado (Barra / Mancuerna / Máquina)' },
            { muscle: 'ABS' as MuscleGroup, setTarget: 3, exerciseId: 'knee_raise', reps: '12-15', notes: 'Abs (Hanging Knee/Leg Raises / Cable Crunches) — Abdomen (Elevaciones de Piernas / Encogimientos Polea)' },
        ]
    },
    {
        id: 'rp_cb_5x_d4',
        dayName: { en: 'Day 4: Chest & Quads', es: 'Día 4: Pecho y Cuádriceps' },
        slots: [
            { muscle: 'CHEST' as MuscleGroup, setTarget: 3, exerciseId: 'bp_bar', reps: '8-12', notes: 'Horizontal Push (Bench / DB / Machine Press) — Empuje Horizontal (Banca Plana / Mancuerna / Máquina)' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 2, exerciseId: 'pec_fly', reps: '8-12', notes: 'Chest Isolation (Pec Dec / Cable Flye / DB Flye) — Aislamiento Pecho (Pec Dec / Aperturas Polea)' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 2, exerciseId: 'bp_inc_bar', reps: '8-12', notes: 'Incline Push (Barbell / DB / Machine) — Empuje Inclinado (Barra / Mancuerna / Máquina)' },
            { muscle: 'QUADS' as MuscleGroup, setTarget: 3, exerciseId: 'sq_bar', reps: '8-12', notes: 'Quads (Squat / Leg Press / Hack) — Cuádriceps (Sentadilla / Prensa / Hack)' },
            { muscle: 'CALVES' as MuscleGroup, setTarget: 6, exerciseId: 'calf_raise', reps: '12-15', notes: 'Calves (Standing / Machine / Leg Press) — Gemelos (De Pie / Máquina / Prensa)' },
        ]
    },
    {
        id: 'rp_cb_5x_d5',
        dayName: { en: 'Day 5: Back & Hamstrings', es: 'Día 5: Espalda e Isquios' },
        slots: [
            { muscle: 'BACK' as MuscleGroup, setTarget: 3, exerciseId: 'bent_barbell_row', reps: '8-12', notes: 'Horizontal Pull (Barbell / DB / Cable Row) — Tracción Horizontal (Remo Barra / Mancuerna / Polea)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 3, exerciseId: 'bent_barbell_row', reps: '8-12', notes: 'Horizontal Pull (Barbell / DB / Cable Row) — Tracción Horizontal (Remo Barra / Mancuerna / Polea)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 2, exerciseId: 'lat_pull', reps: '8-12', notes: 'Vertical Pull (Pulldowns / Pullups / Chinups) — Tracción Vertical (Jalones / Dominadas)' },
            { muscle: 'BICEPS' as MuscleGroup, setTarget: 3, exerciseId: 'curl_bar', reps: '8-12', notes: 'Biceps (Barbell / DB / Cable Curl) — Bíceps (Curl Barra / Mancuerna / Polea)' },
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 3, exerciseId: 'rear_delt_fly', reps: '8-12', notes: 'Rear or Side Delts — Deltoide Posterior o Lateral' },
            { muscle: 'HAMSTRINGS' as MuscleGroup, setTarget: 3, exerciseId: 'leg_curl', reps: '8-12', notes: 'Hamstring Isolation (Seated/Lying Leg Curl) — Isquios Aislamiento (Curl Femoral Sentado/Tumbado)' },
        ]
    },
];

export const RP_CB_5X_TEMPLATE: GlobalTemplate = {
    id: 'rp_cb_5x',
    name: 'rp_cb_5x',
    title: { en: 'RP MPT Chest & Back (5 Days)', es: 'RP MPT Pecho y Espalda (5 Días)' },
    description: {
        en: '5-Day torso hypertrophy split. High frequency horizontal/incline pushes, vertical/horizontal pulls, and isolation finishers.',
        es: 'Rutina de 5 días de hipertrofia para torso. Alta frecuencia en empujes y tracciones con aislamiento de soporte.'
    },
    isPro: false,
    order: 29,
    guidelineImages: RP_GUIDELINE_IMAGES,
    program: RP_CB_5X_PROGRAM
};

export const RP_CB_6X_PROGRAM: ProgramDay[] = [
    {
        id: 'rp_cb_6x_d1',
        dayName: { en: 'Day 1: Chest Focused Upper', es: 'Día 1: Tren Superior (Enfoque Pecho)' },
        slots: [
            { muscle: 'CHEST' as MuscleGroup, setTarget: 2, exerciseId: 'bp_inc_bar', reps: '8-12', notes: 'Incline Push (Barbell / DB / Machine) — Empuje Inclinado (Barra / Mancuerna / Máquina)' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 2, exerciseId: 'pec_fly', reps: '8-12', notes: 'Chest Isolation (Pec Dec / Cable Flye / DB Flye) — Aislamiento Pecho (Pec Dec / Aperturas Polea)' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 2, exerciseId: 'bp_bar', reps: '8-12', notes: 'Horizontal Push (Bench / DB / Machine Press) — Empuje Horizontal (Banca Plana / Mancuerna / Máquina)' },
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 3, exerciseId: 'lat_raise', reps: '8-12', notes: 'Side Delts (Lateral Raises / Upright Row) — Deltoide Lateral (Elevaciones Laterales / Remo al Cuello)' },
            { muscle: 'TRICEPS' as MuscleGroup, setTarget: 3, exerciseId: 'tri_push', reps: '8-12', notes: 'Triceps (Pushdowns / Dips / Skullcrushers) — Tríceps (Extensiones en Polea / Fondos / Press Francés)' },
        ]
    },
    {
        id: 'rp_cb_6x_d2',
        dayName: { en: 'Day 2: Back Focused Upper', es: 'Día 2: Tren Superior (Enfoque Espalda)' },
        slots: [
            { muscle: 'BACK' as MuscleGroup, setTarget: 2, exerciseId: 'lat_pull', reps: '8-12', notes: 'Vertical Pull (Pulldowns / Pullups / Chinups) — Tracción Vertical (Jalones / Dominadas)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 2, exerciseId: 'lat_pull', reps: '8-12', notes: 'Vertical Pull (Pulldowns / Pullups / Chinups) — Tracción Vertical (Jalones / Dominadas)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 2, exerciseId: 'bent_barbell_row', reps: '8-12', notes: 'Horizontal Pull (Barbell / DB / Cable Row) — Tracción Horizontal (Remo Barra / Mancuerna / Polea)' },
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 3, exerciseId: 'rear_delt_fly', reps: '8-12', notes: 'Rear Delts (Facepulls / Rear Delt Flyes) — Deltoide Posterior (Pájaros / Facepulls)' },
            { muscle: 'BICEPS' as MuscleGroup, setTarget: 3, exerciseId: 'curl_bar', reps: '8-12', notes: 'Biceps (Barbell / DB / Cable Curl) — Bíceps (Curl Barra / Mancuerna / Polea)' },
        ]
    },
    {
        id: 'rp_cb_6x_d3',
        dayName: { en: 'Day 3: Chest Focused Upper', es: 'Día 3: Tren Superior (Enfoque Pecho)' },
        slots: [
            { muscle: 'CHEST' as MuscleGroup, setTarget: 2, exerciseId: 'bp_inc_bar', reps: '8-12', notes: 'Incline Push (Barbell / DB / Machine) — Empuje Inclinado (Barra / Mancuerna / Máquina)' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 2, exerciseId: 'bp_bar', reps: '8-12', notes: 'Horizontal Push (Bench / DB / Machine Press) — Empuje Horizontal (Banca Plana / Mancuerna / Máquina)' },
            { muscle: 'QUADS' as MuscleGroup, setTarget: 4, exerciseId: 'sq_bar', reps: '8-12', notes: 'Quads (Squat / Leg Press / Hack) — Cuádriceps (Sentadilla / Prensa / Hack)' },
            { muscle: 'CALVES' as MuscleGroup, setTarget: 4, exerciseId: 'calf_raise', reps: '12-15', notes: 'Calves (Standing / Machine / Leg Press) — Gemelos (De Pie / Máquina / Prensa)' },
            { muscle: 'ABS' as MuscleGroup, setTarget: 3, exerciseId: 'knee_raise', reps: '12-15', notes: 'Abs (Hanging Knee/Leg Raises / Cable Crunches) — Abdomen (Elevaciones de Piernas / Encogimientos Polea)' },
        ]
    },
    {
        id: 'rp_cb_6x_d4',
        dayName: { en: 'Day 4: Back Focused Upper', es: 'Día 4: Tren Superior (Enfoque Espalda)' },
        slots: [
            { muscle: 'BACK' as MuscleGroup, setTarget: 2, exerciseId: 'bent_barbell_row', reps: '8-12', notes: 'Horizontal Pull (Barbell / DB / Cable Row) — Tracción Horizontal (Remo Barra / Mancuerna / Polea)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 2, exerciseId: 'bent_barbell_row', reps: '8-12', notes: 'Horizontal Pull (Barbell / DB / Cable Row) — Tracción Horizontal (Remo Barra / Mancuerna / Polea)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 2, exerciseId: 'lat_pull', reps: '8-12', notes: 'Vertical Pull (Pulldowns / Pullups / Chinups) — Tracción Vertical (Jalones / Dominadas)' },
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 3, exerciseId: 'rear_delt_fly', reps: '8-12', notes: 'Rear Delts (Facepulls / Rear Delt Flyes) — Deltoide Posterior (Pájaros / Facepulls)' },
            { muscle: 'BICEPS' as MuscleGroup, setTarget: 3, exerciseId: 'curl_bar', reps: '8-12', notes: 'Biceps (Barbell / DB / Cable Curl) — Bíceps (Curl Barra / Mancuerna / Polea)' },
        ]
    },
    {
        id: 'rp_cb_6x_d5',
        dayName: { en: 'Day 5: Chest Focused Upper', es: 'Día 5: Tren Superior (Enfoque Pecho)' },
        slots: [
            { muscle: 'CHEST' as MuscleGroup, setTarget: 2, exerciseId: 'bp_bar', reps: '8-12', notes: 'Horizontal Push (Bench / DB / Machine Press) — Empuje Horizontal (Banca Plana / Mancuerna / Máquina)' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 2, exerciseId: 'pec_fly', reps: '8-12', notes: 'Chest Isolation (Pec Dec / Cable Flye / DB Flye) — Aislamiento Pecho (Pec Dec / Aperturas Polea)' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 2, exerciseId: 'bp_inc_bar', reps: '8-12', notes: 'Incline Push (Barbell / DB / Machine) — Empuje Inclinado (Barra / Mancuerna / Máquina)' },
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 3, exerciseId: 'lat_raise', reps: '8-12', notes: 'Side Delts (Lateral Raises / Upright Row) — Deltoide Lateral (Elevaciones Laterales / Remo al Cuello)' },
            { muscle: 'TRICEPS' as MuscleGroup, setTarget: 3, exerciseId: 'tri_push', reps: '8-12', notes: 'Triceps (Pushdowns / Dips / Skullcrushers) — Tríceps (Extensiones en Polea / Fondos / Press Francés)' },
        ]
    },
    {
        id: 'rp_cb_6x_d6',
        dayName: { en: 'Day 6: Back Focused Upper', es: 'Día 6: Tren Superior (Enfoque Espalda)' },
        slots: [
            { muscle: 'BACK' as MuscleGroup, setTarget: 2, exerciseId: 'bent_barbell_row', reps: '8-12', notes: 'Horizontal Pull (Barbell / DB / Cable Row) — Tracción Horizontal (Remo Barra / Mancuerna / Polea)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 2, exerciseId: 'bent_barbell_row', reps: '8-12', notes: 'Horizontal Pull (Barbell / DB / Cable Row) — Tracción Horizontal (Remo Barra / Mancuerna / Polea)' },
            { muscle: 'GLUTES' as MuscleGroup, setTarget: 4, exerciseId: 'glute_bridge', reps: '8-12', notes: 'Glutes (Bridge / Lunge / Sumo DL) — Glúteos (Puente / Zancadas / Peso Muerto Sumo)' },
            { muscle: 'HAMSTRINGS' as MuscleGroup, setTarget: 4, exerciseId: 'rdl', reps: '8-12', notes: 'Hamstring Hinge (RDL / SLDL / Good Morning) — Isquios Bisagra (RDL / Piernas Rígidas / Buenos Días)' },
            { muscle: 'CALVES' as MuscleGroup, setTarget: 4, exerciseId: 'calf_raise', reps: '12-15', notes: 'Calves (Standing / Machine / Leg Press) — Gemelos (De Pie / Máquina / Prensa)' },
            { muscle: 'ABS' as MuscleGroup, setTarget: 3, exerciseId: 'knee_raise', reps: '12-15', notes: 'Abs (Hanging Knee/Leg Raises / Cable Crunches) — Abdomen (Elevaciones de Piernas / Encogimientos Polea)' },
        ]
    },
];

export const RP_CB_6X_TEMPLATE: GlobalTemplate = {
    id: 'rp_cb_6x',
    name: 'rp_cb_6x',
    title: { en: 'RP MPT Chest & Back (6 Days)', es: 'RP MPT Pecho y Espalda (6 Días)' },
    description: {
        en: '6-Day high-frequency Chest & Back builder. 3 dedicated chest days and 3 dedicated back days distributed throughout the week.',
        es: 'Rutina de 6 días de alta frecuencia para pecho y espalda. 3 días dedicados a pecho y 3 días dedicados a espalda a lo largo de la semana.'
    },
    isPro: false,
    order: 30,
    guidelineImages: RP_GUIDELINE_IMAGES,
    program: RP_CB_6X_PROGRAM
};

export const RP_LEGS_4X_PROGRAM: ProgramDay[] = [
    {
        id: 'rp_legs_4x_d1',
        dayName: { en: 'Day 1: Heavy Quads', es: 'Día 1: Cuádriceps Pesado' },
        slots: [
            { muscle: 'QUADS' as MuscleGroup, setTarget: 3, exerciseId: 'sq_bar', reps: '8-12', notes: 'Quads (Squat / Leg Press / Hack) — Cuádriceps (Sentadilla / Prensa / Hack)' },
            { muscle: 'QUADS' as MuscleGroup, setTarget: 3, exerciseId: 'sq_bar', reps: '8-12', notes: 'Quads (Squat / Leg Press / Hack) — Cuádriceps (Sentadilla / Prensa / Hack)' },
            { muscle: 'HAMSTRINGS' as MuscleGroup, setTarget: 3, exerciseId: 'leg_curl', reps: '8-12', notes: 'Hamstring Isolation (Seated/Lying Leg Curl) — Isquios Aislamiento (Curl Femoral Sentado/Tumbado)' },
            { muscle: 'CALVES' as MuscleGroup, setTarget: 6, exerciseId: 'calf_raise', reps: '12-15', notes: 'Calves (Standing / Machine / Leg Press) — Gemelos (De Pie / Máquina / Prensa)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 3, exerciseId: 'lat_pull', reps: '8-12', notes: 'Vertical Pull (Pulldowns / Pullups / Chinups) — Tracción Vertical (Jalones / Dominadas)' },
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 3, exerciseId: 'rear_delt_fly', reps: '8-12', notes: 'Rear or Side Delts — Deltoide Posterior o Lateral' },
        ]
    },
    {
        id: 'rp_legs_4x_d2',
        dayName: { en: 'Day 2: Heavy Glutes', es: 'Día 2: Glúteos Pesado' },
        slots: [
            { muscle: 'GLUTES' as MuscleGroup, setTarget: 3, exerciseId: 'glute_bridge', reps: '8-12', notes: 'Glutes (Bridge / Lunge / Sumo DL) — Glúteos (Puente / Zancadas / Peso Muerto Sumo)' },
            { muscle: 'GLUTES' as MuscleGroup, setTarget: 3, exerciseId: 'glute_bridge', reps: '8-12', notes: 'Glutes (Bridge / Lunge / Sumo DL) — Glúteos (Puente / Zancadas / Peso Muerto Sumo)' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 3, exerciseId: 'bp_inc_bar', reps: '8-12', notes: 'Incline Push (Barbell / DB / Machine) — Empuje Inclinado (Barra / Mancuerna / Máquina)' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 3, exerciseId: 'bp_bar', reps: '8-12', notes: 'Horizontal Push (Bench / DB / Machine Press) — Empuje Horizontal (Banca Plana / Mancuerna / Máquina)' },
            { muscle: 'TRICEPS' as MuscleGroup, setTarget: 3, exerciseId: 'tri_push', reps: '8-12', notes: 'Triceps (Pushdowns / Dips / Skullcrushers) — Tríceps (Extensiones en Polea / Fondos / Press Francés)' },
            { muscle: 'ABS' as MuscleGroup, setTarget: 3, exerciseId: 'knee_raise', reps: '12-15', notes: 'Abs (Hanging Knee/Leg Raises / Cable Crunches) — Abdomen (Elevaciones de Piernas / Encogimientos Polea)' },
        ]
    },
    {
        id: 'rp_legs_4x_d3',
        dayName: { en: 'Day 3: High Rep Quads', es: 'Día 3: Cuádriceps Reps Altas' },
        slots: [
            { muscle: 'QUADS' as MuscleGroup, setTarget: 3, exerciseId: 'sq_bar', reps: '8-12', notes: 'Quads (Squat / Leg Press / Hack) — Cuádriceps (Sentadilla / Prensa / Hack)' },
            { muscle: 'QUADS' as MuscleGroup, setTarget: 3, exerciseId: 'sq_bar', reps: '8-12', notes: 'Quads (Squat / Leg Press / Hack) — Cuádriceps (Sentadilla / Prensa / Hack)' },
            { muscle: 'CALVES' as MuscleGroup, setTarget: 6, exerciseId: 'calf_raise', reps: '12-15', notes: 'Calves (Standing / Machine / Leg Press) — Gemelos (De Pie / Máquina / Prensa)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 3, exerciseId: 'bent_barbell_row', reps: '8-12', notes: 'Horizontal Pull (Barbell / DB / Cable Row) — Tracción Horizontal (Remo Barra / Mancuerna / Polea)' },
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 3, exerciseId: 'rear_delt_fly', reps: '8-12', notes: 'Rear or Side Delts — Deltoide Posterior o Lateral' },
            { muscle: 'BICEPS' as MuscleGroup, setTarget: 3, exerciseId: 'curl_bar', reps: '8-12', notes: 'Biceps (Barbell / DB / Cable Curl) — Bíceps (Curl Barra / Mancuerna / Polea)' },
        ]
    },
    {
        id: 'rp_legs_4x_d4',
        dayName: { en: 'Day 4: High Rep Hamstrings', es: 'Día 4: Isquios Reps Altas' },
        slots: [
            { muscle: 'HAMSTRINGS' as MuscleGroup, setTarget: 3, exerciseId: 'leg_curl', reps: '8-12', notes: 'Hamstring Isolation (Seated/Lying Leg Curl) — Isquios Aislamiento (Curl Femoral Sentado/Tumbado)' },
            { muscle: 'HAMSTRINGS' as MuscleGroup, setTarget: 3, exerciseId: 'rdl', reps: '8-12', notes: 'Hamstring Hinge (RDL / SLDL / Good Morning) — Isquios Bisagra (RDL / Piernas Rígidas / Buenos Días)' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 3, exerciseId: 'bp_bar', reps: '8-12', notes: 'Horizontal Push (Bench / DB / Machine Press) — Empuje Horizontal (Banca Plana / Mancuerna / Máquina)' },
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 3, exerciseId: 'ohp', reps: '8-12', notes: 'Front Delts (Standing/Seated Overhead Press) — Deltoide Frontal (Press Militar Barra / Mancuerna)' },
            { muscle: 'TRAPS' as MuscleGroup, setTarget: 3, exerciseId: 'shrug_db', reps: '8-12', notes: 'Traps (Barbell / DB Shrugs) — Trapecios (Encogimientos Barra / Mancuerna)' },
            { muscle: 'ABS' as MuscleGroup, setTarget: 3, exerciseId: 'knee_raise', reps: '12-15', notes: 'Abs (Hanging Knee/Leg Raises / Cable Crunches) — Abdomen (Elevaciones de Piernas / Encogimientos Polea)' },
        ]
    },
];

export const RP_LEGS_4X_TEMPLATE: GlobalTemplate = {
    id: 'rp_legs_4x',
    name: 'rp_legs_4x',
    title: { en: 'RP MPT Legs Focus (4 Days)', es: 'RP MPT Especialización Pierna (4 Días)' },
    description: {
        en: '4-Day lower body specialization. Heavy Quads, Heavy Glutes, High-Rep Quads, and High-Rep Hamstrings/Calves with upper body maintenance.',
        es: 'Especialización en pierna de 4 días: Cuádriceps Pesado, Glúteos Pesado, Cuádriceps Reps Altas e Isquios/Gemelos con mantenimiento de torso.'
    },
    isPro: false,
    order: 31,
    guidelineImages: RP_GUIDELINE_IMAGES,
    program: RP_LEGS_4X_PROGRAM
};

export const RP_LEGS_5X_PROGRAM: ProgramDay[] = [
    {
        id: 'rp_legs_5x_d1',
        dayName: { en: 'Day 1: Quad Focused Legs', es: 'Día 1: Piernas (Enfoque Cuádriceps)' },
        slots: [
            { muscle: 'QUADS' as MuscleGroup, setTarget: 3, exerciseId: 'sq_bar', reps: '8-12', notes: 'Quads (Squat / Leg Press / Hack) — Cuádriceps (Sentadilla / Prensa / Hack)' },
            { muscle: 'QUADS' as MuscleGroup, setTarget: 3, exerciseId: 'sq_bar', reps: '8-12', notes: 'Quads (Squat / Leg Press / Hack) — Cuádriceps (Sentadilla / Prensa / Hack)' },
            { muscle: 'HAMSTRINGS' as MuscleGroup, setTarget: 3, exerciseId: 'leg_curl', reps: '8-12', notes: 'Hamstring Isolation (Seated/Lying Leg Curl) — Isquios Aislamiento (Curl Femoral Sentado/Tumbado)' },
            { muscle: 'CALVES' as MuscleGroup, setTarget: 6, exerciseId: 'calf_raise', reps: '12-15', notes: 'Calves (Standing / Machine / Leg Press) — Gemelos (De Pie / Máquina / Prensa)' },
            { muscle: 'ABS' as MuscleGroup, setTarget: 3, exerciseId: 'knee_raise', reps: '12-15', notes: 'Abs (Hanging Knee/Leg Raises / Cable Crunches) — Abdomen (Elevaciones de Piernas / Encogimientos Polea)' },
        ]
    },
    {
        id: 'rp_legs_5x_d2',
        dayName: { en: 'Day 2: Chest & Back', es: 'Día 2: Pecho y Espalda' },
        slots: [
            { muscle: 'CHEST' as MuscleGroup, setTarget: 3, exerciseId: 'bp_inc_bar', reps: '8-12', notes: 'Incline Push (Barbell / DB / Machine) — Empuje Inclinado (Barra / Mancuerna / Máquina)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 3, exerciseId: 'lat_pull', reps: '8-12', notes: 'Vertical Pull (Pulldowns / Pullups / Chinups) — Tracción Vertical (Jalones / Dominadas)' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 3, exerciseId: 'bp_bar', reps: '8-12', notes: 'Horizontal Push (Bench / DB / Machine Press) — Empuje Horizontal (Banca Plana / Mancuerna / Máquina)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 3, exerciseId: 'bent_barbell_row', reps: '8-12', notes: 'Horizontal Pull (Barbell / DB / Cable Row) — Tracción Horizontal (Remo Barra / Mancuerna / Polea)' },
        ]
    },
    {
        id: 'rp_legs_5x_d3',
        dayName: { en: 'Day 3: Glute & Hamstring Focused Legs', es: 'Día 3: Piernas (Glúteo e Isquios)' },
        slots: [
            { muscle: 'GLUTES' as MuscleGroup, setTarget: 3, exerciseId: 'glute_bridge', reps: '8-12', notes: 'Glutes (Bridge / Lunge / Sumo DL) — Glúteos (Puente / Zancadas / Peso Muerto Sumo)' },
            { muscle: 'GLUTES' as MuscleGroup, setTarget: 3, exerciseId: 'glute_bridge', reps: '8-12', notes: 'Glutes (Bridge / Lunge / Sumo DL) — Glúteos (Puente / Zancadas / Peso Muerto Sumo)' },
            { muscle: 'HAMSTRINGS' as MuscleGroup, setTarget: 3, exerciseId: 'rdl', reps: '8-12', notes: 'Hamstring Hinge (RDL / SLDL / Good Morning) — Isquios Bisagra (RDL / Piernas Rígidas / Buenos Días)' },
            { muscle: 'HAMSTRINGS' as MuscleGroup, setTarget: 3, exerciseId: 'leg_curl', reps: '8-12', notes: 'Hamstring Isolation (Seated/Lying Leg Curl) — Isquios Aislamiento (Curl Femoral Sentado/Tumbado)' },
            { muscle: 'CALVES' as MuscleGroup, setTarget: 6, exerciseId: 'calf_raise', reps: '12-15', notes: 'Calves (Standing / Machine / Leg Press) — Gemelos (De Pie / Máquina / Prensa)' },
            { muscle: 'ABS' as MuscleGroup, setTarget: 3, exerciseId: 'knee_raise', reps: '12-15', notes: 'Abs (Hanging Knee/Leg Raises / Cable Crunches) — Abdomen (Elevaciones de Piernas / Encogimientos Polea)' },
        ]
    },
    {
        id: 'rp_legs_5x_d4',
        dayName: { en: 'Day 4: Shoulders & Arms', es: 'Día 4: Hombros y Brazos' },
        slots: [
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 3, exerciseId: 'rear_delt_fly', reps: '8-12', notes: 'Rear or Side Delts — Deltoide Posterior o Lateral' },
            { muscle: 'TRICEPS' as MuscleGroup, setTarget: 3, exerciseId: 'tri_push', reps: '8-12', notes: 'Triceps (Pushdowns / Dips / Skullcrushers) — Tríceps (Extensiones en Polea / Fondos / Press Francés)' },
            { muscle: 'BICEPS' as MuscleGroup, setTarget: 3, exerciseId: 'curl_bar', reps: '8-12', notes: 'Biceps (Barbell / DB / Cable Curl) — Bíceps (Curl Barra / Mancuerna / Polea)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 3, exerciseId: 'bent_barbell_row', reps: '8-12', notes: 'Horizontal Pull (Barbell / DB / Cable Row) — Tracción Horizontal (Remo Barra / Mancuerna / Polea)' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 3, exerciseId: 'bp_bar', reps: '8-12', notes: 'Horizontal Push (Bench / DB / Machine Press) — Empuje Horizontal (Banca Plana / Mancuerna / Máquina)' },
        ]
    },
    {
        id: 'rp_legs_5x_d5',
        dayName: { en: 'Day 5: Legs (Lower Reps & Sets)', es: 'Día 5: Piernas (Menos Volumen / Más Pesado)' },
        slots: [
            { muscle: 'GLUTES' as MuscleGroup, setTarget: 3, exerciseId: 'glute_bridge', reps: '8-12', notes: 'Glutes (Bridge / Lunge / Sumo DL) — Glúteos (Puente / Zancadas / Peso Muerto Sumo)' },
            { muscle: 'HAMSTRINGS' as MuscleGroup, setTarget: 3, exerciseId: 'rdl', reps: '8-12', notes: 'Hamstring Hinge (RDL / SLDL / Good Morning) — Isquios Bisagra (RDL / Piernas Rígidas / Buenos Días)' },
            { muscle: 'QUADS' as MuscleGroup, setTarget: 3, exerciseId: 'sq_bar', reps: '8-12', notes: 'Quads (Squat / Leg Press / Hack) — Cuádriceps (Sentadilla / Prensa / Hack)' },
            { muscle: 'CALVES' as MuscleGroup, setTarget: 4, exerciseId: 'calf_raise', reps: '12-15', notes: 'Calves (Standing / Machine / Leg Press) — Gemelos (De Pie / Máquina / Prensa)' },
            { muscle: 'ABS' as MuscleGroup, setTarget: 3, exerciseId: 'knee_raise', reps: '12-15', notes: 'Abs (Hanging Knee/Leg Raises / Cable Crunches) — Abdomen (Elevaciones de Piernas / Encogimientos Polea)' },
        ]
    },
];

export const RP_LEGS_5X_TEMPLATE: GlobalTemplate = {
    id: 'rp_legs_5x',
    name: 'rp_legs_5x',
    title: { en: 'RP MPT Legs Focus (5 Days)', es: 'RP MPT Especialización Pierna (5 Días)' },
    description: {
        en: '5-Day lower body specialization. 3 targeted leg workouts per week covering quads, glutes, hamstrings, and calves with dedicated upper days.',
        es: 'Especialización en pierna de 5 días. 3 entrenamientos de pierna por semana cubriendo cuádriceps, glúteos, isquios y gemelos con días de torso.'
    },
    isPro: false,
    order: 32,
    guidelineImages: RP_GUIDELINE_IMAGES,
    program: RP_LEGS_5X_PROGRAM
};

export const RP_LEGS_6X_PROGRAM: ProgramDay[] = [
    {
        id: 'rp_legs_6x_d1',
        dayName: { en: 'Day 1: Quad Focused', es: 'Día 1: Enfoque Cuádriceps' },
        slots: [
            { muscle: 'QUADS' as MuscleGroup, setTarget: 3, exerciseId: 'sq_bar', reps: '8-12', notes: 'Quads (Squat / Leg Press / Hack) — Cuádriceps (Sentadilla / Prensa / Hack)' },
            { muscle: 'QUADS' as MuscleGroup, setTarget: 3, exerciseId: 'sq_bar', reps: '8-12', notes: 'Quads (Squat / Leg Press / Hack) — Cuádriceps (Sentadilla / Prensa / Hack)' },
            { muscle: 'HAMSTRINGS' as MuscleGroup, setTarget: 3, exerciseId: 'leg_curl', reps: '8-12', notes: 'Hamstring Isolation (Seated/Lying Leg Curl) — Isquios Aislamiento (Curl Femoral Sentado/Tumbado)' },
            { muscle: 'CALVES' as MuscleGroup, setTarget: 6, exerciseId: 'calf_raise', reps: '12-15', notes: 'Calves (Standing / Machine / Leg Press) — Gemelos (De Pie / Máquina / Prensa)' },
            { muscle: 'ABS' as MuscleGroup, setTarget: 3, exerciseId: 'knee_raise', reps: '12-15', notes: 'Abs (Hanging Knee/Leg Raises / Cable Crunches) — Abdomen (Elevaciones de Piernas / Encogimientos Polea)' },
        ]
    },
    {
        id: 'rp_legs_6x_d2',
        dayName: { en: 'Day 2: Upper Body Push', es: 'Día 2: Tren Superior Empuje' },
        slots: [
            { muscle: 'CHEST' as MuscleGroup, setTarget: 3, exerciseId: 'bp_inc_bar', reps: '8-12', notes: 'Incline Push (Barbell / DB / Machine) — Empuje Inclinado (Barra / Mancuerna / Máquina)' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 3, exerciseId: 'bp_bar', reps: '8-12', notes: 'Horizontal Push (Bench / DB / Machine Press) — Empuje Horizontal (Banca Plana / Mancuerna / Máquina)' },
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 3, exerciseId: 'ohp', reps: '8-12', notes: 'Front Delts (Standing/Seated Overhead Press) — Deltoide Frontal (Press Militar Barra / Mancuerna)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 3, exerciseId: 'lat_pull', reps: '8-12', notes: 'Vertical Pull (Pulldowns / Pullups / Chinups) — Tracción Vertical (Jalones / Dominadas)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 3, exerciseId: 'bent_barbell_row', reps: '8-12', notes: 'Horizontal Pull (Barbell / DB / Cable Row) — Tracción Horizontal (Remo Barra / Mancuerna / Polea)' },
        ]
    },
    {
        id: 'rp_legs_6x_d3',
        dayName: { en: 'Day 3: Glute Focused', es: 'Día 3: Enfoque Glúteos' },
        slots: [
            { muscle: 'GLUTES' as MuscleGroup, setTarget: 3, exerciseId: 'glute_bridge', reps: '8-12', notes: 'Glutes (Bridge / Lunge / Sumo DL) — Glúteos (Puente / Zancadas / Peso Muerto Sumo)' },
            { muscle: 'GLUTES' as MuscleGroup, setTarget: 3, exerciseId: 'glute_bridge', reps: '8-12', notes: 'Glutes (Bridge / Lunge / Sumo DL) — Glúteos (Puente / Zancadas / Peso Muerto Sumo)' },
            { muscle: 'QUADS' as MuscleGroup, setTarget: 3, exerciseId: 'sq_bar', reps: '8-12', notes: 'Quads (Squat / Leg Press / Hack) — Cuádriceps (Sentadilla / Prensa / Hack)' },
            { muscle: 'CALVES' as MuscleGroup, setTarget: 6, exerciseId: 'calf_raise', reps: '12-15', notes: 'Calves (Standing / Machine / Leg Press) — Gemelos (De Pie / Máquina / Prensa)' },
            { muscle: 'ABS' as MuscleGroup, setTarget: 3, exerciseId: 'knee_raise', reps: '12-15', notes: 'Abs (Hanging Knee/Leg Raises / Cable Crunches) — Abdomen (Elevaciones de Piernas / Encogimientos Polea)' },
        ]
    },
    {
        id: 'rp_legs_6x_d4',
        dayName: { en: 'Day 4: Upper Body Pull', es: 'Día 4: Tren Superior Tirón' },
        slots: [
            { muscle: 'BACK' as MuscleGroup, setTarget: 3, exerciseId: 'bent_barbell_row', reps: '8-12', notes: 'Horizontal Pull (Barbell / DB / Cable Row) — Tracción Horizontal (Remo Barra / Mancuerna / Polea)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 3, exerciseId: 'bent_barbell_row', reps: '8-12', notes: 'Horizontal Pull (Barbell / DB / Cable Row) — Tracción Horizontal (Remo Barra / Mancuerna / Polea)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 3, exerciseId: 'lat_pull', reps: '8-12', notes: 'Vertical Pull (Pulldowns / Pullups / Chinups) — Tracción Vertical (Jalones / Dominadas)' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 3, exerciseId: 'bp_bar', reps: '8-12', notes: 'Horizontal Push (Bench / DB / Machine Press) — Empuje Horizontal (Banca Plana / Mancuerna / Máquina)' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 3, exerciseId: 'bp_inc_bar', reps: '8-12', notes: 'Incline Push (Barbell / DB / Machine) — Empuje Inclinado (Barra / Mancuerna / Máquina)' },
        ]
    },
    {
        id: 'rp_legs_6x_d5',
        dayName: { en: 'Day 5: Hamstrings & Calves', es: 'Día 5: Isquios y Gemelos' },
        slots: [
            { muscle: 'HAMSTRINGS' as MuscleGroup, setTarget: 3, exerciseId: 'rdl', reps: '8-12', notes: 'Hamstring Hinge (RDL / SLDL / Good Morning) — Isquios Bisagra (RDL / Piernas Rígidas / Buenos Días)' },
            { muscle: 'HAMSTRINGS' as MuscleGroup, setTarget: 3, exerciseId: 'leg_curl', reps: '8-12', notes: 'Hamstring Isolation (Seated/Lying Leg Curl) — Isquios Aislamiento (Curl Femoral Sentado/Tumbado)' },
            { muscle: 'CALVES' as MuscleGroup, setTarget: 6, exerciseId: 'calf_raise', reps: '12-15', notes: 'Calves (Standing / Machine / Leg Press) — Gemelos (De Pie / Máquina / Prensa)' },
            { muscle: 'GLUTES' as MuscleGroup, setTarget: 3, exerciseId: 'glute_bridge', reps: '8-12', notes: 'Glutes (Bridge / Lunge / Sumo DL) — Glúteos (Puente / Zancadas / Peso Muerto Sumo)' },
            { muscle: 'ABS' as MuscleGroup, setTarget: 3, exerciseId: 'knee_raise', reps: '12-15', notes: 'Abs (Hanging Knee/Leg Raises / Cable Crunches) — Abdomen (Elevaciones de Piernas / Encogimientos Polea)' },
        ]
    },
    {
        id: 'rp_legs_6x_d6',
        dayName: { en: 'Day 6: Shoulders & Arms Upper', es: 'Día 6: Hombros y Brazos Torso' },
        slots: [
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 3, exerciseId: 'rear_delt_fly', reps: '8-12', notes: 'Rear or Side Delts — Deltoide Posterior o Lateral' },
            { muscle: 'BICEPS' as MuscleGroup, setTarget: 3, exerciseId: 'curl_bar', reps: '8-12', notes: 'Biceps (Barbell / DB / Cable Curl) — Bíceps (Curl Barra / Mancuerna / Polea)' },
            { muscle: 'TRAPS' as MuscleGroup, setTarget: 3, exerciseId: 'shrug_db', reps: '8-12', notes: 'Traps (Barbell / DB Shrugs) — Trapecios (Encogimientos Barra / Mancuerna)' },
            { muscle: 'TRICEPS' as MuscleGroup, setTarget: 3, exerciseId: 'tri_push', reps: '8-12', notes: 'Triceps (Pushdowns / Dips / Skullcrushers) — Tríceps (Extensiones en Polea / Fondos / Press Francés)' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 3, exerciseId: 'bp_inc_bar', reps: '8-12', notes: 'Incline Push (Barbell / DB / Machine) — Empuje Inclinado (Barra / Mancuerna / Máquina)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 3, exerciseId: 'lat_pull', reps: '8-12', notes: 'Vertical Pull (Pulldowns / Pullups / Chinups) — Tracción Vertical (Jalones / Dominadas)' },
        ]
    },
];

export const RP_LEGS_6X_TEMPLATE: GlobalTemplate = {
    id: 'rp_legs_6x',
    name: 'rp_legs_6x',
    title: { en: 'RP MPT Legs Focus (6 Days)', es: 'RP MPT Especialización Pierna (6 Días)' },
    description: {
        en: '6-Day extreme lower body specialization. Quad-focused, Glute-focused, and Hamstring/Calf-focused days alternated with upper push and pull maintenance.',
        es: 'Especialización extrema en piernas de 6 días. Días dedicados a Cuádriceps, Glúteos e Isquios/Gemelos alternados con empuje y tirón de mantenimiento.'
    },
    isPro: false,
    order: 33,
    guidelineImages: RP_GUIDELINE_IMAGES,
    program: RP_LEGS_6X_PROGRAM
};

export const RP_ADV_ARMS_6X_PROGRAM: ProgramDay[] = [
    {
        id: 'rp_adv_arms_6x_d1',
        dayName: { en: 'Day 1: Push Day', es: 'Día 1: Día Empuje' },
        slots: [
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 2, exerciseId: 'ohp', reps: '8-12', notes: 'Front Delts (Standing/Seated Overhead Press) — Deltoide Frontal (Press Militar Barra / Mancuerna)' },
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 2, exerciseId: 'ohp', reps: '8-12', notes: 'Front Delts (Standing/Seated Overhead Press) — Deltoide Frontal (Press Militar Barra / Mancuerna)' },
            { muscle: 'TRICEPS' as MuscleGroup, setTarget: 2, exerciseId: 'tri_ext', reps: '8-12', notes: 'Vertical Triceps (Overhead Triceps Extensions) — Tríceps Vertical (Extensiones por encima de la cabeza)' },
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 2, exerciseId: 'rear_delt_fly', reps: '8-12', notes: 'Rear or Side Delts — Deltoide Posterior o Lateral' },
            { muscle: 'BICEPS' as MuscleGroup, setTarget: 2, exerciseId: 'curl_bar', reps: '8-12', notes: 'Biceps (Barbell / DB / Cable Curl) — Bíceps (Curl Barra / Mancuerna / Polea)' },
        ]
    },
    {
        id: 'rp_adv_arms_6x_d2',
        dayName: { en: 'Day 1: Legs Day', es: 'Día 1: Día Pierna' },
        slots: [
            { muscle: 'QUADS' as MuscleGroup, setTarget: 3, exerciseId: 'sq_bar', reps: '8-12', notes: 'Quads (Squat / Leg Press / Hack) — Cuádriceps (Sentadilla / Prensa / Hack)' },
            { muscle: 'QUADS' as MuscleGroup, setTarget: 2, exerciseId: 'sq_bar', reps: '8-12', notes: 'Quads (Squat / Leg Press / Hack) — Cuádriceps (Sentadilla / Prensa / Hack)' },
            { muscle: 'HAMSTRINGS' as MuscleGroup, setTarget: 3, exerciseId: 'leg_curl', reps: '8-12', notes: 'Hamstring Isolation (Seated/Lying Leg Curl) — Isquios Aislamiento (Curl Femoral Sentado/Tumbado)' },
            { muscle: 'CALVES' as MuscleGroup, setTarget: 4, exerciseId: 'calf_raise', reps: '12-15', notes: 'Calves (Standing / Machine / Leg Press) — Gemelos (De Pie / Máquina / Prensa)' },
            { muscle: 'ABS' as MuscleGroup, setTarget: 2, exerciseId: 'knee_raise', reps: '12-15', notes: 'Abs (Hanging Knee/Leg Raises / Cable Crunches) — Abdomen (Elevaciones de Piernas / Encogimientos Polea)' },
        ]
    },
    {
        id: 'rp_adv_arms_6x_d3',
        dayName: { en: 'Day 1: Pull Day', es: 'Día 1: Día Tirón' },
        slots: [
            { muscle: 'BICEPS' as MuscleGroup, setTarget: 2, exerciseId: 'curl_bar', reps: '8-12', notes: 'Biceps (Barbell / DB / Cable Curl) — Bíceps (Curl Barra / Mancuerna / Polea)' },
            { muscle: 'BICEPS' as MuscleGroup, setTarget: 2, exerciseId: 'curl_bar', reps: '8-12', notes: 'Biceps (Barbell / DB / Cable Curl) — Bíceps (Curl Barra / Mancuerna / Polea)' },
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 2, exerciseId: 'rear_delt_fly', reps: '8-12', notes: 'Rear or Side Delts — Deltoide Posterior o Lateral' },
            { muscle: 'TRAPS' as MuscleGroup, setTarget: 2, exerciseId: 'shrug_db', reps: '8-12', notes: 'Traps (Barbell / DB Shrugs) — Trapecios (Encogimientos Barra / Mancuerna)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 2, exerciseId: 'bent_barbell_row', reps: '8-12', notes: 'Horizontal Pull (Barbell / DB / Cable Row) — Tracción Horizontal (Remo Barra / Mancuerna / Polea)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 2, exerciseId: 'bent_barbell_row', reps: '8-12', notes: 'Horizontal Pull (Barbell / DB / Cable Row) — Tracción Horizontal (Remo Barra / Mancuerna / Polea)' },
        ]
    },
    {
        id: 'rp_adv_arms_6x_d4',
        dayName: { en: 'Day 1: Push Day', es: 'Día 1: Día Empuje' },
        slots: [
            { muscle: 'TRICEPS' as MuscleGroup, setTarget: 2, exerciseId: 'tri_push', reps: '8-12', notes: 'Horizontal Triceps (Pushdowns / Dips / Skullcrushers) — Tríceps Horizontal (Polea / Fondos / Francés)' },
            { muscle: 'TRICEPS' as MuscleGroup, setTarget: 2, exerciseId: 'tri_push', reps: '8-12', notes: 'Triceps (Pushdowns / Dips / Skullcrushers) — Tríceps (Extensiones en Polea / Fondos / Press Francés)' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 2, exerciseId: 'bp_inc_bar', reps: '8-12', notes: 'Incline Push (Barbell / DB / Machine) — Empuje Inclinado (Barra / Mancuerna / Máquina)' },
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 2, exerciseId: 'rear_delt_fly', reps: '8-12', notes: 'Rear or Side Delts — Deltoide Posterior o Lateral' },
            { muscle: 'BICEPS' as MuscleGroup, setTarget: 2, exerciseId: 'curl_bar', reps: '8-12', notes: 'Biceps (Barbell / DB / Cable Curl) — Bíceps (Curl Barra / Mancuerna / Polea)' },
        ]
    },
    {
        id: 'rp_adv_arms_6x_d5',
        dayName: { en: 'Day 1: Legs Day', es: 'Día 1: Día Pierna' },
        slots: [
            { muscle: 'GLUTES' as MuscleGroup, setTarget: 3, exerciseId: 'glute_bridge', reps: '8-12', notes: 'Glutes (Bridge / Lunge / Sumo DL) — Glúteos (Puente / Zancadas / Peso Muerto Sumo)' },
            { muscle: 'GLUTES' as MuscleGroup, setTarget: 3, exerciseId: 'glute_bridge', reps: '8-12', notes: 'Glutes (Bridge / Lunge / Sumo DL) — Glúteos (Puente / Zancadas / Peso Muerto Sumo)' },
            { muscle: 'HAMSTRINGS' as MuscleGroup, setTarget: 3, exerciseId: 'rdl', reps: '8-12', notes: 'Hamstring Hinge (RDL / SLDL / Good Morning) — Isquios Bisagra (RDL / Piernas Rígidas / Buenos Días)' },
            { muscle: 'QUADS' as MuscleGroup, setTarget: 3, exerciseId: 'sq_bar', reps: '8-12', notes: 'Quads (Squat / Leg Press / Hack) — Cuádriceps (Sentadilla / Prensa / Hack)' },
            { muscle: 'CALVES' as MuscleGroup, setTarget: 4, exerciseId: 'calf_raise', reps: '12-15', notes: 'Calves (Standing / Machine / Leg Press) — Gemelos (De Pie / Máquina / Prensa)' },
            { muscle: 'ABS' as MuscleGroup, setTarget: 2, exerciseId: 'knee_raise', reps: '12-15', notes: 'Abs (Hanging Knee/Leg Raises / Cable Crunches) — Abdomen (Elevaciones de Piernas / Encogimientos Polea)' },
        ]
    },
    {
        id: 'rp_adv_arms_6x_d6',
        dayName: { en: 'Day 1: Pull Day', es: 'Día 1: Día Tirón' },
        slots: [
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 2, exerciseId: 'rear_delt_fly', reps: '8-12', notes: 'Rear or Side Delts — Deltoide Posterior o Lateral' },
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 2, exerciseId: 'rear_delt_fly', reps: '8-12', notes: 'Rear or Side Delts — Deltoide Posterior o Lateral' },
            { muscle: 'BICEPS' as MuscleGroup, setTarget: 2, exerciseId: 'curl_bar', reps: '8-12', notes: 'Biceps (Barbell / DB / Cable Curl) — Bíceps (Curl Barra / Mancuerna / Polea)' },
            { muscle: 'TRAPS' as MuscleGroup, setTarget: 2, exerciseId: 'shrug_db', reps: '8-12', notes: 'Traps (Barbell / DB Shrugs) — Trapecios (Encogimientos Barra / Mancuerna)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 2, exerciseId: 'lat_pull', reps: '8-12', notes: 'Vertical Pull (Pulldowns / Pullups / Chinups) — Tracción Vertical (Jalones / Dominadas)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 2, exerciseId: 'lat_pull', reps: '8-12', notes: 'Vertical Pull (Pulldowns / Pullups / Chinups) — Tracción Vertical (Jalones / Dominadas)' },
        ]
    },
];

export const RP_ADV_ARMS_6X_TEMPLATE: GlobalTemplate = {
    id: 'rp_adv_arms_6x',
    name: 'rp_adv_arms_6x',
    title: { en: 'RP MPT Advanced Arms & Delts (6 Days)', es: 'RP MPT Avanzado Brazos y Deltoides (6 Días)' },
    description: {
        en: 'Advanced 6-day specialization by RP for experienced lifters. High volume thresholds, advanced arm angle variations, and microcycle fatigue management.',
        es: 'Rutina avanzada de 6 días por RP para atletas experimentados. Umbrales altos de volumen, variación de ángulos y gestión precisa de la fatiga.'
    },
    isPro: false,
    order: 34,
    guidelineImages: RP_GUIDELINE_IMAGES,
    program: RP_ADV_ARMS_6X_PROGRAM
};

export const RP_ADV_LEGS_6X_PROGRAM: ProgramDay[] = [
    {
        id: 'rp_adv_legs_6x_d1',
        dayName: { en: 'Day 1: Quad Focused', es: 'Día 1: Enfoque Cuádriceps' },
        slots: [
            { muscle: 'HAMSTRINGS' as MuscleGroup, setTarget: 3, exerciseId: 'leg_curl', reps: '8-12', notes: 'Hamstring Isolation (Seated/Lying Leg Curl) — Isquios Aislamiento (Curl Femoral Sentado/Tumbado)' },
            { muscle: 'QUADS' as MuscleGroup, setTarget: 2, exerciseId: 'sq_bar', reps: '8-12', notes: 'Quads (Squat / Leg Press / Hack) — Cuádriceps (Sentadilla / Prensa / Hack)' },
            { muscle: 'QUADS' as MuscleGroup, setTarget: 3, exerciseId: 'sq_bar', reps: '8-12', notes: 'Quads (Squat / Leg Press / Hack) — Cuádriceps (Sentadilla / Prensa / Hack)' },
            { muscle: 'BICEPS' as MuscleGroup, setTarget: 3, exerciseId: 'curl_bar', reps: '8-12', notes: 'Biceps (Barbell / DB / Cable Curl) — Bíceps (Curl Barra / Mancuerna / Polea)' },
            { muscle: 'ABS' as MuscleGroup, setTarget: 3, exerciseId: 'knee_raise', reps: '12-15', notes: 'Abs (Hanging Knee/Leg Raises / Cable Crunches) — Abdomen (Elevaciones de Piernas / Encogimientos Polea)' },
        ]
    },
    {
        id: 'rp_adv_legs_6x_d2',
        dayName: { en: 'Day 2: Upper Body Push', es: 'Día 2: Tren Superior Empuje' },
        slots: [
            { muscle: 'CHEST' as MuscleGroup, setTarget: 2, exerciseId: 'bp_inc_bar', reps: '8-12', notes: 'Incline Push (Barbell / DB / Machine) — Empuje Inclinado (Barra / Mancuerna / Máquina)' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 2, exerciseId: 'bp_bar', reps: '8-12', notes: 'Horizontal Push (Bench / DB / Machine Press) — Empuje Horizontal (Banca Plana / Mancuerna / Máquina)' },
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 2, exerciseId: 'ohp', reps: '8-12', notes: 'Front Delts (Standing/Seated Overhead Press) — Deltoide Frontal (Press Militar Barra / Mancuerna)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 2, exerciseId: 'lat_pull', reps: '8-12', notes: 'Vertical Pull (Pulldowns / Pullups / Chinups) — Tracción Vertical (Jalones / Dominadas)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 2, exerciseId: 'bent_barbell_row', reps: '8-12', notes: 'Horizontal Pull (Barbell / DB / Cable Row) — Tracción Horizontal (Remo Barra / Mancuerna / Polea)' },
        ]
    },
    {
        id: 'rp_adv_legs_6x_d3',
        dayName: { en: 'Day 3: Glute Focused', es: 'Día 3: Enfoque Glúteos' },
        slots: [
            { muscle: 'GLUTES' as MuscleGroup, setTarget: 2, exerciseId: 'glute_bridge', reps: '8-12', notes: 'Glutes (Bridge / Lunge / Sumo DL) — Glúteos (Puente / Zancadas / Peso Muerto Sumo)' },
            { muscle: 'GLUTES' as MuscleGroup, setTarget: 2, exerciseId: 'glute_bridge', reps: '8-12', notes: 'Glutes (Bridge / Lunge / Sumo DL) — Glúteos (Puente / Zancadas / Peso Muerto Sumo)' },
            { muscle: 'QUADS' as MuscleGroup, setTarget: 3, exerciseId: 'sq_bar', reps: '8-12', notes: 'Quads (Squat / Leg Press / Hack) — Cuádriceps (Sentadilla / Prensa / Hack)' },
            { muscle: 'BICEPS' as MuscleGroup, setTarget: 3, exerciseId: 'curl_bar', reps: '8-12', notes: 'Biceps (Barbell / DB / Cable Curl) — Bíceps (Curl Barra / Mancuerna / Polea)' },
            { muscle: 'ABS' as MuscleGroup, setTarget: 3, exerciseId: 'knee_raise', reps: '12-15', notes: 'Abs (Hanging Knee/Leg Raises / Cable Crunches) — Abdomen (Elevaciones de Piernas / Encogimientos Polea)' },
        ]
    },
    {
        id: 'rp_adv_legs_6x_d4',
        dayName: { en: 'Day 4: Upper Body Pull', es: 'Día 4: Tren Superior Tirón' },
        slots: [
            { muscle: 'BACK' as MuscleGroup, setTarget: 2, exerciseId: 'bent_barbell_row', reps: '8-12', notes: 'Horizontal Pull (Barbell / DB / Cable Row) — Tracción Horizontal (Remo Barra / Mancuerna / Polea)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 2, exerciseId: 'bent_barbell_row', reps: '8-12', notes: 'Horizontal Pull (Barbell / DB / Cable Row) — Tracción Horizontal (Remo Barra / Mancuerna / Polea)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 2, exerciseId: 'lat_pull', reps: '8-12', notes: 'Vertical Pull (Pulldowns / Pullups / Chinups) — Tracción Vertical (Jalones / Dominadas)' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 2, exerciseId: 'bp_bar', reps: '8-12', notes: 'Horizontal Push (Bench / DB / Machine Press) — Empuje Horizontal (Banca Plana / Mancuerna / Máquina)' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 2, exerciseId: 'bp_inc_bar', reps: '8-12', notes: 'Incline Push (Barbell / DB / Machine) — Empuje Inclinado (Barra / Mancuerna / Máquina)' },
        ]
    },
    {
        id: 'rp_adv_legs_6x_d5',
        dayName: { en: 'Day 5: Hamstrings & Calves', es: 'Día 5: Isquios y Gemelos' },
        slots: [
            { muscle: 'HAMSTRINGS' as MuscleGroup, setTarget: 3, exerciseId: 'rdl', reps: '8-12', notes: 'Hamstring Hinge (RDL / SLDL / Good Morning) — Isquios Bisagra (RDL / Piernas Rígidas / Buenos Días)' },
            { muscle: 'HAMSTRINGS' as MuscleGroup, setTarget: 3, exerciseId: 'leg_curl', reps: '8-12', notes: 'Hamstring Isolation (Seated/Lying Leg Curl) — Isquios Aislamiento (Curl Femoral Sentado/Tumbado)' },
            { muscle: 'CALVES' as MuscleGroup, setTarget: 3, exerciseId: 'calf_raise', reps: '12-15', notes: 'Calves (Standing / Machine / Leg Press) — Gemelos (De Pie / Máquina / Prensa)' },
            { muscle: 'GLUTES' as MuscleGroup, setTarget: 3, exerciseId: 'glute_bridge', reps: '8-12', notes: 'Glutes (Bridge / Lunge / Sumo DL) — Glúteos (Puente / Zancadas / Peso Muerto Sumo)' },
            { muscle: 'ABS' as MuscleGroup, setTarget: 3, exerciseId: 'knee_raise', reps: '12-15', notes: 'Abs (Hanging Knee/Leg Raises / Cable Crunches) — Abdomen (Elevaciones de Piernas / Encogimientos Polea)' },
        ]
    },
    {
        id: 'rp_adv_legs_6x_d6',
        dayName: { en: 'Day 6: Shoulders & Arms Upper', es: 'Día 6: Hombros y Brazos Torso' },
        slots: [
            { muscle: 'SHOULDERS' as MuscleGroup, setTarget: 2, exerciseId: 'rear_delt_fly', reps: '8-12', notes: 'Rear or Side Delts — Deltoide Posterior o Lateral' },
            { muscle: 'BICEPS' as MuscleGroup, setTarget: 2, exerciseId: 'curl_bar', reps: '8-12', notes: 'Biceps (Barbell / DB / Cable Curl) — Bíceps (Curl Barra / Mancuerna / Polea)' },
            { muscle: 'TRAPS' as MuscleGroup, setTarget: 2, exerciseId: 'shrug_db', reps: '8-12', notes: 'Traps (Barbell / DB Shrugs) — Trapecios (Encogimientos Barra / Mancuerna)' },
            { muscle: 'TRICEPS' as MuscleGroup, setTarget: 2, exerciseId: 'tri_push', reps: '8-12', notes: 'Triceps (Pushdowns / Dips / Skullcrushers) — Tríceps (Extensiones en Polea / Fondos / Press Francés)' },
            { muscle: 'CHEST' as MuscleGroup, setTarget: 2, exerciseId: 'bp_inc_bar', reps: '8-12', notes: 'Incline Push (Barbell / DB / Machine) — Empuje Inclinado (Barra / Mancuerna / Máquina)' },
            { muscle: 'BACK' as MuscleGroup, setTarget: 2, exerciseId: 'lat_pull', reps: '8-12', notes: 'Vertical Pull (Pulldowns / Pullups / Chinups) — Tracción Vertical (Jalones / Dominadas)' },
        ]
    },
];

export const RP_ADV_LEGS_6X_TEMPLATE: GlobalTemplate = {
    id: 'rp_adv_legs_6x',
    name: 'rp_adv_legs_6x',
    title: { en: 'RP MPT Advanced Legs (6 Days)', es: 'RP MPT Avanzado Piernas (6 Días)' },
    description: {
        en: 'Advanced 6-day lower body specialization for seasoned lifters. Periodized Quad, Glute, and Hamstring loading for massive lower body hypertrophy.',
        es: 'Especialización avanzada en piernas de 6 días para atletas experimentados. Sobrecarga progresiva en cuádriceps, glúteos e isquios para máxima masa.'
    },
    isPro: false,
    order: 35,
    guidelineImages: RP_GUIDELINE_IMAGES,
    program: RP_ADV_LEGS_6X_PROGRAM
};

export const RP_ALL_TEMPLATES: GlobalTemplate[] = [
    RP_FB_3X_TEMPLATE,
    RP_FB_5X_TEMPLATE,
    RP_FB_6X_TEMPLATE,
    RP_ARMS_3X_TEMPLATE,
    RP_ARMS_4X_TEMPLATE,
    RP_ARMS_5X_TEMPLATE,
    RP_ARMS_6X_TEMPLATE,
    RP_CB_3X_TEMPLATE,
    RP_CB_4X_TEMPLATE,
    RP_CB_5X_TEMPLATE,
    RP_CB_6X_TEMPLATE,
    RP_LEGS_4X_TEMPLATE,
    RP_LEGS_5X_TEMPLATE,
    RP_LEGS_6X_TEMPLATE,
    RP_ADV_ARMS_6X_TEMPLATE,
    RP_ADV_LEGS_6X_TEMPLATE,
];
