/**
 * Measurements section (Strong parity): hero, trend chart, history,
 * record/edit form, CSV export. Units come from AppState.config only
 * (SettingsParity). Self-sufficient: mounts in NutriView body tab today
 * and in views/MeasureView once routed.
 */
import React, { useEffect, useState } from 'react';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { useMeasurements } from '../../hooks/useMeasurements';
import type { WeightUnit } from '../../types';
import { MeasurementsChart } from './MeasurementsChart';
import { MeasurementsHistory } from './MeasurementsHistory';
import { MeasurementFormModal } from './MeasurementFormModal';
import {
    OPEN_MEASURE_EVENT,
    consumePendingMeasureDetail,
    exportMeasurementsCsv,
    formatMeasureDate,
    formatMetricValue,
    isMeasurementMetricKey,
    metricUnitSuffix,
    mstr,
    resolveBodyWeightUnit,
    resolveSizeUnit,
    type MeasurementInput,
    type MeasurementLog,
    type MeasurementMetricKey,
    type OpenMeasureDetail,
    type SizeUnit,
} from '../../utils/measurements';

interface Props {
    compact?: boolean;
}

const heroMetric = (entry: MeasurementLog): MeasurementMetricKey | null => {
    const order: MeasurementMetricKey[] = ['weight', 'waist', 'chest', 'bodyFat', 'thighL'];
    for (const k of order) {
        if (typeof entry[k] === 'number') return k;
    }
    return null;
};

