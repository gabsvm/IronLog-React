import React, { useEffect, useMemo, useState } from 'react';
import type { ExerciseDef, Lang, Log, WeightUnit } from '../../../types';
import { formatDate } from '../../../utils';
import { formatWeight, unitLabel } from '../../../utils/units';
import { formatInteger, pickLang } from '../../../utils/i18n';
import { ProgressChart, type ChartDataPoint } from '../../stats/ProgressChart';
import { useStatsWorker, type ChartMetric } from '../../../hooks/useStatsWorker';
import { buildStatsLogsSignature } from '../../../services/statsCache';
import { exerciseIdGroup } from '../../../utils/exerciseLibrary';
import { computeMaxWeightSeries } from './exerciseDetailData';
import type { ExerciseDetailStrings } from './exerciseDetailStrings';
import type { OneRmFormula } from '../../../utils/strongTraining';

export type ExerciseChartMetric = '1rm' | 'max_weight' | 'volume' | 'duration' | 'distance' | 'max_reps' | 'hold_time';

export interface ExerciseSeriesLabels {
    seriesSummaryTitle: string;
    seriesLatest: string;
    seriesDelta: string;
    seriesSessions: string;
    seriesTableTitle: string;
    seriesTableDate: string;
    seriesTableValue: string;
    seriesTableDetail: string;
}

interface ExerciseChartsTabProps {
    exercise: ExerciseDef;
    exercises: ExerciseDef[];
    safeLogs: Log[];
    unit: WeightUnit;
    lang: Lang;
    labels: ExerciseDetailStrings;
    series: ExerciseSeriesLabels;
    formula: OneRmFormula;
    bodyWeight?: number;
}

const METRIC_BUTTON_LABEL: Record<ExerciseChartMetric, string> = {
    '1rm': '1RM',
    max_weight: 'MAX',
    volume: 'VOL',
    duration: 'TIME',
    distance: 'DIST',
    max_reps: 'REPS',
    hold_time: 'HOLD',
};

const metricsFor = (exercise: ExerciseDef): ExerciseChartMetric[] => {
    if (exercise.isIsometric) return ['hold_time'];
    if (exercise.muscle === 'CARDIO') return ['duration', 'distance'];
    if (exercise.isBodyweight) return ['max_reps', 'volume'];
    return ['1rm', 'max_weight', 'volume'];
};

// The shared worker covers every other metric; 'max_weight' and non-Epley
// 1RM resolve locally (see useLocalSeries below).

