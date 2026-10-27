import React, { useState } from 'react';
import type { Lang, WeightUnit } from '../../../types';
import { formatDate } from '../../../utils';
import { formatWeight, unitLabel } from '../../../utils/units';
import { Icon } from '../../ui/Icon';
import type { ExerciseDetailStrings } from './exerciseDetailStrings';
import type { ExerciseHistoryEntry } from './exerciseDetailData';

interface ExerciseHistoryTabProps {
    entries: ExerciseHistoryEntry[];
    unit: WeightUnit;
    lang: Lang;
    labels: ExerciseDetailStrings;
    isCardio: boolean;
    isIsometric: boolean;
}

const PAGE_SIZE = 30;

// History: every logged session for this exercise (merged group included),
// newest first. Each row shows the logged sets plus the session aggregates
// (best set, volume) in the display unit.
export const ExerciseHistoryTab: React.FC<ExerciseHistoryTabProps> = ({
    entries,
    unit,
    lang,
    labels,
    isCardio,
    isIsometric,
}) => {
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const suffix = unitLabel(unit).toLowerCase();
    const visible = entries.slice(0, visibleCount);

    if (entries.length === 0) {
        return (
            <div className="p-5">
                <div className="flex min-h-[15rem] flex-col items-center justify-center rounded-[1.4rem] border border-dashed border-[rgb(var(--border-subtle))] bg-white/[0.02] px-6 py-8 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.04] text-zinc-500">
                        <Icon name="Calendar" size={20} />
                    </div>
                    <p className="text-sm font-bold text-[rgb(var(--text-primary))]">{labels.historyEmptyTitle}</p>
                    <p className="mt-1 text-xs text-muted">{labels.historyEmptyBody}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3 p-5">
            {visible.map(entry => (
                <article
                    key={`${entry.logId}`}
                    className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-elevated)/0.5)] p-4"
                >
                    <div className="flex items-baseline justify-between gap-2">
                        <h4 className="min-w-0 flex-1 truncate text-sm font-bold text-[rgb(var(--text-primary))]">
                            {entry.logName || formatDate(entry.date, lang)}
                        </h4>
                        <time className="shrink-0 text-xs font-semibold text-muted">
                            {formatDate(entry.date, lang)}
                        </time>
                    </div>

                    <ul className="mt-2 space-y-1 text-sm tabular-nums">
                        {entry.sets.map((set, idx) => (
                            <li key={idx} className="flex items-center justify-between gap-2 text-[rgb(var(--text-secondary))]">
                                <span className="text-xs font-bold text-muted">#{idx + 1}</span>
                                {isCardio ? (
                                    <span className="text-xs font-semibold">
                                        {Number(set.distance) > 0 ? `${Number(set.distance).toFixed(1)} km` : null}
                                        {Number(set.distance) > 0 && parseSetMinutesLabel(set.duration) ? ' · ' : null}
                                        {parseSetMinutesLabel(set.duration)}
                                    </span>
                                ) : isIsometric ? (
                                    <span className="text-xs font-semibold">
                                        {Number(set.duration) > 0 ? `${Number(set.duration)} s` : '—'}
                                    </span>
                                ) : (
                                    <span className="text-xs font-semibold">
                                        {set.type === 'warmup' ? (
                                            <span className="mr-1 rounded bg-white/5 px-1 py-0.5 text-[10px] font-black uppercase text-muted">W</span>
                                        ) : null}
                                        {formatWeight(set.weight, unit, lang)} {suffix} × {set.reps}
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-[rgb(var(--border-subtle)/0.6)] pt-2 text-xs tabular-nums">
                        {!isCardio && !isIsometric && entry.bestWeight > 0 && (
                            <span className="font-semibold text-[rgb(var(--text-secondary))]">
                                {labels.historyBest}: {formatWeight(entry.bestWeight, unit, lang)} {suffix} × {entry.bestReps}
                            </span>
                        )}
                        {!isCardio && !isIsometric && entry.volume > 0 && (
                            <span className="font-semibold text-muted">
                                {labels.historyVolume}: {formatWeight(entry.volume, unit, lang)} {suffix}
                            </span>
                        )}
                        {isCardio && (
                            <span className="font-semibold text-muted">
                                {entry.distanceKm > 0 ? `${entry.distanceKm.toFixed(1)} km` : ''}
                                {entry.distanceKm > 0 && entry.durationMin > 0 ? ' · ' : ''}
                                {entry.durationMin > 0 ? `${entry.durationMin.toFixed(1)} min` : ''}
                            </span>
                        )}
                        {isIsometric && entry.bestHoldSec > 0 && (
                            <span className="font-semibold text-muted">
                                {labels.historyHold}: {entry.bestHoldSec} s
                            </span>
                        )}
                        <span className="ml-auto font-semibold text-muted">
                            {entry.sets.length} {labels.historySets}
                        </span>
                    </div>
                </article>
            ))}

            {entries.length > visibleCount && (
                <button
                    type="button"
                    onClick={() => setVisibleCount(count => count + PAGE_SIZE)}
                    className="min-h-[44px] w-full rounded-xl border border-[rgb(var(--border-subtle))] text-xs font-bold text-muted transition-colors hover:text-[rgb(var(--text-primary))]"
                >
                    {labels.showMore} ({entries.length - visibleCount})
                </button>
            )}
            {visibleCount > PAGE_SIZE && entries.length <= visibleCount && (
                <button
                    type="button"
                    onClick={() => setVisibleCount(PAGE_SIZE)}
                    className="min-h-[44px] w-full rounded-xl border border-[rgb(var(--border-subtle))] text-xs font-bold text-muted transition-colors hover:text-[rgb(var(--text-primary))]"
                >
                    {labels.showLess}
                </button>
            )}
        </div>
    );
};

const parseSetMinutesLabel = (value: number | string): string => {
    if (typeof value === 'number') return value > 0 ? `${value} min` : '';
    const raw = String(value ?? '').trim();
    if (!raw || raw === '0') return '';
    if (raw.includes(':')) {
        const parts = raw.split(':').map(Number);
        if (parts.some(part => !Number.isFinite(part))) return `${raw} min`;
        const minutes = parts.length === 2 ? parts[0] + parts[1] / 60 : parts[0] * 60 + parts[1] + parts[2] / 60;
        return `${minutes.toFixed(1)} min`;
    }
    return `${raw} min`;
};
