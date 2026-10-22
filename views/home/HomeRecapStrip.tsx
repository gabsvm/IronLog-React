import { getLogBodyWeight, getSetLoadVolume } from '../../utils/trainingMetrics';
import { pickLang } from '../../utils/i18n';
import { formatDurationShort, getTranslated } from '../../utils';
import React, { useMemo } from 'react';
import { Icon } from '../../components/ui/Icon';
import { toDisplay, unitLabel } from '../../utils/units';
import { lastSessionSummary, streakWeeks, weekProgress } from '../../utils/homeSummary';
import { homeStrengthTrend, HOME_TREND_WEEKS } from './homeTrend';
import type { Log, MesoCycle, WeightUnit } from '../../types';

import type { TRANSLATIONS } from '../../constants';
interface Props {
    logs: Log[];
    meso: MesoCycle;
    plannedDays: number;
    lang: 'es' | 'en';
    t: (typeof TRANSLATIONS)['en'];
    unit?: WeightUnit;
}

const openSessions = () => window.dispatchEvent(new CustomEvent('gainslab:navigate', { detail: { view: 'diary', section: 'sessions' } }));
const volumeKg = (log: Log) => {
    const bodyWeight = getLogBodyWeight(log);
    return (log.exercises || []).reduce((sum, exercise) => sum + (exercise.sets || []).reduce((total, set) => total + getSetLoadVolume(set, exercise, bodyWeight), 0), 0);
};

