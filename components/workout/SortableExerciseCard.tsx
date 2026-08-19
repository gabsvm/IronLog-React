import React, { useMemo } from 'react';
import type { Log, WorkoutSet } from '../../types';
import { getExerciseHistorySummary } from '../../utils/exerciseHistoryIndex';
import { Icon } from '../ui/Icon';
import { SortableExerciseCard as SortableExerciseCardImpl } from './SortableExerciseCardImpl';

type SortableExerciseCardProps = React.ComponentProps<typeof SortableExerciseCardImpl>;
type RangedWorkoutSet = WorkoutSet & { prescribedRepRange?: { min: number; max: number } };
type PerformanceExercise = SortableExerciseCardProps['exercise'] & {
    progressionPolicy?: 'double' | 'hold' | 'pivot';
};

const makeCompletedSet = (patch: Partial<WorkoutSet>): WorkoutSet => ({
    id: -1,
    weight: '',
    reps: '',
    rpe: '',
    completed: true,
    type: 'regular',
    ...patch,
});

/**
 * Performance wrapper around the current EXPERIMENTAL card implementation.
 *
 * The implementation historically scans `logs` for its PR badge and overload
 * suggestion. Instead of rewriting that large, fast-moving UI component, build
 * one cached history index and feed it at most two synthetic log entries.
 */
