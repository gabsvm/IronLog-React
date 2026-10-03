import type { Log } from '../types';

export interface OverviewNumbers {
    volumeData: [string, number][];
    exerciseFrequency: Record<string, number>;
    /** Real weeks with at least one completed log in scope (the divisor). Never below 1. */
    weeks: number;
}

const MUSCLES = ['CHEST', 'BACK', 'QUADS', 'HAMSTRINGS', 'GLUTES', 'CALVES', 'SHOULDERS', 'BICEPS', 'TRICEPS', 'TRAPS', 'ABS', 'FOREARMS', 'CARDIO'];

/** ISO calendar week key (UTC) for logs without meso/week coordinates. */
const isoWeekKey = (ts: number): string => {
    const d = new Date(ts);
    const mondayBased = (d.getUTCDay() + 6) % 7;
    const thursday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - mondayBased + 3));
    const isoYear = thursday.getUTCFullYear();
    const firstThursday = Date.UTC(isoYear, 0, 4);
    const week = 1 + Math.round((thursday.getTime() - firstThursday) / (7 * 86400000));
    return `${isoYear}-W${week}`;
};

/**
 * Pure weekly-volume overview: completed sets per muscle averaged over the
 * REAL weeks in scope. A week is a distinct (mesoId, week) pair; logs without
 * mesoId/week fall back to their ISO calendar week. Skipped logs and sets
 * that are not completed (or are skipped) never count. CARDIO stays in the
 * counts (views filter it for display) so cached math is untouched.
 */
export const computeOverview = (logs: Log[], mesoId?: number | null): OverviewNumbers => {
    const safeLogs = Array.isArray(logs) ? logs : [];
    const muscleCounts: Record<string, number> = {};
    const exFreq: Record<string, number> = {};
    const weeksFound = new Set<string>();
    MUSCLES.forEach(m => { muscleCounts[m] = 0; });

    for (const log of safeLogs) {
        if (!log || log.skipped) continue;
        if (mesoId != null && log.mesoId !== mesoId) continue;

        if (log.mesoId != null && log.week != null) {
            weeksFound.add(`meso:${log.mesoId}:week:${log.week}`);
        } else {
            weeksFound.add(`iso:${isoWeekKey(log.startTime ?? log.endTime ?? 0)}`);
        }

        for (const ex of (log.exercises || [])) {
            let setsDone = 0;
            for (const set of (ex.sets || [])) {
                if (set?.completed && !set?.skipped) setsDone += 1;
            }
            if (muscleCounts[ex.muscle] !== undefined) muscleCounts[ex.muscle] += setsDone;
            if (ex?.id != null) {
                const exId = String(ex.id);
                exFreq[exId] = (exFreq[exId] || 0) + 1;
            }
        }
    }

    const weeks = Math.max(1, weeksFound.size);
    for (const key of Object.keys(muscleCounts)) {
        muscleCounts[key] = Math.round(muscleCounts[key] / weeks);
    }

    const sortedVolume = Object.entries(muscleCounts).sort((a, b) => b[1] - a[1]) as [string, number][];
    return { volumeData: sortedVolume, exerciseFrequency: exFreq, weeks };
};
