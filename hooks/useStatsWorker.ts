
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
                const { type, logs, activeMesoId, exerciseId, metric, userBodyWeight } = e.data;

                if (type === 'CALCULATE_OVERVIEW') {
                    const muscleCounts = {};
                    const exFreq = {};
                    const weeksFound = new Set();
                    
                    // Initialize muscles
                    const muscles = ['CHEST', 'BACK', 'QUADS', 'HAMSTRINGS', 'GLUTES', 'CALVES', 'SHOULDERS', 'BICEPS', 'TRICEPS', 'TRAPS', 'ABS', 'FOREARMS', 'CARDIO'];
                    muscles.forEach(m => muscleCounts[m] = 0);

                    if (Array.isArray(logs)) {
                        logs.forEach(log => {
                            if (activeMesoId && log.mesoId !== activeMesoId) return;
                            if (log.week) weeksFound.add(log.week);

                            if (log.exercises && Array.isArray(log.exercises)) {
                                log.exercises.forEach(ex => {
                                    const setsDone = (ex.sets || []).filter(s => s.completed).length;
                                    if (muscleCounts[ex.muscle] !== undefined) {
                                        muscleCounts[ex.muscle] += setsDone;
                                    }
                                    exFreq[ex.id] = (exFreq[ex.id] || 0) + 1;
                                });
                            }
                        });
                    }
                    
                    const numWeeks = Math.max(1, weeksFound.size);
                    Object.keys(muscleCounts).forEach(key => {
                        muscleCounts[key] = Math.round(muscleCounts[key] / numWeeks);
                    });

                    const sortedVolume = Object.entries(muscleCounts).sort((a, b) => b[1] - a[1]);
                    self.postMessage({ type: 'OVERVIEW_READY', volumeData: sortedVolume, exerciseFrequency: exFreq });
                }

                if (type === 'CALCULATE_CHART') {
                    const dataPoints = [];
                    const sortedLogs = [...logs].sort((a, b) => a.endTime - b.endTime);
                    const bw = userBodyWeight || 0;

                    sortedLogs.forEach(log => {
                        if (log.skipped) return;
                        const ex = (log.exercises || []).find(e => e.id === exerciseId);
                        if (!ex) return;

                        let bestValue = 0;
                        let bestSetDetails = { w: 0, r: 0 };
                        
                        // Check if this exercise instance was marked as Bodyweight
                        const isBW = !!ex.isBodyweight;

                        if (metric === '1rm') {
                            // Epley Formula: 1RM = Weight * (1 + Reps/30)
                            (ex.sets || []).forEach(s => {
                                if (s.completed && (s.weight || s.weight === 0 || s.weight === '0') && s.reps) {
                                    let w = Number(s.weight);
                                    if (isBW) w += bw; // Add User Bodyweight if applicable

                                    const r = Number(s.reps);
                                    const est1rm = w * (1 + r / 30);
                                    if (est1rm > bestValue) {
                                        bestValue = est1rm;
                                        bestSetDetails = { w: Number(s.weight), r }; // Keep recorded weight for display
                                    }
                                }
                            });
                        } else if (metric === 'volume') {
                            // Total Tonnage
                            bestValue = (ex.sets || []).reduce((acc, s) => {
                                if (s.completed && (s.weight || s.weight === 0 || s.weight === '0') && s.reps) {
                                    let w = Number(s.weight);
                                    if (isBW) w += bw; // Add User Bodyweight
                                    return acc + (w * Number(s.reps));
                                }
                                return acc;
                            }, 0);
                        } else if (metric === 'duration') {
                            bestValue = (ex.sets || []).reduce((acc, s) => {
                                if (s.completed && s.duration) return acc + parseDuration(s.duration);
                                return acc;
                            }, 0);
                        } else if (metric === 'distance') {
                            bestValue = (ex.sets || []).reduce((acc, s) => {
                                if (s.completed && s.distance) return acc + Number(s.distance);
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
