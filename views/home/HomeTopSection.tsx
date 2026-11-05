// S6: banner, plan header and day selector, moved verbatim from views/HomeViewImpl.tsx.
import React from 'react';
import { pickLang } from '../../utils/i18n';
import { Icon } from '../../components/ui/Icon';
import { triggerHaptic } from '../../utils/audio';
import { BackupReminderBanner } from '../../components/home/BackupReminderBanner';
import { getTranslated } from '../../utils';
import type { HomeViewState } from './useHomeViewState';

export const HomeTopSection: React.FC<{ state: HomeViewState }> = ({ state }) => {
    const {
        uniqueDaysDone, activeMeso, setActiveMeso, t, h, lang, kongBlock, isPro,
        checkPro, setShowPlanActions, setShowGuidelines, setShowKongHub,
        currentGuidelineImages, safeProgram, selectedDayIdx
    } = state;

    if (!activeMeso) return null;
    const totalWeeks = activeMeso.targetWeeks || activeMeso.duration || 1;
    const goWeek = (delta: number) => {
        const next = Math.min(totalWeeks, Math.max(1, activeMeso.week + delta));
        if (next === activeMeso.week) return;
        triggerHaptic('light');
        setActiveMeso(prev => (prev ? { ...prev, week: next } : prev));
    };

    const firstIncompleteDayIdx = safeProgram.findIndex((_, idx) => !uniqueDaysDone.has(idx));
    const effectiveDayIdx = selectedDayIdx >= 0 ? selectedDayIdx : (firstIncompleteDayIdx >= 0 ? firstIncompleteDayIdx : 0);
    const dayName = safeProgram[effectiveDayIdx] ? String(getTranslated(safeProgram[effectiveDayIdx].dayName, lang)) : '';
    const mesoTitle = activeMeso.name || (activeMeso as any).title || '';

    return (
        <>
            <BackupReminderBanner />

            {/* 1. WEEK X DAY Y Header Block */}
            <div data-testid="home-hub-header" className={`flex items-start justify-between gap-3 pt-1 ${kongBlock ? 'kong-home-header' : ''}`}>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center">
                        <span className="text-[22px] font-black uppercase tracking-tight text-white">
                            {pickLang(lang, { es: 'SEMANA', en: 'WEEK' })} {activeMeso.week}
                        </span>
                        <span className="text-[22px] font-black uppercase tracking-tight text-zinc-500 ml-1.5">
                            {pickLang(lang, { es: 'DÍA', en: 'DAY' })} {effectiveDayIdx + 1}
                        </span>
                    </div>
                    <div data-testid="home-hub-subtitle" className="mt-0.5 flex items-center gap-1.5 text-xs text-muted truncate">
                        <span className="font-semibold text-zinc-200 truncate">{dayName}</span>
                        {mesoTitle && (
                            <>
                                <span className="text-zinc-600 shrink-0">·</span>
                                <span className="truncate">{mesoTitle}</span>
                            </>
                        )}
                    </div>
                    {(kongBlock || (currentGuidelineImages && currentGuidelineImages.length > 0)) && (
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {kongBlock && (
                                <button
                                    type="button"
                                    onClick={() => setShowKongHub(true)}
                                    className="rounded-[4px] bg-surface-raised px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary-400 border border-border-subtle"
                                >
                                    {`KONG · B${kongBlock.block.number}`}
                                </button>
                            )}
                            {currentGuidelineImages && currentGuidelineImages.length > 0 && (
                                <button
                                    id="tut-guidelines"
                                    type="button"
                                    onClick={() => checkPro("Guidelines") && setShowGuidelines(true)}
                                    className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-[4px] bg-surface-raised text-blue-400 border border-border-subtle hover:text-white transition-colors flex items-center gap-1 active:scale-95"
                                >
                                    <Icon name="Info" size={12} /> {pickLang(lang, { en: 'GUIDELINES', es: 'GUÍA' })} {!isPro && <Icon name="Lock" size={10} className="text-yellow-500 ml-0.5" />}
                                </button>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <button
                        id="tut-settings-btn"
                        type="button"
                        onClick={() => setShowPlanActions(true)}
                        className="relative flex h-8 w-8 items-center justify-center rounded-[4px] text-zinc-400 hover:text-white hover:bg-surface-raised active:scale-95 transition-all"
                        aria-label={h.planOptions}
                        title={h.planOptions}
                    >
                        <Icon name="MoreVertical" size={19} />
                    </button>
                </div>
            </div>

            {/* 2. Week selector (prev/next + deload) */}
            <div data-testid="home-week-selector" className="flex items-center justify-between gap-2 rounded-[6px] border border-border-subtle bg-surface-raised/40 p-2">
                <button
                    type="button"
                    onClick={() => goWeek(-1)}
                    disabled={activeMeso.week <= 1}
                    aria-label={pickLang(lang, { en: 'Previous week', es: 'Semana anterior' })}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] text-zinc-300 transition-colors hover:text-white active:bg-surface-raised disabled:opacity-30"
                >
                    <Icon name="ChevronLeft" size={18} />
                </button>
                <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none">
                    {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((wNum) => {
                        const isCurrent = wNum === activeMeso.week;
                        return (
                            <button
                                key={wNum}
                                type="button"
                                onClick={() => {
                                    triggerHaptic('light');
                                    setActiveMeso(prev => prev ? { ...prev, week: wNum } : prev);
                                }}
                                className={`flex h-8 min-w-[32px] px-2 items-center justify-center rounded-[6px] text-xs font-bold transition-all ${
                                    isCurrent
                                        ? 'bg-primary-500 text-zinc-950 font-black'
                                        : 'border border-border-subtle bg-surface-raised text-zinc-400 hover:text-white'
                                }`}
                            >
                                W{wNum}
                            </button>
                        );
                    })}
                    {activeMeso.isDeload && (
                        <span className="rounded-[6px] border border-border-subtle bg-surface-raised px-2 py-1 text-[10px] font-black uppercase tracking-wider text-primary-400">
                            DELOAD
                        </span>
                    )}
                </div>
                <button
                    type="button"
                    onClick={() => goWeek(1)}
                    disabled={activeMeso.week >= totalWeeks}
                    aria-label={pickLang(lang, { en: 'Next week', es: 'Semana siguiente' })}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] text-zinc-300 transition-colors hover:text-white active:bg-surface-raised disabled:opacity-30"
                >
                    <Icon name="ChevronRight" size={18} />
                </button>
            </div>
        </>
    );
};
