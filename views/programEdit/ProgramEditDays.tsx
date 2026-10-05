// T2: day/slot editor list, moved verbatim from views/ProgramEditView.tsx.
import React from 'react';
import { TRANSLATIONS, MUSCLE_GROUPS } from '../../constants';
import { Icon } from '../../components/ui/Icon';
import { Button } from '../../components/ui/Button';
import { getTranslated } from '../../utils';
import type { ProgramEditState } from './useProgramEditState';

export const ProgramEditDays: React.FC<{ state: ProgramEditState }> = ({ state }) => {
    const { program, lang, exercises, t, setPickingForSlot, setDayToDelete, handleUpdateDayName, handleAddDay, handleAddSlot, handleRemoveSlot, handleUpdateSlot } = state;
    return (
        <>
            <div className="flex-1 overflow-y-auto p-4 scroll-container space-y-6 pb-24">
                {program.map((day) => (
                    <div key={day.id} className="glass-card rounded-2xl overflow-hidden shadow-lg transition-all hover:border-white/10">
                        <div className="bg-zinc-100/80 dark:bg-white/5 p-4 border-b border-zinc-200 dark:border-white/5 flex justify-between items-center">
                            <input
                                className="bg-transparent font-bold text-zinc-900 dark:text-white outline-none w-full"
                                value={day.dayName[lang] || ''}
                                onChange={e => handleUpdateDayName(day.id, e.target.value)}
                                placeholder={TRANSLATIONS[lang].copy.programEdit.dayName}
                            />
                            <button
                                onClick={() => setDayToDelete(day.id)}
                                className="text-zinc-400 hover:text-red-500 ml-2"
                                aria-label={t.delete}
                            >
                                <Icon name="Trash2" size={18} />
                            </button>
                        </div>

                        <div className="divide-y divide-zinc-100 dark:divide-white/5">
                            {(day.slots || []).map((slot, idx) => (
                                <div key={idx} className="p-3 flex flex-col gap-2">
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 space-y-2">
                                            <div className="flex gap-2 items-center flex-wrap">
                                                <select
                                                    className="bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-xs font-bold rounded-lg px-2 py-1.5 border-none outline-none text-zinc-900 dark:text-zinc-200 max-w-[110px] transition-colors"
                                                    value={slot.muscle}
                                                    onChange={(e) => handleUpdateSlot(day.id, idx, 'muscle', e.target.value)}
                                                >
                                                    {Object.values(MUSCLE_GROUPS).map(m => (
                                                        <option key={m} value={m}>{TRANSLATIONS[lang].muscle[m]}</option>
                                                    ))}
                                                </select>

                                                <div className="flex items-center gap-1 bg-zinc-100 dark:bg-white/5 rounded-lg px-2 py-1 border border-zinc-200 dark:border-white/5">
                                                    <span className="text-[9px] font-bold text-zinc-400">SETS</span>
                                                    <input
                                                        type="number"
                                                        className="w-6 bg-transparent text-xs font-bold text-center outline-none text-zinc-900 dark:text-white"
                                                        value={slot.setTarget || ''}
                                                        onChange={e => handleUpdateSlot(day.id, idx, 'setTarget', Number(e.target.value))}
                                                    />
                                                </div>

                                                <div className="flex items-center gap-1 bg-zinc-100 dark:bg-white/5 rounded-lg px-2 py-1 flex-1 min-w-[80px] border border-zinc-200 dark:border-white/5">
                                                    <span className="text-[9px] font-bold text-zinc-400 whitespace-nowrap">REPS</span>
                                                    <input
                                                        type="text"
                                                        className="w-full bg-transparent text-xs font-bold text-center outline-none text-zinc-900 dark:text-white"
                                                        value={slot.reps || ''}
                                                        placeholder="8-12"
                                                        onChange={e => handleUpdateSlot(day.id, idx, 'reps', e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => setPickingForSlot({ dayId: day.id, slotIdx: idx })}
                                                className={`text-sm font-medium w-full text-left truncate flex items-center justify-between p-2 rounded-xl bg-zinc-100/50 dark:bg-white/5 hover:bg-zinc-200/50 dark:hover:bg-white/10 transition-colors ${
                                                    slot.exerciseId ? 'text-zinc-900 dark:text-white font-semibold' : 'text-amber-500 dark:text-amber-400 font-bold'
                                                }`}
                                            >
                                                <span>
                                                    {slot.exerciseId
                                                        ? getTranslated(exercises.find(e => e.id === slot.exerciseId)?.name, lang)
                                                        : (TRANSLATIONS[lang].copy.programEdit.selectExercise)}
                                                </span>
                                                <Icon name="ChevronRight" size={14} className="text-zinc-400 shrink-0 ml-2" />
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveSlot(day.id, idx)}
                                            className="text-zinc-300 hover:text-red-500 p-2"
                                            aria-label={t.delete}
                                        >
                                            <Icon name="X" size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-2 border-t border-zinc-100 dark:border-white/5">
                            <button
                                onClick={() => handleAddSlot(day.id)}
                                className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
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
        </>
    );
};
