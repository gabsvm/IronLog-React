import { WeightUnit } from "../types";
import { PROGRESSION_STEP, formatWeight, toDisplay, unitLabel } from "./units";

export interface ProgressionSet {
    weight: number | string;
    reps: number | string;
    /** Effort as logged: the app labels this input RIR (stored in `rpe`). */
    rpe?: number | string | null;
    completed?: boolean;
}

export interface ProgressionSuggestion {
    action: 'up' | 'hold' | 'down';
    /** Load change in display units (+step / 0 / negative). */
    deltaDisplay: number;
    /** Average working load in display units (base for the down suggestion). */
    baseDisplay: number;
    topReps: number;
    /** Lowest logged RIR (null when no set logged effort). */
    rir: number | null;
    /** Next-session rep goal for hold (best + 1). */
    targetReps: number;
}

/**
 * Q15: per-exercise progression from the last session's working sets.
 * Extends the legacy overload rule (up-or-nothing) without changing its
 * null cases: no data, incomplete sets and zero load still return null,
 * and up without RIR data or without a rep range keeps the legacy step.
 */
export const recommendProgression = (input: {
    sets: ProgressionSet[];
    range: { min: number; max: number } | null;
    rirTarget?: number;
    unit: WeightUnit;
}): ProgressionSuggestion | null => {
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
    const avgKg = parsed.reduce((n, s) => n + (Number.isFinite(s.weight) ? s.weight : 0), 0) / parsed.length;
    if (!(avgKg > 0)) return null;

    const topReps = Math.max(...parsed.map((s) => s.reps));
    const loggedRir = parsed
        .map((s) => s.rir)
        .filter((v): v is number => v != null && Number.isFinite(v));
    const rir = loggedRir.length > 0 ? Math.min(...loggedRir) : null;
    const baseDisplay = toDisplay(avgKg, unit);

    // No rep range (legacy {step} path): any completed work earns the step.
    if (!range) {
        return { action: 'up', deltaDisplay: PROGRESSION_STEP[unit], baseDisplay, topReps, rir, targetReps: topReps + 1 };
    }

    const atTop = parsed.every((s) => s.reps >= range.max);
    const belowFloor = parsed.every((s) => s.reps < range.min);
    if (atTop && (loggedRir.length === 0 || loggedRir.every((v) => v <= rirTarget))) {
        return { action: 'up', deltaDisplay: PROGRESSION_STEP[unit], baseDisplay, topReps, rir, targetReps: topReps + 1 };
    }
    if (belowFloor) {
        const delta = -Math.round(baseDisplay * 0.05 * 10) / 10;
        return { action: 'down', deltaDisplay: delta, baseDisplay, topReps, rir, targetReps: range.min };
    }
    return { action: 'hold', deltaDisplay: 0, baseDisplay, topReps, rir, targetReps: topReps + 1 };
};

export interface ProgressionTexts {
    up: string;
    hold: string;
    down: string;
    withRir: string;
}

/** One-line reason for a suggestion, via TRANSLATIONS templates. */
export const formatProgressionReason = (
    t: ProgressionTexts,
    suggestion: ProgressionSuggestion,
    unit: WeightUnit,
    lang: 'es' | 'en',
): string => {
    const suffix = unitLabel(unit).toLowerCase();
    const rirPart = suggestion.rir == null ? '' : t.withRir.replace('{rir}', String(suggestion.rir));
    if (suggestion.action === 'up') {
        return t.up
            .replace('{reps}', String(suggestion.topReps))
            .replace('{rir}', rirPart)
            .replace('{step}', formatWeight(suggestion.deltaDisplay, unit, lang))
            .replace('{unit}', suffix);
    }
    if (suggestion.action === 'hold') {
        return t.hold
            .replace('{target}', String(suggestion.targetReps))
            .replace('{rir}', rirPart);
    }
    const load = Math.round((suggestion.baseDisplay + suggestion.deltaDisplay) * 10) / 10;
    return t.down
        .replace('{load}', formatWeight(load, unit, lang))
        .replace('{unit}', suffix)
        .replace('{reps}', String(suggestion.topReps))
        .replace('{rir}', rirPart);
};
