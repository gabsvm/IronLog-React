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
        <div className="flex h-full flex-col bg-[rgb(var(--surface-app))] text-[rgb(var(--text-primary))]">
            {/* Header */}
            <div className="z-10 flex min-h-14 shrink-0 items-center justify-between border-b border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-base)/0.96)] px-4 pt-safe backdrop-blur-md">
                <button
                    onClick={onBack}
                    className="flex min-h-11 items-center gap-2 rounded-full text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]"
                    aria-label={t.back}
                >
                    <Icon name="ChevronLeft" size={20} />
                    <span className="font-bold text-sm">{t.back}</span>
                </button>
                <h1 className="text-lg font-black tracking-tight text-[rgb(var(--text-primary))]">{t.manageEx}</h1>
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
