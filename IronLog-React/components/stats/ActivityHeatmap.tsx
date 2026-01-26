
import React, { useMemo } from 'react';
import { Log } from '../../types';
import { useApp } from '../../context/AppContext';

interface ActivityHeatmapProps {
    logs: Log[];
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ logs }) => {
    const { theme } = useApp();
    
    const data = useMemo(() => {
        const today = new Date();
        const map: Record<string, number> = {}; // 'YYYY-MM-DD' -> volume/intensity score
        
        logs.forEach(log => {
            if (log.skipped) return;
            const date = new Date(log.endTime).toISOString().split('T')[0];
            const volume = (log.exercises || []).reduce((acc, ex) => acc + (ex.sets?.filter(s => s.completed).length || 0), 0);
            map[date] = (map[date] || 0) + volume;
        });

        // Generate last 112 days (16 weeks) grid roughly
        const days = [];
        for (let i = 111; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            days.push({
                date: dateStr,
                value: map[dateStr] || 0,
                dayOfWeek: d.getDay()
            });
        }
        return days;
    }, [logs]);

    const getLevelColor = (val: number) => {
        if (val === 0) return 'bg-zinc-100 dark:bg-zinc-800/50';
        if (val <= 5) return 'bg-red-200 dark:bg-red-900/30';
        if (val <= 10) return 'bg-red-400 dark:bg-red-700/50';
        if (val <= 15) return 'bg-red-500 dark:bg-red-600';
        return 'bg-red-600 dark:bg-red-500';
    };

    return (
        <div className="w-full overflow-hidden">
            <div className="flex flex-wrap gap-1 justify-center sm:justify-start">
                {data.map((day, i) => (
                    <div 
                        key={day.date}
                        title={`${day.date}: ${day.value} sets`}
                        className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm ${getLevelColor(day.value)} transition-colors duration-500`}
                    />
                ))}
            </div>
            <div className="flex justify-between items-center mt-2 text-[9px] font-bold text-zinc-400 uppercase tracking-widest px-1">
                <span>Last 4 Months</span>
                <div className="flex items-center gap-1">
                    <span>Less</span>
                    <div className="w-2 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-sm"></div>
                    <div className="w-2 h-2 bg-red-400 dark:bg-red-900/50 rounded-sm"></div>
                    <div className="w-2 h-2 bg-red-600 dark:bg-red-500 rounded-sm"></div>
                    <span>More</span>
                </div>
            </div>
        </div>
    );
};
