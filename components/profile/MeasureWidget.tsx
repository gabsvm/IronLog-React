import React, { useMemo } from 'react';
import { useApp, useAppPreferences } from '../../context/AppContext';
import { useMeasurements } from '../../hooks/useMeasurements';
import {
    formatMeasureDate,
    formatMetricValue,
    metricUnitSuffix,
    resolveBodyWeightUnit,
    resolveSizeUnit,
    mstr,
} from '../../utils/measurements';
import type { MeasurementLog } from '../../utils/measurements';
import { toDisplay, formatWeight, resolveWeightUnit, unitLabel } from '../../utils/units';
import { formatLocalDateKey } from '../../utils/localDate';
import { STRONG_MEASURE_EVENT } from '../layout/navigation';
import { Icon } from '../ui/Icon';
import { pickLang } from '../../utils/i18n';
import { TRANSLATIONS } from '../../constants';

interface MeasureWidgetProps {
    mode?: 'compact' | 'expanded';
    onOpenFull?: () => void;
    onClose?: () => void;
}

const sameDay = (a: number, b: number): boolean =>
    formatLocalDateKey(new Date(a)) === formatLocalDateKey(new Date(b));

/**
 * Strong parity Measure preview over the canonical measurements store.
 * Primary source: useMeasurements().entries (newest first; latest = [0]).
 * While the section loads async (entries empty), the diary weigh-in is the
 * fallback so the widget is never blank. Read-only: no writes, no local
 * form — 'Registrar'/'Abrir medidas' dispatch STRONG_MEASURE_EVENT and
 * Layout routes to the real Measure view (or a mounted section handles it).
 * The sparkline uses weightSeries (merged, date-ordered, no duplication).
 */
