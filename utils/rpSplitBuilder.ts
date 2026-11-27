import type { MuscleGroup, MusclePriorityLevel, ProgramDay, ProgramSlot } from '../types';

export const SYNERGIST_MAP: Partial<Record<MuscleGroup, MuscleGroup[]>> = {
    CHEST: ['TRICEPS', 'SHOULDERS'],
    BACK: ['BICEPS', 'FOREARMS', 'TRAPS', 'SHOULDERS'],
    QUADS: ['GLUTES', 'HAMSTRINGS'],
    HAMSTRINGS: ['GLUTES'],
    SHOULDERS: ['TRICEPS', 'TRAPS'],
    GLUTES: ['HAMSTRINGS', 'QUADS'],
};

export interface SplitConflict {
    id: string;
    type: 'consecutive_muscle' | 'synergist_adjacent' | 'muscle_cap_exceeded';
    dayIdxA: number;
    dayIdxB?: number;
    muscleA: MuscleGroup;
    muscleB?: MuscleGroup;
    description: { es: string; en: string };
}

export const getExperienceFrequencyRecommendation = (
    experience: 'beginner' | 'intermediate' | 'advanced' = 'intermediate',
): { min: number; max: number; ideal: number; label: { es: string; en: string } } => {
    if (experience === 'beginner') {
        return {
            min: 2,
            max: 4,
            ideal: 3,
            label: { es: '2–3 días/sem (máx. 4) para principiantes', en: '2–3 days/wk (max 4) for beginners' },
        };
    }
    if (experience === 'advanced') {
        return {
            min: 4,
            max: 6,
            ideal: 5,
            label: { es: '4–6 días/sem para atletas avanzados', en: '4–6 days/wk for advanced lifters' },
        };
    }
    return {
        min: 3,
        max: 5,
        ideal: 4,
        label: { es: '3–5 días/sem para intermedios', en: '3–5 days/wk for intermediates' },
    };
};

const getDayMuscles = (day: ProgramDay): MuscleGroup[] =>
    Array.from(new Set((day.slots || []).map((s) => s.muscle).filter((m) => m && m !== 'CARDIO')));

/**
 * Audits a multi-day program split for official RP guardrails:
 * 1. Adjacent-day primary muscle fatigue without recovery spacing
 * 2. Adjacent-day synergist bottleneck (e.g. Chest Day 1 -> Triceps Day 2)
 * 3. Session muscle count cap (>6 distinct muscles in 4-6 day splits)
 */
export const detectSplitConflicts = (programDays: ProgramDay[]): SplitConflict[] => {
    const conflicts: SplitConflict[] = [];
    const activeDays = (programDays || []).filter((d) => (d.slots || []).length > 0);
    if (activeDays.length <= 1) return conflicts;

    const isSplit4to6 = activeDays.length >= 4;

    activeDays.forEach((day, idx) => {
        const musclesToday = getDayMuscles(day);

        if (isSplit4to6 && musclesToday.length > 6) {
            conflicts.push({
                id: `cap-${idx}`,
                type: 'muscle_cap_exceeded',
                dayIdxA: idx,
                muscleA: musclesToday[0],
                description: {
                    es: `Día ${idx + 1} supera 6 grupos musculares (${musclesToday.length}). Divide o pasa secundarios a Maintain.`,
                    en: `Day ${idx + 1} exceeds 6 muscle groups (${musclesToday.length}). Split or trim secondary muscles.`,
                },
            });
        }

        const nextIdx = (idx + 1) % activeDays.length;
        // Skip wrap-around check on 2-day splits
        if (activeDays.length === 2 && nextIdx === 0) return;
        const nextDay = activeDays[nextIdx];
        const musclesNext = getDayMuscles(nextDay);

        for (const mA of musclesToday) {
            if (musclesNext.includes(mA)) {
                const slotsToday = (day.slots || []).filter((s) => s.muscle === mA);
                const setsToday = slotsToday.reduce((sum, s) => sum + (s.setTarget || 2), 0);
                if (setsToday > 2) {
                    conflicts.push({
                        id: `same-${idx}-${nextIdx}-${mA}`,
                        type: 'consecutive_muscle',
                        dayIdxA: idx,
                        dayIdxB: nextIdx,
                        muscleA: mA,
                        description: {
                            es: `${mA} aparece en días seguidos (Día ${idx + 1} → Día ${nextIdx + 1}) con >2 series.`,
                            en: `${mA} scheduled on back-to-back days (Day ${idx + 1} → Day ${nextIdx + 1}) with >2 sets.`,
                        },
                    });
                }
                continue;
            }

            const syns = SYNERGIST_MAP[mA] || [];
            for (const syn of syns) {
                if (musclesNext.includes(syn) && !musclesToday.includes(syn)) {
                    conflicts.push({
                        id: `syn-${idx}-${nextIdx}-${mA}-${syn}`,
                        type: 'synergist_adjacent',
                        dayIdxA: idx,
                        dayIdxB: nextIdx,
                        muscleA: mA,
                        muscleB: syn,
                        description: {
                            es: `Sinergista fatigado: ${mA} (Día ${idx + 1}) seguido de ${syn} (Día ${nextIdx + 1}). Reordenar mejora rendimiento.`,
                            en: `Synergist overlap: ${mA} (Day ${idx + 1}) right before ${syn} (Day ${nextIdx + 1}). Reordering protects output.`,
                        },
                    });
                    break;
                }
            }
        }
    });

    return conflicts;
};

const PRIORITY_RANK: Record<MusclePriorityLevel, number> = {
    emphasize: 0,
    grow: 1,
    maintain: 2,
};

