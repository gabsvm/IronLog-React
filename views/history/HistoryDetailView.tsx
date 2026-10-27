import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Log, WeightUnit } from '../../types';
import { HistoryEditExercise, type HistoryExerciseLabels } from './HistoryEditExercise';
import { ExerciseSelector } from '../../components/ui/ExerciseSelector';
import {
    buildEditedLog, buildTemplateFromLog, combineDateTime,
    draftAddExercise, draftAddSet, draftMoveExercise, draftMoveSet,
    draftRemoveExercise, draftRemoveSet, draftSetExerciseNote, draftSetMeta,
    draftSetNote, draftUpdateSet, toDateInputValue, toTimeInputValue, toDraft,
    type EditErrors, type MetaErrors,
} from '../../utils/historyEdit';
import { Icon } from '../../components/ui/Icon';
import { formatDate, formatDurationShort, getTranslated, uid } from '../../utils';
import { formatWeight, toDisplay, unitLabel } from '../../utils/units';
import { distanceUnitLabel, formatDistance } from '../../utils/strongTraining';
import { TRANSLATIONS } from '../../constants/translations';
import { formatInteger, formatMessage } from '../../utils/i18n';
import { AppContext } from '../../context/app/appContexts';
import { getLogBodyWeight, getSetLoadVolume } from '../../utils/trainingMetrics';
import type { ExerciseDef } from '../../types';

interface Props {
    log: Log;
    lang: 'en' | 'es';
    onBack: () => void;
    onRepeat: () => void;
    onDelete: () => void;
    /** Persist an edited copy of this workout (see docs/specs/history-edit.md). Editing is hidden when absent. */
    onSaveEdit?: (original: Log, edited: Log) => void;
    repeatBlocked?: boolean;
    unit?: WeightUnit;
    onDirtyChange?: (dirty: boolean) => void;
}

const displayDuration = (val: string | number | undefined) => {
    if (val == null || val === '') return '—';
    if (typeof val === 'string' && val.includes(':')) return val;
    return `${val}s`;
};

