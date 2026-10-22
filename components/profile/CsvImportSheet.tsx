import { pickLang } from '../../utils/i18n';
import React, { useEffect, useMemo, useState } from 'react';
import { Sheet } from '../ui/Sheet';
import { Button } from '../ui/Button';
import { TRANSLATIONS, MUSCLE_GROUPS } from '../../constants';
import { getTranslated } from '../../utils';
import { isSelectorVisible } from '../../utils/exerciseLibrary';
import { unitLabel } from '../../utils/units';
import type { ExerciseDef, MuscleGroup, WeightUnit } from '../../types';
import type {
    ExerciseMappingDecision,
    ExerciseNameMatch,
    ParsedCsvImport,
    ParsedImportSession,
} from '../../services/trainingCsv';

interface CsvImportSheetProps {
    open: boolean;
    onClose: () => void;
    parsed: ParsedCsvImport;
    fresh: ParsedImportSession[];
    skippedCount: number;
    matches: ExerciseNameMatch[];
    library: ExerciseDef[];
    lang: 'es' | 'en';
    /** Current weight assumption for Strong files (Hevy carries its own unit). */
    strongUnit: WeightUnit;
    onStrongUnitChange: (unit: WeightUnit) => void;
    onConfirm: (mapping: Record<string, ExerciseMappingDecision>) => void;
}

interface RowDecision {
    mode: 'create' | 'existing';
    exerciseId: string;
    muscle: MuscleGroup | '';
}

const MUSCLES = Object.values(MUSCLE_GROUPS);

