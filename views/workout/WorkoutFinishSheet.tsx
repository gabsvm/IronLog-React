// S6: finish sheet, moved verbatim from views/WorkoutViewImpl.tsx.
import React from 'react';
import { Icon } from '../../components/ui/Icon';
import { Sheet } from '../../components/ui/Sheet';
import { formatSeconds } from '../../utils';
import { isTemplateUpdateEligible } from '../../utils/workoutProgress';
import type { WorkoutViewState } from './useWorkoutViewState';

export const WorkoutFinishSheet: React.FC<{ state: WorkoutViewState }> = ({ state }) => {
    const { showFinishModal, setShowFinishModal, handleConfirmFinish, setShowDiscardConfirm, updateSession, updateTemplate, setUpdateTemplate, activeSession, activeMeso, t, w, completedWorkingSets, totalWorkingSets } = state;
    if (!activeSession) return null;
    return (
        <>
            {showFinishModal && (() => {
                const elapsedSecs = activeSession.startTime ? Math.max(0, Math.floor((Date.now() - activeSession.startTime) / 1000)) : 0;
                const canUpdateTemplate = isTemplateUpdateEligible(activeSession, activeMeso);

                return (
                    <Sheet
                        open={showFinishModal}
                        onOpenChange={(open) => !open && setShowFinishModal(false)}
                        title={t.finishSession}
                        accent="primary"
                    >
                        <div className="p-4 space-y-3.5">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 gap-2.5">
                                <div className="rounded-xl border border-border-subtle bg-surface-raised p-3">
                                    <div className="text-xs text-muted">{t.duration}</div>
                                    <div className="text-xl font-semibold text-white mt-0.5 tabular-nums">
                                        {formatSeconds(elapsedSecs)}
                                    </div>
                                </div>
                                <div className="rounded-xl border border-border-subtle bg-surface-raised p-3">
                                    <div className="text-xs text-muted">{t.sets}</div>
                                    <div className="text-xl font-semibold text-white mt-0.5 tabular-nums">
                                        {completedWorkingSets} / {totalWorkingSets}
                                    </div>
                                </div>
                            </div>

                            {/* Update Template Switch (Protected for KONG) */}
                            {canUpdateTemplate && (
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={updateTemplate}
                                    aria-label={t.updateRoutine}
                                    className="w-full card-reference p-3 flex items-center justify-between gap-3 cursor-pointer hover:border-zinc-500 transition-colors text-left"
                                    onClick={() => setUpdateTemplate(!updateTemplate)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            setUpdateTemplate(!updateTemplate);
                                        }
                                    }}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-semibold text-white">{t.updateRoutine}</div>
                                        <div className="text-xs text-muted mt-0.5">
                                            {t.saveRoutineDesc}
                                        </div>
                                    </div>
                                    <div className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${updateTemplate ? 'bg-primary-500' : 'bg-surface-elevated border border-border-strong'}`}>
                                        <span className={`absolute top-0.5 w-5 h-5 rounded-full shadow transition-all ${updateTemplate ? 'left-[22px] bg-zinc-950' : 'left-0.5 bg-zinc-400'}`} />
                                    </div>
                                </button>
                            )}

                            {/* Session Note */}
                            <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted mb-1 px-0.5">
                                    {t.sessionNote}
                                </label>
                                <textarea
                                    placeholder={t.sessionNotePlaceholder}
                                    value={activeSession.note || ''}
                                    onChange={e => updateSession(prev => prev ? { ...prev, note: e.target.value } : null)}
                                    rows={3}
                                    className="w-full rounded-xl border border-border-subtle bg-surface-raised px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none resize-none transition-all focus:border-zinc-600"
                                />
                            </div>

                            {/* Primary & Secondary Actions */}
                            <div className="space-y-2 pt-1">
                                <button
                                    type="button"
                                    onClick={handleConfirmFinish}
                                    className="w-full h-11 rounded-xl bg-primary-500 text-zinc-950 font-semibold text-sm hover:bg-primary-400 active:scale-98 transition-all shadow-sm"
                                >
                                    {t.saveAndFinish}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowFinishModal(false)}
                                    className="w-full h-11 rounded-xl bg-surface-elevated text-zinc-200 font-semibold text-sm hover:bg-zinc-800 active:scale-98 transition-all"
                                >
                                    {t.continueTraining}
                                </button>
                            </div>

                            {/* Destructive Discard Session */}
                            <div className="text-center pt-3 border-t border-border-subtle mt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowFinishModal(false);
                                        setShowDiscardConfirm(true);
                                    }}
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors uppercase tracking-wider active:scale-95"
                                >
                                    <Icon name="Trash2" size={13} />
                                    {t.discardSession}
                                </button>
                            </div>
                        </div>
                    </Sheet>
                );
            })()}
        </>
    );
};
