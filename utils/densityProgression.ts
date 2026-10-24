import { WeightUnit } from '../types';
import { PROGRESSION_STEP, formatWeight, unitLabel } from './units';
import { pickLang } from './i18n';
import type { ProgressionSet, ProgressionTexts } from './recommendationEngine';

export interface WorkDensityMetric {
    /** Total volume in kg (or total reps if bodyweight) */
    volume: number;
    /** Duration in seconds */
    durationSeconds: number;
    /** Rate: volume per minute (kg/min or reps/min) */
    densityRate: number;
    /** Average rest seconds between completed working sets */
    avgRestSeconds: number;
}

export interface DensityComparison {
    currentDensity: number;
    previousDensity: number;
    /** Percentage change (e.g. +15 for +15%, -8 for -8%) */
    percentChange: number;
    /** Time saved in seconds compared to previous session at same volume */
    timeDeltaSeconds: number;
}

export interface DensityProgressionInput {
    sets: ProgressionSet[];
    range: { min: number; max: number } | null;
    currentRestSeconds?: number;
    baseRestSeconds?: number;
    minRestSeconds?: number;
    restStepSeconds?: number;
    rirTarget?: number;
    unit: WeightUnit;
}

export interface DensityProgressionSuggestion {
    mode: 'density';
    action: 'density_up' | 'density_hold' | 'density_down' | 'density_cycle_complete';
    nextRestSeconds: number;
    currentRestSeconds: number;
    restDeltaSeconds: number;
    deltaLoadDisplay?: number;
    topReps: number;
    rir: number | null;
    targetReps: number;
    baseRestSeconds: number;
    minRestSeconds: number;
}

const DEFAULT_BASE_REST = 90;
const DEFAULT_MIN_REST = 45;
const DEFAULT_REST_STEP = 15;

/**
 * Calculates work density (volume per minute).
 * If durationSeconds is not provided, estimates based on set count (~35s per set)
 * plus accumulated rest time.
 */
export const calculateWorkDensity = (
    sets: ProgressionSet[],
    options?: {
        durationSeconds?: number;
        isBodyweight?: boolean;
    }
): WorkDensityMetric => {
    const completedSets = (sets || []).filter((s) => s?.completed);
    if (completedSets.length === 0) {
        return { volume: 0, durationSeconds: 0, densityRate: 0, avgRestSeconds: 0 };
    }

    let volume = 0;
    let accumulatedRest = 0;
    let restCount = 0;

    for (const set of completedSets) {
        const reps = Number(set.reps) || 0;
        const weight = Number(set.weight) || 0;
        volume += options?.isBodyweight ? reps : reps * weight;

        const setRest = Number((set as any).restSeconds);
        if (Number.isFinite(setRest) && setRest > 0) {
            accumulatedRest += setRest;
            restCount += 1;
        }
    }

    const avgRestSeconds = restCount > 0 ? Math.round(accumulatedRest / restCount) : DEFAULT_BASE_REST;

    // Determine duration: explicit duration or sum of working duration + rest
    let durationSeconds = options?.durationSeconds ?? 0;
    if (!(durationSeconds > 0)) {
        // Estimate: 35s under tension per set + rest between sets (completedSets.length - 1)
        const restGaps = Math.max(0, completedSets.length - 1);
        durationSeconds = completedSets.length * 35 + restGaps * avgRestSeconds;
    }

    const minutes = Math.max(0.1, durationSeconds / 60);
    const densityRate = Math.round((volume / minutes) * 10) / 10;

    return {
        volume,
        durationSeconds: Math.round(durationSeconds),
        densityRate,
        avgRestSeconds,
    };
};

/**
 * Compares current work density against previous session.
 */
export const compareWorkDensity = (
    current: WorkDensityMetric,
    previous: WorkDensityMetric
): DensityComparison | null => {
    if (current.densityRate <= 0 || previous.densityRate <= 0) return null;

    const percentChange = Math.round(((current.densityRate - previous.densityRate) / previous.densityRate) * 100);
    const timeDeltaSeconds = previous.durationSeconds - current.durationSeconds;

    return {
        currentDensity: current.densityRate,
        previousDensity: previous.densityRate,
        percentChange,
        timeDeltaSeconds,
    };
};

/**
 * Progression by training density (reducing rest intervals while holding load and reps).
 * When minimum rest is achieved at target reps, signals cycle completion and load increment.
 */
