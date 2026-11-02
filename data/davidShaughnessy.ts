import { ExerciseDef, GlobalTemplate, ProgramDay, MuscleGroup } from '../types';

// ============================================================================
// David Shaughnessy: Programa Maestro de 3 Días 2024 ("Silverback" Split)
// ============================================================================
// Fuente: David Shaughnessy — My Training Split of 2024 (3 Day Programme)
// Colaboración técnica en banca: Tristan Jacobs ("TJ")
// Arquitectura: Miércoles (Upper 1) • Sábado (Upper 2 sin brazos) • Domingo (Arms + Lower)
// ============================================================================

export const DAVID_SHAUGHNESSY_SILVERBACK_PROGRAM: ProgramDay[] = [
    {
        id: 'ds_sb_d1',
        dayName: {
            en: 'Day 1 (Wed): Upper 1 — Strength, Upper Back & Arms',
            es: 'Día 1 (Mié): Torso 1 — Fuerza, Espalda Alta y Brazos'
        },
        notes: 'Upper 1: Wide bench strength focus, heavy weighted pull-ups, seated DB press (peaking on 2nd set), flared chest-supported rows, heavy DB lateral raises, triceps pushdown & 60° incline curls.',
        slots: [
            {
                muscle: 'CHEST' as MuscleGroup,
                exerciseId: 'wide_bench_press',
                setTarget: 4,
                reps: '3-6',
                notes: 'Wide-Grip Barbell Bench Press: 3-4 series x 3-6 reps. Agarre ancho para acortar ROM y maximizar fuerza mecánica.'
            },
            {
                muscle: 'BACK' as MuscleGroup,
                exerciseId: 'pullup',
                setTarget: 4,
                reps: '6-10',
                notes: 'Pronated Pull-Ups (Lastradas): 3-4 series x 6-10 reps. Agarre prono estricto, estiramiento completo de escápulas abajo.'
            },
            {
                muscle: 'SHOULDERS' as MuscleGroup,
                exerciseId: 'ohp_db',
                setTarget: 3,
                reps: '6-10',
                notes: 'Seated DB Shoulder Press: Serie 1 preparatoria pesada a RIR 2-3, Serie 2 Top Set máxima, Serie 3 Back-off.'
            },
            {
                muscle: 'BACK' as MuscleGroup,
                exerciseId: 'tbar_row_chest_supported',
                setTarget: 4,
                reps: '8-12',
                notes: 'Chest-Supported Row: 3-4 series x 8-12 reps. Agarre prono con codos abiertos para máxima densidad de espalda alta.'
            },
            {
                muscle: 'SHOULDERS' as MuscleGroup,
                exerciseId: 'lat_raise',
                setTarget: 4,
                reps: '8-15',
                notes: 'Standing Heavy DB Lateral Raise: 3-4 series x 8-15 reps. Sobrecarga progresiva pesada en rango acortado (hasta 20-25 kg).'
            },
            {
                muscle: 'TRICEPS' as MuscleGroup,
                exerciseId: 'tri_push',
                setTarget: 4,
                reps: '8-12',
                notes: 'Straight-Bar Cable Triceps Pushdown: 3-4 series x 8-12 reps. Torso inclinado sobre la barra permitiendo estiramiento arriba.'
            },
            {
                muscle: 'BICEPS' as MuscleGroup,
                exerciseId: 'incline_db_curl',
                setTarget: 4,
                reps: '8-12',
                notes: '60° Incline Supinated DB Curl: 3-4 series en pirámide inversa (8, 10, 12+). Banco a 60°, estiramiento total de cabeza larga.'
            }
        ]
    },
    {
        id: 'ds_sb_d2',
        dayName: {
            en: 'Day 2 (Sat): Upper 2 — Hypertrophy & 3D Delts (No Arms)',
            es: 'Día 2 (Sáb): Torso 2 — Hipertrofia y Hombros 3D (Sin Brazos)'
        },
        notes: 'Upper 2: Closer bench for ROM, neutral lat pulldowns, TJ single-arm cable fly, explosive seal rows, BTN press, cable laterals & Powell raises. Deja los brazos frescos para el domingo.',
        slots: [
            {
                muscle: 'CHEST' as MuscleGroup,
                exerciseId: 'close_grip_bench',
                setTarget: 4,
                reps: '8-10',
                notes: 'Slightly Closer-Grip Bench Press: 3-4 series x 8-10 reps. Agarre medio por fuera de hombros para mayor ROM e hipertrofia de pecho.'
            },
            {
                muscle: 'BACK' as MuscleGroup,
                exerciseId: 'lat_pull',
                setTarget: 4,
                reps: '8-12',
                notes: 'Neutral-Grip Lat Pulldown (Barra V Ancha): 3-4 series x 8-12 reps. Torso ligeramente inclinado atrás sin perder recorrido.'
            },
            {
                muscle: 'CHEST' as MuscleGroup,
                exerciseId: 'single_arm_cable_fly',
                setTarget: 3,
                reps: '12-15',
                notes: 'Single-Arm High-Elbow Cable Chest Fly (TJ): 3 series x 12-15 reps/lado. Codo alto imitando fondo de banca, estiramiento clavicular.'
            },
            {
                muscle: 'BACK' as MuscleGroup,
                exerciseId: 'seal_row',
                setTarget: 4,
                reps: '6-10',
                notes: 'Barbell Seal Row (o Helms Row): 3-4 series x 6-10 reps. Arrancar con violencia desde el estiramiento hasta mitad sin pausa arriba.'
            },
            {
                muscle: 'SHOULDERS' as MuscleGroup,
                exerciseId: 'behind_neck_press',
                setTarget: 3,
                reps: '6-10',
                notes: 'Behind-the-Neck Barbell Shoulder Press (TJ): 3 series x 6-10 reps. Transferencia directa de estabilidad a la banca.'
            },
            {
                muscle: 'SHOULDERS' as MuscleGroup,
                exerciseId: 'lat_raise_cable',
                setTarget: 4,
                reps: '10-15',
                notes: 'Single-Arm Cable Lateral Raise: 3-4 series x 10-15 reps/lado. Polea cruzando al frente para máxima tensión en estiramiento.'
            },
            {
                muscle: 'SHOULDERS' as MuscleGroup,
                exerciseId: 'powell_raise',
                setTarget: 3,
                reps: '10-15',
                notes: 'Dumbbell Powell Raise en Banco (TJ): 3 series x 10-15 reps/lado. De lado en banco cruzando al frente, estiramiento de deltoide posterior.'
            }
        ]
    },
    {
        id: 'ds_sb_d3',
        dayName: {
            en: 'Day 3 (Sun): Arms Priority + Ultra-Intensity Lower Body',
            es: 'Día 3 (Dom): Prioridad Brazos + Tren Inferior de Ultra-Intensidad'
        },
        notes: 'Arms + Lower: 4 ejercicios de brazos al 100% de energía sin fatiga previa + 3 ejercicios pesados de pierna (Curl femoral, Sentadilla Zercher y Hack profunda al fallo).',
        slots: [
            {
                muscle: 'BICEPS' as MuscleGroup,
                exerciseId: 'curl_preacher',
                setTarget: 4,
                reps: '8-10',
                supersetId: 'ds_arms_ss1',
                notes: '1A (Superserie): Reverse-Facing 1-Arm Preacher Curl: 3-4 x 8-10 reps + drop en última. Pecho en cara plana, estiramiento profundo.'
            },
            {
                muscle: 'TRICEPS' as MuscleGroup,
                exerciseId: 'tri_push',
                setTarget: 4,
                reps: '10-15',
                supersetId: 'ds_arms_ss1',
                notes: '1B (Superserie): Small-Rope Triceps Pushdown (GVS): 3-4 x 10-15 reps. Cuerda corta, manos juntas todo el rango, tensión en estiramiento.'
            },
            {
                muscle: 'BICEPS' as MuscleGroup,
                exerciseId: 'curl_hammer',
                setTarget: 4,
                reps: '8-12',
                notes: '60° Incline Hammer Dumbbell Curl: 3-4 series x 8-12 reps. Banco a 60°, agarre neutro estricto, codos fijos atrás para braquial y antebrazo.'
            },
            {
                muscle: 'TRICEPS' as MuscleGroup,
                exerciseId: 'skull_crusher',
                setTarget: 4,
                reps: '10-12',
                notes: 'DB Skull Crushers o Extensiones sobre cabeza con cuerda en polea: 3-4 x 10-12 reps. Cuidar codos, máximo estiramiento.'
            },
            {
                muscle: 'HAMSTRINGS' as MuscleGroup,
                exerciseId: 'leg_curl',
                setTarget: 4,
                reps: '8-12',
                notes: 'Lying o Seated Leg Curl: 3-4 series x 8-12 reps pesadas. Calienta la articulación de la rodilla y sobrecarga isquios antes de sentadillas.'
            },
            {
                muscle: 'QUADS' as MuscleGroup,
                exerciseId: 'zercher_squat',
                setTarget: 4,
                reps: '4-8',
                notes: 'Heavy Zercher Squat: 3-4 series x 4-8 reps muy pesadas. Barra en pliegue de codos: cuádriceps, glúteos, core de acero y espalda.'
            },
            {
                muscle: 'QUADS' as MuscleGroup,
                exerciseId: 'sq_hack',
                setTarget: 3,
                reps: '6-15',
                notes: 'Deep Machine Hack Squat: 1 Top Set pesada x 6-8 (hasta 220-240kg) + 2 Back-Off x 12-15 profundas al límite sin fatiga lumbar.'
            }
        ]
    }
];

