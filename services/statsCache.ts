import { ChartDataPoint } from '../components/stats/ProgressChart';
import { ChartMetric } from '../hooks/useStatsWorker';
import { Log } from '../types';
import { db } from '../utils/db';

const overviewKey = (signature: string, mesoId: number | null) => `il_stats_overview_v2:${signature}:${mesoId ?? 'all'}`;
const chartKey = (signature: string, exerciseId: string, metric: ChartMetric) => `il_stats_chart_v2:${signature}:${exerciseId}:${metric}`;
const selectedExerciseKey = 'il_stats_selected_exercise_v1';

export interface StatsOverviewCache {
    volumeData: [string, number][];
    exerciseFrequency: Record<string, number>;
    setTypeDist: Record<string, number>;
    savedAt: number;
}

export interface StatsChartCache {
    dataPoints: ChartDataPoint[];
    savedAt: number;
}

/**
 * Stats can change without log count/IDs changing (cloud merge, corrected set,
 * imported history, weight/reps edits). Include the values that feed charts in
 * a lightweight FNV-style fingerprint so cached summaries never survive a real
 * data change simply because the number of completed sets stayed constant.
 */
export const buildStatsLogsSignature = (logs: Log[]) => {
    const safeLogs = Array.isArray(logs) ? logs : [];
    if (safeLogs.length === 0) return 'empty-v2';

    let hash = 2166136261 >>> 0;
    let completedCount = 0;
    const mix = (value: unknown) => {
        const text = String(value ?? '');
        for (let i = 0; i < text.length; i += 1) {
            hash ^= text.charCodeAt(i);
            hash = Math.imul(hash, 16777619) >>> 0;
        }
    };

    safeLogs.forEach(log => {
        mix(log.id);
        mix(log.startTime);
        mix(log.endTime);
        mix(log.mesoId);
        mix(log.week);
        mix(log.skipped ? 1 : 0);

        (log.exercises || []).forEach(exercise => {
            mix(exercise.id);
            mix(exercise.instanceId);
            mix(exercise.muscle);
            (exercise.sets || []).forEach(set => {
                if (!set.completed || set.skipped) return;
                completedCount += 1;
                mix(set.id);
                mix(set.type);
                mix(set.weight);
                mix(set.reps);
                mix(set.duration);
                mix(set.distance);
                mix(set.rpe);
            });
        });
    });

    const first = safeLogs[0];
    const last = safeLogs[safeLogs.length - 1];
    return [
        'v2',
        safeLogs.length,
        first?.id ?? 'na',
        first?.endTime ?? 'na',
        last?.id ?? 'na',
        last?.endTime ?? 'na',
        completedCount,
        hash.toString(36),
    ].join(':');
};

export const statsCache = {
    readOverview(signature: string, mesoId: number | null) {
        return db.get<StatsOverviewCache | null>(overviewKey(signature, mesoId), null);
    },

    writeOverview(signature: string, mesoId: number | null, payload: Omit<StatsOverviewCache, 'savedAt'>) {
        return db.set(overviewKey(signature, mesoId), {
            ...payload,
            savedAt: Date.now(),
        });
    },

    readChart(signature: string, exerciseId: string, metric: ChartMetric) {
        return db.get<StatsChartCache | null>(chartKey(signature, exerciseId, metric), null);
    },

    writeChart(signature: string, exerciseId: string, metric: ChartMetric, dataPoints: ChartDataPoint[]) {
        return db.set(chartKey(signature, exerciseId, metric), {
            dataPoints,
            savedAt: Date.now(),
        });
    },

    readSelectedExercise() {
        return db.get<string | null>(selectedExerciseKey, null);
    },

    writeSelectedExercise(exerciseId: string | null) {
        return db.set(selectedExerciseKey, exerciseId);
    },
};
