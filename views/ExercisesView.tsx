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
        <div className="flex h-full flex-col bg-surface-app text-[rgb(var(--text-primary))]">
            {/* Header */}
            <div className="z-10 flex min-h-14 shrink-0 items-center justify-between border-b border-border-subtle bg-surface-base/95 px-4 pt-safe backdrop-blur-md">
                <button
                    onClick={onBack}
                    className="flex min-h-9 items-center gap-1.5 rounded-[6px] px-2.5 py-1 text-zinc-400 hover:text-white hover:bg-surface-raised transition-colors"
                    aria-label={t.back}
                >
                    <Icon name="ChevronLeft" size={18} />
                    <span className="font-bold text-xs uppercase tracking-wider">{t.back}</span>
                </button>
                <h1 className="text-[20px] sm:text-[22px] font-black uppercase tracking-tight text-white">{t.manageEx}</h1>
                <div className="w-16"></div>
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
