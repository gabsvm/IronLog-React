import { describe, it, expect } from 'vitest';
import {
    calculateWorkDensity,
    compareWorkDensity,
    recommendDensityProgression,
    formatDensityProgressionReason,
} from '../../utils/densityProgression';
import { TRANSLATIONS } from '../../constants';

describe('Density Progression: calculateWorkDensity', () => {
    it('calculates tonnage per minute for weighted sets', () => {
        const sets = [
            { weight: 100, reps: 10, completed: true, restSeconds: 90 },
            { weight: 100, reps: 10, completed: true, restSeconds: 90 },
            { weight: 100, reps: 10, completed: true },
        ];
        // 3 sets * 1000 kg = 3000 kg.
        // Explicit duration: 300 seconds = 5 minutes. 3000 / 5 = 600 kg/min.
        const result = calculateWorkDensity(sets, { durationSeconds: 300 });
        expect(result.volume).toBe(3000);
        expect(result.durationSeconds).toBe(300);
        expect(result.densityRate).toBe(600);
        expect(result.avgRestSeconds).toBe(90);
    });

    it('estimates duration when not explicitly provided', () => {
        const sets = [
            { weight: 80, reps: 10, completed: true, restSeconds: 60 },
            { weight: 80, reps: 10, completed: true, restSeconds: 60 },
        ];
        // 2 sets * 35s = 70s under tension + 1 gap of 60s = 130s = 2.166m.
        // Volume = 1600 kg. DensityRate = 1600 / 2.166 = ~738.5 kg/min.
        const result = calculateWorkDensity(sets);
        expect(result.volume).toBe(1600);
        expect(result.durationSeconds).toBe(130);
        expect(result.densityRate).toBeCloseTo(738.5, 0);
    });

    it('calculates reps per minute for bodyweight sets', () => {
        const sets = [
            { weight: 0, reps: 15, completed: true },
            { weight: 0, reps: 15, completed: true },
        ];
        const result = calculateWorkDensity(sets, { isBodyweight: true, durationSeconds: 120 });
        expect(result.volume).toBe(30);
        expect(result.densityRate).toBe(15); // 30 reps / 2 minutes = 15 reps/min
    });

    it('returns zeroes for empty or uncompleted sets', () => {
        const result = calculateWorkDensity([{ weight: 100, reps: 10, completed: false }]);
        expect(result.volume).toBe(0);
        expect(result.densityRate).toBe(0);
    });
});

describe('Density Progression: compareWorkDensity', () => {
    it('calculates percentage increase in work density and time saved', () => {
        const prev = { volume: 3000, durationSeconds: 360, densityRate: 500, avgRestSeconds: 90 };
        const curr = { volume: 3000, durationSeconds: 300, densityRate: 600, avgRestSeconds: 75 };

        const comparison = compareWorkDensity(curr, prev);
        expect(comparison).not.toBeNull();
        expect(comparison?.percentChange).toBe(20); // (600 - 500) / 500 = +20%
        expect(comparison?.timeDeltaSeconds).toBe(60); // 360 - 300 = 60s saved
    });

    it('returns null if either density is zero', () => {
        const prev = { volume: 0, durationSeconds: 0, densityRate: 0, avgRestSeconds: 0 };
        const curr = { volume: 3000, durationSeconds: 300, densityRate: 600, avgRestSeconds: 75 };
        expect(compareWorkDensity(curr, prev)).toBeNull();
    });
});

describe('Density Progression: recommendDensityProgression', () => {
    const set = (weight: number, reps: number, rpe?: number) => ({
        weight, reps, rpe: rpe ?? 2, completed: true,
    });
    const range = { min: 8, max: 12 };

    it('suggests reducing rest by 15s when top reps are achieved with good RIR margin', () => {
        const suggestion = recommendDensityProgression({
            sets: [set(60, 12), set(60, 12)],
            range,
            currentRestSeconds: 90,
            baseRestSeconds: 90,
            minRestSeconds: 45,
            restStepSeconds: 15,
            unit: 'kg',
        });

        expect(suggestion).toMatchObject({
            mode: 'density',
            action: 'density_up',
            currentRestSeconds: 90,
            nextRestSeconds: 75,
            restDeltaSeconds: -15,
            topReps: 12,
        });
    });

    it('holds rest and aims for +1 rep when mid-range', () => {
        const suggestion = recommendDensityProgression({
            sets: [set(60, 10), set(60, 9)],
            range,
            currentRestSeconds: 75,
            baseRestSeconds: 90,
            minRestSeconds: 45,
            unit: 'kg',
        });

        expect(suggestion).toMatchObject({
            mode: 'density',
            action: 'density_hold',
            currentRestSeconds: 75,
            nextRestSeconds: 75,
            restDeltaSeconds: 0,
            targetReps: 11,
        });
    });

    it('suggests increasing rest when reps fall below the floor', () => {
        const suggestion = recommendDensityProgression({
            sets: [set(60, 6), set(60, 5)],
            range,
            currentRestSeconds: 45,
            baseRestSeconds: 90,
            minRestSeconds: 45,
            restStepSeconds: 15,
            unit: 'kg',
        });

        expect(suggestion).toMatchObject({
            mode: 'density',
            action: 'density_down',
            currentRestSeconds: 45,
            nextRestSeconds: 60,
            restDeltaSeconds: 15,
        });
    });

    it('completes the density cycle when minimum rest is achieved and raises load', () => {
        const suggestion = recommendDensityProgression({
            sets: [set(60, 12), set(60, 12)],
            range,
            currentRestSeconds: 45, // At min rest!
            baseRestSeconds: 90,
            minRestSeconds: 45,
            unit: 'kg',
        });

        expect(suggestion).toMatchObject({
            mode: 'density',
            action: 'density_cycle_complete',
            currentRestSeconds: 45,
            nextRestSeconds: 90, // resets to base rest
            deltaLoadDisplay: 2.5,
            topReps: 12,
        });
    });
});

describe('Density Progression: formatDensityProgressionReason', () => {
    it('formats density_up in Spanish and English', () => {
        const suggestion: any = {
            mode: 'density',
            action: 'density_up',
            nextRestSeconds: 75,
            currentRestSeconds: 90,
            restDeltaSeconds: -15,
            topReps: 12,
        };

        const es = formatDensityProgressionReason(TRANSLATIONS.es.progression, suggestion, 'kg', 'es');
        expect(es).toContain('75s');
        expect(es).toContain('-15s');

        const en = formatDensityProgressionReason(TRANSLATIONS.en.progression, suggestion, 'kg', 'en');
        expect(en).toContain('75s');
        expect(en).toContain('-15s');
    });

    it('formats density_cycle_complete with load increase', () => {
        const suggestion: any = {
            mode: 'density',
            action: 'density_cycle_complete',
            minRestSeconds: 45,
            baseRestSeconds: 90,
            deltaLoadDisplay: 2.5,
        };

        const es = formatDensityProgressionReason(TRANSLATIONS.es.progression, suggestion, 'kg', 'es');
        expect(es).toContain('45s');
        expect(es).toContain('2,5 kg');
        expect(es).toContain('90s');
    });
});
