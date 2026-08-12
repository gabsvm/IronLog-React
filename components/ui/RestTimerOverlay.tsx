import React, { useState } from 'react';
import { useTimerContext, useTimerState } from '../../context/TimerContext';
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

    const formatSeconds = (s: number) => {
        const sec = Math.max(0, Math.floor(Number(s) || 0));
        return `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`;
    };

    const tone = percentage > 30 ? 'primary' : percentage > 10 ? 'amber' : 'red';
    const stroke =
        tone === 'primary' ? 'rgb(var(--primary-500))' :
        tone === 'amber' ? '#f59e0b' : '#ef4444';
    const glow =
        tone === 'primary' ? 'drop-shadow(0 0 12px rgb(var(--primary-500) / 0.45))' :
        tone === 'amber' ? 'drop-shadow(0 0 12px rgba(245, 158, 11, 0.45))' :
        'drop-shadow(0 0 14px rgba(239, 68, 68, 0.5))';

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="rest-timer-ring -rotate-90" style={{ filter: glow }}>
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth}
                />
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.4s ease' }}
                />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
                <span className="font-mono font-black text-white text-[40px] leading-none tracking-tight tabular-nums">
                    {formatSeconds(timeLeft)}
                </span>
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.2em] mt-2">
                    {label}
                </span>
            </div>
        </div>
    );
};

export const RestTimerOverlay: React.FC = () => {
    const restTimer = useTimerState();
    const { setRestTimer } = useTimerContext();
    const { lang } = useApp();
    const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];
    const [minimized, setMinimized] = useState(false);

    if (!restTimer || !restTimer.active) return null;

    const formatSeconds = (s: number) => {
        const sec = Math.max(0, Math.floor(Number(s) || 0));
        return `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`;
    };

    const percentage = Math.min(100, Math.max(0, (restTimer.timeLeft / restTimer.duration) * 100));
    const isCritical = percentage <= 10;

    const adjustTimer = (deltaSeconds: number) => {
        triggerHaptic('light');
        setRestTimer(p => {
            if (!p.active) return p;
            const newTime = Math.max(0, p.timeLeft + deltaSeconds);
            return {
                ...p,
                endAt: (p.endAt || Date.now()) + deltaSeconds * 1000,
                timeLeft: newTime,
                duration: deltaSeconds > 0 ? p.duration + deltaSeconds : p.duration,
            };
        });
    };

    const skipTimer = () => {
        triggerHaptic('medium');
        setRestTimer(p => ({ ...p, active: false, timeLeft: 0, endAt: 0 }));
    };

    if (minimized) {
        return (
            <div className="fixed bottom-28 right-4 z-sheet animate-in fade-in slide-in-from-bottom-2 duration-base">
                <button
                    onClick={() => { triggerHaptic('light'); setMinimized(false); }}
                    className={`group flex items-center gap-3 pl-2 pr-4 py-2 rounded-full backdrop-blur-2xl border shadow-2xl shadow-black/40 active:scale-95 transition-all duration-base ${
                        isCritical
                            ? 'bg-red-950/80 border-red-500/40'
                            : 'bg-black/70 border-white/10 hover:border-primary-500/40'
                    }`}
                    aria-label={`${t.resting}: ${formatSeconds(restTimer.timeLeft)}`}
                >
                    <div className="relative w-9 h-9">
                        <svg width="36" height="36" className="-rotate-90">
                            <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                            <circle
                                cx="18" cy="18" r="15" fill="none"
                                stroke={isCritical ? '#ef4444' : 'rgb(var(--primary-500))'}
                                strokeWidth="3" strokeLinecap="round"
                                strokeDasharray={2 * Math.PI * 15}
                                strokeDashoffset={2 * Math.PI * 15 * (1 - percentage / 100)}
                                style={{ transition: 'stroke-dashoffset 1s linear' }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Icon name="Clock" size={12} className={isCritical ? 'text-red-300' : 'text-primary-400'} />
                        </div>
                    </div>
                    <span className="font-mono font-black text-white text-base tabular-nums">
                        {formatSeconds(restTimer.timeLeft)}
                    </span>
                    <Icon name="ChevronUp" size={14} className="text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                </button>
            </div>
        );
    }

    return (
        <div
            className="fixed left-0 right-0 bottom-0 z-sheet animate-in slide-in-from-bottom duration-sheet ease-natural"
            role="dialog"
            aria-modal="false"
            aria-label={t.resting}
        >
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

            <div
                className={`relative mx-auto max-w-md rounded-t-[28px] border-t border-x backdrop-blur-2xl shadow-[0_-24px_60px_rgba(0,0,0,0.7)] pb-safe transition-colors duration-slow ${
                    isCritical
                        ? 'bg-red-950/70 border-red-500/30'
                        : 'bg-black/85 border-white/10'
                }`}
            >
                <div className="flex justify-center pt-3 pb-1">
                    <div className="w-10 h-1 rounded-full bg-white/15" />
                </div>

                <div className="px-6 pt-3 pb-6">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${isCritical ? 'bg-red-400' : 'bg-primary-500'} animate-pulse`} />
                            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-300">
                                {t.resting}
                            </span>
                        </div>
                        <button
                            onClick={() => { triggerHaptic('light'); setMinimized(true); }}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                            aria-label={lang === 'es' ? 'Minimizar' : 'Minimize'}
                        >
                            <Icon name="ChevronDown" size={16} />
                        </button>
                    </div>

                    <div className="flex items-center justify-between gap-5">
                        <CircularTimer
                            percentage={percentage}
                            timeLeft={restTimer.timeLeft}
                            label={lang === 'es' ? 'DESCANSO' : 'REST'}
                        />

                        <div className="flex-1 flex flex-col gap-2.5">
                            <button
                                onClick={() => adjustTimer(30)}
                                className="flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-sm font-bold text-zinc-200 transition-all active:scale-95"
                                aria-label="Add 30 seconds"
                            >
                                <Icon name="Plus" size={14} /> 30s
                            </button>
                            <button
                                onClick={() => adjustTimer(-10)}
                                className="flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-sm font-bold text-zinc-200 transition-all active:scale-95"
                                aria-label="Subtract 10 seconds"
                            >
                                <Icon name="Minus" size={14} /> 10s
                            </button>
                            <button
                                onClick={skipTimer}
                                className="flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-primary-500 hover:bg-primary-400 text-black text-sm font-black uppercase tracking-wider transition-all active:scale-95 shadow-lg shadow-primary-500/20"
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
