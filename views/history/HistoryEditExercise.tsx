import React from 'react';
import { Icon } from '../../components/ui/Icon';
import { getTranslated } from '../../utils';
import { isEditableSet, setKey, type EditErrors, type EditField } from '../../utils/historyEdit';
import type { SessionExercise, WeightUnit } from '../../types';
import { unitLabel } from '../../utils/units';

interface Labels {
    weight: string;
    reps: string;
    addSet: string;
    removeSet: string;
    readOnly: string;
    invalid: string;
}

interface Props {
    ex: SessionExercise;
    unit: WeightUnit;
    lang: 'en' | 'es';
    errors: EditErrors;
    labels: Labels;
    onChange: (instanceId: number, setId: number, field: EditField, value: string) => void;
    onRemove: (instanceId: number, setId: number) => void;
    onAdd: (instanceId: number) => void;
}

const inputClass = (bad: boolean) =>
    `h-10 w-full min-w-0 rounded-xl border bg-[rgb(var(--surface-base))] px-2 text-center font-mono text-sm font-bold text-zinc-950 outline-none focus:ring-2 focus:ring-primary-500 dark:text-white ${bad ? 'border-red-500' : 'border-[rgb(var(--border-subtle))]'}`;

/** Edit-mode card for one exercise of a finished workout (weight/reps inputs, remove and add set). */
export const HistoryEditExercise: React.FC<Props> = ({ ex, unit, lang, errors, labels, onChange, onRemove, onAdd }) => {
    const sets = (ex.sets || []).filter(set => set.completed && !set.skipped);
    const canEdit = ex.muscle !== 'CARDIO' && !ex.isIsometric;
    const suffix = unitLabel(unit).toLowerCase();

    return (
        <article className="overflow-hidden rounded-[1.35rem] border border-primary-500/30 bg-[rgb(var(--surface-raised)/0.72)]" data-testid={`history-edit-ex-${ex.instanceId}`}>
            <div className="px-4 pb-2 pt-4">
                <h2 className="truncate text-sm font-black text-zinc-950 dark:text-white">{getTranslated(ex.name, lang)}</h2>
                {!canEdit && <div className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.13em] text-zinc-500">{labels.readOnly}</div>}
            </div>

            <div className="space-y-1.5 border-t border-[rgb(var(--border-subtle)/0.55)] px-3 py-2">
                {sets.map((set, index) => {
                    const key = setKey(ex.instanceId, set.id);
                    const bad = errors[key];
                    if (!canEdit || !isEditableSet(ex, set)) {
                        return (
                            <div key={set.id} className="flex min-h-10 items-center gap-3 px-1 font-mono text-xs font-bold text-zinc-500">
                                <span className="w-6 text-center text-[10px]">{index + 1}</span>
                                <span>{set.duration ? String(set.duration) : '—'}{set.distance ? ` · ${set.distance} km` : ''}</span>
                            </div>
                        );
                    }
                    return (
                        <div key={set.id} className="grid grid-cols-[1.5rem_1fr_1fr_2.25rem] items-center gap-2">
                            <span className="text-center text-[10px] font-black text-zinc-500">{set.type === 'warmup' ? 'W' : index + 1}</span>
                            <input
                                type="text"
                                inputMode="decimal"
                                aria-label={`${labels.weight} (${suffix}) #${index + 1}`}
                                aria-invalid={bad?.weight ? true : undefined}
                                className={inputClass(!!bad?.weight)}
                                value={String(set.weight ?? '')}
                                onChange={e => onChange(ex.instanceId, set.id, 'weight', e.target.value)}
                            />
                            <input
                                type="text"
                                inputMode="numeric"
                                aria-label={`${labels.reps} #${index + 1}`}
                                aria-invalid={bad?.reps ? true : undefined}
                                className={inputClass(!!bad?.reps)}
                                value={String(set.reps ?? '')}
                                onChange={e => onChange(ex.instanceId, set.id, 'reps', e.target.value)}
                            />
                            <button
                                type="button"
                                aria-label={`${labels.removeSet} #${index + 1}`}
                                onClick={() => onRemove(ex.instanceId, set.id)}
                                className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition-colors active:bg-red-500/10 active:text-red-500"
                            >
                                <Icon name="Trash2" size={15} />
                            </button>
                        </div>
                    );
                })}
                {Object.keys(errors).some(k => k.startsWith(`${ex.instanceId}:`)) && (
                    <p role="alert" className="px-1 text-[11px] font-bold text-red-500">{labels.invalid}</p>
                )}
            </div>

            {canEdit && (
                <button
                    type="button"
                    onClick={() => onAdd(ex.instanceId)}
                    className="flex w-full items-center justify-center gap-1.5 border-t border-[rgb(var(--border-subtle)/0.55)] py-2.5 text-xs font-bold text-primary-400 transition-colors active:bg-white/5"
                >
                    <Icon name="Plus" size={13} /> {labels.addSet}
                </button>
            )}
        </article>
    );
};
