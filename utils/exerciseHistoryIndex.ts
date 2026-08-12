import { Log, WorkoutSet } from '../types';
import { estimate1RM } from '../utils';

export interface ExerciseHistorySummary {
    lastNote: string | null;
    bestHoldSeconds: number;
    bestBodyweightReps: number;
    bestBodyweightWeight: number;
    bestWeighted1RM: number;
    bestWeightedWeight: string | number | null;
    bestWeightedReps: string | number | null;
    oneRMHistory: number[];
    latestWorkingSets: WorkoutSet[] | null;
    latestCompletedSets: WorkoutSet[] | null;
}

interface MutableSummary extends ExerciseHistorySummary {
    oneRMSessions: { at: number; value: number }[];
}

const EMPTY_SUMMARY: ExerciseHistorySummary = {
    lastNote: null,
    bestHoldSeconds: 0,
    bestBodyweightReps: 0,
    bestBodyweightWeight: 0,
    bestWeighted1RM: 0,
    bestWeightedWeight: null,
    bestWeightedReps: null,
    oneRMHistory: [],
    latestWorkingSets: null,
    latestCompletedSets: null,
};

// Logs are immutable-by-replacement in AppContext. A WeakMap therefore gives us
// exactly the cache lifecycle we want: one O(history) build per logs reference,
// automatic GC when that history version is no longer referenced.
const historyCache = new WeakMap<Log[], Map<string, ExerciseHistorySummary>>();

const createMutable = (): MutableSummary => ({
    ...EMPTY_SUMMARY,
    oneRMHistory: [],
    oneRMSessions: [],
});

export const buildExerciseHistoryIndex = (logs: Log[]): Map<string, ExerciseHistorySummary> => {
    const cached = historyCache.get(logs);
    if (cached) return cached;

    const mutable = new Map<string, MutableSummary>();
    const validLogs = (Array.isArray(logs) ? logs : [])
        .filter((log): log is Log => !!log && typeof log === 'object' && !log.skipped)
        .slice()
        .sort((a, b) => (b.endTime || 0) - (a.endTime || 0));

    // Newest -> oldest gives latest note/sets without additional searches.
    for (const log of validLogs) {
        if (!Array.isArray(log.exercises)) continue;

        for (const exercise of log.exercises) {
            if (!exercise?.id) continue;
            let summary = mutable.get(exercise.id);
            if (!summary) {
                summary = createMutable();
                mutable.set(exercise.id, summary);
            }

            if (!summary.lastNote && exercise.note) {
                summary.lastNote = String(exercise.note);
            }

            const sets = Array.isArray(exercise.sets) ? exercise.sets : [];
            const hasCompleted = sets.some(set => set?.completed);
            if (!summary.latestCompletedSets && hasCompleted) {
                summary.latestCompletedSets = sets;
            }

            const working = sets.filter(set => set && set.type !== 'warmup' && set.type !== 'avt_hop');
            if (!summary.latestWorkingSets && working.length > 0) {
                summary.latestWorkingSets = working;
            }

            let sessionBest1RM = 0;
            for (const set of sets) {
                if (!set?.completed) continue;

                const duration = Number(set.duration) || 0;
                if (duration > summary.bestHoldSeconds) summary.bestHoldSeconds = duration;

                const reps = Number(set.reps) || 0;
                const weight = Number(set.weight) || 0;
                if (reps > summary.bestBodyweightReps || (reps === summary.bestBodyweightReps && weight > summary.bestBodyweightWeight)) {
                    summary.bestBodyweightReps = reps;
                    summary.bestBodyweightWeight = weight;
                }

                if (weight > 0 && reps > 0) {
                    const e1rm = estimate1RM(weight, reps);
                    if (e1rm > sessionBest1RM) sessionBest1RM = e1rm;
                    if (e1rm > summary.bestWeighted1RM) {
                        summary.bestWeighted1RM = e1rm;
                        summary.bestWeightedWeight = set.weight;
                        summary.bestWeightedReps = set.reps;
                    }
                }
            }

            if (sessionBest1RM > 0) {
                summary.oneRMSessions.push({ at: log.endTime || log.startTime || 0, value: sessionBest1RM });
            }
        }
    }

    const result = new Map<string, ExerciseHistorySummary>();
    for (const [id, summary] of mutable) {
        const oneRMHistory = summary.oneRMSessions
            .sort((a, b) => a.at - b.at)
            .slice(-8)
            .map(point => point.value);

        result.set(id, {
            lastNote: summary.lastNote,
            bestHoldSeconds: summary.bestHoldSeconds,
            bestBodyweightReps: summary.bestBodyweightReps,
            bestBodyweightWeight: summary.bestBodyweightWeight,
            bestWeighted1RM: summary.bestWeighted1RM,
            bestWeightedWeight: summary.bestWeightedWeight,
            bestWeightedReps: summary.bestWeightedReps,
            oneRMHistory,
            latestWorkingSets: summary.latestWorkingSets,
            latestCompletedSets: summary.latestCompletedSets,
        });
    }

    historyCache.set(logs, result);
    return result;
};

export const getExerciseHistorySummary = (logs: Log[], exerciseId: string): ExerciseHistorySummary => {
    if (!Array.isArray(logs) || logs.length === 0 || !exerciseId) return EMPTY_SUMMARY;
    return buildExerciseHistoryIndex(logs).get(exerciseId) || EMPTY_SUMMARY;
};
