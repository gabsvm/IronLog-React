/**
 * Measurements history (Strong parity): newest-first list, edit, delete
 * with explicit confirmation. Read-only wrt bodyLogs (never touched).
 */
import React, { useState } from 'react';
import { Icon } from '../ui/Icon';
import { ConfirmModal } from '../ui/ConfirmModal';
import { TRANSLATIONS } from '../../constants/translations';
import {
    formatMeasureDate,
    formatMetricValue,
    MEASUREMENT_FIELDS,
    metricUnitSuffix,
    mstr,
    type MeasurementLog,
    type MeasurementMetricKey,
    type SizeUnit,
} from '../../utils/measurements';
import type { WeightUnit } from '../../types';

interface Props {
    lang: 'es' | 'en';
    entries: MeasurementLog[];
    weightUnit: WeightUnit;
    sizeUnit: SizeUnit;
    onEdit: (entry: MeasurementLog) => void;
    onDelete: (id: number) => void;
}

const CHIP_KEYS: MeasurementMetricKey[] = [
    'weight', 'bodyFat', 'calories',
    'neck', 'shoulders', 'chest', 'waist', 'hips',
];

export const MeasurementsHistory: React.FC<Props> = ({
    lang,
    entries,
    weightUnit,
    sizeUnit,
    onEdit,
    onDelete,
}) => {
    const t = mstr(lang);
    const g = TRANSLATIONS[lang];
    const [confirmId, setConfirmId] = useState<number | null>(null);

    if (entries.length === 0) return null;
    const pending = confirmId !== null ? entries.find((e) => e.id === confirmId) ?? null : null;

    return (
        <div className="gl-panel p-4">
            <p className="mb-3 text-sm font-bold tracking-tight text-[rgb(var(--text-primary))]">
                {t.history} · {t.entries(entries.length)}
            </p>
            <div className="space-y-1">
                {entries.map((entry) => {
                    const chips = MEASUREMENT_FIELDS.filter(
                        (f) => CHIP_KEYS.includes(f.key) && typeof entry[f.key] === 'number',
                    );
                    const extra = MEASUREMENT_FIELDS.filter(
                        (f) => !CHIP_KEYS.includes(f.key) && typeof entry[f.key] === 'number',
                    ).length;
                    return (
                        <div
                            key={entry.id}
                            className="border-b border-border-subtle/50 py-2.5 last:border-0"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-muted">
                                        {formatMeasureDate(entry.date, lang)}
                                    </p>
                                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                                        {chips.map((f) => (
                                            <span key={f.key} className="text-xs text-muted">
                                                {t.field(f.key)}{' '}
                                                <span className="gl-num text-sm font-bold text-[rgb(var(--text-primary))]">
                                                    {formatMetricValue(
                                                        f.key,
                                                        entry[f.key] as number,
                                                        weightUnit,
                                                        sizeUnit,
                                                        lang,
                                                    )}
                                                </span>{' '}
                                                <span className="text-muted">
                                                    {metricUnitSuffix(f.key, weightUnit, sizeUnit)}
                                                </span>
                                            </span>
                                        ))}
                                        {extra > 0 && (
                                            <span className="text-xs text-secondary">
                                                +{extra} {t.extraGirths}
                                            </span>
                                        )}
                                        {chips.length === 0 && extra === 0 && entry.notes && (
                                            <span className="truncate text-xs text-muted">{entry.notes}</span>
                                        )}
                                    </div>
                                    {entry.notes && (chips.length > 0 || extra > 0) && (
                                        <p className="mt-0.5 truncate text-xs text-muted">{entry.notes}</p>
                                    )}
                                </div>
                                <div className="flex shrink-0 gap-1">
                                    <button
                                        type="button"
                                        onClick={() => onEdit(entry)}
                                        aria-label={`${t.editTitle}: ${formatMeasureDate(entry.date, lang)}`}
                                        className="gl-textbtn min-h-11 min-w-11 items-center justify-center px-2"
                                    >
                                        <Icon name="Pencil" size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setConfirmId(entry.id)}
                                        aria-label={`${t.deleteTitle} ${formatMeasureDate(entry.date, lang)}`}
                                        className="gl-textbtn min-h-11 min-w-11 items-center justify-center px-2"
                                    >
                                        <Icon name="Trash2" size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <ConfirmModal
                isOpen={pending !== null}
                title={t.deleteTitle}
                description={
                    pending
                        ? `${formatMeasureDate(pending.date, lang)} — ${t.deleteBody}`
                        : t.deleteBody
                }
                confirmText={g.delete}
                cancelText={g.cancel}
                variant="danger"
                onConfirm={() => {
                    if (pending) onDelete(pending.id);
                    setConfirmId(null);
                }}
                onCancel={() => setConfirmId(null)}
            />
        </div>
    );
};
