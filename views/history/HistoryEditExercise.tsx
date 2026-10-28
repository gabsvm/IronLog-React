import React from 'react';
import { Icon } from '../../components/ui/Icon';
import { getTranslated } from '../../utils';
import { isEditableSet, setKey, type EditErrors, type EditField } from '../../utils/historyEdit';
import type { MuscleGroup, SessionExercise, WeightUnit } from '../../types';
import { MuscleTag } from '../../components/ui/MuscleTag';
import { TRANSLATIONS } from '../../constants';
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
    `h-9 w-full min-w-0 rounded-[4px] border bg-surface-base px-2 text-center font-mono text-xs font-bold text-white outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 ${bad ? 'border-red-500' : 'border-border-subtle'}`;

/** Edit-mode card for one exercise of a finished workout (weight/reps inputs, remove and add set). */
export const HistoryEditExercise: React.FC<Props> = ({ ex, unit, lang, errors, labels, onChange, onRemove, onAdd }) => {
    const sets = (ex.sets || []).filter(set => set.completed && !set.skipped);
    const canEdit = ex.muscle !== 'CARDIO' && !ex.isIsometric;
    const suffix = unitLabel(unit).toLowerCase();

    return (
        <article className="premium-editor-card overflow-hidden rounded-[8px] border border-border-subtle bg-surface-raised" data-testid={`history-edit-ex-${ex.instanceId}`}>
            <div className="flex items-center justify-between gap-2 px-4 pb-2 pt-3">
                <div className="flex min-w-0 items-center gap-2"><h2 className="truncate text-sm font-black uppercase tracking-tight text-white">{getTranslated(ex.name, lang)}</h2>{ex.muscle && <MuscleTag label={TRANSLATIONS[lang].muscle[ex.muscle as MuscleGroup] || ex.muscle} />}</div>
                {!canEdit && <div className="text-[10px] font-bold uppercase tracking-wider text-muted">{labels.readOnly}</div>}
            </div>

            <div className="space-y-1.5 border-t border-border-subtle/50 px-3 py-2">
                {canEdit && sets.length > 0 && (
                    <div className="grid grid-cols-[1.5rem_1fr_1fr_2.25rem] items-center gap-2 pb-1 text-center font-mono text-[10px] font-bold uppercase tracking-wider text-muted">
                        <span>#</span>
                        <span>{unitLabel(unit).toUpperCase()}</span>
                        <span>REPS</span>
                        <span />
                    </div>
                )}
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
                                className="flex h-9 w-9 items-center justify-center rounded-[4px] text-muted transition-colors hover:text-red-400 active:bg-red-500/10 active:text-red-500"
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
                    className="flex w-full items-center justify-center gap-1.5 border-t border-border-subtle/50 py-2.5 text-xs font-bold uppercase tracking-wider text-primary-400 transition-colors active:bg-white/5"
                >
                    <Icon name="Plus" size={13} /> {labels.addSet}
                </button>
            )}
        </article>
    );
};
