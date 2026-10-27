/**
 * Measurement form (Strong parity): date/time + weight/fat/calories +
 * girth groups. Canonical units in/out; display units via props.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Sheet } from '../ui/Sheet';
import { Button } from '../ui/Button';
import { TRANSLATIONS } from '../../constants/translations';
import {
    MEASUREMENT_FIELDS,
    canonicalToInput,
    inputToCanonical,
    mstr,
    toLocalInputValue,
    validateMeasurementInput,
    type MeasurementGroup,
    type MeasurementInput,
    type MeasurementLog,
    type MeasurementMetricKey,
    type SizeUnit,
} from '../../utils/measurements';
import type { WeightUnit } from '../../types';

interface Props {
    open: boolean;
    onClose: () => void;
    lang: 'es' | 'en';
    weightUnit: WeightUnit;
    sizeUnit: SizeUnit;
    /** null = new entry; otherwise the record being edited. */
    initial: MeasurementLog | null;
    initialMetric?: MeasurementMetricKey | null;
    onSave: (input: MeasurementInput, id: number | null) => void;
}

const GROUP_ORDER: MeasurementGroup[] = ['general', 'torso', 'arms', 'core', 'legs'];

const inputSuffix = (
    key: MeasurementMetricKey,
    weightUnit: WeightUnit,
    sizeUnit: SizeUnit,
): string => {
    if (key === 'weight') return weightUnit === 'lb' ? 'lbs' : 'kg';
    if (key === 'bodyFat') return '%';
    if (key === 'calories') return 'kcal';
    return sizeUnit === 'in' ? 'in' : 'cm';
};

export const MeasurementFormModal: React.FC<Props> = ({
    open,
    onClose,
    lang,
    weightUnit,
    sizeUnit,
    initial,
    initialMetric,
    onSave,
}) => {
    const t = mstr(lang);
    const g = TRANSLATIONS[lang];
    const [values, setValues] = useState<Record<string, string>>({});
    const [dateStr, setDateStr] = useState<string>('');
    const [notes, setNotes] = useState<string>('');
    const [showErrors, setShowErrors] = useState(false);

    useEffect(() => {
        if (!open) return;
        const next: Record<string, string> = {};
        for (const f of MEASUREMENT_FIELDS) {
            const v = initial?.[f.key];
            next[f.key] = typeof v === 'number' ? canonicalToInput(f.key, v, weightUnit, sizeUnit) : '';
        }
        setValues(next);
        setDateStr(toLocalInputValue(initial?.date ?? Date.now()));
        setNotes(initial?.notes ?? '');
        setShowErrors(false);
    }, [open, initial, weightUnit, sizeUnit]);

    // Empty/invalid date never falls back to "now" silently: it blocks save
    // with a visible error instead of recording a false timestamp.
    const dateMs = new Date(dateStr).getTime();
    const dateValid = dateStr.trim() !== '' && Number.isFinite(dateMs);

    const draft = useMemo<MeasurementInput>(() => {
        const out: MeasurementInput = { date: dateValid ? dateMs : 0 };
        for (const f of MEASUREMENT_FIELDS) {
            const parsed = inputToCanonical(f.key, values[f.key] ?? '', weightUnit, sizeUnit);
            if (parsed !== undefined && !Number.isNaN(parsed)) out[f.key] = parsed;
        }
        const trimmed = notes.trim();
        if (trimmed !== '') out.notes = trimmed.slice(0, 500);
        return out;
    }, [values, dateValid, dateMs, notes, weightUnit, sizeUnit]);

    const validation = useMemo(() => validateMeasurementInput(draft), [draft]);
    const unparseable = useMemo(
        () =>
            MEASUREMENT_FIELDS.filter((f) => {
                const raw = (values[f.key] ?? '').trim();
                if (raw === '') return false;
                return Number.isNaN(Number(raw));
            }).map((f) => f.key),
        [values],
    );

    const handleSave = () => {
        if (!dateValid || !validation.ok || unparseable.length > 0) {
            setShowErrors(true);
            return;
        }
        onSave(draft, initial?.id ?? null);
        onClose();
    };

    return (
        <Sheet
            open={open}
            onOpenChange={(next) => {
                if (!next) onClose();
            }}
            title={initial ? t.editTitle : t.newTitle}
            accent="primary"
            footer={
                <div className="flex gap-3">
                    <Button variant="secondary" onClick={onClose} fullWidth>
                        {g.cancel}
                    </Button>
                    <Button onClick={handleSave} fullWidth>
                        {g.save}
                    </Button>
                </div>
            }
        >
            <div className="space-y-5 p-5">
                <div>
                    <label
                        htmlFor="measure-datetime"
                        className="mb-2 block px-1 text-sm font-semibold tracking-normal text-muted"
                    >
                        {t.dateTime}
                    </label>
                    <input
                        id="measure-datetime"
                        type="datetime-local"
                        value={dateStr}
                        onChange={(e) => setDateStr(e.target.value)}
                        aria-invalid={showErrors && !dateValid}
                        className={`gl-input tabular-nums ${showErrors && !dateValid ? 'border-red-500' : ''}`}
                    />
                    {showErrors && !dateValid && (
                        <p className="mt-1 text-xs text-red-600">{t.badDate}</p>
                    )}
                </div>

                {GROUP_ORDER.map((group) => (
                    <div key={group}>
                        <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-muted">
                            {t.group(group)}
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            {MEASUREMENT_FIELDS.filter((f) => f.group === group).map((f) => {
                                const bad =
                                    showErrors &&
                                    (validation.outOfRange.includes(f.key) || unparseable.includes(f.key));
                                return (
                                    <div key={f.key}>
                                        <label
                                            htmlFor={`measure-${f.key}`}
                                            className="mb-1 block text-sm font-semibold text-muted"
                                        >
                                            {t.field(f.key)}
                                        </label>
                                        <div className="relative">
                                            <input
                                                id={`measure-${f.key}`}
                                                type="number"
                                                inputMode="decimal"
                                                step="0.1"
                                                value={values[f.key] ?? ''}
                                                onChange={(e) =>
                                                    setValues((prev) => ({ ...prev, [f.key]: e.target.value }))
                                                }
                                                placeholder="—"
                                                autoFocus={initialMetric === f.key}
                                                className={`gl-input pr-14 tabular-nums ${bad ? 'border-red-500' : ''}`}
                                            />
                                            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-medium text-secondary">
                                                {inputSuffix(f.key, weightUnit, sizeUnit)}
                                            </div>
                                        </div>
                                        {bad && (
                                            <p className="mt-1 text-xs text-red-600">
                                                {t.outOfRange(f.min, f.max)}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}

                <div>
                    <label
                        htmlFor="measure-notes"
                        className="mb-2 block px-1 text-sm font-semibold tracking-normal text-muted"
                    >
                        {t.notes}
                    </label>
                    <textarea
                        id="measure-notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={t.notesPlaceholder}
                        className="premium-form-input min-h-[72px] w-full resize-none px-4 py-3 font-normal placeholder:text-muted"
                    />
                </div>

                {showErrors && (validation.empty || unparseable.length > 0) && (
                    <p className="text-sm text-red-600">{t.atLeastOne}</p>
                )}
            </div>
        </Sheet>
    );
};
