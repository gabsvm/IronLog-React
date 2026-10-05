// U5: set-type labels and the isometric hold timer, moved verbatim from components/workout/SetRow.tsx.
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SetType } from '../../../types';
import { Icon } from '../../ui/Icon';
import { playTimerFinishSound, triggerHaptic } from '../../../utils/audio';
import { TRANSLATIONS } from '../../../constants/translations';

export const getTypeLabel = (type: SetType) => {
    const map: Record<string, string> = {
        regular: '•',
        warmup: 'W',
        myorep: 'M',
        myorep_match: 'MM',
        giant: 'G',
        top: 'T',
        backoff: 'B',
        cluster: 'C',
        avt_hop: 'H',
        emom: 'E',
        drop: 'D',
        rest_pause: 'RP',
        time_volume: 'TV',
        triple_add: 'TA',
    };
    return map[type] || '•';
};

// Hold timer
export const HoldTimer: React.FC<{
    initialSeconds: number;
    targetSeconds?: number;   // If set -> countdown mode
    onSave: (seconds: number) => void;
    lang: 'en' | 'es';
    isDone: boolean;
}> = ({ initialSeconds, targetSeconds, onSave, lang, isDone }) => {
    const t = TRANSLATIONS[lang];
    const [elapsed, setElapsed] = useState(initialSeconds);
    const [running, setRunning] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const baseElapsedRef = useRef(initialSeconds);
    const hasTriggeredZeroAlertRef = useRef(false);

    const start = useCallback(() => {
        if (running) return;
        hasTriggeredZeroAlertRef.current = false;
        triggerHaptic('medium');
        setRunning(true);
        startTimeRef.current = Date.now();
        intervalRef.current = setInterval(() => {
            const now = Date.now();
            const delta = Math.floor((now - startTimeRef.current!) / 1000);
            setElapsed(baseElapsedRef.current + delta);
        }, 1000);
    }, [running]);

    const stop = useCallback(() => {
        if (!running) return;
        triggerHaptic('medium');
        if (intervalRef.current) clearInterval(intervalRef.current);
        setRunning(false);
        const finalElapsed = elapsed;
        baseElapsedRef.current = finalElapsed;
        onSave(finalElapsed);
    }, [running, elapsed, onSave]);

    const reset = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        hasTriggeredZeroAlertRef.current = false;
        setRunning(false);
        setElapsed(0);
        baseElapsedRef.current = 0;
        onSave(0);
    }, [onSave]);

    useEffect(() => {
        if (targetSeconds && running && elapsed >= targetSeconds && !hasTriggeredZeroAlertRef.current) {
            hasTriggeredZeroAlertRef.current = true;
            triggerHaptic('success');
            playTimerFinishSound();
        }
    }, [elapsed, running, targetSeconds]);

    useEffect(() => {
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, []);

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return m > 0 ? `${m}:${sec.toString().padStart(2, '0')}` : `${sec}s`;
    };

    // Countdown display: timeRemaining counts down from target
    const timeRemaining = targetSeconds ? Math.max(0, targetSeconds - elapsed) : null;
    const countdownPct = targetSeconds ? Math.min(100, (elapsed / targetSeconds) * 100) : 0;
    const countdownUrgent = timeRemaining !== null && timeRemaining <= 5 && running;

    if (isDone) {
        return (
            <div className="flex items-center justify-center gap-1 text-green-400">
                <Icon name="Timer" size={13} />
                <span className="text-sm font-black tabular-nums">{formatTime(elapsed)}</span>
                {targetSeconds && <span className="text-[11px] text-green-500 font-semibold">/ {formatTime(targetSeconds)}</span>}
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1.5 w-full">
            {/* Time Display */}
            <div className={`min-w-[52px] text-center text-xl font-black tabular-nums transition-colors ${
                countdownUrgent ? 'text-orange-400 animate-pulse'
                : running ? 'text-violet-400 animate-pulse'
                : elapsed > 0 ? 'text-white' : 'text-zinc-600'
            }`}>
                {timeRemaining !== null ? formatTime(timeRemaining) : formatTime(elapsed)}
            </div>
            {/* Countdown progress bar */}
            {targetSeconds && (
                <div className="flex-1 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-200 ${countdownUrgent ? 'bg-orange-400' : 'bg-violet-500'}`}
                        style={{ width: `${countdownPct}%` }} />
                </div>
            )}

            {/* Controls */}
            <div className="flex gap-1">
                {!running ? (
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); start(); }}
                        className="min-w-[44px] min-h-[44px] rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center active:scale-90 transition-transform border border-violet-500/30"
                        aria-label={t.startTimer}
                    >
                        <Icon name="Play" size={15} fill="currentColor" />
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); stop(); }}
                        className="min-w-[44px] min-h-[44px] rounded-xl bg-violet-500 text-white flex items-center justify-center active:scale-90 transition-transform animate-pulse-slow"
                        aria-label={t.stopTimer}
                    >
                        <Icon name="Square" size={14} fill="currentColor" />
                    </button>
                )}
                {elapsed > 0 && !running && (
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); reset(); }}
                        className="relative w-7 h-9 after:absolute after:-inset-x-2 after:-inset-y-1 after:content-[''] flex items-center justify-center text-zinc-600 hover:text-zinc-400 active:scale-90 transition-all"
                        aria-label={t.resetTimer}
                    >
                        <Icon name="RotateCcw" size={13} />
                    </button>
                )}
            </div>
        </div>
    );
};