const assignHeavyToLightReps = (slot: ProgramSlot, slotIdx: number, totalSlots: number, dayIdx: number): string => {
    // Earlier sessions / lead slots favor heavier 5-10 hypertrophy work; late isolation slots push higher SFR 10-20 / 20-30
    if (slotIdx === 0 && dayIdx % 2 === 0) return '5-10';
    if (slotIdx >= Math.max(2, totalSlots - 2)) return slot.muscle === 'CALVES' || slot.muscle === 'SHOULDERS' || slot.muscle === 'ABS' ? '15-30' : '10-20';
    return slotIdx === 0 ? '6-12' : '10-20';
};

/**
 * Applies RP Muscle Priorities live onto a program split:
 * 1. Optionally reduces synergists of `emphasize` muscles down to `maintain`
 * 2. Places `emphasize` muscles 1st/2nd in every session (alternating lead order when >=2 emphasized)
 * 3. Calibrates initial MEV sets (`emphasize`: 3-4, `grow`: 2-3, `maintain`: 1-2 MV cap)
 * 4. Assigns Heavy -> Light rep ranges across the session.
 */
export const applyMusclePrioritiesToProgram = (
    programDays: ProgramDay[],
    priorities: Partial<Record<MuscleGroup, MusclePriorityLevel>>,
    options: { reduceSynergists?: boolean } = {},
): {
    program: ProgramDay[];
    updatedPriorities: Partial<Record<MuscleGroup, MusclePriorityLevel>>;
} => {
    const updatedPriorities: Partial<Record<MuscleGroup, MusclePriorityLevel>> = { ...priorities };

    if (options.reduceSynergists) {
        const emphasized = (Object.entries(updatedPriorities) as [MuscleGroup, MusclePriorityLevel][])
            .filter(([, level]) => level === 'emphasize')
            .map(([m]) => m);

        for (const empMuscle of emphasized) {
            const syns = SYNERGIST_MAP[empMuscle] || [];
            for (const syn of syns) {
                if (updatedPriorities[syn] !== 'emphasize') {
                    updatedPriorities[syn] = 'maintain';
                }
            }
        }
    }

    const emphasizedOrder = (Object.entries(updatedPriorities) as [MuscleGroup, MusclePriorityLevel][])
        .filter(([, level]) => level === 'emphasize')
        .map(([m]) => m);

    const nextProgram = (programDays || []).map((day, dIdx) => {
        const slots = [...(day.slots || [])];
        if (slots.length === 0) return day;

        // Alternate primary emphasized lead muscle across sessions when 2+ emphasized exist
        const leadMuscle = emphasizedOrder.length >= 2
            ? emphasizedOrder[dIdx % emphasizedOrder.length]
            : emphasizedOrder[0];

        slots.sort((a, b) => {
            const pA = PRIORITY_RANK[updatedPriorities[a.muscle] || 'grow'];
            const pB = PRIORITY_RANK[updatedPriorities[b.muscle] || 'grow'];
            if (pA !== pB) return pA - pB;
            if (pA === 0 && leadMuscle) {
                if (a.muscle === leadMuscle && b.muscle !== leadMuscle) return -1;
                if (b.muscle === leadMuscle && a.muscle !== leadMuscle) return 1;
            }
            return 0;
        });

        const tunedSlots = slots.map((slot, sIdx) => {
            const lvl = updatedPriorities[slot.muscle] || 'grow';
            const setTarget = lvl === 'emphasize'
                ? Math.max(3, Math.min(5, slot.setTarget || 3))
                : lvl === 'maintain'
                    ? Math.min(2, Math.max(1, slot.setTarget || 2))
                    : Math.max(2, Math.min(3, slot.setTarget || 2));

            return {
                ...slot,
                setTarget,
                reps: assignHeavyToLightReps(slot, sIdx, slots.length, dIdx),
            };
        });

        return { ...day, slots: tunedSlots };
    });

    return { program: nextProgram, updatedPriorities };
};

const scoreSplitConflicts = (conflicts: SplitConflict[]): number =>
    conflicts.reduce((sum, c) => sum + (c.type === 'consecutive_muscle' ? 10 : c.type === 'synergist_adjacent' ? 2 : 1), 0);

/**
 * Permutes days (preserving Rest Days or evaluating minimum conflict score across permutations)
 * so reordering never worsens consecutive-muscle or synergist clashes.
 */
export const reorderDaysToResolveConflicts = (programDays: ProgramDay[]): ProgramDay[] => {
    if (!Array.isArray(programDays) || programDays.length <= 2) return programDays;
    const baseScore = scoreSplitConflicts(detectSplitConflicts(programDays));
    if (baseScore === 0) return programDays;

    if (programDays.length > 7) {
        const evens = programDays.filter((_, i) => i % 2 === 0);
        const odds = programDays.filter((_, i) => i % 2 === 1);
        const candidate = [...evens, ...odds];
        return scoreSplitConflicts(detectSplitConflicts(candidate)) < baseScore ? candidate : programDays;
    }

    let best = programDays;
    let bestScore = baseScore;
    const rest = programDays.slice(1);
    const permute = (arr: ProgramDay[], l: number) => {
        if (l === arr.length) {
            const candidate = [programDays[0], ...arr];
            const score = scoreSplitConflicts(detectSplitConflicts(candidate));
            if (score < bestScore) {
                bestScore = score;
                best = candidate;
            }
            return;
        }
        for (let i = l; i < arr.length; i += 1) {
            [arr[l], arr[i]] = [arr[i], arr[l]];
            permute(arr, l + 1);
            [arr[l], arr[i]] = [arr[i], arr[l]];
            if (bestScore === 0) return;
        }
    };
    permute([...rest], 0);
    return best;
};
