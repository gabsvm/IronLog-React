import { getLogBodyWeight, getSetLoadVolume } from '../../utils/trainingMetrics';
import { pickLang } from '../../utils/i18n';
import { formatDurationShort, getTranslated } from '../../utils';
import React, { useMemo } from 'react';
import { Icon } from '../../components/ui/Icon';
import { toDisplay, unitLabel } from '../../utils/units';
import { lastSessionSummary, streakWeeks, weekProgress } from '../../utils/homeSummary';
import { useTrainingConfig } from '../../hooks/useTrainingConfig';
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
    // Selected 1RM formula for the last-session PR count (default epley = legacy).
    const [trainingPrefs] = useTrainingConfig();
    const progress = useMemo(() => weekProgress(logs, meso.id, meso.week, plannedDays), [logs, meso.id, meso.week, plannedDays]);
    const streak = useMemo(() => streakWeeks(logs, meso.id, meso.week, plannedDays), [logs, meso.id, meso.week, plannedDays]);
    const last = useMemo(() => lastSessionSummary(logs, meso.id, trainingPrefs.oneRmFormula, trainingPrefs.factorInRpe === true), [logs, meso.id, trainingPrefs.oneRmFormula, trainingPrefs.factorInRpe]);
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

    const unitText = unitLabel(unit).toLowerCase();
    const change = trend && firstPoint && latestPoint ? weight(latestPoint.weightKg - firstPoint.weightKg) : 0;
    const ringLength = 2 * Math.PI * 26;
    const area = points ? `8,72 ${points} 292,72` : '';
    const lastXY = points?.split(' ').pop()?.split(',');

    // Fragment: HomeView's grid places each card (week/trend beside the hero on
    // desktop, recent sessions full width below); on mobile they simply stack.
    return <>
        <section className="gl-panel min-w-0 space-y-4 p-5 lg:col-start-2 lg:row-start-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-[rgb(var(--text-primary))]">{w.title}</h2>
                <span className="inline-flex items-center gap-1.5 text-xs text-[rgb(var(--text-secondary))]"><Icon name="Flame" size={14} /><span className="tabular-nums">{streak}</span> {streak === 1 ? w.streakWeek : w.streakWeeks}</span>
            </div>
            <div className="flex items-center gap-5">
                <div className="relative h-[72px] w-[72px] shrink-0" role="progressbar" aria-valuenow={progress.done} aria-valuemin={0} aria-valuemax={Math.max(1, progress.planned)} aria-label={w.title}>
                    <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90" aria-hidden="true">
                        <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeWidth="6" className="text-[rgb(var(--surface-raised))]" />
                        <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeWidth="6" className="text-primary-500" strokeLinecap="round" strokeDasharray={`${ringLength * pct / 100} ${ringLength}`} />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-lg font-semibold tabular-nums text-[rgb(var(--text-primary))]">{progress.done}/{progress.planned}</span>
                </div>
                <div className="min-w-0">
                    <p className="text-xs text-[rgb(var(--text-secondary))]">{w.weekTime}</p>
                    <p className="gl-num mt-0.5 text-2xl font-semibold text-[rgb(var(--text-primary))]">{formatDurationShort(context.seconds)}</p>
                </div>
            </div>
            {last && <div className="border-t border-[rgb(var(--border-subtle))] pt-3">
                <p className="mb-1 text-xs text-[rgb(var(--text-secondary))]">{w.lastSession}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm tabular-nums text-[rgb(var(--text-primary))]">
                    <span>{date(last.date)}</span><span>{last.durationMin > 0 ? formatDurationShort(last.durationMin * 60) : '<1 min'}</span><span>{Math.round(toDisplay(last.volumeKg, unit)).toLocaleString(locale)} {unitText}</span>
                    {last.prCount > 0 && <span className="inline-flex items-center gap-1 text-[rgb(var(--accent-text))]"><Icon name="Trophy" size={14} />×{last.prCount}</span>}
                </div>
            </div>}
            {!last && <p className="text-xs text-[rgb(var(--text-secondary))]">{w.empty}</p>}
        </section>
        <section className="gl-panel min-w-0 space-y-3 p-5 lg:col-start-2 lg:row-start-2">
            <div className="flex items-start justify-between gap-3">
                <h2 className="text-sm font-semibold text-[rgb(var(--text-primary))]">{ui.trend}</h2>
                <Icon name="TrendingUp" size={16} className="shrink-0 text-[rgb(var(--text-secondary))]" />
            </div>
            {trend && firstPoint && latestPoint ? <>
                <h3 className="text-xs text-[rgb(var(--text-secondary))]">{String(getTranslated(trend.exerciseName, lang))}</h3>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[rgb(var(--text-primary))]">
                    <strong className="text-3xl font-semibold tabular-nums">{weight(latestPoint.weightKg).toLocaleString(locale)}<span className="ml-1 text-base font-medium text-[rgb(var(--text-secondary))]">{unitText}</span></strong>
                    <span className={`gl-pill tabular-nums ${change > 0 ? 'gl-pill-accent' : ''}`}>{ui.change}: {change > 0 ? '+' : ''}{change.toLocaleString(locale)} {unitText}</span>
                </div>
                <svg viewBox="0 0 300 80" className="h-20 w-full text-primary-500" role="img" aria-label={`${String(getTranslated(trend.exerciseName, lang))}: ${trend.points.map(point => `${date(point.date)}: ${weight(point.weightKg)} ${unitLabel(unit)}`).join('; ')}`}>
                    <polygon points={area} fill="currentColor" opacity="0.12" />
                    <polyline points={points} fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
                    {lastXY && <circle cx={lastXY[0]} cy={lastXY[1]} r="4.5" fill="currentColor" />}
                </svg>
                <div className="flex justify-between text-xs text-[rgb(var(--text-secondary))]"><span>{date(firstPoint.date)}</span><span>{date(latestPoint.date)}</span></div>
                <p className="border-t border-[rgb(var(--border-subtle))] pt-3 text-xs leading-relaxed text-[rgb(var(--text-secondary))]">{ui.metric} ({unitLabel(unit)}) · {ui.window}</p>
            </> : <p className="text-sm leading-relaxed text-[rgb(var(--text-secondary))]">{ui.noTrend}</p>}
        </section>
        {context.recent.length > 0 && <section className="gl-panel min-w-0 p-5 lg:col-span-2">
            <h2 className="mb-1 text-sm font-semibold text-[rgb(var(--text-primary))]">{w.recentTitle}</h2>
            <ul className="divide-y divide-[rgb(var(--border-subtle))] lg:grid lg:grid-cols-2 lg:gap-x-8 lg:divide-y-0">{context.recent.map(({ log, volume }) => {
                const day = new Date(log.endTime);
                return <li key={log.id} className="lg:border-b lg:border-[rgb(var(--border-subtle))]">
                <button type="button" onClick={openSessions} className="flex min-h-[64px] w-full items-center gap-4 rounded-lg py-3 text-left" aria-label={`${log.name} · ${log.skipped ? ui.skipped : ui.completed} · ${ui.open}`}>
                    <span className="flex w-10 shrink-0 flex-col items-center leading-none" aria-hidden="true"><span className="text-xl font-semibold tabular-nums text-[rgb(var(--text-primary))]">{day.getDate()}</span><span className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-[rgb(var(--text-muted))]">{day.toLocaleDateString(locale, { month: 'short' }).replace('.', '')}</span></span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-[rgb(var(--text-primary))]">{log.name || `${t.day} ${log.dayIdx + 1}`}</span><span className="mt-1 block text-xs text-[rgb(var(--text-secondary))]">{log.skipped ? ui.skipped : ui.completed}{!log.skipped && ` · ${formatDurationShort(log.duration)} · ${Math.round(toDisplay(volume, unit)).toLocaleString(locale)} ${unitText}`}</span></span>
                    <Icon name="ChevronRight" size={16} className="shrink-0 text-[rgb(var(--text-secondary))]" />
                </button>
            </li>;
            })}</ul>
        </section>}
    </>;
});
