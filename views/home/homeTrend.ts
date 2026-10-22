import type { Log, SessionExercise } from '../../types';

export const HOME_TREND_WEEKS = 8;
export interface HomeTrend {
    exerciseName: SessionExercise['name'];
    points: { date: number; weightKg: number }[];
}

/** Maximum external load from completed, non-warmup straight working sets.
 * Compare the same exercise and load-entry convention within the last 8 weeks.
 * Cardio, holds and bodyweight exercises need different metrics, so are not mixed in.
 */
export const homeStrengthTrend = (logs: Log[], mesoId: number, now: number): HomeTrend | null => {
    const cutoff = now - HOME_TREND_WEEKS * 7 * 24 * 60 * 60 * 1000;
    const series = new Map<string, HomeTrend>();
    for (const log of logs) {
        if (log.skipped || log.mesoId !== mesoId || log.endTime < cutoff || log.endTime > now) continue;
        const sessionBests = new Map<string, { exercise: SessionExercise; weightKg: number }>();
        for (const exercise of log.exercises || []) {
            if (exercise.isBodyweight || exercise.isIsometric || exercise.muscle === 'CARDIO') continue;
            let weightKg = 0;
            for (const set of exercise.sets || []) {
                if (!set.completed || set.skipped || !['regular', 'top', 'backoff'].includes(set.type)) continue;
                const weight = Number(set.weight);
                const reps = Number(set.reps);
                if (Number.isFinite(weight) && weight > weightKg && Number.isFinite(reps) && reps > 0) weightKg = weight;
            }
            if (!weightKg) continue;
            const key = `${exercise.id}:${exercise.volumeCountingMode || 'total'}`;
            if (weightKg > (sessionBests.get(key)?.weightKg || 0)) sessionBests.set(key, { exercise, weightKg });
        }
        for (const [key, { exercise, weightKg }] of sessionBests) {
            let trend = series.get(key);
            if (!trend) {
                trend = { exerciseName: exercise.name, points: [] };
                series.set(key, trend);
            }
            trend.points.push({ date: log.endTime, weightKg });
        }
    }
    let selected: HomeTrend | null = null;
    let latest = -Infinity;
    for (const trend of series.values()) {
        if (trend.points.length < 2) continue;
        trend.points.sort((a, b) => a.date - b.date);
        const date = trend.points[trend.points.length - 1].date;
        if (date > latest) {
            latest = date;
            selected = { exerciseName: trend.exerciseName, points: trend.points.slice(-8) };
        }
    }
    return selected;
};
