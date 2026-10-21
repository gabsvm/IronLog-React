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
                    className="modal-backdrop fixed inset-0 z-confirm flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-fast pointer-events-auto"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="unresolved-title"
                >
                    <div className="gl-panel w-full max-w-md space-y-4 p-6 shadow-2xl">
                        <div className="flex items-center gap-3 text-amber-500">
                            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                                <Icon name="AlertTriangle" size={22} />
                            </div>
                            <div>
                                <h3 id="unresolved-title" className="text-base font-bold text-[rgb(var(--text-primary))]">
                                    {TRANSLATIONS[lang].copy.programEdit.unassignedExercises}
                                </h3>
                                <p className="text-xs text-muted">
                                    {formatMessage(TRANSLATIONS[lang].copy.programEdit.slotSWithoutSelected, { count: unresolvedSlots.length })}
                                </p>
                            </div>
                        </div>

                        <p className="text-xs leading-relaxed text-[rgb(var(--text-secondary))]">
                            {TRANSLATIONS[lang].copy.programEdit.eachSlotMustHave}
                        </p>

                        <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-elevated)/0.5)] p-3 text-xs">
                            {unresolvedSlots.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between py-0.5 text-[rgb(var(--text-secondary))]">
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
                        <label className="mb-2 block px-1 text-sm font-semibold text-muted">{t.mesoName}</label>
                        <input
                            type="text"
                            className="gl-input font-bold"
                            value={mesoConfig.name}
                            onChange={(e) => setMesoConfig({ ...mesoConfig, name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="mb-2 block px-1 text-sm font-semibold text-muted">{t.mesoType}</label>
                        <select
                            className="gl-input font-bold"
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
                        <label className="mb-2 block px-1 text-sm font-semibold text-muted">{t.targetWeeks}</label>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setMesoConfig(prev => ({ ...prev, weeks: Math.max(1, prev.weeks - 1) }))}
                                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-elevated))] text-[rgb(var(--text-secondary))] transition-all hover:text-[rgb(var(--text-primary))] active:scale-95"
                                aria-label="Disminuir semanas"
                            >
                                <Icon name="Minus" size={16} />
                            </button>
                            <span className="gl-num w-12 text-center text-2xl font-bold text-[rgb(var(--text-primary))]">{mesoConfig.weeks}</span>
                            <button
                                onClick={() => setMesoConfig(prev => ({ ...prev, weeks: Math.max(1, prev.weeks + 1) }))}
                                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-elevated))] text-[rgb(var(--text-secondary))] transition-all hover:text-[rgb(var(--text-primary))] active:scale-95"
                                aria-label="Aumentar semanas"
                            >
                                <Icon name="Plus" size={16} />
                            </button>
                            <span className="text-sm font-bold text-muted">{t.weeks}</span>
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