export const MeasureWidget: React.FC<MeasureWidgetProps> = ({
    mode = 'compact',
    onOpenFull,
    onClose,
}) => {
    const { lang } = useAppPreferences();
    const { userProfile, config, bodyLogs } = useApp();
    const { entries, weightSeries } = useMeasurements();
    const t = TRANSLATIONS[lang];
    const ty = t.you;
    const ms = mstr(lang);

    const weightUnit = resolveBodyWeightUnit(config);
    const sizeUnit = resolveSizeUnit(config);

    const latest: MeasurementLog | null = entries.length > 0 ? entries[0] : null;
    const latestWeight = latest && typeof latest.weight === 'number' ? latest.weight : null;
    const latestFat = latest && typeof latest.bodyFat === 'number' ? latest.bodyFat : null;
    const latestWaist = latest && typeof latest.waist === 'number' ? latest.waist : null;

    const fallbackKg = useMemo(() => {
        const sorted = [...(bodyLogs ?? [])].sort((a, b) => a.date - b.date);
        return sorted[sorted.length - 1]?.weight ?? userProfile?.bodyWeight ?? null;
    }, [bodyLogs, userProfile]);
    const fallbackDate = useMemo(() => {
        const sorted = [...(bodyLogs ?? [])].sort((a, b) => a.date - b.date);
        return sorted[sorted.length - 1]?.date ?? null;
    }, [bodyLogs]);

    const shownWeightKg = latestWeight ?? fallbackKg;
    const shownDate = latest ? latest.date : fallbackDate;

    const deltaKg = useMemo(() => {
        if (weightSeries.length < 2) return 0;
        const a = weightSeries[weightSeries.length - 2].v;
        const b = weightSeries[weightSeries.length - 1].v;
        return Math.round((b - a) * 10) / 10;
    }, [weightSeries]);

    const spark = useMemo(() => {
        const pts = weightSeries.slice(-14);
        if (pts.length < 2) return null;
        const vals = pts.map((p) => toDisplay(p.v, weightUnit));
        const min = Math.min(...vals);
        const max = Math.max(...vals);
        const span = max - min || 1;
        const step = pts.length > 1 ? 272 / (pts.length - 1) : 0;
        const path = pts
            .map((p, i) => `${8 + i * step},${58 - ((toDisplay(p.v, weightUnit) - min) / span) * 44}`)
            .join(' ');
        return { path };
    }, [weightSeries, weightUnit]);

    const title = pickLang(lang, { es: 'Medidas', en: 'Measure' });
    const logLabel = ms.log;
    const openFullLabel = pickLang(lang, { es: 'Abrir medidas', en: 'Open measure' });
    const emptyLabel = shownWeightKg === null ? `${ms.emptyTitle}. ${ms.emptyBody}` : ms.emptyChart;

    /** Dispatch-only: Layout routes to the real Measure view unless a
     * mounted MeasurementsSection preventDefaults (opens its form). */
    const handleLogWeight = (): void => {
        window.dispatchEvent(new CustomEvent(STRONG_MEASURE_EVENT, { detail: { metric: 'weight' }, cancelable: true }));
    };

    const openFullMeasure = (): void => {
        if (onOpenFull) {
            onOpenFull();
            return;
        }
        window.dispatchEvent(new CustomEvent(STRONG_MEASURE_EVENT, { cancelable: true }));
    };

    const currentText = (() => {
        if (latestWeight !== null) {
            return `${formatMetricValue('weight', latestWeight, weightUnit, sizeUnit, lang)} ${metricUnitSuffix('weight', weightUnit, sizeUnit)}`;
        }
        if (fallbackKg !== null) {
            const unit = resolveWeightUnit(config);
            return `${formatWeight(fallbackKg, unit, lang)} ${unitLabel(unit).toLowerCase()}`;
        }
        return '—';
    })();

    const dateText = shownDate
        ? latest
            ? formatMeasureDate(shownDate, lang)
            : new Date(shownDate).toLocaleDateString(
                pickLang(lang, { es: 'es-AR', en: 'en-US' }),
                { day: 'numeric', month: 'short' },
            )
        : ty.body;

    const entryLine = (entry: MeasurementLog): string => {
        if (typeof entry.weight === 'number') {
            return `${formatMetricValue('weight', entry.weight, weightUnit, sizeUnit, lang)} ${metricUnitSuffix('weight', weightUnit, sizeUnit)}`;
        }
        if (typeof entry.waist === 'number') {
            return `${formatMetricValue('waist', entry.waist, weightUnit, sizeUnit, lang)} ${metricUnitSuffix('waist', weightUnit, sizeUnit)}`;
        }
        if (typeof entry.bodyFat === 'number') {
            return `${formatMetricValue('bodyFat', entry.bodyFat, weightUnit, sizeUnit, lang)}${metricUnitSuffix('bodyFat', weightUnit, sizeUnit)}`;
        }
        return '—';
    };

    const recentEntries = useMemo(() => entries.slice(0, 7), [entries]);
    const recentDiary = useMemo(
        () => [...(bodyLogs ?? [])].sort((a, b) => b.date - a.date).slice(0, 7),
        [bodyLogs],
    );

    if (mode === 'compact') {
        return (
            <section aria-label={title} className="strong-card p-4">
                <div className="flex items-center justify-between gap-2">
                    <h3 className="strong-eyebrow">{title}</h3>
                    <button type="button" onClick={openFullMeasure} className="gl-textbtn px-1">
                        {openFullLabel}
                    </button>
                </div>
                <div className="mt-2 flex items-end justify-between gap-3">
                    <div>
                        <p className="gl-num text-2xl font-extrabold tabular-nums text-[rgb(var(--text-primary))]">
                            {currentText}
                        </p>
                        <p className="mt-0.5 text-xs font-semibold text-muted">
                            {latest ? ms.latest : dateText}
                            {weightSeries.length > 1 && (
                                <span
                                    className={`ml-2 tabular-nums ${deltaKg > 0 ? 'text-amber-400' : deltaKg < 0 ? 'text-emerald-400' : ''}`}
                                >
                                    {deltaKg > 0 ? '+' : ''}
                                    {Math.round(toDisplay(deltaKg, weightUnit) * 10) / 10}{' '}
                                    {metricUnitSuffix('weight', weightUnit, sizeUnit)}
                                </span>
                            )}
                        </p>
                        {(latestFat !== null || latestWaist !== null) && (
                            <p className="mt-1 flex flex-wrap gap-1.5">
                                {latestFat !== null && (
                                    <span className="gl-pill">
                                        {pickLang(lang, { es: 'Grasa', en: 'Fat' })} {formatMetricValue('bodyFat', latestFat, weightUnit, sizeUnit, lang)}{metricUnitSuffix('bodyFat', weightUnit, sizeUnit)}
                                    </span>
                                )}
                                {latestWaist !== null && (
                                    <span className="gl-pill">
                                        {pickLang(lang, { es: 'Cintura', en: 'Waist' })} {formatMetricValue('waist', latestWaist, weightUnit, sizeUnit, lang)} {metricUnitSuffix('waist', weightUnit, sizeUnit)}
                                    </span>
                                )}
                            </p>
                        )}
                    </div>
                    <button type="button" onClick={handleLogWeight} className="strong-action-btn !min-h-[44px]">
                        <Icon name="Plus" size={16} strokeWidth={2.5} />
                        {logLabel}
                    </button>
                </div>
                {spark ? (
                    <svg viewBox="0 0 288 66" className="mt-3 h-16 w-full" role="img" aria-label={title}>
                        <polyline
                            points={spark.path}
                            fill="none"
                            stroke="rgb(var(--strong-action))"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                ) : (
                    <p className="mt-3 text-xs leading-relaxed text-muted">{emptyLabel}</p>
                )}
            </section>
        );
    }

    return (
        <section aria-label={title} className="strong-card p-4">
            <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-extrabold text-[rgb(var(--text-primary))]">{title}</h3>
                {onClose && (
                    <button type="button" onClick={onClose} className="strong-quiet-btn" aria-label={t.back}>
                        <Icon name="ChevronDown" size={16} />
                        {t.back}
                    </button>
                )}
            </div>
            <div className="strong-tile mt-3 flex items-center justify-between gap-3 p-4">
                <div>
                    <p className="text-xs font-semibold text-muted">{latest ? ms.latest : ty.weight}</p>
                    <p className="gl-num mt-0.5 text-2xl font-extrabold tabular-nums text-[rgb(var(--text-primary))]">
                        {currentText}
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-muted">{dateText}</p>
                </div>
                <button type="button" onClick={handleLogWeight} className="strong-action-btn">
                    <Icon name="Plus" size={16} strokeWidth={2.5} />
                    {logLabel}
                </button>
            </div>
            {recentEntries.length > 0 ? (
                <ul className="mt-3 divide-y divide-[rgb(var(--border-subtle))] overflow-hidden rounded-2xl border border-[rgb(var(--border-subtle))]">
                    {recentEntries.map((entry) => (
                        <li
                            key={entry.id}
                            className="flex items-center justify-between gap-3 bg-[rgb(var(--surface-raised))] px-4 py-3"
                        >
                            <span className="text-xs font-semibold text-muted">
                                {formatMeasureDate(entry.date, lang)}
                            </span>
                            <span className="gl-num text-sm font-bold tabular-nums text-[rgb(var(--text-primary))]">
                                {entryLine(entry)}
                            </span>
                        </li>
                    ))}
                </ul>
            ) : recentDiary.length > 0 ? (
                <ul className="mt-3 divide-y divide-[rgb(var(--border-subtle))] overflow-hidden rounded-2xl border border-[rgb(var(--border-subtle))]">
                    {recentDiary.map((entry) => (
                        <li
                            key={entry.id}
                            className={`flex items-center justify-between gap-3 bg-[rgb(var(--surface-raised))] px-4 py-3 ${fallbackDate !== null && sameDay(entry.date, fallbackDate) ? 'border-l-2 border-l-[rgb(var(--strong-action))]' : ''}`}
                        >
                            <span className="text-xs font-semibold text-muted">
                                {new Date(entry.date).toLocaleDateString(
                                    pickLang(lang, { es: 'es-AR', en: 'en-US' }),
                                    { weekday: 'short', day: 'numeric', month: 'short' },
                                )}
                            </span>
                            <span className="gl-num text-sm font-bold tabular-nums text-[rgb(var(--text-primary))]">
                                {formatWeight(entry.weight, resolveWeightUnit(config), lang)} {unitLabel(resolveWeightUnit(config)).toLowerCase()}
                            </span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="mt-3 text-xs leading-relaxed text-muted">{`${ms.emptyTitle}. ${ms.emptyBody}`}</p>
            )}
            <button type="button" onClick={openFullMeasure} className="strong-quiet-btn mt-3 w-full">
                <Icon name="Scale" size={16} />
                {openFullLabel}
            </button>
        </section>
    );
};
