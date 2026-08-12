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
    const { type, logs, activeMesoId, exerciseId, metric, userBodyWeight, reqId } = e.data;

    if (type === 'SET_LOGS') {
        cachedLogs = Array.isArray(logs) ? logs : [];
        self.postMessage({ type: 'LOGS_READY', reqId });
        return;
    }

    const sourceLogs = cachedLogs;

    if (type === 'CALCULATE_OVERVIEW') {
        const muscleCounts: Record<string, number> = {};
        const exFreq: Record<string, number> = {};
        const weeksFound = new Set<number>();
        const muscles = ['CHEST', 'BACK', 'QUADS', 'HAMSTRINGS', 'GLUTES', 'CALVES', 'SHOULDERS', 'BICEPS', 'TRICEPS', 'TRAPS', 'ABS', 'FOREARMS', 'CARDIO'];
        muscles.forEach(m => muscleCounts[m] = 0);

        for (const log of sourceLogs) {
            if (!log || log.skipped) continue;
            if (activeMesoId && log.mesoId !== activeMesoId) continue;
            if (log.week) weeksFound.add(log.week);

            for (const ex of (log.exercises || [])) {
                let setsDone = 0;
                for (const set of (ex.sets || [])) if (set.completed) setsDone += 1;
                if (muscleCounts[ex.muscle] !== undefined) muscleCounts[ex.muscle] += setsDone;
                if (ex.id) exFreq[ex.id] = (exFreq[ex.id] || 0) + 1;
            }
        }

        const numWeeks = Math.max(1, weeksFound.size);
        for (const key of Object.keys(muscleCounts)) {
            muscleCounts[key] = Math.round(muscleCounts[key] / numWeeks);
        }

        const sortedVolume = Object.entries(muscleCounts).sort((a, b) => b[1] - a[1]);
        self.postMessage({ type: 'OVERVIEW_READY', volumeData: sortedVolume, exerciseFrequency: exFreq, reqId });
        return;
    }

    if (type === 'CALCULATE_CHART') {
        const dataPoints: any[] = [];
        // Do not sort the full log objects. Collect matching points and sort the
        // much smaller result array after aggregation.
        const bw = userBodyWeight || 0;

        for (const log of sourceLogs) {
            if (!log || log.skipped) continue;
            const ex = (log.exercises || []).find((candidate: any) => candidate.id === exerciseId);
            if (!ex) continue;

            let bestValue = 0;
            let bestSetDetails = { w: 0, r: 0 };
            const isBW = !!ex.isBodyweight;

            if (metric === '1rm') {
                for (const s of (ex.sets || [])) {
                    if (s.completed && (s.weight || s.weight === 0 || s.weight === '0') && s.reps) {
                        let w = Number(s.weight);
                        if (isBW) w += bw;
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
                    if (s.completed && (s.weight || s.weight === 0 || s.weight === '0') && s.reps) {
                        let w = Number(s.weight);
                        if (isBW) w += bw;
                        bestValue += w * Number(s.reps);
                    }
                }
            } else if (metric === 'max_reps') {
                for (const s of (ex.sets || [])) {
                    if (s.completed && s.reps) bestValue = Math.max(bestValue, Number(s.reps));
                }
                bestSetDetails = { w: 0, r: bestValue };
            } else if (metric === 'hold_time') {
                for (const s of (ex.sets || [])) {
                    if (s.completed && s.duration) bestValue = Math.max(bestValue, Number(s.duration));
                }
            } else if (metric === 'duration') {
                for (const s of (ex.sets || [])) {
                    if (s.completed && s.duration) bestValue += parseDuration(s.duration);
                }
            } else if (metric === 'distance') {
                for (const s of (ex.sets || [])) {
                    if (s.completed && s.distance) bestValue += Number(s.distance);
                }
            }

            if (bestValue > 0) {
                dataPoints.push({
                    date: log.endTime,
                    value: Number(bestValue.toFixed(1)),
                    weight: bestSetDetails.w,
                    reps: bestSetDetails.r
                });
            }
        }

        dataPoints.sort((a, b) => a.date - b.date);
        self.postMessage({ type: 'CHART_READY', dataPoints, reqId });
    }
};
