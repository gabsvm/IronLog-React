import type {
    EquipmentType,
    ExerciseDef,
    ExerciseFeedbackRecord,
    Log,
    MesoCycle,
    MuscleGroup,
    MusclePriorityLevel,
    SessionExercise,
    VolumeProgressionProfile,
    WeightUnit,
    WorkoutSet,
} from '../types';
import { getTranslated } from '../utils';
import { resolveExerciseId } from './exerciseLibrary';
import { PROGRESSION_STEP, toDisplay } from './units';

export const EXERCISE_SFR_STORAGE_KEY = 'mevra_exercise_sfr_v1';

export const DELOAD_ACCESSORY_MUSCLES: ReadonlySet<MuscleGroup> = new Set<MuscleGroup>([
    'CALVES',
    'ABS',
    'FOREARMS',
    'TRAPS',
]);

/**
 * Computes the official RP Hypertrophy App target RIR ramp for a mesocycle week:
 * Week 1 = 3 RIR, descending cleanly to 0 RIR on the final accumulation week,
 * and 5 RIR on Deload.
 */
export const getTargetRirForWeek = (week: number, totalWeeks: number, isDeload: boolean): number => {
    if (isDeload) return 5;
    const accumWeeks = Math.max(2, totalWeeks >= 4 ? totalWeeks - 1 : totalWeeks);
    if (week <= 1) return 3;
    if (week >= accumWeeks) return 0;
    const progress = (week - 1) / Math.max(1, accumWeeks - 1);
    return Math.max(0, Math.round(3 - progress * 3));
};

export interface PredictiveSetTarget {
    mode: 'reps' | 'rir';
    targetWeightKg: number;
    targetReps: number;
    targetRir: number;
    deltaType: 'rep_bump' | 'load_bump' | 'matched_weight' | 'deload' | 'rir_fallback';
}

const roundToStepKg = (kg: number, unit: WeightUnit): number => {
    const step = PROGRESSION_STEP[unit];
    if (unit === 'lb') {
        const lbs = Math.round(toDisplay(kg, 'lb') / step) * step;
        return Math.round((lbs / 2.20462262) * 100) / 100;
    }
    return Math.round((Math.round(kg / step) * step) * 100) / 100;
};

/**
 * RP Hypertrophy App Predictive Weight-Change Matching:
 * - Week-to-week overload prescribes +1 rep (or ~2.5-5% weight step).
 * - If user edits weight manually within ±18% of baseline, recalculates target reps
 *   to preserve relative e1RM overload (e.g., dropping back to prevWeight -> prevReps + 1).
 * - Beyond ±18% swing, drops numeric rep prediction and falls back cleanly to RIR target.
 */
