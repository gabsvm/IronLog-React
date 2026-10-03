import type { Log } from '../types';

export type StatsScope = 'plan' | 'history';

/**
 * Single definition of "which logs count" for Stats surfaces and the profile
 * sheet: skipped sessions never count; a meso id restricts to that plan,
 * null/undefined means full history. ProfileSheet lifetime totals and the
 * Stats history scope share this exact predicate.
 */
export const filterLogsByScope = (logs: Log[], mesoId?: number | null): Log[] => {
    const safeLogs = Array.isArray(logs) ? logs : [];
    return safeLogs.filter(log => {
        if (!log || log.skipped) return false;
        if (mesoId != null && log.mesoId !== mesoId) return false;
        return true;
    });
};

export const countSessionsByScope = (logs: Log[], mesoId?: number | null): number =>
    filterLogsByScope(logs, mesoId).length;

export interface ScopeSummary {
    sessions: number;
    exercises: number;
    sets: number;
    muscles: number;
}

/**
 * Header-card summary using the SAME definitions as the worker overview:
 * non-skipped logs in scope, completed and non-skipped sets, exercises with
 * at least one completed set, distinct muscles with completed sets excluding
 * CARDIO. Cardio sets still count toward the sets total (as in the doughnut).
 */
export const summarizeLogsByScope = (logs: Log[], mesoId?: number | null): ScopeSummary => {
    const scoped = filterLogsByScope(logs, mesoId);
    const exerciseIds = new Set<string>();
    const muscles = new Set<string>();
    let sets = 0;

    scoped.forEach(log => {
        (log.exercises || []).forEach((exercise, exerciseIndex) => {
            const completedSets = (exercise.sets || []).filter(set => set.completed && !set.skipped);
            if (completedSets.length === 0) return;
            exerciseIds.add(String(exercise.id ?? (exercise as { instanceId?: unknown }).instanceId ?? `${log.id}-${exerciseIndex}`));
            if (exercise.muscle && exercise.muscle !== 'CARDIO') muscles.add(String(exercise.muscle));
            sets += completedSets.length;
        });
    });

    return {
        sessions: scoped.length,
        exercises: exerciseIds.size,
        sets,
        muscles: muscles.size,
    };
};

/** Effective meso filter for a scope selection (null = full history). */
export const scopeMesoId = (scope: StatsScope, activeMesoId?: number | null): number | null =>
    scope === 'plan' ? (activeMesoId ?? null) : null;
