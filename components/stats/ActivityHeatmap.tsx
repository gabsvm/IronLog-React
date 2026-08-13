import React, { useMemo } from 'react';
import { Log } from '../../types';

interface ActivityHeatmapProps {
    logs: Log[];
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ logs }) => {
    const data = useMemo(() => {
        const today = new Date();
        const map: Record<string, number> = {};
        logs.forEach(log => {
            if (log.skipped) return;
            const date = new Date(log.endTime).toISOString().split('T')[0];
            const volume = (log.exercises || []).reduce((acc, ex) => acc + (ex.sets?.filter(s => s.completed).length || 0), 0);
            map[date] = (map[date] || 0) + volume;
        });

        const days = [];
        for (let i = 111; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            days.push({ date: dateStr, value: map[dateStr] || 0 });
        }
        return days;
    }, [logs]);

    const getLevelColor = (val: number) => {
        if (val === 0) return 'bg-zinc-200/80 dark:bg-zinc-800/70';
        if (val <= 5) return 'bg-primary-500/20';
        if (val <= 10) return 'bg-primary-500/45';
        if (val <= 15) return 'bg-primary-500/70';
        return 'bg-primary-500';
    };

    return (
        <div className="w-full overflow-hidden">
            <div className="flex flex-wrap justify-center gap-1 sm:justify-start">
                {data.map(day => (
                    <div key={day.date} title={`${day.date}: ${day.value} sets`} className={`h-2.5 w-2.5 rounded-sm transition-colors duration-300 sm:h-3 sm:w-3 ${getLevelColor(day.value)}`} />
                ))}
            </div>
            <div className="mt-2 flex items-center justify-between px-1 text-[9px] font-bold uppercase tracking-widest text-zinc-400">
                <span>4M</span>
                <div className="flex items-center gap-1">
                    <span>Less</span>
                    <div className="h-2 w-2 rounded-sm bg-zinc-200 dark:bg-zinc-800" />
                    <div className="h-2 w-2 rounded-sm bg-primary-500/35" />
                    <div className="h-2 w-2 rounded-sm bg-primary-500" />
                    <span>More</span>
                </div>
            </div>
        </div>
    );
};
