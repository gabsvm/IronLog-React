// Task 2 (RP restructure §3.1): week day rows for the mesocycle hub.
// State comes only from HomeViewState; tapping a row selects that day.
import React from 'react';
import { pickLang } from '../../utils/i18n';
import { Icon } from '../../components/ui/Icon';
import { getTranslated } from '../../utils';
import { triggerHaptic } from '../../utils/audio';
import type { HomeViewState } from './useHomeViewState';

const STATUS_COPY = {
    es: { pending: 'Pendiente' },
    en: { pending: 'Pending' },
};

export const HomeWeekDayList: React.FC<{ state: HomeViewState }> = ({ state }) => {
    const { safeProgram, selectedDayIdx, setSelectedDayIdx, uniqueDaysDone, nextWorkoutIdx, lang, h, t, tm } = state;
    const ui = pickLang(lang, STATUS_COPY);

    if (safeProgram.length === 0) return null;

    return (
        <section data-testid="home-day-list" aria-label={`${h.dayWord}`} className="flex flex-col gap-2">
            {safeProgram.map((day, idx) => {
                const isDone = uniqueDaysDone.has(idx);
                const isToday = idx === nextWorkoutIdx;
                const isSelected = idx === selectedDayIdx;
                const slots = day.slots || [];
                const totalSets = slots.reduce((sum: number, slot: any) => sum + (slot.setTarget || 3), 0);
                const muscles = [...new Set(slots.map((slot: any) => tm(slot.muscle)).filter(Boolean))];
                const dayName = String(getTranslated(day.dayName, lang));
                const status = isDone ? t.completed : isToday ? h.today : ui.pending;

                return (
                    <button
                        key={idx}
                        type="button"
                        data-testid={`home-day-row-${idx}`}
                        onClick={() => {
                            triggerHaptic('light');
                            setSelectedDayIdx(idx);
                        }}
                        aria-pressed={isSelected}
                        className={`expressive-press flex min-h-[56px] w-full items-center gap-3 rounded-[24px] px-4 py-3 text-left transition-all ${
                            isSelected
                                ? 'border border-primary-500 bg-primary-500/10'
                                : 'card-reference bg-surface-raised/40'
                        }`}
                    >
                        <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                                isDone
                                    ? 'bg-primary-500/15 text-primary-400'
                                    : isToday
                                        ? 'bg-primary-500 text-zinc-950'
                                        : 'bg-surface-raised text-muted'
                            }`}
                        >
                            {isDone ? <Icon name="Check" size={14} strokeWidth={3} /> : <span className="text-xs font-black tabular-nums">{idx + 1}</span>}
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className={`block truncate text-sm font-bold ${isSelected ? 'text-white' : 'text-zinc-200'}`}>{dayName}</span>
                            <span className="block truncate text-xs text-muted">
                                {muscles.length > 0 ? muscles.join(' · ') : `${slots.length} ${h.exercisesLower}`}
                            </span>
                        </span>
                        <span className="shrink-0 text-right">
                            <span className={`block text-[11px] font-bold uppercase tracking-wider ${isToday && !isDone ? 'text-primary-400' : 'text-muted'}`}>{status}</span>
                            <span className="block text-xs text-muted tabular-nums">{totalSets} {h.setsLower}</span>
                        </span>
                        <Icon name="ChevronRight" size={16} className="shrink-0 text-muted" />
                    </button>
                );
            })}
        </section>
    );
};
