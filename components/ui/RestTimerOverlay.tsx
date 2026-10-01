import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTimerActions, useTimerState } from '../../context/TimerContext';
import { useAppConfig, useAppPreferences } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants';
import { Icon } from './Icon';
import { triggerHaptic } from '../../utils/audio';
import { useStore } from '../../lib/store';
import { getTranslated } from '../../utils';
import type { SessionExercise } from '../../types';

export const TIMER_RING_RADIUS = 52;
export const TIMER_RING_CIRCUMFERENCE = 2 * Math.PI * TIMER_RING_RADIUS; // ~326.7256...

export const calculateTimerPercentage = (timeLeft: number, duration: number): number => {
    if (!duration || duration <= 0) return 0;
    return Math.min(100, Math.max(0, (timeLeft / duration) * 100));
};

export const calculateRingDashOffset = (percentage: number, circumference: number = TIMER_RING_CIRCUMFERENCE): number => {
    const clampedPct = Math.min(100, Math.max(0, percentage));
    return circumference * (1 - clampedPct / 100);
};

export interface RestNextAction {
    category: string;
    name: string;
    isSuperset: boolean;
    target: string | null;
}

export function applyEffortRatingToExercises(
    exercises: SessionExercise[],
    exerciseInstanceId: number,
    setId: number,
    effort: 'easy' | 'ok' | 'hard'
): SessionExercise[] {
    const rpeVal = effort === 'easy' ? '6' : effort === 'ok' ? '8' : '10';
    return exercises.map(ex => {
        if (ex.instanceId !== exerciseInstanceId) return ex;
        return {
            ...ex,
            sets: (ex.sets || []).map(s => s.id === setId ? { ...s, rpe: rpeVal } : s)
        };
    });
}

export function resolveRestNextAction(
    exercises: SessionExercise[] | undefined,
    source?: { exerciseInstanceId: number; setId: number },
    lang: 'es' | 'en' = 'es'
): RestNextAction | null {
    if (!exercises || exercises.length === 0) return null;

    // If rest was triggered by an exact source set
    if (source) {
        const sourceExIndex = exercises.findIndex(e => e.instanceId === source.exerciseInstanceId);
        if (sourceExIndex >= 0) {
            const sourceEx = exercises[sourceExIndex];

            // If this is a superset
            if (sourceEx.supersetId) {
                const supersetPartners = exercises.filter(e => e.supersetId === sourceEx.supersetId);
                const nextPartner = supersetPartners.find(p => (p.sets || []).some(s => !s.completed));
                if (nextPartner) {
                    const nextSet = (nextPartner.sets || []).find(s => !s.completed);
                    const target = nextSet?.weight && nextSet?.reps
                        ? `${nextSet.weight} kg × ${nextSet.reps}`
                        : nextSet?.reps
                        ? `${nextSet.reps} reps`
                        : null;
                    return {
                        category: lang === 'es' ? 'Siguiente en superserie' : 'Next in superset',
                        name: getTranslated(nextPartner.name, lang),
                        isSuperset: true,
                        target,
                    };
                }
            } else {
                // Regular exercise: prefer the next incomplete set in the same exercise
                const nextSetInSameEx = (sourceEx.sets || []).find(s => !s.completed);
                if (nextSetInSameEx) {
                    const target = nextSetInSameEx.weight && nextSetInSameEx.reps
                        ? `${nextSetInSameEx.weight} kg × ${nextSetInSameEx.reps}`
                        : nextSetInSameEx.reps
                        ? `${nextSetInSameEx.reps} reps`
                        : null;
                    return {
                        category: lang === 'es' ? 'Siguiente serie' : 'Next set',
                        name: getTranslated(sourceEx.name, lang),
                        isSuperset: false,
                        target,
                    };
                }
            }

            // If source exercise has no more incomplete sets, find the next incomplete exercise after it
            const totalExercises = exercises.length;
            for (let offset = 1; offset < totalExercises; offset++) {
                const candidateIndex = (sourceExIndex + offset) % totalExercises;
                const candidate = exercises[candidateIndex];
                const nextSet = (candidate.sets || []).find(s => !s.completed);
                if (nextSet) {
                    const isSuperset = !!candidate.supersetId;
                    const target = nextSet.weight && nextSet.reps
                        ? `${nextSet.weight} kg × ${nextSet.reps}`
                        : nextSet.reps
                        ? `${nextSet.reps} reps`
                        : null;
                    return {
                        category: isSuperset
                            ? (lang === 'es' ? 'Siguiente en superserie' : 'Next in superset')
                            : (lang === 'es' ? 'Siguiente ejercicio' : 'Next exercise'),
                        name: getTranslated(candidate.name, lang),
                        isSuperset,
                        target,
                    };
                }
            }
        }
    }

    // Fallback when no source or when rest started manually: scan from beginning
    for (const ex of exercises) {
        const nextSet = (ex.sets || []).find(s => !s.completed);
        if (nextSet) {
            const isSuperset = !!ex.supersetId;
            const target = nextSet.weight && nextSet.reps
                ? `${nextSet.weight} kg × ${nextSet.reps}`
                : nextSet.reps
                ? `${nextSet.reps} reps`
                : null;
            return {
                category: isSuperset
                    ? (lang === 'es' ? 'Siguiente en superserie' : 'Next in superset')
                    : (lang === 'es' ? 'Siguiente ejercicio' : 'Next exercise'),
                name: getTranslated(ex.name, lang),
                isSuperset,
                target,
            };
        }
    }
    return null;
}

