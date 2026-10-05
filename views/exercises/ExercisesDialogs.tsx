// T2: detail, delete/archive, merge and replace dialogs, moved verbatim from views/ExercisesView.tsx.
import React, { Suspense } from 'react';
import { Icon } from '../../components/ui/Icon';
import { Button } from '../../components/ui/Button';
import { getTranslated } from '../../utils';
import { ExerciseDetailModal } from '../../components/ui/ExerciseDetailModal';
import type { ExercisesViewState } from './useExercisesViewState';

const ConfirmModal = React.lazy(() => import('../../components/ui/ConfirmModal').then(m => ({ default: m.ConfirmModal })));
const ExerciseSelector = React.lazy(() => import('../../components/ui/ExerciseSelector').then(m => ({ default: m.ExerciseSelector })));

export const ExercisesDialogs: React.FC<{ state: ExercisesViewState }> = ({ state }) => {
    const { exercises, lang, t, ev, detailEx, setDetailEx, pendingDeleteReport, setPendingDeleteReport, unreferencedDeleteId, setUnreferencedDeleteId, replacingExerciseId, setReplacingExerciseId, pendingReplacementCandidate, setPendingReplacementCandidate, mergingExerciseId, mergeCandidate, setMergeCandidate, handleConfirmPermanentDelete, handleArchiveFromReport, handleStartReplaceFlow, handleExecuteReplacement, handleCancelMerge, handleConfirmMerge } = state;
    return (
        <>
            {/* Exercise Detail Modal */}
            {detailEx && (
                <ExerciseDetailModal
                    exercise={detailEx}
                    onClose={() => setDetailEx(null)}
                />
            )}

            {/* Unreferenced Exercise Permanent Delete Confirmation */}
            <Suspense fallback={null}>
                <ConfirmModal
                    isOpen={!!unreferencedDeleteId}
                    title={ev.delTitle}
                    description={ev.delDesc}
                    onConfirm={handleConfirmPermanentDelete}
                    onCancel={() => setUnreferencedDeleteId(null)}
                    variant="danger"
                />
            </Suspense>

            {/* Referenced Exercise Action Dialog (Archive vs In-Use Warning) */}
            {pendingDeleteReport && (
                <div
                    className="fixed inset-0 z-confirm bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-fast"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="ref-modal-title"
                >
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center gap-3 text-amber-500">
                            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                                <Icon name="AlertTriangle" size={22} />
                            </div>
                            <div>
                                <h3 id="ref-modal-title" className="text-base font-bold text-zinc-900 dark:text-white">
                                    {ev.inUseTitle}
                                </h3>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    {`${ev.refCountA} ${pendingDeleteReport.totalReferences} ${ev.refCountB}`}
                                </p>
                            </div>
                        </div>

                        <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                            {ev.inUseDesc}
                        </p>

                        {/* List of references */}
                        <div className="max-h-40 overflow-y-auto space-y-1.5 p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-white/5 text-xs">
                            {pendingDeleteReport.locations.map((loc, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-zinc-700 dark:text-zinc-300">
                                    <Icon name="Check" size={14} className="text-amber-500 shrink-0 mt-0.5" />
                                    <span>
                                        <strong className="font-semibold">{loc.containerName}</strong>: {loc.detail}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-col gap-2 pt-2">
                            <Button
                                onClick={() => handleArchiveFromReport(pendingDeleteReport.exerciseId)}
                                fullWidth
                                variant="primary"
                            >
                                <Icon name="Archive" size={16} className="mr-2" />
                                {ev.archiveBtn}
                            </Button>
                            <Button
                                onClick={() => handleStartReplaceFlow(pendingDeleteReport.exerciseId)}
                                fullWidth
                                variant="secondary"
                                className="border border-primary-500/40 text-primary-600 dark:text-primary-400 font-bold"
                            >
                                <Icon name="RefreshCw" size={16} className="mr-2" />
                                {ev.replaceRefs}
                            </Button>
                            <Button
                                onClick={() => setPendingDeleteReport(null)}
                                fullWidth
                                variant="secondary"
                            >
                                {t.cancel}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Exercise Selector for Merge Target (merged defs are hidden there) */}
            {mergingExerciseId && !mergeCandidate && (
                <Suspense fallback={null}>
                    <ExerciseSelector
                        excludeIds={[mergingExerciseId]}
                        onSelect={(newExId, newExDef) => {
                            const candidate = newExDef || exercises.find(e => e.id === newExId);
                            if (candidate) {
                                setMergeCandidate(candidate);
                            }
                        }}
                        onClose={handleCancelMerge}
                    />
                </Suspense>
            )}

            {/* Confirm Merge Modal */}
            {mergingExerciseId && mergeCandidate && (
                <Suspense fallback={null}>
                    <ConfirmModal
                        isOpen={true}
                        title={t.merge.confirmTitle}
                        description={t.merge.confirmBody
                            .replace('{source}', String(getTranslated(exercises.find(e => e.id === mergingExerciseId)?.name || 'Custom', lang)))
                            .replace('{target}', String(getTranslated(mergeCandidate.name, lang)))}
                        onConfirm={handleConfirmMerge}
                        onCancel={handleCancelMerge}
                        confirmText={t.merge.confirmAction}
                        cancelText={t.cancel}
                        variant="primary"
                    />
                </Suspense>
            )}

            {/* Exercise Selector for Reference Replacement */}
            {replacingExerciseId && (
                <Suspense fallback={null}>
                    <ExerciseSelector
                        excludeIds={[replacingExerciseId]}
                        onSelect={(newExId, newExDef) => {
                            const candidate = newExDef || exercises.find(e => e.id === newExId);
                            if (candidate) {
                                setPendingReplacementCandidate(candidate);
                            }
                        }}
                        onClose={() => setReplacingExerciseId(null)}
                    />
                </Suspense>
            )}

            {/* Confirm Replacement Modal */}
            {replacingExerciseId && pendingReplacementCandidate && (
                <Suspense fallback={null}>
                    <ConfirmModal
                        isOpen={true}
                        title={ev.confirmReplaceTitle}
                        description={ev.replaceDesc
                            .replace('{old}', String(getTranslated(exercises.find(e => e.id === replacingExerciseId)?.name || ev.unnamedFallback, lang)))
                            .replace('{new}', String(getTranslated(pendingReplacementCandidate.name, lang)))}
                        onConfirm={() => handleExecuteReplacement(replacingExerciseId, pendingReplacementCandidate.id)}
                        onCancel={() => setPendingReplacementCandidate(null)}
                        confirmText={ev.replaceDelete}
                        cancelText={t.cancel}
                        variant="primary"
                    />
                </Suspense>
            )}
        </>
    );
};