export const predictSetTarget = (input: {
    prevWeightKg?: number | string;
    prevReps?: number | string;
    currentWeightKg?: number | string;
    unit: WeightUnit;
    targetRir: number;
    week: number;
    isDeload: boolean;
    isBodyweight?: boolean;
    equipment?: EquipmentType;
    bodyWeightKg?: number;
}): PredictiveSetTarget => {
    const prevW = Number(input.prevWeightKg) || 0;
    const prevR = Number(input.prevReps) || 0;
    const currW = Number(input.currentWeightKg) || 0;
    const isAssisted = input.equipment === 'machine_assistance';

    if (input.isBodyweight && !isAssisted && prevW <= 0 && prevR > 0) {
        return {
            mode: 'reps',
            targetWeightKg: 0,
            targetReps: input.isDeload ? Math.max(4, Math.round(prevR * 0.6)) : prevR + 1,
            targetRir: input.isDeload ? 5 : input.targetRir,
            deltaType: input.isDeload ? 'deload' : 'rep_bump',
        };
    }

    if (prevW <= 0 || prevR <= 0) {
        return {
            mode: 'rir',
            targetWeightKg: currW > 0 ? currW : 0,
            targetReps: prevR > 0 ? prevR : 8,
            targetRir: input.targetRir,
            deltaType: input.isDeload ? 'deload' : 'rir_fallback',
        };
    }

    if (input.isDeload) {
        const deloadW = isAssisted
            ? roundToStepKg(prevW * 1.15, input.unit)
            : roundToStepKg(prevW * 0.85, input.unit);
        const deloadR = Math.max(4, Math.round(prevR * 0.6));
        return {
            mode: 'reps',
            targetWeightKg: deloadW,
            targetReps: deloadR,
            targetRir: 5,
            deltaType: 'deload',
        };
    }

    const bodyW = Math.max(40, input.bodyWeightKg || 75);
    if (isAssisted) {
        const effPrevW = Math.max(5, bodyW - prevW);
        const smallStep = Math.max(PROGRESSION_STEP[input.unit], prevW * 0.05);
        const prescribedW = prevR < 10 ? Math.max(0, roundToStepKg(prevW - smallStep, input.unit)) : prevW;
        const effectiveCurrExternalW = currW > 0 ? currW : prescribedW;
        const effCurrW = Math.max(5, bodyW - effectiveCurrExternalW);
        const pctDiff = Math.abs(effCurrW - effPrevW) / Math.max(5, effPrevW);

        if (currW > 0 && pctDiff > 0.18) {
            return {
                mode: 'rir',
                targetWeightKg: effectiveCurrExternalW,
                targetReps: prevR,
                targetRir: input.targetRir,
                deltaType: 'rir_fallback',
            };
        }

        const prevE1rm = effPrevW * (1 + prevR / 30);
        const targetE1rm = prevE1rm * 1.015;
        let matchedReps = Math.round(((targetE1rm / Math.max(5, effCurrW)) - 1) * 30);
        if (Math.abs(effectiveCurrExternalW - prevW) < 0.25) {
            matchedReps = Math.max(prevR + 1, matchedReps);
        } else if (effectiveCurrExternalW > prevW) {
            // More counterweight = easier -> require +2 reps
            matchedReps = Math.max(prevR + 2, matchedReps);
        } else {
            // Less counterweight = harder
            matchedReps = Math.max(1, Math.min(prevR, matchedReps));
        }
        const deltaType = currW > 0 && Math.abs(currW - prescribedW) >= 0.25
            ? 'matched_weight'
            : prescribedW < prevW
                ? 'load_bump'
                : 'rep_bump';

        return {
            mode: 'reps',
            targetWeightKg: effectiveCurrExternalW,
            targetReps: Math.max(1, matchedReps),
            targetRir: input.targetRir,
            deltaType,
        };
    }

    const bwOffset = input.isBodyweight ? bodyW : 0;
    const effPrevW = prevW + bwOffset;
    const smallLoadBump = Math.max(PROGRESSION_STEP[input.unit], prevW * 0.025);
    const prescribedW = prevR < 10 ? roundToStepKg(prevW + smallLoadBump, input.unit) : prevW;
    const prescribedR = prevR < 10 ? prevR : prevR + 1;

    const effectiveCurrExternalW = currW > 0 ? currW : prescribedW;
    const effCurrW = effectiveCurrExternalW + bwOffset;
    const pctDiff = Math.abs(effCurrW - effPrevW) / Math.max(0.5, effPrevW);

    if (currW > 0 && pctDiff > 0.18) {
        return {
            mode: 'rir',
            targetWeightKg: effectiveCurrExternalW,
            targetReps: prevR,
            targetRir: input.targetRir,
            deltaType: 'rir_fallback',
        };
    }

    // Epley-based relative e1RM overload match
    const prevE1rm = effPrevW * (1 + prevR / 30);
    const targetE1rm = prevE1rm * 1.015;
    let matchedReps = Math.round(((targetE1rm / Math.max(0.5, effCurrW)) - 1) * 30);

    // Exact RP rule: returning to last week's weight must require at least prevReps + 1
    if (Math.abs(effectiveCurrExternalW - prevW) < 0.25) {
        matchedReps = Math.max(prevR + 1, matchedReps);
    } else if (effectiveCurrExternalW < prevW) {
        matchedReps = Math.max(prevR + 2, matchedReps);
    } else {
        matchedReps = Math.max(1, Math.min(prevR, matchedReps));
    }

    const deltaType = currW > 0 && Math.abs(currW - prescribedW) >= 0.25
        ? 'matched_weight'
        : prescribedW > prevW
            ? 'load_bump'
            : 'rep_bump';

    return {
        mode: 'reps',
        targetWeightKg: effectiveCurrExternalW,
        targetReps: Math.max(1, matchedReps),
        targetRir: input.targetRir,
        deltaType,
    };
};

