import { getEffectiveSetLoad, getLogBodyWeight, getSetLoadVolume } from '../utils/trainingMetrics';
import { computeOverview } from '../utils/statsOverview';

type MetricType = '1rm' | 'volume' | 'duration' | 'distance' | 'max_reps' | 'hold_time';

let cachedLogs: any[] = [];

const parseDuration = (val: any) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    if (String(val).includes(':')) {
        const parts = String(val).split(':').map(Number);
        return parts[0] + (parts[1] / 60);
    }
    return Number(val) || 0;
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

        // Do not sort/clone full log objects. Aggregate matching points first and
        // sort the much smaller output array at the end.
        for (const log of sourceLogs) {
            if (!log || log.skipped) continue;
            if (activeMesoId && log.mesoId !== activeMesoId) continue;
            const logBodyWeight = getLogBodyWeight(log, userBodyWeight);
            const ex = (log.exercises || []).find((candidate: any) => String(candidate.id) === String(exerciseId));
            if (!ex) continue;

            let bestValue = 0;
            let bestSetDetails = { w: 0, r: 0 };

            if ((metric as MetricType) === '1rm') {
                for (const s of (ex.sets || [])) {
                    if (s.completed && !s.skipped && (s.weight || s.weight === 0 || s.weight === '0') && s.reps) {
                        const w = getEffectiveSetLoad(s, ex, logBodyWeight);
                        const r = Number(s.reps);
                        const est1rm = w * (1 + r / 30);
                        if (est1rm > bestValue) {
                            bestValue = est1rm;
                            bestSetDetails = { w: Number(s.weight), r };
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
