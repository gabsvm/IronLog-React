import React from 'react';

interface Props {
    completedCount: number;
    totalSets: number;
}

export const ExerciseCardStats: React.FC<Props> = ({
    completedCount,
    totalSets,
}) => {
    if (totalSets <= 0) return null;

    const allDone = completedCount === totalSets;

    return (
        <div className="flex items-center gap-2 px-0.5" aria-label={`${completedCount} of ${totalSets} sets completed`}>
            <div className="flex-1 h-0.5 overflow-hidden rounded-full bg-zinc-800">
                <div
                    className={`h-full rounded-full transition-all duration-slow ease-natural ${allDone ? 'bg-green-500' : 'bg-primary-500/80'}`}
                    style={{ width: `${(completedCount / totalSets) * 100}%` }}
                />
            </div>
            <span className={`text-[9px] font-black tabular-nums tracking-tight ${allDone ? 'text-green-500' : 'text-zinc-500'}`}>
                {completedCount}/{totalSets}
            </span>
        </div>
    );
};
