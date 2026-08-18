import React, { useMemo } from 'react';
import type { ActiveSession } from '../../types';
import { useTimerActions, useTimerState } from '../../context/TimerContext';
import { getTranslated } from '../../utils';
import { Icon } from '../ui/Icon';
import { triggerHaptic } from '../../utils/audio';

interface Props {
    session: ActiveSession | null;
    lang: 'en' | 'es';
}

const formatTime = (seconds: number) => {
    const safe = Math.max(0, Math.ceil(seconds));
    return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
};

export const ContextualRestDock: React.FC<Props> = ({ session, lang }) => {
    const timer = useTimerState();
    const { setRestTimer } = useTimerActions();

    const nextAction = useMemo(() => {
        if (!session) return null;
        for (const exercise of session.exercises || []) {
            const setIndex = (exercise.sets || []).findIndex(set => !set.completed && set.type !== 'warmup' && !set.skipped);
            if (setIndex >= 0) {
                const set = exercise.sets[setIndex];
                const previous = [
                    Number(set.prevWeight || 0) > 0 ? `${set.prevWeight}kg` : null,
                    Number(set.prevReps || 0) > 0 ? `${set.prevReps} reps` : null,
                ].filter(Boolean).join(' × ');
                return {
                    exercise: String(getTranslated(exercise.name, lang)),
                    setNumber: setIndex + 1,
                    previous,
                };
            }
        }
        return null;
    }, [lang, session]);

    if (!timer.active) return null;

    const adjust = (delta: number) => {
        triggerHaptic('light');
        setRestTimer(prev => {
            if (!prev.active) return prev;
            const nextTime = Math.max(0, prev.timeLeft + delta);
            if (nextTime <= 0) return { ...prev, active: false, timeLeft: 0, endAt: 0 };
            return {
                ...prev,
                timeLeft: nextTime,
                duration: Math.max(1, prev.duration + delta),
                endAt: Date.now() + nextTime * 1000,
            };
        });
    };

    const skip = () => {
        triggerHaptic('medium');
        setRestTimer(prev => ({ ...prev, active: false, timeLeft: 0, endAt: 0 }));
    };

    return (
        <div className="contextual-rest-dock fixed inset-x-0 bottom-0 z-[46] px-3 pb-[calc(env(safe-area-inset-bottom)+0.6rem)] pointer-events-none">
            <div className="pointer-events-auto mx-auto max-w-md overflow-hidden rounded-2xl border border-primary-500/20 bg-[rgb(var(--surface-raised)/0.97)] shadow-[0_16px_45px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                <div className="flex items-center gap-3 px-3 py-2.5">
                    <div className="flex h-11 min-w-[72px] items-center justify-center rounded-xl bg-primary-500/10 px-3 text-xl font-black tabular-nums tracking-[-0.04em] text-primary-500">
                        {formatTime(timer.timeLeft)}
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-[rgb(var(--text-muted))]">
                            {lang === 'es' ? 'Descanso' : 'Rest'}
                        </div>
                        {nextAction ? (
                            <div className="mt-0.5 truncate text-xs font-bold text-[rgb(var(--text-primary))]">
                                {lang === 'es' ? 'Siguiente' : 'Next'}: {nextAction.exercise} · {lang === 'es' ? 'serie' : 'set'} {nextAction.setNumber}
                            </div>
                        ) : (
                            <div className="mt-0.5 text-xs font-bold text-[rgb(var(--text-secondary))]">
                                {lang === 'es' ? 'Últimas series de la sesión' : 'Final sets of the session'}
                            </div>
                        )}
                        {nextAction?.previous && (
                            <div className="mt-0.5 truncate text-[10px] font-semibold tabular-nums text-[rgb(var(--text-muted))]">
                                {lang === 'es' ? 'Anterior' : 'Previous'}: {nextAction.previous}
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-3 border-t border-[rgb(var(--border-subtle)/0.7)]">
                    <button type="button" onClick={() => adjust(-15)} className="flex min-h-11 items-center justify-center gap-1 text-xs font-black text-[rgb(var(--text-secondary))] active:bg-[rgb(var(--surface-base))]">
                        <Icon name="Minus" size={14} />15s
                    </button>
                    <button type="button" onClick={() => adjust(15)} className="flex min-h-11 items-center justify-center gap-1 border-x border-[rgb(var(--border-subtle)/0.7)] text-xs font-black text-[rgb(var(--text-secondary))] active:bg-[rgb(var(--surface-base))]">
                        <Icon name="Plus" size={14} />15s
                    </button>
                    <button type="button" onClick={skip} className="min-h-11 text-xs font-black text-primary-500 active:bg-primary-500/10">
                        {lang === 'es' ? 'Saltar' : 'Skip'}
                    </button>
                </div>
            </div>
        </div>
    );
};
