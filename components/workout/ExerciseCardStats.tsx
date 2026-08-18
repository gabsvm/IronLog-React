import React from 'react';

interface Props {
    completedCount: number;
    totalSets: number;
}

export const ExerciseCardStats: React.FC<Props> = ({ completedCount, totalSets }) => {
    if (totalSets <= 0) return null;
    const allDone = completedCount === totalSets;

    return (
        <div
            className={`inline-flex min-h-6 items-center rounded-full px-2 text-[9px] font-black tabular-nums ${allDone ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[rgb(var(--surface-base))] text-[rgb(var(--text-muted))]'}`}
            aria-label={`${completedCount} of ${totalSets} sets completed`}
        >
            {completedCount}/{totalSets} {allDone ? '✓' : ''}
        </div>
    );
};
