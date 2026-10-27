// Strong parity fullscreen rest (simple timers): a large countdown with
// -increment / +increment and SKIP. Shown instead of the in-flow dock when
// the simple-timers (or auto-fullscreen) preference is on.
import React from 'react';
import { useAppConfig, useAppPreferences } from '../../context/AppContext';
import { useTimerActions, useTimerState } from '../../context/TimerContext';
import { TRANSLATIONS } from '../../constants';
import { triggerHaptic, cancelNativeRestTimer } from '../../utils/audio';
import { formatRestSeconds } from '../../utils/strongTraining';
import { Icon } from '../ui/Icon';

export const SimpleRestFullscreen: React.FC = () => {
    const restTimer = useTimerState();
    const { setRestTimer } = useTimerActions();
    const { lang } = useAppPreferences();
    const { config } = useAppConfig();
    const t = TRANSLATIONS[lang];
    const step = Math.max(5, Math.min(120, Math.round(Number(config?.restIncrementSeconds) || 30)));

    if (!restTimer?.active) return null;
    if (!config?.simpleTimers && !config?.autoFullscreen) return null;

    const adjust = (delta: number) => {
        triggerHaptic('light');
        setRestTimer((prev) => {
            if (!prev.active) return prev;
            const next = Math.max(0, prev.timeLeft + delta);
            if (next <= 0) return { ...prev, active: false, timeLeft: 0, endAt: 0, source: undefined };
            return { ...prev, endAt: (prev.endAt || Date.now()) + delta * 1000, timeLeft: next };
        });
    };
    const skip = () => {
        triggerHaptic('medium');
        setRestTimer((prev) => ({ ...prev, active: false, timeLeft: 0, endAt: 0, source: undefined }));
        void cancelNativeRestTimer();
    };

    return (
        <div className="fixed inset-0 z-sheet flex flex-col items-center justify-center gap-4 bg-[rgb(var(--surface-app))]" role="dialog" aria-modal="true" aria-label={t.timer.resting} data-testid="simple-rest-fullscreen">
            <p className="text-sm font-semibold text-muted">{t.timer.resting}</p>
            <p className="tabular-nums text-6xl font-black text-[rgb(var(--text-primary))]">
                {formatRestSeconds(restTimer.timeLeft)}
            </p>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => adjust(-step)}
                    className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[rgb(var(--border-subtle))] px-4 text-sm font-bold text-[rgb(var(--text-primary))]"
                    aria-label={`-${step}s`}
                >
                    -{step}s
                </button>
                <button
                    type="button"
                    onClick={() => adjust(step)}
                    className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[rgb(var(--border-subtle))] px-4 text-sm font-bold text-[rgb(var(--text-primary))]"
                    aria-label={`+${step}s`}
                >
                    +{step}s
                </button>
                <button
                    type="button"
                    onClick={skip}
                    className="flex min-h-[44px] items-center justify-center rounded-full bg-primary-500 px-6 text-sm font-bold text-zinc-950"
                    aria-label={t.timer.skipRest}
                >
                    {t.timer.skipRest}
                </button>
            </div>
        </div>
    );
};
