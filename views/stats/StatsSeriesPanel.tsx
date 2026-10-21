import React, { useMemo } from 'react';
import type { ChartDataPoint } from '../../components/stats/ProgressChart';
import type { ChartMetric } from '../../hooks/useStatsWorker';
import type { WeightUnit } from '../../types';
import { formatDate } from '../../utils';
import { formatInteger, pickLang } from '../../utils/i18n';
import { toDisplay, unitLabel } from '../../utils/units';

/**
 * One chart = one question: KPI + accessible table drawn from the SAME
 * chartPoints series the graph renders. Estimates are labeled as estimates;
 * logged load is never called 1RM outside the Epley estimate.
 */
interface StatsSeriesPanelProps {
    points: ChartDataPoint[];
    metric: ChartMetric;
    unit: WeightUnit;
    lang: 'es' | 'en';
    labels: {
        seriesSummaryTitle: string;
        seriesLatest: string;
        seriesDelta: string;
        seriesSessions: string;
        seriesTableTitle: string;
        seriesTableDate: string;
        seriesTableValue: string;
        seriesTableDetail: string;
        seriesEstimatedNote: string;
    };
}

const formatSeriesValue = (value: number, metric: ChartMetric, unit: WeightUnit, lang: 'es' | 'en'): string => {
    if (metric === '1rm' || metric === 'volume') {
        const shown = toDisplay(value, unit);
        return `${formatInteger(shown, lang)} ${unitLabel(unit).toLowerCase()}`;
    }
    if (metric === 'duration') return `${value.toLocaleString(pickLang(lang, { es: 'es-ES', en: 'en-US' }), { maximumFractionDigits: 1 })} min`;
    if (metric === 'distance') return `${value.toLocaleString(pickLang(lang, { es: 'es-ES', en: 'en-US' }), { maximumFractionDigits: 2 })} km`;
    if (metric === 'hold_time') return `${formatInteger(value, lang)} s`;
    return `${formatInteger(value, lang)} reps`;
};

export const StatsSeriesPanel: React.FC<StatsSeriesPanelProps> = ({ points, metric, unit, lang, labels }) => {
    const summary = useMemo(() => {
        const first = points[0];
        const latest = points[points.length - 1];
        if (!first || !latest) return null;
        return { first, latest, delta: latest.value - first.value, sessions: points.length };
    }, [points]);
    if (!summary) return null;
    const isEstimate = metric === '1rm';
    const deltaText = summary.delta === 0
        ? '±0'
        : `${summary.delta > 0 ? '+' : '−'}${formatSeriesValue(Math.abs(summary.delta), metric, unit, lang)}`;

    return (
        <div className="mt-4 rounded-[1.2rem] border border-[rgb(var(--border-subtle)/0.7)] bg-white/[0.02] p-4">
            <h4 className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">{labels.seriesSummaryTitle}</h4>
            <div className="mt-3 grid grid-cols-3 gap-2">
                <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">{labels.seriesLatest}</div>
                    <div className="mt-1 text-lg font-black tabular-nums text-[rgb(var(--text-primary))]">
                        {formatSeriesValue(summary.latest.value, metric, unit, lang)}
                    </div>
                    {isEstimate && summary.latest.reps > 0 && (
                        <div className="text-[11px] font-semibold text-muted">
                            {formatInteger(toDisplay(summary.latest.weight, unit), lang)} × {summary.latest.reps}
                        </div>
                    )}
                </div>
                <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">{labels.seriesDelta}</div>
                    <div className="mt-1 text-lg font-black tabular-nums text-[rgb(var(--text-primary))]">{deltaText}</div>
                </div>
                <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">{labels.seriesSessions}</div>
                    <div className="mt-1 text-lg font-black tabular-nums text-[rgb(var(--text-primary))]">
                        {formatInteger(summary.sessions, lang)}
                    </div>
                </div>
            </div>
            {isEstimate && (
                <p className="mt-2 text-[11px] font-semibold text-muted">{labels.seriesEstimatedNote}</p>
            )}
            <table className="mt-3 w-full text-sm tabular-nums" data-testid="stats-series-table">
                <caption className="pb-2 text-left text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
                    {labels.seriesTableTitle}{isEstimate ? ` · ${labels.seriesEstimatedNote}` : ''}
                </caption>
                <thead>
                    <tr className="border-b border-[rgb(var(--border-subtle)/0.7)] text-left text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
                        <th scope="col" className="py-1.5 pr-2 font-bold">{labels.seriesTableDate}</th>
                        <th scope="col" className="py-1.5 pr-2 text-right font-bold">{labels.seriesTableValue}</th>
                        {isEstimate && (
                            <th scope="col" className="py-1.5 text-right font-bold">{labels.seriesTableDetail}</th>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {points.map(point => (
                        <tr key={point.date} className="border-b border-[rgb(var(--border-subtle)/0.4)] text-[rgb(var(--text-primary))] last:border-0">
                            <td className="py-1.5 pr-2">{formatDate(point.date, lang)}</td>
                            <td className="py-1.5 pr-2 text-right font-bold">{formatSeriesValue(point.value, metric, unit, lang)}</td>
                            {isEstimate && (
                                <td className="py-1.5 text-right text-muted">
                                    {point.reps > 0 ? `${formatInteger(toDisplay(point.weight, unit), lang)} × ${point.reps}` : '—'}
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
