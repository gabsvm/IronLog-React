import React, { Suspense } from 'react';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';
import { GuidelinesModal } from './home/GuidelinesModal';
import { HomeRecapStrip } from './home/HomeRecapStrip';
import { resolveWeightUnit } from '../utils/units';
import { ProgramBlockTransition } from '../components/programs/ProgramBlockTransition';
import { PlanActionsSheet } from '../components/home/PlanActionsSheet';
import { useHomeViewState, type HomeViewProps } from './home/useHomeViewState';
import { HomeEmptyState } from './home/HomeEmptyState';
import { HomeTopSection } from './home/HomeTopSection';
import { HomeHeroCard } from './home/HomeHeroCard';
import { HomeMesoSettingsModal } from './home/HomeMesoSettingsModal';

// S6: state lives in views/home/useHomeViewState; render blocks in views/home/.
export type { HomeViewProps } from './home/useHomeViewState';

const ProgramHub = React.lazy(() => import('../components/programs/ProgramHub').then((module) => ({ default: module.ProgramHub })));
const TutorialOverlay = React.lazy(() => import('../components/ui/TutorialOverlay').then(m => ({ default: m.TutorialOverlay })));
const PaywallModal = React.lazy(() => import('../components/pro/PaywallModal').then(m => ({ default: m.PaywallModal })));
const ConfirmModal = React.lazy(() => import('../components/ui/ConfirmModal').then(m => ({ default: m.ConfirmModal })));

export const HomeView: React.FC<HomeViewProps> = (props) => {
    const state = useHomeViewState(props);
    const { onEditProgram, onStartFreeSession, logs, lang, tutorialProgress, markTutorialSeen, config, activeMeso, t, h, showPaywall, setShowPaywall, featureAttempted, showCompleteModal, setShowCompleteModal, setShowMesoSettings, showPlanActions, setShowPlanActions, skipConfirmationId, setSkipConfirmationId, showGuidelines, setShowGuidelines, transitionBlock, showKongHub, setShowKongHub, closeTransition, currentGuidelineImages, safeProgram, safeLogs, confirmSkip, handleFinishMeso, handleFinishWeek, homeTutorialSteps } = state;

    if (!activeMeso) {
        return <HomeEmptyState state={state} />;
    }

    return (
        <div className="px-4 space-y-4 pb-28 pt-2">
            <HomeTopSection state={state} />

            {/* 4. Dominant Selected Day Hero Card */}
            <HomeHeroCard state={state} />

            {/* 4b. Week at a glance (Q16): done/planned, streak, last session. */}
            <HomeRecapStrip
                logs={safeLogs}
                meso={activeMeso}
                plannedDays={safeProgram.length}
                lang={lang}
                t={t}
                unit={resolveWeightUnit(config)}
            />

            {/* 5. Secondary Quick Start */}
            <div className="space-y-3 pt-2">
                {onStartFreeSession && (
                    <button
                        type="button"
                        onClick={onStartFreeSession}
                        className="w-full flex items-center gap-3 card-reference p-3.5 hover:border-zinc-500 active:scale-[0.99] transition-all"
                    >
                        <div className="flex gap-1 shrink-0">
                            <div className="w-7 h-7 rounded-lg bg-primary-500/10 text-primary-500 flex items-center justify-center"><Icon name="Dumbbell" size={14} /></div>
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center"><Icon name="Zap" size={14} /></div>
                            <div className="w-7 h-7 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center"><Icon name="User" size={14} /></div>
                        </div>
                        <span className="flex-1 text-left text-xs font-semibold text-zinc-300">
                            {h.freeRow}
                        </span>
                        <Icon name="ChevronRight" size={16} className="text-muted shrink-0" />
                    </button>
                )}
            </div>


            <Suspense fallback={null}>
            <TutorialOverlay
                steps={homeTutorialSteps}
                isActive={!tutorialProgress.home}
                onComplete={() => markTutorialSeen('home')}
            />
            </Suspense>

            {/* --- MODALS --- */}

            {showPaywall && (
                <Suspense fallback={null}>
                    <PaywallModal onClose={() => setShowPaywall(false)} feature={featureAttempted} />
                </Suspense>
            )}

            {/* Guidelines Modal */}
            <GuidelinesModal
                isOpen={showGuidelines}
                onClose={() => setShowGuidelines(false)}
                images={currentGuidelineImages}
            />

            {/* Skip Confirmation */}
            <Suspense fallback={null}>
                <ConfirmModal
                    isOpen={skipConfirmationId !== null}
                    title={t.skipDay}
                    description={t.skipDayConfirm}
                    onConfirm={confirmSkip}
                    onCancel={() => setSkipConfirmationId(null)}
                    confirmText={t.skip}
                    cancelText={t.cancel}
                    variant="danger"
                />
            </Suspense>

            {/* Plan Actions Sheet */}
            <PlanActionsSheet
                open={showPlanActions}
                onClose={() => setShowPlanActions(false)}
                lang={lang}
                planName={activeMeso?.name}
                week={activeMeso?.week}
                totalWeeks={activeMeso?.targetWeeks || activeMeso?.duration}
                onConfigure={() => {
                    setShowPlanActions(false);
                    setShowMesoSettings(true);
                }}
                onEditProgram={() => {
                    setShowPlanActions(false);
                    onEditProgram();
                }}
            />

            {/* MESO SETTINGS MODAL */}
            <HomeMesoSettingsModal state={state} />

            {showCompleteModal && (
                <div className="fixed inset-0 z-modal bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
                    <div className="glass-panel w-full max-w-sm rounded-2xl p-6 text-center">
                        {showCompleteModal === 'meso' ? (
                            <>
                                <h3 className="text-white font-bold text-xl mb-2">{t.finishCycle}</h3>
                                <p className="text-zinc-400 text-sm mb-6">{t.finishMesoConfirm}</p>
                                <div className="flex gap-3">
                                    <Button variant="secondary" onClick={() => setShowCompleteModal(null)} fullWidth>{t.cancel}</Button>
                                    <Button onClick={() => handleFinishMeso()} fullWidth>{t.completed}</Button>
                                </div>
                            </>
                        ) : ( // 'week'
                            <>
                                <h3 className="text-white font-bold text-xl mb-2">{t.completeWeek}</h3>
                                <p className="text-zinc-400 text-sm mb-6">{t.completeWeekConfirm}</p>
                                <div className="flex gap-3">
                                    <Button variant="secondary" onClick={() => setShowCompleteModal(null)} fullWidth>{t.cancel}</Button>
                                    <Button onClick={handleFinishWeek} fullWidth>{h.nextWeek}</Button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
            {transitionBlock && <ProgramBlockTransition blockNumber={transitionBlock} onClose={closeTransition} lang={lang} />}
            {showKongHub && activeMeso && <Suspense fallback={null}><ProgramHub meso={activeMeso} logs={logs} lang={lang} onClose={() => setShowKongHub(false)} /></Suspense>}
        </div>
    );
};


