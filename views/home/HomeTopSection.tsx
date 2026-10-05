// S6: banner, plan header and day selector, moved verbatim from views/HomeViewImpl.tsx.
import React from 'react';
import { Icon } from '../../components/ui/Icon';
import { triggerHaptic } from '../../utils/audio';
import { BackupReminderBanner } from '../../components/home/BackupReminderBanner';
import type { HomeViewState } from './useHomeViewState';

export const HomeTopSection: React.FC<{ state: HomeViewState }> = ({ state }) => {
    const { uniqueDaysDone, nextWorkoutIdx, activeMeso, t, h, kongBlock, isPro, checkPro, setShowPlanActions, setShowGuidelines, setShowKongHub, currentGuidelineImages, safeProgram, selectedDayIdx, setSelectedDayIdx } = state;
    if (!activeMeso) return null;
    return (
        <>
            <BackupReminderBanner />
            {/* 1. Program Name, Badges & Plan Actions */}
            <div className={`flex items-start justify-between gap-3 pt-1 ${kongBlock ? 'kong-home-header' : ''}`}>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg font-semibold text-white tracking-tight truncate">{activeMeso.name}</h2>
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
                                <Icon name="Info" size={12} /> GUIDELINES {!isPro && <Icon name="Lock" size={10} className="text-yellow-500 ml-0.5" />}
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
                    className="text-zinc-400 hover:text-white p-1.5 rounded-lg active:bg-surface-raised transition-colors shrink-0"
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
                            className={`py-2 px-1 text-center rounded-xl transition-all active:scale-95 ${
                                isSelected
                                    ? 'border-1.5 border-primary-500 bg-primary-500/10 text-white font-medium shadow-sm'
                                    : isDone
                                    ? 'card-reference bg-surface-raised/40 text-muted'
                                    : 'card-reference bg-surface-raised text-zinc-300'
                            }`}
                        >
                            <div className="text-[10px] font-semibold tracking-wide h-4 flex items-center justify-center">
                                {isTodayOrNext ? (
                                    <span className="text-primary-400 font-bold">{h.today}</span>
                                ) : isDone ? (
                                    <span className="text-muted"><Icon name="Check" size={11} strokeWidth={3} /></span>
                                ) : (
                                    <span>&nbsp;</span>
                                )}
                            </div>
                            <div className="text-xs font-semibold mt-0.5 truncate">
                                {`${h.dayWord} ${idx + 1}`}
                            </div>
                        </button>
                    );
                })}
            </div>
        </>
    );
};