export const MeasurementsSection: React.FC<Props> = ({ compact = false }) => {
    const {
        lang,
        config,
        entries,
        weightSeries,
        addEntry,
        updateEntry,
        deleteEntry,
    } = useMeasurements();
    const t = mstr(lang);
    const weightUnit: WeightUnit = resolveBodyWeightUnit(config);
    const sizeUnit: SizeUnit = resolveSizeUnit(config);

    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<MeasurementLog | null>(null);
    const [formMetric, setFormMetric] = useState<MeasurementMetricKey | null>(null);
    const [chartMetric, setChartMetric] = useState<MeasurementMetricKey>('weight');

    // Route pending detail (stashed by Layout before setView('measure')) is
    // consumed once; live events are handled below with preventDefault.
    const [pending] = useState<OpenMeasureDetail | null>(() => consumePendingMeasureDetail());
    const [pendingDone, setPendingDone] = useState(false);

    // Single form owner: handle the cancelable event and prevent the
    // NavigationParity fallback overlay from also opening. Already-prevented
    // events (central route) are ignored.
    useEffect(() => {
        const handler = (e: Event) => {
            if (e.defaultPrevented) return;
            const detail = (e as CustomEvent<OpenMeasureDetail>).detail;
            const metric =
                detail?.metric && isMeasurementMetricKey(detail.metric) ? detail.metric : null;
            const entry =
                typeof detail?.entryId === 'number'
                    ? (entries.find((x) => x.id === detail.entryId) ?? null)
                    : null;
            if (metric) setChartMetric(metric);
            setEditing(entry);
            setFormMetric(metric);
            setFormOpen(true);
            e.preventDefault();
        };
        window.addEventListener(OPEN_MEASURE_EVENT, handler);
        return () => window.removeEventListener(OPEN_MEASURE_EVENT, handler);
    }, [entries]);

    // Applies the route pending detail once entries are loaded (async store).
    useEffect(() => {
        if (!pending || pendingDone) return;
        if (typeof pending.entryId === 'number') {
            const found = entries.find((x) => x.id === pending.entryId);
            if (!found) return;
            setEditing(found);
            setFormMetric(null);
            setFormOpen(true);
        } else if (pending.metric && isMeasurementMetricKey(pending.metric)) {
            setChartMetric(pending.metric);
            setEditing(null);
            setFormMetric(pending.metric);
            setFormOpen(true);
        } else {
            return;
        }
        setPendingDone(true);
    }, [entries, pending, pendingDone]);

    const handleSave = (input: MeasurementInput, id: number | null) => {
        if (id === null) addEntry(input);
        else updateEntry(id, input);
        setEditing(null);
    };

    const openNew = (metric: MeasurementMetricKey | null = null) => {
        setEditing(null);
        setFormMetric(metric);
        setFormOpen(true);
    };

    const latest = entries.length > 0 ? entries[0] : null;
    const latestKey = latest ? heroMetric(latest) : null;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
                <div>
                    {!compact && (
                        <p className="text-xs font-semibold tracking-normal text-muted">{t.subtitle}</p>
                    )}
                    <p className="text-sm font-bold tracking-tight text-[rgb(var(--text-primary))]">
                        {t.title} · {t.entries(entries.length)}
                    </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => {
                            void exportMeasurementsCsv(entries).catch(() => {});
                        }}
                        aria-label={t.exportCsv}
                        title={t.exportCsv}
                        className="gl-quiet min-h-9 px-2.5"
                    >
                        <Icon name="Download" size={14} />
                    </button>
                    <button
                        type="button"
                        onClick={() => openNew()}
                        aria-label={`${t.log} — ${t.title}`}
                        className="gl-quiet min-h-9 px-3.5"
                    >
                        <Icon name="Plus" size={14} />
                        {t.log}
                    </button>
                </div>
            </div>

            {latest && latestKey ? (
                <div className="gl-panel p-4">
                    <p className="mb-1 text-xs font-semibold tracking-normal text-muted">{t.latest}</p>
                    <div className="flex items-baseline justify-between gap-2">
                        <div className="gl-num text-3xl font-semibold leading-none text-[rgb(var(--text-primary))]">
                            {formatMetricValue(latestKey, latest[latestKey] as number, weightUnit, sizeUnit, lang)}
                            <span className="ml-1 text-sm font-medium text-muted">
                                {metricUnitSuffix(latestKey, weightUnit, sizeUnit)}
                            </span>
                        </div>
                        <p className="shrink-0 text-xs text-muted">{formatMeasureDate(latest.date, lang)}</p>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                        {t.field(latestKey)}
                        {typeof latest.waist === 'number' && latestKey !== 'waist' && (
                            <>
                                {' · '}
                                {t.field('waist')}{' '}
                                {formatMetricValue('waist', latest.waist, weightUnit, sizeUnit, lang)}{' '}
                                {metricUnitSuffix('waist', weightUnit, sizeUnit)}
                            </>
                        )}
                    </p>
                </div>
            ) : (
                <div className="gl-panel p-4 text-center">
                    <p className="text-sm font-bold text-[rgb(var(--text-primary))]">{t.emptyTitle}</p>
                    <p className="mx-auto mt-1 max-w-sm text-xs text-muted">{t.emptyBody}</p>
                    <div className="mt-3">
                        <Button onClick={() => openNew()}>
                            <Icon name="Plus" size={14} />
                            {t.log}
                        </Button>
                    </div>
                </div>
            )}

            <MeasurementsChart
                lang={lang}
                entries={entries}
                weightSeries={weightSeries}
                weightUnit={weightUnit}
                sizeUnit={sizeUnit}
                metric={chartMetric}
                onMetricChange={setChartMetric}
            />

            <MeasurementsHistory
                lang={lang}
                entries={entries}
                weightUnit={weightUnit}
                sizeUnit={sizeUnit}
                onEdit={(entry) => {
                    setEditing(entry);
                    setFormMetric(null);
                    setFormOpen(true);
                }}
                onDelete={deleteEntry}
            />

            <MeasurementFormModal
                open={formOpen}
                onClose={() => {
                    setFormOpen(false);
                    setEditing(null);
                }}
                lang={lang}
                weightUnit={weightUnit}
                sizeUnit={sizeUnit}
                initial={editing}
                initialMetric={formMetric}
                onSave={handleSave}
            />
        </div>
    );
};