export const CsvImportSheet: React.FC<CsvImportSheetProps> = ({
    open,
    onClose,
    parsed,
    fresh,
    skippedCount,
    matches,
    library,
    lang,
    strongUnit,
    onStrongUnitChange,
    onConfirm,
}) => {
    const t = TRANSLATIONS[lang];
    const c = t.csv;

    const unmatched = useMemo(() => matches.filter((m) => !m.matched), [matches]);
    const matched = useMemo(() => matches.filter((m) => m.matched), [matches]);

    const [decisions, setDecisions] = useState<Record<string, RowDecision>>({});
    useEffect(() => {
        if (!open) return;
        const initial: Record<string, RowDecision> = {};
        for (const m of unmatched) {
            initial[m.parsedName] = { mode: 'create', exerciseId: '', muscle: '' };
        }
        setDecisions(initial);
    }, [open, unmatched]);

    const sortedLibrary = useMemo(
        () =>
            // Merged-away duplicates are not offered as mapping targets.
            [...library]
                .filter(isSelectorVisible)
                .sort((a, b) =>
                    getTranslated(a.name, lang).localeCompare(getTranslated(b.name, lang))
                ),
        [library, lang]
    );

    const freshSetCount = fresh.reduce((n, s) => n + s.setCount, 0);
    const fmtDate = (ms: number) =>
        new Date(ms).toLocaleDateString(pickLang(lang, { es: 'es-AR', en: 'en-US' }), {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });

    const setRow = (name: string, patch: Partial<RowDecision>) =>
        setDecisions((prev) => ({ ...prev, [name]: { ...prev[name]!, ...patch } }));

    const valid = unmatched.every((m) => {
        const d = decisions[m.parsedName];
        if (!d) return false;
        return d.mode === 'existing' ? d.exerciseId !== '' : d.muscle !== '';
    });

    const handleConfirm = () => {
        const mapping: Record<string, ExerciseMappingDecision> = {};
        for (const m of matched) mapping[m.parsedName] = { kind: 'existing', exerciseId: m.matched!.id };
        for (const m of unmatched) {
            const d = decisions[m.parsedName]!;
            mapping[m.parsedName] =
                d.mode === 'existing'
                    ? { kind: 'existing', exerciseId: d.exerciseId }
                    : { kind: 'create', muscle: d.muscle as MuscleGroup };
        }
        onConfirm(mapping);
    };

    return (
        <Sheet
            open={open}
            onOpenChange={(next) => {
                if (!next) onClose();
            }}
            title={c.importTitle}
            accent="primary"
            footer={
                fresh.length > 0 ? (
                    <div className="flex gap-2">
                        <Button variant="ghost" fullWidth onClick={onClose}>
                            {c.cancel}
                        </Button>
                        <Button variant="primary" fullWidth onClick={handleConfirm} disabled={!valid}>
                            {c.importAction.replace('{n}', String(fresh.length))}
                        </Button>
                    </div>
                ) : (
                    <Button fullWidth onClick={onClose}>
                        {c.cancel}
                    </Button>
                )
            }
        >
            <div className="p-5 space-y-4">
                {/* Summary */}
                <div className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-elevated)/0.6)] p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="px-2 py-0.5 rounded-full bg-surface-elevated text-accent text-xs font-semibold">
                            {parsed.source === 'hevy' ? 'Hevy' : 'Strong'}
                        </span>
                        <span className="text-xs text-muted">
                            {c.format}: {parsed.source === 'hevy' ? 'Hevy' : 'Strong'}
                        </span>
                    </div>
                    <dl className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                            <dt className="text-xs font-semibold tracking-normal text-muted">{c.sessions}</dt>
                            <dd className="font-semibold text-[rgb(var(--text-primary))]">{fresh.length}</dd>
                        </div>
                        <div>
                            <dt className="text-xs font-semibold tracking-normal text-muted">{c.sets}</dt>
                            <dd className="font-semibold text-[rgb(var(--text-primary))]">{freshSetCount}</dd>
                        </div>
                        {parsed.dateRange && (
                            <div className="col-span-2">
                                <dt className="text-xs font-semibold tracking-normal text-muted">{c.range}</dt>
                                <dd className="font-bold text-[rgb(var(--text-primary))]">
                                    {fmtDate(parsed.dateRange.min)} → {fmtDate(parsed.dateRange.max)}
                                </dd>
                            </div>
                        )}
                        <div>
                            <dt className="text-xs font-semibold tracking-normal text-muted">{c.newExercises}</dt>
                            <dd className="font-semibold text-[rgb(var(--text-primary))]">{unmatched.length}</dd>
                        </div>
                        <div>
                            <dt className="text-xs font-semibold tracking-normal text-muted">{c.alreadyImported}</dt>
                            <dd className="font-semibold text-[rgb(var(--text-primary))]">{skippedCount}</dd>
                        </div>
                        {parsed.skippedRows > 0 && (
                            <div className="col-span-2">
                                <dt className="text-xs font-semibold tracking-normal text-muted">{c.skippedRows}</dt>
                                <dd className="font-bold text-amber-500">{parsed.skippedRows}</dd>
                            </div>
                        )}
                    </dl>
                </div>

                {fresh.length === 0 && (
                    <p className="text-sm text-muted text-center py-2">{c.nothingNew}</p>
                )}

                {fresh.length > 0 && (
                    <>
                        {parsed.source === 'strong' && (
                            <div className="flex items-center justify-between gap-2 rounded-2xl border border-[rgb(var(--border-subtle))] p-3">
                                <span className="text-sm font-medium text-[rgb(var(--text-primary))]">{c.strongUnit}</span>
                                <div className="flex shrink-0 gap-1 rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-elevated))] p-1">
                                    {(['kg', 'lb'] as const).map((option) => (
                                        <button
                                            key={option}
                                            type="button"
                                            onClick={() => onStrongUnitChange(option)}
                                            aria-pressed={strongUnit === option}
                                            className={`min-h-[44px] rounded-xl px-3 text-xs font-semibold transition-all ${
                                                strongUnit === option
                                                    ? 'bg-primary-500 text-black shadow-sm'
                                                    : 'text-muted hover:text-[rgb(var(--text-primary))]'
                                            }`}
                                        >
                                            {unitLabel(option)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {matched.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold tracking-normal text-muted mb-2">
                                    {c.autoMatched} ({matched.length})
                                </p>
                                <ul className="space-y-1">
                                    {matched.map((m) => (
                                        <li
                                            key={m.parsedName}
                                            className="flex items-center justify-between gap-2 text-sm px-3 py-2 rounded-[18px] bg-[rgb(var(--surface-elevated)/0.6)]"
                                        >
                                            <span className="truncate text-zinc-700 dark:text-zinc-300">{m.parsedName}</span>
                                            <span className="shrink-0 text-emerald-500 font-bold text-xs">
                                                ✓ {getTranslated(m.matched!.name, lang)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {unmatched.length > 0 && (
                            <div className="space-y-3">
                                <p className="text-xs font-semibold tracking-normal text-muted">
                                    {c.needsMapping} ({unmatched.length})
                                </p>
                                {unmatched.map((m) => {
                                    const d = decisions[m.parsedName] ?? { mode: 'create', exerciseId: '', muscle: '' };
                                    return (
                                        <div
                                            key={m.parsedName}
                                            className="rounded-2xl border border-[rgb(var(--border-subtle))] p-3 space-y-2"
                                        >
                                            <p className="text-sm font-bold text-[rgb(var(--text-primary))]">{m.parsedName}</p>
                                            <div className="flex w-fit gap-1 rounded-2xl bg-[rgb(var(--surface-elevated))] p-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setRow(m.parsedName, { mode: 'create' })}
                                                    aria-pressed={d.mode === 'create'}
                                                className={`min-h-[44px] rounded-xl px-3 text-xs font-semibold transition-all ${
                                                    d.mode === 'create' ? 'bg-primary-500 text-black' : 'text-muted hover:text-[rgb(var(--text-primary))]'
                                                }`}
                                                >
                                                    {c.createNew}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setRow(m.parsedName, { mode: 'existing' })}
                                                    aria-pressed={d.mode === 'existing'}
                                                className={`min-h-[44px] rounded-xl px-3 text-xs font-semibold transition-all ${
                                                    d.mode === 'existing' ? 'bg-primary-500 text-black' : 'text-muted hover:text-[rgb(var(--text-primary))]'
                                                }`}
                                                >
                                                    {c.mapTo}
                                                </button>
                                            </div>
                                            {d.mode === 'create' ? (
                                                <label className="block text-xs text-muted">
                                                    {c.muscle}
                                                    <select
                                                        value={d.muscle}
                                                        onChange={(e) => setRow(m.parsedName, { muscle: e.target.value as MuscleGroup | '' })}
                                                        className="mt-1 min-h-[48px] w-full rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-elevated))] px-3 text-base font-bold text-[rgb(var(--text-primary))] outline-none focus:border-primary-500"
                                                    >
                                                        <option value="">—</option>
                                                        {MUSCLES.map((muscle) => (
                                                            <option key={muscle} value={muscle}>
                                                                {t.muscle[muscle as MuscleGroup] || muscle}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </label>
                                            ) : (
                                                <label className="block text-xs text-muted">
                                                    {c.mapTo}
                                                    <select
                                                        value={d.exerciseId}
                                                        onChange={(e) => setRow(m.parsedName, { exerciseId: e.target.value })}
                                                        className="mt-1 min-h-[48px] w-full rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-elevated))] px-3 text-base font-bold text-[rgb(var(--text-primary))] outline-none focus:border-primary-500"
                                                    >
                                                        <option value="">—</option>
                                                        {sortedLibrary.map((def) => (
                                                            <option key={def.id} value={def.id}>
                                                                {getTranslated(def.name, lang)}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </label>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>
        </Sheet>
    );
};
