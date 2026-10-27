import { ChartDataPoint } from '../components/stats/ProgressChart';
import { ChartMetric } from '../hooks/useStatsWorker';
import { Log } from '../types';
import { keys as idbKeys } from 'idb-keyval';
import type { StatsPeriod, StatsScope } from '../utils/statsScope';
import { db } from '../utils/db';

// v5/v4 keys carry the full filter fingerprint (scope + period + meso) plus the
// training prefs that change the math (oneRmFormula for 1RM charts/PRs, weekStart
// for the overview week divisor), so a cached summary from one formula or week
// start can never serve another. Older generations are pruned as legacy (see
// LEGACY_KEY_PREFIXES / pruneLegacyStatsKeys).
import type { OneRmFormula, WeekStart } from '../utils/strongTraining';

const overviewKey = (
    signature: string,
    mesoId: number | null,
    scope: StatsScope = 'history',
    period: StatsPeriod = 'all',
    weekStart: WeekStart = 'monday',
) => `il_stats_overview_v5:${signature}:${scope}:${mesoId ?? 'all'}:${period}:${weekStart}`;
const chartKey = (
    signature: string,
    exerciseId: string,
    metric: ChartMetric,
    mesoId: number | null,
    scope: StatsScope = 'history',
    period: StatsPeriod = 'all',
    oneRmFormula: OneRmFormula = 'epley',
    factorInRpe = false,
) => `il_stats_chart_v5:${signature}:${exerciseId}:${metric}:${scope}:${mesoId ?? 'all'}:${period}:${oneRmFormula}:rpe${factorInRpe ? 1 : 0}`;
const LEGACY_SCOPE_KEYS = ['il_stats_scope_v1'];
const LEGACY_KEY_PREFIXES = ['il_stats_overview_v2:', 'il_stats_overview_v3:', 'il_stats_overview_v4:', 'il_stats_chart_v2:', 'il_stats_chart_v3:', 'il_stats_chart_v4:'];
let legacyPruned = false;
const CURRENT_KEY_PREFIXES = ['il_stats_overview_v5:', 'il_stats_chart_v5:'];
const CHART_KEY_PREFIX = 'il_stats_chart_v5:';
const prunedSignatures = new Set<string>();
const selectedExerciseKey = 'il_stats_selected_exercise_v1';
const selectedScopeKeyV2 = 'il_stats_scope_v2';
const selectedPeriodKeyV1 = 'il_stats_period_v1';
export interface StatsOverviewCache {
    volumeData: [string, number][];
    exerciseFrequency: Record<string, number>;
    setTypeDist: Record<string, number>;
    weeks: number;
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
    readOverview(signature: string, mesoId: number | null, scope: StatsScope = 'history', period: StatsPeriod = 'all', weekStart: WeekStart = 'monday') {
        return db.get<StatsOverviewCache | null>(overviewKey(signature, mesoId, scope, period, weekStart), null);
    },

    writeOverview(signature: string, mesoId: number | null, payload: Omit<StatsOverviewCache, 'savedAt'>, scope: StatsScope = 'history', period: StatsPeriod = 'all', weekStart: WeekStart = 'monday') {
        return db.set(overviewKey(signature, mesoId, scope, period, weekStart), {
            ...payload,
            savedAt: Date.now(),
        });
    },

    readChart(signature: string, exerciseId: string, metric: ChartMetric, mesoId: number | null, scope: StatsScope = 'history', period: StatsPeriod = 'all', oneRmFormula: OneRmFormula = 'epley', factorInRpe = false) {
        return db.get<StatsChartCache | null>(chartKey(signature, exerciseId, metric, mesoId, scope, period, oneRmFormula, factorInRpe), null);
    },

    writeChart(signature: string, exerciseId: string, metric: ChartMetric, mesoId: number | null, dataPoints: ChartDataPoint[], scope: StatsScope = 'history', period: StatsPeriod = 'all', oneRmFormula: OneRmFormula = 'epley', factorInRpe = false) {
        return db.set(chartKey(signature, exerciseId, metric, mesoId, scope, period, oneRmFormula, factorInRpe), {
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

    readSelectedScopeV2() {
        return db.get<'plan' | 'history' | null>(selectedScopeKeyV2, null);
    },

    writeSelectedScopeV2(scope: 'plan' | 'history') {
        return db.set(selectedScopeKeyV2, scope);
    },

    readSelectedPeriod() {
        return db.get<StatsPeriod | null>(selectedPeriodKeyV1, null);
    },

    writeSelectedPeriod(period: StatsPeriod) {
        return db.set(selectedPeriodKeyV1, period);
    },

    /**
     * One-time cleanup of orphaned stats keys from older cache versions.
     * Runs once per session; safe to call on every Stats mount.
     */
    async pruneLegacyStatsKeys(): Promise<void> {
        if (legacyPruned) return;
        legacyPruned = true;
        try {
            await Promise.all(LEGACY_SCOPE_KEYS.map((key) => db.del(key)));
            const allKeys = await idbKeys();
            const stale = allKeys.filter((key) =>
                typeof key === 'string' && LEGACY_KEY_PREFIXES.some((prefix) => key.startsWith(prefix)),
            );
            await Promise.all(stale.map((key) => db.del(key as string)));
        } catch {
            // Cache hygiene must never break the view.
        }
    },

    /**
     * Drops overview/chart entries written under older log signatures. Every
     * finished session produces a new signature, so without this the cache
     * grows one stale generation per session. Runs at most once per
     * signature per session. Signatures contain ':' (join(':')), so keys are
     * matched by exact prefix, never parsed with split. Scope and
     * selected-exercise keys are never touched.
     */
    /**
     * Drops every cached per-exercise chart. Merging/unmerging exercises
     * changes which logs each chart aggregates without changing the logs
     * signature, so chart entries must be recomputed from scratch.
     */
    async invalidateChartCache(): Promise<void> {
        try {
            const allKeys = await idbKeys();
            const stale = allKeys.filter((key) =>
                typeof key === 'string' && key.startsWith(CHART_KEY_PREFIX),
            );
            await Promise.all(stale.map((key) => db.del(key as string)));
        } catch {
            // Cache hygiene must never break the view.
        }
    },

    async pruneStaleSignatureKeys(currentSignature: string): Promise<void> {
        if (prunedSignatures.has(currentSignature)) return;
        prunedSignatures.add(currentSignature);
        try {
            const allKeys = await idbKeys();
            const stale = allKeys.filter((key) =>
                typeof key === 'string' && CURRENT_KEY_PREFIXES.some((prefix) =>
                    key.startsWith(prefix) && !key.startsWith(`${prefix}${currentSignature}:`),
                ),
            );
            await Promise.all(stale.map((key) => db.del(key as string)));
        } catch {
            // Cache hygiene must never break the view.
        }
    },
};
