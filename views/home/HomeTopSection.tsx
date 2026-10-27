// S6: banner, plan header and day selector, moved verbatim from views/HomeViewImpl.tsx.
import React from 'react';
import { pickLang } from '../../utils/i18n';
import { Icon } from '../../components/ui/Icon';
import { triggerHaptic } from '../../utils/audio';
import { BackupReminderBanner } from '../../components/home/BackupReminderBanner';
import type { HomeViewState } from './useHomeViewState';

export const HomeTopSection: React.FC<{ state: HomeViewState }> = ({ state }) => {
    const { uniqueDaysDone, activeMeso, setActiveMeso, t, h, lang, kongBlock, isPro, checkPro, setShowPlanActions, setShowGuidelines, setShowKongHub, currentGuidelineImages, safeProgram } = state;
    if (!activeMeso) return null;
    const totalWeeks = activeMeso.targetWeeks || activeMeso.duration || 1;
    const goWeek = (delta: number) => { const next = Math.min(totalWeeks, Math.max(1, activeMeso.week + delta)); if (next === activeMeso.week) return; triggerHaptic('light'); setActiveMeso(prev => (prev ? { ...prev, week: next } : prev)); };
    return (
        <>
            <BackupReminderBanner />
            {/* 1. Program Name, Badges & Plan Actions */}
            <div data-testid="home-hub-header" className={`flex items-start justify-between gap-3 pt-1 ${kongBlock ? 'kong-home-header' : ''}`}>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-2xl font-black text-white tracking-[-0.03em] truncate">{activeMeso.name}</h2>
                        {kongBlock && (
                            <button
                                type="button"
                                onClick={() => setShowKongHub(true)}
                                className="rounded-full bg-surface-raised px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary-400 border border-border-subtle"
                            >
                                {`KONG · B${kongBlock.block.number}`}
                            </button>
                        )}
                        {currentGuidelineImages && currentGuidelineImages.length > 0 && (
                            <button
                                id="tut-guidelines"
                                type="button"
                                onClick={() => checkPro("Guidelines") && setShowGuidelines(true)}
                                className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-surface-raised text-blue-400 border border-border-subtle hover:text-white transition-colors flex items-center gap-1 active:scale-95"
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
                    className="relative text-zinc-400 hover:text-white p-1.5 after:absolute after:-inset-1 after:content-[''] rounded-lg active:bg-surface-raised transition-colors shrink-0"
                    aria-label={h.planOptions}
                    title={h.planOptions}
                >
                    <Icon name="MoreHorizontal" size={20} />
                </button>
            </div>

            {/* 2. Week selector (prev/next + deload) */}
            <div data-testid="home-week-selector" className="flex items-center justify-between gap-2 rounded-[24px] card-reference px-2 py-2">
                <button type="button" onClick={() => goWeek(-1)} disabled={activeMeso.week <= 1} aria-label={pickLang(lang, { en: 'Previous week', es: 'Semana anterior' })} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-zinc-300 transition-colors active:bg-surface-raised disabled:opacity-30"><Icon name="ChevronLeft" size={20} /></button>
                <div className="flex min-w-0 items-center gap-2 text-center">
                    <span className="text-sm font-bold text-white">{t.week} {activeMeso.week} {h.ofWord} {totalWeeks}</span>
                    {activeMeso.isDeload && <span className="rounded-full bg-surface-raised px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary-400 border border-border-subtle">DELOAD</span>}
                </div>
                <button type="button" onClick={() => goWeek(1)} disabled={activeMeso.week >= totalWeeks} aria-label={pickLang(lang, { en: 'Next week', es: 'Semana siguiente' })} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-zinc-300 transition-colors active:bg-surface-raised disabled:opacity-30"><Icon name="ChevronRight" size={20} /></button>
            </div>
        </>
    );
};