/**
 * RP Priority-Aware Set Adjustment Engine:
 * - `maintain`: locked at MV (`<= 0` set additions; only reduces on excessive fatigue/pain)
 * - `grow`: conservative `+1` only with strong recovery
 * - `emphasize`: aggressive `+1` (or `+2` on zero fatigue + low pump)
 * - `volumeProfile`: 'conservative' dampens jumps (Anti-Volume Trap), 'standard' (RP 1:1), 'aggressive'
 * - "Pushed my limits" (`workload === 2`) caps set additions at 0 across all tiers.
 */
export const computePriorityAwareSetDelta = (input: {
    jointPain: number;
    soreness: number;
    pump: number;
    workload: number;
    priority?: MusclePriorityLevel;
    volumeProfile?: VolumeProgressionProfile;
}): number => {
    const { jointPain, soreness, pump, workload, priority = 'grow', volumeProfile = 'standard' } = input;

    if (jointPain >= 2 || soreness === 3 || workload === 3) {
        return soreness === 3 && workload === 3 ? -2 : -1;
    }

    if (priority === 'maintain') {
        return 0;
    }

    // Workload 2 = "Pushed my limits" -> hard cap preventing upward additions
    if (workload >= 2) {
        return 0;
    }

    // Amazing pump acts as neutral-to-cap signal when paired with moderate fatigue
    if (pump >= 2 && (soreness >= 1 || workload >= 1)) {
        return 0;
    }

    if (volumeProfile === 'conservative') {
        if (jointPain === 0 && soreness === 0 && workload === 0) {
            return 1;
        }
        return 0;
    }

    if (priority === 'emphasize') {
        if (jointPain === 0 && soreness === 0 && workload === 0 && pump <= 1) {
            return pump === 0 ? 2 : 1;
        }
        if (jointPain === 0 && soreness <= 1 && workload <= 1) {
            return 1;
        }
        return 0;
    }

    if (volumeProfile === 'aggressive' && jointPain === 0 && soreness === 0 && workload === 0 && pump === 0) {
        return 2;
    }

    // Standard `grow`
    if (jointPain === 0 && soreness <= 1 && (workload === 0 || (workload === 1 && pump <= 1))) {
        return 1;
    }

    return 0;
};

