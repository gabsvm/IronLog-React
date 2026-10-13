// T2: create/edit exercise form, moved verbatim from views/ExercisesView.tsx.
import React from 'react';
import { TRANSLATIONS, MUSCLE_GROUPS } from '../../constants';
import { Button } from '../../components/ui/Button';
import { VolumeCountingMode } from '../../types';
import type { ExercisesViewState } from './useExercisesViewState';

export const ExercisesEditMode: React.FC<{ state: ExercisesViewState }> = ({ state }) => {
    const { lang, t, ev, setMode, newName, setNewName, newMuscle, setNewMuscle, newVolumeCountingMode, setNewVolumeCountingMode, handleCreate } = state;
    return (
        <>
                <div className="mx-auto w-full max-w-2xl space-y-5 overflow-y-auto p-4 pb-[calc(1.5rem+var(--safe-area-bottom))] sm:p-6">
                    <div>
                        <label className="mb-2 block text-sm font-bold text-[rgb(var(--text-secondary))]">{t.exName}</label>
                        <input
                            type="text"
                            className="premium-form-input w-full p-3 font-medium"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            placeholder="e.g., Incline Machine Press"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-bold text-[rgb(var(--text-secondary))]">{t.selectMuscle}</label>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.values(MUSCLE_GROUPS).map(m => (
                                <button
                                    key={m}
                                    onClick={() => setNewMuscle(m)}
                                    aria-pressed={newMuscle === m}
                                    className={`expressive-press min-h-11 rounded-[18px] border p-3 text-xs font-bold ${
                                        newMuscle === m
                                            ? 'bg-primary-500 border-primary-500 text-zinc-950'
                                            : 'bg-[rgb(var(--surface-raised))] border-[rgb(var(--border-subtle))] text-[rgb(var(--text-secondary))] hover:border-primary-500/30'
                                    }`}
                                >
                                    {TRANSLATIONS[lang].muscle[m]}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-bold text-[rgb(var(--text-secondary))]">
                            {ev.tonnage}
                        </label>
                        <select
                            value={newVolumeCountingMode}
                            onChange={e => setNewVolumeCountingMode(e.target.value as VolumeCountingMode)}
                            className="premium-form-input w-full p-3 font-medium"
                        >
                            <option value="total">{ev.countTotal}</option>
                            <option value="per_side">{ev.countPerSide}</option>
                        </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button variant="secondary" onClick={() => setMode('list')} fullWidth>{t.cancel}</Button>
                        <Button onClick={handleCreate} disabled={!newName.trim()} fullWidth>{t.save}</Button>
                    </div>
                </div>
        </>
    );
};
