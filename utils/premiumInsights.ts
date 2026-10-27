import type { Log } from '../types';
import { filterLogsByScope } from './statsScope';
import { estimateOneRm, type OneRmFormula } from './strongTraining';

export interface PremiumBestSet {
    name: Log['exercises'][number]['name'];
    weight: number;
    reps: number;
    estimatedOneRepMax: number;
    date: number;
}

export interface PremiumInsights {
    /** Rolling 7-day windows: oldest to newest, ending tonight in local time. */
    weeklyWorkingSets: number[];
    currentWeekSets: number;
    previousWeekSets: number;
    /** Null without a non-zero baseline; never present a fabricated increase. */
    weekChangePct: number | null;
    /** Strongest logged weighted series by Epley e1RM, not an asserted new PR. */
    bestSet: PremiumBestSet | null;
}

/** Derive a modest, truthful chart from completed working sets and saved logs. */
export const buildPremiumInsights = (
    logs: Log[],
    mesoId: number | null,
    now = Date.now(),
    formula: OneRmFormula = 'epley',
): PremiumInsights => {
    const end = new Date(now);
    end.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() + 1);
    const starts = Array.from({ length: 4 }, (_, index) => {
        const start = new Date(end);
        start.setDate(start.getDate() - (4 - index) * 7);
        return start.getTime();
    });
    const exclusiveEnd = end.getTime();
    const weeklyWorkingSets = [0, 0, 0, 0];
    let bestSet: PremiumBestSet | null = null;

    for (const log of filterLogsByScope(logs, mesoId)) {
        const timestamp = Number(log.startTime);
        const validDate = Number.isFinite(timestamp) && timestamp > 0 && timestamp <= now;
        if (!validDate) continue;
        const weekIndex = starts.findIndex((start, i) =>
            timestamp >= start && timestamp < (i === 3 ? exclusiveEnd : starts[i + 1]));
        for (const exercise of (log.exercises || [])) {
            const isWeighted = !exercise.isBodyweight && !exercise.isIsometric && exercise.muscle !== 'CARDIO';
            for (const set of (exercise.sets || [])) {
                if (!set.completed || set.skipped || set.type === 'warmup' || set.type === 'avt_hop') continue;
                if (weekIndex !== -1) weeklyWorkingSets[weekIndex] += 1;
                if (!isWeighted) continue;
                const weight = Number(set.weight);
                const reps = Number(set.reps);
                if (!Number.isFinite(weight) || !Number.isFinite(reps) || weight <= 0 || reps <= 0) continue;
                const e1rm = estimateOneRm(weight, reps, formula);
                if (!bestSet || e1rm > bestSet.estimatedOneRepMax) {
                    bestSet = { name: exercise.name, weight, reps, estimatedOneRepMax: e1rm, date: timestamp };
                }
            }
        }
    }

    const currentWeekSets = weeklyWorkingSets[3];
    const previousWeekSets = weeklyWorkingSets[2];
    const weekChangePct = previousWeekSets > 0
        ? Math.round((currentWeekSets - previousWeekSets) / previousWeekSets * 100)
        : null;
    return { weeklyWorkingSets, currentWeekSets, previousWeekSets, weekChangePct, bestSet };
};
