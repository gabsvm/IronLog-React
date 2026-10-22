// S6: banner, plan header and day selector, moved verbatim from views/HomeViewImpl.tsx.
import React from 'react';
import { pickLang } from '../../utils/i18n';
import { Icon } from '../../components/ui/Icon';
import { triggerHaptic } from '../../utils/audio';
import { BackupReminderBanner } from '../../components/home/BackupReminderBanner';
import type { HomeViewState } from './useHomeViewState';

export const HomeTopSection: React.FC<{ state: HomeViewState }> = ({ state }) => {
    const { uniqueDaysDone, nextWorkoutIdx, activeMeso, t, h, lang, kongBlock, isPro, checkPro, setShowPlanActions, setShowGuidelines, setShowKongHub, currentGuidelineImages, safeProgram, selectedDayIdx, setSelectedDayIdx } = state;
    const todayLabel = new Date().toLocaleDateString(pickLang(lang, { es: 'es-ES', en: 'en-US' }), { weekday: 'long', day: 'numeric', month: 'long' });
    if (!activeMeso) return null;
    return (
        <>
            <BackupReminderBanner />
            {/* 1. Program Name, Badges & Plan Actions */}
            <div className={`flex items-start justify-between gap-3 pt-1 ${kongBlock ? 'kong-home-header' : ''}`}>
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-[rgb(var(--text-secondary))] first-letter:uppercase">{todayLabel}</p>
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                        <h1 className="text-2xl font-semibold tracking-tight text-[rgb(var(--text-primary))]">{activeMeso.name}</h1>
                        {kongBlock && (
                            <button
                                type="button"
                                onClick={() => setShowKongHub(true)}
                                className="gl-quiet min-h-[44px] px-3 text-xs font-semibold"
                            >
                                {`KONG · B${kongBlock.block.number}`}
                            </button>
                        )}
                        {currentGuidelineImages && currentGuidelineImages.length > 0 && (
                            <button
                                id="tut-guidelines"
                                type="button"
                                onClick={() => checkPro("Guidelines") && setShowGuidelines(true)}
                                className="gl-quiet flex min-h-[44px] items-center gap-1 px-3 text-xs font-semibold"
                            >
                                <Icon name="Info" size={12} /> {pickLang(lang, { en: 'GUIDELINES', es: 'GUÍA' })} {!isPro && <Icon name="Lock" size={10} className="text-yellow-500 ml-0.5" />}
                            </button>
                        )}
                    </div>
                    <div className="text-xs text-muted mt-0.5">
                        {t.week} {activeMeso.week} {h.ofWord} {activeMeso.targetWeeks || activeMeso.duration} · {uniqueDaysDone.size} {h.ofWord} {safeProgram.length} {h.daysWord}
                    </div>
                </div>
                <button
                    id="tut-settings-btn"
                    type="button"
                    onClick={() => setShowPlanActions(true)}
                    className="gl-quiet flex h-11 w-11 shrink-0 items-center justify-center"
                    aria-label={h.planOptions}
                    title={h.planOptions}
                >
                    <Icon name="MoreHorizontal" size={20} />
                </button>
            </div>

            {/* 3. Compact Day Selector */}
            <div
                className={`grid gap-1.5 ${safeProgram.length <= 5 ? '' : 'overflow-x-auto scroll-container'}`}
                style={{
                    gridTemplateColumns: safeProgram.length <= 5
                        ? `repeat(${safeProgram.length}, minmax(0, 1fr))`
                        : `repeat(${safeProgram.length}, minmax(70px, 1fr))`
                }}
            >
                {safeProgram.map((day, idx) => {
                    const isDone = uniqueDaysDone.has(idx);
                    const isTodayOrNext = idx === nextWorkoutIdx;
                    const isSelected = idx === selectedDayIdx;

                    return (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => {
                                triggerHaptic('light');
                                setSelectedDayIdx(idx);
                            }}
                            aria-pressed={isSelected}
                            className={`min-h-[56px] rounded-xl border px-1.5 py-2.5 text-center ${
                                isSelected
                                    ? 'border-primary-500 bg-primary-500/10 text-[rgb(var(--text-primary))]'
                                    : 'border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-base))] text-[rgb(var(--text-secondary))]'
                            }`}
                        >
                            <div className="flex h-4 items-center justify-center text-xs font-medium">
                                {isTodayOrNext ? (
                                    <span className="font-semibold">{h.today}</span>
                                ) : isDone ? (
                                    <span className="text-muted"><Icon name="Check" size={11} strokeWidth={3} /></span>
                                ) : (
                                    <span>&nbsp;</span>
                                )}
                            </div>
                            <div className="mt-0.5 truncate text-sm font-medium">
                                {`${h.dayWord} ${idx + 1}`}
                            </div>
                        </button>
                    );
                })}
            </div>
        </>
    );
};
