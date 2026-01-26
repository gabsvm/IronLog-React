
import React, { useState, useEffect } from 'react';
import { Icon } from '../ui/Icon';
import { formatHoursMinutes } from '../../utils';

export const WorkoutTimer: React.FC<{ startTime: number | null }> = ({ startTime }) => {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if (!startTime) return;
        
        // Initial calc
        setElapsed(Math.floor((Date.now() - startTime) / 1000));

        const interval = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);

        return () => clearInterval(interval);
    }, [startTime]);

    return (
        <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-white/10 px-2 py-1 rounded text-[10px] font-mono font-bold text-zinc-600 dark:text-zinc-300">
            <Icon name="Clock" size={12} />
            {formatHoursMinutes(elapsed)}
        </div>
    );
};
