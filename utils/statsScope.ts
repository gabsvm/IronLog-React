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

/** Effective meso filter for a scope selection (null = full history). */
export const scopeMesoId = (scope: StatsScope, activeMesoId?: number | null): number | null =>
    scope === 'plan' ? (activeMesoId ?? null) : null;
