// U5: state in exerciseCard/useSortableExerciseCardState; views in exerciseCard/.
import React, { useState, useCallback } from 'react';
import { useSortableExerciseCardState, type SortableExerciseCardProps } from './exerciseCard/useSortableExerciseCardState';
import { ExerciseCardCollapsed } from './exerciseCard/ExerciseCardCollapsed';
import { ExerciseCardExpanded } from './exerciseCard/ExerciseCardExpanded';
export type { SortableExerciseCardProps } from './exerciseCard/useSortableExerciseCardState';

export const SortableExerciseCard = React.memo((props: SortableExerciseCardProps) => {
    // In 1:1 RP, all exercise cards are expanded by default to display the full workout structure.
    const [isCollapsed, setIsCollapsed] = useState(false);
    const handleToggleExpand = useCallback(() => {
        setIsCollapsed(prev => !prev);
    }, []);

    const state = useSortableExerciseCardState({
        ...props,
        isExpanded: !isCollapsed,
        onToggleExpand: handleToggleExpand,
    });
    if (isCollapsed) return <ExerciseCardCollapsed state={state} />;
    return <ExerciseCardExpanded state={state} />;
});
