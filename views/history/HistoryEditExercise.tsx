import React from 'react';
import { Icon } from '../../components/ui/Icon';
import { getTranslated } from '../../utils';
import { isCardioSetEditable, isEditableSet, isIsoSetEditable, SET_TYPE_OPTIONS, setKey, type EditErrors, type EditField } from '../../utils/historyEdit';
import type { DistanceUnit, SessionExercise, WeightUnit, WorkoutSet } from '../../types';
import { unitLabel } from '../../utils/units';
import { distanceUnitLabel } from '../../utils/strongTraining';

export interface HistoryExerciseLabels {
    weight: string;
    reps: string;
    rir: string;
    setType: string;
    duration: string;
    distance: string;
    addSet: string;
    removeSet: string;
    moveUp: string;
    moveDown: string;
    removeExercise: string;
    exerciseNote: string;
    notePlaceholder: string;
    readOnly: string;
    invalid: string;
    incomplete: string;
    skipped: string;
}

interface Props {
    ex: SessionExercise;
    index: number;
    total: number;
    unit: WeightUnit;
    distanceUnit: DistanceUnit;
    lang: 'en' | 'es';
    errors: EditErrors;
    labels: HistoryExerciseLabels;
    onChange: (instanceId: number, setId: number, field: EditField, value: string) => void;
    onRemoveSet: (instanceId: number, setId: number) => void;
    onAddSet: (instanceId: number) => void;
    onMoveSet: (instanceId: number, setId: number, delta: 1 | -1) => void;
    onExerciseNote: (instanceId: number, note: string) => void;
    onRemoveExercise: (instanceId: number) => void;
    onMoveExercise: (instanceId: number, delta: 1 | -1) => void;
}

const inputClass = (bad: boolean) =>
    `h-10 w-full min-w-0 rounded-xl border bg-[rgb(var(--surface-base))] px-2 text-center tabular-nums text-sm font-bold text-zinc-950 outline-none focus:ring-2 focus:ring-primary-500 dark:text-white ${bad ? 'border-red-500' : 'border-[rgb(var(--border-subtle))]'}`;

const smallBtnClass =
    'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted transition-colors active:bg-zinc-200 dark:active:bg-white/5 disabled:opacity-25';

const moveBtnClass =
    'flex h-11 w-11 items-center justify-center rounded-full text-muted transition-colors active:bg-zinc-200 dark:active:bg-white/5 disabled:opacity-25';