// Charts: one graph per question (estimated 1RM, heaviest recorded load,
// session volume — or time/distance, reps, hold for special exercises).
// Recorded load is never labeled as 1RM; estimates carry the Epley note.
export const ExerciseChartsTab: React.FC<ExerciseChartsTabProps> = ({
    exercise,
    exercises,
    safeLogs,
    unit,
    lang,
    labels,
    series,
    formula,
    bodyWeight,
}) => {
    const availableMetrics = useMemo(() => metricsFor(exercise), [exercise]);
    const [chartMetric, setChartMetric] = useState<ExerciseChartMetric>(availableMetrics[0]);
    const [workerPoints, setWorkerPoints] = useState<ChartDataPoint[]>([]);
    const [chartLoading, setChartLoading] = useState(false);
    const { isWorkerReady, calculateChartData } = useStatsWorker();

    useEffect(() => {
        setChartMetric(metricsFor(exercise)[0]);
    }, [exercise]);

    const groupIds = useMemo(() => exerciseIdGroup(exercises, String(exercise.id)), [exercises, exercise.id]);
    const logsSignature = useMemo(() => buildStatsLogsSignature(safeLogs), [safeLogs]);
    // The worker (with its formula-keyed chart cache) owns every shared
    // metric; only the detail-only heaviest-load graph resolves locally.
    const useLocalSeries = chartMetric === 'max_weight';

    useEffect(() => {
        if (useLocalSeries) return;
        if (!isWorkerReady) return;
        let cancelled = false;
        setChartLoading(true);
        const metric = chartMetric as ChartMetric;
        const group = groupIds.length > 0 ? groupIds : [String(exercise.id)];
        calculateChartData(safeLogs, group, metric, null, formula).then(points => {
            if (cancelled) return;
            setWorkerPoints(Array.isArray(points) ? points : []);
            setChartLoading(false);
        });
        return () => { cancelled = true; };
        // Stable logs signature avoids refetching on identity-only log changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chartMetric, useLocalSeries, isWorkerReady, exercise.id, logsSignature, groupIds, exercise.muscle, formula]);

    const localPoints = useMemo(() => {
        if (chartMetric !== 'max_weight') return [];
        const group = groupIds.length > 0 ? groupIds : [String(exercise.id)];
        return computeMaxWeightSeries(safeLogs, group, bodyWeight);
    }, [chartMetric, safeLogs, groupIds, exercise.id, bodyWeight]);

    const points = useLocalSeries ? localPoints : workerPoints;
    const loading = useLocalSeries ? false : chartLoading;
    const suffix = unitLabel(unit).toLowerCase();

    const summary = useMemo(() => {
        const first = points[0];
        const latest = points[points.length - 1];
        if (!first || !latest) return null;
        return { latest, delta: latest.value - first.value, sessions: points.length };
    }, [points]);

    const formatValue = (value: number): string => {
        if (chartMetric === 'duration') return `${value.toLocaleString(pickLang(lang, { es: 'es-ES', en: 'en-US' }), { maximumFractionDigits: 1 })} min`;
        if (chartMetric === 'distance') return `${value.toLocaleString(pickLang(lang, { es: 'es-ES', en: 'en-US' }), { maximumFractionDigits: 2 })} km`;
        if (chartMetric === 'hold_time') return `${formatInteger(value, lang)} s`;
        if (chartMetric === 'max_reps') return `${formatInteger(value, lang)} ${labels.historyReps}`;
        return `${formatWeight(value, unit, lang)} ${suffix}`;
    };

    return (
        <div className="p-5">
            <div className="gl-panel p-4">
                {availableMetrics.length > 1 && (
                    <div className="mb-4 flex rounded-full border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-elevated))] p-1" role="tablist" aria-label={labels.charts}>
                        {availableMetrics.map(metric => (
                            <button
                                key={metric}
                                role="tab"
                                aria-selected={chartMetric === metric}
                                onClick={() => setChartMetric(metric)}
                                className={`min-h-[40px] flex-1 rounded-full px-2 text-xs font-bold transition-all ${
                                    chartMetric === metric
                                        ? 'bg-primary-500 text-zinc-950 shadow-sm'
                                        : 'text-zinc-500 hover:text-[rgb(var(--text-secondary))]'
                                }`}
                            >
                                {METRIC_BUTTON_LABEL[metric]}
                            </button>
                        ))}
                    </div>
                )}
                <ProgressChart
                    dataPoints={points}
                    metric={chartMetric === 'max_weight' ? 'max_weight' : chartMetric}
                    loading={loading}
                    unit={unit}
                />
                {summary && points.length > 0 && (
                    <div className="mt-4 rounded-[1.2rem] border border-[rgb(var(--border-subtle)/0.7)] bg-white/[0.02] p-4">
                        <h4 className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">{series.seriesSummaryTitle}</h4>
                        <div className="mt-3 grid grid-cols-3 gap-2">
                            <div>
                                <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">{series.seriesLatest}</div>
                                <div className="mt-1 text-lg font-black tabular-nums text-[rgb(var(--text-primary))]">
                                    {formatValue(summary.latest.value)}
                                </div>
                                {(chartMetric === '1rm' || chartMetric === 'max_weight') && summary.latest.reps > 0 && (
                                    <div className="text-[11px] font-semibold text-muted">
                                        {formatWeight(summary.latest.weight, unit, lang)} {suffix} × {summary.latest.reps}
                                    </div>
                                )}
                            </div>
                            <div>
                                <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">{series.seriesDelta}</div>
                                <div className="mt-1 text-lg font-black tabular-nums text-[rgb(var(--text-primary))]">
                                    {summary.delta === 0 ? '±0' : `${summary.delta > 0 ? '+' : '−'}${formatValue(Math.abs(summary.delta))}`}
                                </div>
                            </div>
                            <div>
                                <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">{series.seriesSessions}</div>
                                <div className="mt-1 text-lg font-black tabular-nums text-[rgb(var(--text-primary))]">
                                    {formatInteger(summary.sessions, lang)}
                                </div>
                            </div>
                        </div>
                        {chartMetric === '1rm' && (
                            <p className="mt-2 text-[11px] font-semibold text-muted">{labels.chartEstimatedNote[formula]}</p>
                        )}
                        <table className="mt-3 w-full text-sm tabular-nums">
                            <caption className="pb-2 text-left text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
                                {series.seriesTableTitle}
                            </caption>
                            <thead>
                                <tr className="border-b border-[rgb(var(--border-subtle)/0.7)] text-left text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
                                    <th scope="col" className="py-1.5 pr-2 font-bold">{series.seriesTableDate}</th>
                                    <th scope="col" className="py-1.5 pr-2 text-right font-bold">{series.seriesTableValue}</th>
                                    {(chartMetric === '1rm' || chartMetric === 'max_weight') && (
                                        <th scope="col" className="py-1.5 text-right font-bold">{series.seriesTableDetail}</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {points.map(point => (
                                    <tr key={point.date} className="border-b border-[rgb(var(--border-subtle)/0.4)] text-[rgb(var(--text-primary))] last:border-0">
                                        <td className="py-1.5 pr-2">{formatDate(point.date, lang)}</td>
                                        <td className="py-1.5 pr-2 text-right font-bold">{formatValue(point.value)}</td>
                                        {(chartMetric === '1rm' || chartMetric === 'max_weight') && (
                                            <td className="py-1.5 text-right text-muted">
                                                {point.reps > 0 ? `${formatWeight(point.weight, unit, lang)} ${suffix} × ${point.reps}` : '—'}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
