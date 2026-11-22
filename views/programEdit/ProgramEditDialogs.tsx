// T2: exercise picker, unresolved-slots dialog, meso sheet and confirm, moved verbatim from views/ProgramEditView.tsx.
import { formatMessage, pickLang } from '../../utils/i18n';
import React, { Suspense } from 'react';
import { TRANSLATIONS } from '../../constants';
import { Icon } from '../../components/ui/Icon';
import { Button } from '../../components/ui/Button';
import { MesoType } from '../../types';
import { Sheet } from '../../components/ui/Sheet';
import type { ProgramEditState } from './useProgramEditState';

const ExerciseSelector = React.lazy(() => import('../../components/ui/ExerciseSelector').then(m => ({ default: m.ExerciseSelector })));
const ConfirmModal = React.lazy(() => import('../../components/ui/ConfirmModal').then(m => ({ default: m.ConfirmModal })));

export const ProgramEditDialogs: React.FC<{ state: ProgramEditState }> = ({ state }) => {
    const { lang, t, pickingForSlot, setPickingForSlot, program, showStartModal, setShowStartModal, unresolvedSlots, setUnresolvedSlots, dayToDelete, setDayToDelete, mesoConfig, setMesoConfig, hasKnownPhase, handleDeleteDay, handleSelectExercise, handleStartMeso, weightUnit, handleWeightUnitChange } = state;
    const pickingDay = pickingForSlot ? program.find(d => d.id === pickingForSlot.dayId) : undefined;
    const pickingMuscle = pickingDay && pickingForSlot ? pickingDay.slots?.[pickingForSlot.slotIdx]?.muscle : undefined;
    return (
        <>
            {pickingForSlot && (
                <Suspense fallback={null}>
                    <ExerciseSelector
                        presetMuscle={pickingMuscle}
                        onClose={() => setPickingForSlot(null)}
                        onSelect={handleSelectExercise}
                    />
                </Suspense>
            )}

            {/* Unresolved Slots Validation Dialog */}
            {unresolvedSlots.length > 0 && (
                <div
                    className="fixed inset-0 z-confirm bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-fast"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="unresolved-title"
                >
                    <div className="premium-theme-panel w-full max-w-md space-y-4 p-6 shadow-2xl">
                        <div className="flex items-center gap-3 text-amber-500">
                            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                                <Icon name="AlertTriangle" size={22} />
                            </div>
                            <div>
                                <h3 id="unresolved-title" className="text-base font-bold text-zinc-900 dark:text-white">
                                    {TRANSLATIONS[lang].copy.programEdit.unassignedExercises}
                                </h3>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    {formatMessage(TRANSLATIONS[lang].copy.programEdit.slotSWithoutSelected, { count: unresolvedSlots.length })}
                                </p>
                            </div>
                        </div>

                        <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                            {TRANSLATIONS[lang].copy.programEdit.eachSlotMustHave}
                        </p>

                        <div className="max-h-40 overflow-y-auto space-y-1.5 p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-white/5 text-xs">
                            {unresolvedSlots.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between text-zinc-700 dark:text-zinc-300 py-0.5">
                                    <span>
                                        <strong className="font-semibold">{item.dayName}</strong> · Slot #{item.slotIdx}
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-500/20 text-amber-400">
                                        {item.muscle}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="pt-2">
                            <Button
                                fullWidth
                                variant="primary"
                                onClick={() => setUnresolvedSlots([])}
                            >
                                {TRANSLATIONS[lang].copy.programEdit.assignExercises}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <Sheet
                open={showStartModal}
                onOpenChange={setShowStartModal}
                title={pickLang(lang, { es: 'Crear tu mesociclo', en: 'Create your mesocycle' })}
                accent="primary"
                footer={
                    <Button fullWidth onClick={handleStartMeso} size="lg">
                        {t.startNow}
                    </Button>
                }
            >
                <div className="p-5 space-y-5" data-testid="create-meso-final-sheet">
                    <p className="text-xs text-zinc-500 -mt-2">{t.saveAsMeso}</p>
                    <div>
                        <label className="mb-2 block px-1 text-sm font-semibold text-muted">{t.mesoName}</label>
                        <input
                            type="text"
                            className="premium-form-input w-full p-3 font-bold"
                            value={mesoConfig.name}
                            onChange={(e) => setMesoConfig({ ...mesoConfig, name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="mb-2 block px-1 text-sm font-semibold text-muted">{t.targetWeeks}</label>
                        <div className="grid grid-cols-5 gap-2 mb-3">
                            {[4, 5, 6, 7, 8].map((wCount) => (
                                <button
                                    key={wCount}
                                    type="button"
                                    onClick={() => setMesoConfig(prev => ({ ...prev, weeks: wCount }))}
                                    className={`h-11 rounded-[8px] font-black text-sm border transition-all ${
                                        mesoConfig.weeks === wCount
                                            ? 'bg-primary-500 border-primary-500 text-zinc-950 shadow-sm'
                                            : 'bg-surface-raised border-border-subtle text-zinc-300 hover:border-zinc-500'
                                    }`}
                                >
                                    {wCount}w
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-zinc-400">
                            <button
                                type="button"
                                onClick={() => setMesoConfig(prev => ({ ...prev, weeks: Math.max(1, prev.weeks - 1) }))}
                                className="w-8 h-8 rounded-lg bg-surface-raised border border-border-subtle flex items-center justify-center text-zinc-300 hover:text-white active:scale-95 transition-all"
                                aria-label={pickLang(lang, { es: 'Disminuir semanas', en: 'Decrease weeks' })}
                            >
                                <Icon name="Minus" size={14} />
                            </button>
                            <span className="font-mono text-base font-bold text-white tabular-nums">{mesoConfig.weeks} {t.weeks}</span>
                            <button
                                type="button"
                                onClick={() => setMesoConfig(prev => ({ ...prev, weeks: Math.min(16, prev.weeks + 1) }))}
                                className="w-8 h-8 rounded-lg bg-surface-raised border border-border-subtle flex items-center justify-center text-zinc-300 hover:text-white active:scale-95 transition-all"
                                aria-label={pickLang(lang, { es: 'Aumentar semanas', en: 'Increase weeks' })}
                            >
                                <Icon name="Plus" size={14} />
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block px-1 text-sm font-semibold text-muted">
                            {pickLang(lang, { es: 'Unidad de peso', en: 'Weight unit' })}
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {(['lb', 'kg'] as const).map((u) => (
                                <button
                                    key={u}
                                    type="button"
                                    onClick={() => handleWeightUnitChange(u)}
                                    className={`h-11 rounded-[8px] font-black text-xs uppercase tracking-wider border transition-all ${
                                        weightUnit === u
                                            ? 'bg-primary-500 border-primary-500 text-zinc-950 shadow-sm'
                                            : 'bg-surface-raised border-border-subtle text-zinc-300 hover:border-zinc-500'
                                    }`}
                                >
                                    {u.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block px-1 text-sm font-semibold text-muted">{t.mesoType}</label>
                        <select
                            className="premium-form-input w-full p-3 font-bold"
                            value={mesoConfig.type}
                            onChange={(e) => setMesoConfig({ ...mesoConfig, type: e.target.value as MesoType })}
                        >
                            {!hasKnownPhase && (
                                <option value={mesoConfig.type}>{TRANSLATIONS[lang].copy.programEdit.custom}</option>
                            )}
                            {Object.entries(t.phases).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </Sheet>

            <Suspense fallback={null}>
                <ConfirmModal
                    isOpen={!!dayToDelete}
                    title={t.delete}
                    description={t.deleteConfirm}
                    onConfirm={handleDeleteDay}
                    onCancel={() => setDayToDelete(null)}
                    variant="danger"
                />
            </Suspense>
        </>
    );
};