export const DAVID_SHAUGHNESSY_SILVERBACK_TEMPLATE: GlobalTemplate = {
    id: 'david_shaughnessy_silverback_3d',
    name: 'david_shaughnessy_silverback_3d',
    title: {
        en: 'David Shaughnessy 3-Day "Silverback" Split',
        es: 'David Shaughnessy 3 Días "Silverback" (Torso / Torso / Brazos + Pierna)'
    },
    description: {
        en: 'Official 2024 3-day split by David Shaughnessy in collaboration with Tristan Jacobs ("TJ"). Upper 1 (Strength & Upper Back) / Upper 2 (Hypertrophy & 3D Delts without arms) / Arms + Lower (Fresh arms priority + High-intensity Zercher & Hack squat legs). Built monstrous "Silverback" upper back density, a 170 kg bench, and massive arm/leg growth naturally.',
        es: 'Programa oficial de 3 días de 2024 por David Shaughnessy (colaboración con Tristan Jacobs). Upper 1 (Fuerza y Espalda Alta) / Upper 2 (Hipertrofia y Hombros 3D sin brazos) / Brazos + Pierna (Brazos frescos con máxima energía + Sentadilla Zercher y Hack al límite). Construyó densidad extrema de "espalda plateada", récord de 170 kg en banca y un desarrollo masivo en atletas naturales.'
    },
    isPro: false,
    order: 3,
    program: DAVID_SHAUGHNESSY_SILVERBACK_PROGRAM
};
