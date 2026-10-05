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
                <div className="p-6 pb-[calc(1.5rem+var(--safe-area-bottom))] space-y-6 overflow-y-auto">
                    <div>
                        <label className="text-xs font-bold uppercase text-zinc-400 tracking-wider mb-2 block">{t.exName}</label>
                        <input
                            type="text"
                            className="w-full bg-zinc-800 border border-zinc-700/50 rounded-xl p-3 font-medium text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            placeholder="e.g., Incline Machine Press"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold uppercase text-zinc-400 tracking-wider mb-2 block">{t.selectMuscle}</label>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.values(MUSCLE_GROUPS).map(m => (
                                <button
                                    key={m}
                                    onClick={() => setNewMuscle(m)}
                                    className={`p-3 rounded-xl text-xs font-bold border transition-all duration-fast active:scale-95 ${
                                        newMuscle === m
                                            ? 'bg-primary-500/10 border-primary-500/30 text-primary-400'
                                            : 'bg-white/5 border-white/5 text-zinc-400 hover:border-white/10'
                                    }`}
                                >
                                    {TRANSLATIONS[lang].muscle[m]}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold uppercase text-zinc-400 tracking-wider mb-2 block">
                            {ev.tonnage}
                        </label>
                        <select
                            value={newVolumeCountingMode}
                            onChange={e => setNewVolumeCountingMode(e.target.value as VolumeCountingMode)}
                            className="w-full bg-zinc-800 border border-zinc-700/50 rounded-xl p-3 font-medium text-white outline-none"
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
