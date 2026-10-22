import React from 'react';
import { pickLang } from '../../utils/i18n';
import { Icon } from '../../components/ui/Icon';
import { getTranslated } from '../../utils';
import type { HomeViewState } from './useHomeViewState';

const HERO_COPY = {
    es: { day: 'Día', inProgress: 'En curso', completed: 'Completado', next: 'Tu próxima sesión', details: 'Detalles del entrenamiento' },
    en: { day: 'Day', inProgress: 'In progress', completed: 'Completed', next: 'Your next session', details: 'Workout details' },
};

export const HomeHeroCard: React.FC<{ state: HomeViewState }> = ({ state }) => {
    const { startSession, onResumeSession, uniqueDaysDone, exercises, lang, activeSession, activeMeso, t, h, tm, safeProgram, selectedDayIdx, selectedDayEstimatedMin, handleSkipClick } = state;
    if (!activeMeso) return null;
    const dayDef = safeProgram[selectedDayIdx];
    if (!dayDef) return null;
    const isDone = uniqueDaysDone.has(selectedDayIdx);
    const isSelectedActive = Boolean(activeSession && activeSession.mesoId === activeMeso.id && activeSession.dayIdx === selectedDayIdx);
    const slots = dayDef.slots || [];
    const totalSets = slots.reduce((sum, slot) => sum + (slot.setTarget || 3), 0);
    const previewSlots = slots.slice(0, 3);
    const extraSlotsCount = slots.length - previewSlots.length;
    const dayName = String(getTranslated(dayDef.dayName, lang));
    const ui = pickLang(lang, HERO_COPY);

    return (
        <article id="tut-up-next" className="gl-panel space-y-5 p-5 sm:p-7">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className={`gl-eyebrow ${isDone ? '' : '!text-[rgb(var(--accent-text))]'}`}>{`${ui.day} ${selectedDayIdx + 1} · ${isSelectedActive ? ui.inProgress : isDone ? ui.completed : ui.next}`}</p>
                    <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[rgb(var(--text-primary))] sm:text-4xl">{dayName}</h2>
                </div>
                {!isDone && !isSelectedActive && <button type="button" onClick={event => handleSkipClick(event, selectedDayIdx)} className="gl-quiet flex h-11 w-11 shrink-0 items-center justify-center" aria-label={t.skipSession} title={t.skipSession}><Icon name="SkipForward" size={18} /></button>}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-[rgb(var(--text-secondary))]" aria-label={ui.details}>
                {selectedDayEstimatedMin > 0 && <span className="inline-flex items-center gap-1.5"><Icon name="Clock" size={16} />~{selectedDayEstimatedMin} min</span>}
                <span className="inline-flex items-center gap-1.5"><Icon name="Dumbbell" size={16} />{slots.length} {h.exercisesLower}</span>
                <span className="inline-flex items-center gap-1.5"><Icon name="Layers" size={16} />{totalSets} {h.setsLower}</span>
            </div>
            {/* The action precedes the exercise preview at every viewport size. */}
            {!(isSelectedActive && onResumeSession) && <button type="button" data-testid="hero-start-workout" id="hero-start-workout" onClick={() => isSelectedActive && onResumeSession ? onResumeSession() : startSession(selectedDayIdx)} className={`${activeSession ? 'gl-quiet' : 'gl-primary'} flex min-h-[52px] w-full items-center justify-center gap-2 px-4 text-[15px] font-semibold`}>
                <Icon name={isSelectedActive ? 'Play' : isDone ? 'Repeat' : 'ArrowRight'} size={18} />
                <span>{isSelectedActive ? h.resume : isDone ? h.trainAgain : `${h.start} ${dayName}`}</span>
            </button>}
            {previewSlots.length > 0 && <ol className="border-t border-[rgb(var(--border-subtle))] pt-2">
                {previewSlots.map((slot, index) => {
                    const exerciseDef = exercises?.find(exercise => exercise.id === slot.exerciseId);
                    const name = exerciseDef ? getTranslated(exerciseDef.name, lang) : slot.exerciseId || tm(slot.muscle);
                    return <li key={index} className="flex items-start gap-3 py-2.5 text-sm">
                        <span className="w-5 shrink-0 pt-px text-xs tabular-nums text-[rgb(var(--text-muted))]" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                        <span className="min-w-0 flex-1 font-medium text-[rgb(var(--text-primary))]">{String(name)}</span>
                        <span className="shrink-0 tabular-nums text-[rgb(var(--text-secondary))]">{slot.setTarget || 3} × {slot.reps || '8–12'}</span>
                    </li>;
                })}
                {extraSlotsCount > 0 && <li className="pl-8 pt-2 text-xs text-[rgb(var(--text-secondary))]">{h.andMoreA} {extraSlotsCount} {extraSlotsCount === 1 ? h.andMoreOneB : h.andMoreB}</li>}
            </ol>}
        </article>
    );
};
