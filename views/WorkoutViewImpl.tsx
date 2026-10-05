import React, { Suspense } from 'react';
import { getTranslated } from '../utils';
import { resolveWeightUnit } from '../utils/units';
import { useWorkoutViewState, type WorkoutViewProps } from './workout/useWorkoutViewState';
import { WorkoutMain } from './workout/WorkoutMain';
import { WorkoutSetTypeSheet } from './workout/WorkoutSetTypeSheet';
import { WorkoutFinishSheet } from './workout/WorkoutFinishSheet';

// S6: state lives in views/workout/useWorkoutViewState; render blocks in views/workout/.
export type { WorkoutViewProps } from './workout/useWorkoutViewState';

const ExerciseSelector = React.lazy(() => import('../components/ui/ExerciseSelector').then(m => ({ default: m.ExerciseSelector })));
const ExerciseDetailModal = React.lazy(() => import('../components/ui/ExerciseDetailModal').then(m => ({ default: m.ExerciseDetailModal })));
const FeedbackModal = React.lazy(() => import('../components/ui/FeedbackModal').then(m => ({ default: m.FeedbackModal })));
const WarmupModal = React.lazy(() => import('../components/ui/WarmupModal').then(m => ({ default: m.WarmupModal })));
const PRCelebrationOverlay = React.lazy(() => import('../components/ui/PRCelebrationOverlay').then(m => ({ default: m.PRCelebrationOverlay })));
const ConfirmModal = React.lazy(() => import('../components/ui/ConfirmModal').then(m => ({ default: m.ConfirmModal })));
const TutorialOverlay = React.lazy(() => import('../components/ui/TutorialOverlay').then(m => ({ default: m.TutorialOverlay })));

// Container Component
export const WorkoutView: React.FC<WorkoutViewProps> = (props) => {
    const state = useWorkoutViewState(props);
    const { sessionExercises, setOpenMenuId, showFeedbackModal, setShowFeedbackModal, replacingExId, setReplacingExId, replaceFilter, setReplaceFilter, addingExercise, setAddingExercise, warmupExId, setWarmupExId, showPRSuccess, dismissPRSuccess, detailExercise, setDetailExercise, handleDiscardSession, showDiscardConfirm, setShowDiscardConfirm, handleSaveFeedback, reorderSessionExercises, lang, config, tutorialProgress, markTutorialSeen, activeSession, setActiveMeso, t, w, kongSubPrompt, setKongSubPrompt, kongReorderPrompt, setKongReorderPrompt, handleAddExercise, handleReplace, workoutTutorialSteps } = state;

    if (!activeSession) return null;

    return (
        <div className="fixed inset-0 z-40 flex flex-col bg-surface-app font-sans" onClick={() => setOpenMenuId(null)}>
            <WorkoutMain state={state} />

            {/* TUTORIAL OVERLAY HOOK */}
            <Suspense fallback={null}>
                <TutorialOverlay
                    steps={workoutTutorialSteps}
                    isActive={!tutorialProgress.workout}
                    onComplete={() => markTutorialSeen('workout')}
                />
            </Suspense>

            {/* Modals remain the same... */}
            {detailExercise && (
                <Suspense fallback={null}>
                    <ExerciseDetailModal
                        exercise={detailExercise}
                        onClose={() => setDetailExercise(null)}
                    />
                </Suspense>
            )}

            <WorkoutSetTypeSheet state={state} />

            <WorkoutFinishSheet state={state} />

            {/* NEW: Discard Confirmation Modal */}
            <Suspense fallback={null}>
                <ConfirmModal
                    isOpen={showDiscardConfirm}
                    title={t.discardSession || "Discard Session"}
                    description={t.discardConfirm || "Discard current session data? This cannot be undone."}
                    confirmText={t.delete}
                    cancelText={t.cancel}
                    onConfirm={handleDiscardSession}
                    onCancel={() => setShowDiscardConfirm(false)}
                    variant="danger"
                />
            </Suspense>

            {/* KONG Substitution Persistence Modal */}
            {kongSubPrompt && (
                <Suspense fallback={null}>
                    <ConfirmModal
                        isOpen={true}
                        title={t.kongSubTitle}
                        description={w.kongSubDesc}
                        confirmText={t.allKong}
                        cancelText={t.todayOnly}
                        onConfirm={() => {
                            setActiveMeso(prev => prev?.programSystem ? {
                                ...prev,
                                programSystem: {
                                    ...prev.programSystem,
                                    substitutions: { ...prev.programSystem.substitutions, [kongSubPrompt.slotId]: kongSubPrompt.exId },
                                },
                            } : prev);
                            setKongSubPrompt(null);
                        }}
                        onCancel={() => setKongSubPrompt(null)}
                    />
                </Suspense>
            )}

            {/* KONG Reorder Warning Modal */}
            {kongReorderPrompt && (
                <Suspense fallback={null}>
                    <ConfirmModal
                        isOpen={true}
                        title={t.reorderKongTitle}
                        description={w.kongReorderDesc}
                        confirmText={t.reorderToday}
                        cancelText={t.cancel}
                        onConfirm={() => {
                            reorderSessionExercises(kongReorderPrompt.oldIndex, kongReorderPrompt.newIndex);
                            setKongReorderPrompt(null);
                        }}
                        onCancel={() => setKongReorderPrompt(null)}
                    />
                </Suspense>
            )}

            {showPRSuccess && (
                <Suspense fallback={null}>
                    <PRCelebrationOverlay onDismiss={dismissPRSuccess} />
                </Suspense>
            )}

            {showFeedbackModal && activeSession && (
                <Suspense fallback={null}>
                    <FeedbackModal muscles={sessionExercises.map(e => e?.muscle || 'CHEST')} onCancel={() => setShowFeedbackModal(false)} onConfirm={handleSaveFeedback} />
                </Suspense>
            )}
            {replacingExId && (
                <Suspense fallback={null}>
                    <ExerciseSelector onSelect={handleReplace} onClose={() => { setReplacingExId(null); setReplaceFilter(null); }} presetMuscle={replaceFilter?.muscle} sourceFilter={replaceFilter?.source} />
                </Suspense>
            )}
            {addingExercise && (
                <Suspense fallback={null}>
                    <ExerciseSelector onSelect={handleAddExercise} onClose={() => setAddingExercise(false)} />
                </Suspense>
            )}
            {warmupExId && activeSession && (
                <Suspense fallback={null}>
                    <WarmupModal targetWeight={Number(sessionExercises.find(e => e.instanceId === warmupExId)?.sets?.[0]?.weight || 0)} exerciseName={getTranslated(sessionExercises.find(e => e.instanceId === warmupExId)?.name, lang)} onClose={() => setWarmupExId(null)} unit={resolveWeightUnit(config)} />
                </Suspense>
            )}
        </div>
    );
};