/** Edit-mode card for one exercise of a finished workout: meta, all sets, reorder. */
export const HistoryEditExercise: React.FC<Props> = ({
    ex, index, total, unit, distanceUnit, lang, errors, labels,
    onChange, onRemoveSet, onAddSet, onMoveSet, onExerciseNote, onRemoveExercise, onMoveExercise,
}) => {
    const sets = ex.sets || [];
    const suffix = unitLabel(unit).toLowerCase();
    const distSuffix = distanceUnitLabel(distanceUnit);
    const hasError = Object.keys(errors).some(k => k.startsWith(`${ex.instanceId}:`));

    const renderReadOnly = (set: WorkoutSet, n: number) => {
        const status = set.skipped ? labels.skipped : !set.completed ? labels.incomplete : labels.readOnly;
        return (
            <div key={set.id} className="flex min-h-10 items-center gap-3 px-1 tabular-nums text-xs font-bold text-zinc-500">
                <span className="w-6 shrink-0 text-center text-[10px]">{n}</span>
                <span className="min-w-0 flex-1 truncate">
                    {ex.muscle === 'CARDIO'
                        ? `${set.duration ? String(set.duration) : '—'}${set.distance ? ` · ${set.distance} ${distSuffix}` : ''}`
                        : ex.isIsometric
                          ? `${set.duration ? `${set.duration}s` : '—'}${set.weight ? ` · ${set.weight} ${suffix}` : ''}`
                          : `${set.weight ?? '—'} × ${set.reps ?? '—'}`}
                </span>
                <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider">{status}</span>
            </div>
        );
    };

    return (
        <article className="premium-editor-card border-primary-500/30" data-testid={`history-edit-ex-${ex.instanceId}`}>
            <div className="px-4 pb-2 pt-4">
                <div className="flex items-center gap-1">
                    <span className="text-[11px] font-black tabular-nums text-primary-500">{index + 1}</span>
                    <h2 className="min-w-0 flex-1 truncate text-sm font-black text-zinc-950 dark:text-white">{getTranslated(ex.name, lang)}</h2>
                    <button type="button" aria-label={`${labels.moveUp} ${getTranslated(ex.name, lang)}`} disabled={index === 0} onClick={() => onMoveExercise(ex.instanceId, -1)} className={smallBtnClass}>
                        <Icon name="ChevronUp" size={17} />
                    </button>
                    <button type="button" aria-label={`${labels.moveDown} ${getTranslated(ex.name, lang)}`} disabled={index === total - 1} onClick={() => onMoveExercise(ex.instanceId, 1)} className={smallBtnClass}>
                        <Icon name="ChevronDown" size={17} />
                    </button>
                    <button type="button" aria-label={`${labels.removeExercise}: ${getTranslated(ex.name, lang)}`} onClick={() => onRemoveExercise(ex.instanceId)} className={`${smallBtnClass} active:!bg-red-500/10 active:!text-red-500`}>
                        <Icon name="Trash2" size={16} />
                    </button>
                </div>
                <input
                    type="text"
                    aria-label={labels.exerciseNote}
                    placeholder={labels.notePlaceholder}
                    value={ex.note ?? ''}
                    onChange={e => onExerciseNote(ex.instanceId, e.target.value)}
                    className="mt-2 h-9 w-full rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-base))] px-3 text-xs italic text-zinc-700 outline-none focus:ring-2 focus:ring-primary-500 dark:text-zinc-300"
                />
            </div>

            <div className="space-y-1.5 border-t border-[rgb(var(--border-subtle)/0.55)] px-3 py-2">
                {sets.map((set, i) => {
                    const n = i + 1;
                    const key = setKey(ex.instanceId, set.id);
                    const bad = errors[key];
                    const strengthEditable = isEditableSet(ex, set);
                    const cardioEditable = isCardioSetEditable(ex, set);
                    const isoEditable = isIsoSetEditable(ex, set);
                    if (!strengthEditable && !cardioEditable && !isoEditable) return renderReadOnly(set, n);

                    if (cardioEditable) {
                        return (
                            <div key={set.id} className="space-y-1.5 rounded-xl py-1">
                                <div className="grid grid-cols-[1.5rem_1fr_1fr_2.25rem] items-center gap-2">
                                    <span className="text-center text-[10px] font-black text-zinc-500">{n}</span>
                                    <input type="text" inputMode="text" aria-label={`${labels.duration} #${n}`} aria-invalid={bad?.duration ? true : undefined} className={inputClass(!!bad?.duration)} placeholder="20:00" value={String(set.duration ?? '')} onChange={e => onChange(ex.instanceId, set.id, 'duration', e.target.value)} />
                                    <input type="text" inputMode="decimal" aria-label={`${labels.distance} #${n}`} aria-invalid={bad?.distance ? true : undefined} className={inputClass(!!bad?.distance)} placeholder={distSuffix} value={String(set.distance ?? '')} onChange={e => onChange(ex.instanceId, set.id, 'distance', e.target.value)} />
                                    <button type="button" aria-label={`${labels.removeSet} #${n}`} onClick={() => onRemoveSet(ex.instanceId, set.id)} className="flex h-11 w-11 items-center justify-center rounded-full text-muted transition-colors active:bg-red-500/10 active:text-red-500">
                                        <Icon name="Trash2" size={15} />
                                    </button>
                                </div>
                                <div className="flex items-center justify-end gap-1 pl-8">
                                    <button type="button" aria-label={`${labels.moveUp} #${n}`} disabled={i === 0} onClick={() => onMoveSet(ex.instanceId, set.id, -1)} className={moveBtnClass}><Icon name="ChevronUp" size={15} /></button>
                                    <button type="button" aria-label={`${labels.moveDown} #${n}`} disabled={i === sets.length - 1} onClick={() => onMoveSet(ex.instanceId, set.id, 1)} className={moveBtnClass}><Icon name="ChevronDown" size={15} /></button>
                                </div>
                            </div>
                        );
                    }

                    if (isoEditable) {
                        return (
                            <div key={set.id} className="space-y-1.5 rounded-xl py-1">
                                <div className="grid grid-cols-[1.5rem_1fr_1fr_2.25rem] items-center gap-2">
                                    <span className="text-center text-[10px] font-black text-zinc-500">{n}</span>
                                    <input type="text" inputMode="text" aria-label={`${labels.duration} #${n}`} aria-invalid={bad?.duration ? true : undefined} className={inputClass(!!bad?.duration)} placeholder="30s" value={String(set.duration ?? '')} onChange={e => onChange(ex.instanceId, set.id, 'duration', e.target.value)} />
                                    <input type="text" inputMode="decimal" aria-label={`${labels.weight} (${suffix}) #${n}`} aria-invalid={bad?.weight ? true : undefined} className={inputClass(!!bad?.weight)} value={String(set.weight ?? '')} onChange={e => onChange(ex.instanceId, set.id, 'weight', e.target.value)} />
                                    <button type="button" aria-label={`${labels.removeSet} #${n}`} onClick={() => onRemoveSet(ex.instanceId, set.id)} className="flex h-11 w-11 items-center justify-center rounded-full text-muted transition-colors active:bg-red-500/10 active:text-red-500">
                                        <Icon name="Trash2" size={15} />
                                    </button>
                                </div>
                                <div className="flex items-center justify-end gap-1 pl-8">
                                    <button type="button" aria-label={`${labels.moveUp} #${n}`} disabled={i === 0} onClick={() => onMoveSet(ex.instanceId, set.id, -1)} className={moveBtnClass}><Icon name="ChevronUp" size={15} /></button>
                                    <button type="button" aria-label={`${labels.moveDown} #${n}`} disabled={i === sets.length - 1} onClick={() => onMoveSet(ex.instanceId, set.id, 1)} className={moveBtnClass}><Icon name="ChevronDown" size={15} /></button>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div key={set.id} className="space-y-1.5 rounded-xl py-1">
                            <div className="grid grid-cols-[1.5rem_1fr_1fr_1fr_2.25rem] items-center gap-2">
                                <span className="text-center text-[10px] font-black text-zinc-500">{set.type === 'warmup' ? 'W' : n}</span>
                                <input type="text" inputMode="decimal" aria-label={`${labels.weight} (${suffix}) #${n}`} aria-invalid={bad?.weight ? true : undefined} className={inputClass(!!bad?.weight)} value={String(set.weight ?? '')} onChange={e => onChange(ex.instanceId, set.id, 'weight', e.target.value)} />
                                <input type="text" inputMode="numeric" aria-label={`${labels.reps} #${n}`} aria-invalid={bad?.reps ? true : undefined} className={inputClass(!!bad?.reps)} value={String(set.reps ?? '')} onChange={e => onChange(ex.instanceId, set.id, 'reps', e.target.value)} />
                                <input type="text" inputMode="decimal" aria-label={`${labels.rir} #${n}`} aria-invalid={bad?.rpe ? true : undefined} className={inputClass(!!bad?.rpe)} placeholder="RIR" value={String(set.rpe ?? '')} onChange={e => onChange(ex.instanceId, set.id, 'rpe', e.target.value)} />
                                <button type="button" aria-label={`${labels.removeSet} #${n}`} onClick={() => onRemoveSet(ex.instanceId, set.id)} className="flex h-11 w-11 items-center justify-center rounded-full text-muted transition-colors active:bg-red-500/10 active:text-red-500">
                                    <Icon name="Trash2" size={15} />
                                </button>
                            </div>
                            <div className="flex items-center gap-2 pl-8">
                                <select
                                    aria-label={`${labels.setType} #${n}`}
                                    value={set.type || 'regular'}
                                    onChange={e => onChange(ex.instanceId, set.id, 'type', e.target.value)}
                                    className="h-11 min-w-0 flex-1 rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-base))] px-2 text-xs font-bold text-zinc-700 outline-none focus:ring-2 focus:ring-primary-500 dark:text-zinc-300"
                                >
                                    {SET_TYPE_OPTIONS.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                                <button type="button" aria-label={`${labels.moveUp} #${n}`} disabled={i === 0} onClick={() => onMoveSet(ex.instanceId, set.id, -1)} className={moveBtnClass}><Icon name="ChevronUp" size={15} /></button>
                                <button type="button" aria-label={`${labels.moveDown} #${n}`} disabled={i === sets.length - 1} onClick={() => onMoveSet(ex.instanceId, set.id, 1)} className={moveBtnClass}><Icon name="ChevronDown" size={15} /></button>
                            </div>
                        </div>
                    );
                })}
                {hasError && (
                    <p role="alert" className="px-1 text-[11px] font-bold text-red-500">{labels.invalid}</p>
                )}
            </div>

            <button
                type="button"
                onClick={() => onAddSet(ex.instanceId)}
                className="flex w-full items-center justify-center gap-1.5 border-t border-[rgb(var(--border-subtle)/0.55)] py-2.5 text-xs font-bold text-primary-400 transition-colors active:bg-white/5"
            >
                <Icon name="Plus" size={13} /> {labels.addSet}
            </button>
        </article>
    );
};
