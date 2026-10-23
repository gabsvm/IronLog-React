// S6: banner, plan header and day selector, moved verbatim from views/HomeViewImpl.tsx.
import React from 'react';
import { pickLang } from '../../utils/i18n';
import { Icon } from '../../components/ui/Icon';
import { triggerHaptic } from '../../utils/audio';
import { getTranslated } from '../../utils';
import { BackupReminderBanner } from '../../components/home/BackupReminderBanner';
import type { HomeViewState } from './useHomeViewState';

export const HomeTopSection: React.FC<{ state: HomeViewState }> = ({ state }) => {
    const { uniqueDaysDone, nextWorkoutIdx, activeMeso, t, h, lang, kongBlock, setShowPlanActions, setShowGuidelines, setShowKongHub, currentGuidelineImages, safeProgram, selectedDayIdx, setSelectedDayIdx } = state;
    if (!activeMeso) return null;

    return (
        <div className="space-y-4 pt-1">
            <BackupReminderBanner />

            {/* Title & Subtitle matching Concepto 01 */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[rgb(var(--text-primary))]">
                    {pickLang(lang, { es: 'Tu entrenamiento', en: 'Your workout' })}
                </h1>
                <p className="mt-0.5 text-xs sm:text-sm font-medium text-[rgb(var(--text-secondary))]">
                    {pickLang(lang, { es: 'Disciplina hoy, resultados mañana.', en: 'Discipline today, results tomorrow.' })}
                </p>
            </div>

            {/* Active Routine / Meso Card */}
            <div className={`flex items-center justify-between gap-3 rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-base))] p-3.5 transition-colors ${kongBlock ? 'kong-home-header' : ''}`}>
                <button
                    type="button"
                    onClick={() => {
                        if (kongBlock) setShowKongHub(true);
                        else setShowPlanActions(true);
                    }}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[rgb(var(--primary-500))]/15 border border-[rgb(var(--primary-500))]/30 text-[rgb(var(--accent-text))] shadow-sm transition-colors duration-200">
                        <Icon name="Dumbbell" size={20} strokeWidth={2.75} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-bold tracking-tight text-[rgb(var(--text-primary))]">
                                {kongBlock ? `KONG · BLOQUE ${kongBlock.block.number}` : activeMeso.name}
                            </span>
                        </div>
                        <p className="truncate text-xs text-[rgb(var(--text-secondary))]">
                            {pickLang(lang, { es: 'Hipertrofia', en: 'Hypertrophy' })} · {activeMeso.targetWeeks || activeMeso.duration} {pickLang(lang, { es: 'semanas', en: 'weeks' })}
                        </p>
                    </div>
                    <Icon name="ChevronRight" size={18} className="shrink-0 text-muted" />
                </button>

                <div className="flex items-center gap-1 shrink-0">
                    {currentGuidelineImages && currentGuidelineImages.length > 0 && (
                        <button
                            id="tut-guidelines"
                            type="button"
                            onClick={() => setShowGuidelines(true)}
                            className="gl-quiet flex h-10 items-center gap-1 rounded-xl px-2.5 text-xs font-semibold"
                            aria-label={pickLang(lang, { en: 'GUIDELINES', es: 'GUÍA' })}
                        >
                            <Icon name="Info" size={13} />
                        </button>
                    )}
                    <button
                        id="tut-settings-btn"
                        type="button"
                        onClick={() => setShowPlanActions(true)}
                        className="gl-quiet flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        aria-label={h.planOptions}
                        title={h.planOptions}
                    >
                        <Icon name="MoreHorizontal" size={18} />
                    </button>
                </div>
            </div>

            {/* Horizontal Pill Carousel Day Selector */}
            <div className="no-scrollbar flex gap-2.5 overflow-x-auto pb-1 pt-0.5">
                {safeProgram.map((day, idx) => {
                    const isSelected = idx === selectedDayIdx;
                    const dayName = String(getTranslated(day.dayName, lang) || `${h.dayWord} ${idx + 1}`);

                    return (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => {
                                triggerHaptic('light');
                                setSelectedDayIdx(idx);
                            }}
                            aria-pressed={isSelected}
                            className={`flex min-w-[96px] flex-1 shrink-0 flex-col items-center justify-center rounded-2xl py-2.5 px-3 transition-all duration-200 ${
                                isSelected
                                    ? 'border-2 border-[rgb(var(--primary-500))] bg-[rgb(var(--primary-500))]/18 text-[rgb(var(--text-primary))] shadow-[0_4px_16px_rgba(var(--primary-500),0.22)] scale-[1.02]'
                                    : 'border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-base))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-raised))]'
                            }`}
                        >
                            <span className={`text-[11px] font-bold uppercase tracking-wider ${isSelected ? 'text-[rgb(var(--accent-text))] font-black' : 'text-muted'}`}>
                                {pickLang(lang, { es: 'Día', en: 'Day' })} {idx + 1}
                            </span>
                            <span className={`mt-0.5 truncate max-w-full text-xs font-semibold ${isSelected ? 'text-[rgb(var(--text-primary))] font-bold' : 'text-[rgb(var(--text-primary))]'}`}>
                                {dayName}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
