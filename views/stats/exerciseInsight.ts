// S6: pure insight builder for the selected exercise (moved from the Stats data hook).
import type { ExerciseDef, Lang, Log, WeightUnit } from '../../types';
import { exerciseIdGroup } from '../../utils/exerciseLibrary';
import { getEffectiveSetLoad, getLogBodyWeight, getSetLoadVolume } from '../../utils/trainingMetrics';
import { formatWeight, toDisplay } from '../../utils/units';
import { getBodyweightLevel, getExerciseStrengthProfile, getWeightedLevel, type PerformanceBand } from './statsHelpers';

/**
 * S6: the selected-exercise insight (best sets, level, volume status), moved
 * verbatim out of the Stats data hook as a pure function.
 */
export const buildSelectedExerciseInsight = ({
    currentEx, exercises, lang, rawMuscleCounts, safeLogs, bodyWeight, scopeMesoId, unit, weightSuffix, s,
}: {
    currentEx: any;
    exercises: ExerciseDef[];
    lang: Lang;
    rawMuscleCounts: Record<string, number>;
    safeLogs: Log[];
    bodyWeight: number | undefined;
    scopeMesoId: number | null | undefined;
    unit: WeightUnit;
    weightSuffix: string;
    s: any;
}) => {
    if (!currentEx) return null;

    const matchingLogs = safeLogs.filter(log => !log.skipped && (scopeMesoId == null || log.mesoId === scopeMesoId));
    // The insight aggregates every id merged into the selected exercise.
    const groupIds = new Set(exerciseIdGroup(exercises, String(currentEx.id)).map(String));
    let bestReps = 0;
    let bestAddedLoad = 0;
    let bestEstimated1RM = 0;
    let bestHoldSeconds = 0;
    let totalVolume = 0;

    matchingLogs.forEach(log => {
        const logBodyWeight = getLogBodyWeight(log, bodyWeight);
        const matches = (log.exercises || []).filter(ex => ex?.id != null && groupIds.has(String(ex.id)));

        matches.forEach(exercise => {
            (exercise.sets || []).forEach(set => {
                if (!set.completed || set.skipped) return;

                const reps = Number(set.reps || 0);
                const addedLoad = Number(set.weight || 0);
                const effectiveLoad = getEffectiveSetLoad(set, exercise, logBodyWeight);

                totalVolume += getSetLoadVolume(set, exercise, logBodyWeight);
                if (reps > bestReps) bestReps = reps;
                if (addedLoad > bestAddedLoad) bestAddedLoad = addedLoad;
                if (Number(set.duration || 0) > bestHoldSeconds) bestHoldSeconds = Number(set.duration || 0);

                if (effectiveLoad > 0 && reps > 0 && !exercise.isIsometric && exercise.muscle !== 'CARDIO') {
                    const e1rm = effectiveLoad * (1 + reps / 30);
                    if (e1rm > bestEstimated1RM) bestEstimated1RM = e1rm;
                }
            });
        });
    });

    const profile = getExerciseStrengthProfile(currentEx);
    const muscleWeeklySets = rawMuscleCounts[currentEx.muscle] || 0;
    const volumeStatus =
        muscleWeeklySets < 6 ? { id: 'low', label: s.volLow } :
        muscleWeeklySets < 10 ? { id: 'maintenance', label: s.volBase } :
        muscleWeeklySets <= 20 ? { id: 'optimal', label: s.volOptimal } :
        { id: 'high', label: s.volHigh };

    let level: PerformanceBand | null = null;
    let rationale = '';

    if (currentEx.isBodyweight) {
        level = getBodyweightLevel(profile, bestReps, bestAddedLoad, (currentEx as any).skillLevel, bestHoldSeconds);
        rationale = currentEx.isIsometric
            ? `${s.bestHold} ${bestHoldSeconds}s`
            : `${s.bestSet} ${bestReps} reps${bestAddedLoad > 0 ? ` + ${formatWeight(bestAddedLoad, unit, lang)}${weightSuffix}` : ''}`;
    } else if (!currentEx.isIsometric && currentEx.muscle !== 'CARDIO' && bodyWeight) {
        const relativeStrength = bestEstimated1RM / bodyWeight;
        level = getWeightedLevel(profile, relativeStrength);
        rationale = `${s.rel1rm} ${relativeStrength.toFixed(2)}x ${s.bodyweightWord}`;
    } else if (!currentEx.isIsometric && currentEx.muscle !== 'CARDIO' && bestEstimated1RM > 0) {
        level = bestEstimated1RM >= 100 ? 'advanced' : bestEstimated1RM >= 50 ? 'intermediate' : 'beginner';
        rationale = `${s.est1rm} ${Math.round(toDisplay(bestEstimated1RM, unit))}${weightSuffix} ${s.noBodyweight}`;
    }

    const volumeBasis = currentEx.muscle === 'CARDIO'
        ? s.cardioBasis
        : currentEx.isIsometric
            ? s.isoBasis
            : currentEx.isBodyweight
                ? `${s.bwBasisA}${bodyWeight ? ` (${formatWeight(bodyWeight, unit, lang)}${weightSuffix})` : ''} ${s.bwBasisB}`
                : s.extBasis;

    return {
        volumeBasis,
        level,
        rationale,
        totalVolume,
        muscleWeeklySets,
        volumeStatus,
    };
};
