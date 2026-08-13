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
 * one cached history index and feed it at most two synthetic log entries:
 *   1. the all-time best set needed by the PR badge
 *   2. the latest working sets needed by progressive-overload logic
 *
 * Visual behavior and the implementation itself stay unchanged, while every
 * card stops rescanning the complete workout history on render.
 */
export const SortableExerciseCard = React.memo((props: SortableExerciseCardProps) => {
    const { logs, exercise } = props;

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

        // Keep the latest-working-set entry LAST. The unchanged implementation
        // searches from logs.length - 1 backwards for its overload suggestion.
        if (summary.latestWorkingSets && summary.latestWorkingSets.length > 0) {
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
    }, [logs, exercise.id, exercise.isBodyweight, exercise.isIsometric]);

    return <SortableExerciseCardImpl {...props} logs={compactHistory} />;
});
