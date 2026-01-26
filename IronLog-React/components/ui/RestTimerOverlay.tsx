
import React, { useState } from 'react';
import { useTimerContext } from '../../context/TimerContext'; // New import
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants';
import { Icon } from './Icon';

export const RestTimerOverlay: React.FC = () => {
    const { restTimer, setRestTimer } = useTimerContext(); // Use isolated context
    const { lang } = useApp();
    const t = TRANSLATIONS[lang] || TRANSLATIONS['en']; // Fallback safety
    const [minimized, setMinimized] = useState(false);

    if (!restTimer || !restTimer.active) return null;

    const formatSeconds = (s: number) => {
        const sec = Math.max(0, Math.floor(Number(s) || 0));
        return `${Math.floor(sec/60)}:${(sec%60).toString().padStart(2,'0')}`;
    };

    const percentage = Math.min(100, Math.max(0, (restTimer.timeLeft / restTimer.duration) * 100));

    return (
        <div className={`fixed left-0 right-0 z-50 transition-all duration-300 ${minimized ? 'bottom-4 mx-4 w-auto rounded-full' : 'bottom-0 border-t border-zinc-200 dark:border-white/10'}`}>
            <div className={`glass shadow-[0_-10px_40px_rgba(0,0,0,0.3)] animate-slideUp overflow-hidden ${minimized ? 'rounded-full pr-2' : ''}`}>
                
                {/* Minimized View */}
                {minimized && (
                    <div className="flex items-center gap-3 p-2 cursor-pointer" onClick={() => setMinimized(false)}>
                         <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center animate-pulse">
                            <Icon name="Clock" size={16} />
                        </div>
                        <span className="font-mono font-bold text-zinc-900 dark:text-white pr-2">
                            {formatSeconds(restTimer.timeLeft)}
                        </span>
                    </div>
                )}

                {/* Maximized View */}
                {!minimized && (
                    <div className="max-w-md mx-auto p-4 pb-8 relative">
                        {/* Minimize Button */}
                        <button 
                            onClick={() => setMinimized(true)}
                            className="absolute top-2 right-2 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                        >
                            <Icon name="Minus" size={20} />
                        </button>

                        <div className="flex justify-between items-center mb-3 pr-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 flex items-center justify-center animate-pulse-subtle">
                                    <Icon name="Clock" size={20} />
                                </div>
                                <div>
                                    <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">{t.resting}</div>
                                    <div className="text-2xl font-black text-zinc-900 dark:text-white font-mono leading-none tracking-tight">
                                        {formatSeconds(restTimer.timeLeft)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-3">
                            <button 
                                onClick={() => setRestTimer(p => {
                                    if (!p.active) return p;
                                    const sub = 10;
                                    return { 
                                        ...p, 
                                        endAt: (p.endAt || Date.now()) - sub * 1000, 
                                        timeLeft: Math.max(0, p.timeLeft - sub)
                                    };
                                })} 
                                className="py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-300 transition-colors active:scale-95 flex items-center justify-center gap-1"
                            >
                                <Icon name="Minus" size={12} /> 10s
                            </button>
                            <button 
                                onClick={() => setRestTimer(p => {
                                    if (!p.active) return p;
                                    const add = 30;
                                    return { ...p, endAt: (p.endAt || Date.now()) + add * 1000, timeLeft: p.timeLeft + add, duration: p.duration + add };
                                })} 
                                className="py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-300 transition-colors active:scale-95 flex items-center justify-center gap-1"
                            >
                                <Icon name="Plus" size={12} /> 30s
                            </button>
                            <button 
                                onClick={() => setRestTimer(p => ({ ...p, active: false, timeLeft: 0, endAt: 0 }))} 
                                className="py-3 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold transition-colors active:scale-95 flex items-center justify-center gap-1"
                            >
                                <Icon name="SkipForward" size={14} /> SKIP
                            </button>
                        </div>

                        <div className="h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-red-600 transition-all duration-1000 ease-linear shadow-[0_0_10px_rgba(220,38,38,0.5)]" 
                                style={{ width: `${percentage}%` }}
                            ></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
