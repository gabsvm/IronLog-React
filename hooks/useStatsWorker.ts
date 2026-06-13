
import { useState, useEffect, useRef, useCallback } from 'react';
import { Log, ExerciseDef, UserProfile } from '../types';
import { MUSCLE_GROUPS } from '../constants';
import { useApp } from '../context/AppContext';

export type ChartMetric = '1rm' | 'volume' | 'duration' | 'distance' | 'max_reps' | 'hold_time';

// Types for Worker Messages
type WorkerAction = 
    | { type: 'CALCULATE_OVERVIEW', logs: Log[], activeMesoId?: number, reqId?: number }
    | { type: 'CALCULATE_CHART', logs: Log[], exerciseId: string, metric: ChartMetric, userBodyWeight?: number, reqId?: number }
    | { type: 'CALCULATE_ALL_BEST_1RM', logs: Log[], reqId?: number };

type WorkerResponse = 
    | { type: 'OVERVIEW_READY', volumeData: [string, number][], exerciseFrequency: Record<string, number>, reqId?: number }
    | { type: 'CHART_READY', dataPoints: { date: number, value: number, weight: number, reps: number }[], reqId?: number }
    | { type: 'ALL_BEST_1RM_READY', best1RMs: Map<string, number>, reqId?: number };

export const useStatsWorker = () => {
    const workerRef = useRef<Worker | null>(null);
    const [isWorkerReady, setIsWorkerReady] = useState(false);
    
    // We need userProfile from context to pass to worker
    const { userProfile } = useApp();

    useEffect(() => {
        // Use external worker file
        workerRef.current = new Worker(new URL('./stats.worker.ts', import.meta.url));
        setIsWorkerReady(true);

        return () => {
            workerRef.current?.terminate();
        };
    }, []);

    const calculateOverview = useCallback((logs: Log[], activeMesoId?: number): Promise<{ volumeData: [string, number][], exerciseFrequency: Record<string, number> }> => {
        return new Promise((resolve) => {
            if (!workerRef.current) return;
            const reqId = Date.now() + Math.random();
            const handler = (e: MessageEvent) => {
                if (e.data.type === 'OVERVIEW_READY' && e.data.reqId === reqId) {
                    workerRef.current?.removeEventListener('message', handler);
                    resolve({ volumeData: e.data.volumeData, exerciseFrequency: e.data.exerciseFrequency });
                }
            };
            workerRef.current.addEventListener('message', handler);
            workerRef.current.postMessage({ type: 'CALCULATE_OVERVIEW', logs, activeMesoId, reqId });
        });
    }, []);

    const calculateChartData = useCallback((logs: Log[], exerciseId: string, metric: ChartMetric): Promise<{ date: number, value: number, weight: number, reps: number }[]> => {
        return new Promise((resolve) => {
            if (!workerRef.current) return;
            const reqId = Date.now() + Math.random();
            const handler = (e: MessageEvent) => {
                if (e.data.type === 'CHART_READY' && e.data.reqId === reqId) {
                    workerRef.current?.removeEventListener('message', handler);
                    resolve(e.data.dataPoints);
                }
            };
            workerRef.current.addEventListener('message', handler);
            // Pass user profile weight for calculation
            workerRef.current.postMessage({ 
                type: 'CALCULATE_CHART', 
                logs, 
                exerciseId, 
                metric, 
                userBodyWeight: userProfile?.bodyWeight,
                reqId
            });
        });
    }, [userProfile]); // Re-create callback if profile changes

    const calculateAllBest1RMs = useCallback((logs: Log[]): Promise<Map<string, number>> => {
        return new Promise((resolve) => {
            if (!workerRef.current) return;
            const reqId = Date.now() + Math.random();
            const handler = (e: MessageEvent) => {
                if (e.data.type === 'ALL_BEST_1RM_READY' && e.data.reqId === reqId) {
                    workerRef.current?.removeEventListener('message', handler);
                    resolve(e.data.best1RMs);
                }
            };
            workerRef.current.addEventListener('message', handler);
            workerRef.current.postMessage({ type: 'CALCULATE_ALL_BEST_1RM', logs, reqId });
        });
    }, []);

    return { isWorkerReady, calculateOverview, calculateChartData, calculateAllBest1RMs };
};
