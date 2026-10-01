import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTimerActions, useTimerState } from '../../context/TimerContext';
import { useApp, useAppConfig } from '../../context/AppContext';
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

const CircularTimer: React.FC<{
    percentage: number;
    timeLeft: number;
    totalDuration: number;
    lang: 'en' | 'es';
}> = ({ percentage, timeLeft, totalDuration, lang }) => {
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
                    style={{ transition: 'stroke-dashoffset 200ms linear' }}
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
    const { lang } = useApp();
    const { config } = useAppConfig();
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    const activeSession = useStore(state => state.activeSession);
    const setActiveSession = useStore(state => state.setActiveSession);

    const [minimized, setMinimized] = useState(false);
    const [autoMinimized, setAutoMinimized] = useState(false);
    const [keyboardOffset, setKeyboardOffset] = useState(0);
    const lastFreshStartRef = useRef(0);

    const isEditableElement = (node: Element | null) => {
        if (!(node instanceof HTMLElement)) return false;
        const tag = node.tagName;
        return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || node.isContentEditable;
    };

    useEffect(() => {
        if (!restTimer?.active) {
            setMinimized(true);
            setAutoMinimized(false);
            setKeyboardOffset(0);
            lastFreshStartRef.current = 0;
            return;
        }

        const looksLikeFreshStart = restTimer.duration > 0 && restTimer.timeLeft >= restTimer.duration - 1;
        if (looksLikeFreshStart && restTimer.endAt !== lastFreshStartRef.current) {
            lastFreshStartRef.current = restTimer.endAt;
            const hasFocusedInput = isEditableElement(document.activeElement);
            setMinimized(hasFocusedInput);
            setAutoMinimized(hasFocusedInput);
        }
    }, [restTimer?.active, restTimer?.duration, restTimer?.endAt, restTimer?.timeLeft]);

    useEffect(() => {
        const handleFocusIn = (event: FocusEvent) => {
            const target = event.target as HTMLElement | null;
            if (!target || !isEditableElement(target) || minimized) return;

            setMinimized(true);
            setAutoMinimized(true);
        };

        const handleFocusOut = () => {
            window.setTimeout(() => {
                const noFocusedEditable = !isEditableElement(document.activeElement);
                if (autoMinimized && keyboardOffset <= 24 && noFocusedEditable) {
                    setMinimized(false);
                    setAutoMinimized(false);
                }
            }, 30);
        };

        document.addEventListener('focusin', handleFocusIn);
        document.addEventListener('focusout', handleFocusOut);
        return () => {
            document.removeEventListener('focusin', handleFocusIn);
            document.removeEventListener('focusout', handleFocusOut);
        };
    }, [autoMinimized, keyboardOffset, minimized]);

    useEffect(() => {
        if (!window.visualViewport) return;

        const viewport = window.visualViewport;
        const syncViewportOffset = () => {
            const offset = Math.max(0, Math.round(window.innerHeight - viewport.height - viewport.offsetTop));
            setKeyboardOffset(offset);
            if (offset > 120 && !minimized) {
                setMinimized(true);
                setAutoMinimized(true);
            } else if (offset <= 24 && autoMinimized && !isEditableElement(document.activeElement)) {
                setMinimized(false);
                setAutoMinimized(false);
            }
        };

        syncViewportOffset();
        viewport.addEventListener('resize', syncViewportOffset);
        viewport.addEventListener('scroll', syncViewportOffset);

        return () => {
            viewport.removeEventListener('resize', syncViewportOffset);
            viewport.removeEventListener('scroll', syncViewportOffset);
        };
    }, [autoMinimized, minimized]);

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

    if (minimized) {
        return (
            <div
                className="fixed right-3 z-sheet"
                style={{ bottom: `${floatingBottom}px` }}
            >
                <button
                    type="button"
                    onClick={() => {
                        triggerHaptic('light');
                        setMinimized(false);
                        setAutoMinimized(false);
                    }}
                    className="flex h-10 items-center gap-2 rounded-full border border-border-subtle bg-surface-base/95 px-3.5 shadow-lg backdrop-blur-md transition-all hover:border-zinc-500 active:scale-95"
                    aria-label={`${t.resting}: ${formatSeconds(restTimer.timeLeft)}`}
                >
                    <span className="h-2 w-2 rounded-full bg-primary-500 animate-pulse" />
                    <span className="font-mono text-sm font-semibold text-white tabular-nums">
                        {formatSeconds(restTimer.timeLeft)}
                    </span>
                    <Icon name="ChevronUp" size={14} className="text-muted" />
                </button>
            </div>
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
            <div className="fixed inset-0 top-16 bg-black/60 backdrop-blur-sm -z-10" onClick={() => setMinimized(true)} />
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
                            setMinimized(true);
                            setAutoMinimized(false);
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
                                className={`flex-1 h-9 rounded-lg border text-xs font-semibold transition-all active:scale-95 ${
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
                                className={`flex-1 h-9 rounded-lg border text-xs font-semibold transition-all active:scale-95 ${
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
                                className={`flex-1 h-9 rounded-lg border text-xs font-semibold transition-all active:scale-95 ${
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
                        className="h-10 rounded-xl bg-surface-elevated border border-border-subtle flex items-center justify-center gap-1.5 text-sm font-medium text-white hover:border-zinc-500 active:scale-95 transition-all"
                    >
                        <Icon name="Minus" size={14} /> 10 s
                    </button>
                    <button
                        type="button"
                        onClick={() => adjustTimer(30)}
                        className="h-10 rounded-xl bg-surface-elevated border border-border-subtle flex items-center justify-center gap-1.5 text-sm font-medium text-white hover:border-zinc-500 active:scale-95 transition-all"
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
