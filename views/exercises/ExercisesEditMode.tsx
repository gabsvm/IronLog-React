// T2: create/edit exercise form, moved verbatim from views/ExercisesView.tsx.
import React from 'react';
import { TRANSLATIONS, MUSCLE_GROUPS } from '../../constants';
import { Button } from '../../components/ui/Button';
import { VolumeCountingMode } from '../../types';
import { ALL_EQUIPMENT_TYPES, getEquipmentLabel } from '../../utils/equipment';
import { pickLang } from '../../utils/i18n';
import type { ExercisesViewState } from './useExercisesViewState';

export const ExercisesEditMode: React.FC<{ state: ExercisesViewState }> = ({ state }) => {
    const {
        lang, t, ev, setMode,
        newName, setNewName,
        newMuscle, setNewMuscle,
        newEquipment, setNewEquipment,
        newIsBodyweight, setNewIsBodyweight,
        newVolumeCountingMode, setNewVolumeCountingMode,
        handleCreate,
    } = state;
    return (
        <div className="mx-auto w-full max-w-2xl p-4 pb-[calc(1.5rem+var(--safe-area-bottom))] sm:p-6">
            <div className="rounded-[8px] border border-border-subtle bg-surface-raised p-4 sm:p-6 space-y-5">
                <div>
                    <label htmlFor="create-exercise-name" className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-400">{t.exName}</label>
                    <input
                        id="create-exercise-name"
                        data-testid="create-exercise-name"
                        type="text"
                        className="w-full min-h-11 rounded-[6px] bg-surface-base border border-border-subtle p-3 text-sm text-white placeholder-zinc-500 focus:border-primary-500 outline-none font-medium transition-colors"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        placeholder={pickLang(lang, { es: 'Ej: Curl de Bíceps en Polea', en: 'e.g., Incline Machine Press' })}
                        autoFocus
                    />
                </div>

                <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-400">{t.selectMuscle}</label>
                    <div className="grid grid-cols-2 gap-2">
                        {Object.values(MUSCLE_GROUPS).map(m => (
                            <button
                                key={m}
                                type="button"
                                data-testid={`create-muscle-${m}`}
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
                    <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                            {pickLang(lang, { es: 'Equipamiento / Tipo', en: 'Equipment / Type' })}
                        </span>
                        <span className="text-xs font-bold text-zinc-300">
                            {getEquipmentLabel(newEquipment, lang)}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2" data-testid="create-equipment-grid">
                        {ALL_EQUIPMENT_TYPES.map((eq) => (
                            <button
                                key={eq.id}
                                type="button"
                                data-testid={`create-equipment-${eq.id}`}
                                aria-pressed={newEquipment === eq.id}
                                onClick={() => {
                                    setNewEquipment(eq.id);
                                    setNewIsBodyweight(eq.id === 'bodyweight' || eq.id === 'bodyweight_loadable');
                                }}
                                className={`min-h-10 rounded-[4px] border px-3 py-2 text-left text-xs font-bold transition-colors ${
                                    newEquipment === eq.id
                                        ? 'bg-primary-500/15 border-primary-500 text-primary-300'
                                        : 'bg-surface-base border-border-subtle text-zinc-400 hover:text-white'
                                }`}
                            >
                                {pickLang(lang, eq.label)}
                            </button>
                        ))}
                    </div>
                </div>

                <label
                    htmlFor="create-exercise-bw-checkbox"
                    className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-[6px] border border-border-subtle bg-surface-base px-3.5 py-2.5"
                >
                    <div>
                        <span className="block text-sm font-bold text-white">
                            {pickLang(lang, { es: 'Ejercicio de peso corporal (BW)', en: 'Bodyweight exercise (BW)' })}
                        </span>
                        <span className="block text-xs text-zinc-400">
                            {pickLang(lang, { es: 'Usa tu peso corporal o lastre añadido', en: 'Uses bodyweight or added external load' })}
                        </span>
                    </div>
                    <input
                        id="create-exercise-bw-checkbox"
                        data-testid="create-exercise-bw"
                        type="checkbox"
                        checked={newIsBodyweight}
                        onChange={(e) => {
                            const checked = e.target.checked;
                            setNewIsBodyweight(checked);
                            if (checked && newEquipment !== 'bodyweight' && newEquipment !== 'bodyweight_loadable') {
                                setNewEquipment('bodyweight');
                            } else if (!checked && (newEquipment === 'bodyweight' || newEquipment === 'bodyweight_loadable')) {
                                setNewEquipment('machine');
                            }
                        }}
                        className="h-5 w-5 accent-primary-500"
                    />
                </label>

                {newMuscle !== 'CARDIO' && (
                    <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-400">
                            {ev.tonnage}
                        </label>
                        <select
                            value={newVolumeCountingMode}
                            onChange={e => setNewVolumeCountingMode(e.target.value as VolumeCountingMode)}
                            className="w-full min-h-11 rounded-[6px] bg-surface-base border border-border-subtle p-3 text-sm text-white focus:border-primary-500 outline-none font-medium transition-colors"
                        >
                            <option value="total">{ev.countTotal}</option>
                            <option value="per_side">{ev.countPerSide}</option>
                        </select>
                    </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-border-subtle">
                    <Button variant="secondary" onClick={() => setMode('list')} fullWidth className="rounded-[6px]">{t.cancel}</Button>
                    <Button onClick={handleCreate} disabled={!newName.trim()} data-testid="create-exercise-save" fullWidth className="rounded-[6px]">{t.save}</Button>
                </div>
            </div>
        </div>
    );
};
