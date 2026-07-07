import { ExerciseDef, Log, WorkoutSet } from '../types';

export const getLogBodyWeight = (log: Pick<Log, 'bodyWeightSnapshot'>, fallbackBodyWeight?: number) => {
    const snapshot = Number(log.bodyWeightSnapshot);
    if (Number.isFinite(snapshot) && snapshot > 0) return snapshot;
    const fallback = Number(fallbackBodyWeight);
    return Number.isFinite(fallback) && fallback > 0 ? fallback : undefined;
};

export const getEffectiveSetLoad = (
    set: Pick<WorkoutSet, 'weight'>,
    exercise: Pick<ExerciseDef, 'isBodyweight'>,
    userBodyWeight?: number
) => {
    const externalLoad = Number(set.weight || 0);
    const baseBodyWeight = exercise.isBodyweight ? Math.max(0, Number(userBodyWeight || 0)) : 0;
    return externalLoad + baseBodyWeight;
};

export const getSetLoadVolume = (
    set: Pick<WorkoutSet, 'weight' | 'reps' | 'completed' | 'skipped'>,
    exercise: Pick<ExerciseDef, 'isBodyweight'>,
    userBodyWeight?: number
) => {
    if (!set.completed || set.skipped) return 0;
    const reps = Number(set.reps || 0);
    if (reps <= 0) return 0;
    const load = getEffectiveSetLoad(set, exercise, userBodyWeight);
    if (load <= 0) return 0;
    return load * reps;
};
