// U5: state in exerciseCard/useSortableExerciseCardState; views in exerciseCard/.
import React from 'react';
import { useSortableExerciseCardState, type SortableExerciseCardProps } from './exerciseCard/useSortableExerciseCardState';
import { ExerciseCardCollapsed } from './exerciseCard/ExerciseCardCollapsed';
import { ExerciseCardExpanded } from './exerciseCard/ExerciseCardExpanded';
export type { SortableExerciseCardProps } from './exerciseCard/useSortableExerciseCardState';


export const SortableExerciseCard = React.memo((props: SortableExerciseCardProps) => {
    const state = useSortableExerciseCardState(props);
    if (!state.isExpanded) return <ExerciseCardCollapsed state={state} />;
    return <ExerciseCardExpanded state={state} />;
});
