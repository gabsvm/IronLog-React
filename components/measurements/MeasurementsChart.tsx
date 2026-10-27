/**
 * Measurement trend chart (Strong parity): metric pills + SVG polyline.
 * The `weight` metric merges diary weigh-ins (bodyLogs) visually —
 * nothing is written or duplicated into either store.
 */
import React, { useMemo } from 'react';
import { pickLang } from '../../utils/i18n';
import {
    metricSeries,
    mstr,
    toSizeDisplay,
    type MeasurementLog,
    type MeasurementMetricKey,
    type SizeUnit,
    type WeightPoint,
} from '../../utils/measurements';
import { toDisplay } from '../../utils/units';
import type { WeightUnit } from '../../types';

interface Props {
    lang: 'es' | 'en';
    entries: MeasurementLog[];
    weightSeries: WeightPoint[];
    weightUnit: WeightUnit;
    sizeUnit: SizeUnit;
    metric: MeasurementMetricKey;
    onMetricChange: (m: MeasurementMetricKey) => void;
}

const PILL_METRICS: MeasurementMetricKey[] = [
    'weight', 'bodyFat', 'calories',
    'neck', 'shoulders', 'chest',
    'bicepsL', 'bicepsR', 'forearmL', 'forearmR',
    'upperAbs', 'lowerAbs', 'waist', 'hips',
    'thighL', 'thighR', 'calfL', 'calfR',
];

export const MeasurementsChart: React.FC<Props> = ({
    lang,
    entries,
    weightSeries,
    weightUnit,
    sizeUnit,
    metric,
    onMetricChange,
}) => {
    const t = mstr(lang);

    const points = useMemo(() => {
        if (metric === 'weight') {
            const conv = (kg: number): number => toDisplay(kg, weightUnit);
            return weightSeries.map((p) => ({ t: p.t, v: conv(p.v), body: p.source === 'body' }));
        }
        const conv =
            metric === 'bodyFat' || metric === 'calories'
                ? (v: number): number => v
                : (v: number): number => toSizeDisplay(v, sizeUnit);
        return metricSeries(entries, metric).map((p) => ({ t: p.t, v: conv(p.v), body: false }));
    }, [metric, entries, weightSeries, weightUnit, sizeUnit]);
    // Padded 0..100 coordinate space (viewBox 100x100): edge points used to
    // sit exactly on the bounds and clip. Span guards a flat series.
    if (entries.length === 0 && weightSeries.length === 0) return null;
    const values = points.map((p) => p.v);
    const lo = values.length > 0 ? Math.min(...values) : 0;
    const hi = values.length > 0 ? Math.max(...values) : 1;
    const span = hi - lo || 1;
    const positions =
        points.length > 1
            ? points.map((p, i) => ({
                  key: `${p.t}-${i}`,
                  body: p.body,
                  x: 4 + (i / (points.length - 1)) * 92,
                  y: 94 - ((p.v - lo) / span) * 88,
              }))
            : [];
    const coords = positions.map((pt) => `${pt.x},${pt.y}`).join(' ');

    return (
        <div className="gl-panel p-4">
            <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-bold tracking-tight text-[rgb(var(--text-primary))]">
                    {t.trend}
                </p>
                {metric === 'weight' && (
                    <p className="flex items-center gap-1.5 text-xs text-muted">
                        <span className="inline-block h-2 w-2 rounded-full bg-[rgb(var(--border-strong))]" />
                        {t.includesWeighIns}
                    </p>
                )}
            </div>
            <div
                className="-mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1 pb-1"
                role="tablist"
                aria-label={t.metric}
            >
                {PILL_METRICS.map((m) => (
                    <button
                        key={m}
                        role="tab"
                        aria-selected={metric === m}
                        onClick={() => onMetricChange(m)}
                        className={`min-h-9 shrink-0 rounded-full px-3 text-xs font-semibold ${
                            metric === m
                                ? 'bg-surface-elevated text-[rgb(var(--text-primary))]'
                                : 'text-muted hover:text-[rgb(var(--text-primary))]'
                        }`}
                    >
                        {t.field(m)}
                    </button>
                ))}
            </div>
            {points.length > 1 ? (
                <svg
                    viewBox="0 0 100 100"
                    className="h-24 w-full"
                    preserveAspectRatio="none"
                    role="img"
                    aria-label={`${t.field(metric)}: ${points.length} ${pickLang(lang, { es: 'registros', en: 'entries' })}`}
                >
                    <polyline
                        points={coords}
                        fill="none"
                        stroke="currentColor"
                        className="text-primary-500"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                    />
                    {positions.map((pt) => (
                        <circle
                            key={pt.key}
                            cx={pt.x}
                            cy={pt.y}
                            r="2"
                            fill="currentColor"
                            vectorEffect="non-scaling-stroke"
                            className={pt.body ? 'text-[rgb(var(--border-strong))]' : 'text-primary-500'}
                        />
                    ))}
                </svg>
            ) : (
                <p className="py-4 text-center text-sm text-muted">{t.emptyChart}</p>
            )}
        </div>
    );
};
