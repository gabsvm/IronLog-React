
import { useState, useEffect, useRef, useCallback } from 'react';
import { Log, MuscleGroup, ExerciseDef } from '../types';
import { MUSCLE_GROUPS } from '../constants';

// Types for Worker Messages
type WorkerAction = 
    | { type: 'CALCULATE_OVERVIEW', logs: Log[], activeMesoId?: number }
    | { type: 'CALCULATE_CHART', logs: Log[], exerciseId: string, metric: '1rm' | 'volume' | 'duration' | 'distance' };

type WorkerResponse = 
    | { type: 'OVERVIEW_READY', volumeData: [string, number][], exerciseFrequency: Record<string, number> }
    | { type: 'CHART_READY', dataPoints: { date: number, value: number, weight: number, reps: number }[] };

export const useStatsWorker = () => {
    const workerRef = useRef<Worker | null>(null);
    const [isWorkerReady, setIsWorkerReady] = useState(false);

    useEffect(() => {
        // INLINE WORKER CODE
        const workerCode = `
            // Helper to parse "mm:ss" to number (minutes)
            const parseDuration = (val) => {
                if (typeof val === 'number') return val;
                if (!val) return 0;
                if (val.includes(':')) {
                    const parts = val.split(':').map(Number);
                    return parts[0] + (parts[1] / 60);
                }
                return Number(val) || 0;
            };

            self.onmessage = function(e) {
                const { type, logs, activeMesoId, exerciseId, metric } = e.data;

                if (type === 'CALCULATE_OVERVIEW') {
                    const muscleCounts = {};
                    const exFreq = {};
                    const weeksFound = new Set();
                    
                    // Initialize muscles
                    const muscles = ['CHEST', 'BACK', 'QUADS', 'HAMSTRINGS', 'GLUTES', 'CALVES', 'SHOULDERS', 'BICEPS', 'TRICEPS', 'TRAPS', 'ABS', 'FOREARMS', 'CARDIO'];
                    muscles.forEach(m => muscleCounts[m] = 0);

                    if (Array.isArray(logs)) {
                        logs.forEach(log => {
                            // Filter by active meso if provided
                            if (activeMesoId && log.mesoId !== activeMesoId) return;
                            
                            // Track weeks to calculate average later
                            if (log.week) weeksFound.add(log.week);

                            if (log.exercises && Array.isArray(log.exercises)) {
                                log.exercises.forEach(ex => {
                                    // Count Sets for Volume
                                    const setsDone = (ex.sets || []).filter(s => s.completed).length;
                                    if (muscleCounts[ex.muscle] !== undefined) {
                                        muscleCounts[ex.muscle] += setsDone;
                                    }

                                    // Count Frequency
                                    exFreq[ex.id] = (exFreq[ex.id] || 0) + 1;
                                });
                            }
                        });
                    }
                    
                    // Calculate Average Weekly Volume
                    // If no weeks found (e.g. new cycle), divisor is 1 to show raw count (likely 0 or current session)
                    const numWeeks = Math.max(1, weeksFound.size);
                    
                    // Update counts to be averages
                    Object.keys(muscleCounts).forEach(key => {
                        // Round to nearest integer for cleaner UI
                        muscleCounts[key] = Math.round(muscleCounts[key] / numWeeks);
                    });

                    const sortedVolume = Object.entries(muscleCounts).sort((a, b) => b[1] - a[1]);
                    self.postMessage({ type: 'OVERVIEW_READY', volumeData: sortedVolume, exerciseFrequency: exFreq });
                }

                if (type === 'CALCULATE_CHART') {
                    const dataPoints = [];
                    // Sort logs chronologically for the chart
                    const sortedLogs = [...logs].sort((a, b) => a.endTime - b.endTime);

                    sortedLogs.forEach(log => {
                        if (log.skipped) return;
                        const ex = (log.exercises || []).find(e => e.id === exerciseId);
                        if (!ex) return;

                        let bestValue = 0;
                        let bestSetDetails = { w: 0, r: 0 };

                        if (metric === '1rm') {
                            // Epley Formula: 1RM = Weight * (1 + Reps/30)
                            (ex.sets || []).forEach(s => {
                                if (s.completed && s.weight && s.reps) {
                                    const w = Number(s.weight);
                                    const r = Number(s.reps);
                                    const est1rm = w * (1 + r / 30);
                                    if (est1rm > bestValue) {
                                        bestValue = est1rm;
                                        bestSetDetails = { w, r };
                                    }
                                }
                            });
                        } else if (metric === 'volume') {
                            // Total Tonnage
                            bestValue = (ex.sets || []).reduce((acc, s) => {
                                if (s.completed && s.weight && s.reps) {
                                    return acc + (Number(s.weight) * Number(s.reps));
                                }
                                return acc;
                            }, 0);
                        } else if (metric === 'duration') {
                            // Cardio: Total Time (Minutes)
                            bestValue = (ex.sets || []).reduce((acc, s) => {
                                if (s.completed && s.duration) {
                                    return acc + parseDuration(s.duration);
                                }
                                return acc;
                            }, 0);
                        } else if (metric === 'distance') {
                            // Cardio: Total Distance (KM)
                            bestValue = (ex.sets || []).reduce((acc, s) => {
                                if (s.completed && s.distance) {
                                    return acc + Number(s.distance);
                                }
                                return acc;
                            }, 0);
                        }

                        if (bestValue > 0) {
                            dataPoints.push({
                                date: log.endTime,
                                value: Number(bestValue.toFixed(1)),
                                weight: bestSetDetails.w,
                                reps: bestSetDetails.r
                            });
                        }
                    });

                    self.postMessage({ type: 'CHART_READY', dataPoints });
                }
            };
        `;

        const blob = new Blob([workerCode], { type: 'application/javascript' });
        workerRef.current = new Worker(URL.createObjectURL(blob));
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
            workerRef.current.postMessage({ type: 'CALCULATE_CHART', logs, exerciseId, metric });
        });
    }, []);

    return { isWorkerReady, calculateOverview, calculateChartData };
};
