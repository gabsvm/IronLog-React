import { IconName } from '../components/ui/Icon';

export interface LocalizedString {
    es: string;
    en: string;
}

export type RpGuideTabId =
    | 'phases'
    | 'principles'
    | 'effort'
    | 'autoreg'
    | 'execution'
    | 'nutrition'
    | 'special'
    | 'faq';

export interface RpGuideTabDef {
    id: RpGuideTabId;
    label: LocalizedString;
    shortLabel: LocalizedString;
    icon: IconName;
}

export interface RpMesocycleDef {
    number: number;
    code: string;
    title: LocalizedString;
    duration: LocalizedString;
    repRange: string;
    restRange: LocalizedString;
    summary: LocalizedString;
    keyFocus: LocalizedString;
}

export interface RpRirLevelDef {
    code: string;
    rirLabel: string;
    title: LocalizedString;
    description: LocalizedString;
    tone: 'emerald' | 'amber' | 'red';
}

export interface RpLoadBoundRow {
    phase: LocalizedString;
    tooHeavy: string;
    validRange: string;
    tooLight: string;
}

export interface RpRatingDef {
    score: string;
    tone: 'red' | 'amber' | 'zinc' | 'emerald' | 'primary';
    meaning: LocalizedString;
    action: LocalizedString;
}

export interface RpWarmupStepDef {
    step: number;
    load: LocalizedString;
    reps: string;
    purpose: LocalizedString;
}

export interface RpNutritionTierDef {
    tier: LocalizedString;
    setsRange: string;
    tone: 'emerald' | 'amber' | 'primary';
    description: LocalizedString;
}

export interface RpFaqItem {
    id: string;
    category: LocalizedString;
    question: LocalizedString;
    answer: LocalizedString;
}

export const RP_GUIDE_TABS: RpGuideTabDef[] = [
    {
        id: 'phases',
        label: { es: 'Fases del Macrociclo', en: 'Macrocycle Phases' },
        shortLabel: { es: 'Fases', en: 'Phases' },
        icon: 'Layers',
    },
    {
        id: 'principles',
        label: { es: '7 Principios Científicos', en: '7 Scientific Principles' },
        shortLabel: { es: 'Principios', en: 'Principles' },
        icon: 'Award',
    },
    {
        id: 'effort',
        label: { es: 'Esfuerzo (RIR) y Cargas', en: 'Effort (RIR) & Load' },
        shortLabel: { es: 'Esfuerzo', en: 'Effort' },
        icon: 'Gauge',
    },
    {
        id: 'autoreg',
        label: { es: 'Autorregulación y Algoritmos', en: 'Autoregulation & Algorithms' },
        shortLabel: { es: 'Autorreg.', en: 'Autoreg' },
        icon: 'Activity',
    },
    {
        id: 'execution',
        label: { es: 'Ejecución, Modalidades y Fatiga', en: 'Execution, Modalities & Fatigue' },
        shortLabel: { es: 'Ejecución', en: 'Execution' },
        icon: 'Dumbbell',
    },
    {
        id: 'nutrition',
        label: { es: 'Nutrición, Dieta y Cardio', en: 'Nutrition, Diet & Cardio' },
        shortLabel: { es: 'Nutrición', en: 'Nutrition' },
        icon: 'Utensils',
    },
    {
        id: 'special',
        label: { es: 'Casos Especiales y Diagnóstico', en: 'Special Cases & Troubleshooting' },
        shortLabel: { es: 'Casos Esp.', en: 'Special' },
        icon: 'Shield',
    },
    {
        id: 'faq',
        label: { es: 'Preguntas y Glosario', en: 'FAQ & Glossary' },
        shortLabel: { es: 'FAQ/Glos.', en: 'FAQ' },
        icon: 'BookOpen',
    },
];

