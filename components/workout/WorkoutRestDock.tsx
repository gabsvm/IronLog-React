// Phase 4 (focused workout): rest docked visually inside the workout panel.
// Same TimerContext motor as the global pill (no local setInterval); the
// overlay suppresses its floating views while this dock is mounted, so only
// one rest surface is ever visible. See workoutRestDockSignal.ts.
import React, { useEffect, useMemo, useRef } from 'react';
import { useTimerActions, useTimerState } from '../../context/TimerContext';
import { useAppConfig, useAppPreferences } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants';
import { triggerHaptic } from '../../utils/audio';
import { useStore } from '../../lib/store';
import { resolveWeightUnit } from '../../utils/units';
import { Icon } from '../ui/Icon';
import {
    adjustRestTimer,
    getRestControlLabels,
    pauseRestTimer,
    resolveRestIncrement,
    restartRestTimer,
    resumeRestTimer,
    skipRestTimer,
} from '../ui/restTimer/restTimerControls';
import {
    applyEffortRatingToExercises,
    calculateTimerPercentage,
    resolveRestNextAction,
} from '../ui/restTimer/restTimerLogic';
import { setWorkoutRestDocked } from './workoutRestDockSignal';

export const WorkoutRestDock: React.FC = () => {
    const restTimer = useTimerState();
    const { setRestTimer } = useTimerActions();
    const { lang } = useAppPreferences();
    const { config } = useAppConfig();
    const activeSession = useStore((state) => state.activeSession);
    const setActiveSession = useStore((state) => state.setActiveSession);
    const t = TRANSLATIONS[lang];
    const dockRef = useRef<HTMLElement>(null);

    // The dock renders right under the rest's source exercise (WorkoutMain
    // anchors it there), so mounting never needs to move the scroll: the
    // next-set smooth scroll in the card owns post-tap motion.

    // Announce the dock so the global overlay hides its floating views.
    useEffect(() => {
        setWorkoutRestDocked(true);
        return () => {
            setWorkoutRestDocked(false);
        };
    }, []);

    const currentSourceExercise = useMemo(() => {
        if (!restTimer?.source || !activeSession?.exercises) return null;
        return activeSession.exercises.find((e) => e.instanceId === restTimer.source?.exerciseInstanceId) || null;
    }, [activeSession?.exercises, restTimer?.source]);

    const currentSourceSet = useMemo(() => {
        return currentSourceExercise?.sets?.find((s) => s.id === restTimer?.source?.setId) || null;
    }, [currentSourceExercise, restTimer?.source]);

    const isDensityMode = currentSourceExercise?.progressionMode === 'density';

    const showEffortFeedback = Boolean(config?.showRIR || config?.rpEnabled);

    const nextExerciseInfo = useMemo(() => {
        return resolveRestNextAction(activeSession?.exercises, restTimer?.source, lang, resolveWeightUnit(config));
    }, [activeSession?.exercises, restTimer?.source, lang, config]);

    // Expose the dock height as --rest-dock-height so the fixed one-time
    // prompts stack above it (same contract as --rest-pill-height for the
    // floating pill). '0px' whenever the dock is not mounted.
    useEffect(() => {
        const root = document.documentElement;
        const el = dockRef.current;
        if (!el) {
            root.style.setProperty('--rest-dock-height', '0px');
            return;
        }
        const apply = () => {
            root.style.setProperty('--rest-dock-height', `${Math.ceil(el.getBoundingClientRect().height)}px`);
        };
        apply();
        const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(apply) : null;
        ro?.observe(el);
        return () => {
            ro?.disconnect();
            root.style.setProperty('--rest-dock-height', '0px');
        };
    }, [restTimer?.active, showEffortFeedback, nextExerciseInfo, restTimer?.paused]);

    if (!restTimer || !restTimer.active) return null;

    const percentage = calculateTimerPercentage(restTimer.timeLeft, restTimer.duration);
    const remainingPct = Math.min(100, Math.max(0, percentage));

    const restLabels = getRestControlLabels(lang);
    const restStep = resolveRestIncrement(config);

    const adjustTimer = (deltaSeconds: number): void => {
        triggerHaptic('light');
        setRestTimer((prev) => adjustRestTimer(prev, deltaSeconds));
    };

    const skipTimer = (): void => {
        triggerHaptic('medium');
        setRestTimer((prev) => skipRestTimer(prev));
    };

    const togglePauseTimer = (): void => {
        triggerHaptic('light');
        setRestTimer((prev) => (prev.paused ? resumeRestTimer(prev) : pauseRestTimer(prev)));
    };

    const restartTimer = (): void => {
        triggerHaptic('light');
        setRestTimer((prev) => restartRestTimer(prev));
    };

    const handleRateEffort = (effort: 'easy' | 'ok' | 'hard'): void => {
        if (!restTimer?.source || restTimer.source.setId === undefined) return;
        const { exerciseInstanceId, setId } = restTimer.source;
        triggerHaptic('light');
        setActiveSession((prev) => {
            if (!prev) return null;
            return {
                ...prev,
                exercises: applyEffortRatingToExercises(prev.exercises || [], exerciseInstanceId, setId, effort),
            };
        });
    };

    const restSecondsLeft = Math.max(0, Math.floor(Number(restTimer.timeLeft) || 0));
    const restTimeLabel = `${Math.floor(restSecondsLeft / 60)}:${(restSecondsLeft % 60).toString().padStart(2, '0')}`;

    return (
        <section
            ref={dockRef}
            data-workout-rest-dock="true"
            aria-label={t.timer.resting}
            className="card-reference pointer-events-auto px-3 py-2.5"
        >
            <div className="flex items-center gap-2.5">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                        <p className="text-xs font-medium text-muted">{restTimer.source ? t.timer.resting : restLabels.manualRest}</p>
                        {restTimer.paused && (
                            <span className="inline-flex items-center gap-1 rounded bg-sky-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-sky-400">
                                <Icon name="Pause" size={10} />
                                {restLabels.pausedBadge}
                            </span>
                        )}
                        {isDensityMode && (
                            <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
                                <Icon name="Zap" size={10} />
                                {t.progression?.densityBadge || 'Densidad'}
                            </span>
                        )}
                    </div>
                    <p className="text-3xl font-semibold tabular-nums leading-tight text-[rgb(var(--text-primary))]">
                        {restTimeLabel}
                    </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                    <button
                        type="button"
                        onClick={togglePauseTimer}
                        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-border-subtle bg-surface-elevated text-white transition-all hover:border-primary-500/30 active:scale-90"
                        aria-label={restTimer.paused ? restLabels.resume : restLabels.pause}
                        title={restTimer.paused ? restLabels.resume : restLabels.pause}
                    >
                        <Icon name={restTimer.paused ? 'Play' : 'Pause'} size={16} />
                    </button>
                    <button
                        type="button"
                        onClick={restartTimer}
                        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-border-subtle bg-surface-elevated text-white transition-all hover:border-primary-500/30 active:scale-90"
                        aria-label={restLabels.restart}
                        title={restLabels.restart}
                    >
                        <Icon name="RotateCcw" size={16} />
                    </button>
                    <button
                        type="button"
                        onClick={() => adjustTimer(-restStep)}
                        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-border-subtle bg-surface-elevated px-3 text-[11px] font-bold text-white transition-all hover:border-primary-500/30 active:scale-90"
                        aria-label={`-${restStep}s`}
                    >
                        -{restStep}s
                    </button>
                    <button
                        type="button"
                        onClick={() => adjustTimer(30)}
                        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-border-subtle bg-surface-elevated px-3 text-[11px] font-bold text-white transition-all hover:border-primary-500/30 active:scale-90"
                        aria-label="+30s"
                    >
                        +30s
                    </button>
                    <button
                        type="button"
                        onClick={skipTimer}
                        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-border-subtle bg-surface-elevated text-muted transition-all hover:text-white active:scale-90"
                        aria-label={t.timer.skipRest}
                        title={t.timer.skipRest}
                    >
                        <Icon name="FastForward" size={16} />
                    </button>
                </div>
            </div>
            {/* One progress indicator: the rest still to go is the wave, the time already spent is a flat track. */}
            <div className="mt-2 flex items-center gap-1" aria-hidden="true">
                {remainingPct > 0 && (
                    <div className="gl-wave shrink-0 transition-[width] duration-300 ease-natural effects-reduced:transition-none" style={{ width: `${remainingPct}%` }} />
                )}
                <div className="h-1 min-w-0 flex-1 rounded-full bg-surface-elevated" />
            </div>
            {(nextExerciseInfo || (showEffortFeedback && currentSourceSet)) && (
                <div className="mt-2 border-t border-border-subtle/60 pt-2">
                    {nextExerciseInfo && (
                        <div className="flex items-center justify-between gap-2 px-1 pb-1.5 text-left text-xs">
                            <div className="flex min-w-0 items-center gap-1.5">
                                <Icon name="ArrowRight" size={13} className="shrink-0 text-primary-400" />
                                <span className="truncate text-white">
                                    <span className="font-medium text-muted">{nextExerciseInfo.category} · </span>
                                    <span className="font-semibold">{nextExerciseInfo.name}</span>
                                </span>
                            </div>
                            {nextExerciseInfo.target && (
                                <span className="shrink-0 rounded-full border border-primary-500/30 bg-primary-500/10 px-2 py-0.5 text-[11px] font-semibold text-primary-300">
                                    {nextExerciseInfo.target}
                                </span>
                            )}
                        </div>
                    )}
                    {showEffortFeedback && currentSourceSet && (
                        <div className="flex gap-1.5">
                            <button
                                type="button"
                                onClick={() => handleRateEffort('easy')}
                                className={`min-h-[44px] flex-1 rounded-[16px] border text-xs font-semibold transition-colors active:scale-95 ${
                                    currentSourceSet.rpe === '6'
                                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 shadow-sm'
                                        : 'border-border-subtle bg-surface-elevated text-secondary hover:border-zinc-500 hover:text-white'
                                }`}
                            >
                                {t.effortEasy}
                            </button>
                            <button
                                type="button"
                                onClick={() => handleRateEffort('ok')}
                                className={`min-h-[44px] flex-1 rounded-[16px] border text-xs font-semibold transition-colors active:scale-95 ${
                                    currentSourceSet.rpe === '8'
                                        ? 'border-primary-500 bg-primary-500/20 text-primary-400 shadow-sm'
                                        : 'border-border-subtle bg-surface-elevated text-secondary hover:border-zinc-500 hover:text-white'
                                }`}
                            >
                                {t.effortOk}
                            </button>
                            <button
                                type="button"
                                onClick={() => handleRateEffort('hard')}
                                className={`min-h-[44px] flex-1 rounded-[16px] border text-xs font-semibold transition-colors active:scale-95 ${
                                    currentSourceSet.rpe === '10'
                                        ? 'border-rose-500 bg-rose-500/20 text-rose-400 shadow-sm'
                                        : 'border-border-subtle bg-surface-elevated text-secondary hover:border-zinc-500 hover:text-white'
                                }`}
                            >
                                {t.effortHard}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};
