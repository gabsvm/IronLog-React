
import React, { useEffect, useState } from 'react';
import { Icon } from '../ui/Icon';

const formatWorkoutElapsed = (seconds: number) => {
    const safe = Math.max(0, Math.floor(Number(seconds) || 0));
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const secs = safe % 60;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

export const WorkoutTimer: React.FC<{ startTime: number | null }> = ({ startTime }) => {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (!startTime) {
            setNow(Date.now());
            return;
        }

        setNow(Date.now());

        const interval = setInterval(() => {
            setNow(Date.now());
        }, 1000);

        return () => clearInterval(interval);
    }, [startTime]);

    const elapsed = startTime ? Math.floor((now - startTime) / 1000) : 0;

    return (
        <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-white/10 px-2 py-1 rounded text-[10px] font-mono font-bold text-zinc-600 dark:text-zinc-300">
            <Icon name="Clock" size={12} />
            {formatWorkoutElapsed(elapsed)}
        </div>
    );
};