export const RP_GUIDE_DATA = {
    intro: {
        purposeTitle: {
            es: 'Objetivo del Sistema RP Periodization',
            en: 'Purpose of RP Periodization',
        },
        purposeBody: {
            es: 'Estos programas periodizados están diseñados para maximizar la hipertrofia muscular o preservar tu masa magra mientras definís. Funcionan tanto en superávit calórico (ganancia muscular), en mantenimiento (recomposición) como en déficit controlado.',
            en: 'These periodized templates are built to maximize muscle growth or preserve lean mass during fat loss. They work effectively while gaining weight, maintaining for recomposition, or cutting body fat.',
        },
        experienceBadge: {
            es: 'Requisito recomendado: 6+ meses de experiencia',
            en: 'Recommended baseline: 6+ months lifting experience',
        },
        experienceNote: {
            es: 'El volumen acumulado en las semanas finales es exigente. Necesitás al menos 6 meses de base técnica y tolerancia al trabajo antes de exprimir estas rotaciones; si recién arrancás, priorizá aprender la técnica en una rutina de menor volumen.',
            en: 'Accumulated volume in later weeks is demanding. At least 6 months of foundational lifting technique and work capacity is recommended before running high-volume rotations.',
        },
    },
    mesocycles: [
        {
            number: 1,
            code: 'MESO 1',
            title: { es: 'Hipertrofia Básica 1', en: 'Basic Hypertrophy 1' },
            duration: { es: '6–7 semanas', en: '6–7 weeks' },
            repRange: '6–20 reps (8–12)',
            restRange: { es: '2–5 min', en: '2–5 min' },
            summary: {
                es: 'Arranca con volumen moderado cercano al MEV (Volumen Mínimo Efectivo) y sube gradualmente semana a semana. Construye tolerancia al trabajo sin saturar la recuperación desde el día uno.',
                en: 'Starts near your Minimum Effective Volume (MEV) and ramps volume and effort across weeks. Builds work capacity steadily without burning you out early.',
            },
            keyFocus: {
                es: 'Elegí ejercicios que domines con técnica sólida; mantenelos en el Mesociclo 2 para capitalizar las ganancias.',
                en: 'Select movements you execute cleanly; carry most of the same exercises into Mesocycle 2.',
            },
        },
        {
            number: 2,
            code: 'MESO 2',
            title: { es: 'Hipertrofia Básica 2', en: 'Basic Hypertrophy 2' },
            duration: { es: '6–7 semanas', en: '6–7 weeks' },
            repRange: '6–20 reps (8–12)',
            restRange: { es: '2–5 min', en: '2–5 min' },
            summary: {
                es: 'Misma estructura base con mayor estímulo inicial de series o carga aprovechando las adaptaciones de fuerza conseguidas en el Mesociclo 1.',
                en: 'Follows Mesocycle 1 immediately with higher starting sets or loads, capitalizing on your newly acquired rep-strength and work capacity.',
            },
            keyFocus: {
                es: 'Conservá los mismos ejercicios principales del Meso 1 salvo molestia articular o estancamiento claro.',
                en: 'Keep mostly the same exercise selection from Meso 1 unless joint discomfort warrants a swap.',
            },
        },
        {
            number: 3,
            code: 'MESO 3',
            title: { es: 'Entrenamiento Metabólico', en: 'Metabolite Training' },
            duration: { es: '5–6 semanas', en: '5–6 weeks' },
            repRange: '10–30 reps',
            restRange: { es: '30–90 s (pesado: 2–5 min)', en: '30–90 s (heavy: 2–5 min)' },
            summary: {
                es: 'Tras 12–14 semanas de sobrecarga estándar, el cuerpo desarrolla resistencia al volumen. Este bloque usa pesos más livianos, altas repeticiones, descansos cortos y superseries para acumular metabolitos y bombeo intenso.',
                en: 'After 12–14 weeks of heavy accumulation, volume sensitivity drops. This phase uses lighter loads, high reps, short rests, and supersets to drive metabolic stress.',
            },
            keyFocus: {
                es: 'Priorizá aislamientos y máquinas (menos fatiga axial) excepto en los días marcados como "Heavy / Pesado".',
                en: 'Favor machines and isolations over heavy axial barbell lifts, except on workouts labeled "Heavy".',
            },
        },
        {
            number: 4,
            code: 'MESO 4',
            title: { es: 'Resensibilización', en: 'Resensitization' },
            duration: { es: '3–4 semanas', en: '3–4 weeks' },
            repRange: '3–12 reps',
            restRange: { es: '2–5 min', en: '2–5 min' },
            summary: {
                es: 'Fase breve de bajo volumen y cargas pesadas en ejercicios compuestos para mantener la masa muscular mientras tu tejido olvida la fatiga alta y vuelve a sensibilizarse al estímulo.',
                en: 'Brief low-volume, heavier compound phase that preserves muscle while shedding desensitization so your body responds rapidly when cycling back to Meso 1.',
            },
            keyFocus: {
                es: 'Usá movimientos compuestos básicos; no esperes congestiones enormes. Al cerrar el Meso 4, volvé al Meso 1 rotando variantes.',
                en: 'Use big compound lifts and do not chase pumps here. Afterward, cycle back to Meso 1 with mostly fresh exercise variants.',
            },
        },
    ] as RpMesocycleDef[],
    macrocycleNote: {
        es: 'Un macrociclo completo dura 20–23 semanas. Al terminar el Mesociclo 4, reiniciás el ciclo desde el Mesociclo 1 eligiendo variantes nuevas para seguir progresando durante años.',
        en: 'One full macrocycle spans 20–23 weeks. Upon finishing Mesocycle 4, circle back to Mesocycle 1 with new exercise variations to keep progressing year after year.',
    },
    rirLevels: [
        {
            code: '3/fail',
            rirLabel: 'RIR 3',
            title: { es: 'Semanas iniciales (Acumulación)', en: 'Early Weeks (Accumulation)' },
            description: {
                es: 'Frená la serie cuando sientas que te quedan ~3 repeticiones limpias en recámara. La velocidad de la barra baja de forma clara, pero mantenés control total.',
                en: 'Stop the set with roughly 3 clean reps left in the tank. Bar speed slows noticeably without losing form or grinding hard.',
            },
            tone: 'emerald',
        },
        {
            code: '2/fail',
            rirLabel: 'RIR 2',
            title: { es: 'Mitad del mesociclo', en: 'Mid-Mesocycle' },
            description: {
                es: 'Dejá 2 repeticiones en reserva. Empieza el esfuerzo real y cierto temblor o desaceleración marcada en las últimas reps.',
                en: 'Leave 2 reps in reserve. Effort feels challenging with deliberate straining on the closing repetitions.',
            },
            tone: 'amber',
        },
        {
            code: '1/fail',
            rirLabel: 'RIR 1',
            title: { es: 'Última semana pesada (Overreaching)', en: 'Final Peak Week' },
            description: {
                es: 'Detené la serie a 1 repetición del fallo técnico. Casi esfuerzo máximo antes de entrar en la semana de descarga (Deload).',
                en: 'Terminate the set 1 rep shy of technical failure. Near-maximal effort right before transitioning into your deload week.',
            },
            tone: 'red',
        },
    ] as RpRirLevelDef[],
    techniqueRule: {
        title: {
            es: 'Regla de Oro: Técnica Estricta',
            en: 'Golden Rule: Strict Technique',
        },
        body: {
            es: 'Si tenés que deformar la técnica o usar impulso para sacar otra repetición, YA llegaste al fallo. Todas las referencias RIR ("3/fail", "2/fail", "1/fail") asumen rango completo y técnica estricta. Nunca entrenes al fallo absoluto en las primeras semanas o chocarás contra un muro antes del final del ciclo.',
            en: 'If you have to break technique or use body English to get another rep, you have already failed. Every RIR target assumes clean form and full range of motion. Never push early weeks to failure.',
        },
    },
    loadCalibration: {
        title: {
            es: 'Calibración del 10RM y Ajuste de Carga',
            en: '10RM Calibration & Load Adjustment',
        },
        intro: {
            es: 'Estimá tu peso máximo realista para 10 repeticiones (10RM) considerando la posición del ejercicio dentro de la sesión: un ejercicio que va 4.º tras otros movimientos requiere bastante menos carga que fresco al inicio. Si dudás, elegí un peso conservador y sin ego.',
            en: 'Use realistic 10RM estimates that account for exercise order within the workout (your 4th exercise 10RM is much lighter than fresh). Leave ego out and err on the conservative side.',
        },
        firstSetRule: {
            es: 'Si en la primera serie de trabajo en Semana 1 caés fuera del rango de la fase, ajustá el peso ±10–20% para la semana siguiente. Si las series finales bajan un poco por fatiga tras cumplir el primer set, no hace falta bajar la carga.',
            en: 'If your very first working set in Week 1 falls outside the phase bounds, adjust your starting load by ±10–20%. Later sets dipping slightly from accumulated fatigue is completely normal.',
        },
        bounds: [
            {
                phase: { es: 'Mesos 1 y 2 (Hipertrofia)', en: 'Mesos 1 & 2 (Basic Hypertrophy)' },
                tooHeavy: '≤ 6 reps (-10–20%)',
                validRange: '7–19 reps',
                tooLight: '≥ 20 reps (+10–20%)',
            },
            {
                phase: { es: 'Meso 3 (Metabólico)', en: 'Meso 3 (Metabolite)' },
                tooHeavy: '≤ 10 reps (-10–20%)',
                validRange: '11–29 reps',
                tooLight: '≥ 30 reps (+10–20%)',
            },
            {
                phase: { es: 'Meso 4 (Resensibilización)', en: 'Meso 4 (Resensitization)' },
                tooHeavy: '≤ 3 reps (-10–20%)',
                validRange: '4–11 reps',
                tooLight: '≥ 12 reps (+10–20%)',
            },
        ] as RpLoadBoundRow[],
        smallIncrementsNote: {
            es: 'Subidas semanales de ~2%: muchas veces el redondeo de discos (2.5 kg / 5 lb) mantiene el mismo peso de una semana a la otra. Es intencional: el volumen total (series × reps) es el motor principal del crecimiento.',
            en: 'Weekly load bumps are roughly ~2%, which often rounds to the same weight week-to-week. That is expected: weekly volume accumulation drives hypertrophy.',
        },
        bodyweightNote: {
            es: 'Dominadas y Fondos lastrados: calculá la carga sumando peso corporal + lastre; para saber qué disco colgar en cada semana, restá tu peso corporal del peso objetivo. Si hacés menos de 6 reps libres, usá máquina asistida (ingresando solo la asistencia), bandas o seguí sumando reps libres.',
            en: 'Pull-ups & Dips: use bodyweight + added belt load for calculations, subtracting bodyweight to find plate weight. Under 6 strict reps? Use assisted machines (track assistance load) or progressive bands.',
        },
    },
    ratingScale: [
        {
            score: '-2',
            tone: 'red',
            meaning: {
                es: 'Agotamiento / Dolor articular / Muy poca recuperación',
                en: 'Beat up / Joint strain / Severely under-recovered',
            },
            action: {
                es: 'Recorta fuerte el volumen futuro (-2 series o más) para evitar sobreentrenamiento.',
                en: 'Cuts upcoming weekly sets aggressively to restore recovery.',
            },
        },
        {
            score: '-1',
            tone: 'amber',
            meaning: {
                es: 'Todavía dolorido o muy duro completar el objetivo',
                en: 'Still sore from last session or barely hit rep targets',
            },
            action: {
                es: 'Reduce ligeramente las series próximas (-1 serie) para estabilizar la fatiga.',
                en: 'Reduces upcoming set volume slightly (-1 set) to manage fatigue.',
            },
        },
        {
            score: '0',
            tone: 'zinc',
            meaning: {
                es: 'Punto justo: buen estímulo y recuperación a tiempo',
                en: 'Sweet spot: solid pump/stimulus and recovered right on schedule',
            },
            action: {
                es: 'Mantiene la progresión planificada sin cambios bruscos.',
                en: 'Holds planned baseline volume steady.',
            },
        },
        {
            score: '+1',
            tone: 'emerald',
            meaning: {
                es: 'Fácil, te recuperaste rápido con poco DOMS',
                en: 'Easy recovery, minimal soreness, plenty left in the tank',
            },
            action: {
                es: 'Suma series en la semana siguiente (+1 serie) hacia tu MAV.',
                en: 'Adds +1 set on subsequent sessions toward your MAV.',
            },
        },
        {
            score: '+2',
            tone: 'primary',
            meaning: {
                es: 'Demasiado liviano, casi sin estímulo ni fatiga',
                en: 'Too easy, barely felt challenged or fatigued',
            },
            action: {
                es: 'Incremento agresivo de series (+2 sets). Úsalo solo si realmente sobró energía.',
                en: 'Adds +2 sets aggressively. Use honestly—never out of ego.',
            },
        },
    ] as RpRatingDef[],
    autoregNotes: [
        {
            title: { es: 'Honestidad absoluta (sin ego)', en: 'Strict Honesty Over Ego' },
            body: {
                es: 'Si calificás +1 o +2 cuando en realidad estás fatigado o dolorido, provocarás una ola impagable de volumen que terminará arruinando tu rendimiento y recuperación.',
                en: 'Rating +1 or +2 while still sore or beat up triggers an unrecoverable wave of sets that tanks performance later in the cycle.',
            },
        },
        {
            title: { es: '¿Seguís adolorido al tocar ese músculo otra vez?', en: 'Still Sore Before Next Session?' },
            body: {
                es: 'Entrená igual la sesión y calificá -1 (o -2 si empeora). El sistema bajará el volumen de ese grupo muscular la semana siguiente para que llegues justo a punto.',
                en: 'Still train that session, then rate it -1 so volume scales down ahead of your next cycle of workouts.',
            },
        },
        {
            title: { es: 'Si las series llegan a 0', en: 'When Target Sets Drop to Zero' },
            body: {
                es: 'Si la autorregulación reduce un ejercicio a 0 series ese día, simplemente saltalo por esa sesión para disipar la fatiga rápidamente.',
                en: 'If sustained negative ratings drop an exercise to 0 sets for a workout, skip that movement for the day so fatigue dissipates rapidly.',
            },
        },
        {
            title: { es: '¿Por qué no subo de fuerza todas las semanas?', en: 'Why Strength May Plateau Mid-Meso' },
            body: {
                es: 'La fatiga acumulada semana a semana enmascara temporalmente tu ganancia de fuerza. Es normal sentirte pesado en semanas 4–5 y ver el salto real de repeticiones/kilos recién después del Deload.',
                en: 'Rising cumulative fatigue temporarily masks fitness. Real rep-strength gains reveal themselves right after your deload week.',
            },
        },
    ],
    warmupSteps: [
        {
            step: 1,
            load: { es: 'Muy liviano', en: 'Very light' },
            reps: '10 reps',
            purpose: { es: 'Lubricar articulaciones y ensayar el recorrido.', en: 'Groove range of motion and warm joints.' },
        },
        {
            step: 2,
            load: { es: 'Moderado', en: 'Moderate' },
            reps: '5 reps',
            purpose: { es: 'Aumentar temperatura y activar reclutamiento.', en: 'Raise tissue temperature and bar speed.' },
        },
        {
            step: 3,
            load: { es: 'Pesado controlado', en: 'Moderately heavy' },
            reps: '3 reps',
            purpose: { es: 'Acercamiento nervioso al peso objetivo.', en: 'Neural readiness toward working weight.' },
        },
        {
            step: 4,
            load: { es: 'Potenciación (Peso de trabajo)', en: 'Potentiation single (Working load)' },
            reps: '1 rep',
            purpose: { es: 'Sentir la carga real sin generar fatiga previa.', en: 'Feel the working load with zero fatigue cost.' },
        },
    ] as RpWarmupStepDef[],
    warmupNote: {
        es: 'Dedica este protocolo completo al primer ejercicio compuesto del día; en ejercicios posteriores para el mismo músculo suele bastar con 1–2 series cortas de tanteo.',
        en: 'Run this full ramp on your first compound movement of the session; later exercises for already-warm muscles usually need just 1–2 quick feeler sets.',
    },
    restAndSupersets: {
        standard: {
            title: { es: 'Descansos estándar (Mesos 1, 2, 4 y días Heavy)', en: 'Standard Rests (Mesos 1, 2, 4 & Heavy Days)' },
            body: {
                es: 'Descansá entre 2 y 5 minutos entre series hasta recuperar la respiración y estabilidad (más tiempo en sentadillas/pesos muertos, menos en aislamientos; rara vez menos de 1 minuto). Mantené series tradicionales (straight sets) salvo indicación contraria.',
                en: 'Rest 2–5 minutes until breathing and coordination recover (longer on squats/hinges, shorter on isolations; rarely under 1 min). Stick to straight sets unless instructed otherwise.',
            },
        },
        metabolite: {
            title: { es: 'Descansos cortos y Superseries (Meso 3 Metabólico)', en: 'Short Rests & Supersets (Meso 3 Metabolite)' },
            body: {
                es: 'En series normales descansá solo 30–90 segundos (lo justo para recuperar el aliento). En superseries, pasá del primer ejercicio al segundo con 0 s de pausa (ambos al RIR objetivo) y luego descansá 30–90 s antes de repetir el par.',
                en: 'On straight sets, rest just 30–90 s (barely catching your breath). On supersets, perform Exercise 1 followed immediately by Exercise 2 with zero rest, then rest 30–90 s before the next round.',
            },
        },
        exerciseSelectionTitle: {
            es: 'Orden y Selección de Ejercicios',
            en: 'Exercise Order & Selection',
        },
        exerciseSelectionPoints: [
            {
                es: 'Respetá el orden programado siempre que el gimnasio lo permita: los volúmenes y RIR están calculados sobre ese orden.',
                en: 'Keep the programmed exercise order whenever practical, as volumes and loads assume that fatigue order.',
            },
            {
                es: 'Si un músculo aparece dos veces seguidas en el mismo día o semana (ej. Cuádriceps), elegí dos variantes distintas para repartir estrés articular y mejorar el estímulo.',
                en: 'When a muscle appears twice back-to-back or in the same week (e.g., Quads), choose two distinct variations to limit overuse.',
            },
            {
                es: 'Usá ejercicios libres de dolor articular que domines bien. Mantené la selección del Meso 1 en el Meso 2 y recién rotala al volver al Meso 1 del macrociclo siguiente.',
                en: 'Pick pain-free lifts available at your gym. Keep exercises from Meso 1 into Meso 2, then rotate new variants on the next macrocycle.',
            },
        ],
    },
    deload: {
        title: { es: 'Semana de Descarga (Deload)', en: 'Deload Week Protocol' },
        rules: [
            {
                es: 'Hacé exactamente ½ (la mitad) de las repeticiones realizadas en la Semana 1, redondeando hacia abajo los impares (ej: 7, 5, 4 reps en S1 → 3, 2, 2 reps en Deload).',
                en: 'Perform ½ of your Week 1 reps per set, rounding odd numbers DOWN (e.g., 7, 5, 4 reps in Week 1 → 3, 2, 2 reps on Deload).',
            },
            {
                es: 'Bajá también la carga respecto a tus semanas pesadas, especialmente en la segunda mitad de la semana de descarga.',
                en: 'Lower the weights as well, especially through the second half of the deload week, so sessions feel deliberately easy.',
            },
            {
                es: 'No se califican esfuerzos en el Deload ni se saltea aunque te sientas "bien": el objetivo es arrancar el próximo ciclo sintiéndote excelente, no apenas recuperado.',
                en: 'Do not rate sets during deload and never skip it even if you feel fine—the goal is starting the next meso feeling fresh and explosive.',
            },
        ],
    },
    nutrition: {
        caloricAlignment: [
            {
                goal: { es: 'Objetivo: Ganancia Muscular (Volumen)', en: 'Goal: Muscle Gain (Bulk)' },
                phasePlan: {
                    es: 'Superávit calórico ligero y controlado durante los Mesociclos 1, 2 y 3. Pasá a calorías de mantenimiento durante las 3–4 semanas del Mesociclo 4 (Resensibilización).',
                    en: 'Run a slow, controlled caloric surplus across Mesocycles 1, 2, and 3, then shift to weight maintenance during Mesocycle 4 (Resensitization).',
                },
            },
            {
                goal: { es: 'Objetivo: Pérdida de Grasa (Definición)', en: 'Goal: Fat Loss (Cut)' },
                phasePlan: {
                    es: 'Déficit calórico progresivo durante los Mesociclos 1 y 2. Pasá a mantenimiento calórico en los Mesociclos 3 y 4 para consolidar el peso perdido y evitar fatiga excesiva.',
                    en: 'Diet gradually during Mesocycles 1 and 2, then maintain your new body weight through Mesocycles 3 and 4 to consolidate fat loss.',
                },
            },
        ],
        dayTiersTitle: {
            es: 'Clasificación Nutricional según Volumen del Día (sin contar abdominales)',
            en: 'Training Day Intensity Tiers for Carb/Calorie Cycling (Excl. Abs)',
        },
        dayTiers: [
            {
                tier: { es: 'Día Liviano', en: 'Light Day' },
                setsRange: '≤ 10 sets',
                tone: 'emerald',
                description: { es: 'Hasta 10 series efectivas totales en la sesión.', en: '10 or fewer total working sets (excluding abs).' },
            },
            {
                tier: { es: 'Día Moderado', en: 'Moderate Day' },
                setsRange: '11–19 sets',
                tone: 'amber',
                description: { es: 'Entre 11 y 19 series efectivas totales.', en: 'Between 11 and 19 total working sets.' },
            },
            {
                tier: { es: 'Día Pesado', en: 'Hard Day' },
                setsRange: '≥ 20 sets',
                tone: 'primary',
                description: { es: '20 o más series efectivas totales.', en: '20 or more total working sets in the session.' },
            },
        ] as RpNutritionTierDef[],
        cardioTitle: {
            es: 'Prioridad de Horario para Cardio y WOD',
            en: 'Cardio & Conditioning Timing Hierarchy (Best to Worst)',
        },
        cardioPriority: [
            {
                es: 'Días sin entrenamiento de pesas (opción óptima para no interferir con la recuperación).',
                en: 'Non-lifting days (best option for recovery and hypertrophy stimulus).',
            },
            {
                es: 'En días de pesas, separado 6 horas o más de la sesión de fuerza.',
                en: 'On training days separated by 6+ hours from weight training.',
            },
            {
                es: 'Antes de entrenar pesas (preferible frente a hacerlo pegado al finalizar si buscás mantener rendimiento).',
                en: 'Directly before weights (when scheduling requires back-to-back sessions).',
            },
            {
                es: 'Inmediatamente después de pesas (moderá duración/intensidad especialmente si estás en fase de volumen).',
                en: 'Directly after weights (keep moderate, especially when focused on gaining muscle).',
            },
        ],
        mixedSports: {
            title: { es: 'Compatibilidad con CrossFit, MMA u Otros Deportes', en: 'Combining With CrossFit, MMA & Other Sports' },
            points: [
                {
                    es: 'Elegí obligatoriamente una plantilla de 3 o 4 días por semana (evitá 5 o 6 días) para dejar margen de recuperación al deporte principal.',
                    en: 'Select a 3- or 4-day template (never 5 or 6 days) so your body can recover from both commitments.',
                },
                {
                    es: 'Si hacés un WOD u otra sesión el mismo día, dejá al menos 20 minutos entre bloques (idealmente medio día de separación).',
                    en: 'Separate strength sessions from sport/WOD practice by at least 20 minutes—ideally half a day.',
                },
                {
                    es: 'Sé estricto con las calificaciones de fatiga/agujetas: si tu otro deporte te dejó fatigado, calificalo en -1/-2 para que las pesas se adapten.',
                    en: 'Rate soreness and fatigue honestly factoring in your other sport so RP autoregulation scales back lifting volume accordingly.',
                },
            ],
        },
    },
    faqs: [
        {
            id: 'missed_days',
            category: { es: 'Agenda', en: 'Schedule' },
            question: {
                es: '¿Qué hago si falto un día o varios días seguidos?',
                en: 'What if I miss one workout or multiple days?',
            },
            answer: {
                es: 'Si perdés 1 día, corré la sesión al siguiente día disponible de la semana y continuá la rotación sin amontonar días imposibles. Si perdés varios días por enfermedad o viaje, entrená liviano lo que quede de la semana y reiniciá esa misma semana la semana siguiente. También podés cambiar el día de entreno ocasionalmente si lo necesitás, manteniendo la mayor regularidad posible.',
                en: 'If you miss 1 day, shift the remaining sessions forward cleanly without cramming impossible doubles. If you miss multiple days, train light through the remainder and repeat that week next week.',
            },
        },
        {
            id: 'out_of_time',
            category: { es: 'Sesión', en: 'Workout' },
            question: {
                es: '¿Qué hago si me quedo sin tiempo para terminar la sesión?',
                en: 'What if I run out of time mid-workout?',
            },
            answer: {
                es: 'Si no podés volver más tarde ese mismo día para completar las series faltantes, cerrá la sesión y seguí adelante con la semana normal sin intentar "recuperar" ese volumen acumulándolo otro día. Procurá reservar bloques de tiempo realistas para completar tus días fuertes.',
                en: 'If you cannot return later the same day, end the workout and move forward with the program rather than stacking missed sets onto later sessions.',
            },
        },
        {
            id: 'pain_injury',
            category: { es: 'Salud', en: 'Safety' },
            question: {
                es: '¿Qué pasa si siento dolor agudo o no puedo hacer cierto ejercicio?',
                en: 'What if I feel sharp pain or cannot perform a given movement?',
            },
            answer: {
                es: 'Si sentís dolor agudo durante un levantamiento, frená inmediatamente el ejercicio y la rutina ese día; si persiste o es intenso, consultá a un médico. Además, seleccioná siempre ejercicios compatibles con el equipamiento de tu gimnasio y libres de dolor articular u ortopédico.',
                en: 'If you feel sharp pain, stop the session immediately and seek medical advice if needed. Only choose exercises you can perform comfortably without orthopedic pain and with available equipment.',
            },
        },
        {
            id: 'still_sore',
            category: { es: 'Recuperación', en: 'Recovery' },
            question: {
                es: 'Sigo adolorido cuando me toca volver a entrenar ese músculo. ¿Entreno igual?',
                en: 'I am still sore when that muscle comes up again. Should I train?',
            },
            answer: {
                es: 'Sí, entrená la sesión, pero asegurate de calificar ese grupo muscular como -1 (o -2 si el rendimiento cayó fuerte) al terminar. Eso reducirá las series programadas en las próximas sesiones hasta que tu recuperación alcance el ritmo del plan.',
                en: 'Train the session, and be sure to rate that muscle group -1 (or -2 if performance suffered) so upcoming set targets drop into a recoverable range.',
            },
        },
        {
            id: 'volume_easy_or_hard',
            category: { es: 'Volumen', en: 'Volume' },
            question: {
                es: '¿Qué hago si siento la Semana 1 muy liviana o las semanas finales muy duras?',
                en: 'What if Week 1 feels too easy or later weeks feel too tough?',
            },
            answer: {
                es: 'La Semana 1 suele sentirse accesible a propósito; si de verdad sobró energía, calificar +1/+2 hará subir el volumen rápidamente hacia tu MAV. En cambio, si el ciclo se vuelve abrumador, usá calificaciones -1/-2; si ni así baja lo suficiente, tomate media semana suave o recortá manualmente series de las semanas restantes y revisá tus 10RM iniciales.',
                en: 'Week 1 is meant to start submaximally; honest +1/+2 ratings quickly ramp volume toward MAV. Conversely, consistent -1/-2 ratings trim volume—if still overwhelmed, trim sets manually or check your 10RM inputs.',
            },
        },
        {
            id: 'stubborn_vs_fast',
            category: { es: 'Estética', en: 'Specialization' },
            question: {
                es: '¿Cómo priorizo músculos rezagados o ajusto grupos que crecen rápido?',
                en: 'How do I emphasize stubborn body parts or deemphasize fast growers?',
            },
            answer: {
                es: 'Primero asegurate de estar usando la plantilla de especialización correcta (Torso/Brazos, Espalda/Pecho o Piernas). Curiosamente, muchos músculos "tercos" están en realidad sobreentrenados: probá primero reducir ligeramente sus series para mejorar la recuperación. Si eso no basta, agregá +1 serie por ejercicio desde la Semana 1 al grupo prioritario y restá 1–2 series a un grupo secundario para no superar tu capacidad de recuperación global.',
                en: 'Ensure you pick the matching specialization split first. Surprisingly, stubborn muscles are often under-recovered—try lowering sets slightly first. Otherwise add +1 set per exercise on the priority muscle while trimming 1–2 sets from a secondary group.',
            },
        },
        {
            id: 'bodyweight_assisted',
            category: { es: 'Ejercicios', en: 'Exercises' },
            question: {
                es: '¿Cómo cargo pesos en dominadas o fondos (con lastre o asistidos)?',
                en: 'How should I track weights for pull-ups or dips (weighted or assisted)?',
            },
            answer: {
                es: 'Si podés hacer 6+ repeticiones limpias con peso corporal, usá lastre o solo tu peso corporal intentando sumar reps cada semana. Para el cálculo teórico de 10RM en lastre, se considera peso corporal + disco, restando luego tu peso corporal para saber cuánto disco colgar. Si usás máquina asistida, registrá únicamente el peso de contrapeso (a medida que progresás, el contrapeso baja).',
                en: 'If you hit 6+ clean bodyweight reps, use bodyweight or belt weight (progressing reps or load). On assisted pull-up/dip machines, track the assistance counterweight only and lower assistance over time.',
            },
        },
        {
            id: 'light_weights_m3',
            category: { es: 'Cargas', en: 'Weights' },
            question: {
                es: 'Mis pesos en el Meso 3 se sienten muy livianos y casi no suben cada semana. ¿Es normal?',
                en: 'Weights in Meso 3 feel light or barely change week-to-week. Is that normal?',
            },
            answer: {
                es: 'Totalmente normal. En Mesociclos 1 y 2 trabajás mayormente entre 8 y 12 reps, mientras que en el Mesociclo 3 Metabólico varias series llegan a 15–30 repeticiones con poco descanso para maximizar el estrés metabólico. Además, la carga objetivo crece ~2% por semana: con discos estándar muchas veces el peso queda igual y el progreso lo marca el aumento de series y repeticiones.',
                en: 'Completely normal. Meso 3 pushes 15–30 rep sets with short rests for metabolic stimulus. Weekly weight steps are ~2%, so standard plate rounding often holds load steady while sets and reps drive growth.',
            },
        },
        {
            id: 'update_10rm',
            category: { es: 'Progresión', en: 'Progression' },
            question: {
                es: '¿Cuándo debo actualizar mis referencias de 10RM?',
                en: 'How often should I update my 10RM baseline loads?',
            },
            answer: {
                es: 'Revisá tu historial de repeticiones al iniciar cada nuevo mesociclo. En la mayoría de los casos tu fuerza habrá subido tras completar el ciclo y el Deload, por lo que podés ajustar al alza tus pesos base de forma realista. Si dudás, conservá las cargas anteriores hasta comprobar 12 o 15+ reps limpias.',
                en: 'Review your logged rep history when starting each new mesocycle. Once you clearly exceed 12–15+ reps post-deload on an old load, bump your baseline conservatively.',
            },
        },
        {
            id: 'supersets_order',
            category: { es: 'Ejecución', en: 'Execution' },
            question: {
                es: '¿Puedo hacer superseries en Mesos 1, 2 o 4 o cambiar el orden de los ejercicios?',
                en: 'Can I superset outside Meso 3 or reorder exercises?',
            },
            answer: {
                es: 'Solo recomendamos superseries fuera del Meso 3 cuando estés muy corto de tiempo; en condiciones normales, las series rectas dan mejor recuperación local entre series pesadas. Lo mismo con el orden: mover un ejercicio puntualmente porque el rack está ocupado no pasa nada, pero respetá el orden original de forma habitual.',
                en: 'Stick to straight sets outside Meso 3 unless pressed for time, and follow the programmed exercise order consistently except for rare gym equipment bottlenecks.',
            },
        },
        {
            id: 'gear_belt',
            category: { es: 'Equipo', en: 'Gear' },
            question: {
                es: '¿Debo usar cinturón, rodilleras o muñequeras?',
                en: 'Should I use a lifting belt, wraps, or knee sleeves?',
            },
            answer: {
                es: 'Solo si realmente los necesitás para estabilidad o comodidad articular. Como guía general para entrenamiento de físico, el cinturón no suele ser necesario hasta manejar cargas pesadas en sentadillas o pesos muertos (por encima de ~140 kg / 315 lb), y las vendas rara vez hacen falta salvo molestia específica.',
                en: 'Only when genuinely needed. For physique-focused training, belts are typically unnecessary below ~315 lb / 140 kg squats/deadlifts, and wraps/sleeves are optional.',
            },
        },
        {
            id: 'show_prep',
            category: { es: 'Competición', en: 'Stage Prep' },
            question: {
                es: '¿Puedo usar estas rutinas para prepararme para una competencia o tarima?',
                en: 'Can I use this system to prep for a physique competition?',
            },
            answer: {
                es: 'Sí. La clave de planificación es hacer coincidir la semana de descarga (Deload) con tu última semana previa al torneo para disipar fatiga, recargar glucógeno y mostrar tu físico en su mejor punto sobre el escenario.',
                en: 'Yes. Simply align the deload week with your final week before the show so systemic fatigue clears, glycogen fills out, and you peak on stage.',
            },
        },
        {
            id: 'when_swap_exercise',
            category: { es: 'Variación', en: 'Variation' },
            question: {
                es: '¿Cuándo conviene cambiar o reemplazar un ejercicio entre mesociclos?',
                en: 'When should I delete and replace an exercise between mesocycles?',
            },
            answer: {
                es: 'Evaluá tres preguntas al cierre del mesociclo: (1) ¿Se estancó el rendimiento/PRs? (2) ¿Produce dolor articular o tendinoso persistente o en aumento que no se corrige con técnica? (3) ¿Se siente "quemado" (pérdida de conexión mente-músculo, bombeo y disrupción)? Si respondés "sí" a la mayoría —o a la pregunta #2 sin solución técnica— reemplazalo en el próximo mesociclo. Si recién introducís un ejercicio nuevo sin dolor agudo, dale al menos 1 mesociclo completo para pulir la técnica y el SFR antes de descartarlo.',
                en: 'Ask three questions near the end of your mesocycle: (1) Has performance/PR progression stalled? (2) Is it causing worsening joint or connective tissue pain not fixed by technique? (3) Does it feel stale (fading mind-muscle connection, pump, and local disruption)? If most answers are yes—or #2 persists—replace it next meso. Always give a new movement at least one full mesocycle unless sharp pain requires stopping.',
            },
        },
        {
            id: 'mv_mev_dead_zone',
            category: { es: 'Volumen', en: 'Volume' },
            question: {
                es: '¿Qué es la "zona muerta" entre MV y MEV en intermedios y avanzados?',
                en: 'What is the MV-to-MEV "dead zone" for intermediate and advanced lifters?',
            },
            answer: {
                es: 'A medida que ganás experiencia, tu MEV sube mucho más rápido que tu MV. Por ejemplo, un avanzado puede necesitar apenas 4 series semanales para mantener su espalda (MV = 4), pero al menos 10 series para hacerla crecer (MEV = 10). Hacer 7 series semanales genera fatiga innecesaria sin estimular crecimiento ni liberar recuperación: si mantenés un grupo o estás en fase de especialización para otros músculos, entrenalo estrictamente en su MV (4 series).',
                en: 'As you advance, MEV rises well above MV. An advanced lifter might hold back size on 4 weekly sets (MV = 4) while needing 10 sets to grow (MEV = 10). Doing 7 sets falls into a junk-volume dead zone—generating extra fatigue without new growth. During maintenance or specialization blocks, keep non-prioritized muscles strictly at MV.',
            },
        },
        {
            id: 'doms_required',
            category: { es: 'Estímulo', en: 'Stimulus' },
            question: {
                es: '¿Es obligatorio tener agujetas (DOMS) en cada sesión para crecer?',
                en: 'Is muscle soreness (DOMS) mandatory after every session to grow?',
            },
            answer: {
                es: 'No es un requisito indispensable en cada entrenamiento, pero sigue una curva en U invertida respecto al estímulo: la ausencia total de disrupción muscular a lo largo de varias semanas suele indicar volumen o cercanía al fallo insuficientes, mientras que agujetas incapacitantes que se superponen con la sesión siguiente arruinan el rendimiento y la sobrecarga. El punto óptimo es una disrupción o agujeta leve-moderada que se disipa justo a tiempo para la próxima sesión.',
                en: 'No—soreness is not strictly required every session, though it follows an inverted-U correlation with effective training. Zero detectable disruption over time often signals insufficient stimulus, whereas overlapping, debilitating soreness every week impairs progressive overload. Ideally, mild-to-moderate soreness resolves right before the next session targets that muscle.',
            },
        },
        {
            id: 'exercises_per_muscle',
            category: { es: 'Selección', en: 'Selection' },
            question: {
                es: '¿Cuántos ejercicios distintos por grupo muscular conviene usar por sesión y por semana?',
                en: 'How many distinct exercises per muscle group should I use per session and per week?',
            },
            answer: {
                es: 'Para la mayoría de los atletas, 1 a 3 ejercicios por músculo por sesión (el punto óptimo suele ser 1–2) y 2 a 4 variantes distintas por semana dentro de un mesociclo. Usar demasiados ejercicios en una sesión diluye el calentamiento y reduce el volumen efectivo por variante; cambiar ejercicios semana a semana rompe la adaptación dirigida y dificulta medir la sobrecarga progresiva.',
                en: 'Stick to 1–3 exercises per muscle group per session (with 1–2 as the practical sweet spot) and 2–4 distinct variants per week across the mesocycle. Packing too many lifts into one session wastes warm-up energy, and swapping exercises weekly breaks directed adaptation and progressive overload tracking.',
            },
        },
        {
            id: 'strength_vs_hypertrophy',
            category: { es: 'Progresión', en: 'Progression' },
            question: {
                es: '¿Por qué la fuerza en repeticiones define mejor el progreso entre macrociclos que semana a semana?',
                en: 'Why is rep-strength tracked best across mesocycles and macrocycles rather than week-to-week?',
            },
            answer: {
                es: 'El entrenamiento óptimo de fuerza máxima usa volúmenes más bajos y menor fatiga para expresar adaptaciones neurales; el de hipertrofia acumula volúmenes altos de MEV a MRV que enmascaran temporalmente tu fuerza real hacia el final del mesociclo. Por eso no conviene bajar volumen artificialmente para buscar un PR semanal: juzgá tu ganancia de masa muscular observando saltos de fuerza por repeticiones de un mesociclo o macrociclo al siguiente (especialmente al reintroducir un ejercicio tras meses sin hacerlo) junto con fotos, medidas y consistencia en el tiempo.',
                en: 'Strength-focused blocks use lower volume to reveal neural performance, whereas hypertrophy blocks accumulate high volume from MEV to MRV that temporarily masks underlying fitness. Never artificially slash volume mid-mesocycle just to hit weekly PRs; evaluate real tissue gain via rep-strength jumps mesocycle-to-mesocycle and macrocycle-to-macrocycle—especially PRs when reintroducing an exercise after a break—alongside visual trends.',
            },
        },
    ] as RpFaqItem[],
};
