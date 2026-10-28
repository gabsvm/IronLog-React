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
    const { t, ev, mode, setMode } = state;

    return (
        <div className="flex flex-col bg-surface-app text-[rgb(var(--text-primary))]">
            {/* Header */}
            <div className="z-10 flex min-h-14 shrink-0 items-center justify-between border-b border-border-subtle bg-surface-base/95 px-4 backdrop-blur-md">
                {mode === 'create' ? (
                    <>
                        <button
                            type="button"
                            onClick={() => setMode('list')}
                            className="flex min-h-9 items-center gap-1.5 rounded-[6px] px-2.5 py-1 text-zinc-400 hover:text-white hover:bg-surface-raised transition-colors"
                            aria-label={t.back}
                        >
                            <Icon name="ChevronLeft" size={18} />
                            <span className="font-bold text-xs uppercase tracking-wider">{t.back}</span>
                        </button>
                        <h1 className="text-[18px] sm:text-[20px] font-black uppercase tracking-tight text-white">{ev.createEx}</h1>
                        <div className="w-16" />
                    </>
                ) : (
                    <>
                        <h1 className="text-[22px] font-black uppercase tracking-tight text-white truncate">{t.nav?.exercises || t.manageEx}</h1>
                        <button
                            type="button"
                            onClick={() => setMode('create')}
                            className="inline-flex min-h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[6px] bg-primary-500 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider text-zinc-950 shadow-sm transition-all hover:brightness-110 active:scale-95"
                            aria-label={ev.createEx}
                        >
                            <Icon name="Plus" size={15} strokeWidth={2.5} />
                            <span>{ev.createEx}</span>
                        </button>
                    </>
                )}
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
