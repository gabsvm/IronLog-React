import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTimerActions, useTimerState } from '../../context/TimerContext';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants';
import { Icon } from './Icon';
import { triggerHaptic } from '../../utils/audio';
import { useStore } from '../../lib/store';
import { getTranslated } from '../../utils';

const CircularTimer: React.FC<{
    percentage: number;
    timeLeft: number;
    totalDuration: number;
    lang: 'en' | 'es';
}> = ({ percentage, timeLeft, totalDuration, lang }) => {
    const size = 170;
    const strokeWidth = 7;
    const radius = 52;
    const circumference = 2 * Math.PI * radius; // ~326.72
    const dashOffset = circumference * (1 - Math.min(100, Math.max(0, percentage)) / 100);

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
                    stroke="var(--primary-500, #c4f13a)"
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
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    const activeSession = useStore(state => state.activeSession);

    const [minimized, setMinimized] = useState(true);
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
            setMinimized(true);
            setAutoMinimized(false);
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

    const nextExerciseInfo = useMemo(() => {
        if (!activeSession?.exercises) return null;
        for (const ex of activeSession.exercises) {
            const nextSet = (ex.sets || []).find(s => !s.completed);
            if (nextSet) {
                const isSuperset = !!ex.supersetId;
                const target = nextSet.weight && nextSet.reps
                    ? `${nextSet.weight} kg × ${nextSet.reps}`
                    : nextSet.reps
                    ? `${nextSet.reps} reps`
                    : null;
                return {
                    name: getTranslated(ex.name, lang),
                    isSuperset,
                    target,
                };
            }
        }
        return null;
    }, [activeSession, lang]);

    if (!restTimer || !restTimer.active) return null;

    const formatSeconds = (seconds: number) => {
        const safe = Math.max(0, Math.floor(Number(seconds) || 0));
        return `${Math.floor(safe / 60)}:${(safe % 60).toString().padStart(2, '0')}`;
    };

    const percentage = Math.min(100, Math.max(0, (restTimer.timeLeft / restTimer.duration) * 100));
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
        setRestTimer((prev) => ({ ...prev, active: false, timeLeft: 0, endAt: 0 }));
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
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm -z-10" onClick={() => setMinimized(true)} />
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
                                {nextExerciseInfo.isSuperset
                                    ? (lang === 'es' ? 'Siguiente en la superserie' : 'Next in superset')
                                    : (lang === 'es' ? 'Siguiente ejercicio' : 'Next exercise')}
                            </div>
                            <div className="truncate text-sm font-semibold text-white">
                                {nextExerciseInfo.name}{nextExerciseInfo.target ? ` · ${nextExerciseInfo.target}` : ''}
                            </div>
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
