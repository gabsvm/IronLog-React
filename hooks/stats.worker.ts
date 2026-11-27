import { getEffectiveSetLoad, getLogBodyWeight, getSetLoadVolume } from '../utils/trainingMetrics';
import { computeOverview } from '../utils/statsOverview';

type MetricType = '1rm' | 'volume' | 'duration' | 'distance' | 'max_reps' | 'hold_time';

let cachedLogs: any[] = [];

const parseDuration = (val: any): number => {
    if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
    if (!val) return 0;
    const raw = String(val).trim();
    if (!raw) return 0;
    if (raw.includes(':')) {
        const parts = raw.split(':').map((p) => Number(p.trim()));
        if (parts.some((n) => !Number.isFinite(n) || n < 0)) return 0;
        if (parts.length === 3) {
            return parts[0] * 60 + parts[1] + parts[2] / 60;
        }
        if (parts.length === 2) {
            return parts[0] + parts[1] / 60;
        }
        return 0;
    }
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

self.onmessage = function(e: MessageEvent) {
    const { type, logs, activeMesoId, exerciseId, metric, userBodyWeight, reqId } = e.data || {};

    if (type === 'SET_LOGS') {
        cachedLogs = Array.isArray(logs) ? logs : [];
        return;
    }

    const sourceLogs = cachedLogs;

    if (type === 'CALCULATE_OVERVIEW') {
        const { volumeData, exerciseFrequency, weeks } = computeOverview(sourceLogs, activeMesoId ?? null);
        self.postMessage({ type: 'OVERVIEW_READY', volumeData, exerciseFrequency, weeks, reqId });
        return;
    }

    if (type === 'CALCULATE_CHART') {
        const dataPoints: any[] = [];
        // Merged duplicates share one chart: callers pass the canonical group
        // (plain ids from older callers still work via the single-id path).
        const wantedIds = new Set(
            (Array.isArray(exerciseId) ? exerciseId : [exerciseId]).map((id: any) => String(id))
        );

        // Do not sort/clone full log objects. Aggregate matching points first and
        // sort the much smaller output array at the end.
        for (const log of sourceLogs) {
            if (!log || log.skipped) continue;
            if (activeMesoId && log.mesoId !== activeMesoId) continue;
            const logBodyWeight = getLogBodyWeight(log, userBodyWeight);
            const matches = (log.exercises || []).filter((candidate: any) => wantedIds.has(String(candidate.id)));
            if (matches.length === 0) continue;

            let bestValue = 0;
            let bestSetDetails = { w: 0, r: 0 };

            for (const ex of matches) {
            if ((metric as MetricType) === '1rm') {
                for (const s of (ex.sets || [])) {
                    const hasValidReps = Number(s.reps) > 0;
                    const hasWeight = s.weight !== undefined && s.weight !== null && (
                        s.weight !== '' || ex.isBodyweight || ex.equipment === 'machine_assistance'
                    );
                    if (s.completed && !s.skipped && hasWeight && hasValidReps) {
                        const w = getEffectiveSetLoad(s, ex, logBodyWeight);
                        const r = Number(s.reps);
                        const est1rm = w * (1 + r / 30);
                        if (est1rm > bestValue) {
                            bestValue = est1rm;
                            const rawW = Number(s.weight || 0);
                            bestSetDetails = {
                                w: ex.equipment === 'machine_assistance' ? -rawW : rawW,
                                r,
                            };
                        }
                    }
                }
            } else if (metric === 'volume') {
                for (const s of (ex.sets || [])) {
                    bestValue += getSetLoadVolume(s, ex, logBodyWeight);
                }
            } else if (metric === 'max_reps') {
                for (const s of (ex.sets || [])) {
                    if (s.completed && !s.skipped && s.reps) bestValue = Math.max(bestValue, Number(s.reps));
                }
                bestSetDetails = { w: 0, r: bestValue };
            } else if (metric === 'hold_time') {
                for (const s of (ex.sets || [])) {
                    if (s.completed && !s.skipped && s.duration) bestValue = Math.max(bestValue, Number(s.duration));
                }
            } else if (metric === 'duration') {
                for (const s of (ex.sets || [])) {
                    if (s.completed && !s.skipped && s.duration) bestValue += parseDuration(s.duration);
                }
            } else if (metric === 'distance') {
                for (const s of (ex.sets || [])) {
                    if (s.completed && !s.skipped && s.distance) bestValue += Number(s.distance);
                }
            }
            }

            if (bestValue > 0) {
                dataPoints.push({
                    date: log.endTime,
                    value: Number(bestValue.toFixed(1)),
                    weight: bestSetDetails.w,
                    reps: bestSetDetails.r,
                });
            }
        }

        dataPoints.sort((a, b) => a.date - b.date);
        self.postMessage({ type: 'CHART_READY', dataPoints, reqId });
    }
};
