// U5: pure rest-timer math, effort rating and next-action resolution, moved verbatim from components/ui/RestTimerOverlay.tsx.
import { TRANSLATIONS } from '../../../constants';
import { getTranslated } from '../../../utils';
import { pickLang } from '../../../utils/i18n';
import { formatWeight, unitLabel } from '../../../utils/units';
import type { SessionExercise, WeightUnit } from '../../../types';

export const TIMER_RING_RADIUS = 52;
export const TIMER_RING_CIRCUMFERENCE = 2 * Math.PI * TIMER_RING_RADIUS; // ~326.7256...

export const calculateTimerPercentage = (timeLeft: number, duration: number): number => {
    if (!duration || duration <= 0) return 0;
    return Math.min(100, Math.max(0, (timeLeft / duration) * 100));
};

export const calculateRingDashOffset = (percentage: number, circumference: number = TIMER_RING_CIRCUMFERENCE): number => {
    const clampedPct = Math.min(100, Math.max(0, percentage));
    return circumference * (1 - clampedPct / 100);
};

export interface RestNextAction {
    category: string;
    name: string;
    isSuperset: boolean;
    target: string | null;
    /** One-based ordinal within the visible exercise set list. */
    setNumber: number;
    totalSets: number;
}

export interface RestNotificationContent {
    liveTitle: string;
    liveBody: string;
}

const NOTIFICATION_COPY = {
    es: { resting: 'Descansando', nextSet: 'Próxima serie', nextExercise: 'Próximo ejercicio', superset: 'Superserie', of: 'de' },
    en: { resting: 'Resting', nextSet: 'Next set', nextExercise: 'Next exercise', superset: 'Superset', of: 'of' },
};

/** Identical exercise selection to the in-app rest overlay; no invented next set. */
export function resolveRestNotificationContent(
    exercises: SessionExercise[] | undefined,
    source: { exerciseInstanceId: number; setId?: number } | undefined,
    lang: 'es' | 'en',
): RestNotificationContent | null {
    const info = resolveRestNextAction(exercises, source, lang);
    if (!info) return null;
    const copy = pickLang(lang, NOTIFICATION_COPY);
    const nextSet = info.category === TRANSLATIONS[lang].timer.nextSet;
    const prefix = info.isSuperset ? copy.superset : nextSet ? copy.nextSet : copy.nextExercise;
    const detail = info.setNumber > 0 && info.totalSets > 0
        ? `${prefix}: ${info.setNumber} ${copy.of} ${info.totalSets}`
        : prefix;
    return {
        liveTitle: `${copy.resting} · ${info.name}`.slice(0, 110),
        liveBody: detail,
    };
}

export function applyEffortRatingToExercises(
    exercises: SessionExercise[],
    exerciseInstanceId: number,
    setId: number,
    effort: 'easy' | 'ok' | 'hard'
): SessionExercise[] {
    const rpeVal = effort === 'easy' ? '6' : effort === 'ok' ? '8' : '10';
    return exercises.map(ex => {
        if (ex.instanceId !== exerciseInstanceId) return ex;
        return {
            ...ex,
            sets: (ex.sets || []).map(s => s.id === setId ? { ...s, rpe: rpeVal } : s)
        };
    });
}

export function resolveRestNextAction(
    exercises: SessionExercise[] | undefined,
    source?: { exerciseInstanceId: number; setId?: number },
    lang: 'es' | 'en' = 'es',
    unit: WeightUnit = 'kg'
): RestNextAction | null {
    const tm = TRANSLATIONS[lang].timer;
    if (!exercises || exercises.length === 0) return null;

    // Stored weights are kg; the target shows the chosen display unit.
    const formatTarget = (set?: { weight?: string | number; reps?: string | number }): string | null => {
        if (set?.weight && set?.reps) {
            return `${formatWeight(Number(set.weight), unit, lang)} ${unitLabel(unit).toLowerCase()} × ${set.reps}`;
        }
        if (set?.reps) return `${set.reps} reps`;
        return null;
    };

    const setPosition = (ex: SessionExercise, set: SessionExercise['sets'][number]) => ({
        setNumber: ex.sets.indexOf(set) + 1,
        totalSets: ex.sets.length,
    });

    // If rest was triggered by an exact source set
    if (source) {
        const sourceExIndex = exercises.findIndex(e => e.instanceId === source.exerciseInstanceId);
        if (sourceExIndex >= 0) {
            const sourceEx = exercises[sourceExIndex];

            // If this is a superset
            if (sourceEx.supersetId) {
                const supersetPartners = exercises.filter(e => e.supersetId === sourceEx.supersetId);
                const nextPartner = supersetPartners.find(p => (p.sets || []).some(s => !s.completed));
                if (nextPartner) {
                    const nextSet = (nextPartner.sets || []).find(s => !s.completed);
                    const target = formatTarget(nextSet);
                    return {
                        category: tm.nextInSuperset,
                        name: getTranslated(nextPartner.name, lang),
                        isSuperset: true,
                        target,
                        ...setPosition(nextPartner, nextSet!)
                    };
                }
            } else {
                // Regular exercise: prefer the next incomplete set in the same exercise
                const nextSetInSameEx = (sourceEx.sets || []).find(s => !s.completed);
                if (nextSetInSameEx) {
                    const target = formatTarget(nextSetInSameEx);
                    return {
                        category: tm.nextSet,
                        name: getTranslated(sourceEx.name, lang),
                        isSuperset: false,
                        target,
                        ...setPosition(sourceEx, nextSetInSameEx)
                    };
                }
            }

            // If source exercise has no more incomplete sets, find the next incomplete exercise after it
            const totalExercises = exercises.length;
            for (let offset = 1; offset < totalExercises; offset++) {
                const candidateIndex = (sourceExIndex + offset) % totalExercises;
                const candidate = exercises[candidateIndex];
                const nextSet = (candidate.sets || []).find(s => !s.completed);
                if (nextSet) {
                    const isSuperset = !!candidate.supersetId;
                    const target = formatTarget(nextSet);
                    return {
                        category: isSuperset ? tm.nextInSuperset : tm.nextExercise,
                        name: getTranslated(candidate.name, lang),
                        isSuperset,
                        target,
                        ...setPosition(candidate, nextSet)
                    };
                }
            }
        }
    }

    // Fallback when no source or when rest started manually: scan from beginning
    for (const ex of exercises) {
        const nextSet = (ex.sets || []).find(s => !s.completed);
        if (nextSet) {
            const isSuperset = !!ex.supersetId;
            const target = formatTarget(nextSet);
            return {
                category: isSuperset ? tm.nextInSuperset : tm.nextExercise,
                name: getTranslated(ex.name, lang),
                isSuperset,
                target,
                ...setPosition(ex, nextSet)
            };
        }
    }
    return null;
}