export const explainPriorityAwareSetDelta = (input: {
    jointPain: number;
    soreness: number;
    pump: number;
    workload: number;
    priority?: MusclePriorityLevel;
    volumeProfile?: VolumeProgressionProfile;
    delta: number;
}): { es: string; en: string } => {
    const { jointPain, soreness, workload, priority = 'grow', volumeProfile = 'standard', delta } = input;

    if (delta < 0) {
        return jointPain >= 2
            ? {
                  es: `Dolor articular elevado → descarga ${delta} serie para proteger tejido conectivo.`,
                  en: `Elevated joint pain → reducing ${delta} set to protect connective tissue.`,
              }
            : {
                  es: `Fatiga/agujetas acumuladas → descarga ${delta} serie la próxima semana.`,
                  en: `Lingering soreness/fatigue → pulling back ${delta} set next week.`,
              };
    }

    if (priority === 'maintain') {
        return {
            es: 'Prioridad Maintain: volumen bloqueado en mantenimiento (MV) para ahorrar recuperación.',
            en: 'Maintain priority: volume locked at Maintenance Volume (MV) to save recovery.',
        };
    }

    if (workload >= 2 && delta === 0) {
        return {
            es: 'Esfuerzo "Al límite" cerca del MRV → mantenemos series para no caer en junk volume.',
            en: '"Pushed my limits" near MRV → holding sets steady to prevent junk volume.',
        };
    }

    if (delta > 0) {
        const tag = priority === 'emphasize' ? 'Emphasize' : volumeProfile === 'conservative' ? 'Conservador' : 'Óptimo';
        return {
            es: `Recuperación limpia + 0 dolor (${tag}) → +${delta} ${delta === 1 ? 'serie' : 'series'} la próxima semana.`,
            en: `Clean recovery + zero pain (${tag}) → +${delta} ${delta === 1 ? 'set' : 'sets'} next week.`,
        };
    }

    if (soreness >= 2) {
        return {
            es: 'Agujetas curadas justo a tiempo → mantenemos volumen estable sin sobrecargar.',
            en: 'Soreness healed just on time → holding current set target steady.',
        };
    }

    return {
        es: 'Estímulo y recuperación equilibrados → mantenemos las series actuales.',
        en: 'Balanced stimulus & recovery → maintaining current weekly sets.',
    };
};

export interface EarlyDeloadStatus {
    status: 'ok' | 'single_miss' | 'early_deload_recommended';
    consecutiveMisses: number;
    affectedExercises: string[];
}

/**
 * Evaluates logs inside the active mesocycle for RP's 1-miss vs 2-miss rule:
 * - 1 session missing prior rep/weight expectations = normal off-day ('single_miss')
 * - >= 2 consecutive sessions missing prior expectations = 'early_deload_recommended'
 */
export const detectConsecutiveMissesAndEarlyDeload = (
    logs: Log[],
    activeMeso: MesoCycle | null,
): EarlyDeloadStatus => {
    if (!activeMeso || activeMeso.isDeload) {
        return { status: 'ok', consecutiveMisses: 0, affectedExercises: [] };
    }

    const mesoLogs = (logs || [])
        .filter((l) => l.mesoId === activeMeso.id && !l.skipped)
        .sort((a, b) => (b.endTime || b.startTime) - (a.endTime || a.startTime));

    if (mesoLogs.length < 2) {
        return { status: 'ok', consecutiveMisses: 0, affectedExercises: [] };
    }

    const didSessionMiss = (log: Log, allPrev: Log[]): string[] => {
        const missedIds: string[] = [];
        const priorLogs = allPrev.filter((p) => (p.endTime || p.startTime) < (log.endTime || log.startTime));
        for (const ex of log.exercises || []) {
            if (ex.muscle === 'CARDIO') continue;
            const currDone = (ex.sets || []).filter((s) => s.completed && !s.skipped && s.type !== 'warmup');
            if (!currDone.length) continue;
            const isAssisted = ex.equipment === 'machine_assistance';
            const currBest = currDone.reduce((best, s) => {
                const effW = isAssisted ? Math.max(5, 75 - Number(s.weight || 0)) : Number(s.weight);
                return Math.max(best, effW * (1 + Number(s.reps) / 30));
            }, 0);

            const prevMatch = priorLogs
                .map((pl) => (pl.exercises || []).find((pe) => pe.id === ex.id))
                .find(Boolean);
            if (!prevMatch) continue;
            const prevDone = (prevMatch.sets || []).filter((s) => s.completed && !s.skipped && s.type !== 'warmup');
            if (!prevDone.length) continue;
            const prevBest = prevDone.reduce((best, s) => {
                const effW = isAssisted ? Math.max(5, 75 - Number(s.weight || 0)) : Number(s.weight);
                return Math.max(best, effW * (1 + Number(s.reps) / 30));
            }, 0);

            if (prevBest > 0 && currBest < prevBest * 0.96) {
                missedIds.push(ex.id);
            }
        }
        return missedIds;
    };

    let streak = 0;
    const affected = new Set<string>();
    for (const log of mesoLogs.slice(0, 4)) {
        const missed = didSessionMiss(log, mesoLogs);
        if (missed.length > 0) {
            streak += 1;
            missed.forEach((id) => affected.add(id));
        } else {
            break;
        }
    }

    if (streak >= 2) {
        return {
            status: 'early_deload_recommended',
            consecutiveMisses: streak,
            affectedExercises: Array.from(affected),
        };
    }

    if (streak === 1) {
        return {
            status: 'single_miss',
            consecutiveMisses: 1,
            affectedExercises: Array.from(affected),
        };
    }

    return { status: 'ok', consecutiveMisses: 0, affectedExercises: [] };
};

