import React from 'react';
import { Icon } from '../../components/ui/Icon';
import { getTranslated } from '../../utils';

interface Props {
    nextDayDef: any;
    isSessionActive: boolean;
    nextWorkoutIdx: number;
    startSession: (dayIdx: number) => void;
    handleSkipClick: (e: React.MouseEvent, dayIdx: number) => void;
    lang: 'en' | 'es';
    t: any;
    tm: (muscle: string) => string;
    estimatedMin: number;
    adherencePct: number | null;
}

/**
 * The hero card on Home — "Up Next" CTA showing the next mesocycle workout
 * with a tap-to-start affordance, or a green "week complete" state.
 */
export const NextSessionCard: React.FC<Props> = React.memo(
    ({ nextDayDef, isSessionActive, nextWorkoutIdx, startSession, handleSkipClick, lang, t, tm, estimatedMin, adherencePct }) => {
        if (!nextDayDef)
            return (
                <div className="w-full glass-card rounded-[2rem] p-8 text-center flex flex-col items-center justify-center min-h-[220px] animate-in-up">
                    <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mb-4 ring-1 ring-green-500/20">
                        <Icon name="Check" size={40} strokeWidth={3} />
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2">{String(t.weekCompleteTitle)}</h3>
                    <p className="text-zinc-400">{String(t.weekCompleteDesc)}</p>
                </div>
            );

        return (
            <div
                id="tut-up-next"
                onClick={() => startSession(nextWorkoutIdx)}
                role="button"
                tabIndex={0}
                aria-label={`${isSessionActive ? 'Resume' : 'Start'} workout: ${String(getTranslated(nextDayDef.dayName, lang))}`}
                className="group relative w-full rounded-[2rem] p-1 overflow-hidden cursor-pointer active:scale-[0.98] transition-transform duration-slow ease-natural"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-700 via-zinc-800 to-zinc-900 rounded-[2rem]" />

                <div className="relative glass-card h-full rounded-[1.8rem] p-6 flex flex-col justify-between min-h-[260px] shadow-2xl overflow-hidden">
                    <div className="absolute -right-10 -top-10 w-64 h-64 bg-primary-600/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-primary-600/20 transition-colors duration-500" />

                    <div className="relative z-10 flex justify-between items-start">
                        <div
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/5 ${isSessionActive ? 'bg-primary-500/20 text-primary-400' : 'bg-white/5 text-zinc-300'}`}
                        >
                            {isSessionActive && <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />}
                            <span className="text-[10px] font-black uppercase tracking-widest">
                                {isSessionActive ? (lang === 'en' ? 'IN PROGRESS' : 'EN CURSO') : String(t.upNext)}
                            </span>
                        </div>

                        {!isSessionActive && (
                            <button
                                onClick={(e) => handleSkipClick(e, nextWorkoutIdx)}
                                aria-label="Skip session"
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors duration-fast ease-natural"
                            >
                                <Icon name="SkipForward" size={20} />
                            </button>
                        )}
                    </div>

                    <div className="relative z-10 mt-6 mb-8">
                        <h3 className="text-4xl font-black text-white leading-[0.95] tracking-tight mb-3 text-balance">
                            {String(getTranslated(nextDayDef.dayName, lang))}
                        </h3>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {(nextDayDef.slots || []).slice(0, 3).map((slot: any, sIdx: number) => (
                                <span
                                    key={sIdx}
                                    className="text-[10px] font-bold uppercase bg-white/10 text-zinc-300 px-2 py-1 rounded-md border border-white/5"
                                >
                                    {String(tm(slot.muscle))}
                                </span>
                            ))}
                            {(nextDayDef.slots || []).length > 3 && (
                                <span className="text-[10px] font-bold uppercase bg-white/10 text-zinc-300 px-2 py-1 rounded-md border border-white/5">
                                    +{(nextDayDef.slots || []).length - 3}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            {estimatedMin > 0 && (
                                <div className="flex items-center gap-1 text-zinc-400">
                                    <Icon name="Clock" size={11} />
                                    <span className="text-[10px] font-bold">~{estimatedMin} {lang === 'es' ? 'min' : 'min'}</span>
                                </div>
                            )}
                            {adherencePct !== null && (
                                <div className="flex items-center gap-1 text-zinc-400">
                                    <Icon name="TrendingUp" size={11} />
                                    <span className="text-[10px] font-bold">
                                        {adherencePct}% {lang === 'es' ? 'adherencia' : 'adherence'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="relative z-10 flex items-center gap-3">
                        <div className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-lg shadow-white/10 animate-bounce-cta">
                            <Icon name={isSessionActive ? 'Play' : 'ArrowRight'} size={26} fill="currentColor" />
                        </div>
                        <span className="text-sm font-bold text-white">
                            {isSessionActive ? (lang === 'en' ? 'Resume Workout' : 'Reanudar') : String(t.tapToStart)}
                        </span>
                    </div>
                </div>
            </div>
        );
    },
);
NextSessionCard.displayName = 'NextSessionCard';
