import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Log, WeightUnit, MuscleGroup } from '../../types';
import { MuscleTag } from '../../components/ui/MuscleTag';
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
            <header className="shrink-0 border-b border-border-subtle bg-surface-base pt-safe">
                <div className="flex h-14 items-center gap-3 px-3">
                    <button
                        type="button"
                        onClick={handleBack}
                        aria-label={TRANSLATIONS[lang].copy.historyDetail.back}
                        className="flex h-9 w-9 items-center justify-center rounded-[4px] border border-border-subtle bg-surface-raised text-zinc-400 transition-colors hover:text-white active:scale-95"
                    >
                        <Icon name="ArrowLeft" size={18} />
                    </button>
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-[10px] font-bold uppercase tracking-wider text-muted">
                            {formatDate(log.endTime, lang)}
                        </div>
                        <h1 className="truncate text-base font-black uppercase tracking-tight text-white">{log.name}</h1>
                    </div>
                    {editing ? (
                        <button
                            type="button"
                            onClick={handleSave}
                            className="flex h-9 items-center gap-1.5 rounded-[4px] bg-primary-500 px-3.5 text-xs font-black uppercase tracking-wider text-black active:scale-95"
                        >
                            <Icon name="Check" size={14} /> {h.save}
                        </button>
                    ) : (
                        <>
                            {onSaveEdit && (
                                <button
                                    type="button"
                                    onClick={startEdit}
                                    aria-label={h.edit}
                                    className="flex h-9 w-9 items-center justify-center rounded-[4px] border border-border-subtle bg-surface-raised text-zinc-400 transition-colors hover:text-white active:scale-95"
                                >
                                    <Icon name="Pencil" size={16} />
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={onDelete}
                                aria-label={TRANSLATIONS[lang].copy.historyDetail.deleteWorkout}
                                className="flex h-9 w-9 items-center justify-center rounded-[4px] border border-border-subtle bg-surface-raised text-zinc-400 transition-colors hover:text-red-400 active:scale-95 active:bg-red-500/10 active:text-red-500"
                            >
                                <Icon name="Trash2" size={16} />
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
                    <div role="alertdialog" aria-label={h.discardTitle} className="mb-4 rounded-[8px] border border-amber-500/40 bg-amber-500/10 p-4">
                        <p className="text-sm font-bold text-amber-800 dark:text-amber-200">{h.discardTitle}</p>
                        <div className="mt-3 flex gap-2">
                            <button type="button" onClick={() => setConfirmDiscard(false)} className="flex-1 rounded-[4px] border border-border-subtle bg-surface-raised py-2 text-xs font-bold text-zinc-200">{h.keepEditing}</button>
                            <button type="button" onClick={stopEdit} className="flex-1 rounded-[4px] bg-red-500 py-2 text-xs font-bold text-white">{h.discard}</button>
                        </div>
                    </div>
                )}

                {emptyError && <p role="alert" className="mb-4 rounded-[6px] border border-red-500/40 bg-red-500/10 p-3 text-xs font-bold text-red-400">{h.emptyWorkout}</p>}

                {editing && draft && (
                    <section className="mt-4">
                        <label className="mb-1 block text-xs font-semibold text-muted" htmlFor="history-edit-note">{h.note}</label>
                        <textarea
                            id="history-edit-note"
                            rows={2}
                            value={draft.note ?? ''}
                            onChange={e => setDraft(d => (d ? draftSetNote(d, e.target.value) : d))}
                            className="w-full rounded-[6px] border border-border-subtle bg-surface-raised p-3 text-sm text-white outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                        />
                    </section>
                )}

                {!editing && (log as any).note && (
                    <section className="mt-4 rounded-[8px] border border-border-subtle bg-surface-raised p-4">
                        <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted">{TRANSLATIONS[lang].copy.historyDetail.note}</div>
                        <p className="text-sm leading-relaxed text-zinc-200">{(log as any).note}</p>
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
                            <article key={ex.instanceId ?? ex.id ?? exIndex} className="overflow-hidden rounded-[8px] border border-border-subtle bg-surface-raised">
                                <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-4">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2"><h2 className="truncate text-sm font-black uppercase tracking-tight text-white">{getTranslated(ex.name, lang)}</h2>{ex.muscle && <MuscleTag label={TRANSLATIONS[lang].muscle[ex.muscle as MuscleGroup] || ex.muscle} />}</div>
                                        <div className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-muted">
                                            {completed.length} {TRANSLATIONS[lang].copy.historyDetail.completedSets}
                                        </div>
                                    </div>
                                    {ex.note && <span className="max-w-[42%] truncate text-xs italic text-muted">{ex.note}</span>}
                                </div>

                                <div className="border-t border-border-subtle/60 px-3 py-2">
                                    {completed.length === 0 ? (
                                        <div className="px-2 py-3 text-xs text-zinc-500">{TRANSLATIONS[lang].copy.historyDetail.noCompletedSets}</div>
                                    ) : (<><div className="grid grid-cols-[2rem_1fr_1fr] items-center gap-2 pb-1.5 text-center font-mono text-[10px] font-bold uppercase tracking-wider text-muted"><span>SET</span><span>{ex.muscle === 'CARDIO' ? 'DURATION' : unitLabel(unit).toUpperCase()}</span><span>{ex.muscle === 'CARDIO' ? 'DIST' : 'REPS'}</span></div>{completed.map((set, index) => {
                                        const isCardio = ex.muscle === 'CARDIO';
                                        return (
                                            <div key={`${set.id}-${index}`} className="grid grid-cols-[2rem_1fr_1fr] items-center gap-2 border-b border-border-subtle/30 py-2 last:border-0">
                                                <div className={`flex h-6 w-6 mx-auto items-center justify-center rounded-[4px] text-[10px] font-black ${set.type === 'warmup' ? 'bg-amber-500/12 text-amber-500' : 'bg-primary-500/10 text-primary-400'}`}>
                                                    {set.type === 'warmup' ? 'W' : index + 1}
                                                </div>
                                                <div className="text-center font-mono text-xs font-bold text-white">
                                                    {isCardio ? (
                                                        <>
                                                            <span>{displayDuration(set.duration)}</span>
                                                            {/* distance moved to column 3 */}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span>{toDisplay(Number(set.weight || 0), unit)} <span className="text-[10px] text-zinc-500">{weightSuffix}</span></span>
                                                            {/* reps moved to col 3 */}
                                                            {/* reps moved */}
                                                            {/* reps label */}
                                                        </>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-center gap-1.5 font-mono text-xs font-bold text-white">{isCardio ? (set.distance ? `${set.distance} km` : '—') : (<><span>{set.reps || 0}</span>{set.rpe !== '' && set.rpe != null && <span className="rounded-[3px] bg-surface-base px-1 py-0.5 text-[9px] font-extrabold text-muted">@{set.rpe}</span>}</>)}</div>
                                                    {/* RIR rendered in col 3 */}
                                                {/* end col 3 */}
                                            </div>
                                        );
                                    })}
                                </>
                            )}
                                </div>
                            </article>
                        );
                    })}
                </section>
                )}
            </main>

            {!editing && <div className="fixed bottom-0 left-0 right-0 z-[72] bg-gradient-to-t from-surface-app via-surface-app/95 to-transparent px-4 pb-safe pt-6">
                <button
                    type="button"
                    onClick={onRepeat}
                    disabled={repeatBlocked}
                    className="expressive-press mx-auto flex min-h-[48px] w-full max-w-md items-center justify-center gap-2 rounded-[6px] bg-primary-500 px-5 py-3 text-xs font-black uppercase tracking-wider text-black shadow-lg shadow-primary-500/20 transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500 disabled:shadow-none"
                >
                    <Icon name={repeatBlocked ? 'Lock' : 'Repeat'} size={16} />
                    {repeatBlocked
                        ? (TRANSLATIONS[lang].copy.historyDetail.finishActiveSessionTo)
                        : (TRANSLATIONS[lang].copy.historyDetail.repeatHistoricalSession)}
                </button>
            </div>}
        </div>
    );
};

const SummaryCell = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
    <div className="rounded-[6px] border border-border-subtle bg-surface-raised p-3">
        <div className="flex items-center gap-1.5 text-muted">
            <Icon name={icon} size={12} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
        </div>
        <div className="mt-1.5 truncate font-mono text-base font-black tracking-tight text-white">{value}</div>
    </div>
);