// T2: exercise picker, unresolved-slots dialog, meso sheet and confirm, moved verbatim from views/ProgramEditView.tsx.
import { formatMessage } from '../../utils/i18n';
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
    const { lang, t, pickingForSlot, setPickingForSlot, showStartModal, setShowStartModal, unresolvedSlots, setUnresolvedSlots, dayToDelete, setDayToDelete, mesoConfig, setMesoConfig, hasKnownPhase, handleDeleteDay, handleSelectExercise, handleStartMeso } = state;
    return (
        <>
            {pickingForSlot && (
                <Suspense fallback={null}>
                    <ExerciseSelector
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
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
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
                title={t.setupCycle}
                accent="primary"
                footer={
                    <Button fullWidth onClick={handleStartMeso} size="lg">
                        {t.startNow}
                    </Button>
                }
            >
                <div className="p-5 space-y-6">
                    <p className="text-xs text-zinc-500 -mt-2">{t.saveAsMeso}</p>
                    <div>
                        <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest block mb-2 px-1">{t.mesoName}</label>
                        <input
                            type="text"
                            className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl p-3 font-bold outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all glow-input-neon"
                            value={mesoConfig.name}
                            onChange={(e) => setMesoConfig({ ...mesoConfig, name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest block mb-2 px-1">{t.mesoType}</label>
                        <select
                            className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl p-3 font-bold outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
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

                    <div>
                        <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest block mb-2 px-1">{t.targetWeeks}</label>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setMesoConfig(prev => ({ ...prev, weeks: Math.max(1, prev.weeks - 1) }))}
                                className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/50 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white active:scale-95 transition-all"
                                aria-label="Disminuir semanas"
                            >
                                <Icon name="Minus" size={16} />
                            </button>
                            <span className="font-mono text-2xl font-bold w-12 text-center text-zinc-900 dark:text-white">{mesoConfig.weeks}</span>
                            <button
                                onClick={() => setMesoConfig(prev => ({ ...prev, weeks: prev.weeks + 1 }))}
                                className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/50 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white active:scale-95 transition-all"
                                aria-label="Aumentar semanas"
                            >
                                <Icon name="Plus" size={16} />
                            </button>
                            <span className="text-sm font-bold text-zinc-500">{t.weeks}</span>
                        </div>
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