export const HistoryDetailView: React.FC<Props> = ({ log, lang, onBack, onRepeat, onDelete, onSaveEdit, repeatBlocked = false, unit = 'kg', onDirtyChange }) => {
    const app = useContext(AppContext);
    const userProfile = app?.userProfile;
    const distanceUnit = app?.config?.distanceUnit ?? 'km';
    const h = TRANSLATIONS[lang].copy.historyDetail;
    const [draft, setDraft] = useState<Log | null>(null);
    const [errors, setErrors] = useState<EditErrors>({});
    const [metaErrors, setMetaErrors] = useState<MetaErrors>({});
    const [emptyError, setEmptyError] = useState(false);
    const [confirmDiscard, setConfirmDiscard] = useState(false);
    const [showPicker, setShowPicker] = useState(false);
    const [templateSaved, setTemplateSaved] = useState(false);
    const editing = draft !== null;
    const dirty = useMemo(() => editing && JSON.stringify(draft) !== JSON.stringify(toDraft(log, unit, distanceUnit)), [editing, draft, log, unit, distanceUnit]);

    // Editor labels live in copy.historyDetail (Q19 ratchet: no inline lang ternaries).
    const L = useMemo(() => ({
        name: h.editWorkoutName,
        date: h.editDate,
        start: h.editStartTime,
        durationMin: h.editDurationMin,
        rir: 'RIR',
        setType: h.editSetType,
        setDuration: h.editSetDuration,
        setDistance: formatMessage(h.editSetDistance, { unit: distanceUnitLabel(distanceUnit) }),
        moveUp: h.moveUp,
        moveDown: h.moveDown,
        removeExercise: h.removeExercise,
        addExercise: h.addExercise,
        exerciseNote: h.exerciseNote,
        notePlaceholder: h.notePlaceholder,
        discardChanges: h.discardChanges,
        saveTemplate: h.saveAsTemplate,
        templateSaved: h.templateSavedMsg,
        incomplete: h.incompleteSet,
        metaName: h.metaName,
        metaDate: h.metaDate,
        metaDuration: h.metaDuration,
        metaNote: h.metaNote,
    }), [h, distanceUnit]);

    const exLabels: HistoryExerciseLabels = useMemo(() => ({
        weight: h.weight, reps: h.reps, rir: L.rir, setType: L.setType,
        duration: L.setDuration, distance: L.setDistance,
        addSet: h.addSet, removeSet: h.removeSet, moveUp: L.moveUp, moveDown: L.moveDown,
        removeExercise: L.removeExercise, exerciseNote: L.exerciseNote, notePlaceholder: L.notePlaceholder,
        readOnly: h.readOnly, invalid: h.invalid,
        incomplete: L.incomplete, skipped: TRANSLATIONS[lang].skipped,
    }), [h, L, lang]);

    useEffect(() => {
        onDirtyChange?.(editing && dirty);
    }, [editing, dirty, onDirtyChange]);

    useEffect(() => {
        if (!editing || !dirty) return;
        const onPop = () => {
            try {
                window.history.pushState({ ...(window.history.state || {}), historyDetail: log.id }, '', '#history-detail');
            } catch { }
            setConfirmDiscard(true);
        };
        window.addEventListener('popstate', onPop);
        return () => window.removeEventListener('popstate', onPop);
    }, [editing, dirty, log.id]);

    useEffect(() => {
        if (!templateSaved) return;
        const timer = window.setTimeout(() => setTemplateSaved(false), 3500);
        return () => window.clearTimeout(timer);
    }, [templateSaved]);

    const startEdit = () => { setErrors({}); setMetaErrors({}); setEmptyError(false); setConfirmDiscard(false); setShowPicker(false); setDraft(toDraft(log, unit, distanceUnit)); };
    const stopEdit = () => { setDraft(null); setErrors({}); setMetaErrors({}); setEmptyError(false); setConfirmDiscard(false); setShowPicker(false); };
    const handleBack = () => { if (editing && dirty) setConfirmDiscard(true); else if (editing) stopEdit(); else onBack(); };
    const handleSave = () => {
        if (!draft || !onSaveEdit) return;
        const result = buildEditedLog(log, draft, unit, Date.now(), distanceUnit);
        if ('errors' in result) { setErrors(result.errors); setMetaErrors(result.metaErrors); setEmptyError(result.empty); return; }
        if (result.changed) onSaveEdit(log, result.log);
        stopEdit();
    };

    const handlePickExercise = (exId: string, exercise?: ExerciseDef) => {
        const found = exercise ?? (app?.exercises ?? []).find(e => e.id === exId);
        if (found) setDraft(d => (d ? draftAddExercise(d, found) : d));
        setShowPicker(false);
    };

    const shiftDay = (dateStr: string, timeStr: string) => {
        setDraft(d => {
            if (!d) return d;
            const ns = combineDateTime(dateStr, timeStr);
            if (ns == null) return d;
            const delta = ns - d.startTime;
            return draftSetMeta(d, { startTime: ns, endTime: d.endTime + delta });
        });
    };

    const canTemplate = !!app?.setPersonalTemplates;
    const handleSaveTemplate = () => {
        if (!app?.setPersonalTemplates || templateSaved) return;
        const tpl = buildTemplateFromLog(log, Date.now(), uid());
        app.setPersonalTemplates(prev => [tpl, ...(Array.isArray(prev) ? prev : [])]);
        setTemplateSaved(true);
    };

    const weightSuffix = unitLabel(unit).toLowerCase();
    const summary = useMemo(() => {
        let sets = 0;
        let volume = 0;
        const logBodyWeight = getLogBodyWeight(log, userProfile?.bodyWeight);
        (log.exercises || []).forEach(ex => {
            (ex.sets || []).forEach(s => {
                if (!s.completed || s.skipped) return;
                sets += 1;
                volume += getSetLoadVolume(s, ex, logBodyWeight);
            });
        });
        return {
            sets,
            exercises: (log.exercises || []).length,
            volume: Math.round(volume),
        };
    }, [log, userProfile?.bodyWeight]);

    const metaAlert = metaErrors.name ? L.metaName
        : metaErrors.date ? L.metaDate
        : metaErrors.duration ? L.metaDuration
        : metaErrors.note ? L.metaNote : null;

    const metaInputClass = (bad: boolean) =>
        `h-11 w-full rounded-xl border bg-[rgb(var(--surface-base))] px-3 text-sm font-bold text-zinc-950 outline-none focus:ring-2 focus:ring-primary-500 dark:text-white ${bad ? 'border-red-500' : 'border-[rgb(var(--border-subtle))]'}`;

    return (
        <div className="fixed inset-0 z-[70] flex flex-col bg-[rgb(var(--surface-app))] text-[rgb(var(--text-primary))]">
            <header className="shrink-0 border-b border-[rgb(var(--border-subtle)/0.75)] bg-[rgb(var(--surface-base)/0.97)] pt-safe">
                <div className="flex h-14 items-center gap-1 px-3">
                    <button
                        type="button"
                        onClick={handleBack}
                        aria-label={TRANSLATIONS[lang].copy.historyDetail.back}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-zinc-500 transition-colors active:bg-zinc-200 dark:active:bg-white/5"
                    >
                        <Icon name="ArrowLeft" size={21} />
                    </button>
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-semibold text-muted">
                            {formatDate(log.endTime, lang)}
                        </div>
                        <h1 className="truncate text-base font-black tracking-tight text-zinc-950 dark:text-white">{editing && draft ? draft.name : log.name}</h1>
                    </div>
                    {editing ? (
                        <>
                            <button
                                type="button"
                                onClick={() => setConfirmDiscard(true)}
                                aria-label={L.discardChanges}
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-zinc-500 transition-colors active:bg-zinc-200 dark:active:bg-white/5"
                            >
                                <Icon name="X" size={19} />
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-primary-500 px-4 text-sm font-black text-black active:scale-95"
                            >
                                <Icon name="Check" size={16} /> {h.save}
                            </button>
                        </>
                    ) : (
                        <>
                            {onSaveEdit && (
                                <button
                                    type="button"
                                    onClick={startEdit}
                                    aria-label={h.edit}
                                    className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-500 transition-colors active:bg-zinc-200 dark:active:bg-white/5"
                                >
                                    <Icon name="Pencil" size={18} />
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={onDelete}
                                aria-label={TRANSLATIONS[lang].copy.historyDetail.deleteWorkout}
                                className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-500 transition-colors active:bg-red-500/10 active:text-red-500"
                            >
                                <Icon name="Trash2" size={18} />
                            </button>
                        </>
                    )}
                </div>
            </header>

            <main className="flex-1 overflow-y-auto scroll-container px-4 pb-32 pt-4">
                <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <SummaryCell icon="Clock" label={TRANSLATIONS[lang].copy.historyDetail.duration} value={formatDurationShort(log.duration)} />
                    <SummaryCell icon="Dumbbell" label={TRANSLATIONS[lang].copy.historyDetail.exercises} value={String(summary.exercises)} />
                    <SummaryCell icon="CheckCircle" label={TRANSLATIONS[lang].copy.historyDetail.sets} value={String(summary.sets)} />
                    <SummaryCell icon="TrendingUp" label={TRANSLATIONS[lang].copy.historyDetail.volume} value={summary.volume > 0 ? `${formatInteger(toDisplay(summary.volume, unit), lang)} ${weightSuffix}` : '—'} />
                </section>

                {confirmDiscard && (
                    <div role="alertdialog" aria-label={h.discardTitle} className="mb-4 mt-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
                        <p className="text-sm font-bold text-amber-800 dark:text-amber-200">{h.discardTitle}</p>
                        <div className="mt-3 flex gap-2">
                            <button type="button" onClick={() => setConfirmDiscard(false)} className="flex-1 rounded-xl bg-white/5 py-2 text-xs font-bold text-zinc-800 dark:text-zinc-200">{h.keepEditing}</button>
                            <button type="button" onClick={stopEdit} className="flex-1 rounded-xl bg-red-500 py-2 text-xs font-bold text-white">{h.discard}</button>
                        </div>
                    </div>
                )}

                {emptyError && <p role="alert" className="mb-4 mt-4 rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-xs font-bold text-red-400">{h.emptyWorkout}</p>}
                {metaAlert && <p role="alert" className="mb-4 mt-4 rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-xs font-bold text-red-400">{metaAlert}</p>}

                {editing && draft && (
                    <section className="mt-4 space-y-3 rounded-2xl border border-primary-500/30 bg-[rgb(var(--surface-raised))] p-4">
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-muted" htmlFor="history-edit-name">{L.name}</label>
                            <input
                                id="history-edit-name"
                                type="text"
                                value={draft.name}
                                maxLength={MAX_NAME}
                                onChange={e => setDraft(d => (d ? draftSetMeta(d, { name: e.target.value }) : d))}
                                aria-invalid={metaErrors.name ? true : undefined}
                                className={metaInputClass(!!metaErrors.name)}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-muted" htmlFor="history-edit-date">{L.date}</label>
                                <input
                                    id="history-edit-date"
                                    type="date"
                                    value={toDateInputValue(draft.startTime)}
                                    onChange={e => shiftDay(e.target.value, toTimeInputValue(draft.startTime))}
                                    aria-invalid={metaErrors.date ? true : undefined}
                                    className={metaInputClass(!!metaErrors.date)}
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-muted" htmlFor="history-edit-start">{L.start}</label>
                                <input
                                    id="history-edit-start"
                                    type="time"
                                    value={toTimeInputValue(draft.startTime)}
                                    onChange={e => shiftDay(toDateInputValue(draft.startTime), e.target.value)}
                                    aria-invalid={metaErrors.date ? true : undefined}
                                    className={metaInputClass(!!metaErrors.date)}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-muted" htmlFor="history-edit-duration">{L.durationMin}</label>
                            <input
                                id="history-edit-duration"
                                type="number"
                                min={0}
                                inputMode="numeric"
                                value={String(Math.max(0, Math.round((draft.duration ?? 0) / 60)))}
                                onChange={e => {
                                    const mins = Math.max(0, Math.floor(Number(e.target.value) || 0));
                                    setDraft(d => (d ? draftSetMeta(d, { endTime: d.startTime + mins * 60000, duration: mins * 60 }) : d));
                                }}
                                className={metaInputClass(false)}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-muted" htmlFor="history-edit-note">{h.note}</label>
                            <textarea
                                id="history-edit-note"
                                rows={2}
                                value={draft.note ?? ''}
                                onChange={e => setDraft(d => (d ? draftSetNote(d, e.target.value) : d))}
                                aria-invalid={metaErrors.note ? true : undefined}
                                className="w-full premium-theme-panel p-3 text-sm text-zinc-700 outline-none focus:ring-2 focus:ring-primary-500 dark:text-zinc-300"
                            />
                        </div>
                    </section>
                )}

                {!editing && log.note && (
                    <section className="mt-4 premium-theme-panel p-4">
                        <div className="mb-1 text-xs font-semibold text-muted">{TRANSLATIONS[lang].copy.historyDetail.note}</div>
                        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{log.note}</p>
                    </section>
                )}

                {editing && draft ? (
                    <section className="mt-5 space-y-3">
                        {(draft.exercises || []).map((ex, i) => (
                            <HistoryEditExercise
                                key={ex.instanceId}
                                ex={ex}
                                index={i}
                                total={(draft.exercises || []).length}
                                unit={unit}
                                distanceUnit={distanceUnit}
                                lang={lang}
                                errors={errors}
                                labels={exLabels}
                                onChange={(instanceId, setId, field, value) => setDraft(d => (d ? draftUpdateSet(d, instanceId, setId, field, value) : d))}
                                onRemoveSet={(instanceId, setId) => setDraft(d => (d ? draftRemoveSet(d, instanceId, setId) : d))}
                                onAddSet={(instanceId) => setDraft(d => (d ? draftAddSet(d, instanceId) : d))}
                                onMoveSet={(instanceId, setId, delta) => setDraft(d => (d ? draftMoveSet(d, instanceId, setId, delta) : d))}
                                onExerciseNote={(instanceId, note) => setDraft(d => (d ? draftSetExerciseNote(d, instanceId, note) : d))}
                                onRemoveExercise={(instanceId) => setDraft(d => (d ? draftRemoveExercise(d, instanceId) : d))}
                                onMoveExercise={(instanceId, delta) => setDraft(d => (d ? draftMoveExercise(d, instanceId, delta) : d))}
                            />
                        ))}
                        <button
                            type="button"
                            onClick={() => setShowPicker(true)}
                            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-primary-500/50 px-4 text-sm font-bold text-primary-400 transition-colors active:bg-white/5"
                        >
                            <Icon name="Plus" size={16} /> {L.addExercise}
                        </button>
                    </section>
                ) : (
                <section className="mt-5 space-y-3">
                    {(log.exercises || []).map((ex, exIndex) => {
                        const sets = ex.sets || [];
                        return (
                            <article key={ex.instanceId ?? ex.id ?? exIndex} className="overflow-hidden premium-theme-panel">
                                <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-4">
                                    <div className="min-w-0">
                                        <h2 className="truncate text-sm font-semibold text-[rgb(var(--text-primary))]">{getTranslated(ex.name, lang)}</h2>
                                    </div>
                                    {ex.note && <span className="max-w-[42%] truncate text-xs italic text-muted">{ex.note}</span>}
                                </div>

                                <div className="border-t border-[rgb(var(--border-subtle)/0.55)] px-3 py-2">
                                    {sets.length === 0 ? (
                                        <div className="px-2 py-3 text-xs text-zinc-500">{TRANSLATIONS[lang].copy.historyDetail.noCompletedSets}</div>
                                    ) : sets.map((set, index) => {
                                        const isCardio = ex.muscle === 'CARDIO';
                                        const isIso = !isCardio && !!ex.isIsometric;
                                        const dimmed = !set.completed || set.skipped;
                                        return (
                                            <div key={`${set.id}-${index}`} className={`flex min-h-10 items-center gap-3 border-b border-[rgb(var(--border-subtle)/0.35)] px-1 last:border-0 ${dimmed ? 'opacity-55' : ''}`}>
                                                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-black ${set.type === 'warmup' ? 'bg-amber-500/12 text-amber-500' : 'bg-primary-500/10 text-primary-500'}`}>
                                                    {set.type === 'warmup' ? 'W' : index + 1}
                                                </div>
                                                <div className="min-w-0 flex-1 text-sm font-medium tabular-nums text-zinc-700 dark:text-zinc-300">
                                                    {isCardio ? (
                                                        <>
                                                            <span>{displayDuration(set.duration)}</span>
                                                            {set.distance !== '' && set.distance != null ? <span className="ml-3 text-zinc-500">{formatDistance(Number(set.distance), distanceUnit, lang)} {distanceUnitLabel(distanceUnit)}</span> : null}
                                                        </>
                                                    ) : isIso ? (
                                                        <>
                                                            <span className="text-zinc-950 dark:text-white">{displayDuration(set.duration)}</span>
                                                            {set.weight !== '' && set.weight != null && Number(set.weight) > 0 ? (
                                                                <span className="ml-3 text-zinc-500">+{formatWeight(Number(set.weight || 0), unit, lang)} {weightSuffix}</span>
                                                            ) : null}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="text-zinc-950 dark:text-white">{formatWeight(Number(set.weight || 0), unit, lang)} {weightSuffix}</span>
                                                            <span className="mx-2 text-zinc-500">×</span>
                                                            <span className="text-zinc-950 dark:text-white">{set.reps || 0}</span>
                                                            {set.type && set.type !== 'regular' && set.type !== 'warmup' ? (
                                                                <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-muted">{set.type}</span>
                                                            ) : null}
                                                        </>
                                                    )}
                                                </div>
                                                {set.rpe !== '' && set.rpe != null && !isCardio && (
                                                    <div className="shrink-0 text-xs font-bold text-muted">RIR {set.rpe}</div>
                                                )}
                                                {dimmed && (
                                                    <div className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-muted">
                                                        {set.skipped ? TRANSLATIONS[lang].skipped : L.incomplete}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </article>
                        );
                    })}
                </section>
                )}
            </main>

            {!editing && (
                <div className="fixed bottom-0 left-0 right-0 z-[72] bg-gradient-to-t from-[rgb(var(--surface-app))] via-[rgb(var(--surface-app)/0.98)] to-transparent px-4 pb-safe pt-6">
                    <div className="mx-auto flex w-full max-w-md flex-col gap-2 pb-4">
                        {templateSaved && (
                            <div role="status" className="rounded-2xl border border-primary-500/40 bg-primary-500/10 px-4 py-2.5 text-center text-xs font-bold text-[rgb(var(--text-primary))]">
                                {L.templateSaved}
                            </div>
                        )}
                        {canTemplate && (
                            <button
                                type="button"
                                onClick={handleSaveTemplate}
                                disabled={templateSaved}
                                className="mx-auto flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] px-5 py-3 text-sm font-bold text-[rgb(var(--text-primary))] transition-transform active:scale-[0.98] disabled:opacity-60"
                            >
                                <Icon name="Copy" size={16} />
                                {L.saveTemplate}
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onRepeat}
                            disabled={repeatBlocked}
                            className="expressive-press mx-auto flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-primary-500 px-5 py-4 text-sm font-black text-black shadow-lg shadow-primary-500/20 transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 disabled:shadow-none dark:disabled:bg-zinc-800 dark:disabled:text-zinc-400"
                        >
                            <Icon name={repeatBlocked ? 'Lock' : 'Repeat'} size={18} />
                            {repeatBlocked
                                ? (TRANSLATIONS[lang].copy.historyDetail.finishActiveSessionTo)
                                : (TRANSLATIONS[lang].copy.historyDetail.repeatHistoricalSession)}
                        </button>
                    </div>
                </div>
            )}

            {showPicker && editing && (
                <ExerciseSelector
                    onSelect={handlePickExercise}
                    onClose={() => setShowPicker(false)}
                    excludeIds={(draft?.exercises || []).map(e => e.id)}
                />
            )}
        </div>
    );
};

const MAX_NAME = 120;

const SummaryCell = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
    <div className="premium-theme-panel p-3">
        <div className="mb-1 flex items-center gap-1 text-muted">
            <Icon name={icon} size={12} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
        </div>
        <div className="truncate text-sm font-black tabular-nums text-zinc-950 dark:text-white">{value}</div>
    </div>
);
