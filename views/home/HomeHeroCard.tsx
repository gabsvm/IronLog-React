// S6: selected-day hero card, moved verbatim from views/HomeViewImpl.tsx.
import React from 'react';
import { Icon } from '../../components/ui/Icon';
import { getTranslated } from '../../utils';
import type { HomeViewState } from './useHomeViewState';

export const HomeHeroCard: React.FC<{ state: HomeViewState }> = ({ state }) => {
    const { startSession, uniqueDaysDone, nextWorkoutIdx, exercises, lang, activeSession, activeMeso, t, h, tm, safeProgram, selectedDayIdx, selectedDayEstimatedMin, handleSkipClick } = state;
    if (!activeMeso) return null;
    return (
        <>
            {(() => {
                const dayDef = safeProgram[selectedDayIdx];
                if (!dayDef) return null;

                const isDone = uniqueDaysDone.has(selectedDayIdx);
                const isNext = selectedDayIdx === nextWorkoutIdx;
                const isSelectedActive = activeSession && activeSession.mesoId === activeMeso.id && activeSession.dayIdx === selectedDayIdx;
                const dayEstimatedMin = selectedDayEstimatedMin;
                const slots = dayDef.slots || [];
                const totalSets = slots.reduce((s: number, slot: any) => s + (slot.setTarget || 3), 0);
                const previewSlots = slots.slice(0, 3);
                const extraSlotsCount = Math.max(0, slots.length - 3);

                return (
                    <div
                        id="tut-up-next"
                        onClick={() => startSession(selectedDayIdx)}
                        role="button"
                        tabIndex={0}
                        className="card-reference p-4 cursor-pointer transition-all active:scale-[0.99] shadow-lg"
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                                <h3 className="text-2xl font-bold text-white tracking-tight truncate">
                                    {String(getTranslated(dayDef.dayName, lang))}
                                </h3>
                                <div className="flex flex-wrap gap-1.5 mt-2 mb-2">
                                    {slots.slice(0, 3).map((slot: any, sIdx: number) => (
                                        <span key={sIdx} className="chip-reference">
                                            {String(tm(slot.muscle))}
                                        </span>
                                    ))}
                                    {extraSlotsCount > 0 && (
                                        <span className="chip-reference text-muted">
                                            +{extraSlotsCount}
                                        </span>
                                    )}
                                </div>
                            </div>
                            {!isDone && !isSelectedActive && (
                                <button
                                    type="button"
                                    onClick={(e) => handleSkipClick(e, selectedDayIdx)}
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-400 hover:text-white transition-colors"
                                    aria-label={t.skipSession}
                                    title={t.skipSession}
                                >
                                    <Icon name="SkipForward" size={16} />
                                </button>
                            )}
                        </div>

                        <div className="text-xs text-muted flex items-center gap-1.5 mt-1 mb-3">
                            <Icon name="Clock" size={12} />
                            <span>~{dayEstimatedMin > 0 ? dayEstimatedMin : 45} min</span>
                            <span>·</span>
                            <span>{slots.length} {h.exercisesLower}</span>
                            <span>·</span>
                            <span>{totalSets} {h.setsLower}</span>
                        </div>

                        {previewSlots.length > 0 && (
                            <div className="border-t border-border-subtle pt-2.5 text-xs space-y-1.5 leading-relaxed">
                                {previewSlots.map((slot: any, sIdx: number) => {
                                    const exDef = exercises?.find((e: any) => e.id === slot.exerciseId);
                                    const name = exDef ? getTranslated(exDef.name, lang) : slot.exerciseId || tm(slot.muscle);
                                    const repsStr = slot.reps || '8–12';
                                    const setsCount = slot.setTarget || 3;
                                    return (
                                        <div key={sIdx} className="flex justify-between items-center text-zinc-300">
                                            <span className="truncate pr-2 font-medium">{String(name)}</span>
                                            <span className="text-muted tabular-nums shrink-0">{setsCount} × {repsStr}</span>
                                        </div>
                                    );
                                })}
                                {extraSlotsCount > 0 && (
                                    <div className="text-xs text-muted pt-0.5">
                                        {`${h.andMoreA} ${extraSlotsCount} ${h.andMoreB}`}
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                startSession(selectedDayIdx);
                            }}
                            className="btn-primary-reference w-full h-11.5 mt-3.5 rounded-xl bg-primary-500 text-zinc-950 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary-400 active:scale-98 transition-all shadow-sm"
                        >
                            <Icon name={isSelectedActive ? 'Play' : isDone ? 'Repeat' : 'ArrowRight'} size={18} fill="currentColor" />
                            <span>
                                {isSelectedActive
                                    ? h.resume
                                    : isDone
                                    ? h.trainAgain
                                    : `${h.start} ${String(getTranslated(dayDef.dayName, lang))}`}
                            </span>
                        </button>
                    </div>
                );
            })()}
        </>
    );
};
