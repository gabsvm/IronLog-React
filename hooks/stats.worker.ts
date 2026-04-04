// WorkerAction type includes new calisthenics metrics
type MetricType = '1rm' | 'volume' | 'duration' | 'distance' | 'max_reps' | 'hold_time';
const parseDuration = (val: any) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    if (val.includes(':')) {
        const parts = val.split(':').map(Number);
        return parts[0] + (parts[1] / 60);
    }
    return Number(val) || 0;
};

self.onmessage = function(e: MessageEvent) {
    const { type, logs, activeMesoId, exerciseId, metric, userBodyWeight } = e.data;

    if (type === 'CALCULATE_OVERVIEW') {
        const muscleCounts: Record<string, number> = {};
        const exFreq: Record<string, number> = {};
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
                        const setsDone = (ex.sets || []).filter((s: any) => s.completed).length;
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
        const dataPoints: any[] = [];
        const sortedLogs = [...logs].sort((a, b) => a.endTime - b.endTime);
        const bw = userBodyWeight || 0;

        sortedLogs.forEach(log => {
            if (log.skipped) return;
            const ex = (log.exercises || []).find((e: any) => e.id === exerciseId);
            if (!ex) return;

            let bestValue = 0;
            let bestSetDetails = { w: 0, r: 0 };
            
            // Check if this exercise instance was marked as Bodyweight
            const isBW = !!ex.isBodyweight;

            if (metric === '1rm') {
                // Epley Formula: 1RM = Weight * (1 + Reps/30)
                (ex.sets || []).forEach((s: any) => {
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
                bestValue = (ex.sets || []).reduce((acc: number, s: any) => {
                    if (s.completed && (s.weight || s.weight === 0 || s.weight === '0') && s.reps) {
                        let w = Number(s.weight);
                        if (isBW) w += bw; // Add User Bodyweight
                        return acc + (w * Number(s.reps));
                    }
                    return acc;
                }, 0);
            } else if (metric === 'max_reps') {
                // Best single-set reps (for bodyweight exercises)
                let bestReps = 0;
                (ex.sets || []).forEach((s: any) => {
                    if (s.completed && s.reps) {
                        const r = Number(s.reps);
                        if (r > bestReps) bestReps = r;
                    }
                });
                bestValue = bestReps;
                bestSetDetails = { w: 0, r: bestReps };
            } else if (metric === 'hold_time') {
                // Best single-set hold duration in seconds (for isometric exercises)
                let bestSec = 0;
                (ex.sets || []).forEach((s: any) => {
                    if (s.completed && s.duration) {
                        const sec = Number(s.duration);
                        if (sec > bestSec) bestSec = sec;
                    }
                });
                bestValue = bestSec;
                bestSetDetails = { w: 0, r: 0 };
            } else if (metric === 'duration') {
                bestValue = (ex.sets || []).reduce((acc: number, s: any) => {
                    if (s.completed && s.duration) return acc + parseDuration(s.duration);
                    return acc;
                }, 0);
            } else if (metric === 'distance') {
                bestValue = (ex.sets || []).reduce((acc: number, s: any) => {
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
