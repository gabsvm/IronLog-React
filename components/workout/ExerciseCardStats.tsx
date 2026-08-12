import React from 'react';
import { Icon } from '../ui/Icon';
import { SparkLine } from './SparkLine';

interface Props {
    lang: 'en' | 'es';
    isIsometric?: boolean;
    historicalBest: string | null;
    oneRMHistory: number[];
    overloadSuggest: { kg: number } | null;
    allDone: boolean;
    lastNote: string | null;
    completedCount: number;
    totalSets: number;
}

/** Pure presentational strip under an exercise header. */
export const ExerciseCardStats: React.FC<Props> = React.memo(({
    lang,
    isIsometric,
    historicalBest,
    oneRMHistory,
    overloadSuggest,
    allDone,
    lastNote,
    completedCount,
    totalSets,
}) => (
    <>
        {historicalBest && (
            <div className="flex items-center gap-2 mb-1.5 px-1 mt-1">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <Icon name="Trophy" size={11} className="text-yellow-500 shrink-0" />
                    <p className="text-[10px] font-bold text-yellow-500/90 leading-snug truncate">
                        {lang === 'en' ? 'Best:' : 'Mejor:'}{' '}
                        {isIsometric ? '⏱ ' : ''}
                        {historicalBest}
                    </p>
                </div>
                {oneRMHistory.length >= 3 && <SparkLine values={oneRMHistory} />}
            </div>
        )}

        {overloadSuggest && !allDone && (
            <div className="flex items-center gap-1.5 mb-1.5 px-1">
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">
                    <Icon name="TrendingUp" size={10} className="shrink-0" />
                    <span className="text-[9px] font-black uppercase tracking-wide">
                        {lang === 'es'
                            ? `↑ +${overloadSuggest.kg}kg sugerido`
                            : `↑ +${overloadSuggest.kg}kg suggested`}
                    </span>
                </div>
            </div>
        )}

        {lastNote && (
            <div className="flex items-start gap-1.5 mb-1.5 px-1">
                <Icon name="FileText" size={11} className="mt-0.5 text-zinc-600 shrink-0" />
                <p className="text-[10px] text-zinc-600 italic leading-snug line-clamp-1">{lastNote}</p>
            </div>
        )}

        {totalSets > 0 && (
            <div className="flex items-center gap-2 px-1 -mb-0.5" aria-label={`${completedCount} of ${totalSets} sets completed`}>
                <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-slow ease-natural ${allDone ? 'bg-green-500' : 'bg-red-500/70'}`}
                        style={{ width: `${(completedCount / totalSets) * 100}%` }}
                    />
                </div>
                <span className={`text-[9px] font-black tabular-nums tracking-tight ${allDone ? 'text-green-500' : 'text-zinc-600'}`}>
                    {completedCount}/{totalSets}
                </span>
            </div>
        )}
    </>
));

ExerciseCardStats.displayName = 'ExerciseCardStats';
