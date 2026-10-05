// S6: moved verbatim from views/WorkoutViewImpl.tsx.
import React from 'react';
import { TRANSLATIONS } from '../../constants';
import { Icon } from '../../components/ui/Icon';
import { useTimerState } from '../../context/TimerContext';
import { formatSeconds } from '../../utils';

export const RestTimerControl: React.FC<{
    preset: number;
    onStart: (duration: number) => void;
    onStop: () => void;
    onCyclePreset: () => void;
    lang: 'en' | 'es';
}> = React.memo(({ preset, onStart, onStop, onCyclePreset, lang }) => {
    const restTimer = useTimerState();
    const t = TRANSLATIONS[lang];
    const w = t.workoutImpl;

    return (
        <>
            <button
                type="button"
                onClick={(event) => {
                    event.stopPropagation();
                    if (restTimer.active) onStop();
                    else onStart(preset);
                }}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold tabular-nums transition-colors ${
                    restTimer.active ? 'bg-primary-500/20 text-primary-300' : 'bg-zinc-900 text-zinc-400'
                }`}
                title={restTimer.active
                    ? t.stopRest
                    : `${t.startRest} (${preset}s)`}
            >
                <Icon name="Timer" size={11} />
                {restTimer.active ? formatSeconds(restTimer.timeLeft) : `${preset}s`}
            </button>
            {!restTimer.active && (
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        onCyclePreset();
                    }}
                    className="inline-flex items-center gap-1 rounded-full bg-zinc-900 px-2 py-1 text-[11px] font-semibold text-zinc-400 transition-colors hover:text-white"
                    title={w.changeRestPreset}
                >
                    <Icon name="RotateCcw" size={11} />
                </button>
            )}
        </>
    );
});
