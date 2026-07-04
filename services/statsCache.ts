import { ChartDataPoint } from '../components/stats/ProgressChart';
import { ChartMetric } from '../hooks/useStatsWorker';
import { Log } from '../types';
import { db } from '../utils/db';

const overviewKey = (signature: string, mesoId: number | null) => `il_stats_overview_v1:${signature}:${mesoId ?? 'all'}`;
const chartKey = (signature: string, exerciseId: string, metric: ChartMetric) => `il_stats_chart_v1:${signature}:${exerciseId}:${metric}`;
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

export const buildStatsLogsSignature = (logs: Log[]) => {
    const safeLogs = Array.isArray(logs) ? logs : [];
    if (safeLogs.length === 0) return 'empty';

    const first = safeLogs[0];
    const last = safeLogs[safeLogs.length - 1];
    const completedCount = safeLogs.reduce((acc, log) => acc + ((log.exercises || []).reduce((setsAcc, ex) => {
        return setsAcc + (ex.sets || []).filter(set => set.completed).length;
    }, 0)), 0);

    return [
        safeLogs.length,
        first?.id ?? 'na',
        first?.endTime ?? 'na',
        last?.id ?? 'na',
        last?.endTime ?? 'na',
        completedCount,
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

