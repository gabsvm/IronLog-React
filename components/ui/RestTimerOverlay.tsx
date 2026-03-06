
import React, { useState } from 'react';
import { useTimerContext } from '../../context/TimerContext';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants';
import { Icon } from './Icon';
import { triggerHaptic } from '../../utils/audio';

// Circular SVG countdown ring
const CircularTimer: React.FC<{ percentage: number; timeLeft: number }> = ({ percentage, timeLeft }) => {
    const size = 120;
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference * (1 - percentage / 100);

    const formatSeconds = (s: number) => {
        const sec = Math.max(0, Math.floor(Number(s) || 0));
        return `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`;
    };

    // Color transitions: green → amber → red as time runs out
    const color = percentage > 60 ? '#22c55e' : percentage > 30 ? '#f59e0b' : '#dc2626';

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                {/* Background track */}
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="none" stroke="#27272a" strokeWidth={strokeWidth}
                />
                {/* Progress arc */}
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
                />
            </svg>
            {/* Center text */}
            <div className="absolute flex flex-col items-center justify-center">
                <span className="font-mono font-black text-white text-2xl leading-none tracking-tight">
                    {formatSeconds(timeLeft)}
                </span>
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">REST</span>
            </div>
        </div>
    );
};

export const RestTimerOverlay: React.FC = () => {
    const { restTimer, setRestTimer } = useTimerContext();
    const { lang } = useApp();
    const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];
    const [minimized, setMinimized] = useState(false);

    if (!restTimer || !restTimer.active) return null;

    const formatSeconds = (s: number) => {
        const sec = Math.max(0, Math.floor(Number(s) || 0));
        return `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`;
    };

    const percentage = Math.min(100, Math.max(0, (restTimer.timeLeft / restTimer.duration) * 100));

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

    return (
        <div className={`fixed left-0 right-0 z-50 transition-all duration-300 ${minimized ? 'bottom-24 right-4 left-auto w-auto' : 'bottom-0'}`}>
            {/* ─── Minimized pill ─── */}
            {minimized && (
                <button
                    onClick={() => { triggerHaptic('light'); setMinimized(false); }}
                    className="flex items-center gap-3 bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-3 shadow-2xl shadow-black/50 active:scale-95 transition-transform"
                >
                    <div className="w-8 h-8 rounded-full border-2 border-red-500 flex items-center justify-center">
                        <Icon name="Clock" size={14} className="text-red-400" />
                    </div>
                    <span className="font-mono font-black text-white text-lg">{formatSeconds(restTimer.timeLeft)}</span>
                    <Icon name="ChevronUp" size={16} className="text-zinc-500" />
                </button>
            )}

            {/* ─── Expanded panel ─── */}
            {!minimized && (
                <div className="bg-zinc-950 border-t border-zinc-800 shadow-[0_-16px_60px_rgba(0,0,0,0.6)] animate-slideUp">
                    <div className="max-w-md mx-auto px-5 pt-4 pb-8">
                        {/* Top row: label + minimize */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                <Icon name="Clock" size={11} /> {t.resting}
                            </div>
                            <button
                                onClick={() => { triggerHaptic('light'); setMinimized(true); }}
                                className="p-2 text-zinc-600 hover:text-zinc-300 transition-colors rounded-full hover:bg-zinc-800"
                            >
                                <Icon name="Minus" size={18} />
                            </button>
                        </div>

                        {/* Main: circular timer + controls */}
                        <div className="flex items-center gap-6">
                            {/* Circle */}
                            <CircularTimer percentage={percentage} timeLeft={restTimer.timeLeft} />

                            {/* Right side controls */}
                            <div className="flex-1 flex flex-col gap-2">
                                <button
                                    onClick={() => adjustTimer(30)}
                                    className="flex items-center justify-center gap-2 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-bold text-zinc-300 transition-colors active:scale-95"
                                >
                                    <Icon name="Plus" size={14} /> +30s
                                </button>
                                <button
                                    onClick={() => adjustTimer(-10)}
                                    className="flex items-center justify-center gap-2 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-bold text-zinc-300 transition-colors active:scale-95"
                                >
                                    <Icon name="Minus" size={14} /> -10s
                                </button>
                                <button
                                    onClick={skipTimer}
                                    className="flex items-center justify-center gap-2 py-3 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-xl text-sm font-bold text-red-400 transition-colors active:scale-95"
                                >
                                    <Icon name="SkipForward" size={14} /> SKIP
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
