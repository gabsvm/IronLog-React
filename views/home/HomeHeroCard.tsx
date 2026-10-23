import React from 'react';
import { pickLang } from '../../utils/i18n';
import { Icon } from '../../components/ui/Icon';
import { getTranslated } from '../../utils';
import type { HomeViewState } from './useHomeViewState';

const HERO_COPY = {
    es: { day: 'Día', inProgress: 'En curso', completed: 'Completado', next: 'Tu próxima sesión', details: 'Detalles del entrenamiento', startTraining: 'Empezar entrenamiento', resumeTraining: 'Reanudar entrenamiento', repeatTraining: 'Repetir entrenamiento' },
    en: { day: 'Day', inProgress: 'In progress', completed: 'Completed', next: 'Your next session', details: 'Workout details', startTraining: 'Start workout', resumeTraining: 'Resume workout', repeatTraining: 'Repeat workout' },
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
    const dayName = String(getTranslated(dayDef.dayName, lang));
    const ui = pickLang(lang, HERO_COPY);

    return (
        <article
            id="tut-up-next"
            className="relative overflow-hidden rounded-[26px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-base))] p-5 sm:p-6 shadow-xl"
            style={{
                backgroundImage: 'radial-gradient(circle at 85% 15%, rgba(var(--primary-500), 0.08) 0%, rgba(18, 21, 27, 0) 65%)',
            }}
        >
            {/* Header: Día X · Nombre + Arrow */}
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[rgb(var(--text-primary))]">
                        {`${ui.day} ${selectedDayIdx + 1} · ${dayName}`}
                    </h2>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    {!isDone && !isSelectedActive && (
                        <button
                            type="button"
                            onClick={event => handleSkipClick(event, selectedDayIdx)}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-raised/70 border border-white/5 text-muted hover:text-white"
                            aria-label={t.skipSession}
                            title={t.skipSession}
                        >
                            <Icon name="SkipForward" size={17} />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => isSelectedActive && onResumeSession ? onResumeSession() : startSession(selectedDayIdx)}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-raised/80 border border-white/5 text-[rgb(var(--text-primary))] hover:bg-surface-elevated transition-colors"
                        aria-label={ui.startTraining}
                    >
                        <Icon name="ArrowRight" size={18} />
                    </button>
                </div>
            </div>

            {/* Chips Row: 6 ejercicios, 19 series, 55 min */}
            <div className="mt-3.5 flex flex-wrap gap-2 text-xs text-[rgb(var(--text-secondary))]" aria-label={ui.details}>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/40 border border-white/5 px-3 py-1.5">
                    <Icon name="Dumbbell" size={14} className="text-primary-500" />
                    <span>{slots.length} {h.exercisesLower}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/40 border border-white/5 px-3 py-1.5">
                    <Icon name="Layers" size={14} className="text-cyan-400" />
                    <span>{totalSets} {h.setsLower}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/40 border border-white/5 px-3 py-1.5">
                    <Icon name="Clock" size={14} className="text-amber-400" />
                    <span>{selectedDayEstimatedMin || 55} min</span>
                </span>
            </div>

            {/* Exercise previews inside card */}
            {previewSlots.length > 0 && (
                <div className="mt-4 space-y-2">
                    {previewSlots.map((slot, index) => {
                        const exerciseDef = exercises?.find(exercise => exercise.id === slot.exerciseId);
                        const name = exerciseDef ? getTranslated(exerciseDef.name, lang) : slot.exerciseId || tm(slot.muscle);
                        const muscle = slot.muscle ? tm(slot.muscle) : exerciseDef?.muscle ? tm(exerciseDef.muscle) : '';

                        return (
                            <div
                                key={index}
                                className="flex items-center justify-between gap-3 rounded-2xl bg-[rgb(var(--surface-raised)/0.65)] border border-white/5 p-3 backdrop-blur-sm"
                            >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/45 text-[rgb(var(--text-muted))]">
                                    <Icon name="Dumbbell" size={18} strokeWidth={2.2} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-[rgb(var(--text-primary))]">
                                        {String(name)}
                                    </p>
                                    <p className="truncate text-xs text-muted">
                                        {muscle || (slot.setTarget ? `${slot.setTarget} series` : '')}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="flex h-8 w-8 items-center justify-center text-muted hover:text-white"
                                    aria-label="Opciones"
                                >
                                    <Icon name="MoreVertical" size={16} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Primary Action Button: Full width lime pill */}
            <div className="mt-5">
                <button
                    type="button"
                    data-testid="hero-start-workout"
                    id="hero-start-workout"
                    onClick={() => isSelectedActive && onResumeSession ? onResumeSession() : startSession(selectedDayIdx)}
                    className="flex min-h-[54px] w-full items-center justify-center gap-2 rounded-full bg-[rgb(var(--primary-500))] px-6 text-base font-extrabold text-[rgb(var(--accent-ink))] shadow-[0_8px_24px_rgba(var(--primary-500),0.32)] transition-all duration-200 active:scale-[0.98] hover:brightness-105"
                >
                    <Icon name={isSelectedActive ? 'Play' : isDone ? 'Repeat' : 'Play'} size={20} strokeWidth={2.8} />
                    <span>{isSelectedActive ? ui.resumeTraining : isDone ? ui.repeatTraining : ui.startTraining}</span>
                </button>
            </div>
        </article>
    );
};
