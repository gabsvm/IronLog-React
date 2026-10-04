import type { Log, MesoCycle } from '../types';

export type VolumeZoneLabel = 'MV' | 'MEV' | 'MAV' | 'MRV';

/** Same thresholds as StatsViewImpl.getVolumeZone (weekly sets). */
export const volumeZoneLabel = (sets: number): VolumeZoneLabel => {
    if (sets < 6) return 'MV';
    if (sets < 12) return 'MEV';
    if (sets <= 22) return 'MAV';
    return 'MRV';
};

export interface MuscleWeekStatus {
    muscle: string;
    sets: number;
    prevSets: number;
    zone: VolumeZoneLabel;
}

export interface WeeklyReport {
    week: number;
    sessionsDone: number;
    sessionsPlanned: number;
    muscles: MuscleWeekStatus[];
    totalSets: number;
    prevTotalSets: number;
    /** Null without a previous-week baseline. */
    volumeChangePct: number | null;
    /** Muscles trained this week below MEV (zone MV). */
    lowMuscles: string[];
    /** Muscles over MRV this week. */
    highMuscles: string[];
    deloadSuggested: boolean;
    deloadReason: 'final-week' | 'feedback' | null;
    hasPreviousWeek: boolean;
}

export type RpFeedbackMap = Record<
    string,
    Record<string, Record<string, { soreness: number; performance: number; adjustment: number }>>
>;

const countMuscleSets = (logs: Log[]): Record<string, number> => {
    const counts: Record<string, number> = {};
    for (const log of logs) {
        for (const ex of log.exercises || []) {
            if (!ex || ex.muscle === 'CARDIO') continue;
            let done = 0;
            for (const set of ex.sets || []) {
                if (set?.completed && !set?.skipped) done += 1;
            }
            if (done > 0) counts[ex.muscle] = (counts[ex.muscle] ?? 0) + done;
        }
    }
    return counts;
};

const weekLogs = (logs: Log[], mesoId: number, week: number): Log[] =>
    (Array.isArray(logs) ? logs : []).filter(
        (log) => !!log && !log.skipped && log.mesoId === mesoId && log.week === week,
    );

/**
 * Q15: plan-scoped weekly report. Weeks are meso coordinates (mesoId, week),
 * never calendar weeks; skipped logs/sets and CARDIO never count toward
 * muscle volume. Pure: the view only renders the returned numbers.
 */
export const buildWeeklyReport = (input: {
    logs: Log[];
    meso: MesoCycle;
    rpFeedback: RpFeedbackMap | null | undefined;
}): WeeklyReport => {
    const { logs, meso } = input;
    const current = weekLogs(logs, meso.id, meso.week);
    const previous = weekLogs(logs, meso.id, meso.week - 1);

    const now = countMuscleSets(current);
    const prev = countMuscleSets(previous);
    const muscleNames = [...new Set([...Object.keys(now), ...Object.keys(prev)])];
    const muscles: MuscleWeekStatus[] = muscleNames
        .map((muscle) => ({
            muscle,
            sets: now[muscle] ?? 0,
            prevSets: prev[muscle] ?? 0,
            zone: volumeZoneLabel(now[muscle] ?? 0),
        }))
        .sort((a, b) => b.sets - a.sets);

    const totalSets = muscles.reduce((n, m) => n + m.sets, 0);
    const prevTotalSets = muscles.reduce((n, m) => n + m.prevSets, 0);

    // Latest feedback week available (this week, else last week).
    const fbForMeso = input.rpFeedback?.[meso.id] ?? input.rpFeedback?.[String(meso.id)];
    const fbWeek = fbForMeso?.[meso.week] ?? fbForMeso?.[String(meso.week)]
        ?? fbForMeso?.[meso.week - 1] ?? fbForMeso?.[String(meso.week - 1)];
    const fbEntries = fbWeek ? Object.values(fbWeek) : [];
    const negativeCount = fbEntries.filter((e) => (e?.adjustment ?? 0) < 0).length;
    const avgPerformance = fbEntries.length > 0
        ? fbEntries.reduce((n, e) => n + (Number(e?.performance) || 0), 0) / fbEntries.length
        : null;
    const unfavorableTrend = fbEntries.length > 0
        && (negativeCount >= 2 || (avgPerformance != null && avgPerformance <= 2));

    const planWeeks = meso.targetWeeks ?? meso.duration;
    const isFinalWeek = typeof planWeeks === 'number' && planWeeks > 0 && meso.week >= planWeeks;
    const deloadReason = meso.isDeload
        ? null
        : isFinalWeek ? 'final-week' : unfavorableTrend ? 'feedback' : null;

    return {
        week: meso.week,
        sessionsDone: current.length,
        sessionsPlanned: Array.isArray(meso.plan) ? meso.plan.length : 0,
        muscles,
        totalSets,
        prevTotalSets,
        volumeChangePct: prevTotalSets > 0 ? Math.round(((totalSets - prevTotalSets) / prevTotalSets) * 100) : null,
        lowMuscles: muscles.filter((m) => m.sets > 0 && m.zone === 'MV').map((m) => m.muscle),
        highMuscles: muscles.filter((m) => m.zone === 'MRV').map((m) => m.muscle),
        deloadSuggested: deloadReason != null,
        deloadReason,
        hasPreviousWeek: previous.length > 0,
    };
};

/**
 * Counts PR rows (all-time-in-scope bests) that were set during the plan
 * week: a row counts when its date falls inside the week's logged range.
 */
export const filterWeekPRs = (
    rows: Array<{ date: number }>,
    logs: Log[],
    mesoId: number,
    week: number,
): number => {
    const current = weekLogs(logs, mesoId, week);
    if (current.length === 0) return 0;
    const starts = current.map((l) => l.startTime ?? l.endTime ?? 0);
    const ends = current.map((l) => l.endTime ?? l.startTime ?? 0);
    const from = Math.min(...starts);
    const to = Math.max(...ends);
    return (Array.isArray(rows) ? rows : []).filter((r) => r && r.date >= from && r.date <= to).length;
};
