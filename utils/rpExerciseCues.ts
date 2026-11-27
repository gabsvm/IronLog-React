import type { ExerciseDef, Log, MuscleGroup } from '../types';
import { getTranslated } from '../utils';
import { resolveExerciseId } from './exerciseLibrary';
import { getEffectiveSetLoad, getLogBodyWeight } from './trainingMetrics';

export interface MuscleSfrCue {
    cue: { es: string; en: string };
    commonMistake: { es: string; en: string };
    jointFriendlyTip: { es: string; en: string };
}

const MUSCLE_SFR_CUES: Partial<Record<MuscleGroup, MuscleSfrCue>> = {
    CHEST: {
        cue: {
            es: 'Pausa de 1 s abajo estirando el pectoral con escápulas retraídas.',
            en: '1 s deep stretch pause at the bottom with retracted scapulae.',
        },
        commonMistake: {
            es: 'Rebotar la barra o adelantar hombros al empujar.',
            en: 'Bouncing the bar off the chest or rolling shoulders forward.',
        },
        jointFriendlyTip: {
            es: 'Si molesta el hombro anterior, pasá a máquina convergente o mancuernas.',
            en: 'On shoulder irritation, switch to converging chest machine or dumbbells.',
        },
    },
    BACK: {
        cue: {
            es: 'Llevá los codos hacia la cadera dejando estirar la escápula arriba.',
            en: 'Drive elbows toward hips and allow full scapular stretch at top.',
        },
        commonMistake: {
            es: 'Tirar con bíceps/impulso lumbar acortando la fase excéntrica.',
            en: 'Arm-dominant jerking with lower back sway instead of controlled stretch.',
        },
        jointFriendlyTip: {
            es: 'Usá straps si el agarre falla y elegí remos con apoyo en pecho.',
            en: 'Use straps if grip bottlenecks; prefer chest-supported rows.',
        },
    },
    QUADS: {
        cue: {
            es: 'Buscá máxima flexión de rodilla (elevando talones si hace falta).',
            en: 'Maximize knee flexion (elevate heels if ankle mobility limits depth).',
        },
        commonMistake: {
            es: 'Cortar la profundidad o convertir la sentadilla en bisagra lumbar.',
            en: 'Cutting depth short or turning squats into a lower-back good morning.',
        },
        jointFriendlyTip: {
            es: 'Prensa, hack o extensiones con cadera estable dan alto SFR con menor fatiga axial.',
            en: 'Hack squat, leg press, or leg extensions deliver top SFR with low axial fatigue.',
        },
    },
    HAMSTRINGS: {
        cue: {
            es: 'Cadera atrás con rodilla casi fija en bisagras; controlá 2–3 s la bajada.',
            en: 'Push hips back with soft fixed knee on hinges; 2–3 s eccentric control.',
        },
        commonMistake: {
            es: 'Redondear la zona lumbar o despegar el muslo en curl femoral.',
            en: 'Rounding lumbar spine or lifting hips off the leg-curl pad.',
        },
        jointFriendlyTip: {
            es: 'Alterná días pesados de bisagra con curls sentado para no acumular DOMS excesivo.',
            en: 'Pair hinge days carefully with seated leg curls to manage severe DOMS.',
        },
    },
    SHOULDERS: {
        cue: {
            es: 'Elevá en plano escapular (~30° adelante) bajando con tensión constante.',
            en: 'Raise in the scapular plane (~30° forward) and keep constant bottom tension.',
        },
        commonMistake: {
            es: 'Encoger trapecios o balancear el torso con mancuernas demasiado pesadas.',
            en: 'Shrugging traps or swinging torso with overly heavy dumbbells.',
        },
        jointFriendlyTip: {
            es: 'Polea a la altura de la muñeca o máquina lateral dan tensión uniforme al hombro.',
            en: 'Wrist-height cable or machine lateral raises protect shoulder tendons.',
        },
    },
    BICEPS: {
        cue: {
            es: 'Codo fijo y extensión casi total abajo antes de subir sin balanceo.',
            en: 'Keep elbows pinned and reach near-full bottom stretch before curling.',
        },
        commonMistake: {
            es: 'Adelantar los codos al inicio para robar con deltoides anteriores.',
            en: 'Swinging elbows forward with front delts out of the bottom.',
        },
        jointFriendlyTip: {
            es: 'Barra Z, polea o mancuernas evitan sobrecarga en muñeca y tendón distal.',
            en: 'EZ bar, cable, or dumbbell variations relieve wrist and distal tendon stress.',
        },
    },
    TRICEPS: {
        cue: {
            es: 'Estirá a fondo con el brazo elevado o en ángulo neutro estable.',
            en: 'Maximize elbow flexion stretch (especially overhead) with stable upper arm.',
        },
        commonMistake: {
            es: 'Mover hombros arriba y abajo convirtiendo la extensión en pullover.',
            en: 'Drifting shoulders excessively instead of pivoting strictly around the elbow.',
        },
        jointFriendlyTip: {
            es: 'Si pica el codo, rotá a polea doble cuerda o press cerrado en máquina.',
            en: 'On elbow discomfort, swap to dual-rope pushdowns or machine close-grip press.',
        },
    },
    CALVES: {
        cue: {
            es: 'Pausa real de 2 s abajo en máximo estiramiento; prohibido rebotar.',
            en: 'Strict 2 s pause at full bottom stretch — zero Achilles tendon bounce.',
        },
        commonMistake: {
            es: 'Hacer rebotes elásticos rápidos en rango corto sin parar.',
            en: 'Bouncing quickly on the Achilles tendon through half-reps.',
        },
        jointFriendlyTip: {
            es: 'Entrenalos con piernas estiradas (gemelo de pie o en prensa) 10–25 reps.',
            en: 'Train with straight knees (standing/leg-press calf raise) for 10–25 reps.',
        },
    },
    GLUTES: {
        cue: {
            es: 'Buscá estiramiento profundo de cadera en zancadas/RDLs y control arriba.',
            en: 'Prioritize deep hip flexion stretch in lunges/RDLs plus clean lockout.',
        },
        commonMistake: {
            es: 'Hiperextender la espalda baja arriba en hip thrusts.',
            en: 'Hyperextending the lumbar spine at the top of hip thrusts.',
        },
        jointFriendlyTip: {
            es: 'Step-ups apoyados o prensa con pies altos dan alto SFR sin fatiga lumbar.',
            en: 'Supported step-ups or high-foot leg press maximize SFR without low-back tax.',
        },
    },
};

