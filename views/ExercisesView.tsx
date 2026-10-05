import React from 'react';
import { Icon } from '../components/ui/Icon';
import { useExercisesViewState, type ExercisesViewProps } from './exercises/useExercisesViewState';
import { ExercisesListMode } from './exercises/ExercisesListMode';
import { ExercisesEditMode } from './exercises/ExercisesEditMode';
import { ExercisesDialogs } from './exercises/ExercisesDialogs';

// T2: state lives in views/exercises/useExercisesViewState; render blocks in views/exercises/.
export type { ExercisesViewProps } from './exercises/useExercisesViewState';



export const ExercisesView: React.FC<ExercisesViewProps> = (props) => {
    const state = useExercisesViewState(props);
    const { onBack, t, mode } = state;

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-zinc-950">
            {/* Header */}
            <div className="glass px-4 min-h-14 pt-safe shrink-0 flex items-center justify-between z-10 border-b border-zinc-200 dark:border-white/5">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                    aria-label={t.back}
                >
                    <Icon name="ChevronLeft" size={20} />
                    <span className="font-bold text-sm">{t.back}</span>
                </button>
                <h1 className="font-bold text-zinc-900 dark:text-white">{t.manageEx}</h1>
                <div className="w-8"></div>
            </div>

            {mode === 'list' ? (
                <ExercisesListMode state={state} />
            ) : (
                <ExercisesEditMode state={state} />
            )}

            <ExercisesDialogs state={state} />
        </div>
    );
};
