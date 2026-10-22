import React, { Suspense } from 'react';
import { LoadingSpinner } from '../components/app/AppLoading';
import { resolveWeightUnit } from '../utils/units';
import { useHomeViewState, type HomeViewProps } from './home/useHomeViewState';
import { HomeEmptyState } from './home/HomeEmptyState';
import { HomeTopSection } from './home/HomeTopSection';
import { HomeHeroCard } from './home/HomeHeroCard';
import { HomeQuickActions, HomeResumeSession } from './home/HomeQuickActions';
import { TemplateChangeConfirmation } from './home/TemplateChangeConfirmation';

// S6: state lives in views/home/useHomeViewState; render blocks in views/home/.
export type { HomeViewProps } from './home/useHomeViewState';

const HomeRecapStrip = React.lazy(() => import('./home/HomeRecapStrip').then(m => ({ default: m.HomeRecapStrip })));
const GuidelinesModal = React.lazy(() => import('./home/GuidelinesModal').then(m => ({ default: m.GuidelinesModal })));
const ProgramBlockTransition = React.lazy(() => import('../components/programs/ProgramBlockTransition').then(m => ({ default: m.ProgramBlockTransition })));
const PlanActionsSheet = React.lazy(() => import('../components/home/PlanActionsSheet').then(m => ({ default: m.PlanActionsSheet })));
const HomeMesoSettingsModal = React.lazy(() => import('./home/HomeMesoSettingsModal').then(m => ({ default: m.HomeMesoSettingsModal })));
const ProgramHub = React.lazy(() => import('../components/programs/ProgramHub').then((module) => ({ default: module.ProgramHub })));
const TutorialOverlay = React.lazy(() => import('../components/ui/TutorialOverlay').then(m => ({ default: m.TutorialOverlay })));
const PaywallModal = React.lazy(() => import('../components/pro/PaywallModal').then(m => ({ default: m.PaywallModal })));
const ConfirmModal = React.lazy(() => import('../components/ui/ConfirmModal').then(m => ({ default: m.ConfirmModal })));
const TemplateSelector = React.lazy(() => import('./home/TemplateSelector').then(m => ({ default: m.TemplateSelector })));

export const HomeView: React.FC<HomeViewProps> = (props) => {
    const state = useHomeViewState(props);
    const { onEditProgram, logs, lang, tutorialProgress, markTutorialSeen, config, activeMeso, t, h, showPaywall, setShowPaywall, featureAttempted, showCompleteModal, setShowCompleteModal, showMesoSettings, setShowMesoSettings, showPlanActions, setShowPlanActions, showTemplateSelector, setShowTemplateSelector, handleOpenTemplateSelector, handleSelectTemplate, handleSelectProgram, handleCreateCustom, personalTemplates, globalTemplates, skipConfirmationId, setSkipConfirmationId, showGuidelines, setShowGuidelines, transitionBlock, showKongHub, setShowKongHub, closeTransition, currentGuidelineImages, safeProgram, safeLogs, confirmSkip, handleFinishMeso, handleFinishWeek, homeTutorialSteps } = state;

    if (!activeMeso) {
        return <><HomeEmptyState state={state} /><TemplateChangeConfirmation lang={lang} confirmation={state.templateChangeConfirmation} /></>;
    }

    return (
        <div className="space-y-4 px-4 pb-28 pt-2">
            <HomeTopSection state={state} />
            <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
                <div className="min-w-0 space-y-4">
                    <HomeResumeSession state={state} />
                    <HomeHeroCard state={state} />
                    <HomeQuickActions state={state} />
                </div>
                <Suspense fallback={<div className="gl-panel flex min-h-48 items-center justify-center"><LoadingSpinner /></div>}>
                <HomeRecapStrip
                    logs={safeLogs}
                    meso={activeMeso}
                    plannedDays={safeProgram.length}
                    lang={lang}
                    t={t}
                    unit={resolveWeightUnit(config)}
                />
                </Suspense>
            </div>
            <TemplateChangeConfirmation lang={lang} confirmation={state.templateChangeConfirmation} />


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
            {showGuidelines && (
                <Suspense fallback={null}>
                    <GuidelinesModal
                        isOpen={showGuidelines}
                        onClose={() => setShowGuidelines(false)}
                        images={currentGuidelineImages}
                    />
                </Suspense>
            )}

            {/* Skip Confirmation */}
            <Suspense fallback={null}>
                <ConfirmModal
                    isOpen={skipConfirmationId !== null}
                    title={t.skipDay}
                    description={t.skipDayConfirm}
                    onConfirm={confirmSkip}
                    onCancel={() => setSkipConfirmationId(null)}
                    confirmText={t.skipDay}
                    cancelText={t.cancel}
                    variant="danger"
                />
            </Suspense>

            {/* Plan Actions Sheet */}
            {showPlanActions && (
                <Suspense fallback={null}>
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
                        onChangeTemplate={() => {
                            setShowPlanActions(false);
                            handleOpenTemplateSelector();
                        }}
                    />
                </Suspense>
            )}

            {showTemplateSelector && (
                <Suspense fallback={null}>
                    <TemplateSelector
                        onClose={() => setShowTemplateSelector(false)}
                        onSelectTemplate={handleSelectTemplate}
                        onSelectProgram={handleSelectProgram}
                        onCreateCustom={handleCreateCustom}
                        lang={lang}
                        t={t}
                        templates={[...personalTemplates, ...globalTemplates]}
                    />
                </Suspense>
            )}

            {/* MESO SETTINGS MODAL */}
            {showMesoSettings && (
                <Suspense fallback={null}>
                    <HomeMesoSettingsModal state={state} />
                </Suspense>
            )}

            {showCompleteModal && (
                <Suspense fallback={null}>
                    <ConfirmModal
                        isOpen
                        title={showCompleteModal === 'meso' ? t.finishCycle : t.completeWeek}
                        description={showCompleteModal === 'meso' ? t.finishMesoConfirm : t.completeWeekConfirm}
                        onConfirm={showCompleteModal === 'meso' ? handleFinishMeso : handleFinishWeek}
                        onCancel={() => setShowCompleteModal(null)}
                        confirmText={showCompleteModal === 'meso' ? t.completed : h.nextWeek}
                        cancelText={t.cancel}
                    />
                </Suspense>
            )}
            {transitionBlock && (
                <Suspense fallback={null}>
                    <ProgramBlockTransition blockNumber={transitionBlock} onClose={closeTransition} lang={lang} />
                </Suspense>
            )}
            {showKongHub && activeMeso && <Suspense fallback={null}><ProgramHub meso={activeMeso} logs={logs} lang={lang} onClose={() => setShowKongHub(false)} /></Suspense>}
        </div>
    );
};


