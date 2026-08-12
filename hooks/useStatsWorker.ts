import { useEffect, useRef, useCallback } from 'react';
import { Log } from '../types';
import { useApp } from '../context/AppContext';
import { buildExerciseHistoryIndex } from '../utils/exerciseHistoryIndex';

export type ChartMetric = '1rm' | 'volume' | 'duration' | 'distance' | 'max_reps' | 'hold_time';

type OverviewResult = { volumeData: [string, number][], exerciseFrequency: Record<string, number> };
type ChartPoint = { date: number, value: number, weight: number, reps: number };

type PendingRequest =
    | { type: 'OVERVIEW_READY'; resolve: (value: OverviewResult) => void }
    | { type: 'CHART_READY'; resolve: (value: ChartPoint[]) => void };

export const useStatsWorker = () => {
    const workerRef = useRef<Worker | null>(null);
    const lastLogsRef = useRef<Log[] | null>(null);
    const requestIdRef = useRef(0);
    const pendingRef = useRef(new Map<number, PendingRequest>());
    const { userProfile } = useApp();

    const ensureWorker = useCallback(() => {
        if (workerRef.current) return workerRef.current;

        const worker = new Worker(new URL('./stats.worker.ts', import.meta.url));
        workerRef.current = worker;
        worker.onmessage = (event: MessageEvent) => {
            const { type, reqId } = event.data || {};
            if (typeof reqId !== 'number') return;
            const pending = pendingRef.current.get(reqId);
            if (!pending || pending.type !== type) return;

            pendingRef.current.delete(reqId);
            if (type === 'OVERVIEW_READY') {
                (pending as Extract<PendingRequest, { type: 'OVERVIEW_READY' }>).resolve({
                    volumeData: event.data.volumeData,
                    exerciseFrequency: event.data.exerciseFrequency,
                });
            } else if (type === 'CHART_READY') {
                (pending as Extract<PendingRequest, { type: 'CHART_READY' }>).resolve(event.data.dataPoints);
            }
        };
        return worker;
    }, []);

    useEffect(() => () => {
        workerRef.current?.terminate();
        workerRef.current = null;
        pendingRef.current.clear();
        lastLogsRef.current = null;
    }, []);

    const ensureLogs = useCallback((logs: Log[]) => {
        const worker = ensureWorker();
        if (lastLogsRef.current === logs) return worker;
        lastLogsRef.current = logs;
        // Structured cloning the history is the expensive part. Do it only once
        // per immutable logs reference; subsequent metric requests send tiny messages.
        worker.postMessage({ type: 'SET_LOGS', logs });
        return worker;
    }, [ensureWorker]);

    const nextRequestId = useCallback(() => {
        requestIdRef.current += 1;
        return requestIdRef.current;
    }, []);

    const calculateOverview = useCallback((logs: Log[], activeMesoId?: number): Promise<OverviewResult> => {
        const worker = ensureLogs(logs);
        const reqId = nextRequestId();
        return new Promise((resolve) => {
            pendingRef.current.set(reqId, { type: 'OVERVIEW_READY', resolve });
            worker.postMessage({ type: 'CALCULATE_OVERVIEW', activeMesoId, reqId });
        });
    }, [ensureLogs, nextRequestId]);

    const calculateChartData = useCallback((logs: Log[], exerciseId: string, metric: ChartMetric): Promise<ChartPoint[]> => {
        const worker = ensureLogs(logs);
        const reqId = nextRequestId();
        return new Promise((resolve) => {
            pendingRef.current.set(reqId, { type: 'CHART_READY', resolve });
            worker.postMessage({
                type: 'CALCULATE_CHART',
                exerciseId,
                metric,
                userBodyWeight: userProfile?.bodyWeight,
                reqId,
            });
        });
    }, [ensureLogs, nextRequestId, userProfile?.bodyWeight]);

    // Workout PR detection does not need a Worker at all. Reuse the same WeakMap
    // history index that exercise cards use, so opening a workout no longer spawns
    // a worker or structured-clones the whole history just to get best 1RMs.
    const calculateAllBest1RMs = useCallback((logs: Log[]): Promise<Map<string, number>> => {
        const best = new Map<string, number>();
        for (const [exerciseId, summary] of buildExerciseHistoryIndex(logs)) {
            if (summary.bestWeighted1RM > 0) best.set(exerciseId, summary.bestWeighted1RM);
        }
        return Promise.resolve(best);
    }, []);

    // Kept for compatibility with existing callers. The API is immediately ready;
    // the actual Worker is instantiated lazily on the first overview/chart request.
    const isWorkerReady = true;

    return { isWorkerReady, calculateOverview, calculateChartData, calculateAllBest1RMs };
};
