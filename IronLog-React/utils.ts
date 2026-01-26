
import { Lang, Log, WorkoutSet, MesoType } from "./types";

export const formatDate = (d: number, l: Lang) => 
    new Date(d).toLocaleDateString(l==='en'?'en-US':'es-ES', {weekday:'short', month:'short', day:'numeric'});

export const formatSeconds = (s: number) => {
    const sec = Math.max(0, Math.floor(Number(s) || 0));
    return `${Math.floor(sec/60)}:${(sec%60).toString().padStart(2,'0')}`;
};

export const formatHoursMinutes = (s: number) => {
    const sec = Math.max(0, Math.floor(Number(s) || 0));
    const totalMin = Math.floor(sec / 60);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return `${h}:${m.toString().padStart(2,'0')}`;
};

export const roundWeight = (w: number) => { 
    const x = Number(w)||0; 
    const step = x >= 20 ? 2.5 : 1; 
    return Math.round(x/step)*step; 
};

export const getTranslated = (val: string | { en: string; es: string } | null | undefined, lang: Lang): string => {
    if (!val) return 'Unknown';
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
        const res = val[lang] || val['en'];
        // Critical safety check: Ensure the result is primitive
        if (typeof res === 'object') return JSON.stringify(res); 
        return String(res || 'Unknown');
    }
    return String(val);
};

export const getLastLogForExercise = (exerciseId: string, logs: Log[]): WorkoutSet[] | null => {
    if (!logs || !Array.isArray(logs)) return null;
    const validLogs = logs.filter(l => l && typeof l === 'object');
    const sortedLogs = [...validLogs].sort((a, b) => (b.endTime || 0) - (a.endTime || 0));
    
    for (const log of sortedLogs) {
        if (log.skipped) continue;
        const exercises = log.exercises;
        if (!Array.isArray(exercises)) continue;
        const ex = exercises.find(e => e && e.id === exerciseId);
        if (ex && ex.sets && Array.isArray(ex.sets) && ex.sets.some(s => s && s.completed)) {
            return ex.sets;
        }
    }
    return null;
};

/**
 * Parses a rep range string like "8-12" or "10" into min/max numbers.
 * Returns null if invalid or non-numeric (e.g. "Myo").
 */
export const parseTargetReps = (str?: string): { min: number, max: number } | null => {
    if (!str) return null;
    const clean = str.replace(/\s/g, ''); // Remove spaces
    
    // Check for range "8-12"
    if (clean.includes('-')) {
        const parts = clean.split('-');
        const min = Number(parts[0]);
        const max = Number(parts[1]);
        if (!isNaN(min) && !isNaN(max)) return { min, max };
    }
    
    // Check for single number "10"
    const val = parseInt(clean);
    if (!isNaN(val)) return { min: val, max: val };
    
    return null;
};

/**
 * Calculates RIR and phase notes based on Meso Type and Week
 * RP MPT 2.0 Logic: W1-2: 3RIR, W3-5: 2RIR, W6+: 1RIR
 */
export const getMesoStageConfig = (type: MesoType, week: number, isDeload: boolean) => {
    if (isDeload) {
        return { rir: null, label: 'recovery', note: 'DELOAD: Half reps, Light Weight. Focus on technique.' };
    }

    if (type === 'resensitization') {
         // Resensitization: Lower volume, Heavy weight, Stay away from failure to clear fatigue
         return { rir: 2, label: '2/fail', note: 'Resensitization: Heavy weight, low volume (3-6 reps).' };
    }

    if (type === 'metabolite') {
        // Metabolite: Burn focus, short rest
        if (week === 1) return { rir: 3, label: '3/fail', note: 'Metabolite: High Reps (20+), Short Rest (30-60s)' };
        if (week === 2) return { rir: 2, label: '2/fail', note: 'Increase Pump. Short Rest.' };
        return { rir: 0, label: 'FAILURE', note: 'Maximum Pump. Go to failure.' };
    }

    // Standard Hypertrophy / Full Body 2.0
    // Slower RIR ramp up to avoid early burnout
    if (week <= 2) return { rir: 3, label: '3/fail', note: `Week ${week}: Stop 3 reps before failure (Intro).` };
    if (week <= 5) return { rir: 2, label: '2/fail', note: `Week ${week}: Stop 2 reps before failure (Work).` };
    
    // Week 6+ Overreaching
    return { rir: 1, label: '1/fail', note: 'Overreaching: Train hard (1 RIR).' };
};

/**
 * RP-Style Algorithm for volume adjustment (Updated for MPT 2.0 Conservative Logic)
 */
export const calculateVolumeAdjustment = (soreness: number, performance: number): number => {
    // 1. NEGATIVE RATING (-1 / -2)
    if (soreness === 3) return -1;

    // 2. BASELINE RATING (0) - THE SWEET SPOT
    if (soreness === 2) return 0;

    // 3. POSITIVE RATING (+1 / +2)
    if (soreness === 1) {
        if (performance === 3) return 2;
        if (performance === 2) return 1;
        return 0;
    }

    return 0;
};
