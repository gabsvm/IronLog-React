import React, { useState, useEffect } from 'react';
import { Icon } from '../ui/Icon';
import { formatHoursMinutes } from '../../utils';

/**
 * The header only displays H:MM, so a 1 Hz interval was causing 60 needless
 * renders for every visible minute. Schedule directly to the next minute edge
 * and recalculate on resume instead.
 */
export const WorkoutTimer: React.FC<{ startTime: number | null }> = React.memo(({ startTime }) => {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if (!startTime) {
            setElapsed(0);
            return;
        }

        let timeout: ReturnType<typeof setTimeout> | null = null;

        const updateAndSchedule = () => {
            const elapsedMs = Math.max(0, Date.now() - startTime);
            setElapsed(Math.floor(elapsedMs / 1000));

            // Add a tiny guard so timer clamping cannot fire just before the minute
            // rolls over and leave the old value visible for another minute.
            const msIntoMinute = elapsedMs % 60_000;
            timeout = setTimeout(updateAndSchedule, (60_000 - msIntoMinute) + 25);
        };

        const onVisibility = () => {
            if (document.visibilityState !== 'visible') return;
            if (timeout) clearTimeout(timeout);
            updateAndSchedule();
        };

        updateAndSchedule();
        document.addEventListener('visibilitychange', onVisibility);

        return () => {
            if (timeout) clearTimeout(timeout);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, [startTime]);

    return (
        <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-white/10 px-2 py-1 rounded text-[10px] font-mono font-bold text-zinc-600 dark:text-zinc-300">
            <Icon name="Clock" size={12} />
            {formatHoursMinutes(elapsed)}
        </div>
    );
});

WorkoutTimer.displayName = 'WorkoutTimer';
