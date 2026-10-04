
import { ProgramDay, UserProfile, MesoType, WeightUnit } from "../types";
import {
    DEFAULT_TEMPLATE,
    UPPER_LOWER_TEMPLATE,
    METABOLITE_TEMPLATE,
    RESENS_TEMPLATE,
    WIZARD_TEMPLATE
} from "../data/defaultTemplates";
import { PROGRESSION_STEP, formatWeight, toDisplay, unitLabel } from "./units";

export interface RecommendationResult {
    template: ProgramDay[];
    mesoType: MesoType;
    reasonKey: string; // Translation key for the explanation
    adjustedVolume?: boolean; // If true, volume was reduced for time constraints
}

export const recommendProgram = (profile: UserProfile): RecommendationResult => {
    const { experience, daysPerWeek, goal, sessionDuration } = profile;

    let selectedTemplate: ProgramDay[] = DEFAULT_TEMPLATE;
    let selectedType: MesoType = 'hyp_1';
    let reason = 'rec_default';

    // 1. Logic based on Frequency & Experience
    if (daysPerWeek <= 2) {
        // Very low frequency -> Full Body or Resensitization style
        selectedTemplate = RESENS_TEMPLATE;
        selectedType = 'resensitization';
        reason = 'rec_low_freq';
    } 
    else if (daysPerWeek === 3) {
        // Updated: Recommend Wizard v3 for 3-day split (Ideally Intermediate+)
        // If absolute beginner, we might want simpler Full Body, but Wizard is scaleable.
        selectedTemplate = WIZARD_TEMPLATE; 
        selectedType = 'wizard';
        reason = 'rec_wizard';
    } 
    else if (daysPerWeek === 4) {
        // Sweet spot for Upper/Lower
        selectedTemplate = UPPER_LOWER_TEMPLATE;
        selectedType = 'hyp_2';
        reason = 'rec_4_day';
    } 
    else {
        // 5-6 Days -> PPL (Push Pull Legs)
        selectedTemplate = DEFAULT_TEMPLATE; // PPL is 3 days but meant to be rotated 2x (6 days)
        selectedType = 'hyp_1';
        reason = 'rec_ppl';
    }

    // 2. Goal Overrides
    if (goal === 'endurance') {
        selectedTemplate = METABOLITE_TEMPLATE;
        selectedType = 'metabolite';
        reason = 'rec_endurance';
    }

    // 3. Time Constraints (Volume Adjustment)
    let finalTemplate = JSON.parse(JSON.stringify(selectedTemplate)); // Deep copy
    let adjustedVolume = false;

    if (sessionDuration === 'short') {
        // Reduce set count to fit in <45 mins
        finalTemplate = finalTemplate.map((day: ProgramDay) => ({
            ...day,
            slots: day.slots.map(slot => ({
                ...slot,
                setTarget: Math.max(2, slot.setTarget - 1) // Reduce by 1 set, min 2
            }))
        }));
        adjustedVolume = true;
    }

    return {
        template: finalTemplate,
        mesoType: selectedType,
        reasonKey: reason,
        adjustedVolume
    };
};

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