export const loadExerciseSfrHistory = (): Record<string, ExerciseFeedbackRecord> => {
    try {
        const raw = localStorage.getItem(EXERCISE_SFR_STORAGE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
};

export const recordExerciseSfrFeedback = (
    exerciseId: string,
    feedback: { jointPain: number; pump?: number; soreness?: number },
): ExerciseFeedbackRecord => {
    const history = loadExerciseSfrHistory();
    const prev = history[exerciseId];
    const count = (prev?.count || 0) + 1;
    const prevJointSum = (prev?.avgJointPain ?? 0) * (prev?.count || 0);
    const prevPumpSum = (prev?.avgPump ?? 1) * (prev?.count || 0);
    const avgJointPain = Math.round(((prevJointSum + feedback.jointPain) / count) * 100) / 100;
    const avgPump = Math.round(((prevPumpSum + (feedback.pump ?? 1)) / count) * 100) / 100;

    const nextRecord: ExerciseFeedbackRecord = {
        jointPain: feedback.jointPain,
        pump: feedback.pump,
        soreness: feedback.soreness,
        updatedAt: Date.now(),
        count,
        avgJointPain,
        avgPump,
    };

    try {
        localStorage.setItem(EXERCISE_SFR_STORAGE_KEY, JSON.stringify({
            ...history,
            [exerciseId]: nextRecord,
        }));
    } catch { /* ignore quota failures */ }

    return nextRecord;
};

export const getExerciseSfrScore = (record?: ExerciseFeedbackRecord): number => {
    if (!record) return 0;
    const jointPenalty = record.jointPain >= 2 ? 3.5 : record.avgJointPain * 1.6;
    const raw = 5.5 + record.avgPump * 2.0 - jointPenalty * 1.4;
    return Math.round(Math.max(0, Math.min(10, raw)) * 10) / 10;
};

export const hasJointPainWarning = (record?: ExerciseFeedbackRecord): boolean => {
    if (!record) return false;
    return record.jointPain >= 2 || record.avgJointPain >= 1.5;
};

/**
 * Converts uncompleted sets on an exercise into a lightweight RP Recovery Session:
 * max 2 light flush sets at ~50% weight and 5 RIR so systemic recovery catches up.
 */
export const applyRecoverySessionToExercise = (
    ex: SessionExercise,
    unit: WeightUnit = 'kg',
): SessionExercise => {
    const sets = ex.sets || [];
    const completedSets = sets.filter((s) => s.completed);
    const uncompleted = sets.filter((s) => !s.completed);
    const keepUncompleted = uncompleted.slice(0, 2).map((s: WorkoutSet) => {
        const refW = Number(s.weight || s.hintWeight || s.prevWeight || 0);
        const recoveryW = refW > 0 ? roundToStepKg(refW * 0.5, unit) : '';
        return {
            ...s,
            weight: recoveryW !== '' ? String(recoveryW) : s.weight,
            hintWeight: recoveryW !== '' ? recoveryW : s.hintWeight,
            targetRpe: 5,
            type: 'regular' as const,
            skipped: false,
        };
    });

    return {
        ...ex,
        sets: [...completedSets, ...keepUncompleted],
    };
};

export const getMuscleGroupCheckinPriorityLabel = (
    priority?: MusclePriorityLevel,
): { en: string; es: string } => {
    if (priority === 'emphasize') return { es: 'Prioridad Alta (MEV→MRV)', en: 'Emphasize (MEV→MRV)' };
    if (priority === 'maintain') return { es: 'Mantenimiento (MV fijo)', en: 'Maintain (MV capped)' };
    return { es: 'Crecimiento (MAV)', en: 'Grow (MAV)' };
};

export const isRetrospectiveSorenessDue = (
    muscle: MuscleGroup | string,
    week: number,
    activeMesoLogsCountForMuscle: number,
    sessionCheckins?: Record<string, { soreness: number; recoveryMode: boolean }>,
): boolean => {
    if (!muscle || muscle === 'CARDIO') return false;
    if (sessionCheckins && sessionCheckins[muscle]) return false;
    return week > 1 || activeMesoLogsCountForMuscle > 0;
};

export interface ExerciseSfrRankEntry {
    exerciseId: string;
    exerciseName: string;
    muscle: MuscleGroup | string;
    sfrScore: number;
    avgJointPain: number;
    avgPump: number;
    jointPainWarning: boolean;
    count: number;
}

/**
 * Ranks logged exercises across mesocycles from persisted `mevra_exercise_sfr_v1`
 * feedback by descending Stimulus-to-Fatigue Ratio (SFR), flagging any joint nag.
 */
export const getExerciseSfrRanking = (
    history: Record<string, ExerciseFeedbackRecord>,
    exercises: readonly ExerciseDef[],
    lang: 'en' | 'es',
): ExerciseSfrRankEntry[] => {
    if (!history || typeof history !== 'object') return [];
    const byId = new Map((exercises || []).map((e) => [String(e.id), e]));
    const mergedRecords = new Map<string, ExerciseFeedbackRecord>();

    for (const [rawId, rec] of Object.entries(history)) {
        if (!rec || rec.count <= 0) continue;
        const canonicalId = resolveExerciseId(exercises || [], String(rawId));
        const existing = mergedRecords.get(canonicalId);
        if (!existing) {
            mergedRecords.set(canonicalId, { ...rec });
        } else {
            const totalCount = existing.count + rec.count;
            const latest = (rec.updatedAt || 0) >= (existing.updatedAt || 0) ? rec : existing;
            mergedRecords.set(canonicalId, {
                ...latest,
                avgJointPain: Number(((existing.avgJointPain * existing.count + rec.avgJointPain * rec.count) / totalCount).toFixed(2)),
                avgPump: Number(((existing.avgPump * existing.count + rec.avgPump * rec.count) / totalCount).toFixed(2)),
                count: totalCount,
                updatedAt: Math.max(existing.updatedAt || 0, rec.updatedAt || 0),
            });
        }
    }

    return Array.from(mergedRecords.entries())
        .map(([exId, rec]) => {
            const def = byId.get(String(exId));
            return {
                exerciseId: exId,
                exerciseName: def ? String(getTranslated(def.name, lang) || exId) : exId,
                muscle: def?.muscle || 'CHEST',
                sfrScore: getExerciseSfrScore(rec),
                avgJointPain: rec.avgJointPain,
                avgPump: rec.avgPump,
                jointPainWarning: hasJointPainWarning(rec),
                count: rec.count,
            };
        })
        .sort((a, b) => b.sfrScore - a.sfrScore || a.avgJointPain - b.avgJointPain);
};
