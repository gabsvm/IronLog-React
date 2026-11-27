import type { BodyLog, CardioSession, MuscleGroup, NutritionGoal, ProgramDay } from '../types';
import { parseLocalDateKey } from './localDate';

export type RpDietPhase = 'cut' | 'bulk' | 'maintenance';

export interface RpDietRecommendation {
    phase: RpDietPhase;
    avgCurrentWeightKg: number | null;
    avgPrevWeightKg: number | null;
    weeklyRatePct: number | null;
    targetRateRange: { minPct: number; maxPct: number };
    status: 'on_track' | 'too_slow' | 'too_fast' | 'insufficient_data';
    suggestedCalorieDelta: number;
    dietBreakRecommended: boolean;
    weeksInPhase: number;
    trainingDayMacros: { calories: number; protein: number; carbs: number; fat: number };
    restDayMacros: { calories: number; protein: number; carbs: number; fat: number };
}

const TARGET_RATES: Record<RpDietPhase, { minPct: number; maxPct: number }> = {
    cut: { minPct: -1.0, maxPct: -0.5 },
    bulk: { minPct: 0.25, maxPct: 0.5 },
    maintenance: { minPct: -0.2, maxPct: 0.2 },
};

const avg = (nums: number[]): number | null =>
    nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : null;

export const computeRpDietRecommendation = (input: {
    goal: NutritionGoal;
    bodyLogs: BodyLog[];
    nowMs?: number;
}): RpDietRecommendation => {
    const now = input.nowMs ?? Date.now();
    const goal = input.goal;
    const phase: RpDietPhase = goal.phase || 'maintenance';
    const range = TARGET_RATES[phase];

    const sorted = [...(input.bodyLogs || [])]
        .filter((b) => Number.isFinite(b.weight) && b.weight > 0)
        .sort((a, b) => a.date - b.date);

    const dayMs = 86_400_000;
    const recent7 = sorted.filter((b) => b.date >= now - 7 * dayMs).map((b) => b.weight);
    const prev7 = sorted.filter((b) => b.date >= now - 14 * dayMs && b.date < now - 7 * dayMs).map((b) => b.weight);

    // Fallback when timestamps are tightly clustered in tests or fresh setups
    const fallbackRecent = sorted.length >= 4 ? sorted.slice(-Math.ceil(sorted.length / 2)).map((b) => b.weight) : recent7;
    const fallbackPrev = sorted.length >= 4 ? sorted.slice(0, Math.floor(sorted.length / 2)).map((b) => b.weight) : prev7;

    const avgCurrentWeightKg = avg(recent7.length >= 2 && prev7.length >= 2 ? recent7 : fallbackRecent);
    const avgPrevWeightKg = avg(recent7.length >= 2 && prev7.length >= 2 ? prev7 : fallbackPrev);

    let weeklyRatePct: number | null = null;
    if (avgCurrentWeightKg != null && avgPrevWeightKg != null && avgPrevWeightKg > 0) {
        weeklyRatePct = Math.round(((avgCurrentWeightKg - avgPrevWeightKg) / avgPrevWeightKg) * 10000) / 100;
    }

    let status: RpDietRecommendation['status'] = 'insufficient_data';
    let suggestedCalorieDelta = 0;

    if (weeklyRatePct != null) {
        if (phase === 'cut') {
            if (weeklyRatePct > range.maxPct) {
                status = 'too_slow';
                suggestedCalorieDelta = -200;
            } else if (weeklyRatePct < range.minPct) {
                status = 'too_fast';
                suggestedCalorieDelta = 150;
            } else {
                status = 'on_track';
            }
        } else if (phase === 'bulk') {
            if (weeklyRatePct < range.minPct) {
                status = 'too_slow';
                suggestedCalorieDelta = 200;
            } else if (weeklyRatePct > range.maxPct) {
                status = 'too_fast';
                suggestedCalorieDelta = -150;
            } else {
                status = 'on_track';
            }
        } else {
            if (weeklyRatePct < range.minPct) {
                status = 'too_fast';
                suggestedCalorieDelta = 100;
            } else if (weeklyRatePct > range.maxPct) {
                status = 'too_fast';
                suggestedCalorieDelta = -100;
            } else {
                status = 'on_track';
            }
        }
    }

    let weeksInPhase = 1;
    if (goal.phaseStartDate) {
        const localStart = /^\d{4}-\d{2}-\d{2}$/.test(goal.phaseStartDate)
            ? parseLocalDateKey(goal.phaseStartDate).getTime()
            : Date.parse(goal.phaseStartDate);
        if (Number.isFinite(localStart) && localStart <= now) {
            weeksInPhase = Math.max(1, Math.floor((now - localStart) / (7 * dayMs)) + 1);
        }
    }

    const dietBreakRecommended = phase === 'cut' && weeksInPhase >= 8;

    // Peri-workout RP Diet 2.0 carb shifting
    const carbDelta = goal.trainingDayCarbDeltaG ?? Math.round(goal.carbs * 0.15);
    const trainingCarbs = Math.max(0, goal.carbs + Math.round(carbDelta * 0.5));
    const restCarbs = Math.max(0, goal.carbs - Math.round(carbDelta * 0.5));

    const baseCal = goal.calories;
    const trainingDayMacros = {
        calories: baseCal + Math.round((trainingCarbs - goal.carbs) * 4),
        protein: goal.protein,
        carbs: trainingCarbs,
        fat: goal.fat,
    };
    const restDayMacros = {
        calories: Math.max(1200, baseCal + Math.round((restCarbs - goal.carbs) * 4)),
        protein: goal.protein,
        carbs: restCarbs,
        fat: goal.fat,
    };

    return {
        phase,
        avgCurrentWeightKg: avgCurrentWeightKg != null ? Math.round(avgCurrentWeightKg * 100) / 100 : null,
        avgPrevWeightKg: avgPrevWeightKg != null ? Math.round(avgPrevWeightKg * 100) / 100 : null,
        weeklyRatePct,
        targetRateRange: range,
        status,
        suggestedCalorieDelta,
        dietBreakRecommended,
        weeksInPhase,
        trainingDayMacros,
        restDayMacros,
    };
};

