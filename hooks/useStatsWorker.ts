import { useEffect, useRef, useCallback } from 'react';
import { Log } from '../types';
import { useApp } from '../context/AppContext';
import { getHistoricalBest1RMIndex } from '../utils/exerciseHistoryIndex';

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
        if (typeof Worker === 'undefined') return null;

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

    useEffect(() => {
        return () => {
            workerRef.current?.terminate();
            workerRef.current = null;
            pendingRef.current.clear();
            lastLogsRef.current = null;
        };
    }, []);

    const ensureLogs = useCallback((logs: Log[]) => {
        const worker = ensureWorker();
        if (!worker || lastLogsRef.current === logs) return worker;
        lastLogsRef.current = logs;
        // Structured-clone the history once per immutable logs reference. Metric
        // requests after this send only small query payloads.
        worker.postMessage({ type: 'SET_LOGS', logs });
        return worker;
    }, [ensureWorker]);

    const nextRequestId = useCallback(() => {
        requestIdRef.current += 1;
        return requestIdRef.current;
    }, []);

    const calculateOverview = useCallback((logs: Log[], activeMesoId?: number): Promise<OverviewResult> => {
        const worker = ensureLogs(logs);
        if (!worker) return Promise.resolve({ volumeData: [], exerciseFrequency: {} });
        const reqId = nextRequestId();
        return new Promise((resolve) => {
            pendingRef.current.set(reqId, { type: 'OVERVIEW_READY', resolve });
            worker.postMessage({ type: 'CALCULATE_OVERVIEW', activeMesoId, reqId });
        });
    }, [ensureLogs, nextRequestId]);

    const calculateChartData = useCallback((logs: Log[], exerciseId: string, metric: ChartMetric): Promise<ChartPoint[]> => {
        const worker = ensureLogs(logs);
        if (!worker) return Promise.resolve([]);
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

    // Workout PR detection does not need a Worker at all. Reuse the same
    // WeakMap-backed history index used by the workout cards and preserve the
    // effective-load/bodyweight semantics of EXPERIMENTAL.
    const calculateAllBest1RMs = useCallback((logs: Log[]): Promise<Map<string, number>> => {
        return Promise.resolve(getHistoricalBest1RMIndex(logs, userProfile?.bodyWeight));
    }, [userProfile?.bodyWeight]);

    // No eager Worker startup: consumers can call immediately and the first
    // calculation creates the worker on demand.
    const isWorkerReady = typeof Worker !== 'undefined';

    return { isWorkerReady, calculateOverview, calculateChartData, calculateAllBest1RMs };
};
