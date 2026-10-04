import type { Log } from '../types';
import { getLogBodyWeight, getSetLoadVolume } from './trainingMetrics';

export interface WeekProgress {
    done: number;
    planned: number;
}

/**
 * Q16: distinct non-skipped training days logged in (mesoId, week) against
 * the planned day count. Retraining a day never inflates the count.
 */
export const weekProgress = (logs: Log[], mesoId: number, week: number, plannedDays: number): WeekProgress => {
    const days = new Set<number>();
    for (const log of Array.isArray(logs) ? logs : []) {
        if (!log || log.skipped || log.mesoId !== mesoId || log.week !== week) continue;
        if (typeof log.dayIdx === 'number') days.add(log.dayIdx);
    }
    return { done: days.size, planned: Math.max(0, plannedDays || 0) };
};

export interface LastSessionSummary {
    date: number;
    durationMin: number;
    volumeKg: number;
    prCount: number;
}

/**
 * Q16: newest non-skipped session (plan-scoped when mesoId is given).
 * Volume sums effective set loads; PRs mirror the recap rule — a weighted
 * set beating the exercise's previous all-time e1rm best by >1%,
 * counted once per exercise (first-time exercises never count).
 */
export const lastSessionSummary = (logs: Log[], mesoId?: number | null): LastSessionSummary | null => {
    const candidates = (Array.isArray(logs) ? logs : []).filter(
        (log) => !!log && !log.skipped && (mesoId == null || log.mesoId === mesoId),
    );
    if (candidates.length === 0) return null;
    const newest = candidates.reduce((a, b) => ((b.endTime || 0) > (a.endTime || 0) ? b : a));

    const bodyWeight = getLogBodyWeight(newest);
    let volumeKg = 0;
    for (const ex of newest.exercises || []) {
        for (const set of ex?.sets || []) {
            if (set?.completed && !set?.skipped) volumeKg += getSetLoadVolume(set, ex, bodyWeight);
        }
    }

    const older = candidates.filter((log) => (log.endTime || 0) < (newest.endTime || 0));
    const oldBests = new Map<string, number>();
    for (const log of older) {
        for (const ex of log.exercises || []) {
            if (ex?.id == null) continue;
            for (const set of ex.sets || []) {
                const w = Number(set?.weight);
                const r = Number(set?.reps);
                if (!set?.completed || !(w > 0) || !(r > 0)) continue;
                const e1rm = w * (1 + r / 30);
                if (e1rm > (oldBests.get(String(ex.id)) ?? 0)) oldBests.set(String(ex.id), e1rm);
            }
        }
    }
    const prCounted = new Set<string>();
    for (const ex of newest.exercises || []) {
        if (ex?.id == null) continue;
        const best = oldBests.get(String(ex.id));
        if (!best) continue;
        for (const set of ex.sets || []) {
            const w = Number(set?.weight);
            const r = Number(set?.reps);
            if (!set?.completed || !(w > 0) || !(r > 0)) continue;
            if (w * (1 + r / 30) > best * 1.01) {
                prCounted.add(String(ex.id));
                break;
            }
        }
    }

    return {
        date: newest.endTime || 0,
        durationMin: Math.round((Number(newest.duration) || 0) / 60),
        volumeKg,
        prCount: prCounted.size,
    };
};

/**
 * Q16: consecutive complete plan weeks. A week is complete when its distinct
 * trained days reach plannedDays. An in-progress current week does not break
 * the streak: counting starts at the latest complete week at or before now.
 */
export const streakWeeks = (logs: Log[], mesoId: number, currentWeek: number, plannedDays: number): number => {
    if (!(plannedDays >= 1)) return 0;
    const complete = (week: number): boolean => {
        const days = new Set<number>();
        for (const log of Array.isArray(logs) ? logs : []) {
            if (!log || log.skipped || log.mesoId !== mesoId || log.week !== week) continue;
            if (typeof log.dayIdx === 'number') days.add(log.dayIdx);
        }
        return days.size >= plannedDays;
    };
    let week = complete(currentWeek) ? currentWeek : currentWeek - 1;
    let streak = 0;
    while (week >= 1 && complete(week)) {
        streak += 1;
        week -= 1;
    }
    return streak;
};
