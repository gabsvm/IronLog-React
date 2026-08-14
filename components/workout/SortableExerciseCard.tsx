import React, { useMemo } from 'react';
import type { Log, WorkoutSet } from '../../types';
import { getExerciseHistorySummary } from '../../utils/exerciseHistoryIndex';
import { SortableExerciseCard as SortableExerciseCardImpl } from './SortableExerciseCardImpl';

type SortableExerciseCardProps = React.ComponentProps<typeof SortableExerciseCardImpl>;

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
    const { logs, exercise } = props;

    const programTargetSummary = useMemo(() => {
        if (!exercise?.programSlotId || !Array.isArray(exercise.sets) || exercise.sets.length === 0) return null;
        const prescribed = exercise.sets.map(set => set.prescribedReps);
        if (prescribed.some(value => value == null)) return null;
        const labels = prescribed.map(value => value === 'FAILURE' ? 'F' : String(value));
        return labels.every(label => label === labels[0])
            ? `${labels.length}×${labels[0]}`
            : labels.join('·');
    }, [exercise?.programSlotId, exercise?.sets]);

    // KONG already prescribes effort via reps + target RPE. Keep historical PR
    // context, but do not surface the generic "+2.5 kg" rule on top of an RPE-
    // based structured program. It can conflict with the method's intended load.
    const compactHistory = useMemo<Log[]>(() => {
        if (!Array.isArray(logs) || logs.length === 0 || exercise?.id == null) return [];

        const summary = getExerciseHistorySummary(logs, String(exercise.id));
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
    }, [logs, exercise.id, exercise.isBodyweight, exercise.isIsometric, exercise.programSlotId]);

    const displayExercise = useMemo(
        () => programTargetSummary ? { ...exercise, targetReps: programTargetSummary } : exercise,
        [exercise, programTargetSummary],
    );

    return <SortableExerciseCardImpl {...props} exercise={displayExercise} logs={compactHistory} />;
});