export const HomeRecapStrip: React.FC<Props> = React.memo(({ logs, meso, plannedDays, lang, t, unit = 'kg' }) => {
    const progress = useMemo(() => weekProgress(logs, meso.id, meso.week, plannedDays), [logs, meso.id, meso.week, plannedDays]);
    const streak = useMemo(() => streakWeeks(logs, meso.id, meso.week, plannedDays), [logs, meso.id, meso.week, plannedDays]);
    const last = useMemo(() => lastSessionSummary(logs, meso.id), [logs, meso.id]);
    const context = useMemo(() => {
        let seconds = 0;
        const recent: Log[] = [];
        for (const log of logs) {
            if (!log || log.mesoId !== meso.id) continue;
            if (!log.skipped && log.week === meso.week) seconds += Number(log.duration) || 0;
            // Keep only the latest four, without sorting/copying the entire history.
            const index = recent.findIndex(item => item.endTime < log.endTime);
            recent.splice(index < 0 ? recent.length : index, 0, log);
            if (recent.length > 4) recent.pop();
        }
        return { seconds, recent: recent.map(log => ({ log, volume: volumeKg(log) })) };
    }, [logs, meso.id, meso.week]);
    const trend = useMemo(() => homeStrengthTrend(logs, meso.id, Date.now()), [logs, meso.id]);
    const w = t.homeRecap;
    const locale = pickLang(lang, { es: 'es-AR', en: 'en-US' });
    const ui = pickLang(lang, {
        es: { trend: 'Tendencia de carga', metric: 'Carga máxima · series regulares, top y backoff', window: `Últimas ${HOME_TREND_WEEKS} semanas · este plan · hasta 8 sesiones`, noTrend: 'Sin sesiones comparables todavía. Registra series con carga del mismo ejercicio en al menos dos sesiones de este plan durante las últimas 8 semanas.', completed: 'Completada', skipped: 'Omitida', open: 'Ver en Diario', change: 'Cambio' },
        en: { trend: 'Load trend', metric: 'Maximum load · regular, top and backoff sets', window: `Last ${HOME_TREND_WEEKS} weeks · this plan · up to 8 sessions`, noTrend: 'No comparable sessions yet. Log weighted sets for the same exercise in at least two sessions of this plan within the last 8 weeks.', completed: 'Completed', skipped: 'Skipped', open: 'View in Diary', change: 'Change' },
    });
    const date = (timestamp: number) => new Date(timestamp).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
    const weight = (kg: number) => Math.round(toDisplay(kg, unit) * 10) / 10;
    const firstPoint = trend?.points[0];
    const latestPoint = trend?.points[trend.points.length - 1];
    const min = trend ? Math.min(...trend.points.map(point => point.weightKg)) : 0;
    const max = trend ? Math.max(...trend.points.map(point => point.weightKg)) : 0;
    const points = trend?.points.map((point, index) => `${8 + index / (trend.points.length - 1) * 284},${64 - (point.weightKg - min) / (max - min || 1) * 48}`).join(' ');
    const pct = progress.planned > 0 ? Math.min(100, Math.round(progress.done / progress.planned * 100)) : 0;

    return <aside className="min-w-0 space-y-4">
        <section className="gl-panel space-y-4 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-[rgb(var(--text-primary))]">{w.title}</h2>
                <span className="inline-flex items-center gap-1.5 text-xs text-[rgb(var(--text-secondary))]"><Icon name="Flame" size={14} /><span className="tabular-nums">{streak}</span> {streak === 1 ? w.streakWeek : w.streakWeeks}</span>
            </div>
            <div className="flex items-center gap-3">
                <span className="text-2xl font-semibold tabular-nums text-[rgb(var(--text-primary))]">{progress.done}/{progress.planned}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[rgb(var(--surface-raised))]" role="progressbar" aria-valuenow={progress.done} aria-valuemin={0} aria-valuemax={Math.max(1, progress.planned)} aria-label={w.title}><div className="h-full bg-primary-500" style={{ width: `${pct}%` }} /></div>
            </div>
            <div className="flex items-center justify-between gap-3 text-xs text-[rgb(var(--text-secondary))]"><span>{w.weekTime}</span><span className="gl-num font-medium text-[rgb(var(--text-primary))]">{formatDurationShort(context.seconds)}</span></div>
            {last && <div className="border-t border-[rgb(var(--border-subtle))] pt-3">
                <p className="mb-1 text-xs text-[rgb(var(--text-secondary))]">{w.lastSession}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--text-primary))]">
                    <span>{date(last.date)}</span><span>{last.durationMin > 0 ? formatDurationShort(last.durationMin * 60) : '<1 min'}</span><span>{Math.round(toDisplay(last.volumeKg, unit)).toLocaleString(locale)} {unitLabel(unit).toLowerCase()}</span>
                    {last.prCount > 0 && <span className="inline-flex items-center gap-1"><Icon name="Trophy" size={14} />×{last.prCount}</span>}
                </div>
            </div>}
            {!last && <p className="text-xs text-[rgb(var(--text-secondary))]">{w.empty}</p>}
        </section>
        <section className="gl-panel space-y-3 p-4">
            <h2 className="text-sm font-semibold text-[rgb(var(--text-primary))]">{ui.trend}</h2>
            <p className="text-xs text-[rgb(var(--text-secondary))]">{ui.window}</p>
            {trend && firstPoint && latestPoint ? <>
                <h3 className="font-semibold text-[rgb(var(--text-primary))]">{String(getTranslated(trend.exerciseName, lang))}</h3>
                <p className="text-xs text-[rgb(var(--text-secondary))]">{ui.metric} ({unitLabel(unit)})</p>
                <div className="flex items-baseline justify-between gap-2 text-[rgb(var(--text-primary))]"><strong className="text-2xl font-semibold tabular-nums">{weight(latestPoint.weightKg).toLocaleString(locale)} {unitLabel(unit)}</strong><span className="text-xs tabular-nums">{ui.change}: {weight(latestPoint.weightKg - firstPoint.weightKg) > 0 ? '+' : ''}{weight(latestPoint.weightKg - firstPoint.weightKg).toLocaleString(locale)} {unitLabel(unit)}</span></div>
                <svg viewBox="0 0 300 80" className="h-20 w-full text-primary-500" role="img" aria-label={`${String(getTranslated(trend.exerciseName, lang))}: ${trend.points.map(point => `${date(point.date)}: ${weight(point.weightKg)} ${unitLabel(unit)}`).join('; ')}`}><polyline points={points} fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" /></svg>
                <div className="flex justify-between text-xs text-[rgb(var(--text-secondary))]"><span>{date(firstPoint.date)}</span><span>{date(latestPoint.date)}</span></div>
            </> : <p className="text-sm leading-relaxed text-[rgb(var(--text-secondary))]">{ui.noTrend}</p>}
        </section>
        {context.recent.length > 0 && <section className="gl-panel p-4">
            <h2 className="mb-2 text-sm font-semibold text-[rgb(var(--text-primary))]">{w.recentTitle}</h2>
            <ul className="divide-y divide-[rgb(var(--border-subtle))]">{context.recent.map(({ log, volume }) => <li key={log.id}>
                <button type="button" onClick={openSessions} className="flex min-h-[64px] w-full items-center gap-3 rounded-lg py-3 text-left" aria-label={`${log.name} · ${log.skipped ? ui.skipped : ui.completed} · ${ui.open}`}>
                    <span className="min-w-0 flex-1"><span className="block text-sm font-medium text-[rgb(var(--text-primary))]">{log.name || `${t.day} ${log.dayIdx + 1}`}</span><span className="mt-1 block text-xs text-[rgb(var(--text-secondary))]">{date(log.endTime)} · {log.skipped ? ui.skipped : ui.completed}{!log.skipped && ` · ${formatDurationShort(log.duration)} · ${Math.round(toDisplay(volume, unit)).toLocaleString(locale)} ${unitLabel(unit).toLowerCase()}`}</span></span>
                    <Icon name="ChevronRight" size={16} className="shrink-0 text-[rgb(var(--text-secondary))]" />
                </button>
            </li>)}</ul>
        </section>}
    </aside>;
});