export const recommendDensityProgression = (
    input: DensityProgressionInput
): DensityProgressionSuggestion | null => {
    const { sets, range, unit } = input;
    const rirTarget = input.rirTarget ?? 2;
    if (!Array.isArray(sets) || sets.length === 0) return null;
    if (sets.some((s) => !s?.completed)) return null;

    const parsed = sets.map((s) => ({
        weight: Number(s.weight),
        reps: Number(s.reps),
        rir: s.rpe == null || s.rpe === '' ? null : Number(s.rpe),
    }));
    if (parsed.some((s) => !Number.isFinite(s.reps) || s.reps <= 0)) return null;

    const baseRestSeconds = input.baseRestSeconds ?? DEFAULT_BASE_REST;
    const minRestSeconds = input.minRestSeconds ?? DEFAULT_MIN_REST;
    const restStepSeconds = input.restStepSeconds ?? DEFAULT_REST_STEP;
    const currentRestSeconds = input.currentRestSeconds ?? baseRestSeconds;

    const topReps = Math.max(...parsed.map((s) => s.reps));
    const loggedRir = parsed
        .map((s) => s.rir)
        .filter((v): v is number => v != null && Number.isFinite(v));
    const rir = loggedRir.length > 0 ? Math.min(...loggedRir) : null;

    // Check if target reps were achieved
    const minTarget = range?.min ?? 8;
    const maxTarget = range?.max ?? 12;
    const atTop = range ? parsed.every((s) => s.reps >= maxTarget) : parsed.every((s) => s.reps >= minTarget);
    const belowFloor = range ? parsed.every((s) => s.reps < minTarget) : false;
    const hasMargin = loggedRir.length === 0 || loggedRir.every((v) => v >= 1 && v <= rirTarget);

    // 1. Success condition: Target reps hit with adequate RIR margin
    if (atTop && hasMargin) {
        if (currentRestSeconds > minRestSeconds) {
            // Reduce rest interval
            const nextRestSeconds = Math.max(minRestSeconds, currentRestSeconds - restStepSeconds);
            return {
                mode: 'density',
                action: 'density_up',
                nextRestSeconds,
                currentRestSeconds,
                restDeltaSeconds: nextRestSeconds - currentRestSeconds,
                topReps,
                rir,
                targetReps: topReps,
                baseRestSeconds,
                minRestSeconds,
            };
        }

        // Reached minimum rest threshold! Complete the density cycle and raise load
        return {
            mode: 'density',
            action: 'density_cycle_complete',
            nextRestSeconds: baseRestSeconds,
            currentRestSeconds,
            restDeltaSeconds: baseRestSeconds - currentRestSeconds,
            deltaLoadDisplay: PROGRESSION_STEP[unit],
            topReps,
            rir,
            targetReps: minTarget,
            baseRestSeconds,
            minRestSeconds,
        };
    }

    // 2. Under-recovery / failure condition: rest was too short, reps fell below floor
    if (belowFloor) {
        const nextRestSeconds = currentRestSeconds + restStepSeconds;
        return {
            mode: 'density',
            action: 'density_down',
            nextRestSeconds,
            currentRestSeconds,
            restDeltaSeconds: restStepSeconds,
            topReps,
            rir,
            targetReps: minTarget,
            baseRestSeconds,
            minRestSeconds,
        };
    }

    // 3. Hold condition: consolidate reps at current rest
    return {
        mode: 'density',
        action: 'density_hold',
        nextRestSeconds: currentRestSeconds,
        currentRestSeconds,
        restDeltaSeconds: 0,
        topReps,
        rir,
        targetReps: Math.min(maxTarget, topReps + 1),
        baseRestSeconds,
        minRestSeconds,
    };
};

/**
 * Format human-readable reason string for density progression suggestions.
 */
export const formatDensityProgressionReason = (
    t: ProgressionTexts & {
        densityUp?: string;
        densityHold?: string;
        densityCycleComplete?: string;
        densityDown?: string;
    },
    suggestion: DensityProgressionSuggestion,
    unit: WeightUnit,
    lang: 'es' | 'en'
): string => {
    const suffix = unitLabel(unit).toLowerCase();

    if (suggestion.action === 'density_up') {
        const tmpl = t.densityUp || pickLang(lang, {
            es: 'Densidad: {reps} reps logradas · Descanso {rest}s (-{step}s)',
            en: 'Density: {reps} reps hit · Rest {rest}s (-{step}s)',
        });
        return tmpl
            .replace('{reps}', String(suggestion.topReps))
            .replace('{rest}', String(suggestion.nextRestSeconds))
            .replace('{step}', String(Math.abs(suggestion.restDeltaSeconds)));
    }

    if (suggestion.action === 'density_hold') {
        const tmpl = t.densityHold || pickLang(lang, {
            es: 'Densidad: Mantén {rest}s de descanso, apunta a {target} reps',
            en: 'Density: Hold {rest}s rest, aim for {target} reps',
        });
        return tmpl
            .replace('{rest}', String(suggestion.currentRestSeconds))
            .replace('{target}', String(suggestion.targetReps));
    }

    if (suggestion.action === 'density_cycle_complete') {
        const tmpl = t.densityCycleComplete || pickLang(lang, {
            es: 'Densidad máx ({minRest}s) · +{step} {unit} y reinicia a {baseRest}s',
            en: 'Max density hit ({minRest}s) · +{step} {unit} & reset to {baseRest}s',
        });
        const loadStep = formatWeight(suggestion.deltaLoadDisplay || PROGRESSION_STEP[unit], unit, lang);
        return tmpl
            .replace('{minRest}', String(suggestion.minRestSeconds))
            .replace('{baseRest}', String(suggestion.baseRestSeconds))
            .replace('{step}', loadStep)
            .replace('{unit}', suffix);
    }

    // density_down
    const tmpl = t.densityDown || pickLang(lang, {
        es: 'Rendimiento bajo: Aumenta descanso a {rest}s (+{step}s)',
        en: 'Low volume: Increase rest to {rest}s (+{step}s)',
    });
    return tmpl
        .replace('{rest}', String(suggestion.nextRestSeconds))
        .replace('{step}', String(suggestion.restDeltaSeconds));
};
