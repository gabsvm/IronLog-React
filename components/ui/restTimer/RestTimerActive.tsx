// U5: active rest timer (compact pill and expanded view), moved verbatim from components/ui/RestTimerOverlay.tsx.
import React from 'react';
import { Icon } from '../Icon';
import { triggerHaptic } from '../../../utils/audio';
import { calculateTimerPercentage } from './restTimerLogic';
import { CircularTimer } from './CircularTimer';
import type { RestTimerOverlayState } from './useRestTimerOverlayState';
import { RestTimerNotifPrompt } from './RestTimerPrompts';

export const RestTimerActive: React.FC<{ state: RestTimerOverlayState }> = ({ state }) => {
    const { restTimer, setRestTimer, lang, reducedEffects, t, mode, setMode, keyboardOffset, pillRef, currentSourceSet, showEffortFeedback, handleRateEffort, nextExerciseInfo } = state;
    // Same guard as the parent (it only renders this with an active rest).
    if (!restTimer || !restTimer.active) return null;

    const formatSeconds = (seconds: number) => {
        const safe = Math.max(0, Math.floor(Number(seconds) || 0));
        return `${Math.floor(safe / 60)}:${(safe % 60).toString().padStart(2, '0')}`;
    };

    const percentage = calculateTimerPercentage(restTimer.timeLeft, restTimer.duration);
    const floatingBottom = 80 + keyboardOffset;
    // When the keyboard is open the pill would cover the input being edited,
    // so dock it below the workout header instead of above the keyboard.
    const keyboardOpen = keyboardOffset > 120;
    const pillPositionStyle: React.CSSProperties = keyboardOpen
        ? { top: 'calc(var(--safe-area-top) + 64px)', bottom: 'auto' }
        : { bottom: `calc(var(--safe-area-bottom) + ${floatingBottom}px)` };
    const showCompactExtras = showEffortFeedback && (Boolean(currentSourceSet) || Boolean(nextExerciseInfo));

    const adjustTimer = (deltaSeconds: number) => {
        triggerHaptic('light');
        setRestTimer((prev) => {
            if (!prev.active) return prev;
            const nextTime = Math.max(0, prev.timeLeft + deltaSeconds);
            return {
                ...prev,
                endAt: (prev.endAt || Date.now()) + deltaSeconds * 1000,
                timeLeft: nextTime,
                duration: deltaSeconds > 0 ? prev.duration + deltaSeconds : prev.duration,
            };
        });
    };

    const skipTimer = () => {
        triggerHaptic('medium');
        setRestTimer((prev) => ({ ...prev, active: false, timeLeft: 0, endAt: 0, source: undefined }));
    };

    const setQuickTimer = (seconds: number) => {
        triggerHaptic('light');
        setRestTimer((prev) => ({
            ...prev,
            active: true,
            duration: seconds,
            timeLeft: seconds,
            endAt: Date.now() + seconds * 1000,
        }));
    };

    if (mode === 'compact') {
        return (
            <>
            <aside
                ref={pillRef}
                className="fixed inset-x-0 mx-auto max-w-md px-3 z-sheet pointer-events-none transition-all duration-base ease-natural"
                style={pillPositionStyle}
                aria-label={t.resting}
            >
                <div className={`pointer-events-auto border border-border-strong bg-surface-raised/95 px-3 py-1.5 shadow-xl backdrop-blur-md ${showCompactExtras ? 'rounded-3xl' : 'rounded-full'}`}>
                    <div className="flex items-center justify-between gap-2">
                        {/* Time display & tap to expand */}
                        <button
                            type="button"
                            onClick={() => {
                                triggerHaptic('light');
                                setMode('expanded');
                            }}
                            className="flex items-center gap-2 pr-1 min-w-0 transition-opacity hover:opacity-85 active:scale-95 text-left"
                            aria-label={`${t.resting}: ${formatSeconds(restTimer.timeLeft)}. ${t.timer.tapToExpand}`}
                        >
                            <span className="relative flex h-2 w-2 shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500" />
                            </span>
                            <span className="font-mono text-sm font-black text-white tabular-nums tracking-tight">
                                {formatSeconds(restTimer.timeLeft)}
                            </span>
                            <Icon name="ChevronUp" size={14} className="text-muted shrink-0" />
                        </button>

                        {/* Quick controls: -10s, +30s, skip (real 44px targets) */}
                        <div className="flex items-center gap-1 shrink-0">
                            <button
                                type="button"
                                onClick={() => adjustTimer(-10)}
                                className="flex min-h-[44px] min-w-[44px] px-3 items-center justify-center rounded-full bg-surface-elevated border border-border-subtle text-[11px] font-bold text-zinc-200 hover:text-white active:scale-90 transition-all"
                                aria-label="-10s"
                            >
                                -10s
                            </button>
                            <button
                                type="button"
                                onClick={() => adjustTimer(30)}
                                className="flex min-h-[44px] min-w-[44px] px-3 items-center justify-center rounded-full bg-surface-elevated border border-border-subtle text-[11px] font-bold text-zinc-200 hover:text-white active:scale-90 transition-all"
                                aria-label="+30s"
                            >
                                +30s
                            </button>
                            <button
                                type="button"
                                onClick={skipTimer}
                                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-surface-elevated border border-border-subtle text-muted hover:text-white active:scale-90 transition-all"
                                aria-label={t.timer.skipRest}
                                title={t.timer.skipRest}
                            >
                                <Icon name="FastForward" size={16} />
                            </button>
                        </div>
                    </div>
                    {showCompactExtras && (
                        <div className="mt-1 border-t border-border-subtle/60 pt-1.5">
                            {nextExerciseInfo && (
                                <div className="flex items-center gap-1.5 px-1 pb-1.5 text-left">
                                    <Icon name="ArrowRight" size={13} className="text-primary-400 shrink-0" />
                                    <p className="min-w-0 flex-1 truncate text-[11px] text-white">
                                        <span className="font-bold uppercase tracking-wider text-muted">{nextExerciseInfo.category} · </span>
                                        <span className="font-semibold">{nextExerciseInfo.name}{nextExerciseInfo.target ? ` · ${nextExerciseInfo.target}` : ''}</span>
                                    </p>
                                </div>
                            )}
                            {currentSourceSet && (
                                <div className="flex gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => handleRateEffort('easy')}
                                        className={`flex-1 min-h-[44px] rounded-lg border text-xs font-semibold transition-all active:scale-95 ${
                                            currentSourceSet.rpe === '6'
                                                ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 shadow-sm'
                                                : 'border-border-subtle bg-surface-elevated text-zinc-300 hover:text-white hover:border-zinc-500'
                                        }`}
                                    >
                                        {t.effortEasy}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleRateEffort('ok')}
                                        className={`flex-1 min-h-[44px] rounded-lg border text-xs font-semibold transition-all active:scale-95 ${
                                            currentSourceSet.rpe === '8'
                                                ? 'border-primary-500 bg-primary-500/20 text-primary-400 shadow-sm'
                                                : 'border-border-subtle bg-surface-elevated text-zinc-300 hover:text-white hover:border-zinc-500'
                                        }`}
                                    >
                                        {t.effortOk}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleRateEffort('hard')}
                                        className={`flex-1 min-h-[44px] rounded-lg border text-xs font-semibold transition-all active:scale-95 ${
                                            currentSourceSet.rpe === '10'
                                                ? 'border-rose-500 bg-rose-500/20 text-rose-400 shadow-sm'
                                                : 'border-border-subtle bg-surface-elevated text-zinc-300 hover:text-white hover:border-zinc-500'
                                        }`}
                                    >
                                        {t.effortHard}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </aside>
            <RestTimerNotifPrompt state={state} />
            </>
        );
    }

    return (
        <>
        <div
            className="fixed inset-x-0 bottom-0 z-sheet animate-in fade-in duration-150"
            style={{ bottom: `${keyboardOffset}px` }}
            role="dialog"
            aria-modal="false"
            aria-label={t.resting}
        >
            <div className="fixed inset-0 top-16 bg-black/60 backdrop-blur-sm -z-10" onClick={() => setMode('compact')} />
            <div className="mx-auto max-w-md rounded-t-2xl border-t border-x border-border-subtle bg-surface-base p-4 pb-safe shadow-2xl backdrop-blur-xl">
                {/* Drag Handle */}
                <div className="w-9 h-1 rounded-full bg-border-strong mx-auto mb-3" />

                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-primary-500" />
                        <span className="text-xs font-semibold text-white">
                            {t.resting}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            triggerHaptic('light');
                            setMode('compact');
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:text-white transition-colors"
                        aria-label={t.timer.minimize}
                    >
                        <Icon name="ChevronDown" size={20} />
                    </button>
                </div>

                {/* Circular Timer Ring */}
                <CircularTimer
                    percentage={percentage}
                    timeLeft={restTimer.timeLeft}
                    totalDuration={restTimer.duration}
                    lang={lang}
                    reducedEffects={reducedEffects}
                />

                {/* Next exercise / Superset context card */}
                {nextExerciseInfo && (
                    <div className="card-reference p-3 flex items-center gap-2.5 mt-2 text-left">
                        <Icon name="ArrowRight" size={18} className="text-primary-400 shrink-0" />
                        <div className="min-w-0 flex-1">
                            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                                {nextExerciseInfo.category}
                            </div>
                            <div className="truncate text-sm font-semibold text-white">
                                {nextExerciseInfo.name}{nextExerciseInfo.target ? ` · ${nextExerciseInfo.target}` : ''}
                            </div>
                        </div>
                    </div>
                )}

                {/* Effort Rating Buttons (Easy / OK / Hard) - only when enabled and source set exists */}
                {showEffortFeedback && currentSourceSet && (
                    <div className="card-reference p-3 mt-2 text-left">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-2">
                            {t.timer.effortTitle}
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => handleRateEffort('easy')}
                                className={`flex-1 min-h-[44px] rounded-lg border text-xs font-semibold transition-all active:scale-95 ${
                                    currentSourceSet.rpe === '6'
                                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 shadow-sm'
                                        : 'border-border-subtle bg-surface-elevated text-zinc-300 hover:text-white hover:border-zinc-500'
                                }`}
                            >
                                {t.effortEasy}
                            </button>
                            <button
                                type="button"
                                onClick={() => handleRateEffort('ok')}
                                className={`flex-1 min-h-[44px] rounded-lg border text-xs font-semibold transition-all active:scale-95 ${
                                    currentSourceSet.rpe === '8'
                                        ? 'border-primary-500 bg-primary-500/20 text-primary-400 shadow-sm'
                                        : 'border-border-subtle bg-surface-elevated text-zinc-300 hover:text-white hover:border-zinc-500'
                                }`}
                            >
                                OK
                            </button>
                            <button
                                type="button"
                                onClick={() => handleRateEffort('hard')}
                                className={`flex-1 min-h-[44px] rounded-lg border text-xs font-semibold transition-all active:scale-95 ${
                                    currentSourceSet.rpe === '10'
                                        ? 'border-rose-500 bg-rose-500/20 text-rose-400 shadow-sm'
                                        : 'border-border-subtle bg-surface-elevated text-zinc-300 hover:text-white hover:border-zinc-500'
                                }`}
                            >
                                {t.effortHard}
                            </button>
                        </div>
                    </div>
                )}

                {/* Quick adjustments (-10s / +30s) */}
                <div className="grid grid-cols-2 gap-2 mt-3">
                    <button
                        type="button"
                        onClick={() => adjustTimer(-10)}
                        className="min-h-[44px] rounded-xl bg-surface-elevated border border-border-subtle flex items-center justify-center gap-1.5 text-sm font-medium text-white hover:border-zinc-500 active:scale-95 transition-all"
                    >
                        <Icon name="Minus" size={14} /> 10 s
                    </button>
                    <button
                        type="button"
                        onClick={() => adjustTimer(30)}
                        className="min-h-[44px] rounded-xl bg-surface-elevated border border-border-subtle flex items-center justify-center gap-1.5 text-sm font-medium text-white hover:border-zinc-500 active:scale-95 transition-all"
                    >
                        <Icon name="Plus" size={14} /> 30 s
                    </button>
                </div>

                {/* Presets (30s / 60s / 90s) */}
                <div className="grid grid-cols-3 gap-1.5 mt-2">
                    {[30, 60, 90].map((seconds) => (
                        <button
                            key={seconds}
                            type="button"
                            onClick={() => setQuickTimer(seconds)}
                            className={`h-10 rounded-xl flex items-center justify-center text-sm transition-all active:scale-95 ${
                                restTimer.duration === seconds
                                    ? 'border-2 border-primary-500 bg-primary-500/10 text-primary-400 font-semibold'
                                    : 'border border-border-subtle bg-surface-elevated text-muted hover:text-white'
                            }`}
                        >
                            {seconds} s
                        </button>
                    ))}
                </div>

                {/* Skip Rest CTA */}
                <button
                    type="button"
                    onClick={skipTimer}
                    className="btn-primary-reference w-full h-12 mt-3.5 rounded-xl bg-primary-500 text-zinc-950 text-sm font-semibold hover:bg-primary-400 active:scale-98 transition-all shadow-sm"
                >
                    {t.timer.skipRest}
                </button>
            </div>
        </div>
        <RestTimerNotifPrompt state={state} />
        </>
    );
};