export const SortableExerciseCard = React.memo((props: SortableExerciseCardProps) => {
    const { logs, exercise, lang } = props;
    const performanceExercise = exercise as PerformanceExercise;

    const programTargetSummary = useMemo(() => {
        if (!exercise?.programSlotId || !Array.isArray(exercise.sets) || exercise.sets.length === 0) return null;
        const labels = exercise.sets.map((set) => {
            const ranged = set as RangedWorkoutSet;
            if (ranged.prescribedRepRange) return `${ranged.prescribedRepRange.min}–${ranged.prescribedRepRange.max}`;
            if (set.prescribedReps == null) return null;
            return set.prescribedReps === 'FAILURE' ? 'F' : String(set.prescribedReps);
        });
        if (labels.some(value => value == null)) return null;
        const safeLabels = labels as string[];
        return safeLabels.every(label => label === safeLabels[0])
            ? `${safeLabels.length}×${safeLabels[0]}`
            : safeLabels.join('·');
    }, [exercise?.programSlotId, exercise?.sets]);

    const historySummary = useMemo(() => {
        if (!Array.isArray(logs) || logs.length === 0 || exercise?.id == null) return null;
        return getExerciseHistorySummary(logs, String(exercise.id));
    }, [logs, exercise?.id]);

    const progressionCue = useMemo(() => {
        if (!exercise?.programSlotId || !Array.isArray(exercise.sets) || exercise.sets.length === 0) return null;
        const rangedSets = exercise.sets as RangedWorkoutSet[];
        if (!rangedSets.every(set => !!set.prescribedRepRange)) return null; // PERFORMANCE uses explicit ranges; KONG does not.

        if (performanceExercise.progressionPolicy === 'pivot') {
            return {
                ready: false,
                label: lang === 'es' ? 'Pivote · mantené la carga y no busques PR' : 'Pivot · hold load and do not chase PRs',
            };
        }
        if (performanceExercise.progressionPolicy === 'hold') {
            return {
                ready: false,
                label: lang === 'es' ? 'Recovery amarillo · mantené la carga hoy' : 'Yellow recovery · hold load today',
            };
        }

        const latest = (historySummary?.latestWorkingSets || [])
            .filter(set => set.completed && !set.skipped && set.type !== 'warmup' && set.type !== 'avt_hop')
            .slice(0, rangedSets.length);
        const maxTarget = Math.max(...rangedSets.map(set => set.prescribedRepRange!.max));
        const targetRpe = rangedSets.find(set => Number.isFinite(Number(set.targetRpe)))?.targetRpe;

        if (latest.length < rangedSets.length) {
            return {
                ready: false,
                label: lang === 'es' ? 'Construí reps · mantené la carga' : 'Build reps · hold the load',
            };
        }

        const hitCeiling = latest.every(set => Number(set.reps || 0) >= maxTarget);
        if (!hitCeiling) {
            return {
                ready: false,
                label: lang === 'es' ? 'Construí reps · mantené la carga' : 'Build reps · hold the load',
            };
        }

        const recordedRpe = latest
            .map(set => Number(set.rpe))
            .filter(value => Number.isFinite(value) && value > 0);
        if (targetRpe !== undefined && recordedRpe.length === latest.length) {
            const maxObservedRpe = Math.max(...recordedRpe);
            if (maxObservedRpe <= targetRpe) {
                return {
                    ready: true,
                    label: lang === 'es' ? 'Techo logrado · subí el mínimo práctico' : 'Rep ceiling earned · add the smallest practical load',
                };
            }
            return {
                ready: false,
                label: lang === 'es' ? 'Techo de reps, esfuerzo alto · mantené carga' : 'Rep ceiling reached, effort high · hold load',
            };
        }

        return {
            ready: true,
            label: lang === 'es'
                ? `Techo de reps · si fue ≤RPE ${targetRpe ?? 'objetivo'}, subí el mínimo`
                : `Rep ceiling · if ≤RPE ${targetRpe ?? 'target'}, add the minimum`,
        };
    }, [exercise?.programSlotId, exercise?.sets, historySummary?.latestWorkingSets, lang, performanceExercise.progressionPolicy]);

    // KONG already prescribes effort via reps + target RPE. Keep historical PR
    // context, but do not surface the generic "+2.5 kg" rule on top of an RPE-
    // based structured program. It can conflict with the method's intended load.
    const compactHistory = useMemo<Log[]>(() => {
        if (!historySummary || exercise?.id == null) return [];

        const summary = historySummary;
        const synthetic: any[] = [];
        let bestSet: WorkoutSet | null = null;

        if (exercise.isIsometric && summary.bestHoldSeconds > 0) {
            bestSet = makeCompletedSet({ duration: summary.bestHoldSeconds });
        } else if (exercise.isBodyweight && summary.bestBodyweightReps > 0) {
            bestSet = makeCompletedSet({
                reps: summary.bestBodyweightReps,
                weight: summary.bestBodyweightWeight,
            });
        } else if (
            summary.bestWeighted1RM > 0 &&
            summary.bestWeightedWeight != null &&
            summary.bestWeightedReps != null
        ) {
            bestSet = makeCompletedSet({
                weight: summary.bestWeightedWeight,
                reps: summary.bestWeightedReps,
            });
        }

        if (bestSet) {
            synthetic.push({
                id: -1,
                dayIdx: -1,
                name: 'history-best',
                startTime: 0,
                endTime: 0,
                duration: 0,
                mesoId: -1,
                week: 0,
                skipped: false,
                exercises: [{ id: exercise.id, sets: [bestSet] }],
            });
        }

        // Generic progressive-overload suggestions are useful for normal plans,
        // but structured Program Systems own their progression rules.
        if (!exercise.programSlotId && summary.latestWorkingSets && summary.latestWorkingSets.length > 0) {
            synthetic.push({
                id: -2,
                dayIdx: -1,
                name: 'history-latest',
                startTime: 1,
                endTime: 1,
                duration: 0,
                mesoId: -1,
                week: 0,
                skipped: false,
                exercises: [{ id: exercise.id, sets: summary.latestWorkingSets }],
            });
        }

        return synthetic as Log[];
    }, [historySummary, exercise.id, exercise.isBodyweight, exercise.isIsometric, exercise.programSlotId]);

    const displayExercise = useMemo(
        () => programTargetSummary ? { ...exercise, targetReps: programTargetSummary } : exercise,
        [exercise, programTargetSummary],
    );

    return (
        <div className={progressionCue ? 'space-y-1.5' : undefined}>
            {progressionCue && (
                <div className={`mx-1 flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-bold ${progressionCue.ready ? 'bg-primary-500/[0.08] text-primary-400' : 'bg-[rgb(var(--surface-raised)/0.65)] text-[rgb(var(--text-muted))]'}`}>
                    <Icon name={progressionCue.ready ? 'TrendingUp' : 'Target'} size={12} />
                    <span className="truncate">{progressionCue.label}</span>
                </div>
            )}
            <SortableExerciseCardImpl {...props} exercise={displayExercise} logs={compactHistory} />
        </div>
    );
});