export const CircularTimer: React.FC<{
    percentage: number;
    timeLeft: number;
    totalDuration: number;
    lang: 'en' | 'es';
    reducedEffects?: boolean;
}> = ({ percentage, timeLeft, totalDuration, lang, reducedEffects }) => {
    const size = 170;
    const strokeWidth = 7;
    const radius = TIMER_RING_RADIUS;
    const circumference = TIMER_RING_CIRCUMFERENCE;
    const dashOffset = calculateRingDashOffset(percentage, circumference);

    const formatSeconds = (seconds: number) => {
        const safe = Math.max(0, Math.floor(Number(seconds) || 0));
        return `${Math.floor(safe / 60)}:${(safe % 60).toString().padStart(2, '0')}`;
    };

    return (
        <div className="relative flex items-center justify-center mx-auto my-2" style={{ width: size, height: size }}>
            <svg viewBox="0 0 120 120" width={size} height={size}>
                <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke="#212125"
                    strokeWidth={strokeWidth}
                />
                <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke="rgb(var(--primary-500))"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    transform="rotate(-90 60 60)"
                    style={{ transition: reducedEffects ? 'none' : 'stroke-dashoffset 1s linear' }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-4xl font-semibold text-white tabular-nums tracking-tight">
                    {formatSeconds(timeLeft)}
                </span>
                <span className="text-xs text-muted mt-0.5">
                    {lang === 'es' ? `de ${formatSeconds(totalDuration)}` : `of ${formatSeconds(totalDuration)}`}
                </span>
            </div>
        </div>
    );
};

export const RestTimerOverlay: React.FC = () => {
    const restTimer = useTimerState();
    const { setRestTimer } = useTimerActions();
    const { lang, reducedEffects } = useAppPreferences();
    const { config } = useAppConfig();
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    const activeSession = useStore(state => state.activeSession);
    const setActiveSession = useStore(state => state.setActiveSession);

    const initialMode = config?.restTimerDisplay === 'expanded' ? 'expanded' : 'compact';
    const [mode, setMode] = useState<'compact' | 'expanded'>(initialMode);
    const [keyboardOffset, setKeyboardOffset] = useState(0);
    const lastFreshStartRef = useRef(0);
    const pillRef = useRef<HTMLElement>(null);

    // Reset to user preference when a new rest begins
    useEffect(() => {
        if (!restTimer?.active) {
            setMode(config?.restTimerDisplay === 'expanded' ? 'expanded' : 'compact');
            lastFreshStartRef.current = 0;
            return;
        }

        const looksLikeFreshStart = restTimer.duration > 0 && restTimer.timeLeft >= restTimer.duration - 1;
        if (looksLikeFreshStart && restTimer.endAt !== lastFreshStartRef.current) {
            lastFreshStartRef.current = restTimer.endAt;
            setMode(config?.restTimerDisplay === 'expanded' ? 'expanded' : 'compact');
        }
    }, [restTimer?.active, restTimer?.duration, restTimer?.endAt, restTimer?.timeLeft, config?.restTimerDisplay]);

    // Keyboard avoidance via visualViewport only
    useEffect(() => {
        if (!window.visualViewport) return;

        const viewport = window.visualViewport;
        const syncViewportOffset = () => {
            const offset = Math.max(0, Math.round(window.innerHeight - viewport.height - viewport.offsetTop));
            setKeyboardOffset(offset);
        };

        syncViewportOffset();
        viewport.addEventListener('resize', syncViewportOffset);
        viewport.addEventListener('scroll', syncViewportOffset);

        return () => {
            viewport.removeEventListener('resize', syncViewportOffset);
            viewport.removeEventListener('scroll', syncViewportOffset);
        };
    }, []);

    // Expose the compact pill height as --rest-pill-height so scrollable
    // content (workout exercise list) can pad its bottom and never slide
    // under the pill. '0px' whenever the pill is not mounted.
    useEffect(() => {
        const root = document.documentElement;
        if (!restTimer?.active || mode !== 'compact') {
            root.style.setProperty('--rest-pill-height', '0px');
            return;
        }
        const pill = pillRef.current;
        if (!pill) return;
        const applyHeight = () => {
            root.style.setProperty('--rest-pill-height', `${Math.ceil(pill.getBoundingClientRect().height)}px`);
        };
        applyHeight();
        if (typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver(applyHeight);
        observer.observe(pill);
        return () => {
            observer.disconnect();
            root.style.setProperty('--rest-pill-height', '0px');
        };
    }, [restTimer?.active, mode]);

    // Derived: Current source set for effort feedback
    const currentSourceSet = useMemo(() => {
        if (!restTimer?.source || !activeSession?.exercises) return null;
        const ex = activeSession.exercises.find(e => e.instanceId === restTimer.source?.exerciseInstanceId);
        return ex?.sets?.find(s => s.id === restTimer.source?.setId) || null;
    }, [activeSession?.exercises, restTimer?.source]);

    const showEffortFeedback = Boolean(config?.showRIR || config?.rpEnabled);

    const handleRateEffort = (effort: 'easy' | 'ok' | 'hard') => {
        if (!restTimer?.source) return;
        const { exerciseInstanceId, setId } = restTimer.source;
        triggerHaptic('light');
        setActiveSession(prev => {
            if (!prev) return null;
            return {
                ...prev,
                exercises: applyEffortRatingToExercises(prev.exercises || [], exerciseInstanceId, setId, effort)
            };
        });
    };

    // Truthful next exercise / superset context resolution
    const nextExerciseInfo = useMemo(() => {
        return resolveRestNextAction(activeSession?.exercises, restTimer?.source, lang);
    }, [activeSession?.exercises, lang, restTimer?.source]);

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
        ? { top: 'calc(env(safe-area-inset-top, 0px) + 64px)', bottom: 'auto' }
        : { bottom: `${floatingBottom}px` };
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
                            aria-label={`${t.resting}: ${formatSeconds(restTimer.timeLeft)}. ${lang === 'es' ? 'Tocar para expandir' : 'Tap to expand'}`}
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
                                aria-label={lang === 'es' ? 'Saltar descanso' : 'Skip rest'}
                                title={lang === 'es' ? 'Saltar descanso' : 'Skip rest'}
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
        );
    }

    return (
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
                            {lang === 'es' ? 'Descansando' : 'Resting'}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            triggerHaptic('light');
                            setMode('compact');
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:text-white transition-colors"
                        aria-label={lang === 'es' ? 'Minimizar' : 'Minimize'}
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
                            {lang === 'es' ? '¿Cómo se sintió la serie?' : 'How did the set feel?'}
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
                                {lang === 'es' ? 'Fácil' : 'Easy'}
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
                                {lang === 'es' ? 'Duro' : 'Hard'}
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
                    {lang === 'es' ? 'Saltar descanso' : 'Skip rest'}
                </button>
            </div>
        </div>
    );
};
