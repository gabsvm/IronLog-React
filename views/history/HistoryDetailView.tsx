import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Log, WeightUnit } from '../../types';
import { HistoryEditExercise } from './HistoryEditExercise';
import { buildEditedLog, draftAddSet, draftRemoveSet, draftSetNote, draftUpdateSet, toDraft, type EditErrors } from '../../utils/historyEdit';
import { Icon } from '../../components/ui/Icon';
import { formatDate, formatDurationShort, getTranslated } from '../../utils';
import { toDisplay, unitLabel } from '../../utils/units';
import { TRANSLATIONS } from '../../constants/translations';
import { formatInteger } from '../../utils/i18n';
import { AppContext } from '../../context/app/appContexts';
import { getLogBodyWeight, getSetLoadVolume } from '../../utils/trainingMetrics';

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
    const h = TRANSLATIONS[lang].copy.historyDetail;
    const [draft, setDraft] = useState<Log | null>(null);
    const [errors, setErrors] = useState<EditErrors>({});
    const [emptyError, setEmptyError] = useState(false);
    const [confirmDiscard, setConfirmDiscard] = useState(false);
    const editing = draft !== null;
    const dirty = useMemo(() => editing && JSON.stringify(draft) !== JSON.stringify(toDraft(log, unit)), [editing, draft, log, unit]);

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

    const startEdit = () => { setErrors({}); setEmptyError(false); setConfirmDiscard(false); setDraft(toDraft(log, unit)); };
    const stopEdit = () => { setDraft(null); setErrors({}); setEmptyError(false); setConfirmDiscard(false); };
    const handleBack = () => { if (editing && dirty) setConfirmDiscard(true); else if (editing) stopEdit(); else onBack(); };
    const handleSave = () => {
        if (!draft || !onSaveEdit) return;
        const result = buildEditedLog(log, draft, unit, Date.now());
        if ('errors' in result) { setErrors(result.errors); setEmptyError(result.empty); return; }
        if (result.changed) onSaveEdit(log, result.log);
        stopEdit();
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

    return (
        <div className="fixed inset-0 z-[70] flex flex-col bg-[rgb(var(--surface-app))] text-[rgb(var(--text-primary))]">
            <header className="shrink-0 border-b border-[rgb(var(--border-subtle)/0.75)] bg-[rgb(var(--surface-base)/0.97)] pt-safe">
                <div className="flex h-14 items-center gap-3 px-3">
                    <button
                        type="button"
                        onClick={handleBack}
                        aria-label={TRANSLATIONS[lang].copy.historyDetail.back}
                        className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-500 transition-colors active:bg-zinc-200 dark:active:bg-white/5"
                    >
                        <Icon name="ArrowLeft" size={21} />
                    </button>
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-semibold text-muted">
                            {formatDate(log.endTime, lang)}
                        </div>
                        <h1 className="truncate text-base font-black tracking-tight text-zinc-950 dark:text-white">{log.name}</h1>
                    </div>
                    {editing ? (
                        <button
                            type="button"
                            onClick={handleSave}
                            className="flex h-10 items-center gap-1.5 rounded-full bg-primary-500 px-4 text-sm font-black text-black active:scale-95"
                        >
                            <Icon name="Check" size={16} /> {h.save}
                        </button>
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
                    <div role="alertdialog" aria-label={h.discardTitle} className="mb-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
                        <p className="text-sm font-bold text-amber-800 dark:text-amber-200">{h.discardTitle}</p>
                        <div className="mt-3 flex gap-2">
                            <button type="button" onClick={() => setConfirmDiscard(false)} className="flex-1 rounded-xl bg-white/5 py-2 text-xs font-bold text-zinc-800 dark:text-zinc-200">{h.keepEditing}</button>
                            <button type="button" onClick={stopEdit} className="flex-1 rounded-xl bg-red-500 py-2 text-xs font-bold text-white">{h.discard}</button>
                        </div>
                    </div>
                )}

                {emptyError && <p role="alert" className="mb-4 rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-xs font-bold text-red-400">{h.emptyWorkout}</p>}

                {editing && draft && (
                    <section className="mt-4">
                        <label className="mb-1 block text-xs font-semibold text-muted" htmlFor="history-edit-note">{h.note}</label>
                        <textarea
                            id="history-edit-note"
                            rows={2}
                            value={draft.note ?? ''}
                            onChange={e => setDraft(d => (d ? draftSetNote(d, e.target.value) : d))}
                            className="w-full premium-theme-panel p-3 text-sm text-zinc-700 outline-none focus:ring-2 focus:ring-primary-500 dark:text-zinc-300"
                        />
                    </section>
                )}

                {!editing && (log as any).note && (
                    <section className="mt-4 premium-theme-panel p-4">
                        <div className="mb-1 text-xs font-semibold text-muted">{TRANSLATIONS[lang].copy.historyDetail.note}</div>
                        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{(log as any).note}</p>
                    </section>
                )}

                {editing && draft ? (
                    <section className="mt-5 space-y-3">
                        {(draft.exercises || []).map(ex => (
                            <HistoryEditExercise
                                key={ex.instanceId}
                                ex={ex}
                                unit={unit}
                                lang={lang}
                                errors={errors}
                                labels={h}
                                onChange={(instanceId, setId, field, value) => setDraft(d => (d ? draftUpdateSet(d, instanceId, setId, field, value) : d))}
                                onRemove={(instanceId, setId) => setDraft(d => (d ? draftRemoveSet(d, instanceId, setId) : d))}
                                onAdd={(instanceId) => setDraft(d => (d ? draftAddSet(d, instanceId) : d))}
                            />
                        ))}
                    </section>
                ) : (
                <section className="mt-5 space-y-3">
                    {(log.exercises || []).map((ex, exIndex) => {
                        const completed = (ex.sets || []).filter(set => set.completed && !set.skipped);
                        return (
                            <article key={ex.instanceId ?? ex.id ?? exIndex} className="overflow-hidden premium-theme-panel">
                                <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-4">
                                    <div className="min-w-0">
                                        <h2 className="truncate text-sm font-black text-zinc-950 dark:text-white">{getTranslated(ex.name, lang)}</h2>
                                        <div className="mt-0.5 text-xs font-medium text-muted">
                                            {completed.length} {TRANSLATIONS[lang].copy.historyDetail.completedSets}
                                        </div>
                                    </div>
                                    {ex.note && <span className="max-w-[42%] truncate text-xs italic text-muted">{ex.note}</span>}
                                </div>

                                <div className="border-t border-[rgb(var(--border-subtle)/0.55)] px-3 py-2">
                                    {completed.length === 0 ? (
                                        <div className="px-2 py-3 text-xs text-zinc-500">{TRANSLATIONS[lang].copy.historyDetail.noCompletedSets}</div>
                                    ) : completed.map((set, index) => {
                                        const isCardio = ex.muscle === 'CARDIO';
                                        return (
                                            <div key={`${set.id}-${index}`} className="flex min-h-10 items-center gap-3 border-b border-[rgb(var(--border-subtle)/0.35)] px-1 last:border-0">
                                                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-black ${set.type === 'warmup' ? 'bg-amber-500/12 text-amber-500' : 'bg-primary-500/10 text-primary-500'}`}>
                                                    {set.type === 'warmup' ? 'W' : index + 1}
                                                </div>
                                                <div className="min-w-0 flex-1 font-mono text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                                    {isCardio ? (
                                                        <>
                                                            <span>{displayDuration(set.duration)}</span>
                                                            {set.distance ? <span className="ml-3 text-zinc-500">{set.distance} km</span> : null}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="text-zinc-950 dark:text-white">{toDisplay(Number(set.weight || 0), unit)} {weightSuffix}</span>
                                                            <span className="mx-2 text-zinc-500">×</span>
                                                            <span className="text-zinc-950 dark:text-white">{set.reps || 0}</span>
                                                            <span className="ml-1 text-[9px] text-zinc-500">REPS</span>
                                                        </>
                                                    )}
                                                </div>
                                                {set.rpe !== '' && set.rpe != null && (
                                                    <div className="text-xs font-bold text-muted">RIR {set.rpe}</div>
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

            {!editing && <div className="fixed bottom-0 left-0 right-0 z-[72] bg-gradient-to-t from-[rgb(var(--surface-app))] via-[rgb(var(--surface-app)/0.98)] to-transparent px-4 pb-safe pt-6">
                <button
                    type="button"
                    onClick={onRepeat}
                    disabled={repeatBlocked}
                    className="expressive-press mx-auto flex min-h-[52px] w-full max-w-md items-center justify-center gap-2 rounded-full bg-primary-500 px-5 py-4 text-sm font-black text-black shadow-lg shadow-primary-500/20 transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 disabled:shadow-none dark:disabled:bg-zinc-800 dark:disabled:text-zinc-400"
                >
                    <Icon name={repeatBlocked ? 'Lock' : 'Repeat'} size={18} />
                    {repeatBlocked
                        ? (TRANSLATIONS[lang].copy.historyDetail.finishActiveSessionTo)
                        : (TRANSLATIONS[lang].copy.historyDetail.repeatHistoricalSession)}
                </button>
            </div>}
        </div>
    );
};

const SummaryCell = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
    <div className="premium-theme-panel p-3">
        <div className="flex items-center gap-1.5 text-zinc-500">
            <Icon name={icon} size={12} />
            <span className="text-[9px] font-black uppercase tracking-[0.14em]">{label}</span>
        </div>
        <div className="mt-1.5 truncate text-base font-black tracking-tight text-zinc-950 dark:text-white">{value}</div>
    </div>
);