import { Log, WorkoutSet } from '../types';
import { estimate1RM } from '../utils';
import { getEffectiveSetLoad, getLogBodyWeight } from './trainingMetrics';

export interface ExerciseHistorySummary {
    lastNote: string | null;
    bestHoldSeconds: number;
    bestBodyweightReps: number;
    bestBodyweightWeight: number;
    bestWeighted1RM: number;
    bestWeightedWeight: string | number | null;
    bestWeightedReps: string | number | null;
    bestEffective1RM: number;
    latestWorkingSets: WorkoutSet[] | null;
    latestCompletedSets: WorkoutSet[] | null;
}

const EMPTY_SUMMARY: ExerciseHistorySummary = {
    lastNote: null,
    bestHoldSeconds: 0,
    bestBodyweightReps: 0,
    bestBodyweightWeight: 0,
    bestWeighted1RM: 0,
    bestWeightedWeight: null,
    bestWeightedReps: null,
    bestEffective1RM: 0,
    latestWorkingSets: null,
    latestCompletedSets: null,
};

type CacheBucket = Map<string, Map<string, ExerciseHistorySummary>>;

// Logs are immutable-by-replacement in AppContext. Keep a small bucket per logs
// reference so card history (no fallback BW) and PR history (with fallback BW)
// can coexist without invalidating/rebuilding each other.
const historyCache = new WeakMap<Log[], CacheBucket>();

const normalizeBodyWeight = (value?: number) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

const cacheKeyForBodyWeight = (value?: number) => value == null ? 'bw:none' : `bw:${value}`;
const createSummary = (): ExerciseHistorySummary => ({ ...EMPTY_SUMMARY });

export const buildExerciseHistoryIndex = (
    logs: Log[],
    fallbackBodyWeight?: number,
): Map<string, ExerciseHistorySummary> => {
    const normalizedFallback = normalizeBodyWeight(fallbackBodyWeight);
    const cacheKey = cacheKeyForBodyWeight(normalizedFallback);
    const bucket = historyCache.get(logs);
    const cached = bucket?.get(cacheKey);
    if (cached) return cached;

    const result = new Map<string, ExerciseHistorySummary>();
    const validLogs = (Array.isArray(logs) ? logs : [])
        .filter((log): log is Log => !!log && typeof log === 'object' && !log.skipped)
        .slice()
        .sort((a, b) => (b.endTime || b.startTime || 0) - (a.endTime || a.startTime || 0));

    // Newest -> oldest means latest sets/notes are captured on first encounter.
    for (const log of validLogs) {
        if (!Array.isArray(log.exercises)) continue;
        const logBodyWeight = getLogBodyWeight(log, normalizedFallback);

        for (const exercise of log.exercises) {
            if (exercise?.id == null) continue;
            const exerciseId = String(exercise.id);
            let summary = result.get(exerciseId);
            if (!summary) {
                summary = createSummary();
                result.set(exerciseId, summary);
            }

            if (!summary.lastNote && exercise.note) {
                summary.lastNote = String(exercise.note);
            }

            const sets = Array.isArray(exercise.sets) ? exercise.sets : [];
            const completedSets = sets.filter(set => !!set?.completed && !set?.skipped);
            if (!summary.latestCompletedSets && completedSets.length > 0) {
                summary.latestCompletedSets = sets;
            }

            const workingSets = sets.filter(set => set && set.type !== 'warmup' && set.type !== 'avt_hop');
            if (!summary.latestWorkingSets && workingSets.length > 0) {
                summary.latestWorkingSets = workingSets;
            }

            for (const set of completedSets) {
                const duration = Number(set.duration) || 0;
                if (duration > summary.bestHoldSeconds) summary.bestHoldSeconds = duration;

                const reps = Number(set.reps) || 0;
                const externalWeight = Number(set.weight) || 0;

                if (
                    reps > summary.bestBodyweightReps ||
                    (reps === summary.bestBodyweightReps && externalWeight > summary.bestBodyweightWeight)
                ) {
                    summary.bestBodyweightReps = reps;
                    summary.bestBodyweightWeight = externalWeight;
                }

                if (externalWeight > 0 && reps > 0) {
                    const external1RM = estimate1RM(externalWeight, reps);
                    if (external1RM > summary.bestWeighted1RM) {
                        summary.bestWeighted1RM = external1RM;
                        summary.bestWeightedWeight = set.weight;
                        summary.bestWeightedReps = set.reps;
                    }
                }

                if (reps > 0) {
                    const effectiveLoad = getEffectiveSetLoad(set, exercise, logBodyWeight);
                    if (effectiveLoad > 0) {
                        const effective1RM = estimate1RM(effectiveLoad, reps);
                        if (effective1RM > summary.bestEffective1RM) {
                            summary.bestEffective1RM = effective1RM;
                        }
                    }
                }
            }
        }
    }

    const nextBucket = bucket || new Map<string, Map<string, ExerciseHistorySummary>>();
    nextBucket.set(cacheKey, result);
    if (!bucket) historyCache.set(logs, nextBucket);
    return result;
};

export const getExerciseHistorySummary = (
    logs: Log[],
    exerciseId: string,
    fallbackBodyWeight?: number,
): ExerciseHistorySummary => {
    if (!Array.isArray(logs) || logs.length === 0 || !exerciseId) return EMPTY_SUMMARY;
    return buildExerciseHistoryIndex(logs, fallbackBodyWeight).get(String(exerciseId)) || EMPTY_SUMMARY;
};

export const getHistoricalBest1RMIndex = (
    logs: Log[],
    fallbackBodyWeight?: number,
): Map<string, number> => {
    const summaries = buildExerciseHistoryIndex(logs, fallbackBodyWeight);
    const best = new Map<string, number>();
    for (const [exerciseId, summary] of summaries) {
        if (summary.bestEffective1RM > 0) best.set(exerciseId, summary.bestEffective1RM);
    }
    return best;
};
