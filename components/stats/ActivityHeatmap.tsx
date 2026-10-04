import React, { useMemo } from 'react';
import { Log } from '../../types';
import { useAppPreferences } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants';

import { formatLocalDateKey, addLocalDays, todayLocalDateKey } from '../../utils/localDate';

interface ActivityHeatmapProps {
    logs: Log[];
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ logs }) => {
    const { lang } = useAppPreferences();
    const t = TRANSLATIONS[lang].heatmap;

    const data = useMemo(() => {
        const todayKey = todayLocalDateKey();
        const map: Record<string, number> = {};
        logs.forEach(log => {
            if (log.skipped) return;
            const timestamp = log.endTime || log.startTime;
            if (!timestamp) return;
            const date = formatLocalDateKey(new Date(timestamp));
            const volume = (log.exercises || []).reduce((acc, ex) => acc + (ex.sets?.filter(s => s.completed && !s.skipped).length || 0), 0);
            map[date] = (map[date] || 0) + volume;
        });

        const days = [];
        for (let i = 111; i >= 0; i--) {
            const dateStr = addLocalDays(todayKey, -i);
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
                    <div
                        key={day.date}
                        title={`${day.date}: ${day.value} ${t.setsLower}`}
                        className={`h-2.5 w-2.5 rounded-sm transition-colors duration-300 sm:h-3 sm:w-3 ${getLevelColor(day.value)}`}
                    />
                ))}
            </div>
            <div className="mt-2 flex items-center justify-between px-1 text-[9px] font-bold uppercase tracking-widest text-zinc-400">
                <span>4M</span>
                <div className="flex items-center gap-1">
                    <span>{t.less}</span>
                    <div className="h-2 w-2 rounded-sm bg-zinc-200 dark:bg-zinc-800" />
                    <div className="h-2 w-2 rounded-sm bg-primary-500/35" />
                    <div className="h-2 w-2 rounded-sm bg-primary-500" />
                    <span>{t.more}</span>
                </div>
            </div>
        </div>
    );
};
