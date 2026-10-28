// T2: create/edit exercise form, moved verbatim from views/ExercisesView.tsx.
import React from 'react';
import { TRANSLATIONS, MUSCLE_GROUPS } from '../../constants';
import { Button } from '../../components/ui/Button';
import { VolumeCountingMode } from '../../types';
import type { ExercisesViewState } from './useExercisesViewState';

export const ExercisesEditMode: React.FC<{ state: ExercisesViewState }> = ({ state }) => {
    const { lang, t, ev, setMode, newName, setNewName, newMuscle, setNewMuscle, newVolumeCountingMode, setNewVolumeCountingMode, handleCreate } = state;
    return (
        <div className="mx-auto w-full max-w-2xl p-4 pb-[calc(1.5rem+var(--safe-area-bottom))] sm:p-6">
            <div className="rounded-[8px] border border-border-subtle bg-surface-raised p-4 sm:p-6 space-y-5">
                <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-400">{t.exName}</label>
                    <input
                        type="text"
                        className="w-full rounded-[6px] bg-surface-base border border-border-subtle p-3 text-sm text-white placeholder-zinc-500 focus:border-primary-500 outline-none font-medium transition-colors"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        placeholder="e.g., Incline Machine Press"
                        autoFocus
                    />
                </div>

                <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-400">{t.selectMuscle}</label>
                    <div className="grid grid-cols-2 gap-2">
                        {Object.values(MUSCLE_GROUPS).map(m => (
                            <button
                                key={m}
                                onClick={() => setNewMuscle(m)}
                                aria-pressed={newMuscle === m}
                                className={`min-h-10 rounded-[4px] border p-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                                    newMuscle === m
                                        ? 'bg-primary-500 border-primary-500 text-zinc-950'
                                        : 'bg-surface-base border-border-subtle text-zinc-400 hover:text-white'
                                }`}
                            >
                                {TRANSLATIONS[lang].muscle[m]}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-400">
                        {ev.tonnage}
                    </label>
                    <select
                        value={newVolumeCountingMode}
                        onChange={e => setNewVolumeCountingMode(e.target.value as VolumeCountingMode)}
                        className="w-full rounded-[6px] bg-surface-base border border-border-subtle p-3 text-sm text-white focus:border-primary-500 outline-none font-medium transition-colors"
                    >
                        <option value="total">{ev.countTotal}</option>
                        <option value="per_side">{ev.countPerSide}</option>
                    </select>
                </div>

                <div className="flex gap-3 pt-4 border-t border-border-subtle">
                    <Button variant="secondary" onClick={() => setMode('list')} fullWidth className="rounded-[6px]">{t.cancel}</Button>
                    <Button onClick={handleCreate} disabled={!newName.trim()} fullWidth className="rounded-[6px]">{t.save}</Button>
                </div>
            </div>
        </div>
    );
};
