import React from 'react';

interface Props {
    program: any[];
    logsForWeek: any[];
}

/**
 * Slim bar-row showing which days of the active mesocycle week are done.
 * Each cell fills with a gradient when a log for that dayIdx exists this week.
 */
export const WeekProgress: React.FC<Props> = React.memo(({ program, logsForWeek }) => {
    const safeProgram = Array.isArray(program) ? program : [];
    const uniqueDaysDone = new Set(logsForWeek.map((l: any) => l.dayIdx));

    return (
        <div className="flex gap-1.5 w-full mb-6" role="progressbar" aria-label="Week progress">
            {safeProgram.map((_, i) => {
                const isDone = uniqueDaysDone.has(i);
                return (
                    <div
                        key={i}
                        className={`h-1.5 rounded-full flex-1 transition-all duration-slow origin-left ${
                            isDone
                                ? 'bg-gradient-to-r from-primary-600 to-orange-500 shadow-[0_0_8px_rgba(220,38,38,0.4)]'
                                : 'bg-zinc-800'
                        }`}
                        style={{ transitionDelay: `${i * 80}ms` }}
                    />
                );
            })}
        </div>
    );
});
WeekProgress.displayName = 'WeekProgress';
