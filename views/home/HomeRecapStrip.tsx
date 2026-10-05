import { pickLang } from '../../utils/i18n';
import React, { useMemo } from 'react';
import { Icon } from '../../components/ui/Icon';
import { toDisplay, unitLabel } from '../../utils/units';
import { lastSessionSummary, streakWeeks, weekProgress } from '../../utils/homeSummary';
import type { Log, MesoCycle, WeightUnit } from '../../types';

interface Props {
    logs: Log[];
    meso: MesoCycle;
    plannedDays: number;
    lang: 'es' | 'en';
    t: any;
    unit?: WeightUnit;
}

/**
 * Q16: compact week-at-a-glance strip under the Home hero card: this week's
 * done/planned days, current streak of complete weeks, and the last session
 * (date, duration, volume, PRs). Friendly empty state when nothing is logged.
 */
export const HomeRecapStrip: React.FC<Props> = React.memo(({ logs, meso, plannedDays, lang, t, unit = 'kg' }) => {
    const progress = useMemo(
        () => weekProgress(logs, meso.id, meso.week, plannedDays),
        [logs, meso.id, meso.week, plannedDays],
    );
    const streak = useMemo(
        () => streakWeeks(logs, meso.id, meso.week, plannedDays),
        [logs, meso.id, meso.week, plannedDays],
    );
    const last = useMemo(() => lastSessionSummary(logs, meso.id), [logs, meso.id]);
    const w = t.homeRecap;

    const pct = progress.planned > 0 ? Math.min(100, Math.round((progress.done / progress.planned) * 100)) : 0;
    const lastDate = last
        ? new Date(last.date).toLocaleDateString(pickLang(lang, { es: 'es-AR', en: 'en-US' }), { day: 'numeric', month: 'short' })
        : null;
    const lastVolume = last
        ? Math.round(toDisplay(last.volumeKg, unit)).toLocaleString(pickLang(lang, { es: 'es-AR', en: 'en-US' }))
        : null;

    return (
        <div className="card-reference p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                    <Icon name="Calendar" size={14} className="text-primary-400 shrink-0" />
                    <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest truncate">
                        {w.title}
                    </h4>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    <Icon name="Flame" size={14} className={streak > 0 ? 'text-orange-400' : 'text-zinc-600'} />
                    <span className="text-xs font-black text-white tabular-nums">{streak}</span>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                        {streak === 1 ? w.streakWeek : w.streakWeeks}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <span className="text-sm font-black text-white tabular-nums shrink-0">
                    {progress.done}/{progress.planned}
                </span>
                <div
                    className="h-2 flex-1 rounded-full bg-zinc-800 overflow-hidden"
                    role="progressbar"
                    aria-valuenow={progress.done}
                    aria-valuemin={0}
                    aria-valuemax={progress.planned}
                    aria-label={w.title}
                >
                    <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${pct}%` }} />
                </div>
            </div>

            {last && lastDate ? (
                <div className="border-t border-border-subtle pt-2.5">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">
                        {w.lastSession}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-zinc-300 flex-wrap">
                        <span className="font-bold text-white">{lastDate}</span>
                        <span aria-label={w.duration}>~{last.durationMin} {w.min}</span>
                        <span aria-label={w.volume}>{lastVolume} {unitLabel(unit).toLowerCase()}</span>
                        {last.prCount > 0 && (
                            <span className="inline-flex items-center gap-1 font-bold text-yellow-400">
                                <Icon name="Trophy" size={12} />×{last.prCount}
                            </span>
                        )}
                    </div>
                </div>
            ) : (
                <p className="border-t border-border-subtle pt-2.5 text-xs text-zinc-500">{w.empty}</p>
            )}
        </div>
    );
});
