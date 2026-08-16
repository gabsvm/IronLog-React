import React, { useEffect, useRef, useState } from 'react';
import { useTimerActions, useTimerState } from '../../context/TimerContext';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants';
import { Icon } from './Icon';
import { triggerHaptic } from '../../utils/audio';

const CircularTimer: React.FC<{ percentage: number; timeLeft: number; label: string }> = ({ percentage, timeLeft, label }) => {
    const size = 152;
    const strokeWidth = 10;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference * (1 - percentage / 100);

    const formatSeconds = (seconds: number) => {
        const safe = Math.max(0, Math.floor(Number(seconds) || 0));
        return `${Math.floor(safe / 60)}:${(safe % 60).toString().padStart(2, '0')}`;
    };

    const tone = percentage > 30 ? 'primary' : percentage > 10 ? 'amber' : 'red';
    const stroke =
        tone === 'primary' ? 'rgb(var(--primary-500))' :
        tone === 'amber' ? '#f59e0b' :
        '#ef4444';

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth={strokeWidth}
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    style={{ transition: 'stroke-dashoffset 180ms linear, stroke 180ms ease' }}
                />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
                <span className="font-mono text-[40px] font-black leading-none tracking-tight text-white tabular-nums">
                    {formatSeconds(timeLeft)}
                </span>
                <span className="mt-2 text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                    {label}
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
    // Progressive disclosure: an automatically-started rest timer should never
    // cover the workout. The lightweight chip is the default; the large controls
    // are mounted only after an explicit tap.
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

        // A fresh timer starts with timeLeft ~= duration. Tracking its endAt lets
        // us also catch a new rest that replaces a still-running one, without
        // collapsing the panel on each normal 1 Hz countdown tick.
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

            // Only mark this as an automatic minimize when we actually collapse
            // an expanded timer. That lets us restore the user's explicit state
            // after the keyboard closes without expanding a timer that was already
            // compact by default.
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

    if (!restTimer || !restTimer.active) return null;

    const formatSeconds = (seconds: number) => {
        const safe = Math.max(0, Math.floor(Number(seconds) || 0));
        return `${Math.floor(safe / 60)}:${(safe % 60).toString().padStart(2, '0')}`;
    };

    const percentage = Math.min(100, Math.max(0, (restTimer.timeLeft / restTimer.duration) * 100));
    const isCritical = percentage <= 10;
    const floatingBottom = 112 + keyboardOffset;

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
                    onClick={() => {
                        triggerHaptic('light');
                        setMinimized(false);
                        setAutoMinimized(false);
                    }}
                    className={`group flex h-10 items-center gap-2 rounded-full border px-3 shadow-lg shadow-black/30 transition-colors duration-150 active:scale-[0.98] ${
                        isCritical
                            ? 'border-red-500/35 bg-red-950/95'
                            : 'border-white/10 bg-black/95 hover:border-primary-500/35'
                    }`}
                    aria-label={`${t.resting}: ${formatSeconds(restTimer.timeLeft)}`}
                >
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full ${isCritical ? 'bg-red-500/15 text-red-300' : 'bg-primary-500/10 text-primary-400'}`}>
                        <Icon name="Clock" size={13} />
                    </span>
                    <span className="font-mono text-[15px] font-black leading-none text-white tabular-nums">
                        {formatSeconds(restTimer.timeLeft)}
                    </span>
                    <Icon name="ChevronUp" size={12} className="text-zinc-500 transition-colors group-hover:text-zinc-300" />
                </button>
            </div>
        );
    }

    return (
        <div
            className="fixed left-0 right-0 z-sheet animate-in fade-in duration-150"
            style={{ bottom: `${keyboardOffset}px` }}
            role="dialog"
            aria-modal="false"
            aria-label={t.resting}
        >
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />

            <div
                className={`relative mx-auto max-w-md rounded-t-[28px] border-x border-t pb-safe shadow-[0_-18px_46px_rgba(0,0,0,0.55)] transition-colors duration-150 ${
                    isCritical
                        ? 'border-red-500/30 bg-red-950/95'
                        : 'border-white/10 bg-black/95'
                }`}
            >
                <div className="flex justify-center pb-1 pt-3">
                    <div className="h-1 w-10 rounded-full bg-white/15" />
                </div>

                <div className="px-6 pb-6 pt-3">
                    <div className="mb-5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className={`h-1.5 w-1.5 rounded-full ${isCritical ? 'bg-red-400' : 'bg-primary-500'}`} />
                            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-300">
                                {t.resting}
                            </span>
                        </div>
                        <button
                            onClick={() => {
                                triggerHaptic('light');
                                setMinimized(true);
                                setAutoMinimized(false);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                            aria-label={lang === 'es' ? 'Minimizar' : 'Minimize'}
                        >
                            <Icon name="ChevronDown" size={16} />
                        </button>
                    </div>

                    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <CircularTimer
                            percentage={percentage}
                            timeLeft={restTimer.timeLeft}
                            label={lang === 'es' ? 'DESCANSO' : 'REST'}
                        />

                        <div className="flex w-full flex-col gap-2.5 sm:flex-1">
                            <div className="grid grid-cols-3 gap-2">
                                {[30, 60, 90].map((seconds) => (
                                    <button
                                        key={seconds}
                                        onClick={() => setQuickTimer(seconds)}
                                        className="rounded-2xl border border-white/5 bg-white/5 py-2 text-xs font-bold text-zinc-300 transition-colors hover:bg-white/10 active:scale-95"
                                    >
                                        {seconds}s
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => adjustTimer(30)}
                                className="flex items-center justify-center gap-1.5 rounded-2xl border border-white/5 bg-white/5 py-3 text-sm font-bold text-zinc-200 transition-colors hover:bg-white/10 active:scale-95"
                                aria-label="Add 30 seconds"
                            >
                                <Icon name="Plus" size={14} /> 30s
                            </button>
                            <button
                                onClick={() => adjustTimer(-10)}
                                className="flex items-center justify-center gap-1.5 rounded-2xl border border-white/5 bg-white/5 py-3 text-sm font-bold text-zinc-200 transition-colors hover:bg-white/10 active:scale-95"
                                aria-label="Subtract 10 seconds"
                            >
                                <Icon name="Minus" size={14} /> 10s
                            </button>
                            <button
                                onClick={skipTimer}
                                className="flex items-center justify-center gap-1.5 rounded-2xl bg-primary-500 py-3 text-sm font-black uppercase tracking-wider text-black shadow-lg shadow-primary-500/20 transition-colors hover:bg-primary-400 active:scale-95"
                                aria-label={lang === 'es' ? 'Saltar descanso' : 'Skip rest'}
                            >
                                <Icon name="SkipForward" size={14} /> {lang === 'es' ? 'Listo' : 'Done'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