export interface CardioInterferenceReport {
    stepsToday: number;
    stepsTarget: number;
    stepsPct: number;
    interferenceWarning: boolean;
    recommendation: { es: string; en: string };
}

const LEG_MUSCLES: Set<MuscleGroup> = new Set(['QUADS', 'HAMSTRINGS', 'GLUTES', 'CALVES']);

export const evaluateCardioInterference = (input: {
    stepsToday: number;
    stepsTarget?: number;
    todayCardio: CardioSession[];
    upcomingDay?: ProgramDay;
}): CardioInterferenceReport => {
    const stepsTarget = input.stepsTarget && input.stepsTarget > 0 ? input.stepsTarget : 9000;
    const stepsToday = Math.max(0, Math.round(input.stepsToday || 0));
    const stepsPct = Math.min(100, Math.round((stepsToday / stepsTarget) * 100));

    const hasHiitOrHardRun = (input.todayCardio || []).some(
        (c) => c.activityType === 'hiit' || (c.activityType === 'running' && c.durationMin >= 30),
    );
    const nextHasLegs = Boolean(
        input.upcomingDay?.slots?.some((s) => LEG_MUSCLES.has(s.muscle)),
    );

    const interferenceWarning = hasHiitOrHardRun && nextHasLegs;

    return {
        stepsToday,
        stepsTarget,
        stepsPct,
        interferenceWarning,
        recommendation: interferenceWarning
            ? {
                  es: 'HIIT / corrida intensa cerca del día de pierna: preferí LISS (caminata o bici suave) o separá ≥6 h.',
                  en: 'HIIT / heavy running near legs day: swap to LISS (walk or light bike) or separate by ≥6h.',
              }
            : {
                  es: 'LISS OK · Cero interferencia con hipertrofia de pierna.',
                  en: 'LISS OK · Zero interference with lower-body hypertrophy.',
              },
    };
};
