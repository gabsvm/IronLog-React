// T2: day/slot editor list, moved verbatim from views/ProgramEditView.tsx.
import React, { useState } from 'react';
import { TRANSLATIONS, MUSCLE_GROUPS } from '../../constants';
import { Icon } from '../../components/ui/Icon';
import { Button } from '../../components/ui/Button';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { pickLang } from '../../utils/i18n';
import { getTranslated } from '../../utils';
import type { ProgramEditState } from './useProgramEditState';

export const ProgramEditDays: React.FC<{ state: ProgramEditState }> = ({ state }) => {
    const { program, lang, exercises, t, setPickingForSlot, setDayToDelete, handleUpdateDayName, handleAddDay, handleAddSlot, handleRemoveSlot, handleUpdateSlot } = state;
    const [pendingRemoveSlot, setPendingRemoveSlot] = useState<{ dayId: string; slotIdx: number; name: string } | null>(null);
    return (
        <>
            <div className="flex-1 overflow-y-auto p-4 scroll-container space-y-6 pb-24">
                {program.map((day) => (
                    <div key={day.id} className="gl-panel overflow-hidden shadow-sm">
                        <div className="flex items-center justify-between border-b border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-elevated)/0.5)] p-4">
                            <input
                                className="w-full bg-transparent text-base font-bold text-[rgb(var(--text-primary))] outline-none"
                                value={day.dayName[lang] || ''}
                                onChange={e => handleUpdateDayName(day.id, e.target.value)}
                                placeholder={TRANSLATIONS[lang].copy.programEdit.dayName}
                            />
                            <button
                                onClick={() => setDayToDelete(day.id)}
                            className="ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:bg-red-500/10 hover:text-red-500"
                                aria-label={t.delete}
                            >
                                <Icon name="Trash2" size={18} />
                            </button>
                        </div>

                        <div className="divide-y divide-[rgb(var(--border-subtle)/0.65)]">
                            {(day.slots || []).map((slot, idx) => (
                                <div key={idx} className="p-3 flex flex-col gap-2">
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 space-y-2">
                                            <div className="flex gap-2 items-center flex-wrap">
                                                <select
                                                    className="rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-elevated)/0.5)] px-2 py-2.5 text-base font-bold text-[rgb(var(--text-secondary))] outline-none transition-colors"
                                                    value={slot.muscle}
                                                    onChange={(e) => handleUpdateSlot(day.id, idx, 'muscle', e.target.value)}
                                                >
                                                    {Object.values(MUSCLE_GROUPS).map(m => (
                                                        <option key={m} value={m}>{TRANSLATIONS[lang].muscle[m]}</option>
                                                    ))}
                                                </select>

                                                <div className="flex items-center gap-1 bg-[rgb(var(--surface-elevated)/0.7)] rounded-xl px-2 py-2 border border-[rgb(var(--border-subtle))]">
                                                    <span className="text-xs font-semibold text-muted">SETS</span>
                                                    <input
                                                        type="number"
                                                        className="w-8 bg-transparent text-center text-base font-bold text-[rgb(var(--text-primary))] outline-none"
                                                        value={slot.setTarget || ''}
                                                        onChange={e => handleUpdateSlot(day.id, idx, 'setTarget', Number(e.target.value))}
                                                    />
                                                </div>

                                                <div className="flex items-center gap-1 bg-[rgb(var(--surface-elevated)/0.7)] rounded-xl px-2 py-2 flex-1 min-w-[80px] border border-[rgb(var(--border-subtle))]">
                                                    <span className="whitespace-nowrap text-xs font-semibold text-muted">REPS</span>
                                                    <input
                                                        type="text"
                                                        className="w-full bg-transparent text-center text-base font-bold text-[rgb(var(--text-primary))] outline-none"
                                                        value={slot.reps || ''}
                                                        placeholder="8-12"
                                                        onChange={e => handleUpdateSlot(day.id, idx, 'reps', e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => setPickingForSlot({ dayId: day.id, slotIdx: idx })}
                                                className={`flex min-h-[44px] w-full items-center justify-between gap-2 truncate rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-elevated)/0.5)] p-2 text-left text-sm font-medium transition-colors ${
                                                    slot.exerciseId ? 'text-[rgb(var(--text-primary))] font-semibold' : 'text-amber-500 font-bold'
                                                }`}
                                            >
                                                <span>
                                                    {slot.exerciseId
                                                        ? getTranslated(exercises.find(e => e.id === slot.exerciseId)?.name, lang)
                                                        : (TRANSLATIONS[lang].copy.programEdit.selectExercise)}
                                                </span>
                                                <Icon name="ChevronRight" size={14} className="ml-2 shrink-0 text-muted" />
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => setPendingRemoveSlot({
                                                dayId: day.id,
                                                slotIdx: idx,
                                                name: getTranslated(exercises.find((exercise) => exercise.id === slot.exerciseId)?.name, lang) || '',
                                            })}
                                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:bg-red-500/10 hover:text-red-500"
                                            aria-label={t.delete}
                                        >
                                            <Icon name="X" size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-2 border-t border-[rgb(var(--border-subtle))]">
                            <button
                                onClick={() => handleAddSlot(day.id)}
                                className="expressive-press flex min-h-11 w-full items-center justify-center gap-2 rounded-xl text-xs font-bold text-primary-500"
                            >
                                <Icon name="Plus" size={14} /> {t.addSlot}
                            </button>
                        </div>
                    </div>
                ))}

                <Button variant="outline" onClick={handleAddDay} fullWidth className="py-4 border-dashed">
                    {t.addDay}
                </Button>
            </div>
            <ConfirmModal
                isOpen={pendingRemoveSlot !== null}
                title={pickLang(lang, { en: 'Remove exercise slot?', es: '¿Quitar ejercicio de la rutina?' })}
                description={pickLang(lang, {
                    en: `This removes “${pendingRemoveSlot?.name || 'unassigned slot'}” from this routine.`,
                    es: `Esto quitará “${pendingRemoveSlot?.name || 'espacio sin asignar'}” de esta rutina.`,
                })}
                confirmText={pickLang(lang, { en: 'Remove', es: 'Quitar' })}
                cancelText={pickLang(lang, { en: 'Cancel', es: 'Cancelar' })}
                variant="danger"
                onConfirm={() => {
                    if (pendingRemoveSlot) handleRemoveSlot(pendingRemoveSlot.dayId, pendingRemoveSlot.slotIdx);
                    setPendingRemoveSlot(null);
                }}
                onCancel={() => setPendingRemoveSlot(null)}
            />
        </>
    );
};
