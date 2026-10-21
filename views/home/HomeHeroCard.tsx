// Editorial exercise hero: premium visual language, original workout logic preserved.
import React from 'react';
import { pickLang } from '../../utils/i18n';
import { Icon } from '../../components/ui/Icon';
import { getTranslated } from '../../utils';
import type { HomeViewState } from './useHomeViewState';

const HERO_COPY = {
    es: { day: 'DÍA', inProgress: 'EN CURSO', completed: 'COMPLETADO', next: 'TU PRÓXIMA SESIÓN', details: 'Detalles del entrenamiento' },
    en: { day: 'DAY', inProgress: 'IN PROGRESS', completed: 'COMPLETED', next: 'YOUR NEXT SESSION', details: 'Workout details' },
};

export const HomeHeroCard: React.FC<{ state: HomeViewState }> = ({ state }) => {
    const { startSession, uniqueDaysDone, exercises, lang, activeSession, activeMeso, t, h, tm, safeProgram, selectedDayIdx, selectedDayEstimatedMin, handleSkipClick } = state;
    if (!activeMeso) return null;

    const dayDef = safeProgram[selectedDayIdx];
    if (!dayDef) return null;

    const isDone = uniqueDaysDone.has(selectedDayIdx);
    const isSelectedActive = Boolean(activeSession && activeSession.mesoId === activeMeso.id && activeSession.dayIdx === selectedDayIdx);
    const slots = dayDef.slots || [];
    const totalSets = slots.reduce((sum: number, slot: any) => sum + (slot.setTarget || 3), 0);
    const previewSlots = slots.slice(0, 3);
    const extraSlotsCount = Math.max(0, slots.length - previewSlots.length);
    const dayName = String(getTranslated(dayDef.dayName, lang));
    const ui = pickLang(lang, HERO_COPY);

    return (
        <article
            id="tut-up-next"
            key={selectedDayIdx}
            className="premium-hero expressive-reveal relative isolate overflow-hidden"
        >
            {/* CSS/SVG artwork is decorative, never covers interactive elements. */}
            <svg className="premium-hero__art" aria-hidden="true" focusable="false" viewBox="0 0 240 220" fill="none">
                <g stroke="currentColor" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M39 143 203 61" strokeWidth="10" />
                    <rect x="22" y="116" width="26" height="60" rx="8" transform="rotate(-27 22 116)" />
                    <rect x="50" y="110" width="15" height="48" rx="6" transform="rotate(-27 50 110)" />
                    <rect x="160" y="43" width="15" height="48" rx="6" transform="rotate(-27 160 43)" />
                    <rect x="178" y="27" width="26" height="60" rx="8" transform="rotate(-27 178 27)" />
                </g>
                <circle cx="126" cy="111" r="83" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 13" />
            </svg>

            <div className="premium-hero__content">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="premium-hero__eyebrow">
                            {`${ui.day} ${selectedDayIdx + 1} · ${isSelectedActive ? ui.inProgress : isDone ? ui.completed : ui.next}`}
                        </div>
                        <h3 className="premium-hero__title">{dayName}</h3>
                    </div>
                    {!isDone && !isSelectedActive && (
                        <button
                            type="button"
                            onClick={(event) => { event.stopPropagation(); handleSkipClick(event, selectedDayIdx); }}
                            className="premium-hero__skip relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors"
                            aria-label={t.skipSession}
                            title={t.skipSession}
                        >
                            <Icon name="SkipForward" size={18} />
                        </button>
                    )}
                </div>
                <div className="premium-hero__metrics" aria-label={ui.details}>
                    <span><Icon name="Clock" size={13} /> ~{selectedDayEstimatedMin > 0 ? selectedDayEstimatedMin : 45} min</span>
                    <span><Icon name="Dumbbell" size={13} /> {slots.length} {h.exercisesLower}</span>
                    <span><Icon name="Layers" size={13} /> {totalSets} {h.setsLower}</span>
                </div>
                <button
                    type="button"
                    data-testid="hero-start-workout"
                    id="hero-start-workout"
                    onClick={(event) => { event.stopPropagation(); startSession(selectedDayIdx); }}
                    className="premium-hero__cta hero-cta-btn expressive-press mt-4 flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full px-4 text-sm font-bold transition-colors"
                >
                    <Icon name={isSelectedActive ? 'Play' : isDone ? 'Repeat' : 'ArrowRight'} size={18} />
                    <span>{isSelectedActive ? h.resume : isDone ? h.trainAgain : `${h.start} ${dayName}`}</span>
                </button>
                {previewSlots.length > 0 && (
                    <div className="premium-hero__preview mt-4">
                        {previewSlots.map((slot: any, index: number) => {
                            const exerciseDef = exercises?.find((exercise: any) => exercise.id === slot.exerciseId);
                            const name = exerciseDef ? getTranslated(exerciseDef.name, lang) : slot.exerciseId || tm(slot.muscle);
                            return (
                                <div key={index} className="premium-hero__exercise">
                                    <span className="min-w-0 flex-1 truncate font-semibold">{String(name)}</span>
                                    <span className="shrink-0 tabular-nums">{slot.setTarget || 3} × {slot.reps || '8–12'}</span>
                                </div>
                            );
                        })}
                        {extraSlotsCount > 0 && (
                            <p className="premium-hero__more">
                                {h.andMoreA} {extraSlotsCount} {extraSlotsCount === 1 ? h.andMoreOneB : h.andMoreB}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </article>
    );
};