const DEFAULT_CUE: MuscleSfrCue = {
    cue: {
        es: 'Excéntrica controlada (2 s) con pausa breve en máximo estiramiento.',
        en: 'Controlled 2 s eccentric with a brief pause in the stretched position.',
    },
    commonMistake: {
        es: 'Usar impulso y acortar la zona más estirada del movimiento.',
        en: 'Using momentum and cutting short the stretched bottom range.',
    },
    jointFriendlyTip: {
        es: 'Elegí la variación que dé mayor bombeo sin molestia articular.',
        en: 'Pick the variation delivering maximum pump and soreness with zero joint nag.',
    },
};

export const getExerciseSfrCue = (muscle: MuscleGroup | string): MuscleSfrCue =>
    MUSCLE_SFR_CUES[muscle as MuscleGroup] || DEFAULT_CUE;

export interface ExercisePlateauAlert {
    exerciseId: string;
    exerciseName: string;
    muscle: MuscleGroup;
    stalledSessions: number;
    bestE1rmKg: number;
    latestE1rmKg: number;
    suggestion: { es: string; en: string };
}

/**
 * Plateau Detector (Phase 5):
 * Flags exercises that have been logged across >= 4 recent sessions spanning >= 2 mesos/weeks
 * without beating their rolling e1RM peak by >1%.
 */
export const detectExercisePlateaus = (
    logs: Log[],
    exercises: ExerciseDef[],
    lang: 'en' | 'es',
): ExercisePlateauAlert[] => {
    const byExercise = new Map<string, { time: number; e1rm: number; mesoId: number }[]>();

    const sortedLogs = [...(logs || [])]
        .filter((l) => !l.skipped)
        .sort((a, b) => (a.endTime || a.startTime) - (b.endTime || b.startTime));

    const exById = new Map((exercises || []).map((e) => [String(e.id), e]));

    for (const log of sortedLogs) {
        const logBw = getLogBodyWeight(log);
        for (const ex of log.exercises || []) {
            if (!ex.id || ex.muscle === 'CARDIO' || ex.isIsometric) continue;
            const canonicalId = resolveExerciseId(exercises || [], String(ex.id));
            const canonicalDef = exById.get(canonicalId);
            const eq = canonicalDef?.equipment ?? ex.equipment;
            const isBw = canonicalDef?.isBodyweight ?? ex.isBodyweight;
            const working = (ex.sets || []).filter((s) => s.completed && !s.skipped && s.type !== 'warmup' && s.type !== 'avt_hop');
            if (!working.length) continue;
            const e1rm = working.reduce((best, s) => {
                const r = Number(s.reps) || 0;
                if (r <= 0) return best;
                const eff = getEffectiveSetLoad(s, { isBodyweight: isBw, equipment: eq }, logBw);
                if (eff <= 0) return best;
                return Math.max(best, eff * (1 + r / 30));
            }, 0);
            if (e1rm <= 0) continue;
            const list = byExercise.get(canonicalId) || [];
            list.push({ time: log.endTime || log.startTime || 0, e1rm, mesoId: log.mesoId });
            byExercise.set(canonicalId, list);
        }
    }

    const alerts: ExercisePlateauAlert[] = [];
    for (const [exId, history] of byExercise.entries()) {
        if (history.length < 4) continue;
        const tail = history.slice(-4);
        const peakPrior = Math.max(...history.slice(0, -3).map((h) => h.e1rm), tail[0].e1rm);
        const tailMax = Math.max(...tail.map((h) => h.e1rm));
        const latest = tail[tail.length - 1].e1rm;
        const distinctMesos = new Set(tail.map((t) => t.mesoId)).size;

        if (tailMax <= peakPrior * 1.01 && (distinctMesos >= 2 || history.length >= 5)) {
            const def = (exercises || []).find((e) => e.id === exId);
            if (!def) continue;
            alerts.push({
                exerciseId: exId,
                exerciseName: getTranslated(def.name, lang) || exId,
                muscle: def.muscle,
                stalledSessions: tail.length,
                bestE1rmKg: Math.round(peakPrior * 10) / 10,
                latestE1rmKg: Math.round(latest * 10) / 10,
                suggestion: {
                    es: 'e1RM estancado: rotá este ejercicio o cambiá de rango de reps (ej. 5–10 ↔ 10–20) en tu próximo mesociclo.',
                    en: 'Stalled e1RM: rotate this lift or shift rep range (e.g. 5–10 ↔ 10–20) next mesocycle.',
                },
            });
        }
    }

    return alerts.slice(0, 5);
};
