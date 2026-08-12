import { useState, useEffect, useRef, useCallback } from 'react';
import { Log } from '../types';
import { useApp } from '../context/AppContext';

export type ChartMetric = '1rm' | 'volume' | 'duration' | 'distance' | 'max_reps' | 'hold_time';

type OverviewResult = { volumeData: [string, number][], exerciseFrequency: Record<string, number> };
type ChartPoint = { date: number, value: number, weight: number, reps: number };

type PendingRequest =
    | { type: 'OVERVIEW_READY'; resolve: (value: OverviewResult) => void }
    | { type: 'CHART_READY'; resolve: (value: ChartPoint[]) => void }
    | { type: 'ALL_BEST_1RM_READY'; resolve: (value: Map<string, number>) => void };

export const useStatsWorker = () => {
    const workerRef = useRef<Worker | null>(null);
    const lastLogsRef = useRef<Log[] | null>(null);
    const requestIdRef = useRef(0);
    const pendingRef = useRef(new Map<number, PendingRequest>());
    const [isWorkerReady, setIsWorkerReady] = useState(false);
    const { userProfile } = useApp();

    useEffect(() => {
        const worker = new Worker(new URL('./stats.worker.ts', import.meta.url));
        workerRef.current = worker;
        setIsWorkerReady(true);

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
            } else if (type === 'ALL_BEST_1RM_READY') {
                (pending as Extract<PendingRequest, { type: 'ALL_BEST_1RM_READY' }>).resolve(event.data.best1RMs);
            }
        };

        return () => {
            worker.terminate();
            workerRef.current = null;
            pendingRef.current.clear();
            lastLogsRef.current = null;
        };
    }, []);

    const ensureLogs = useCallback((logs: Log[]) => {
        const worker = workerRef.current;
        if (!worker || lastLogsRef.current === logs) return;
        lastLogsRef.current = logs;
        // Structured cloning the history is the expensive part. Do it only once
        // per immutable logs reference; subsequent metric requests send tiny messages.
        worker.postMessage({ type: 'SET_LOGS', logs });
    }, []);

    const nextRequestId = useCallback(() => {
        requestIdRef.current += 1;
        return requestIdRef.current;
    }, []);

    const calculateOverview = useCallback((logs: Log[], activeMesoId?: number): Promise<OverviewResult> => {
        const worker = workerRef.current;
        if (!worker) return Promise.resolve({ volumeData: [], exerciseFrequency: {} });
        ensureLogs(logs);
        const reqId = nextRequestId();
        return new Promise((resolve) => {
            pendingRef.current.set(reqId, { type: 'OVERVIEW_READY', resolve });
            worker.postMessage({ type: 'CALCULATE_OVERVIEW', activeMesoId, reqId });
        });
    }, [ensureLogs, nextRequestId]);

    const calculateChartData = useCallback((logs: Log[], exerciseId: string, metric: ChartMetric): Promise<ChartPoint[]> => {
        const worker = workerRef.current;
        if (!worker) return Promise.resolve([]);
        ensureLogs(logs);
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

    const calculateAllBest1RMs = useCallback((logs: Log[]): Promise<Map<string, number>> => {
        const worker = workerRef.current;
        if (!worker) return Promise.resolve(new Map());
        ensureLogs(logs);
        const reqId = nextRequestId();
        return new Promise((resolve) => {
            pendingRef.current.set(reqId, { type: 'ALL_BEST_1RM_READY', resolve });
            worker.postMessage({ type: 'CALCULATE_ALL_BEST_1RM', reqId });
        });
    }, [ensureLogs, nextRequestId]);

    return { isWorkerReady, calculateOverview, calculateChartData, calculateAllBest1RMs };
};
