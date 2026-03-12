
import { useState, useEffect, useRef, useCallback } from 'react';
import { Log, MuscleGroup, ExerciseDef, UserProfile } from '../types';
import { MUSCLE_GROUPS } from '../constants';
import { useApp } from '../context/AppContext';

// Types for Worker Messages
type WorkerAction = 
    | { type: 'CALCULATE_OVERVIEW', logs: Log[], activeMesoId?: number }
    | { type: 'CALCULATE_CHART', logs: Log[], exerciseId: string, metric: '1rm' | 'volume' | 'duration' | 'distance', userBodyWeight?: number };

type WorkerResponse = 
    | { type: 'OVERVIEW_READY', volumeData: [string, number][], exerciseFrequency: Record<string, number> }
    | { type: 'CHART_READY', dataPoints: { date: number, value: number, weight: number, reps: number }[] };

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
            const handler = (e: MessageEvent) => {
                if (e.data.type === 'OVERVIEW_READY') {
                    workerRef.current?.removeEventListener('message', handler);
                    resolve({ volumeData: e.data.volumeData, exerciseFrequency: e.data.exerciseFrequency });
                }
            };
            workerRef.current.addEventListener('message', handler);
            workerRef.current.postMessage({ type: 'CALCULATE_OVERVIEW', logs, activeMesoId });
        });
    }, []);

    const calculateChartData = useCallback((logs: Log[], exerciseId: string, metric: '1rm' | 'volume' | 'duration' | 'distance'): Promise<{ date: number, value: number, weight: number, reps: number }[]> => {
        return new Promise((resolve) => {
            if (!workerRef.current) return;
            const handler = (e: MessageEvent) => {
                if (e.data.type === 'CHART_READY') {
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
                userBodyWeight: userProfile?.bodyWeight 
            });
        });
    }, [userProfile]); // Re-create callback if profile changes

    return { isWorkerReady, calculateOverview, calculateChartData };
};
