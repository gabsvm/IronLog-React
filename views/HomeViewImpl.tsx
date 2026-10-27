import React, { Suspense } from 'react';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';
import { HomeRecapStrip } from './home/HomeRecapStrip';
import { resolveWeightUnit } from '../utils/units';
import { useHomeViewState, type HomeViewProps } from './home/useHomeViewState';
import { HomeEmptyState } from './home/HomeEmptyState';
import { HomeTopSection } from './home/HomeTopSection';
import { HomeWeekDayList } from './home/HomeWeekDayList';
import { pickLang } from '../utils/i18n';
import { getTranslated } from '../utils';

// S6: state lives in views/home/useHomeViewState; render blocks in views/home/.
export type { HomeViewProps } from './home/useHomeViewState';

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
    const { onEditProgram, onStartFreeSession, logs, lang, tutorialProgress, markTutorialSeen, config, activeMeso, t, h, showPaywall, setShowPaywall, featureAttempted, showCompleteModal, setShowCompleteModal, showMesoSettings, setShowMesoSettings, showPlanActions, setShowPlanActions, showTemplateSelector, setShowTemplateSelector, handleOpenTemplateSelector, handleSelectTemplate, handleSelectProgram, handleCreateCustom, personalTemplates, globalTemplates, skipConfirmationId, setSkipConfirmationId, showGuidelines, setShowGuidelines, transitionBlock, showKongHub, setShowKongHub, closeTransition, currentGuidelineImages, safeProgram, safeLogs, confirmSkip, handleFinishMeso, handleFinishWeek, homeTutorialSteps, selectedDayIdx, startSession, activeSession, uniqueDaysDone, handleSkipClick } = state;

    if (!activeMeso) {
        return <HomeEmptyState state={state} />;
    }

    return (
        <div className="px-4 space-y-4 pb-28 pt-2">
            <HomeTopSection state={state} />

            {/* 3. Week day rows */}
            <HomeWeekDayList state={state} />

            {/* 4. Primary action for the selected day */}
            {safeProgram[selectedDayIdx] && (
                <div className="flex items-stretch gap-2">
                    <button
                        id="tut-up-next"
                        data-testid="home-train-action"
                        type="button"
                        onClick={() => startSession(selectedDayIdx)}
                        className="expressive-press flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-[24px] bg-primary-500 px-4 text-sm font-bold text-zinc-950 transition-colors"
                    >
                        <Icon name={activeSession && activeSession.mesoId === activeMeso.id && activeSession.dayIdx === selectedDayIdx ? 'Play' : uniqueDaysDone.has(selectedDayIdx) ? 'Repeat' : 'ArrowRight'} size={18} />
                        <span>{activeSession && activeSession.mesoId === activeMeso.id && activeSession.dayIdx === selectedDayIdx ? h.resume : uniqueDaysDone.has(selectedDayIdx) ? h.trainAgain : `${pickLang(lang, { es: 'Entrenar', en: 'Train' })} ${String(getTranslated(safeProgram[selectedDayIdx].dayName, lang))}`}</span>
                    </button>
                    {!uniqueDaysDone.has(selectedDayIdx) && !(activeSession && activeSession.mesoId === activeMeso.id && activeSession.dayIdx === selectedDayIdx) && (
                        <button
                            type="button"
                            onClick={(event) => handleSkipClick(event, selectedDayIdx)}
                            aria-label={t.skipSession}
                            title={t.skipSession}
                            className="flex min-h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[24px] card-reference text-zinc-300 transition-colors"
                        >
                            <Icon name="SkipForward" size={18} />
                        </button>
                    )}
                </div>
            )}

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
                        data-testid="home-free-session"
                        onClick={onStartFreeSession}
                        className="w-full flex min-h-[44px] items-center gap-3 card-reference rounded-[24px] p-3.5 hover:border-zinc-500 active:scale-[0.99] transition-all"
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
            {transitionBlock && (
                <Suspense fallback={null}>
                    <ProgramBlockTransition blockNumber={transitionBlock} onClose={closeTransition} lang={lang} />
                </Suspense>
            )}
            {showKongHub && activeMeso && <Suspense fallback={null}><ProgramHub meso={activeMeso} logs={logs} lang={lang} onClose={() => setShowKongHub(false)} /></Suspense>}
        </div>
    );
};


